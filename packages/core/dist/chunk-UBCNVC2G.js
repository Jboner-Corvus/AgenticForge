import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  getRedisClientInstance
} from "./chunk-HKREBWDH.js";
import {
  init_esm_shims
} from "./chunk-SB7UONON.js";

// src/modules/tools/definitions/system/todoWrite.tool.ts
init_esm_shims();
import { z } from "zod";
var todoItemSchema = z.object({
  id: z.string().describe("Unique identifier for the todo item"),
  content: z.string().describe("Description of the task"),
  status: z.enum(["pending", "in_progress", "completed"]).describe("Current status of the task")
});
var parameters = z.object({
  todos: z.array(todoItemSchema).describe("Array of todo items with their current status")
});
var todoWriteOutput = z.object({
  success: z.boolean(),
  message: z.string(),
  todos: z.array(todoItemSchema)
});
var globalTodoStore = /* @__PURE__ */ new Map();
var createSimpleTodoData = (todos, sessionKey) => {
  const stats = {
    pending: todos.filter((t) => t.status === "pending").length,
    in_progress: todos.filter((t) => t.status === "in_progress").length,
    completed: todos.filter((t) => t.status === "completed").length,
    total: todos.length
  };
  return {
    type: "claude_code_todo",
    sessionId: sessionKey,
    timestamp: Date.now(),
    title: "Todo List",
    todos,
    stats
  };
};
var todoWriteTool = {
  description: "Simple todo list management tool inspired by Claude Code. Directly updates and displays todos without complex session management. Use this for tracking tasks and progress in a clean, reliable way.",
  execute: async (args, ctx) => {
    const sessionKey = ctx.session?.name || ctx.job?.id || "default";
    try {
      ctx.log.info(
        `TodoWrite - Managing ${args.todos.length} todos for session ${sessionKey}`
      );
      globalTodoStore.set(sessionKey, args.todos);
      const todoData = createSimpleTodoData(args.todos, sessionKey);
      if (ctx.job?.id) {
        const channel = `job:${ctx.job.id}:events`;
        const wsMessage = JSON.stringify({
          type: "claude_code_todo",
          data: todoData
        });
        await getRedisClientInstance().publish(channel, wsMessage);
        ctx.log.info(`TodoWrite published to channel ${channel}`);
      }
      ctx.log.info(`TodoWrite - Updated todos:`, {
        total: args.todos.length,
        pending: todoData.stats.pending,
        in_progress: todoData.stats.in_progress,
        completed: todoData.stats.completed
      });
      return {
        success: true,
        message: `Todos updated successfully. ${todoData.stats.total} total tasks.`,
        todos: args.todos
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      ctx.log.error({ err: error }, `Error in todoWriteTool: ${errorMessage}`);
      return {
        success: false,
        message: `Failed to update todos: ${errorMessage}`,
        todos: []
      };
    }
  },
  name: "todo_write",
  parameters
};
var getTodosForSession = (sessionKey) => {
  return globalTodoStore.get(sessionKey) || [];
};
var todoWrite_tool_default = todoWriteTool;

export {
  parameters,
  todoWriteOutput,
  todoWriteTool,
  getTodosForSession,
  todoWrite_tool_default
};
