import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  init_esm_shims
} from "./chunk-SB7UONON.js";

// src/modules/tools/definitions/system/unifiedTodoList.tool.ts
init_esm_shims();
import { z } from "zod";
var unifiedTodoItemSchema = z.object({
  actualTime: z.number().optional().describe("Actual time spent in minutes"),
  assignedTo: z.string().optional().describe("Agent or team assigned to this task"),
  category: z.string().optional().describe("Category or project the task belongs to"),
  content: z.string().describe("Description of the task"),
  createdAt: z.number().describe("Timestamp when task was created"),
  dependencies: z.array(z.string()).default([]).describe("IDs of tasks that must be completed before this one"),
  estimatedTime: z.number().optional().describe("Estimated time to complete in minutes"),
  id: z.string().describe("Unique identifier for the todo item"),
  parentId: z.string().optional().describe("ID of parent task for hierarchical tasks"),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium").describe("Priority level of the task"),
  progress: z.number().min(0).max(100).default(0).describe("Completion percentage"),
  projectId: z.string().optional().describe("ID of the project this task belongs to"),
  status: z.enum(["pending", "in_progress", "completed", "blocked", "cancelled"]).describe("Current status of the task"),
  tags: z.array(z.string()).default([]).describe("Tags for categorization"),
  updatedAt: z.number().describe("Timestamp when task was last updated")
});
var unifiedProjectSchema = z.object({
  completedTaskCount: z.number().default(0).describe("Number of completed tasks"),
  createdAt: z.number().describe("Timestamp when project was created"),
  description: z.string().optional().describe("Description of the project"),
  endDate: z.number().optional().describe("Planned end date"),
  id: z.string().describe("Unique identifier for the project"),
  name: z.string().describe("Name of the project"),
  progress: z.number().min(0).max(100).default(0).describe("Project progress percentage"),
  startDate: z.number().optional().describe("Planned start date"),
  status: z.enum(["planning", "active", "on_hold", "completed", "cancelled"]).default("planning").describe("Current status of the project"),
  taskCount: z.number().default(0).describe("Total number of tasks"),
  updatedAt: z.number().describe("Timestamp when project was last updated")
});
var unifiedTodoParameters = z.object({
  action: z.enum([
    "create_task",
    "update_task",
    "delete_task",
    "create_project",
    "update_project",
    "delete_project",
    "display",
    "clear_all",
    "get_stats",
    "batch_update"
  ]).describe("Action to perform on todos/projects"),
  // Filters
  filters: z.object({
    assignedTo: z.string().optional(),
    priority: z.array(z.string()).optional(),
    projectId: z.string().optional(),
    status: z.array(z.string()).optional()
  }).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  progress: z.number().min(0).max(100).optional(),
  // Project operations
  project: unifiedProjectSchema.optional().describe("Project data for create/update operations"),
  projectId: z.string().optional().describe("ID of specific project to operate on"),
  // Update fields
  status: z.enum(["pending", "in_progress", "completed", "blocked", "cancelled"]).optional(),
  // Task operations
  task: unifiedTodoItemSchema.optional().describe("Task data for create/update operations"),
  taskId: z.string().optional().describe("ID of specific task to operate on"),
  tasks: z.array(unifiedTodoItemSchema).optional().describe("Multiple tasks for batch operations"),
  templateVersion: z.enum(["minimal", "standard", "full"]).optional().describe("Template complexity level"),
  // Display options
  title: z.string().optional().describe("Custom title for display")
});
var unifiedTodoOutput = z.union([
  z.object({
    message: z.string(),
    operation: z.string().optional(),
    project: unifiedProjectSchema.optional(),
    stats: z.object({
      blocked: z.number(),
      cancelled: z.number(),
      completed: z.number(),
      in_progress: z.number(),
      pending: z.number(),
      projectProgress: z.number().optional(),
      total: z.number()
    }).optional(),
    success: z.boolean(),
    tasks: z.array(unifiedTodoItemSchema).optional()
  }),
  z.object({
    error: z.string()
  })
]);
var UnifiedTodoManager = class {
  projects = /* @__PURE__ */ new Map();
  tasks = /* @__PURE__ */ new Map();
  templateCache = /* @__PURE__ */ new Map();
  constructor() {
    this.initializeDefaults();
  }
  clearAll(sessionKey) {
    this.tasks.set(sessionKey, []);
    const projectKeys = Array.from(this.projects.keys()).filter(
      (k) => k.startsWith(`${sessionKey}:`)
    );
    projectKeys.forEach((key) => this.projects.delete(key));
  }
  // Project operations
  createProject(sessionKey, project) {
    const newProject = {
      ...project,
      createdAt: project.createdAt || Date.now(),
      id: project.id || this.generateId(),
      updatedAt: Date.now()
    };
    this.projects.set(`${sessionKey}:${newProject.id}`, newProject);
    return newProject;
  }
  // Task operations
  createTask(sessionKey, task) {
    const tasks = this.tasks.get(sessionKey) || [];
    const newTask = {
      ...task,
      createdAt: task.createdAt || Date.now(),
      id: task.id || this.generateId(),
      updatedAt: Date.now()
    };
    tasks.push(newTask);
    this.tasks.set(sessionKey, tasks);
    if (newTask.projectId) {
      this.updateProjectTaskCount(sessionKey, newTask.projectId);
    }
    return newTask;
  }
  deleteTask(sessionKey, taskId) {
    const tasks = this.tasks.get(sessionKey) || [];
    const taskIndex = tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) {
      return false;
    }
    const task = tasks[taskIndex];
    tasks.splice(taskIndex, 1);
    this.tasks.set(sessionKey, tasks);
    if (task.projectId) {
      this.updateProjectTaskCount(sessionKey, task.projectId);
    }
    return true;
  }
  getProject(sessionKey, projectId) {
    return this.projects.get(`${sessionKey}:${projectId}`) || null;
  }
  getStats(sessionKey, projectId) {
    const tasks = this.getTasks(
      sessionKey,
      projectId ? { projectId } : void 0
    );
    const project = projectId ? this.getProject(sessionKey, projectId) : void 0;
    return {
      blocked: tasks.filter((t) => t.status === "blocked").length,
      cancelled: tasks.filter((t) => t.status === "cancelled").length,
      completed: tasks.filter((t) => t.status === "completed").length,
      in_progress: tasks.filter((t) => t.status === "in_progress").length,
      pending: tasks.filter((t) => t.status === "pending").length,
      projectProgress: project?.progress || 0,
      total: tasks.length
    };
  }
  getTasks(sessionKey, filters) {
    let tasks = this.tasks.get(sessionKey) || [];
    if (filters) {
      if (filters.status) {
        tasks = tasks.filter((t) => filters.status.includes(t.status));
      }
      if (filters.priority) {
        tasks = tasks.filter((t) => filters.priority.includes(t.priority));
      }
      if (filters.projectId) {
        tasks = tasks.filter((t) => t.projectId === filters.projectId);
      }
      if (filters.assignedTo) {
        tasks = tasks.filter((t) => t.assignedTo === filters.assignedTo);
      }
    }
    return tasks;
  }
  updateProject(sessionKey, projectId, updates) {
    const projectKey = `${sessionKey}:${projectId}`;
    const project = this.projects.get(projectKey);
    if (!project) {
      return null;
    }
    const updatedProject = {
      ...project,
      ...updates,
      updatedAt: Date.now()
    };
    this.projects.set(projectKey, updatedProject);
    return updatedProject;
  }
  updateTask(sessionKey, taskId, updates) {
    const tasks = this.tasks.get(sessionKey) || [];
    const taskIndex = tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) {
      return null;
    }
    const oldTask = tasks[taskIndex];
    const updatedTask = {
      ...oldTask,
      ...updates,
      updatedAt: Date.now()
    };
    tasks[taskIndex] = updatedTask;
    this.tasks.set(sessionKey, tasks);
    if (updates.status && oldTask.projectId) {
      this.updateProjectProgress(sessionKey, oldTask.projectId);
    }
    return updatedTask;
  }
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  initializeDefaults() {
  }
  updateProjectProgress(sessionKey, projectId) {
    const tasks = this.getTasks(sessionKey, { projectId });
    const project = this.getProject(sessionKey, projectId);
    if (project && tasks.length > 0) {
      const completedTasks = tasks.filter(
        (t) => t.status === "completed"
      ).length;
      const progress = Math.round(completedTasks / tasks.length * 100);
      this.updateProject(sessionKey, projectId, { progress });
    }
  }
  // Helper methods
  updateProjectTaskCount(sessionKey, projectId) {
    const tasks = this.getTasks(sessionKey, { projectId });
    const project = this.getProject(sessionKey, projectId);
    if (project) {
      this.updateProject(sessionKey, projectId, {
        completedTaskCount: tasks.filter((t) => t.status === "completed").length,
        taskCount: tasks.length
      });
    }
  }
};
var todoManager = new UnifiedTodoManager();
var unifiedTodoListTool = {
  description: "Unified todo and project management tool with optimized performance and advanced features. Consolidates all todo functionality with smart caching and real-time updates.",
  execute: async (args, ctx) => {
    const sessionKey = ctx.session?.name || "default";
    try {
      ctx.log.info(`Unified todo operation: ${args.action}`);
      switch (args.action) {
        case "clear_all": {
          todoManager.clearAll(sessionKey);
          ctx.log.info("Cleared all todos and projects");
          return {
            message: "All todos and projects cleared",
            operation: "clear_all",
            stats: {
              blocked: 0,
              cancelled: 0,
              completed: 0,
              in_progress: 0,
              pending: 0,
              total: 0
            },
            success: true,
            tasks: []
          };
        }
        case "create_task": {
          if (!args.task) {
            return { error: "Task data required for create_task action" };
          }
          const newTask = todoManager.createTask(sessionKey, args.task);
          const tasks = todoManager.getTasks(sessionKey);
          const stats = todoManager.getStats(sessionKey);
          if (typeof window !== "undefined" && window.postMessage) {
            const todoMessage = {
              data: {
                stats,
                timestamp: Date.now(),
                title: args.title || "Mission Control",
                todos: tasks,
                type: "todo_list"
              },
              type: "todo_list"
            };
            window.postMessage(todoMessage, "*");
          }
          ctx.log.info(`Created task: ${newTask.content}`);
          return {
            message: `Task created successfully`,
            operation: "create_task",
            stats,
            success: true,
            tasks: [newTask]
          };
        }
        case "display": {
          const tasks = todoManager.getTasks(sessionKey, args.filters);
          const stats = todoManager.getStats(sessionKey);
          if (typeof window !== "undefined" && window.postMessage) {
            const todoMessage = {
              data: {
                stats,
                timestamp: Date.now(),
                title: args.title || "Mission Control",
                todos: tasks,
                type: "todo_list"
              },
              type: "todo_list"
            };
            window.postMessage(todoMessage, "*");
          }
          ctx.log.info(`Displayed ${tasks.length} tasks`);
          return {
            message: `Displaying ${tasks.length} tasks`,
            operation: "display",
            stats,
            success: true,
            tasks
          };
        }
        case "get_stats": {
          const stats = todoManager.getStats(sessionKey, args.projectId);
          const tasks = todoManager.getTasks(
            sessionKey,
            args.projectId ? { projectId: args.projectId } : void 0
          );
          return {
            message: `Retrieved stats for ${tasks.length} tasks`,
            operation: "get_stats",
            stats,
            success: true,
            tasks
          };
        }
        case "update_task": {
          if (!args.taskId) {
            return { error: "Task ID required for update_task action" };
          }
          const updates = {};
          if (args.status) updates.status = args.status;
          if (args.priority) updates.priority = args.priority;
          if (args.progress !== void 0) updates.progress = args.progress;
          const updatedTask = todoManager.updateTask(
            sessionKey,
            args.taskId,
            updates
          );
          if (!updatedTask) {
            return { error: `Task with ID ${args.taskId} not found` };
          }
          const tasks = todoManager.getTasks(sessionKey);
          const stats = todoManager.getStats(sessionKey);
          if (typeof window !== "undefined" && window.postMessage) {
            const todoMessage = {
              data: {
                stats,
                timestamp: Date.now(),
                title: args.title || "Mission Control",
                todos: tasks,
                type: "todo_list"
              },
              type: "todo_list"
            };
            window.postMessage(todoMessage, "*");
          }
          ctx.log.info(
            `Updated task ${args.taskId}: ${Object.keys(updates).join(", ")}`
          );
          return {
            message: `Task updated successfully`,
            operation: "update_task",
            stats,
            success: true,
            tasks: [updatedTask]
          };
        }
        default:
          return { error: `Unknown action: ${args.action}` };
      }
    } catch (error) {
      ctx.log.error("Error in unified todo tool:", error);
      return { error: `Tool execution failed: ${error}` };
    }
  },
  name: "unified_todo_list",
  parameters: unifiedTodoParameters
};

export {
  unifiedTodoParameters,
  unifiedTodoOutput,
  todoManager,
  unifiedTodoListTool
};
