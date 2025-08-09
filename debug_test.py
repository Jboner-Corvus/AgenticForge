import json
import tempfile
import os
from update_llm_error_glossary import update_glossary

# Create temporary files for testing
log_file = tempfile.NamedTemporaryFile(mode='w+', delete=False, suffix='.log')
glossary_file = tempfile.NamedTemporaryFile(mode='w+', delete=False, suffix='.json')
log_file.close()
glossary_file.close()

# Create a glossary file with an existing error
existing_glossary = {
    "llm_errors": [
        {
            "code": "RATE_LIMIT_EXCEEDED",
            "http_status_code": 429,
            "provider": "gemini",
            "reason": "Quota exceeded",
            "exact_message": "Quota exceeded",
            "why": "This error indicates that the gemini API rate limit or quota has been exceeded. The specific reason from the API was 'RATE_LIMIT'. The HTTP status code 429 typically indicates rate limiting.",
            "how": "1. Wait for the quota to reset (usually a few minutes to 24 hours depending on the limit). 2. Review your usage patterns and optimize API calls. 3. Consider upgrading your gemini plan or requesting a quota increase if this is a recurring issue. 4. Implement exponential backoff in your API calls to avoid hitting rate limits.",
            "is_rate_limit": True,
            "last_seen": "2023-01-01T00:00:00Z"
        }
    ]
}
with open(glossary_file.name, 'w') as f:
    json.dump(existing_glossary, f)

# Show what we have in the glossary file before update
print("BEFORE UPDATE:")
with open(glossary_file.name, 'r') as f:
    glossary_data = json.load(f)
    for i, error in enumerate(glossary_data['llm_errors']):
        print(f"Error {i+1}:")
        print(f"  Code: {error.get('code')}")
        print(f"  Provider: {error.get('provider')}")
        print(f"  Reason: '{error.get('reason')}'")
        print(f"  HTTP Status: {error.get('http_status_code')}")
        print()

# Create a log file with the same error entry
log_content = '''
ERROR: Gemini API request failed with status 429: {"error": {"code": 429, "message": "Quota exceeded", "status": "RESOURCE_EXHAUSTED", "details": [{"reason": "RATE_LIMIT"}]}}
'''
with open(log_file.name, 'w') as f:
    f.write(log_content)

# Show what we have in the log file
print("LOG CONTENT:")
print(repr(log_content))
print()

# Run the update_glossary function
update_glossary(log_file.name, glossary_file.name)

# Check that the glossary file still contains only one error
print("AFTER UPDATE:")
with open(glossary_file.name, 'r') as f:
    glossary_data = json.load(f)

print("Number of errors:", len(glossary_data['llm_errors']))
for i, error in enumerate(glossary_data['llm_errors']):
    print(f"Error {i+1}:")
    print(f"  Code: {error.get('code')}")
    print(f"  Provider: {error.get('provider')}")
    print(f"  Reason: '{error.get('reason')}'")
    print(f"  HTTP Status: {error.get('http_status_code')}")
    print()

# Clean up temporary files
try:
    os.unlink(log_file.name)
    os.unlink(glossary_file.name)
except:
    pass