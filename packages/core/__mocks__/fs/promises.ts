import { vi } from 'vitest';

const actual = await vi.importActual('fs/promises');

export const readdir = vi.fn(actual.readdir);
export const readFile = vi.fn(actual.readFile);
export const writeFile = vi.fn(actual.writeFile);
export const unlink = vi.fn(actual.unlink);
export const stat = vi.fn(actual.stat);
