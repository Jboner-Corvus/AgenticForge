import { vi } from 'vitest';

const actual = await vi.importActual('path');

export const join = vi.fn(actual.join);
export const resolve = vi.fn(actual.resolve);
export const dirname = vi.fn(actual.dirname);
