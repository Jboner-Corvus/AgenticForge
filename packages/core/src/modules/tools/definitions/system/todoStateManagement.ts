import { z } from 'zod';

import {
  clearSessionState,
  createRecoveryPoint,
  isRecoveryNeeded,
  loadProjectState,
  saveProjectState,
} from '../../../../modules/persistence/projectPersistence';

// Enhanced unified schema for todo items
const unifiedTodoItemSchema = z.object({
  actualTime: z.number().optional().describe('Actual time spent in minutes'),
  assignedTo: z
    .string()
    .optional()
    .describe('Agent or team assigned to this task'),
  category: z
    .string()
    .optional()
    .describe('Category or project the task belongs to'),
  content: z.string().describe('Description of the task'),
  createdAt: z.number().describe('Timestamp when task was created'),
  dependencies: z
    .array(z.string())
    .default([])
    .describe('IDs of tasks that must be completed before this one'),
  estimatedTime: z
    .number()
    .optional()
    .describe('Estimated time to complete in minutes'),
  id: z.string().describe('Unique identifier for the todo item'),
  parentId: z
    .string()
    .optional()
    .describe('ID of parent task for hierarchical tasks'),
  priority: z
    .enum(['low', 'medium', 'high', 'critical'])
    .default('medium')
    .describe('Priority level of the task'),
  progress: z
    .number()
    .min(0)
    .max(100)
    .default(0)
    .describe('Completion percentage'),
  projectId: z
    .string()
    .optional()
    .describe('ID of the project this task belongs to'),
  status: z
    .enum(['pending', 'in_progress', 'completed', 'blocked', 'cancelled'])
    .describe('Current status of the task'),
  tags: z.array(z.string()).default([]).describe('Tags for categorization'),
  updatedAt: z.number().describe('Timestamp when task was last updated'),
});

// Unified project schema
const unifiedProjectSchema = z.object({
  completedTaskCount: z
    .number()
    .default(0)
    .describe('Number of completed tasks'),
  createdAt: z.number().describe('Timestamp when project was created'),
  description: z.string().optional().describe('Description of the project'),
  endDate: z.number().optional().describe('Planned end date'),
  id: z.string().describe('Unique identifier for the project'),
  name: z.string().describe('Name of the project'),
  progress: z
    .number()
    .min(0)
    .max(100)
    .default(0)
    .describe('Project progress percentage'),
  startDate: z.number().optional().describe('Planned start date'),
  status: z
    .enum(['planning', 'active', 'on_hold', 'completed', 'cancelled'])
    .default('planning')
    .describe('Current status of the project'),
  taskCount: z.number().default(0).describe('Total number of tasks'),
  updatedAt: z.number().describe('Timestamp when project was last updated'),
});

// Unified state management class
export class TodoStateManager {
  private projects = new Map<string, z.infer<typeof unifiedProjectSchema>>();
  private tasks = new Map<
    string,
    Array<z.infer<typeof unifiedTodoItemSchema>>
  >();
  private templateCache = new Map<
    string,
    { content: string; timestamp: number }
  >();

  constructor() {
    this.initializeDefaults();
  }

  async clearAll(sessionKey: string) {
    this.tasks.set(sessionKey, []);
    // Clear projects for this session
    const projectKeys = Array.from(this.projects.keys()).filter((k) =>
      k.startsWith(`${sessionKey}:`),
    );
    projectKeys.forEach((key) => this.projects.delete(key));

    // Clear persistent state
    await clearSessionState(sessionKey);
  }

  // Project operations
  async createProject(
    sessionKey: string,
    project: z.infer<typeof unifiedProjectSchema>,
  ): Promise<z.infer<typeof unifiedProjectSchema>> {
    const newProject = {
      ...project,
      createdAt: project.createdAt || Date.now(),
      id: project.id || this.generateId(),
      updatedAt: Date.now(),
    };

    this.projects.set(`${sessionKey}:${newProject.id}`, newProject);

    // Persist state
    await this.persistState(sessionKey);

    return newProject;
  }

  // Task operations
  async createTask(
    sessionKey: string,
    task: z.infer<typeof unifiedTodoItemSchema>,
  ): Promise<z.infer<typeof unifiedTodoItemSchema>> {
    const tasks = this.tasks.get(sessionKey) || [];
    const newTask = {
      ...task,
      createdAt: task.createdAt || Date.now(),
      id: task.id || this.generateId(),
      updatedAt: Date.now(),
    };

    tasks.push(newTask);
    this.tasks.set(sessionKey, tasks);

    // Update project task count if applicable
    if (newTask.projectId) {
      await this.updateProjectTaskCount(sessionKey, newTask.projectId);
    }

    // Persist state
    await this.persistState(sessionKey);

    return newTask;
  }

  async deleteTask(sessionKey: string, taskId: string): Promise<boolean> {
    const tasks = this.tasks.get(sessionKey) || [];
    const taskIndex = tasks.findIndex((t) => t.id === taskId);

    if (taskIndex === -1) {
      return false;
    }

    const task = tasks[taskIndex];
    tasks.splice(taskIndex, 1);
    this.tasks.set(sessionKey, tasks);

    // Update project task count if applicable
    if (task.projectId) {
      await this.updateProjectTaskCount(sessionKey, task.projectId);
    }

    // Persist state
    await this.persistState(sessionKey);

    return true;
  }

  getProject(
    sessionKey: string,
    projectId: string,
  ): null | z.infer<typeof unifiedProjectSchema> {
    return this.projects.get(`${sessionKey}:${projectId}`) || null;
  }

  getStats(sessionKey: string, projectId?: string) {
    const tasks = this.getTasks(
      sessionKey,
      projectId ? { projectId } : undefined,
    );
    const project = projectId
      ? this.getProject(sessionKey, projectId)
      : undefined;

    return {
      blocked: tasks.filter((t) => t.status === 'blocked').length,
      cancelled: tasks.filter((t) => t.status === 'cancelled').length,
      completed: tasks.filter((t) => t.status === 'completed').length,
      in_progress: tasks.filter((t) => t.status === 'in_progress').length,
      pending: tasks.filter((t) => t.status === 'pending').length,
      projectProgress: project?.progress || 0,
      total: tasks.length,
    };
  }

  getTasks(
    sessionKey: string,
    filters?: any,
  ): Array<z.infer<typeof unifiedTodoItemSchema>> {
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

  async initializeFromPersistence(sessionKey: string) {
    // Check if we need to initialize from persistence
    if (
      !this.tasks.has(sessionKey) &&
      !Array.from(this.projects.keys()).some((k) =>
        k.startsWith(`${sessionKey}:`),
      )
    ) {
      const loaded = await this.loadState(sessionKey);
      if (!loaded) {
        // Initialize with empty state
        this.tasks.set(sessionKey, []);
      }
      return loaded;
    }
    return false;
  }

  async loadState(sessionKey: string) {
    try {
      const savedState = await loadProjectState(sessionKey);
      if (savedState) {
        this.tasks.set(sessionKey, savedState.tasks || []);
        if (savedState.project) {
          this.projects.set(
            `${sessionKey}:${savedState.project.id}`,
            savedState.project,
          );
        }
        return true;
      }
    } catch (error) {
      console.error('Failed to load todo state:', error);
    }
    return false;
  }

  async updateProject(
    sessionKey: string,
    projectId: string,
    updates: Partial<z.infer<typeof unifiedProjectSchema>>,
  ): Promise<null | z.infer<typeof unifiedProjectSchema>> {
    const projectKey = `${sessionKey}:${projectId}`;
    const project = this.projects.get(projectKey);

    if (!project) {
      return null;
    }

    const updatedProject = {
      ...project,
      ...updates,
      updatedAt: Date.now(),
    };

    this.projects.set(projectKey, updatedProject);

    // Persist state
    await this.persistState(sessionKey);

    return updatedProject;
  }

  async updateTask(
    sessionKey: string,
    taskId: string,
    updates: Partial<z.infer<typeof unifiedTodoItemSchema>>,
  ): Promise<null | z.infer<typeof unifiedTodoItemSchema>> {
    const tasks = this.tasks.get(sessionKey) || [];
    const taskIndex = tasks.findIndex((t) => t.id === taskId);

    if (taskIndex === -1) {
      return null;
    }

    const oldTask = tasks[taskIndex];
    const updatedTask = {
      ...oldTask,
      ...updates,
      updatedAt: Date.now(),
    };

    tasks[taskIndex] = updatedTask;
    this.tasks.set(sessionKey, tasks);

    // Update project progress if task status changed
    if (updates.status && oldTask.projectId) {
      await this.updateProjectProgress(sessionKey, oldTask.projectId);
    }

    // Persist state
    await this.persistState(sessionKey);

    return updatedTask;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private initializeDefaults() {
    // Initialize with default session if needed
  }

  // State persistence
  private async persistState(sessionKey: string) {
    const tasks = this.tasks.get(sessionKey) || [];
    const projects = Array.from(this.projects.values()).filter(
      (p) => p && p.id && p.id.startsWith(sessionKey),
    );

    // Only persist if we have data
    if (tasks.length > 0 || projects.length > 0) {
      // Get the first project if available, or create a default one
      const project =
        projects.length > 0
          ? projects[0]
          : {
              completedTaskCount: 0,
              createdAt: Date.now(),
              description: 'Auto-generated project',
              id: sessionKey,
              name: 'Default Project',
              progress: 0,
              status: 'planning' as const,
              taskCount: 0,
              updatedAt: Date.now(),
            };

      try {
        await saveProjectState(sessionKey, project, tasks);
      } catch (error) {
        console.error('Failed to persist todo state:', error);
      }
    }
  }

  private async updateProjectProgress(sessionKey: string, projectId: string) {
    const tasks = this.getTasks(sessionKey, { projectId });
    const project = this.getProject(sessionKey, projectId);

    if (project && tasks.length > 0) {
      const completedTasks = tasks.filter(
        (t) => t.status === 'completed',
      ).length;
      const progress = Math.round((completedTasks / tasks.length) * 100);

      await this.updateProject(sessionKey, projectId, { progress });
    }
  }

  // Helper methods
  private async updateProjectTaskCount(sessionKey: string, projectId: string) {
    const tasks = this.getTasks(sessionKey, { projectId });
    const project = this.getProject(sessionKey, projectId);

    if (project) {
      await this.updateProject(sessionKey, projectId, {
        completedTaskCount: tasks.filter((t) => t.status === 'completed')
          .length,
        taskCount: tasks.length,
      });
    }
  }
}

// Global state manager instance
export const todoStateManager = new TodoStateManager();
