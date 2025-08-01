import json
import re
import os
from datetime import datetime

def update_glossary(log_file_path, glossary_file_path):
    """
    Reads the worker log, extracts LLM API errors, and updates the glossary.
    """
    llm_error_pattern = re.compile(
        r"ERROR.*Gemini API request failed with status (\d+): (\{.*?\})\n"
    )
    
    new_errors_found = False

    try:
        with open(log_file_path, 'r', encoding='utf-8') as f:
            log_content = f.read()
    except FileNotFoundError:
        print(f"Error: Log file not found at {log_file_path}")
        return
    except Exception as e:
        print(f"Error reading log file: {e}")
        return

    glossary_data = {"llm_errors": []}
    if os.path.exists(glossary_file_path):
        try:
            with open(glossary_file_path, 'r', encoding='utf-8') as f:
                glossary_data = json.load(f)
        except json.JSONDecodeError:
            print(f"Warning: Could not decode JSON from {glossary_file_path}. Starting with empty glossary.")
            glossary_data = {"llm_errors": []}
        except Exception as e:
            print(f"Error reading glossary file: {e}")
            return

    for match in llm_error_pattern.finditer(log_content):
        http_status_code = int(match.group(1))
        error_json_str = match.group(2)
        
        try:
            error_details = json.loads(error_json_str)
            error_code = error_details.get("error", {}).get("status")
            error_message = error_details.get("error", {}).get("message")
            error_reason = error_details.get("error", {}).get("details", [{}])[0].get("reason")

            if not error_code:
                continue # Skip if no error code found

            # Check if error already exists in glossary
            found = False
            for entry in glossary_data["llm_errors"]:
                if entry.get("code") == error_code and entry.get("http_status_code") == http_status_code:
                    entry["last_seen"] = datetime.now().isoformat() + "Z"
                    found = True
                    break
            
            if not found:
                new_errors_found = True
                new_entry = {
                    "code": error_code,
                    "http_status_code": http_status_code,
                    "provider": "gemini", # Assuming Gemini for now based on logs
                    "reason": error_message,
                    "exact_message": error_message, # Added exact_message
                    "why": f"This error indicates: {error_message}. The specific reason from the API was '{error_reason}'.",
                    "how": "Consult the Gemini API documentation for this specific error code. Common solutions include checking API key validity, quota limits, or request parameters.",
                    "last_seen": datetime.now().isoformat() + "Z"
                }
                glossary_data["llm_errors"].append(new_entry)
                print(f"Added new error to glossary: {error_code} (HTTP {http_status_code})")

        except json.JSONDecodeError:
            print(f"Warning: Could not decode JSON from log entry: {error_json_str}")
        except Exception as e:
            print(f"Error processing log entry: {e}")

    if new_errors_found:
        try:
            with open(glossary_file_path, 'w', encoding='utf-8') as f:
                json.dump(glossary_data, f, indent=2, ensure_ascii=False)
            print(f"Glossary updated successfully at {glossary_file_path}")
        except Exception as e:
            print(f"Error writing glossary file: {e}")
    else:
        print("No new LLM errors found or glossary already up to date.")

if __name__ == "__main__":
    log_path = "Z:/AgenticForge/worker.log"
    glossary_path = "Z:/AgenticForge/llm_error_glossary.json"
    update_glossary(log_path, glossary_path)