// src/utils/validationUtils.test.ts
import { isValidHttpUrl } from './validationUtils';

describe('validationUtils', () => {
  describe('isValidHttpUrl', () => {
    // Test cases for valid URLs
    it('should return true for valid http URLs', () => {
      expect(isValidHttpUrl('http://example.com')).toBe(true);
    });

    it('should return true for valid https URLs', () => {
      expect(isValidHttpUrl('https://www.example.com/path?query=123')).toBe(
        true,
      );
    });

    it('should return true for URLs with ports and subdomains', () => {
      expect(isValidHttpUrl('https://sub.domain.co.uk:8080')).toBe(true);
    });

    // Test cases for invalid URLs
    it('should return false for protocols other than http or https', () => {
      expect(isValidHttpUrl('ftp://example.com')).toBe(false);
      expect(isValidHttpUrl('file:///path/to/file')).toBe(false);
    });

    it('should return false for malformed URLs', () => {
      expect(isValidHttpUrl('not a url')).toBe(false);
      expect(isValidHttpUrl('http//example.com')).toBe(false);
      expect(isValidHttpUrl('www.example.com')).toBe(false); // Missing protocol
    });

    // Test cases for non-string inputs
    it('should return false for null or undefined input', () => {
      expect(isValidHttpUrl(null)).toBe(false);
      expect(isValidHttpUrl(undefined)).toBe(false);
    });

    it('should return false for an empty string', () => {
      expect(isValidHttpUrl('')).toBe(false);
    });
  });
});
