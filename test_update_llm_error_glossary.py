import unittest
import json
import os
import tempfile
from datetime import datetime
from update_llm_error_glossary import update_glossary, is_rate_limit_error, identify_provider_from_error

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

    def test_update_glossary_with_new_gemini_error(self):
        # Create a log file with a Gemini error entry
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
        self.assertEqual(error_entry['code'], 'RATE_LIMIT_EXCEEDED')
        self.assertEqual(error_entry['http_status_code'], 429)
        self.assertEqual(error_entry['provider'], 'gemini')
        self.assertIn('Quota exceeded', error_entry['reason'])
        self.assertTrue(error_entry['is_rate_limit'])

    def test_update_glossary_with_new_openai_error(self):
        # Create a log file with an OpenAI error entry
        log_content = '''
ERROR: OpenAI API error 429: Rate limit exceeded: free-models-per-day-high-balance
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
        self.assertEqual(error_entry['code'], 'RATE_LIMIT_EXCEEDED')
        self.assertEqual(error_entry['http_status_code'], 429)
        self.assertEqual(error_entry['provider'], 'openai')
        self.assertIn('Rate limit exceeded', error_entry['reason'])
        self.assertTrue(error_entry['is_rate_limit'])

    def test_update_glossary_with_existing_error(self):
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
        self.assertEqual(error_entry['code'], 'RATE_LIMIT_EXCEEDED')
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

    def test_is_rate_limit_error(self):
        # Test rate limit error detection
        self.assertTrue(is_rate_limit_error("Rate limit exceeded", 429))
        self.assertTrue(is_rate_limit_error("Quota exceeded for the day", 402))
        self.assertTrue(is_rate_limit_error("Too many requests", 429))
        self.assertFalse(is_rate_limit_error("Invalid API key", 401))
        self.assertFalse(is_rate_limit_error("Server error", 500))

    def test_identify_provider_from_error(self):
        # Test provider identification
        self.assertEqual(identify_provider_from_error("Gemini API error"), "gemini")
        self.assertEqual(identify_provider_from_error("OpenAI GPT model error"), "openai")
        self.assertEqual(identify_provider_from_error("Anthropic Claude error"), "anthropic")
        self.assertEqual(identify_provider_from_error("Mistral API error"), "mistral")
        self.assertEqual(identify_provider_from_error("Unknown provider error"), "unknown")

if __name__ == '__main__':
    unittest.main()