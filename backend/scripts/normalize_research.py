import json
import re
import os

def normalize_research_data():
    input_path = os.path.join(os.path.dirname(__file__), '../data/research_laboratory.json')
    output_path = os.path.join(os.path.dirname(__file__), '../data/research_clean.json')

    # Ensure absolute paths
    input_path = os.path.abspath(input_path)
    output_path = os.path.abspath(output_path)

    print(f"Loading data from: {input_path}")
    
    if not os.path.exists(input_path):
        print(f"Error: Input file not found at {input_path}")
        return

    try:
        with open(input_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error reading JSON file: {e}")
        return

    processed_count = 0
    cleaned_data = []

    # Regex pattern to capture Name and Quantity
    # Captures any text until 'x ' or 'x' followed by digits
    # (.+?) matches the name lazily
    # \s*x\s* matches the separator with optional whitespace
    # (\d+) matches the quantity
    pattern = re.compile(r'(.+?)\s*x\s*(\d+)')

    for project in data:
        raw_materials = project.get('required Materials', '')
        
        # Handle empty or non-string fields
        if not raw_materials or not isinstance(raw_materials, str):
            project['required_materials_normalized'] = []
        else:
            matches = pattern.findall(raw_materials)
            normalized_materials = []
            for name, qty in matches:
                normalized_materials.append({
                    'name': name.strip(),
                    'qty': int(qty)
                })
            project['required_materials_normalized'] = normalized_materials
        
        # Add to cleaned data list (preserving other fields)
        cleaned_data.append(project)
        processed_count += 1

    # Write cleaned data to new file
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(cleaned_data, f, indent=4)
        print(f"Success! Processed {processed_count} projects.")
        print(f"Cleaned data saved to: {output_path}")
    except Exception as e:
        print(f"Error writing to output file: {e}")

if __name__ == "__main__":
    normalize_research_data()
