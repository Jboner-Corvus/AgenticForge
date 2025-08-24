import { z } from 'zod';

import type { Ctx, Tool } from '../../../../types.ts';

import {
  clearSessionState,
  createRecoveryPoint,
  isRecoveryNeeded,
  loadProjectState,
  saveProjectState,
} from '../../../../modules/persistence/projectPersistence.ts';
import { getRedisClientInstance } from '../../../../modules/redis/redisClient.ts';
import { sendToCanvas } from '../../../../utils/canvasUtils.ts';

// Enhanced schema for project items
const projectItemSchema = z.object({
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
    .optional()
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
    .optional()
    .describe('Priority level of the task'),
  projectId: z
    .string()
    .optional()
    .describe('ID of the project this task belongs to'),
  status: z
    .enum(['pending', 'in_progress', 'completed', 'blocked', 'cancelled'])
    .describe('Current status of the task'),
  tags: z.array(z.string()).optional().describe('Tags for categorization'),
  updatedAt: z.number().describe('Timestamp when task was last updated'),
});

// Schema for projects
const projectSchema = z.object({
  actualEndDate: z.number().optional().describe('Actual end date'),
  actualStartDate: z.number().optional().describe('Actual start date'),
  completedTasks: z.number().describe('Number of completed tasks'),
  createdAt: z.number().describe('Timestamp when project was created'),
  description: z.string().describe('Description of the project'),
  endDate: z.number().optional().describe('Planned end date'),
  id: z.string().describe('Unique identifier for the project'),
  name: z.string().describe('Name of the project'),
  progress: z.number().describe('Project progress percentage (0-100)'),
  startDate: z.number().optional().describe('Planned start date'),
  status: z
    .enum(['planning', 'in_progress', 'on_hold', 'completed', 'cancelled'])
    .describe('Current status of the project'),
  totalTasks: z.number().describe('Total number of tasks in the project'),
  updatedAt: z.number().describe('Timestamp when project was last updated'),
});

// Enhanced schema for the tool parameters
export const parameters = z.object({
  action: z
    .enum([
      'create_project',
      'update_project',
      'create_task',
      'update_task',
      'display',
      'clear',
      'generate_plan',
      'recover_state',
      'export_project',
      'import_project',
    ])
    .describe('Action to perform on the todo list or project'),
  project: projectSchema
    .optional()
    .describe('Project data for create/update actions'),
  projectId: z
    .string()
    .optional()
    .describe('ID of specific project to work with'),
  recoveryData: z.any().optional().describe('Data for state recovery'),
  status: z
    .enum(['pending', 'in_progress', 'completed', 'blocked', 'cancelled'])
    .optional()
    .describe('New status for update action'),
  taskId: z
    .string()
    .optional()
    .describe('ID of specific task to update (for update action)'),
  tasks: z
    .array(projectItemSchema)
    .optional()
    .describe('Array of task items for create/update actions'),
  title: z.string().optional().describe('Title for the todo list display'),
});

// Schema for the output
export const enhancedTodoListOutput = z.union([
  z.object({
    message: z.string(),
    project: projectSchema.optional(),
    recoveryStatus: z.string().optional(),
    success: z.boolean(),
    tasks: z.array(projectItemSchema).optional(),
  }),
  z.object({
    error: z.string(),
  }),
]);

// Type for the tool
type EnhancedTodoListTool = {
  execute: (
    args: z.infer<typeof parameters>,
    ctx: Ctx,
  ) => Promise<z.infer<typeof enhancedTodoListOutput>>;
} & Tool<typeof parameters, typeof enhancedTodoListOutput>;

// Enhanced store for maintaining state in memory (fallback)
const projectStore = new Map<
  string,
  undefined | z.infer<typeof projectSchema>
>();
const taskStore = new Map<string, Array<z.infer<typeof projectItemSchema>>>();
const templateSentStore = new Map<string, boolean>();

// Function to generate a unique ID
const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).substr(2);

// Function to initialize stores from persistent storage
const initializeFromPersistence = async (sessionKey: string) => {
  try {
    const savedState = await loadProjectState(sessionKey);
    if (savedState) {
      projectStore.set(sessionKey, savedState.project);
      taskStore.set(sessionKey, savedState.tasks);
      return true;
    }
  } catch (error) {
    console.error(
      'Error initializing from persistence for session ' + sessionKey + ':',
      error,
    );
  }
  return false;
};

// Function to create project data for the canvas
const createProjectData = (
  project: undefined | z.infer<typeof projectSchema>,
  tasks: Array<z.infer<typeof projectItemSchema>>,
  title?: string,
) => {
  return {
    isAgentInternal: true, // Mark as agent-generated to prevent automatic canvas display
    project,
    stats: {
      blocked: tasks.filter((t) => t.status === 'blocked').length,
      cancelled: tasks.filter((t) => t.status === 'cancelled').length,
      completed: tasks.filter((t) => t.status === 'completed').length,
      in_progress: tasks.filter((t) => t.status === 'in_progress').length,
      pending: tasks.filter((t) => t.status === 'pending').length,
      projectProgress: project ? project.progress : 0,
      total: tasks.length,
    },
    tasks: tasks.map((task) => ({
      actualTime: task.actualTime,
      assignedTo: task.assignedTo,
      category: task.category,
      content: task.content,
      createdAt: task.createdAt,
      dependencies: task.dependencies || [],
      estimatedTime: task.estimatedTime,
      id: task.id,
      parentId: task.parentId,
      priority: task.priority || 'medium',
      projectId: task.projectId,
      status: task.status,
      tags: task.tags || [],
      updatedAt: task.updatedAt,
    })),
    timestamp: Date.now(),
    title: title || (project ? project.name : 'Enhanced Todo List'),
    type: 'enhanced_todo_list',
  };
};

// Function to send todo data to chat header
const sendToChatHeader = async (
  ctx: Ctx,
  project: undefined | z.infer<typeof projectSchema>,
  tasks: Array<z.infer<typeof projectItemSchema>>,
  title?: string,
) => {
  if (!ctx.job?.id) {
    return;
  }

  try {
    const channel = `job:${ctx.job.id}:events`;
    const todoData = {
      data: {
        project,
        stats: {
          blocked: tasks.filter((t) => t.status === 'blocked').length,
          cancelled: tasks.filter((t) => t.status === 'cancelled').length,
          completed: tasks.filter((t) => t.status === 'completed').length,
          in_progress: tasks.filter((t) => t.status === 'in_progress').length,
          pending: tasks.filter((t) => t.status === 'pending').length,
          projectProgress: project ? project.progress : 0,
          total: tasks.length,
        },
        tasks: tasks.map((task) => ({
          actualTime: task.actualTime,
          assignedTo: task.assignedTo,
          category: task.category,
          content: task.content,
          createdAt: task.createdAt,
          dependencies: task.dependencies || [],
          estimatedTime: task.estimatedTime,
          id: task.id,
          parentId: task.parentId,
          priority: task.priority || 'medium',
          projectId: task.projectId,
          status: task.status,
          tags: task.tags || [],
          updatedAt: task.updatedAt,
        })),
        timestamp: Date.now(),
        title: title || (project ? project.name : 'Enhanced Todo List'),
        type: 'chat_header_todo', // New type for chat header integration
      },
      type: 'chat_header_todo',
    };

    await getRedisClientInstance().publish(channel, JSON.stringify(todoData));
    ctx.log.info('Enhanced todo data sent to chat header via Redis');
  } catch (error) {
    ctx.log.error(
      { err: error },
      'Failed to send enhanced todo data to chat header',
    );
  }
};

export const enhancedTodoListTool: EnhancedTodoListTool = {
  description:
    'Manages enhanced todo lists for complex projects with persistence and recovery capabilities. Supports project planning, task dependencies, time estimation, and real-time progress tracking.',
  execute: async (args, ctx) => {
    const sessionKey = ctx.session?.name || 'default';

    try {
      ctx.log.info('Managing enhanced todo list - Action: ' + args.action);

      // Initialize stores from persistence if needed
      if (!projectStore.has(sessionKey) && !taskStore.has(sessionKey)) {
        const initialized = await initializeFromPersistence(sessionKey);
        if (!initialized) {
          projectStore.set(sessionKey, undefined);
          taskStore.set(sessionKey, []);
        }
      }

      // Ensure stores exist
      if (!projectStore.has(sessionKey)) {
        projectStore.set(sessionKey, undefined);
      }
      if (!taskStore.has(sessionKey)) {
        taskStore.set(sessionKey, []);
      }

      const currentProject = projectStore.get(sessionKey);
      const currentTasks = taskStore.get(sessionKey);

      switch (args.action) {
        case 'clear':
          taskStore.set(sessionKey, []);
          projectStore.set(sessionKey, undefined);
          ctx.log.info('Cleared todo list and project');

          // Clear persistent storage
          try {
            await clearSessionState(sessionKey);
            ctx.log.info('Cleared persistent state for session ' + sessionKey);
          } catch (clearError) {
            ctx.log.error(
              { err: clearError },
              'Failed to clear persistent state for session ' + sessionKey,
            );
          }

          return {
            message: 'Todo list and project cleared',
            success: true,
          };

        case 'create_project':
          if (!args.project) {
            return {
              error: 'No project data provided for create_project action',
            };
          }

          const newProject = {
            ...args.project,
            completedTasks: args.project.completedTasks || 0,
            createdAt: args.project.createdAt || Date.now(),
            id: args.project.id || generateId(),
            progress: args.project.progress || 0,
            totalTasks: args.project.totalTasks || 0,
            updatedAt: args.project.updatedAt || Date.now(),
          };

          projectStore.set(sessionKey, newProject);
          // Save to persistent storage
          try {
            await saveProjectState(sessionKey, newProject, currentTasks || []);
            ctx.log.info(
              'Saved project state to persistent storage for session ' +
                sessionKey,
            );
          } catch (saveError) {
            ctx.log.error(
              { err: saveError },
              'Failed to save project state for session ' + sessionKey,
            );
          }
          ctx.log.info('Created project: ' + newProject.name);

          // Send to canvas
          if (ctx.job?.id) {
            // Send project data to canvas
            const projectData = createProjectData(
              newProject,
              currentTasks || [],
              args.title,
            );
            await sendToCanvas(ctx.job.id, JSON.stringify(projectData), 'text');
            ctx.log.info('Project data sent to canvas for visualization');
          }

          // Send to chat header
          await sendToChatHeader(
            ctx,
            newProject,
            currentTasks || [],
            args.title,
          );

          return {
            message: 'Project "' + newProject.name + '" created successfully',
            project: newProject,
            success: true,
            tasks: currentTasks,
          };

        case 'create_task':
          if (!args.tasks || args.tasks.length === 0) {
            return { error: 'No tasks provided for create_task action' };
          }

          const newTasks = args.tasks.map((task) => ({
            ...task,
            createdAt: task.createdAt || Date.now(),
            id: task.id || generateId(),
            updatedAt: task.updatedAt || Date.now(),
          }));

          const allTasks = [...(currentTasks || []), ...newTasks];
          taskStore.set(sessionKey, allTasks);

          // Update project stats if project exists
          let updatedProjectWithTasks = currentProject;
          if (currentProject !== undefined) {
            const totalTasks = allTasks.length;
            const completedTasks = allTasks.filter(
              (t) => t.status === 'completed',
            ).length;
            const progress =
              totalTasks > 0
                ? Math.round((completedTasks / totalTasks) * 100)
                : 0;

            updatedProjectWithTasks = {
              ...currentProject,
              completedTasks,
              progress,
              totalTasks,
              updatedAt: Date.now(),
            };

            projectStore.set(sessionKey, updatedProjectWithTasks);
          }

          // Save to persistent storage
          try {
            await saveProjectState(
              sessionKey,
              updatedProjectWithTasks,
              allTasks,
            );
            ctx.log.info(
              'Saved task state to persistent storage for session ' +
                sessionKey,
            );
          } catch (saveError) {
            ctx.log.error(
              { err: saveError },
              'Failed to save task state for session ' + sessionKey,
            );
          }
          ctx.log.info('Created ' + newTasks.length + ' tasks');

          // Send to canvas
          if (ctx.job?.id) {
            const projectData = createProjectData(
              updatedProjectWithTasks,
              allTasks,
              args.title,
            );
            await sendToCanvas(ctx.job.id, JSON.stringify(projectData), 'text');
            ctx.log.info('Task data sent to canvas for visualization');
          }

          // Send to chat header
          await sendToChatHeader(
            ctx,
            updatedProjectWithTasks,
            allTasks,
            args.title,
          );

          return {
            message: 'Created ' + newTasks.length + ' tasks successfully',
            project: updatedProjectWithTasks,
            success: true,
            tasks: allTasks,
          };

        case 'display':
          // Send to canvas
          if (ctx.job?.id) {
            const projectData = createProjectData(
              currentProject,
              currentTasks || [],
              args.title,
            );
            await sendToCanvas(ctx.job.id, JSON.stringify(projectData), 'text');
            ctx.log.info('Todo list data sent to canvas for visualization');
          }

          // Send to chat header
          await sendToChatHeader(
            ctx,
            currentProject,
            currentTasks || [],
            args.title,
          );

          return {
            message: 'Todo list displayed successfully',
            project: currentProject,
            success: true,
            tasks: currentTasks,
          };

        case 'update_project':
          if (!args.project) {
            return {
              error: 'No project data provided for update_project action',
            };
          }

          if (currentProject === undefined) {
            return {
              error: 'No project exists to update. Create a project first.',
            };
          }

          const updatedProject = {
            ...currentProject,
            ...args.project,
            id: currentProject.id, // Keep original ID
            updatedAt: Date.now(),
          };

          projectStore.set(sessionKey, updatedProject);
          // Save to persistent storage
          try {
            await saveProjectState(
              sessionKey,
              updatedProject,
              currentTasks || [],
            );
            ctx.log.info(
              'Saved updated project state to persistent storage for session ' +
                sessionKey,
            );
          } catch (saveError) {
            ctx.log.error(
              { err: saveError },
              'Failed to save updated project state for session ' + sessionKey,
            );
          }
          ctx.log.info('Updated project: ' + updatedProject.name);

          // Send to canvas
          if (ctx.job?.id) {
            const projectData = createProjectData(
              updatedProject,
              currentTasks || [],
              args.title,
            );
            await sendToCanvas(ctx.job.id, JSON.stringify(projectData), 'text');
            ctx.log.info(
              'Updated project data sent to canvas for visualization',
            );
          }

          // Send to chat header
          await sendToChatHeader(
            ctx,
            updatedProject,
            currentTasks || [],
            args.title,
          );

          return {
            message:
              'Project "' + updatedProject.name + '" updated successfully',
            project: updatedProject,
            success: true,
            tasks: currentTasks,
          };

        case 'update_task':
          if (!args.taskId) {
            return { error: 'No taskId provided for update_task action' };
          }

          if (!args.status) {
            return { error: 'No status provided for update_task action' };
          }

          const taskIndex = (currentTasks || []).findIndex(
            (t) => t.id === args.taskId,
          );
          if (taskIndex === -1) {
            return { error: 'Task with ID ' + args.taskId + ' not found' };
          }

          const updatedTask = {
            ...(currentTasks || [])[taskIndex],
            status: args.status,
            updatedAt: Date.now(),
          };

          const updatedTasks = [...(currentTasks || [])];
          updatedTasks[taskIndex] = updatedTask;
          taskStore.set(sessionKey, updatedTasks);

          // Update project stats if project exists
          let updatedProjectWithTask = currentProject;
          if (currentProject !== undefined) {
            const totalTasks = updatedTasks.length;
            const completedTasks = updatedTasks.filter(
              (t) => t.status === 'completed',
            ).length;
            const progress =
              totalTasks > 0
                ? Math.round((completedTasks / totalTasks) * 100)
                : 0;

            updatedProjectWithTask = {
              ...currentProject,
              completedTasks,
              progress,
              totalTasks,
              updatedAt: Date.now(),
            };

            projectStore.set(sessionKey, updatedProjectWithTask);
          }

          // Save to persistent storage
          try {
            await saveProjectState(
              sessionKey,
              updatedProjectWithTask,
              updatedTasks,
            );
            ctx.log.info(
              'Saved updated task state to persistent storage for session ' +
                sessionKey,
            );
          } catch (saveError) {
            ctx.log.error(
              { err: saveError },
              'Failed to save updated task state for session ' + sessionKey,
            );
          }
          ctx.log.info(
            'Updated task ' + args.taskId + ' to status ' + args.status,
          );

          // Send to canvas
          if (ctx.job?.id) {
            const projectData = createProjectData(
              updatedProjectWithTask,
              updatedTasks,
              args.title,
            );
            await sendToCanvas(ctx.job.id, JSON.stringify(projectData), 'text');
            ctx.log.info('Updated task data sent to canvas for visualization');
          }

          // Send to chat header
          await sendToChatHeader(
            ctx,
            updatedProjectWithTask,
            updatedTasks,
            args.title,
          );

          return {
            message:
              'Task "' + updatedTask.content + '" updated to ' + args.status,
            project: updatedProjectWithTask,
            success: true,
            tasks: updatedTasks,
          };

        case 'recover_state':
          try {
            const recoveryNeeded = await isRecoveryNeeded(sessionKey);
            ctx.log.info('Recovery needed: ' + recoveryNeeded);

            if (recoveryNeeded) {
              const savedState = await loadProjectState(sessionKey);
              if (savedState) {
                projectStore.set(sessionKey, savedState.project);
                taskStore.set(sessionKey, savedState.tasks);
                ctx.log.info('Recovered state for session ' + sessionKey);

                // Send to canvas
                if (ctx.job?.id) {
                  const projectData = createProjectData(
                    savedState.project,
                    savedState.tasks,
                    args.title,
                  );
                  await sendToCanvas(
                    ctx.job.id,
                    JSON.stringify(projectData),
                    'text',
                  );
                  ctx.log.info(
                    'Recovered state sent to canvas for visualization',
                  );
                }

                // Send to chat header
                await sendToChatHeader(
                  ctx,
                  savedState.project,
                  savedState.tasks,
                  args.title,
                );

                return {
                  message: 'State recovered successfully',
                  project: savedState.project,
                  recoveryStatus: 'Recovery was needed and completed',
                  success: true,
                  tasks: savedState.tasks,
                };
              } else {
                ctx.log.info('No saved state found for session ' + sessionKey);
                return {
                  message: 'No saved state found for recovery',
                  recoveryStatus: 'No previous state to recover',
                  success: true,
                };
              }
            } else {
              ctx.log.info('No recovery needed for session ' + sessionKey);
              return {
                message: 'State loaded successfully',
                project: currentProject,
                recoveryStatus: 'Recovery was not needed',
                success: true,
                tasks: currentTasks || [],
              };
            }
          } catch (recoverError) {
            const errorMessage =
              recoverError instanceof Error
                ? recoverError.message
                : String(recoverError);
            ctx.log.error(
              { err: recoverError },
              'Failed to recover state for session ' +
                sessionKey +
                ': ' +
                errorMessage,
            );
            return {
              error: 'Failed to recover state: ' + errorMessage,
            };
          }

        default:
          return { error: 'Unknown action: ' + args.action };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      ctx.log.error(
        { err: error },
        'Error in enhancedTodoListTool: ' + errorMessage,
      );
      return { error: 'Failed to manage enhanced todo list: ' + errorMessage };
    }
  },
  name: 'enhanced_todo_list',
  parameters,
};
