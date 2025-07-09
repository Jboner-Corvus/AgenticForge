// src/utils/errorUtils.test.ts (Corrigé)
import { AppError, getErrDetails } from './errorUtils.js';

describe('ErrorUtils', () => {
  describe('getErrDetails', () => {
    it('should handle a standard Error', () => {
      const error = new Error('Test error message');
      const details = getErrDetails(error);
      expect(details.message).toBe('Test error message');
      expect(details.name).toBe('Error');
    });

    it('should handle an AppError', () => {
      const error = new AppError('Custom app error', {
        extra: 'data',
      });
      const details = getErrDetails(error);
      expect(details.message).toBe('Custom app error');
      expect(details.name).toBe('AppError');
    });
  });
});
