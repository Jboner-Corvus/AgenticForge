import json
import re
import os
from datetime import datetime
from typing import Dict, List, Tuple, Optional

# Define patterns for different LLM providers
LLM_PATTERNS = {
    "gemini": [
        r"ERROR.*Gemini API request failed with status (\d+): (\{[^}]+\})",
        r"ERROR.*Gemini API error.*?status (\d+).*?(\{[^}]+\})",
    ],
    "openai": [
        r"ERROR.*OpenAI API.*?(\d+).*?(Rate limit exceeded.*?balance)",
        r"ERROR.*OpenAI API error.*?(\d+).*?(quota exceeded)",
        r"ERROR.*OpenAI API.*?(\d+).*?(rate limit)",
    ],
    "anthropic": [
        r"ERROR.*Anthropic API.*?(\d+).*?(rate limit)",
        r"ERROR.*Anthropic API.*?(\d+).*?(quota)",
    ],
    "mistral": [
        r"ERROR.*Mistral API.*?(\d+).*?(rate limit)",
        r"ERROR.*Mistral API.*?(\d+).*?(quota)",
    ],
    "qwen": [
        r"ERROR.*Qwen API request failed with status (\d+): ([^{]*(?:\{[^}]+\})?)",
        r"ERROR.*Qwen API.*?(\d+).*?(timeout)",
    ]
}

# Common error identification patterns
RATE_LIMIT_PATTERNS = [
    r"rate.*limit",
    r"quota.*exceeded",
    r"too.*many.*request",
    r"daily.*limit",
    r"request.*limit",
    r"token.*limit"
]

def identify_provider_from_error(error_message: str) -> str:
    """Identify the LLM provider from the error message."""
    error_lower = error_message.lower()
    
    if "gemini" in error_lower:
        return "gemini"
    elif "openai" in error_lower or "gpt" in error_lower:
        return "openai"
    elif "anthropic" in error_lower or "claude" in error_lower:
        return "anthropic"
    elif "mistral" in error_lower:
        return "mistral"
    elif "qwen" in error_lower:
        return "qwen"
    else:
        return "unknown"

def is_rate_limit_error(error_message: str, http_status_code: int) -> bool:
    """Check if the error is a rate limit error."""
    if http_status_code in [429, 402]:  # 429 = rate limit, 402 = payment required (often quota)
        return True
    
    error_lower = error_message.lower()
    for pattern in RATE_LIMIT_PATTERNS:
        if re.search(pattern, error_lower):
            return True
    
    return False

def extract_error_details(error_json_str: str) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """Extract error details from JSON string."""
    try:
        error_details = json.loads(error_json_str)
        error_code = error_details.get("error", {}).get("status")
        error_message = error_details.get("error", {}).get("message")
        error_reason = error_details.get("error", {}).get("details", [{}])[0].get("reason")
        return error_code, error_message, error_reason
    except json.JSONDecodeError:
        # If it's not valid JSON, treat the whole string as the message
        return None, error_json_str, None

def create_error_entry(
    provider: str, 
    http_status_code: int, 
    error_code: Optional[str], 
    error_message: str, 
    error_reason: Optional[str] = None
) -> Dict:
    """Create a standardized error entry for the glossary."""
    is_rate_limit = is_rate_limit_error(error_message, http_status_code)
    
    # Determine error type for better categorization
    if is_rate_limit:
        error_type = "RATE_LIMIT_EXCEEDED"
        why = f"This error indicates that the {provider} API rate limit or quota has been exceeded. "
        if error_reason:
            why += f"The specific reason from the API was '{error_reason}'. "
        why += f"The HTTP status code {http_status_code} typically indicates rate limiting."
        
        how = f"1. Wait for the quota to reset (usually a few minutes to 24 hours depending on the limit). "
        how += f"2. Review your usage patterns and optimize API calls. "
        how += f"3. Consider upgrading your {provider} plan or requesting a quota increase if this is a recurring issue. "
        how += f"4. Implement exponential backoff in your API calls to avoid hitting rate limits."
    else:
        error_type = error_code or "UNKNOWN_ERROR"
        why = f"This error indicates: {error_message}. "
        if error_reason:
            why += f"The specific reason from the API was '{error_reason}'."
        how = f"1. Check the {provider} API documentation for this specific error code. "
        how += f"2. Verify your API key validity and permissions. "
        how += f"3. Check your request parameters and format. "
        how += f"4. Ensure your {provider} account is in good standing and has proper billing."

    return {
        "code": error_type,
        "http_status_code": http_status_code,
        "provider": provider,
        "reason": error_message,
        "exact_message": error_message,
        "why": why,
        "how": how,
        "is_rate_limit": is_rate_limit,
        "last_seen": datetime.now().isoformat() + "Z"
    }

def update_glossary(log_file_path: str, glossary_file_path: str):
    """
    Reads the worker log, extracts LLM API errors from multiple providers, and updates the glossary.
    """
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

    # Process errors for each provider
    for provider, patterns in LLM_PATTERNS.items():
        for pattern in patterns:
            compiled_pattern = re.compile(pattern, re.DOTALL)
            for match in compiled_pattern.finditer(log_content):
                try:
                    http_status_code = int(match.group(1))
                    error_content = match.group(2)
                    
                    # Extract error details
                    error_code, error_message, error_reason = extract_error_details(error_content)
                    
                    if not error_message:
                        continue  # Skip if no error message found
                    
                    # Identify provider (may override based on content)
                    actual_provider = identify_provider_from_error(error_message)
                    if actual_provider != "unknown":
                        provider = actual_provider
                    
                    # Check if error already exists in glossary
                    found = False
                    for entry in glossary_data["llm_errors"]:
                        # Match on provider, status code, and error message pattern
                        if (entry.get("provider") == provider and 
                            entry.get("http_status_code") == http_status_code and
                            entry.get("reason") == error_message):
                            entry["last_seen"] = datetime.now().isoformat() + "Z"
                            found = True
                            break
                    
                    if not found:
                        new_errors_found = True
                        new_entry = create_error_entry(
                            provider, http_status_code, error_code, error_message, error_reason
                        )
                        glossary_data["llm_errors"].append(new_entry)
                        print(f"Added new error to glossary: {new_entry['code']} (HTTP {http_status_code}) for {provider}")

                except Exception as e:
                    print(f"Error processing log entry for {provider}: {e}")

    # Also look for general rate limit errors that might not match specific patterns
    general_rate_limit_pattern = re.compile(
        r"ERROR.*?(?:rate limit|quota exceeded|too many requests).*?(\d+)", 
        re.IGNORECASE
    )
    
    for match in general_rate_limit_pattern.finditer(log_content):
        try:
            http_status_code = int(match.group(1))
            error_message = match.group(0)
            
            # Only process if it's likely an HTTP error status
            if http_status_code in [429, 402, 403]:
                provider = identify_provider_from_error(error_message)
                
                # Check if error already exists in glossary
                found = False
                for entry in glossary_data["llm_errors"]:
                    if (entry.get("provider") == provider and 
                        entry.get("http_status_code") == http_status_code and
                        entry.get("reason") == error_message):
                        entry["last_seen"] = datetime.now().isoformat() + "Z"
                        found = True
                        break
                
                if not found:
                    new_errors_found = True
                    new_entry = create_error_entry(provider, http_status_code, None, error_message)
                    glossary_data["llm_errors"].append(new_entry)
                    print(f"Added general rate limit error to glossary: {new_entry['code']} (HTTP {http_status_code}) for {provider}")

        except Exception as e:
            print(f"Error processing general rate limit entry: {e}")

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
    # Use default paths or accept command line arguments
    import sys
    if len(sys.argv) > 2:
        log_path = sys.argv[1]
        glossary_path = sys.argv[2]
    else:
        log_path = "./worker.log"
        glossary_path = "./llm_error_glossary.json"
    update_glossary(log_path, glossary_path)