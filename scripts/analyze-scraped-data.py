import json
import re

def analyze_scraped_data():
    """Analyze the scraped data and generate insights"""
    
    try:
        with open("public/udyam-scraped-data.json", "r", encoding="utf-8") as f:
            data = json.load(f)
    except FileNotFoundError:
        print("Scraped data file not found. Please run scrape-udyam-detailed.py first.")
        return
    
    print("=== UDYAM FORM ANALYSIS ===\n")
    
    for step_name, step_data in data.items():
        print(f"--- {step_name.upper()} ---")
        print(f"Title: {step_data['title']}")
        print(f"Total Fields: {len(step_data['fields'])}")
        print(f"UI Components: {len(step_data['ui_components'])}")
        print(f"Validation Rules: {len(step_data['validation_rules'])}")
        
        print("\nField Details:")
        for field in step_data['fields']:
            print(f"  - {field['label']} ({field['type']})")
            if field['required']:
                print(f"    Required: Yes")
            if field['pattern']:
                print(f"    Pattern: {field['pattern']}")
            if field['maxlength']:
                print(f"    Max Length: {field['maxlength']}")
        
        print("\nValidation Rules:")
        for rule_name, rule_data in step_data['validation_rules'].items():
            print(f"  - {rule_name}: {rule_data['format']}")
            print(f"    Pattern: {rule_data['pattern']}")
        
        print("\nUI Components:")
        for component in step_data['ui_components']:
            print(f"  - {component['type']}: {component.get('text', component.get('id', 'N/A'))}")
        
        print("\n" + "="*50 + "\n")

if __name__ == "__main__":
    analyze_scraped_data()
