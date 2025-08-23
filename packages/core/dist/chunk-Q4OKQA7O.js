import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  clearSessionState,
  loadProjectState,
  saveProjectState
} from "./chunk-FG6D2ATS.js";
import {
  init_esm_shims
} from "./chunk-SB7UONON.js";

// src/modules/tools/definitions/system/todoStateManagement.ts
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
var TodoStateManager = class {
  projects = /* @__PURE__ */ new Map();
  tasks = /* @__PURE__ */ new Map();
  templateCache = /* @__PURE__ */ new Map();
  constructor() {
    this.initializeDefaults();
  }
  async clearAll(sessionKey) {
    this.tasks.set(sessionKey, []);
    const projectKeys = Array.from(this.projects.keys()).filter(
      (k) => k.startsWith(`${sessionKey}:`)
    );
    projectKeys.forEach((key) => this.projects.delete(key));
    await clearSessionState(sessionKey);
  }
  // Project operations
  async createProject(sessionKey, project) {
    const newProject = {
      ...project,
      createdAt: project.createdAt || Date.now(),
      id: project.id || this.generateId(),
      updatedAt: Date.now()
    };
    this.projects.set(`${sessionKey}:${newProject.id}`, newProject);
    await this.persistState(sessionKey);
    return newProject;
  }
  // Task operations
  async createTask(sessionKey, task) {
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
      await this.updateProjectTaskCount(sessionKey, newTask.projectId);
    }
    await this.persistState(sessionKey);
    return newTask;
  }
  async deleteTask(sessionKey, taskId) {
    const tasks = this.tasks.get(sessionKey) || [];
    const taskIndex = tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) {
      return false;
    }
    const task = tasks[taskIndex];
    tasks.splice(taskIndex, 1);
    this.tasks.set(sessionKey, tasks);
    if (task.projectId) {
      await this.updateProjectTaskCount(sessionKey, task.projectId);
    }
    await this.persistState(sessionKey);
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
  async initializeFromPersistence(sessionKey) {
    if (!this.tasks.has(sessionKey) && !Array.from(this.projects.keys()).some(
      (k) => k.startsWith(`${sessionKey}:`)
    )) {
      const loaded = await this.loadState(sessionKey);
      if (!loaded) {
        this.tasks.set(sessionKey, []);
      }
      return loaded;
    }
    return false;
  }
  async loadState(sessionKey) {
    try {
      const savedState = await loadProjectState(sessionKey);
      if (savedState) {
        this.tasks.set(sessionKey, savedState.tasks || []);
        if (savedState.project) {
          this.projects.set(
            `${sessionKey}:${savedState.project.id}`,
            savedState.project
          );
        }
        return true;
      }
    } catch (error) {
      console.error("Failed to load todo state:", error);
    }
    return false;
  }
  async updateProject(sessionKey, projectId, updates) {
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
    await this.persistState(sessionKey);
    return updatedProject;
  }
  async updateTask(sessionKey, taskId, updates) {
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
      await this.updateProjectProgress(sessionKey, oldTask.projectId);
    }
    await this.persistState(sessionKey);
    return updatedTask;
  }
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  initializeDefaults() {
  }
  // State persistence
  async persistState(sessionKey) {
    const tasks = this.tasks.get(sessionKey) || [];
    const projects = Array.from(this.projects.values()).filter(
      (p) => p && p.id && p.id.startsWith(sessionKey)
    );
    if (tasks.length > 0 || projects.length > 0) {
      const project = projects.length > 0 ? projects[0] : {
        completedTaskCount: 0,
        createdAt: Date.now(),
        description: "Auto-generated project",
        id: sessionKey,
        name: "Default Project",
        progress: 0,
        status: "planning",
        taskCount: 0,
        updatedAt: Date.now()
      };
      try {
        await saveProjectState(sessionKey, project, tasks);
      } catch (error) {
        console.error("Failed to persist todo state:", error);
      }
    }
  }
  async updateProjectProgress(sessionKey, projectId) {
    const tasks = this.getTasks(sessionKey, { projectId });
    const project = this.getProject(sessionKey, projectId);
    if (project && tasks.length > 0) {
      const completedTasks = tasks.filter(
        (t) => t.status === "completed"
      ).length;
      const progress = Math.round(completedTasks / tasks.length * 100);
      await this.updateProject(sessionKey, projectId, { progress });
    }
  }
  // Helper methods
  async updateProjectTaskCount(sessionKey, projectId) {
    const tasks = this.getTasks(sessionKey, { projectId });
    const project = this.getProject(sessionKey, projectId);
    if (project) {
      await this.updateProject(sessionKey, projectId, {
        completedTaskCount: tasks.filter((t) => t.status === "completed").length,
        taskCount: tasks.length
      });
    }
  }
};
var todoStateManager = new TodoStateManager();

export {
  TodoStateManager,
  todoStateManager
};
