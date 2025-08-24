import { z } from 'zod';

import type { Ctx, Tool } from '../../../../types.ts';

// Removed canvasUtils import - using postMessage for Mission Control integration
import { getRedisClientInstance } from '../../../../modules/redis/redisClient.ts';

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

// Unified parameters schema
export const unifiedTodoParameters = z.object({
  action: z
    .enum([
      'create_task',
      'update_task',
      'delete_task',
      'create_project',
      'update_project',
      'delete_project',
      'display',
      'clear_all',
      'get_stats',
      'batch_update',
    ])
    .describe('Action to perform on todos/projects'),

  // Filters
  filters: z
    .object({
      assignedTo: z.string().optional(),
      priority: z.array(z.string()).optional(),
      projectId: z.string().optional(),
      status: z.array(z.string()).optional(),
    })
    .optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  progress: z.number().min(0).max(100).optional(),

  // Project operations
  project: unifiedProjectSchema
    .optional()
    .describe('Project data for create/update operations'),
  projectId: z
    .string()
    .optional()
    .describe('ID of specific project to operate on'),

  // Update fields
  status: z
    .enum(['pending', 'in_progress', 'completed', 'blocked', 'cancelled'])
    .optional(),
  // Task operations
  task: unifiedTodoItemSchema
    .optional()
    .describe('Task data for create/update operations'),
  taskId: z.string().optional().describe('ID of specific task to operate on'),

  tasks: z
    .array(unifiedTodoItemSchema)
    .optional()
    .describe('Multiple tasks for batch operations'),
  templateVersion: z
    .enum(['minimal', 'standard', 'full'])
    .optional()
    .describe('Template complexity level'),

  // Display options
  title: z.string().optional().describe('Custom title for display'),
});

// Unified output schema
export const unifiedTodoOutput = z.union([
  z.object({
    message: z.string(),
    operation: z.string().optional(),
    project: unifiedProjectSchema.optional(),
    stats: z
      .object({
        blocked: z.number(),
        cancelled: z.number(),
        completed: z.number(),
        in_progress: z.number(),
        pending: z.number(),
        projectProgress: z.number().optional(),
        total: z.number(),
      })
      .optional(),
    success: z.boolean(),
    tasks: z.array(unifiedTodoItemSchema).optional(),
  }),
  z.object({
    error: z.string(),
  }),
]);

// Unified state management
class UnifiedTodoManager {
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

  clearAll(sessionKey: string) {
    this.tasks.set(sessionKey, []);
    // Clear projects for this session
    const projectKeys = Array.from(this.projects.keys()).filter((k) =>
      k.startsWith(`${sessionKey}:`),
    );
    projectKeys.forEach((key) => this.projects.delete(key));
  }

  // Project operations
  createProject(
    sessionKey: string,
    project: z.infer<typeof unifiedProjectSchema>,
  ): z.infer<typeof unifiedProjectSchema> {
    const newProject = {
      ...project,
      createdAt: project.createdAt || Date.now(),
      id: project.id || this.generateId(),
      updatedAt: Date.now(),
    };

    this.projects.set(`${sessionKey}:${newProject.id}`, newProject);
    return newProject;
  }

  // Task operations
  createTask(
    sessionKey: string,
    task: z.infer<typeof unifiedTodoItemSchema>,
  ): z.infer<typeof unifiedTodoItemSchema> {
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
      this.updateProjectTaskCount(sessionKey, newTask.projectId);
    }

    return newTask;
  }

  deleteTask(sessionKey: string, taskId: string): boolean {
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
      this.updateProjectTaskCount(sessionKey, task.projectId);
    }

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

  updateProject(
    sessionKey: string,
    projectId: string,
    updates: Partial<z.infer<typeof unifiedProjectSchema>>,
  ): null | z.infer<typeof unifiedProjectSchema> {
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
    return updatedProject;
  }

  updateTask(
    sessionKey: string,
    taskId: string,
    updates: Partial<z.infer<typeof unifiedTodoItemSchema>>,
  ): null | z.infer<typeof unifiedTodoItemSchema> {
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
      this.updateProjectProgress(sessionKey, oldTask.projectId);
    }

    return updatedTask;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private initializeDefaults() {
    // Initialize with default session if needed
  }

  private updateProjectProgress(sessionKey: string, projectId: string) {
    const tasks = this.getTasks(sessionKey, { projectId });
    const project = this.getProject(sessionKey, projectId);

    if (project && tasks.length > 0) {
      const completedTasks = tasks.filter(
        (t) => t.status === 'completed',
      ).length;
      const progress = Math.round((completedTasks / tasks.length) * 100);

      this.updateProject(sessionKey, projectId, { progress });
    }
  }

  // Helper methods
  private updateProjectTaskCount(sessionKey: string, projectId: string) {
    const tasks = this.getTasks(sessionKey, { projectId });
    const project = this.getProject(sessionKey, projectId);

    if (project) {
      this.updateProject(sessionKey, projectId, {
        completedTaskCount: tasks.filter((t) => t.status === 'completed')
          .length,
        taskCount: tasks.length,
      });
    }
  }
}

// Global manager instance
const todoManager = new UnifiedTodoManager();

// Export for testing purposes
export { todoManager };

// Optimized template generation with caching
const generateOptimizedTemplate = (
  templateVersion: string,
  data: any,
): string => {
  const cacheKey = `${templateVersion}:${data.timestamp}`;
  const cached = todoManager['templateCache'].get(cacheKey);

  if (cached && Date.now() - cached.timestamp < 300000) {
    // 5 minutes cache
    return cached.content;
  }

  let template: string;

  switch (templateVersion) {
    case 'full':
      template = generateFullTemplate(data);
      break;
    case 'minimal':
      template = generateMinimalTemplate(data);
      break;
    default:
      template = generateStandardTemplate(data);
  }

  todoManager['templateCache'].set(cacheKey, {
    content: template,
    timestamp: Date.now(),
  });
  return template;
};

const generateMinimalTemplate = (data: any): string => {
  return `
    <div style="font-family: system-ui; padding: 20px; max-width: 800px; margin: 0 auto;">
      <h2>${data.title || 'Todo List'}</h2>
      <div style="margin-bottom: 20px;">
        <strong>Stats:</strong> ${data.stats.total} tasks (${data.stats.completed} completed)
      </div>
      <div>
        ${data.tasks
          .map(
            (task: any) => `
          <div style="padding: 10px; border-left: 3px solid ${task.status === 'completed' ? '#22c55e' : '#f59e0b'}; margin-bottom: 10px;">
            <strong>${task.content}</strong>
            <div style="font-size: 12px; color: #666;">${task.status} | ${task.priority}</div>
          </div>
        `,
          )
          .join('')}
      </div>
    </div>
  `;
};

const generateStandardTemplate = (data: any): string => {
  // Optimized standard template (reduced from 500+ lines)
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${data.title || 'AgenticForge Todo List'}</title>
  <style>
    body { font-family: system-ui; margin: 0; padding: 20px; background: #f8fafc; }
    .container { max-width: 1000px; margin: 0 auto; background: white; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .header { text-align: center; margin-bottom: 32px; }
    .title { font-size: 28px; font-weight: bold; margin: 0; color: #1f2937; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin: 24px 0; }
    .stat { text-align: center; padding: 16px; border-radius: 8px; background: #f9fafb; }
    .stat-value { font-size: 24px; font-weight: bold; margin-bottom: 4px; }
    .task-item { padding: 16px; margin-bottom: 12px; border-radius: 8px; border-left: 4px solid #e5e7eb; background: #fafafa; }
    .task-pending { border-left-color: #f59e0b; }
    .task-progress { border-left-color: #3b82f6; }
    .task-completed { border-left-color: #10b981; opacity: 0.8; }
    .task-blocked { border-left-color: #ef4444; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="title">${data.title || 'AgenticForge Todo List'}</h1>
      <div class="stats">
        <div class="stat"><div class="stat-value" style="color: #f59e0b;">${data.stats.pending}</div><div>Pending</div></div>
        <div class="stat"><div class="stat-value" style="color: #3b82f6;">${data.stats.in_progress}</div><div>In Progress</div></div>
        <div class="stat"><div class="stat-value" style="color: #10b981;">${data.stats.completed}</div><div>Completed</div></div>
      </div>
    </div>
    <div>
      ${data.tasks
        .map(
          (task: any) => `
        <div class="task-item task-${task.status}">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong>${task.content}</strong>
              <div style="font-size: 12px; color: #666; margin-top: 4px;">
                Status: ${task.status} | Priority: ${task.priority}${task.category ? ' | Category: ' + task.category : ''}
              </div>
            </div>
            <div style="text-align: right; font-size: 12px; color: #888;">
              ${task.progress}% complete
            </div>
          </div>
        </div>
      `,
        )
        .join('')}
    </div>
  </div>
</body>
</html>`;
};

const generateFullTemplate = (data: any): string => {
  // Full interactive template with all features
  return (
    generateStandardTemplate(data) +
    `
    <script>

    </script>
  `
  );
};

// Main tool implementation
export const unifiedTodoListTool: Tool<
  typeof unifiedTodoParameters,
  typeof unifiedTodoOutput
> = {
  description:
    'Unified todo and project management tool with optimized performance and advanced features. Consolidates all todo functionality with smart caching and real-time updates.',
  execute: async (args, ctx): Promise<z.infer<typeof unifiedTodoOutput>> => {
    const sessionKey = ctx.session?.name || 'default';

    try {
      ctx.log.info(`Unified todo operation: ${args.action}`);

      switch (args.action) {
        case 'clear_all': {
          todoManager.clearAll(sessionKey);

          ctx.log.info('Cleared all todos and projects');
          return {
            message: 'All todos and projects cleared',
            operation: 'clear_all',
            stats: {
              blocked: 0,
              cancelled: 0,
              completed: 0,
              in_progress: 0,
              pending: 0,
              total: 0,
            },
            success: true,
            tasks: [],
          };
        }

        case 'create_task': {
          if (!args.task) {
            return { error: 'Task data required for create_task action' };
          }

          const newTask = todoManager.createTask(sessionKey, args.task);
          const tasks = todoManager.getTasks(sessionKey);
          const stats = todoManager.getStats(sessionKey);

          // Send todo data to Mission Control frontend via postMessage
          if (typeof window !== 'undefined' && window.postMessage) {
            const todoMessage = {
              data: {
                isAgentInternal: true, // Mark as agent-generated to prevent automatic canvas display
                stats: stats,
                timestamp: Date.now(),
                title: args.title || 'Mission Control',
                todos: tasks,
                type: 'unified_todo',  // Changed from 'todo_list' to 'unified_todo'
              },
              type: 'unified_todo',  // Changed from 'todo_list' to 'unified_todo'
            };
            window.postMessage(todoMessage, '*');
          }

          ctx.log.info(`Created task: ${newTask.content}`);
          return {
            message: `Task created successfully`,
            operation: 'create_task',
            stats,
            success: true,
            tasks: [newTask],
          };
        }

        case 'display': {
          const tasks = todoManager.getTasks(sessionKey, args.filters);
          const stats = todoManager.getStats(sessionKey);

          // Send display data to Mission Control frontend via postMessage
          if (typeof window !== 'undefined' && window.postMessage) {
            const todoMessage = {
              data: {
                isAgentInternal: true, // Mark as agent-generated to prevent automatic canvas display
                stats: stats,
                timestamp: Date.now(),
                title: args.title || 'Mission Control',
                todos: tasks,
                type: 'unified_todo',  // Changed from 'todo_list' to 'unified_todo'
              },
              type: 'unified_todo',  // Changed from 'todo_list' to 'unified_todo'
            };
            window.postMessage(todoMessage, '*');
          }

          ctx.log.info(`Displayed ${tasks.length} tasks`);
          return {
            message: `Displaying ${tasks.length} tasks`,
            operation: 'display',
            stats,
            success: true,
            tasks,
          };
        }

        case 'get_stats': {
          const stats = todoManager.getStats(sessionKey, args.projectId);
          const tasks = todoManager.getTasks(
            sessionKey,
            args.projectId ? { projectId: args.projectId } : undefined,
          );

          return {
            message: `Retrieved stats for ${tasks.length} tasks`,
            operation: 'get_stats',
            stats,
            success: true,
            tasks,
          };
        }

        case 'update_task': {
          if (!args.taskId) {
            return { error: 'Task ID required for update_task action' };
          }

          const updates: any = {};
          if (args.status) updates.status = args.status;
          if (args.priority) updates.priority = args.priority;
          if (args.progress !== undefined) updates.progress = args.progress;

          const updatedTask = todoManager.updateTask(
            sessionKey,
            args.taskId,
            updates,
          );
          if (!updatedTask) {
            return { error: `Task with ID ${args.taskId} not found` };
          }

          const tasks = todoManager.getTasks(sessionKey);
          const stats = todoManager.getStats(sessionKey);

          // Send update to Mission Control frontend via postMessage
          if (typeof window !== 'undefined' && window.postMessage) {
            const todoMessage = {
              data: {
                isAgentInternal: true, // Mark as agent-generated to prevent automatic canvas display
                stats: stats,
                timestamp: Date.now(),
                title: args.title || 'Mission Control',
                todos: tasks,
                type: 'unified_todo',  // Changed from 'todo_list' to 'unified_todo'
              },
              type: 'unified_todo',  // Changed from 'todo_list' to 'unified_todo'
            };
            window.postMessage(todoMessage, '*');
          }

          ctx.log.info(
            `Updated task ${args.taskId}: ${Object.keys(updates).join(', ')}`,
          );
          return {
            message: `Task updated successfully`,
            operation: 'update_task',
            stats,
            success: true,
            tasks: [updatedTask],
          };
        }

        default:
          return { error: `Unknown action: ${args.action}` };
      }
    } catch (error) {
      ctx.log.error('Error in unified todo tool:', error);
      return { error: `Tool execution failed: ${error}` };
    }
  },
  name: 'unified_todo_list',

  parameters: unifiedTodoParameters,
};
