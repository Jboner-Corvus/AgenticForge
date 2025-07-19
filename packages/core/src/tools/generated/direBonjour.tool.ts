
// Outil généré par l'agent : dire_bonjour
import { z } from 'zod';
import type { Tool, Ctx } from '../../types.js';

export const dire_bonjourParams = z.object(dire_bonjour);

export const dire_bonjourTool: Tool<typeof dire_bonjourParams> = {
  name: 'dire_bonjour',
  description: 'dire_bonjour',
  parameters: dire_bonjourParams,
  execute: dire_bonjour,
};
