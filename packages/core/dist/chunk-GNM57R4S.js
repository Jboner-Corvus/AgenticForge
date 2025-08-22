import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  sendToCanvas
} from "./chunk-KBBD5YYX.js";
import {
  getRedisClientInstance
} from "./chunk-SIBAPVHV.js";
import {
  init_esm_shims
} from "./chunk-SB7UONON.js";

// src/modules/tools/definitions/system/manageTodoList.tool.ts
init_esm_shims();
import { z } from "zod";
var todoItemSchema = z.object({
  id: z.string().describe("Unique identifier for the todo item"),
  content: z.string().describe("Description of the task"),
  status: z.enum(["pending", "in_progress", "completed"]).describe("Current status of the task"),
  priority: z.enum(["low", "medium", "high"]).optional().describe("Priority level of the task"),
  category: z.string().optional().describe("Category or project the task belongs to")
});
var parameters = z.object({
  action: z.enum(["create", "update", "display", "clear"]).describe("Action to perform on the todo list"),
  todos: z.array(todoItemSchema).optional().describe("Array of todo items for create/update actions"),
  itemId: z.string().optional().describe("ID of specific item to update (for update action)"),
  status: z.enum(["pending", "in_progress", "completed"]).optional().describe("New status for update action"),
  title: z.string().optional().describe("Title for the todo list display")
});
var todoListOutput = z.union([
  z.object({
    success: z.boolean(),
    message: z.string(),
    todos: z.array(todoItemSchema).optional()
  }),
  z.object({
    error: z.string()
  })
]);
var todoStore = /* @__PURE__ */ new Map();
var templateSentStore = /* @__PURE__ */ new Map();
var generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);
var createTodoData = (todos, title) => {
  return {
    type: "todo_list",
    title: title || "AgenticForge Todo List",
    timestamp: Date.now(),
    todos: todos.map((todo) => ({
      id: todo.id,
      content: todo.content,
      status: todo.status,
      priority: todo.priority || "medium",
      category: todo.category
    })),
    stats: {
      pending: todos.filter((t) => t.status === "pending").length,
      in_progress: todos.filter((t) => t.status === "in_progress").length,
      completed: todos.filter((t) => t.status === "completed").length,
      total: todos.length
    }
  };
};
var createTodoTemplate = () => {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AgenticForge Todo List</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            
            * { box-sizing: border-box; }
            
            body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                margin: 0; padding: 20px; min-height: 100vh;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
                animation: gradientShift 15s ease infinite;
            }
            
            @keyframes gradientShift {
                0%, 100% { background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%); }
                33% { background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 50%, #667eea 100%); }
                66% { background: linear-gradient(135deg, #a8edea 0%, #fed6e3 50%, #764ba2 100%); }
            }
            
            .container {
                max-width: 700px; margin: 0 auto; padding: 32px; border-radius: 24px;
                background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px);
                box-shadow: 0 25px 50px rgba(0,0,0,0.15); border: 1px solid rgba(255, 255, 255, 0.2);
                animation: slideUp 0.8s ease-out;
            }
            
            @keyframes slideUp { from { opacity: 0; transform: translateY(50px); } to { opacity: 1; transform: translateY(0); } }
            
            .header {
                text-align: center; margin-bottom: 32px; padding-bottom: 24px;
                border-bottom: 3px solid; border-image: linear-gradient(90deg, #667eea, #764ba2, #f093fb) 1;
            }
            
            .title {
                font-size: 32px; font-weight: 700; margin: 0 0 16px 0;
                background: linear-gradient(135deg, #667eea, #764ba2);
                -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            }
            
            .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 24px 0; }
            
            .stat {
                background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
                border-radius: 16px; padding: 20px; text-align: center;
                border: 1px solid rgba(102, 126, 234, 0.2); backdrop-filter: blur(10px);
                transition: all 0.3s ease;
            }
            
            .stat:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(102, 126, 234, 0.15); }
            
            .stat-value {
                font-size: 28px; font-weight: 700; margin-bottom: 4px;
                background: linear-gradient(135deg, #667eea, #764ba2);
                -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            }
            
            .stat-label { font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; }
            
            .todo-item {
                border-2; border-radius: 20px; padding: 20px; margin-bottom: 16px;
                shadow-lg; transition: all 0.3s ease; transform: translateY(0);
            }
            
            .todo-item:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.1); }
            
            .todo-pending { background: linear-gradient(to-r, from-amber-50, to-yellow-50); border-color: #f59e0b; }
            .todo-in-progress { background: linear-gradient(to-r, from-blue-50, to-cyan-50); border-color: #3b82f6; animation: pulse 2s infinite; }
            .todo-completed { background: linear-gradient(to-r, from-green-50, to-emerald-50); border-color: #10b981; }
            
            @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.8; } }
            
            .progress-bar { width: 100%; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; }
            .progress-fill { height: 100%; border-radius: 4px; transition: width 1s ease; }
            
            .empty-state { text-align: center; padding: 60px 20px; color: #6b7280; }
            .empty-emoji { font-size: 64px; margin-bottom: 20px; animation: bounce 2s infinite; }
            @keyframes bounce { 0%, 20%, 50%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-10px); } }
            
            @media (max-width: 768px) {
                .container { margin: 10px; padding: 20px; }
                .stats { grid-template-columns: 1fr; gap: 12px; }
                .title { font-size: 24px; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 class="title">\u{1F680} <span id="todo-title">AgenticForge Todo List</span></h1>
                <p style="color: #6b7280; font-size: 14px; opacity: 0.8;">Suivi intelligent des t\xE2ches \u2022 Temps r\xE9el</p>
                
                <div class="stats">
                    <div class="stat">
                        <div class="stat-value" style="color: #f59e0b;" id="stat-pending">0</div>
                        <div class="stat-label">\u23F3 \xC0 FAIRE</div>
                        <div style="font-size: 10px; color: #9ca3af; margin-top: 4px;" id="stat-pending-label">Aucune</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value" style="color: #3b82f6;" id="stat-progress">0</div>
                        <div class="stat-label">\u{1F680} EN COURS</div>
                        <div style="font-size: 10px; color: #9ca3af; margin-top: 4px;" id="stat-progress-label">Rien en cours</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value" style="color: #10b981;" id="stat-completed">0</div>
                        <div class="stat-label">\u2705 TERMIN\xC9</div>
                        <div style="font-size: 10px; color: #9ca3af; margin-top: 4px;" id="stat-completed-label">Aucune encore</div>
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 16px;">
                    <div style="display: inline-flex; align-items: center; background: rgba(102, 126, 234, 0.1); padding: 8px 16px; border-radius: 20px; font-size: 12px; color: #667eea; font-weight: 600;">
                        <div style="width: 8px; height: 8px; background: #22c55e; border-radius: 50%; margin-right: 8px; animation: bounce 2s infinite;"></div>
                        Mise \xE0 jour automatique
                    </div>
                </div>
            </div>
            
            <div id="todo-list" class="todo-list">
                <div class="empty-state">
                    <div class="empty-emoji">\u{1F3AF}</div>
                    <h3 style="color: #374151; margin: 16px 0 8px 0;">En attente des t\xE2ches...</h3>
                    <p style="margin: 0; opacity: 0.8;">L'agent cr\xE9era automatiquement des t\xE2ches</p>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid rgba(0,0,0,0.1);">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                    G\xE9n\xE9r\xE9 par <strong style="background: linear-gradient(135deg, #667eea, #764ba2); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">AgenticForge</strong> \u2022 <span id="timestamp"></span>
                </p>
            </div>
        </div>
        
        <script>
            // Configuration des statuts
            const STATUS_CONFIG = {
                pending: { emoji: '\u23F3', label: '\xC0 FAIRE', desc: '\u23F3 En attente', class: 'todo-pending' },
                in_progress: { emoji: '\u{1F680}', label: 'EN COURS', desc: '\u{1F680} En cours d'ex\xE9cution...', class: 'todo-in-progress' },
                completed: { emoji: '\u2705', label: 'TERMIN\xC9', desc: '\u2705 T\xE2che termin\xE9e', class: 'todo-completed' }
            };
            
            const PRIORITY_CONFIG = {
                high: { label: '\u{1F525} HIGH', bg: 'background: #fee2e2; color: #dc2626; border: 1px solid #fecaca;' },
                medium: { label: '\u26A1 MEDIUM', bg: 'background: #fef3c7; color: #d97706; border: 1px solid #fed7aa;' },
                low: { label: '\u{1F331} LOW', bg: 'background: #dcfce7; color: #16a34a; border: 1px solid #bbf7d0;' }
            };
            
            // Fonction pour mettre \xE0 jour la todo list
            function updateTodoList(data) {
                if (data.type !== 'todo_list') return;
                
                // Mettre \xE0 jour le titre
                document.getElementById('todo-title').textContent = data.title;
                document.getElementById('timestamp').textContent = new Date(data.timestamp).toLocaleTimeString('fr-FR');
                
                // Mettre \xE0 jour les statistiques
                const stats = data.stats;
                document.getElementById('stat-pending').textContent = stats.pending;
                document.getElementById('stat-progress').textContent = stats.in_progress;
                document.getElementById('stat-completed').textContent = stats.completed;
                
                document.getElementById('stat-pending-label').textContent = stats.pending > 0 ? 'En attente' : 'Aucune';
                document.getElementById('stat-progress-label').textContent = stats.in_progress > 0 ? 'En cours d'ex\xE9cution' : 'Rien en cours';
                document.getElementById('stat-completed-label').textContent = stats.completed > 0 ? 'Compl\xE9t\xE9es' : 'Aucune encore';
                
                // G\xE9n\xE9rer les \xE9l\xE9ments de todo
                const todoList = document.getElementById('todo-list');
                
                if (data.todos.length === 0) {
                    todoList.innerHTML = \`
                        <div class="empty-state">
                            <div class="empty-emoji">\u{1F3AF}</div>
                            <h3 style="color: #374151; margin: 16px 0 8px 0;">Aucune t\xE2che active</h3>
                            <p style="margin: 0; opacity: 0.8;">L'agent cr\xE9era automatiquement des t\xE2ches lors de vos demandes</p>
                        </div>\`;
                    return;
                }
                
                const todosHtml = data.todos.map((todo, index) => {
                    const status = STATUS_CONFIG[todo.status];
                    const priority = PRIORITY_CONFIG[todo.priority];
                    const progressWidth = todo.status === 'completed' ? '100%' : todo.status === 'in_progress' ? '66%' : '25%';
                    const progressColor = todo.status === 'completed' ? '#10b981' : todo.status === 'in_progress' ? '#3b82f6' : '#6b7280';
                    
                    return \`
                        <div class="todo-item \${status.class}" style="animation-delay: \${index * 100}ms;">
                            <div style="display: flex; align-items: center; justify-between; margin-bottom: 16px;">
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <div style="width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: rgba(102, 126, 234, 0.1); box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                                        <span style="font-size: 20px;">\${status.emoji}</span>
                                    </div>
                                    <div>
                                        <div style="font-size: 16px; font-weight: bold; color: \${todo.status === 'completed' ? '#16a34a' : todo.status === 'in_progress' ? '#2563eb' : '#d97706'};">
                                            \${status.label}
                                        </div>
                                        <div style="font-size: 12px; color: #6b7280; font-weight: 500;">
                                            \${status.desc}
                                        </div>
                                    </div>
                                </div>
                                <div style="text-align: right;">
                                    <span style="padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; \${priority.bg}">
                                        \${priority.label}
                                    </span>
                                    \${todo.category ? \`<div style="margin-top: 4px;"><span style="background: #e0e7ff; color: #4338ca; border: 1px solid #c7d2fe; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 600;">#\${todo.category}</span></div>\` : ''}
                                </div>
                            </div>
                            
                            <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.5; color: #374151; \${todo.status === 'completed' ? 'text-decoration: line-through; opacity: 0.7;' : ''}">
                                \${todo.content}
                            </p>
                            
                            <div style="margin-bottom: 8px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                    <span style="font-size: 12px; font-weight: 600; color: \${progressColor};">Progression</span>
                                    <span style="font-size: 12px; font-weight: bold; color: \${progressColor};">
                                        \${todo.status === 'completed' ? '100%' : todo.status === 'in_progress' ? '66%' : '25%'}
                                    </span>
                                </div>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: \${progressWidth}; background: \${progressColor};"></div>
                                </div>
                            </div>
                            
                            \${todo.status === 'in_progress' ? \`
                                <div style="margin-top: 12px; display: flex; align-items: center; gap: 8px; color: #2563eb;">
                                    <div style="width: 8px; height: 8px; background: #3b82f6; border-radius: 50%; animation: pulse 1s infinite;"></div>
                                    <span style="font-size: 12px; font-weight: 500;">L'agent travaille actuellement sur cette t\xE2che...</span>
                                </div>
                            \` : ''}
                            
                            \${todo.status === 'completed' ? \`
                                <div style="margin-top: 12px; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 8px 12px; border-radius: 8px; display: flex; align-items: center; gap: 8px; color: #16a34a;">
                                    <span>\u2705</span>
                                    <span style="font-size: 12px; font-weight: 500;">T\xE2che compl\xE9t\xE9e avec succ\xE8s !</span>
                                </div>
                            \` : ''}
                        </div>
                    \`;
                }).join('');
                
                todoList.innerHTML = todosHtml;
            }
            
            // \xC9couter les messages du backend
            window.addEventListener('message', function(event) {
                if (event.data && event.data.type === 'todo_list') {
                    updateTodoList(event.data);
                }
            });
            
            // Pour les tests en d\xE9veloppement
            window.updateTodoList = updateTodoList;
        </script>
    </body>
    </html>
  `;
};
var manageTodoListTool = {
  description: "Manages a todo list for tracking tasks and progress. Can create, update, display, and clear todos. Useful for complex multi-step tasks that require organization and progress tracking.",
  execute: async (args, ctx) => {
    const sessionKey = ctx.session?.name || "default";
    try {
      ctx.log.info(`Managing todo list - Action: ${args.action}`);
      if (!todoStore.has(sessionKey)) {
        todoStore.set(sessionKey, []);
      }
      const currentTodos = todoStore.get(sessionKey);
      switch (args.action) {
        case "create":
          if (!args.todos || args.todos.length === 0) {
            return { error: "No todos provided for create action" };
          }
          const newTodos = args.todos.map((todo) => ({
            ...todo,
            id: todo.id || generateId(),
            priority: todo.priority || "medium"
          }));
          todoStore.set(sessionKey, newTodos);
          ctx.log.info(`Created ${newTodos.length} todos`);
          if (ctx.job?.id) {
            const isFirstTime = !templateSentStore.has(sessionKey);
            if (isFirstTime) {
              const template = createTodoTemplate();
              await sendToCanvas(ctx.job.id, template, "html");
              templateSentStore.set(sessionKey, true);
              ctx.log.info("Todo template sent to canvas");
              await new Promise((resolve) => setTimeout(resolve, 500));
            }
            const todoData = createTodoData(newTodos, args.title);
            await sendToCanvas(ctx.job.id, JSON.stringify(todoData), "json");
            ctx.log.info("Todo data sent to canvas");
            const channel = `job:${ctx.job.id}:events`;
            const wsMessage = JSON.stringify({
              type: "todo_list",
              data: todoData
            });
            getRedisClientInstance().publish(channel, wsMessage);
          }
          return {
            success: true,
            message: `Created ${newTodos.length} todo items`,
            todos: newTodos
          };
        case "update":
          if (!args.itemId || !args.status) {
            return { error: "Item ID and status are required for update action" };
          }
          const todoIndex = currentTodos.findIndex((todo) => todo.id === args.itemId);
          if (todoIndex === -1) {
            return { error: `Todo item with ID ${args.itemId} not found` };
          }
          currentTodos[todoIndex].status = args.status;
          todoStore.set(sessionKey, currentTodos);
          ctx.log.info(`Updated todo ${args.itemId} to status ${args.status}`);
          if (ctx.job?.id) {
            const todoData = createTodoData(currentTodos, args.title);
            await sendToCanvas(ctx.job.id, JSON.stringify(todoData), "json");
            ctx.log.info("Updated todo data sent to canvas");
            const channel = `job:${ctx.job.id}:events`;
            const wsMessage = JSON.stringify({
              type: "todo_list",
              data: todoData
            });
            getRedisClientInstance().publish(channel, wsMessage);
          }
          return {
            success: true,
            message: `Updated todo item status to ${args.status}`,
            todos: currentTodos
          };
        case "display":
          ctx.log.info(`Displaying ${currentTodos.length} todos`);
          if (ctx.job?.id) {
            const isFirstTime = !templateSentStore.has(sessionKey);
            if (isFirstTime) {
              const template = createTodoTemplate();
              await sendToCanvas(ctx.job.id, template, "html");
              templateSentStore.set(sessionKey, true);
              ctx.log.info("Todo template sent to canvas");
              await new Promise((resolve) => setTimeout(resolve, 500));
            }
            const todoData = createTodoData(currentTodos, args.title);
            await sendToCanvas(ctx.job.id, JSON.stringify(todoData), "json");
            ctx.log.info("Todo data displayed in canvas");
            const channel = `job:${ctx.job.id}:events`;
            const wsMessage = JSON.stringify({
              type: "todo_list",
              data: todoData
            });
            getRedisClientInstance().publish(channel, wsMessage);
          }
          return {
            success: true,
            message: `Displayed ${currentTodos.length} todo items`,
            todos: currentTodos
          };
        case "clear":
          todoStore.set(sessionKey, []);
          ctx.log.info("Cleared todo list");
          return {
            success: true,
            message: "Todo list cleared",
            todos: []
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
  name: "manage_todo_list",
  parameters
};
var manageTodoList_tool_default = manageTodoListTool;

export {
  parameters,
  todoListOutput,
  manageTodoListTool,
  manageTodoList_tool_default
};
