import zipfile
import xml.etree.ElementTree as ET
import json

def inspect_docx(docx_path):
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
            # Extract table rows and cells
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
    
    print(f"Total elements extracted: {len(elements)}")
    
    # Save first 150 elements to a debug file for analysis
    with open('scripts/docx_elements_sample.json', 'w', encoding='utf-8') as f:
        json.dump(elements[:150], f, indent=2, ensure_ascii=False)
    
    # Analyze patterns in document
    recipe_candidates = []
    for idx, el in enumerate(elements):
        if el['type'] == 'paragraph':
            txt = el['text']
            # Look for titles or headings
            if len(txt) < 80 and not txt.lower().startswith(('ingredients', 'method', 'step', 'servings', 'note', '1.', '2.', '3.', '4.', '5.')):
                # Check if next few elements have ingredients or steps
                next_texts = ' '.join([e.get('text', '') for e in elements[idx+1:idx+6] if e['type'] == 'paragraph']).lower()
                next_tables = any(e['type'] == 'table' for e in elements[idx+1:idx+4])
                if 'ingredient' in next_texts or 'step' in next_texts or next_tables or 'method' in next_texts:
                    recipe_candidates.append({'index': idx, 'title': txt, 'has_table_next': next_tables})
        elif el['type'] == 'table':
            # Check table header
            first_row = el['rows'][0] if el['rows'] else []
            header_str = ' | '.join(first_row).lower()
            # print table type
    
    print(f"Total potential recipe title candidates found: {len(recipe_candidates)}")
    with open('scripts/recipe_candidates_sample.json', 'w', encoding='utf-8') as f:
        json.dump(recipe_candidates[:40], f, indent=2, ensure_ascii=False)

if __name__ == '__main__':
    inspect_docx('recipes.docx')
