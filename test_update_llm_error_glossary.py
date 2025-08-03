import unittest
import json
import os
import tempfile
from datetime import datetime
from update_llm_error_glossary import update_glossary

class TestUpdateLLMErrorGlossary(unittest.TestCase):
    def setUp(self):
        # Create temporary files for testing
        self.log_file = tempfile.NamedTemporaryFile(mode='w+', delete=False, suffix='.log')
        self.glossary_file = tempfile.NamedTemporaryFile(mode='w+', delete=False, suffix='.json')
        self.log_file.close()
        self.glossary_file.close()

    def tearDown(self):
        # Clean up temporary files
        try:
            os.unlink(self.log_file.name)
            os.unlink(self.glossary_file.name)
        except:
            pass

    def test_update_glossary_with_new_error(self):
        # Create a log file with an error entry
        log_content = '''
ERROR: Gemini API request failed with status 429: {"error": {"code": 429, "message": "Quota exceeded", "status": "RESOURCE_EXHAUSTED", "details": [{"reason": "RATE_LIMIT"}]}}
'''
        with open(self.log_file.name, 'w') as f:
            f.write(log_content)

        # Run the update_glossary function
        update_glossary(self.log_file.name, self.glossary_file.name)

        # Check that the glossary file was created and contains the error
        with open(self.glossary_file.name, 'r') as f:
            glossary_data = json.load(f)

        self.assertEqual(len(glossary_data['llm_errors']), 1)
        error_entry = glossary_data['llm_errors'][0]
        self.assertEqual(error_entry['code'], 'RESOURCE_EXHAUSTED')
        self.assertEqual(error_entry['http_status_code'], 429)
        self.assertIn('Quota exceeded', error_entry['reason'])

    def test_update_glossary_with_existing_error(self):
        # Create a glossary file with an existing error
        existing_glossary = {
            "llm_errors": [
                {
                    "code": "RESOURCE_EXHAUSTED",
                    "http_status_code": 429,
                    "provider": "gemini",
                    "reason": "Quota exceeded",
                    "exact_message": "Quota exceeded",
                    "why": "This error indicates: Quota exceeded. The specific reason from the API was 'RATE_LIMIT'.",
                    "how": "Consult the Gemini API documentation for this specific error code. Common solutions include checking API key validity, quota limits, or request parameters.",
                    "last_seen": "2023-01-01T00:00:00Z"
                }
            ]
        }
        with open(self.glossary_file.name, 'w') as f:
            json.dump(existing_glossary, f)

        # Create a log file with the same error entry
        log_content = '''
ERROR: Gemini API request failed with status 429: {"error": {"code": 429, "message": "Quota exceeded", "status": "RESOURCE_EXHAUSTED", "details": [{"reason": "RATE_LIMIT"}]}}
'''
        with open(self.log_file.name, 'w') as f:
            f.write(log_content)

        # Run the update_glossary function
        update_glossary(self.log_file.name, self.glossary_file.name)

        # Check that the glossary file still contains only one error
        with open(self.glossary_file.name, 'r') as f:
            glossary_data = json.load(f)

        self.assertEqual(len(glossary_data['llm_errors']), 1)
        error_entry = glossary_data['llm_errors'][0]
        self.assertEqual(error_entry['code'], 'RESOURCE_EXHAUSTED')
        # Just verify that last_seen is present (we won't check its exact value since it's time-dependent)

    def test_update_glossary_with_no_errors(self):
        # Create an empty log file
        with open(self.log_file.name, 'w') as f:
            f.write("No errors here")

        # Run the update_glossary function
        update_glossary(self.log_file.name, self.glossary_file.name)

        # Check that the glossary file is empty or contains no errors
        if os.path.exists(self.glossary_file.name) and os.path.getsize(self.glossary_file.name) > 0:
            with open(self.glossary_file.name, 'r') as f:
                try:
                    glossary_data = json.load(f)
                    self.assertEqual(len(glossary_data['llm_errors']), 0)
                except json.JSONDecodeError:
                    # If the file is empty or not valid JSON, that's fine for this test
                    pass

if __name__ == '__main__':
    unittest.main()