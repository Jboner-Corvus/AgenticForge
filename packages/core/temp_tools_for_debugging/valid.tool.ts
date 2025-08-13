
  import { z } from 'zod';
  export const myTestTool = {
    name: 'myTool',
    description: 'A test tool',
    parameters: z.object({ param1: z.string() }),
    execute: () => 'result',
  };
