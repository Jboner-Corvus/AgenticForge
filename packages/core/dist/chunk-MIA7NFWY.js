import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  getRedisClientInstance
} from "./chunk-2TWFUMQU.js";
import {
  init_esm_shims
} from "./chunk-SB7UONON.js";

// src/modules/tools/definitions/system/manageTodoList.tool.ts
init_esm_shims();
import { z } from "zod";
var todoItemSchema = z.object({
  category: z.string().optional().describe("Category or project the task belongs to"),
  content: z.string().describe("Description of the task"),
  id: z.string().describe("Unique identifier for the todo item"),
  priority: z.enum(["low", "medium", "high"]).optional().describe("Priority level of the task"),
  status: z.enum(["pending", "in_progress", "completed"]).describe("Current status of the task")
});
var parameters = z.object({
  action: z.enum(["create", "update", "display", "clear"]).describe("Action to perform on the todo list"),
  itemId: z.string().optional().describe("ID of specific item to update (for update action)"),
  status: z.enum(["pending", "in_progress", "completed"]).optional().describe("New status for update action"),
  title: z.string().optional().describe("Title for the todo list display"),
  todos: z.array(todoItemSchema).optional().describe("Array of todo items for create/update actions")
});
var todoListOutput = z.union([
  z.object({
    message: z.string(),
    success: z.boolean(),
    todos: z.array(todoItemSchema).optional()
  }),
  z.object({
    error: z.string()
  })
]);
var todoStore = /* @__PURE__ */ new Map();
var generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);
var createTodoData = (todos, title) => {
  return {
    stats: {
      completed: todos.filter((t) => t.status === "completed").length,
      in_progress: todos.filter((t) => t.status === "in_progress").length,
      pending: todos.filter((t) => t.status === "pending").length,
      total: todos.length
    },
    timestamp: Date.now(),
    title: title || "AgenticForge Todo List",
    todos: todos.map((todo) => ({
      category: todo.category,
      content: todo.content,
      id: todo.id,
      priority: todo.priority || "medium",
      status: todo.status
    })),
    type: "todo_list"
  };
};
var manageTodoListTool = {
  description: "Manages a todo list for tracking tasks and progress. Can create, update, display, and clear todos. Uses the native UI interface instead of canvas. Useful for complex multi-step tasks that require organization and progress tracking.",
  execute: async (args, ctx) => {
    const sessionKey = ctx.session?.name || "default";
    try {
      ctx.log.info(`Managing todo list - Action: ${args.action}`);
      if (!todoStore.has(sessionKey)) {
        todoStore.set(sessionKey, []);
      }
      const currentTodos = todoStore.get(sessionKey);
      switch (args.action) {
        case "clear":
          todoStore.set(sessionKey, []);
          ctx.log.info("Todo list cleared");
          if (ctx.job?.id) {
            const channel = `job:${ctx.job.id}:events`;
            const wsMessage = JSON.stringify({
              data: createTodoData([], args.title),
              type: "todo_list"
            });
            getRedisClientInstance().publish(channel, wsMessage);
          }
          return {
            message: "Todo list cleared",
            success: true,
            todos: []
          };
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
          ctx.log.info(`Created ${newTodos.length} todos for native interface`);
          const todoData = createTodoData(newTodos, args.title);
          if (ctx.job?.id) {
            const channel = `job:${ctx.job.id}:events`;
            const wsMessage = JSON.stringify({
              data: todoData,
              type: "todo_list"
            });
            getRedisClientInstance().publish(channel, wsMessage);
          }
          return {
            message: `Created ${newTodos.length} todo items`,
            success: true,
            todos: newTodos
          };
        case "display":
          ctx.log.info(
            `Displaying ${currentTodos.length} todos via native interface`
          );
          const displayData = createTodoData(currentTodos, args.title);
          ctx.log.info("Todo list displayed via native interface");
          if (ctx.job?.id) {
            const channel = `job:${ctx.job.id}:events`;
            const wsMessage = JSON.stringify({
              data: displayData,
              type: "todo_list"
            });
            getRedisClientInstance().publish(channel, wsMessage);
          }
          return {
            message: `Displayed ${currentTodos.length} todo items`,
            success: true,
            todos: currentTodos
          };
        case "update":
          if (!args.itemId || !args.status) {
            return {
              error: "Item ID and status are required for update action"
            };
          }
          const todoIndex = currentTodos.findIndex(
            (todo) => todo.id === args.itemId
          );
          if (todoIndex === -1) {
            return { error: `Todo item with ID ${args.itemId} not found` };
          }
          currentTodos[todoIndex].status = args.status;
          todoStore.set(sessionKey, currentTodos);
          ctx.log.info(`Updated todo ${args.itemId} to status ${args.status}`);
          const updateData = createTodoData(currentTodos, args.title);
          ctx.log.info("Todo data updated for native interface");
          if (ctx.job?.id) {
            const channel = `job:${ctx.job.id}:events`;
            const wsMessage = JSON.stringify({
              data: updateData,
              type: "todo_list"
            });
            getRedisClientInstance().publish(channel, wsMessage);
          }
          return {
            message: `Updated todo item status to ${args.status}`,
            success: true,
            todos: currentTodos
          };
        default:
          return { error: `Unknown action: ${args.action}` };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      ctx.log.error(
        { err: error },
        `Error in manageTodoListTool: ${errorMessage}`
      );
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
