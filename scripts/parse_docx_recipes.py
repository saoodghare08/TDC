import zipfile
import xml.etree.ElementTree as ET
import re
import json

def clean_text(text):
    if not text:
        return ""
    # Replace smart quotes and dashes
    text = text.replace('\u2018', "'").replace('\u2019', "'")
    text = text.replace('\u201c', '"').replace('\u201d', '"')
    text = text.replace('\u2013', '-').replace('\u2014', '-')
    text = text.replace('\u2026', '...')
    # Replace fractions
    fractions = {'½': '1/2', '⅓': '1/3', '⅔': '2/3', '¼': '1/4', '¾': '3/4', '⅛': '1/8'}
    for k, v in fractions.items():
        text = text.replace(k, v)
    # Strip emojis and pictographs
    text = re.sub(r'[\U00010000-\U0010ffff]', '', text)
    text = re.sub(r'[\u2600-\u26ff\u2700-\u27bf\u2300-\u23ff\ufe0e\ufe0f\u200d]', '', text)
    # Clean redundant spaces
    text = re.sub(r'[ \t]{2,}', ' ', text)
    return text.strip()

def clean_title(title):
    t = clean_text(title)
    # Remove trailing colons, dashes, etc.
    t = re.sub(r'[:\-–—\.]+$', '', t).strip()
    # Remove "recipe" at end
    t = re.sub(r'\s+recipe$', '', t, flags=re.IGNORECASE).strip()
    return t

def infer_category(title, ingredients_text=""):
    t_low = title.lower()
    i_low = ingredients_text.lower()
    
    if any(k in t_low for k in ['soup', 'broth', 'shorba']):
        return 'Soup / Salad'
    if any(k in t_low for k in ['salad', 'chaat', 'sprout']):
        return 'Soup / Salad'
    if any(k in t_low for k in ['wrap', 'roll', 'sandwich', 'frankie']):
        return 'Snack'
    if any(k in t_low for k in ['smoothie', 'juice', 'shake', 'tea', 'latte', 'water', 'drink']):
        return 'Beverage'
    if any(k in t_low for k in ['oatmeal', 'oats', 'cheela', 'chilla', 'dosa', 'idli', 'poha', 'upma', 'paratha', 'pancake', 'parfait', 'breakfast', 'eggs', 'omelette']):
        return 'Breakfast'
    if any(k in t_low for k in ['dal', 'curry', 'gravy', 'sabzi', 'rice', 'pulao', 'khichdi', 'paneer', 'chicken', 'fish', 'tofu', 'mutton']):
        return 'Lunch'
    if any(k in t_low for k in ['snack', 'papad', 'makhana', 'bhel', 'seed', 'cracker', 'ball', 'bar']):
        return 'Snack'
    return 'Lunch'

def parse_docx(docx_path):
    W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
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
                        if p_texts:
                            cell_texts.append(''.join(p_texts).strip())
                    row_cells.append('\n'.join(cell_texts))
                if row_cells:
                    table_rows.append(row_cells)
            if table_rows:
                elements.append({'type': 'table', 'rows': table_rows})

    print(f"Total elements: {len(elements)}")
    
    recipes = []
    
    for idx, el in enumerate(elements):
        if el['type'] == 'table':
            rows = el['rows']
            # Case 1: Single cell with whole recipe text
            if len(rows) == 1 and len(rows[0]) == 1:
                content = rows[0][0]
                rec = parse_recipe_from_text(content)
                if rec:
                    recipes.append(rec)
            # Case 2: Multi-row table with 3 columns (INGREDIENTS | AMOUNT | METHOD)
            elif len(rows) > 1 and len(rows[0]) >= 2:
                # Find preceding paragraph as title
                title = "Healthy Recipe"
                if idx > 0 and elements[idx-1]['type'] == 'paragraph':
                    candidate = elements[idx-1]['text'].strip()
                    if len(candidate) < 90:
                        title = candidate
                rec = parse_table_recipe(title, rows)
                if rec:
                    recipes.append(rec)
        elif el['type'] == 'paragraph':
            # Check if this paragraph itself is a multi-line recipe text or starts a text recipe
            pass

    print(f"Parsed {len(recipes)} recipes successfully!")
    with open('scripts/parsed_recipes_sample.json', 'w', encoding='utf-8') as f:
        json.dump(recipes[:20], f, indent=2, ensure_ascii=False)
    
    # Check stats
    categories = {}
    for r in recipes:
        cat = r.get('category', 'Unknown')
        categories[cat] = categories.get(cat, 0) + 1
    print("Category breakdown:", categories)

def parse_recipe_from_text(content):
    lines = [clean_text(l) for l in content.split('\n') if clean_text(l)]
    if not lines:
        return None
    
    title = clean_title(lines[0])
    # Fallback if first line was an emoji or too short
    if len(title) < 3 and len(lines) > 1:
        title = clean_title(lines[1])
    
    prep_time = "10 mins"
    cook_time = "15 mins"
    servings = "1 serving"
    calories = "250 kcal"
    protein = "12g"
    carbs = "28g"
    fats = "6g"
    dietitian_tip = ""
    
    ingredients = []
    instructions = []
    
    mode = 'header' # 'header', 'ingredients', 'instructions', 'nutrition', 'tips'
    
    for line in lines[1:]:
        l_low = line.lower()
        
        # Check timings & servings
        if 'prep time' in l_low:
            m = re.search(r'prep time:\s*([^\n\r]+)', line, re.I)
            if m: prep_time = m.group(1).strip()
            continue
        if 'cook time' in l_low:
            m = re.search(r'cook time:\s*([^\n\r]+)', line, re.I)
            if m: cook_time = m.group(1).strip()
            continue
        if 'serv' in l_low and any(k in l_low for k in ['serves', 'serving', 'servings']):
            m = re.search(r'(?:serves|servings|serving):\s*([^\n\r]+)', line, re.I)
            if m: servings = m.group(1).strip()
            continue
            
        # Check nutrition lines
        if 'calories:' in l_low or 'approx nutrition' in l_low or 'nutrition (approx)' in l_low:
            mode = 'nutrition'
            m = re.search(r'calories:\s*([^\n\r]+)', line, re.I)
            if m: calories = m.group(1).strip()
            continue
        if mode == 'nutrition':
            if 'protein:' in l_low:
                m = re.search(r'protein:\s*([^\n\r]+)', line, re.I)
                if m: protein = m.group(1).strip()
                continue
            if 'carbs:' in l_low or 'carbohydrates:' in l_low:
                m = re.search(r'(?:carbs|carbohydrates):\s*([^\n\r]+)', line, re.I)
                if m: carbs = m.group(1).strip()
                continue
            if 'fat:' in l_low or 'fats:' in l_low:
                m = re.search(r'(?:fat|fats):\s*([^\n\r]+)', line, re.I)
                if m: fats = m.group(1).strip()
                continue
        
        # Section headers
        if any(h in l_low for h in ['ingredients', 'ingredients:']):
            mode = 'ingredients'
            continue
        if any(h in l_low for h in ['method', 'instructions', 'steps', 'preparation', 'to assemble', 'how to make']):
            mode = 'instructions'
            continue
        if any(h in l_low for h in ['tip', 'tips', 'serving suggestions', 'dietitian tip', 'clinical tip']):
            mode = 'tips'
            continue
            
        if mode == 'ingredients':
            clean_item = re.sub(r'^[-*•\d.)\s]+', '', line).strip()
            if clean_item and len(clean_item) > 1:
                ingredients.append(clean_item)
        elif mode == 'instructions':
            clean_step = re.sub(r'^\d+[\.\)]\s*', '', line).strip()
            if clean_step and len(clean_step) > 2:
                instructions.append(clean_step)
        elif mode == 'tips':
            dietitian_tip = (dietitian_tip + " " + line).strip()
        elif mode == 'header':
            # Subtitle or description
            if not dietitian_tip and len(line) > 15 and not line.startswith(('1.', '2.', '-')):
                dietitian_tip = line
                
    if not ingredients:
        # Fallback if no explicit ingredients header
        pass
        
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
        'ingredients': ingredients,
        'instructions': instructions,
        'dietitian_tip': dietitian_tip[:250] if dietitian_tip else f"High fiber & balanced nutrients for {title}."
    }

def parse_table_recipe(title, rows):
    title = clean_title(title)
    
    ingredients = []
    instructions = []
    
    header = [clean_text(c).upper() for c in rows[0]]
    # Check column mappings
    ing_col = 0
    amt_col = 1 if len(header) > 1 else None
    method_col = 2 if len(header) > 2 else None
    
    for r in rows[1:]:
        c0 = clean_text(r[0]) if len(r) > 0 else ""
        c1 = clean_text(r[1]) if len(r) > 1 else ""
        c2 = clean_text(r[2]) if len(r) > 2 else ""
        
        # Method in column 2 or 3
        if method_col is not None and c2:
            for step in c2.split('\n'):
                s = clean_text(step)
                s = re.sub(r'^\d+[\.\)]\s*', '', s).strip()
                if s and len(s) > 3 and s not in instructions:
                    instructions.append(s)
        elif method_col is None and c1 and any(k in header[1].lower() for k in ['method', 'step', 'instruction']):
            for step in c1.split('\n'):
                s = clean_text(step)
                s = re.sub(r'^\d+[\.\)]\s*', '', s).strip()
                if s and len(s) > 3 and s not in instructions:
                    instructions.append(s)
                    
        # Ingredients in col 0 and 1
        if c0:
            # Skip subheaders like "For marination", "Filling"
            if c0.lower().startswith(('for ', 'filling', 'seasoning')) and not c1:
                continue
            item = f"{c1} {c0}".strip() if c1 else c0
            if item and item.upper() not in ['INGREDIENTS', 'AMOUNT', 'METHOD', 'QTY']:
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
        'ingredients': ingredients,
        'instructions': instructions,
        'dietitian_tip': f"Nutrient dense formulation for {title}."
    }

if __name__ == '__main__':
    parse_docx('recipes.docx')
