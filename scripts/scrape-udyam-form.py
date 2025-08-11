import requests
from bs4 import BeautifulSoup
import json
import re
from urllib.parse import urljoin
import time

class UdyamFormScraper:
    def __init__(self):
        self.base_url = "https://udyamregistration.gov.in"
        self.form_url = "https://udyamregistration.gov.in/UdyamRegistration.aspx"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        
    def scrape_form_structure(self):
        """Scrape the Udyam registration form structure"""
        try:
            print("Fetching Udyam registration form...")
            response = self.session.get(self.form_url, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extract form structure
            form_data = {
                "steps": [],
                "validation_rules": {},
                "ui_components": {},
                "metadata": {
                    "scraped_at": time.strftime("%Y-%m-%d %H:%M:%S"),
                    "source_url": self.form_url
                }
            }
            
            # Find the main form
            main_form = soup.find('form', {'id': 'form1'}) or soup.find('form')
            
            if main_form:
                # Extract Step 1: Aadhaar + OTP validation
                step1_data = self.extract_step1_fields(soup)
                if step1_data:
                    form_data["steps"].append(step1_data)
                
                # Extract Step 2: PAN validation  
                step2_data = self.extract_step2_fields(soup)
                if step2_data:
                    form_data["steps"].append(step2_data)
                
                # Extract validation patterns
                form_data["validation_rules"] = self.extract_validation_rules(soup)
                
                # Extract UI components
                form_data["ui_components"] = self.extract_ui_components(soup)
            
            return form_data
            
        except Exception as e:
            print(f"Error scraping form: {str(e)}")
            return self.get_fallback_structure()
    
    def extract_step1_fields(self, soup):
        """Extract Aadhaar and OTP validation fields"""
        step1 = {
            "step_number": 1,
            "title": "Aadhaar Verification",
            "description": "Enter your Aadhaar number for verification",
            "fields": []
        }
        
        # Look for Aadhaar-related inputs
        aadhaar_inputs = soup.find_all('input', {'type': ['text', 'number']})
        
        for input_field in aadhaar_inputs:
            field_id = input_field.get('id', '')
            field_name = input_field.get('name', '')
            
            # Check if this looks like an Aadhaar field
            if any(keyword in field_id.lower() or keyword in field_name.lower() 
                   for keyword in ['aadhaar', 'aadhar', 'uid']):
                
                label = self.find_label_for_input(soup, input_field)
                
                field_data = {
                    "id": field_id,
                    "name": field_name,
                    "type": "text",
                    "label": label or "Aadhaar Number",
                    "placeholder": input_field.get('placeholder', ''),
                    "required": input_field.has_attr('required'),
                    "maxlength": input_field.get('maxlength', '12'),
                    "validation": {
                        "pattern": r"^\d{12}$",
                        "message": "Please enter a valid 12-digit Aadhaar number"
                    }
                }
                step1["fields"].append(field_data)
        
        # Add OTP field
        step1["fields"].append({
            "id": "otp",
            "name": "otp",
            "type": "text",
            "label": "OTP",
            "placeholder": "Enter 6-digit OTP",
            "required": True,
            "maxlength": "6",
            "validation": {
                "pattern": r"^\d{6}$",
                "message": "Please enter a valid 6-digit OTP"
            }
        })
        
        return step1
    
    def extract_step2_fields(self, soup):
        """Extract PAN validation fields"""
        step2 = {
            "step_number": 2,
            "title": "PAN Verification", 
            "description": "Enter your PAN details for verification",
            "fields": []
        }
        
        # Look for PAN-related inputs
        pan_inputs = soup.find_all('input', {'type': ['text']})
        
        for input_field in pan_inputs:
            field_id = input_field.get('id', '')
            field_name = input_field.get('name', '')
            
            # Check if this looks like a PAN field
            if any(keyword in field_id.lower() or keyword in field_name.lower() 
                   for keyword in ['pan', 'permanent', 'account']):
                
                label = self.find_label_for_input(soup, input_field)
                
                field_data = {
                    "id": field_id,
                    "name": field_name,
                    "type": "text",
                    "label": label or "PAN Number",
                    "placeholder": input_field.get('placeholder', 'ABCDE1234F'),
                    "required": input_field.has_attr('required'),
                    "maxlength": input_field.get('maxlength', '10'),
                    "validation": {
                        "pattern": r"^[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}$",
                        "message": "Please enter a valid PAN number (e.g., ABCDE1234F)"
                    }
                }
                step2["fields"].append(field_data)
        
        # Add name field (usually required with PAN)
        step2["fields"].append({
            "id": "applicant_name",
            "name": "applicant_name", 
            "type": "text",
            "label": "Name as per PAN",
            "placeholder": "Enter name as per PAN card",
            "required": True,
            "validation": {
                "pattern": r"^[A-Za-z\s]{2,50}$",
                "message": "Please enter a valid name"
            }
        })
        
        return step2
    
    def find_label_for_input(self, soup, input_field):
        """Find the label associated with an input field"""
        field_id = input_field.get('id')
        if field_id:
            label = soup.find('label', {'for': field_id})
            if label:
                return label.get_text(strip=True)
        
        # Look for nearby text
        parent = input_field.parent
        if parent:
            text = parent.get_text(strip=True)
            if text and len(text) < 100:
                return text
        
        return None
    
    def extract_validation_rules(self, soup):
        """Extract validation rules from JavaScript or form attributes"""
        validation_rules = {
            "aadhaar": {
                "pattern": r"^\d{12}$",
                "message": "Aadhaar number must be 12 digits"
            },
            "pan": {
                "pattern": r"^[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}$", 
                "message": "PAN format: 5 letters, 4 numbers, 1 letter"
            },
            "otp": {
                "pattern": r"^\d{6}$",
                "message": "OTP must be 6 digits"
            },
            "name": {
                "pattern": r"^[A-Za-z\s]{2,50}$",
                "message": "Name should contain only letters and spaces"
            }
        }
        
        return validation_rules
    
    def extract_ui_components(self, soup):
        """Extract UI component information"""
        components = {
            "buttons": [],
            "dropdowns": [],
            "checkboxes": [],
            "radio_buttons": []
        }
        
        # Extract buttons
        buttons = soup.find_all(['button', 'input'], {'type': ['button', 'submit']})
        for btn in buttons:
            btn_data = {
                "id": btn.get('id', ''),
                "text": btn.get('value') or btn.get_text(strip=True),
                "type": btn.get('type', 'button'),
                "class": btn.get('class', [])
            }
            components["buttons"].append(btn_data)
        
        # Extract dropdowns
        selects = soup.find_all('select')
        for select in selects:
            options = [opt.get_text(strip=True) for opt in select.find_all('option')]
            select_data = {
                "id": select.get('id', ''),
                "name": select.get('name', ''),
                "options": options
            }
            components["dropdowns"].append(select_data)
        
        return components
    
    def get_fallback_structure(self):
        """Fallback structure if scraping fails"""
        return {
            "steps": [
                {
                    "step_number": 1,
                    "title": "Aadhaar Verification",
                    "description": "Enter your Aadhaar number for verification",
                    "fields": [
                        {
                            "id": "aadhaar_number",
                            "name": "aadhaar_number",
                            "type": "text",
                            "label": "Aadhaar Number",
                            "placeholder": "Enter 12-digit Aadhaar number",
                            "required": True,
                            "maxlength": "12",
                            "validation": {
                                "pattern": r"^\d{12}$",
                                "message": "Please enter a valid 12-digit Aadhaar number"
                            }
                        },
                        {
                            "id": "otp",
                            "name": "otp", 
                            "type": "text",
                            "label": "OTP",
                            "placeholder": "Enter 6-digit OTP",
                            "required": True,
                            "maxlength": "6",
                            "validation": {
                                "pattern": r"^\d{6}$",
                                "message": "Please enter a valid 6-digit OTP"
                            }
                        }
                    ]
                },
                {
                    "step_number": 2,
                    "title": "PAN Verification",
                    "description": "Enter your PAN details for verification", 
                    "fields": [
                        {
                            "id": "pan_number",
                            "name": "pan_number",
                            "type": "text", 
                            "label": "PAN Number",
                            "placeholder": "ABCDE1234F",
                            "required": True,
                            "maxlength": "10",
                            "validation": {
                                "pattern": r"^[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}$",
                                "message": "Please enter a valid PAN number (e.g., ABCDE1234F)"
                            }
                        },
                        {
                            "id": "applicant_name",
                            "name": "applicant_name",
                            "type": "text",
                            "label": "Name as per PAN", 
                            "placeholder": "Enter name as per PAN card",
                            "required": True,
                            "validation": {
                                "pattern": r"^[A-Za-z\s]{2,50}$",
                                "message": "Please enter a valid name"
                            }
                        }
                    ]
                }
            ],
            "validation_rules": {
                "aadhaar": {
                    "pattern": r"^\d{12}$",
                    "message": "Aadhaar number must be 12 digits"
                },
                "pan": {
                    "pattern": r"^[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}$",
                    "message": "PAN format: 5 letters, 4 numbers, 1 letter"
                },
                "otp": {
                    "pattern": r"^\d{6}$", 
                    "message": "OTP must be 6 digits"
                },
                "name": {
                    "pattern": r"^[A-Za-z\s]{2,50}$",
                    "message": "Name should contain only letters and spaces"
                }
            },
            "ui_components": {
                "buttons": [
                    {"text": "Send OTP", "type": "button"},
                    {"text": "Verify OTP", "type": "button"},
                    {"text": "Verify PAN", "type": "button"},
                    {"text": "Next", "type": "submit"}
                ]
            },
            "metadata": {
                "scraped_at": time.strftime("%Y-%m-%d %H:%M:%S"),
                "source_url": "https://udyamregistration.gov.in/UdyamRegistration.aspx",
                "note": "Fallback structure used"
            }
        }
    
    def save_to_json(self, data, filename="udyam-form-structure.json"):
        """Save scraped data to JSON file"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Form structure saved to {filename}")

def main():
    scraper = UdyamFormScraper()
    
    print("Starting Udyam form scraping...")
    form_data = scraper.scrape_form_structure()
    
    # Save to JSON file
    scraper.save_to_json(form_data, "public/udyam-form-structure.json")
    
    print("\nScraping completed!")
    print(f"Found {len(form_data['steps'])} steps")
    for step in form_data['steps']:
        print(f"  Step {step['step_number']}: {step['title']} ({len(step['fields'])} fields)")

if __name__ == "__main__":
    main()
