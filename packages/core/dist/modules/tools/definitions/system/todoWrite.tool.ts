import { z } from 'zod';
import type { Ctx, Tool } from '../../../../types.ts';
import { getRedisClientInstance } from '../../../../modules/redis/redisClient.ts';

// Schema pour les items de todo (compatible Claude Code)
const todoItemSchema = z.object({
  id: z.string().describe('Unique identifier for the todo item'),
  content: z.string().describe('Description of the task'),
  status: z
    .enum(['pending', 'in_progress', 'completed'])
    .describe('Current status of the task'),
});

// Schema pour les paramètres de l'outil (exactement comme Claude Code)
export const parameters = z.object({
  todos: z
    .array(todoItemSchema)
    .describe('Array of todo items with their current status'),
});

// Schema pour la sortie
export const todoWriteOutput = z.object({
  success: z.boolean(),
  message: z.string(),
  todos: z.array(todoItemSchema),
});

// Type pour l'outil
type TodoWriteTool = {
  execute: (
    args: z.infer<typeof parameters>,
    ctx: Ctx,
  ) => Promise<z.infer<typeof todoWriteOutput>>;
} & Tool<typeof parameters, typeof todoWriteOutput>;

// Store global pour maintenir l'état des todos par session (comme Claude Code)
const globalTodoStore = new Map<
  string,
  Array<z.infer<typeof todoItemSchema>>
>();

// Fonction pour créer les données de todo list (format simplifié)
const createSimpleTodoData = (
  todos: Array<z.infer<typeof todoItemSchema>>,
  sessionKey: string,
) => {
  const stats = {
    pending: todos.filter((t) => t.status === 'pending').length,
    in_progress: todos.filter((t) => t.status === 'in_progress').length,
    completed: todos.filter((t) => t.status === 'completed').length,
    total: todos.length,
  };

  return {
    type: 'claude_code_todo',
    sessionId: sessionKey,
    timestamp: Date.now(),
    title: 'Todo List',
    todos: todos,
    stats: stats,
  };
};

export const todoWriteTool: TodoWriteTool = {
  description:
    'Simple todo list management tool inspired by Claude Code. Directly updates and displays todos without complex session management. Use this for tracking tasks and progress in a clean, reliable way.',
  execute: async (args, ctx) => {
    const sessionKey = ctx.session?.name || ctx.job?.id || 'default';

    try {
      ctx.log.info(
        `TodoWrite - Managing ${args.todos.length} todos for session ${sessionKey}`,
      );

      // Stocker les todos (remplacement complet comme Claude Code)
      globalTodoStore.set(sessionKey, args.todos);

      // Créer les données pour l'interface
      const todoData = createSimpleTodoData(args.todos, sessionKey);

      // Publier directement via WebSocket (format simplifié)
      if (ctx.job?.id) {
        const channel = `job:${ctx.job.id}:events`;
        const wsMessage = JSON.stringify({
          type: 'claude_code_todo',
          data: todoData,
        });

        await getRedisClientInstance().publish(channel, wsMessage);
        ctx.log.info(`TodoWrite published to channel ${channel}`);
      }

      // Log pour debug
      ctx.log.info(`TodoWrite - Updated todos:`, {
        total: args.todos.length,
        pending: todoData.stats.pending,
        in_progress: todoData.stats.in_progress,
        completed: todoData.stats.completed,
      });

      return {
        success: true,
        message: `Todos updated successfully. ${todoData.stats.total} total tasks.`,
        todos: args.todos,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      ctx.log.error({ err: error }, `Error in todoWriteTool: ${errorMessage}`);
      return {
        success: false,
        message: `Failed to update todos: ${errorMessage}`,
        todos: [],
      };
    }
  },
  name: 'todo_write',
  parameters,
};

// Fonction utilitaire pour récupérer les todos (si nécessaire)
export const getTodosForSession = (sessionKey: string) => {
  return globalTodoStore.get(sessionKey) || [];
};

// Default export for compatibility
export default todoWriteTool;
