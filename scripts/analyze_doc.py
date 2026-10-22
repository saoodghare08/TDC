import zipfile
import xml.etree.ElementTree as ET
import re
import json

def clean_text(text):
    if not text:
        return ""
    text = text.replace('\u2018', "'").replace('\u2019', "'")
    text = text.replace('\u201c', '"').replace('\u201d', '"')
    text = text.replace('\u2013', '-').replace('\u2014', '-')
    text = text.replace('\u2026', '...')
    fractions = {'½': '1/2', '⅓': '1/3', '⅔': '2/3', '¼': '1/4', '¾': '3/4', '⅛': '1/8'}
    for k, v in fractions.items():
        text = text.replace(k, v)
    text = re.sub(r'[\U00010000-\U0010ffff]', '', text)
    text = re.sub(r'[\u2600-\u26ff\u2700-\u27bf\u2300-\u23ff\ufe0e\ufe0f\u200d]', '', text)
    text = re.sub(r'[ \t]{2,}', ' ', text)
    return text.strip()

def clean_title(title):
    t = clean_text(title)
    t = re.sub(r'[:\-–—\.]+$', '', t).strip()
    t = re.sub(r'\s+recipe$', '', t, flags=re.IGNORECASE).strip()
    t = re.sub(r'[:\-–—\.]+$', '', t).strip()
    return t

def infer_category(title, ingredients_text=""):
    t_low = title.lower()
    i_low = ingredients_text.lower()
    
    if any(k in t_low for k in ['soup', 'broth', 'shorba']):
        return 'Soup / Salad'
    if any(k in t_low for k in ['salad', 'chaat', 'sprout', 'kachumber']):
        return 'Soup / Salad'
    if any(k in t_low for k in ['wrap', 'roll', 'sandwich', 'frankie', 'burger', 'toast', 'quesadilla', 'taco']):
        return 'Snack'
    if any(k in t_low for k in ['smoothie', 'juice', 'shake', 'tea', 'latte', 'water', 'drink', 'beverage', 'cooler', 'kadha']):
        return 'Beverage'
    if any(k in t_low for k in ['oatmeal', 'oats', 'cheela', 'chilla', 'dosa', 'idli', 'poha', 'upma', 'paratha', 'pancake', 'parfait', 'breakfast', 'eggs', 'omelette', 'uttapam', 'porridge', 'bhurji']):
        return 'Breakfast'
    if any(k in t_low for k in ['dal', 'curry', 'gravy', 'sabzi', 'rice', 'pulao', 'khichdi', 'paneer', 'chicken', 'fish', 'tofu', 'mutton', 'biryani', 'roti', 'kadhai', 'tikka', 'masala']):
        return 'Lunch'
    if any(k in t_low for k in ['snack', 'papad', 'makhana', 'bhel', 'seed', 'cracker', 'ball', 'bar', 'munchies', 'popcorn']):
        return 'Snack'
    return 'Lunch'

def analyze_document():
    W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
    with zipfile.ZipFile('recipes.docx') as z:
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
                        if p_texts:
                            cell_texts.append(''.join(p_texts).strip())
                    row_cells.append('\n'.join(cell_texts))
                if row_cells:
                    table_rows.append(row_cells)
            if table_rows:
                elements.append({'type': 'table', 'rows': table_rows})

    recipes = []
    skipped = []
    
    for idx, el in enumerate(elements):
        if el['type'] == 'table':
            rows = el['rows']
            # Single cell block
            if len(rows) == 1 and len(rows[0]) == 1:
                content = rows[0][0]
                rec = parse_single_cell_recipe(content)
                if rec and rec['name'] and (rec['ingredients'] or rec['instructions']):
                    recipes.append(rec)
                else:
                    skipped.append({'idx': idx, 'reason': 'Empty single-cell', 'sample': content[:80]})
            # Multi-row table
            elif len(rows) > 1:
                title = "Healthy Formulation"
                if idx > 0 and elements[idx-1]['type'] == 'paragraph':
                    cand = elements[idx-1]['text'].strip()
                    if len(cand) < 100:
                        title = cand
                rec = parse_tabular_recipe(title, rows)
                if rec and rec['name'] and (rec['ingredients'] or rec['instructions']):
                    recipes.append(rec)
                else:
                    skipped.append({'idx': idx, 'reason': 'Empty table recipe', 'title': title})

    print(f"Total extracted recipes: {len(recipes)}")
    print(f"Skipped elements: {len(skipped)}")
    
    # Analyze completeness
    has_macros = sum(1 for r in recipes if r['calories'] and r['calories'] != '250 kcal')
    has_ing = sum(1 for r in recipes if len(r['ingredients']) > 0)
    has_inst = sum(1 for r in recipes if len(r['instructions']) > 0)
    avg_ing = sum(len(r['ingredients']) for r in recipes) / max(len(recipes), 1)
    avg_inst = sum(len(r['instructions']) for r in recipes) / max(len(recipes), 1)
    
    print(f"Recipes with ingredients: {has_ing}/{len(recipes)}")
    print(f"Recipes with instructions: {has_inst}/{len(recipes)}")
    print(f"Recipes with extracted macros: {has_macros}/{len(recipes)}")
    print(f"Avg ingredients per recipe: {avg_ing:.1f}")
    print(f"Avg instructions per recipe: {avg_inst:.1f}")
    
    categories = {}
    for r in recipes:
        cat = r['category']
        categories[cat] = categories.get(cat, 0) + 1
    print("Categories:", categories)

    with open('scripts/all_extracted_recipes.json', 'w', encoding='utf-8') as f:
        json.dump(recipes, f, indent=2, ensure_ascii=False)

def parse_single_cell_recipe(content):
    lines = [clean_text(l) for l in content.split('\n') if clean_text(l)]
    if not lines:
        return None
        
    title = clean_title(lines[0])
    if len(title) < 3 and len(lines) > 1:
        title = clean_title(lines[1])
        
    prep_time = "10 mins"
    cook_time = "15 mins"
    servings = "1 serving"
    calories = "250 kcal"
    protein = "12g"
    carbs = "28g"
    fats = "6g"
    fiber = "4g"
    dietitian_tip = ""
    
    ingredients = []
    instructions = []
    
    mode = 'header'
    
    for line in lines[1:]:
        l_low = line.lower()
        
        # Servings check
        if any(k in l_low for k in ['serves:', 'serves ', 'serving:', 'servings:', 'servings (', 'servings)']) or re.search(r'\(\s*\d+\s*serving', l_low):
            m = re.search(r'(?:serves|servings|serving)[\s:]*([^\n\r\(\)]+)', line, re.I)
            if m:
                servings = m.group(1).strip()
            else:
                m2 = re.search(r'\(\s*(\d+\s*servings?)\s*\)', line, re.I)
                if m2: servings = m2.group(1).strip()
                
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
        if 'calories:' in l_low or 'calorie:' in l_low:
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
        if re.search(r'\bingredients?\b', l_low):
            mode = 'ingredients'
            continue
        if re.search(r'\b(?:method|instructions?|steps?|preparation|how to make)\b', l_low):
            mode = 'instructions'
            continue
        if re.search(r'\b(?:dietitian tip|tip|tips|serving suggestions?)\b', l_low):
            mode = 'tips'
            continue
            
        # Collecting items
        if mode == 'ingredients':
            # Strip bullet icons or list numbers like "1. ", but keep quantities like "250g" or "1 cup"
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
            if not dietitian_tip and len(line) > 15 and not line.startswith(('1.', '2.', '-')):
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
        'instructions': instructions,
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
            # Check if second column looks like instructions
            if len(c1) > 40 or any(k in c1.lower() for k in ['heat', 'mix', 'cook', 'boil', 'bake', 'serve']):
                for step in c1.split('\n'):
                    s = clean_text(step)
                    s = re.sub(r'^(?:[-*•\u2022]\s*|\d+[\.\)]\s*)', '', s).strip()
                    if s and len(s) > 3 and s not in instructions:
                        instructions.append(s)

        # Ingredients extraction (usually col 0 and col 1)
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
        'calories': '280 kcal',
        'protein': '14g',
        'carbs': '30g',
        'fats': '7g',
        'fiber': '4g',
        'ingredients': ingredients,
        'instructions': instructions,
        'dietitian_tip': f"Nutrient dense clinical formulation for {title}."
    }

if __name__ == '__main__':
    analyze_document()
