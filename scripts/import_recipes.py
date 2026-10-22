#!/usr/bin/env python3
"""
TDC Recipe Importer: Imports clinical recipes from recipes.docx into Supabase.

Features:
- Robust OpenXML parser for docx tables (single-cell blocks and multi-row tables)
- Strips emojis, cleans fractions (1/2, 1/4), cleans bullets and trailing artifacts
- Normalizes categories to match admin tabs ('Breakfast', 'Lunch', 'Dinner', 'Snack', 'Beverage', 'Soup & Salad')
- Extracts real macros (calories, protein, carbs, fats, fiber) when present; leaves empty if not provided (prevents fake data and ensures clean dynamic macro pills in PDFs)
- Deduplicates recipes, keeping the highest quality/richest recipe entry
- Supports --dry-run, --execute, --upsert, --clean, and --export-json
- Direct REST API communication with Supabase using credentials from .env.local
"""

import sys
import os
import re
import json
import zipfile
import argparse
import urllib.request
import urllib.error
import xml.etree.ElementTree as ET
from collections import defaultdict

# Reconfigure console output to UTF-8
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'

# ─────────────────────────────────────────────────────────────────────────────
# TEXT CLEANING & NORMALIZATION
# ─────────────────────────────────────────────────────────────────────────────

def clean_text(text):
    if not text:
        return ""
    # Smart quotes and dashes
    text = text.replace('\u2018', "'").replace('\u2019', "'")
    text = text.replace('\u201c', '"').replace('\u201d', '"')
    text = text.replace('\u2013', '-').replace('\u2014', '-')
    text = text.replace('\u2026', '...')
    # Fractions conversion
    fractions = {
        '½': '1/2', '⅓': '1/3', '⅔': '2/3',
        '¼': '1/4', '¾': '3/4', '⅛': '1/8', '⅜': '3/8', '⅝': '5/8', '⅞': '7/8'
    }
    for k, v in fractions.items():
        text = text.replace(k, v)
    # Remove emojis and special pictographs
    text = re.sub(r'[\U00010000-\U0010ffff]', '', text)
    text = re.sub(r'[\u2600-\u26ff\u2700-\u27bf\u2300-\u23ff\ufe0e\ufe0f\u200d]', '', text)
    # Normalize whitespace
    text = re.sub(r'[ \t]{2,}', ' ', text)
    return text.strip()

def clean_title(title):
    t = clean_text(title)
    # Strip leading bullet/numbers/emojis
    t = re.sub(r'^(?:[-*•\u2022]\s*|\d+[\.\)]\s*)', '', t).strip()
    # Strip trailing punctuation and "recipe"
    t = re.sub(r'[:\-–—\.]+$', '', t).strip()
    t = re.sub(r'\s+recipe$', '', t, flags=re.IGNORECASE).strip()
    t = re.sub(r'[:\-–—\.]+$', '', t).strip()
    # Title Case if all caps
    if t.isupper() and len(t) > 4:
        t = t.title()
    return t

def infer_category(title, ingredients_text=""):
    t_low = title.lower()
    i_low = ingredients_text.lower()
    
    if any(k in t_low for k in ['soup', 'broth', 'shorba', 'salad', 'chaat', 'sprout', 'kachumber', 'kochumbur', 'raita']):
        return 'Soup & Salad'
    if any(k in t_low for k in ['wrap', 'roll', 'sandwich', 'frankie', 'burger', 'toast', 'quesadilla', 'taco', 'snack', 'papad', 'makhana', 'bhel', 'seed', 'cracker', 'ball', 'bar', 'munchies', 'popcorn', 'crisps', 'chips']):
        return 'Snack'
    if any(k in t_low for k in ['smoothie', 'juice', 'shake', 'tea', 'latte', 'water', 'drink', 'beverage', 'cooler', 'kadha']):
        return 'Beverage'
    if any(k in t_low for k in ['oatmeal', 'oats', 'cheela', 'chilla', 'dosa', 'idli', 'poha', 'upma', 'paratha', 'pancake', 'parfait', 'breakfast', 'eggs', 'omelette', 'omelet', 'uttapam', 'porridge', 'bhurji']):
        return 'Breakfast'
    if any(k in t_low for k in ['dal', 'curry', 'gravy', 'sabzi', 'rice', 'pulao', 'khichdi', 'paneer', 'chicken', 'fish', 'tofu', 'mutton', 'biryani', 'roti', 'kadhai', 'tikka', 'masala', 'korma', 'shrimp', 'prawn', 'rajma', 'chole']):
        return 'Lunch'
    return 'Lunch'

# ─────────────────────────────────────────────────────────────────────────────
# RECIPE PARSERS
# ─────────────────────────────────────────────────────────────────────────────

def parse_single_cell_recipe(content):
    raw_lines = [clean_text(l) for l in content.split('\n') if clean_text(l)]
    if not raw_lines:
        return None
        
    title = clean_title(raw_lines[0])
    if len(title) < 3 and len(raw_lines) > 1:
        title = clean_title(raw_lines[1])
        
    prep_time = "10 mins"
    cook_time = "15 mins"
    servings = "1 serving"
    calories = ""
    protein = ""
    carbs = ""
    fats = ""
    fiber = ""
    dietitian_tip = ""
    
    ingredients = []
    instructions = []
    
    mode = 'header'
    
    # Expand lines that contain inline section headers without newlines
    expanded_lines = []
    for line in raw_lines:
        sub = re.split(r'(?i)(?<=[.:;!\n)])\s*(?=(?:ingredients?|instructions?|steps?|method|calories?|dietitian tip|(?:\d+\.))[:\s\d(])', line)
        for s in sub:
            s = s.strip()
            if s:
                expanded_lines.append(s)
                
    for line in expanded_lines[1:]:
        l_low = line.lower()
        
        # Servings check
        m = re.search(r'(?:serves|servings|serving)[\s:]*([0-9]+(?:\s*-\s*[0-9]+)?(?:\s*(?:servings?|portions?|people|persons?))?)', line, re.I)
        if not m:
            m = re.search(r'\(\s*([0-9]+(?:\s*-\s*[0-9]+)?\s*servings?)\s*\)', line, re.I)
        if m:
            serv = m.group(1).strip()
            if not any(k in serv.lower() for k in ['serving', 'serves', 'portion', 'people', 'person']):
                serv = f"{serv} serving{'s' if serv != '1' else ''}"
            servings = serv
                
        # Prep / Cook times
        if 'prep time' in l_low:
            m = re.search(r'prep time[\s:]*([^\n\r]+)', line, re.I)
            if m: prep_time = m.group(1).strip()
            continue
        if 'cook time' in l_low:
            m = re.search(r'cook time[\s:]*([^\n\r]+)', line, re.I)
            if m: cook_time = m.group(1).strip()
            continue
            
        # Nutrition
        if 'calories:' in l_low or 'calorie:' in l_low or 'approx nutrition' in l_low:
            m = re.search(r'calories?[\s:]*([^\n\r]+)', line, re.I)
            if m: calories = m.group(1).strip()
            mode = 'nutrition'
            continue
        if mode == 'nutrition':
            if 'protein:' in l_low:
                m = re.search(r'protein[\s:]*([^\n\r]+)', line, re.I)
                if m: protein = m.group(1).strip()
                continue
            if 'carb' in l_low and ':' in l_low:
                m = re.search(r'(?:carbs|carbohydrates)[\s:]*([^\n\r]+)', line, re.I)
                if m: carbs = m.group(1).strip()
                continue
            if 'fat' in l_low and ':' in l_low:
                m = re.search(r'fats?[\s:]*([^\n\r]+)', line, re.I)
                if m: fats = m.group(1).strip()
                continue
            if ('fiber' in l_low or 'fibre' in l_low) and ':' in l_low:
                m = re.search(r'(?:fiber|fibre)[\s:]*([^\n\r]+)', line, re.I)
                if m: fiber = m.group(1).strip()
                continue

        # Header transitions
        if re.match(r'^(?:for the\s+)?ingredients?\b[\s:]*', l_low) and not any(k in l_low for k in ['mix ', 'combine ', 'blend ', 'add ', 'stir ', 'whisk ']):
            mode = 'ingredients'
            after = re.sub(r'^.*?ingredients?[:\s]*', '', line, flags=re.I).strip()
            if after and len(after) > 2 and not after.lower().startswith(('(', 'makes')):
                clean_item = re.sub(r'^(?:[-*•\u2022]\s*|\d+[\.\)]\s+)', '', after).strip()
                if clean_item: ingredients.append(clean_item)
            continue
        if re.match(r'^(?:method|instructions?|steps?|preparation|how to make)\b[\s:]*', l_low):
            mode = 'instructions'
            after = re.sub(r'^.*?(?:method|instructions?|steps?|preparation|how to make)[:\s]*', '', line, flags=re.I).strip()
            if after and len(after) > 3:
                clean_step = re.sub(r'^(?:[-*•\u2022]\s*|\d+[\.\)]\s*)', '', after).strip()
                if clean_step: instructions.append(clean_step)
            continue
        if re.search(r'\b(?:dietitian tip|clinical tip|tips?|serving suggestions?)\b', l_low) and len(line) < 50:
            mode = 'tips'
            after = re.sub(r'^.*?(?:dietitian tip|clinical tip|tips?|serving suggestions?)[:\s]*', '', line, flags=re.I).strip()
            if after: dietitian_tip = (dietitian_tip + " " + after).strip()
            continue

        # In ingredients mode, if line starts with an imperative instruction verb and does not look like an ingredient
        if mode == 'ingredients' and re.match(r'^(?:mix|heat|blend|combine|cook|serve|stir|bake|whisk|boil|garnish|refrigerate|pour|drain|roast|toast|marinate|chop|grind)\b', line, re.I):
            mode = 'instructions'
            clean_step = re.sub(r'^(?:[-*•\u2022]\s*|\d+[\.\)]\s*)', '', line).strip()
            if clean_step and len(clean_step) > 3:
                instructions.append(clean_step)
            continue

        # Collecting items
        if mode == 'ingredients':
            clean_item = re.sub(r'^(?:[-*•\u2022]\s*|\d+[\.\)]\s+)', '', line).strip()
            if clean_item and len(clean_item) > 1 and not clean_item.lower().startswith(('ingredients', 'approx', 'serves')):
                ingredients.append(clean_item)
        elif mode == 'instructions':
            clean_step = re.sub(r'^(?:[-*•\u2022]\s*|\d+[\.\)]\s*)', '', line).strip()
            if clean_step and len(clean_step) > 3 and not clean_step.lower().startswith(('approx', 'nutrition', 'serves')):
                instructions.append(clean_step)
        elif mode == 'tips':
            clean_tip = re.sub(r'^(?:[-*•\u2022]\s*|\d+[\.\)]\s*)', '', line).strip()
            dietitian_tip = (dietitian_tip + " " + clean_tip).strip()
        elif mode == 'header':
            is_inst = bool(re.match(r'^(?:mix|heat|blend|combine|cook|serve|stir|bake|whisk|boil|garnish|refrigerate|pour|drain|roast|toast|marinate|chop|grind)\b', line, re.I))
            has_quant = bool(re.search(r'(?:\d|\b(?:pinch|handful|half|one|two|few|slices?|cup|tbsp|tsp|gm|gms|g\b|ml)\b)', line, re.I))

            if is_inst:
                mode = 'instructions'
                clean_step = re.sub(r'^(?:[-*•\u2022]\s*|\d+[\.\)]\s*)', '', line).strip()
                if clean_step and len(clean_step) > 3:
                    instructions.append(clean_step)
            elif has_quant:
                mode = 'ingredients'
                clean_item = re.sub(r'^(?:[-*•\u2022]\s*|\d+[\.\)]\s+)', '', line).strip()
                if clean_item and len(clean_item) > 1:
                    ingredients.append(clean_item)
            elif not dietitian_tip and len(line) > 15 and not line.startswith(('1.', '2.', '-')):
                dietitian_tip = line

    return {
        'name': title,
        'category': infer_category(title, ' '.join(ingredients)),
        'prep_time': prep_time,
        'cook_time': cook_time,
        'servings': servings,
        'calories': calories,
        'protein': protein,
        'carbs': carbs,
        'fats': fats,
        'fiber': fiber,
        'ingredients': ingredients,
        'instructions': instructions if instructions else ['Prepare measured ingredients and serve fresh.'],
        'dietitian_tip': dietitian_tip[:250] if dietitian_tip else f"High fiber & balanced nutrients for {title}."
    }

def parse_tabular_recipe(title, rows):
    title = clean_title(title)
    ingredients = []
    instructions = []
    
    header = [clean_text(c).upper() for c in rows[0]]
    method_col = None
    for c_idx, col_name in enumerate(header):
        if any(k in col_name for k in ['METHOD', 'INSTRUCTION', 'STEP', 'PREPARATION']):
            method_col = c_idx
            break
            
    for r in rows[1:]:
        c0 = clean_text(r[0]) if len(r) > 0 else ""
        c1 = clean_text(r[1]) if len(r) > 1 else ""
        c2 = clean_text(r[2]) if len(r) > 2 else ""
        
        # Method extraction
        if method_col is not None and method_col < len(r):
            m_text = clean_text(r[method_col])
            if m_text:
                for step in m_text.split('\n'):
                    s = clean_text(step)
                    s = re.sub(r'^(?:[-*•\u2022]\s*|\d+[\.\)]\s*)', '', s).strip()
                    if s and len(s) > 3 and s not in instructions:
                        instructions.append(s)
        elif method_col is None and len(r) >= 2:
            if len(c1) > 40 or any(k in c1.lower() for k in ['heat', 'mix', 'cook', 'boil', 'bake', 'serve']):
                for step in c1.split('\n'):
                    s = clean_text(step)
                    s = re.sub(r'^(?:[-*•\u2022]\s*|\d+[\.\)]\s*)', '', s).strip()
                    if s and len(s) > 3 and s not in instructions:
                        instructions.append(s)

        # Ingredients extraction
        if c0:
            if c0.lower().startswith(('for ', 'filling', 'seasoning', 'topping', 'garnish')) and not c1:
                continue
            if method_col is not None and method_col == 1:
                item = c0
            else:
                item = f"{c1} {c0}".strip() if c1 else c0
            if item and item.upper() not in ['INGREDIENTS', 'AMOUNT', 'METHOD', 'QTY', 'QUANTITY']:
                ingredients.append(item)

    return {
        'name': title,
        'category': infer_category(title, ' '.join(ingredients)),
        'prep_time': '10 mins',
        'cook_time': '15 mins',
        'servings': '1 serving',
        'calories': '',
        'protein': '',
        'carbs': '',
        'fats': '',
        'fiber': '',
        'ingredients': ingredients,
        'instructions': instructions if instructions else ['Prepare ingredients as measured and cook as directed.'],
        'dietitian_tip': f"Nutrient dense clinical formulation for {title}."
    }

# ─────────────────────────────────────────────────────────────────────────────
# EXTRACTION & DEDUPLICATION PIPELINE
# ─────────────────────────────────────────────────────────────────────────────

def extract_all_recipes_from_docx(docx_path):
    if not os.path.exists(docx_path):
        raise FileNotFoundError(f"File not found: {docx_path}")

    with zipfile.ZipFile(docx_path) as z:
        xml_content = z.read('word/document.xml')
    root = ET.fromstring(xml_content)
    body = root.find(f'{{{W_NS}}}body')

    elements = []
    for child in body:
        tag = child.tag.replace(f'{{{W_NS}}}', '')
        if tag == 'p':
            texts = [t.text for t in child.iter(f'{{{W_NS}}}t') if t.text]
            text = ''.join(texts).strip()
            if text:
                elements.append({'type': 'paragraph', 'text': text})
        elif tag == 'tbl':
            table_rows = []
            for tr in child.iter(f'{{{W_NS}}}tr'):
                row_cells = []
                for tc in tr.iter(f'{{{W_NS}}}tc'):
                    cell_texts = []
                    for p in tc.iter(f'{{{W_NS}}}p'):
                        p_texts = [t.text for t in p.iter(f'{{{W_NS}}}t') if t.text]
                        if p_texts: cell_texts.append(''.join(p_texts).strip())
                    row_cells.append('\n'.join(cell_texts))
                if row_cells: table_rows.append(row_cells)
            if table_rows:
                elements.append({'type': 'table', 'rows': table_rows})

    raw_recipes = []
    for idx, el in enumerate(elements):
        if el['type'] == 'table':
            rows = el['rows']
            if len(rows) == 1 and len(rows[0]) == 1:
                rec = parse_single_cell_recipe(rows[0][0])
                if rec and rec['name'] and rec['ingredients'] and len(rec['ingredients']) > 0:
                    raw_recipes.append(rec)
            elif len(rows) > 1:
                title = "Healthy Formulation"
                if idx > 0 and elements[idx-1]['type'] == 'paragraph':
                    cand = elements[idx-1]['text'].strip()
                    if len(cand) < 100:
                        title = cand
                if len(rows[0]) > 0 and 'Ingredients' in rows[0][0] and ('Instructions' in rows[0][0] or 'Steps' in rows[0][0]):
                    rec = parse_single_cell_recipe(rows[0][0])
                else:
                    rec = parse_tabular_recipe(title, rows)

                if rec and rec['name'] and rec['ingredients'] and len(rec['ingredients']) > 0:
                    raw_recipes.append(rec)

    return raw_recipes

def score_recipe_quality(recipe):
    """Calculates a quality score to select the best entry among duplicates."""
    score = 0
    score += len(recipe.get('ingredients', [])) * 3
    score += len(recipe.get('instructions', [])) * 2
    if recipe.get('calories'): score += 5
    if recipe.get('protein'): score += 2
    if recipe.get('carbs'): score += 2
    if recipe.get('fats'): score += 2
    if recipe.get('fiber'): score += 2
    if len(recipe.get('dietitian_tip', '')) > 20: score += 2
    return score

def deduplicate_recipes(recipes):
    """Groups recipes by lowercase name and selects the highest scoring version."""
    grouped = defaultdict(list)
    for r in recipes:
        norm_name = re.sub(r'[^a-z0-9]', '', r['name'].lower())
        grouped[norm_name].append(r)

    deduped = []
    dropped_count = 0
    duplicate_info = []

    for key, group in grouped.items():
        if len(group) == 1:
            deduped.append(group[0])
        else:
            # Sort by quality score descending
            sorted_group = sorted(group, key=score_recipe_quality, reverse=True)
            chosen = sorted_group[0]
            deduped.append(chosen)
            dropped = sorted_group[1:]
            dropped_count += len(dropped)
            duplicate_info.append({
                'name': chosen['name'],
                'copies': len(group),
                'chosen_score': score_recipe_quality(chosen),
                'chosen_ings': len(chosen['ingredients']),
                'chosen_insts': len(chosen['instructions'])
            })

    return deduped, duplicate_info

# ─────────────────────────────────────────────────────────────────────────────
# SUPABASE DATABASE OPERATIONS
# ─────────────────────────────────────────────────────────────────────────────

def get_supabase_client():
    env = {}
    env_path = '.env.local'
    if not os.path.exists(env_path):
        env_path = '.env'
    if not os.path.exists(env_path):
        raise FileNotFoundError("Could not find .env.local or .env file with Supabase credentials")

    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            k, v = line.split('=', 1)
            env[k.strip()] = v.strip().strip('"\'')

    base_url = env.get('NEXT_PUBLIC_SUPABASE_URL')
    key = env.get('SUPABASE_SERVICE_ROLE_KEY') or env.get('NEXT_PUBLIC_SUPABASE_ANON_KEY')

    if not base_url or not key:
        raise ValueError("Missing NEXT_PUBLIC_SUPABASE_URL or Supabase API key in environment file.")

    return base_url.rstrip('/'), key

def fetch_existing_recipes_from_db(base_url, key):
    url = f"{base_url}/rest/v1/recipes?select=id,name,category"
    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json'
    }
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def batch_insert_recipes(base_url, key, recipes_batch, upsert=False):
    url = f"{base_url}/rest/v1/recipes"
    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=minimal' if upsert else 'return=minimal'
    }
    data_bytes = json.dumps(recipes_batch, ensure_ascii=False).encode('utf-8')
    req = urllib.request.Request(url, data=data_bytes, headers=headers, method='POST')
    with urllib.request.urlopen(req) as resp:
        return resp.status

def clean_database_recipes(base_url, key):
    url = f"{base_url}/rest/v1/recipes?id=neq.00000000-0000-0000-0000-000000000000"
    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json'
    }
    req = urllib.request.Request(url, headers=headers, method='DELETE')
    with urllib.request.urlopen(req) as resp:
        return resp.status

# ─────────────────────────────────────────────────────────────────────────────
# CLI RUNNER
# ─────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Import recipes from recipes.docx into Supabase")
    parser.add_argument('--file', default='recipes.docx', help="Path to recipes.docx file (default: recipes.docx)")
    parser.add_argument('--execute', action='store_true', help="Perform actual database import (without this, defaults to dry-run)")
    parser.add_argument('--dry-run', action='store_true', help="Force dry-run simulation mode")
    parser.add_argument('--no-dedupe', action='store_true', help="Do not deduplicate recipes within docx (import all occurrences)")
    parser.add_argument('--upsert', action='store_true', help="Update existing recipes in DB if names match")
    parser.add_argument('--clean', action='store_true', help="Delete all existing recipes in DB before importing")
    parser.add_argument('--export-json', type=str, default='scripts/all_extracted_recipes.json', help="Path to save parsed JSON (default: scripts/all_extracted_recipes.json)")
    parser.add_argument('--batch-size', type=int, default=50, help="Insert batch size (default: 50)")

    args = parser.parse_args()

    print("═════════════════════════════════════════════════════════════════════════")
    print("                  TDC CLINICAL RECIPE IMPORT PIPELINE                    ")
    print("═════════════════════════════════════════════════════════════════════════")
    print(f"📄 Source File: {args.file}")

    # 1. Parse document
    print("\n🔍 Extracting recipes from Word document...")
    raw_recipes = extract_all_recipes_from_docx(args.file)
    print(f"✅ Total raw table recipes extracted: {len(raw_recipes)}")

    # 2. Deduplicate
    if not args.no_dedupe:
        recipes, dupes = deduplicate_recipes(raw_recipes)
        print(f"🔄 Deduplication: Merged {len(dupes)} duplicate groups -> {len(recipes)} unique recipes remaining.")
        if dupes:
            print("\n📋 Sample Duplicate Resolutions:")
            for d in dupes[:5]:
                print(f"   • \"{d['name']}\": {d['copies']} copies found. Chosen copy has {d['chosen_ings']} ingredients, {d['chosen_insts']} instructions.")
    else:
        recipes = raw_recipes

    # 3. Category Breakdown
    cat_counts = defaultdict(int)
    for r in recipes:
        cat_counts[r['category']] += 1

    print("\n📊 Category Distribution:")
    for cat in ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Beverage', 'Soup & Salad']:
        count = cat_counts.get(cat, 0)
        print(f"   • {cat:<15}: {count:>3} recipes")

    # 4. Nutritional profile summary
    has_calories = sum(1 for r in recipes if r['calories'])
    has_protein = sum(1 for r in recipes if r['protein'])
    has_fiber = sum(1 for r in recipes if r['fiber'])
    print(f"\n🥗 Nutritional Profile:")
    print(f"   • Explicit Calories Extracted: {has_calories}/{len(recipes)}")
    print(f"   • Explicit Protein Extracted : {has_protein}/{len(recipes)}")
    print(f"   • Explicit Fiber Extracted   : {has_fiber}/{len(recipes)}")
    print(f"   • Unspecified macros left empty to preserve dynamic PDF macro pill rendering.")

    # 5. Export JSON
    if args.export_json:
        with open(args.export_json, 'w', encoding='utf-8') as f:
            json.dump(recipes, f, indent=2, ensure_ascii=False)
        print(f"\n💾 Saved structured JSON to: {args.export_json}")

    # 6. Database Check
    base_url, key = get_supabase_client()
    existing_db_recipes = fetch_existing_recipes_from_db(base_url, key)
    print(f"\n🗄️ Database Status: {len(existing_db_recipes)} recipes currently in Supabase.")

    # Check for duplicates against existing DB
    existing_names = {re.sub(r'[^a-z0-9]', '', r['name'].lower()): r for r in existing_db_recipes}
    overlap_count = sum(1 for r in recipes if re.sub(r'[^a-z0-9]', '', r['name'].lower()) in existing_names)
    if overlap_count > 0:
        print(f"⚠️ Overlap Warning: {overlap_count} recipes from docx already exist by name in DB.")

    # Prepare final payloads
    insert_payloads = []
    skipped_existing = 0

    for r in recipes:
        norm = re.sub(r'[^a-z0-9]', '', r['name'].lower())
        if norm in existing_names and not args.upsert and not args.clean:
            skipped_existing += 1
            continue

        payload = {
            'name': r['name'],
            'category': r['category'],
            'prep_time': r.get('prep_time') or '10 mins',
            'cook_time': r.get('cook_time') or '15 mins',
            'servings': r.get('servings') or '1 serving',
            'calories': r.get('calories') or '',
            'protein': r.get('protein') or '',
            'carbs': r.get('carbs') or '',
            'fats': r.get('fats') or '',
            'fiber': r.get('fiber') or '',
            'ingredients': r.get('ingredients') or [],
            'instructions': r.get('instructions') or ['Prepare ingredients and serve fresh.'],
            'dietitian_tip': r.get('dietitian_tip') or '',
            'is_preset': True
        }
        insert_payloads.append(payload)

    print(f"\n🚀 Ready for import: {len(insert_payloads)} recipes queued ({skipped_existing} skipped as already existing in DB).")

    # If DRY RUN
    if not args.execute or args.dry_run:
        print("\n" + "─"*70)
        print("💡 DRY-RUN SIMULATION COMPLETE (No changes were made to the database)")
        print("   To execute the actual database import, run:")
        print("   python scripts/import_recipes.py --execute")
        print("   Optional flags:")
        print("     --upsert : Overwrite existing recipes if matched by name")
        print("     --clean  : Wipe all existing DB recipes before importing")
        print("─"*70)
        return

    # EXECUTE IMPORT
    print("\n⚡ Executing Database Import...")

    if args.clean:
        print("⚠️ Cleaning existing recipes table...")
        clean_database_recipes(base_url, key)
        print("✅ Cleaned existing recipes.")

    total = len(insert_payloads)
    batch_size = args.batch_size
    inserted = 0

    for i in range(0, total, batch_size):
        batch = insert_payloads[i:i + batch_size]
        status = batch_insert_recipes(base_url, key, batch, upsert=args.upsert)
        inserted += len(batch)
        sys.stdout.write(f"\r⏳ Progress: [{inserted}/{total}] recipes inserted... ")
        sys.stdout.flush()

    print("\n\n🎉 IMPORT COMPLETED SUCCESSFULLY!")
    final_recipes = fetch_existing_recipes_from_db(base_url, key)
    print(f"📊 Total recipes now active in Supabase Recipe Bank: {len(final_recipes)}")

if __name__ == '__main__':
    main()
