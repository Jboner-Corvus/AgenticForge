import { vi } from 'vitest';

export const useIsProcessing = () => false;
export const useMessageInputValue = () => '';
export const useUIStore = () => ({
  selectedSystemPrompt: 'architect',
  setMessageInputValue: vi.fn(),
  setSelectedSystemPrompt: vi.fn(),
});