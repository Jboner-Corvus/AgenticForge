import { vi } from 'vitest';

export const useAgentStream = () => ({
  startAgent: vi.fn(),
  interruptAgent: vi.fn(),
});
