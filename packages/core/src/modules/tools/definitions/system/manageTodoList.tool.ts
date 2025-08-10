import { z } from 'zod';
import type { Ctx, Tool } from '../../../../types.js';
import { sendToCanvas } from '../../../../utils/canvasUtils.js';

// Schema pour les items de todo
const todoItemSchema = z.object({
  id: z.string().describe('Unique identifier for the todo item'),
  content: z.string().describe('Description of the task'),
  status: z.enum(['pending', 'in_progress', 'completed']).describe('Current status of the task'),
  priority: z.enum(['low', 'medium', 'high']).optional().describe('Priority level of the task'),
  category: z.string().optional().describe('Category or project the task belongs to'),
});

// Schema pour les paramètres de l'outil
export const parameters = z.object({
  action: z.enum(['create', 'update', 'display', 'clear']).describe('Action to perform on the todo list'),
  todos: z.array(todoItemSchema).optional().describe('Array of todo items for create/update actions'),
  itemId: z.string().optional().describe('ID of specific item to update (for update action)'),
  status: z.enum(['pending', 'in_progress', 'completed']).optional().describe('New status for update action'),
  title: z.string().optional().describe('Title for the todo list display'),
});

// Schema pour la sortie
export const todoListOutput = z.union([
  z.object({
    success: z.boolean(),
    message: z.string(),
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
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

// Fonction pour créer le HTML de la todo list
const createTodoHtml = (todos: Array<z.infer<typeof todoItemSchema>>, title?: string) => {
  const todoItems = todos.map(todo => {
    const statusEmoji = {
      pending: '⏳',
      in_progress: '🔄',
      completed: '✅'
    }[todo.status];
    
    const priorityColor = {
      high: 'text-red-500',
      medium: 'text-yellow-500',
      low: 'text-green-500'
    }[todo.priority || 'medium'];

    return `
      <div class="todo-item p-3 mb-2 rounded-lg border ${todo.status === 'completed' ? 'bg-green-50 border-green-200' : 
        todo.status === 'in_progress' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center space-x-2">
              <span class="text-lg">${statusEmoji}</span>
              <span class="text-sm font-medium ${priorityColor}">
                ${todo.priority ? todo.priority.toUpperCase() : 'MEDIUM'}
              </span>
              ${todo.category ? `<span class="text-xs bg-gray-200 px-2 py-1 rounded">${todo.category}</span>` : ''}
            </div>
            <p class="mt-1 ${todo.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-800'}">${todo.content}</p>
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title || 'Todo List'}</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                margin: 0;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border-radius: 16px;
                padding: 24px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            }
            .header {
                text-align: center;
                margin-bottom: 24px;
                border-bottom: 2px solid #e5e7eb;
                padding-bottom: 16px;
            }
            .title {
                font-size: 24px;
                font-weight: bold;
                color: #1f2937;
                margin: 0;
            }
            .stats {
                display: flex;
                justify-content: space-around;
                margin: 16px 0;
                padding: 16px;
                background: #f9fafb;
                border-radius: 8px;
            }
            .stat {
                text-align: center;
            }
            .stat-value {
                font-size: 20px;
                font-weight: bold;
            }
            .stat-label {
                font-size: 12px;
                color: #6b7280;
                text-transform: uppercase;
            }
            .todo-item {
                transition: transform 0.2s ease, box-shadow 0.2s ease;
            }
            .todo-item:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            .empty-state {
                text-align: center;
                padding: 40px 20px;
                color: #6b7280;
            }
            .empty-state-emoji {
                font-size: 48px;
                margin-bottom: 16px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 class="title">📋 ${title || 'Todo List'}</h1>
                <div class="stats">
                    <div class="stat">
                        <div class="stat-value text-blue-600">${todos.filter(t => t.status === 'pending').length}</div>
                        <div class="stat-label">À faire</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value text-yellow-600">${todos.filter(t => t.status === 'in_progress').length}</div>
                        <div class="stat-label">En cours</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value text-green-600">${todos.filter(t => t.status === 'completed').length}</div>
                        <div class="stat-label">Terminé</div>
                    </div>
                </div>
            </div>
            <div class="todo-list">
                ${todos.length > 0 ? todoItems : `
                    <div class="empty-state">
                        <div class="empty-state-emoji">🎯</div>
                        <p>Aucune tâche pour le moment</p>
                    </div>
                `}
            </div>
        </div>
    </body>
    </html>
  `;
};

export const manageTodoListTool: TodoListTool = {
  description: "Manages a todo list for tracking tasks and progress. Can create, update, display, and clear todos. Useful for complex multi-step tasks that require organization and progress tracking.",
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
        case 'create':
          if (!args.todos || args.todos.length === 0) {
            return { error: 'No todos provided for create action' };
          }
          
          // Add IDs to new todos if not provided
          const newTodos = args.todos.map(todo => ({
            ...todo,
            id: todo.id || generateId(),
            priority: todo.priority || 'medium',
          }));
          
          // Replace the entire todo list
          todoStore.set(sessionKey, newTodos);
          ctx.log.info(`Created ${newTodos.length} todos`);
          
          // Display the updated list in canvas
          if (ctx.job?.id) {
            const html = createTodoHtml(newTodos, args.title);
            await sendToCanvas(ctx.job.id, html, 'html');
            ctx.log.info('Todo list displayed in canvas');
          }
          
          return {
            success: true,
            message: `Created ${newTodos.length} todo items`,
            todos: newTodos,
          };
          
        case 'update':
          if (!args.itemId || !args.status) {
            return { error: 'Item ID and status are required for update action' };
          }
          
          const todoIndex = currentTodos.findIndex(todo => todo.id === args.itemId);
          if (todoIndex === -1) {
            return { error: `Todo item with ID ${args.itemId} not found` };
          }
          
          currentTodos[todoIndex].status = args.status;
          todoStore.set(sessionKey, currentTodos);
          ctx.log.info(`Updated todo ${args.itemId} to status ${args.status}`);
          
          // Display the updated list in canvas
          if (ctx.job?.id) {
            const html = createTodoHtml(currentTodos, args.title);
            await sendToCanvas(ctx.job.id, html, 'html');
            ctx.log.info('Updated todo list displayed in canvas');
          }
          
          return {
            success: true,
            message: `Updated todo item status to ${args.status}`,
            todos: currentTodos,
          };
          
        case 'display':
          ctx.log.info(`Displaying ${currentTodos.length} todos`);
          
          // Display the current list in canvas
          if (ctx.job?.id) {
            const html = createTodoHtml(currentTodos, args.title);
            await sendToCanvas(ctx.job.id, html, 'html');
            ctx.log.info('Todo list displayed in canvas');
          }
          
          return {
            success: true,
            message: `Displayed ${currentTodos.length} todo items`,
            todos: currentTodos,
          };
          
        case 'clear':
          todoStore.set(sessionKey, []);
          ctx.log.info('Cleared todo list');
          
          return {
            success: true,
            message: 'Todo list cleared',
            todos: [],
          };
          
        default:
          return { error: `Unknown action: ${args.action}` };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      ctx.log.error({ err: error }, `Error in manageTodoListTool: ${errorMessage}`);
      return { error: `Failed to manage todo list: ${errorMessage}` };
    }
  },
  name: 'manage_todo_list',
  parameters,
};