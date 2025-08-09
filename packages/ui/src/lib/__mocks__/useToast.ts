import { vi } from 'vitest';

// Mock implementation of the useToast hook
export const useToast = vi.fn(() => ({
  toast: vi.fn(),
}));