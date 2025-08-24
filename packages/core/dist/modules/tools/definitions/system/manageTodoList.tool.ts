import { z } from 'zod';

import type { Ctx, Tool } from '../../../../types.ts';

import { getRedisClientInstance } from '../../../../modules/redis/redisClient.ts';

// Schema pour les items de todo
const todoItemSchema = z.object({
  category: z
    .string()
    .optional()
    .describe('Category or project the task belongs to'),
  content: z.string().describe('Description of the task'),
  id: z.string().describe('Unique identifier for the todo item'),
  priority: z
    .enum(['low', 'medium', 'high'])
    .optional()
    .describe('Priority level of the task'),
  status: z
    .enum(['pending', 'in_progress', 'completed'])
    .describe('Current status of the task'),
});

// Schema pour les paramètres de l'outil
export const parameters = z.object({
  action: z
    .enum(['create', 'update', 'display', 'clear'])
    .describe('Action to perform on the todo list'),
  itemId: z
    .string()
    .optional()
    .describe('ID of specific item to update (for update action)'),
  status: z
    .enum(['pending', 'in_progress', 'completed'])
    .optional()
    .describe('New status for update action'),
  title: z.string().optional().describe('Title for the todo list display'),
  todos: z
    .array(todoItemSchema)
    .optional()
    .describe('Array of todo items for create/update actions'),
});

// Schema pour la sortie
export const todoListOutput = z.union([
  z.object({
    message: z.string(),
    success: z.boolean(),
    todos: z.array(todoItemSchema).optional(),
  }),
  z.object({
    error: z.string(),
  }),
]);

// Type pour l'outil
type TodoListTool = {
  execute: (
    args: z.infer<typeof parameters>,
    ctx: Ctx,
  ) => Promise<z.infer<typeof todoListOutput>>;
} & Tool<typeof parameters, typeof todoListOutput>;

// Store pour maintenir l'état de la todo list par session
const todoStore = new Map<string, Array<z.infer<typeof todoItemSchema>>>();

// Fonction pour générer un ID unique
const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).substr(2);

// Fonction pour créer les données JSON de la todo list (pour l'interface de chat)
const createTodoData = (
  todos: Array<z.infer<typeof todoItemSchema>>,
  title?: string,
) => {
  return {
    stats: {
      completed: todos.filter((t) => t.status === 'completed').length,
      in_progress: todos.filter((t) => t.status === 'in_progress').length,
      pending: todos.filter((t) => t.status === 'pending').length,
      total: todos.length,
    },
    timestamp: Date.now(),
    title: title || 'AgenticForge Todo List',
    todos: todos.map((todo) => ({
      category: todo.category,
      content: todo.content,
      id: todo.id,
      priority: todo.priority || 'medium',
      status: todo.status,
    })),
    type: 'chat_header_todo',
  };
};

export const manageTodoListTool: TodoListTool = {
  description:
    'Manages a todo list for tracking tasks and progress. Can create, update, display, and clear todos. Uses the native UI interface instead of canvas. Useful for complex multi-step tasks that require organization and progress tracking.',
  execute: async (args, ctx) => {
    const sessionKey = ctx.session?.name || 'default';

    try {
      ctx.log.info(`Managing todo list - Action: ${args.action}`);

      // Initialize todo list for session if not exists
      if (!todoStore.has(sessionKey)) {
        todoStore.set(sessionKey, []);
      }

      const currentTodos = todoStore.get(sessionKey)!;

      switch (args.action) {
        case 'clear':
          todoStore.set(sessionKey, []);
          ctx.log.info('Todo list cleared');

          // Send empty list to native interface
          if (ctx.job?.id) {
            const channel = `job:${ctx.job.id}:events`;
            const wsMessage = JSON.stringify({
              data: createTodoData([], args.title),
              type: 'todo_list',
            });
            getRedisClientInstance().publish(channel, wsMessage);
          }

          return {
            message: 'Todo list cleared',
            success: true,
            todos: [],
          };

        case 'create':
          if (!args.todos || args.todos.length === 0) {
            return { error: 'No todos provided for create action' };
          }

          // Add IDs to new todos if not provided
          const newTodos = args.todos.map((todo) => ({
            ...todo,
            id: todo.id || generateId(),
            priority: todo.priority || 'medium',
          }));

          // Replace the entire todo list
          todoStore.set(sessionKey, newTodos);
          ctx.log.info(`Created ${newTodos.length} todos for native interface`);

          // Create data for chat header interface
          const todoData = createTodoData(newTodos, args.title);

          // Send via WebSocket for chat header integration
          if (ctx.job?.id) {
            const channel = `job:${ctx.job.id}:events`;
            const wsMessage = JSON.stringify({
              data: todoData,
              type: 'chat_header_todo',
            });
            getRedisClientInstance().publish(channel, wsMessage);
          }

          return {
            message: `Created ${newTodos.length} todo items`,
            success: true,
            todos: newTodos,
          };

        case 'display':
          ctx.log.info(
            `Displaying ${currentTodos.length} todos via chat header interface`,
          );

          // Display todos in chat header interface
          const displayData = createTodoData(currentTodos, args.title);
          ctx.log.info('Todo list displayed via chat header interface');

          // Send via WebSocket for chat header integration
          if (ctx.job?.id) {
            const channel = `job:${ctx.job.id}:events`;
            const wsMessage = JSON.stringify({
              data: displayData,
              type: 'chat_header_todo',
            });
            getRedisClientInstance().publish(channel, wsMessage);
          }

          return {
            message: `Displayed ${currentTodos.length} todo items`,
            success: true,
            todos: currentTodos,
          };

        case 'update':
          if (!args.itemId || !args.status) {
            return {
              error: 'Item ID and status are required for update action',
            };
          }

          const todoIndex = currentTodos.findIndex(
            (todo) => todo.id === args.itemId,
          );
          if (todoIndex === -1) {
            return { error: `Todo item with ID ${args.itemId} not found` };
          }

          currentTodos[todoIndex].status = args.status;
          todoStore.set(sessionKey, currentTodos);
          ctx.log.info(`Updated todo ${args.itemId} to status ${args.status}`);

          // Update data for chat header interface
          const updateData = createTodoData(currentTodos, args.title);
          ctx.log.info('Todo data updated for chat header interface');

          // Send via WebSocket for chat header integration
          if (ctx.job?.id) {
            const channel = `job:${ctx.job.id}:events`;
            const wsMessage = JSON.stringify({
              data: updateData,
              type: 'chat_header_todo',
            });
            getRedisClientInstance().publish(channel, wsMessage);
          }

          return {
            message: `Updated todo item status to ${args.status}`,
            success: true,
            todos: currentTodos,
          };

        default:
          return { error: `Unknown action: ${args.action}` };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      ctx.log.error(
        { err: error },
        `Error in manageTodoListTool: ${errorMessage}`,
      );
      return { error: `Failed to manage todo list: ${errorMessage}` };
    }
  },
  name: 'manage_todo_list',
  parameters,
};

// Default export for compatibility
export default manageTodoListTool;
