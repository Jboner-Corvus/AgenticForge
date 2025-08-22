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

// src/modules/tools/definitions/system/enhancedTodoList.tool.ts
init_esm_shims();
import { z } from "zod";

// src/modules/persistence/projectPersistence.ts
init_esm_shims();
var PERSISTENCE_KEY_PREFIX = "agenticforge:project_state:";
async function saveProjectState(sessionId, project, tasks) {
  try {
    const redis = getRedisClientInstance();
    const key = `${PERSISTENCE_KEY_PREFIX}${sessionId}`;
    const state = {
      project,
      tasks,
      timestamp: Date.now(),
      sessionId,
      lastActivity: Date.now()
    };
    await redis.setex(key, 7 * 24 * 60 * 60, JSON.stringify(state));
    console.log(`[PERSISTENCE] Project state saved for session ${sessionId}`);
  } catch (error) {
    console.error(`[PERSISTENCE] Error saving project state for session ${sessionId}:`, error);
    throw error;
  }
}
async function loadProjectState(sessionId) {
  try {
    const redis = getRedisClientInstance();
    const key = `${PERSISTENCE_KEY_PREFIX}${sessionId}`;
    const stateStr = await redis.get(key);
    if (!stateStr) {
      console.log(`[PERSISTENCE] No saved state found for session ${sessionId}`);
      return null;
    }
    const state = JSON.parse(stateStr);
    const isRecent = Date.now() - state.timestamp < 7 * 24 * 60 * 60 * 1e3;
    if (!isRecent) {
      console.log(`[PERSISTENCE] Saved state for session ${sessionId} is too old, deleting...`);
      await redis.del(key);
      return null;
    }
    console.log(`[PERSISTENCE] Project state loaded for session ${sessionId}`);
    return state;
  } catch (error) {
    console.error(`[PERSISTENCE] Error loading project state for session ${sessionId}:`, error);
    return null;
  }
}
async function isRecoveryNeeded(sessionId) {
  try {
    const state = await loadProjectState(sessionId);
    if (!state) return false;
    const hasInProgressTasks = state.tasks.some((task) => task.status === "in_progress");
    const timeSinceLastActivity = Date.now() - state.lastActivity;
    const isLikelyInterruption = hasInProgressTasks && timeSinceLastActivity > 6e4;
    return isLikelyInterruption;
  } catch (error) {
    console.error(`[PERSISTENCE] Error checking recovery status for session ${sessionId}:`, error);
    return false;
  }
}
async function clearSessionState(sessionId) {
  try {
    const redis = getRedisClientInstance();
    const key = `${PERSISTENCE_KEY_PREFIX}${sessionId}`;
    await redis.del(key);
    console.log(`[PERSISTENCE] Session state cleared for session ${sessionId}`);
  } catch (error) {
    console.error(`[PERSISTENCE] Error clearing session state for session ${sessionId}:`, error);
    throw error;
  }
}

// src/modules/tools/definitions/system/enhancedTodoList.tool.ts
var projectItemSchema = z.object({
  id: z.string().describe("Unique identifier for the todo item"),
  content: z.string().describe("Description of the task"),
  status: z.enum(["pending", "in_progress", "completed", "blocked", "cancelled"]).describe("Current status of the task"),
  priority: z.enum(["low", "medium", "high", "critical"]).optional().describe("Priority level of the task"),
  category: z.string().optional().describe("Category or project the task belongs to"),
  projectId: z.string().optional().describe("ID of the project this task belongs to"),
  parentId: z.string().optional().describe("ID of parent task for hierarchical tasks"),
  dependencies: z.array(z.string()).optional().describe("IDs of tasks that must be completed before this one"),
  estimatedTime: z.number().optional().describe("Estimated time to complete in minutes"),
  actualTime: z.number().optional().describe("Actual time spent in minutes"),
  createdAt: z.number().describe("Timestamp when task was created"),
  updatedAt: z.number().describe("Timestamp when task was last updated"),
  assignedTo: z.string().optional().describe("Agent or team assigned to this task"),
  tags: z.array(z.string()).optional().describe("Tags for categorization")
});
var projectSchema = z.object({
  id: z.string().describe("Unique identifier for the project"),
  name: z.string().describe("Name of the project"),
  description: z.string().describe("Description of the project"),
  status: z.enum(["planning", "in_progress", "on_hold", "completed", "cancelled"]).describe("Current status of the project"),
  createdAt: z.number().describe("Timestamp when project was created"),
  updatedAt: z.number().describe("Timestamp when project was last updated"),
  startDate: z.number().optional().describe("Planned start date"),
  endDate: z.number().optional().describe("Planned end date"),
  actualStartDate: z.number().optional().describe("Actual start date"),
  actualEndDate: z.number().optional().describe("Actual end date"),
  progress: z.number().describe("Project progress percentage (0-100)"),
  totalTasks: z.number().describe("Total number of tasks in the project"),
  completedTasks: z.number().describe("Number of completed tasks")
});
var parameters = z.object({
  action: z.enum([
    "create_project",
    "update_project",
    "create_task",
    "update_task",
    "display",
    "clear",
    "generate_plan",
    "recover_state",
    "export_project",
    "import_project"
  ]).describe("Action to perform on the todo list or project"),
  project: projectSchema.optional().describe("Project data for create/update actions"),
  tasks: z.array(projectItemSchema).optional().describe("Array of task items for create/update actions"),
  projectId: z.string().optional().describe("ID of specific project to work with"),
  taskId: z.string().optional().describe("ID of specific task to update (for update action)"),
  status: z.enum(["pending", "in_progress", "completed", "blocked", "cancelled"]).optional().describe("New status for update action"),
  title: z.string().optional().describe("Title for the todo list display"),
  recoveryData: z.any().optional().describe("Data for state recovery")
});
var enhancedTodoListOutput = z.union([
  z.object({
    success: z.boolean(),
    message: z.string(),
    project: projectSchema.optional(),
    tasks: z.array(projectItemSchema).optional(),
    recoveryStatus: z.string().optional()
  }),
  z.object({
    error: z.string()
  })
]);
var projectStore = /* @__PURE__ */ new Map();
var taskStore = /* @__PURE__ */ new Map();
var generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);
var initializeFromPersistence = async (sessionKey) => {
  try {
    const savedState = await loadProjectState(sessionKey);
    if (savedState) {
      projectStore.set(sessionKey, savedState.project);
      taskStore.set(sessionKey, savedState.tasks);
      return true;
    }
  } catch (error) {
    console.error("Error initializing from persistence for session " + sessionKey + ":", error);
  }
  return false;
};
var createProjectData = (project, tasks, title) => {
  return {
    type: "enhanced_todo_list",
    title: title || (project ? project.name : "Enhanced Todo List"),
    timestamp: Date.now(),
    project,
    tasks: tasks.map((task) => ({
      id: task.id,
      content: task.content,
      status: task.status,
      priority: task.priority || "medium",
      category: task.category,
      projectId: task.projectId,
      parentId: task.parentId,
      dependencies: task.dependencies || [],
      estimatedTime: task.estimatedTime,
      actualTime: task.actualTime,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      assignedTo: task.assignedTo,
      tags: task.tags || []
    })),
    stats: {
      pending: tasks.filter((t) => t.status === "pending").length,
      in_progress: tasks.filter((t) => t.status === "in_progress").length,
      completed: tasks.filter((t) => t.status === "completed").length,
      blocked: tasks.filter((t) => t.status === "blocked").length,
      cancelled: tasks.filter((t) => t.status === "cancelled").length,
      total: tasks.length,
      projectProgress: project ? project.progress : 0
    }
  };
};
var enhancedTodoListTool = {
  description: "Manages enhanced todo lists for complex projects with persistence and recovery capabilities. Supports project planning, task dependencies, time estimation, and real-time progress tracking.",
  execute: async (args, ctx) => {
    const sessionKey = ctx.session?.name || "default";
    try {
      ctx.log.info("Managing enhanced todo list - Action: " + args.action);
      if (!projectStore.has(sessionKey) && !taskStore.has(sessionKey)) {
        const initialized = await initializeFromPersistence(sessionKey);
        if (!initialized) {
          projectStore.set(sessionKey, void 0);
          taskStore.set(sessionKey, []);
        }
      }
      if (!projectStore.has(sessionKey)) {
        projectStore.set(sessionKey, void 0);
      }
      if (!taskStore.has(sessionKey)) {
        taskStore.set(sessionKey, []);
      }
      const currentProject = projectStore.get(sessionKey);
      const currentTasks = taskStore.get(sessionKey);
      switch (args.action) {
        case "create_project":
          if (!args.project) {
            return { error: "No project data provided for create_project action" };
          }
          const newProject = {
            ...args.project,
            id: args.project.id || generateId(),
            createdAt: args.project.createdAt || Date.now(),
            updatedAt: args.project.updatedAt || Date.now(),
            progress: args.project.progress || 0,
            totalTasks: args.project.totalTasks || 0,
            completedTasks: args.project.completedTasks || 0
          };
          projectStore.set(sessionKey, newProject);
          try {
            await saveProjectState(sessionKey, newProject, currentTasks || []);
            ctx.log.info("Saved project state to persistent storage for session " + sessionKey);
          } catch (saveError) {
            ctx.log.error({ err: saveError }, "Failed to save project state for session " + sessionKey);
          }
          ctx.log.info("Created project: " + newProject.name);
          if (ctx.job?.id) {
            const projectData = createProjectData(newProject, currentTasks || [], args.title);
            await sendToCanvas(ctx.job.id, JSON.stringify(projectData), "text");
            ctx.log.info("Project data sent to canvas for visualization");
          }
          return {
            success: true,
            message: 'Project "' + newProject.name + '" created successfully',
            project: newProject,
            tasks: currentTasks
          };
        case "update_project":
          if (!args.project) {
            return { error: "No project data provided for update_project action" };
          }
          if (currentProject === void 0) {
            return { error: "No project exists to update. Create a project first." };
          }
          const updatedProject = {
            ...currentProject,
            ...args.project,
            id: currentProject.id,
            // Keep original ID
            updatedAt: Date.now()
          };
          projectStore.set(sessionKey, updatedProject);
          try {
            await saveProjectState(sessionKey, updatedProject, currentTasks || []);
            ctx.log.info("Saved updated project state to persistent storage for session " + sessionKey);
          } catch (saveError) {
            ctx.log.error({ err: saveError }, "Failed to save updated project state for session " + sessionKey);
          }
          ctx.log.info("Updated project: " + updatedProject.name);
          if (ctx.job?.id) {
            const projectData = createProjectData(updatedProject, currentTasks || [], args.title);
            await sendToCanvas(ctx.job.id, JSON.stringify(projectData), "text");
            ctx.log.info("Updated project data sent to canvas for visualization");
          }
          return {
            success: true,
            message: 'Project "' + updatedProject.name + '" updated successfully',
            project: updatedProject,
            tasks: currentTasks
          };
        case "create_task":
          if (!args.tasks || args.tasks.length === 0) {
            return { error: "No tasks provided for create_task action" };
          }
          const newTasks = args.tasks.map((task) => ({
            ...task,
            id: task.id || generateId(),
            createdAt: task.createdAt || Date.now(),
            updatedAt: task.updatedAt || Date.now()
          }));
          const allTasks = [...currentTasks || [], ...newTasks];
          taskStore.set(sessionKey, allTasks);
          let updatedProjectWithTasks = currentProject;
          if (currentProject !== void 0) {
            const totalTasks = allTasks.length;
            const completedTasks = allTasks.filter((t) => t.status === "completed").length;
            const progress = totalTasks > 0 ? Math.round(completedTasks / totalTasks * 100) : 0;
            updatedProjectWithTasks = {
              ...currentProject,
              totalTasks,
              completedTasks,
              progress,
              updatedAt: Date.now()
            };
            projectStore.set(sessionKey, updatedProjectWithTasks);
          }
          try {
            await saveProjectState(sessionKey, updatedProjectWithTasks, allTasks);
            ctx.log.info("Saved task state to persistent storage for session " + sessionKey);
          } catch (saveError) {
            ctx.log.error({ err: saveError }, "Failed to save task state for session " + sessionKey);
          }
          ctx.log.info("Created " + newTasks.length + " tasks");
          if (ctx.job?.id) {
            const projectData = createProjectData(updatedProjectWithTasks, allTasks, args.title);
            await sendToCanvas(ctx.job.id, JSON.stringify(projectData), "text");
            ctx.log.info("Task data sent to canvas for visualization");
          }
          return {
            success: true,
            message: "Created " + newTasks.length + " tasks successfully",
            project: updatedProjectWithTasks,
            tasks: allTasks
          };
        case "update_task":
          if (!args.taskId) {
            return { error: "No taskId provided for update_task action" };
          }
          if (!args.status) {
            return { error: "No status provided for update_task action" };
          }
          const taskIndex = (currentTasks || []).findIndex((t) => t.id === args.taskId);
          if (taskIndex === -1) {
            return { error: "Task with ID " + args.taskId + " not found" };
          }
          const updatedTask = {
            ...(currentTasks || [])[taskIndex],
            status: args.status,
            updatedAt: Date.now()
          };
          const updatedTasks = [...currentTasks || []];
          updatedTasks[taskIndex] = updatedTask;
          taskStore.set(sessionKey, updatedTasks);
          let updatedProjectWithTask = currentProject;
          if (currentProject !== void 0) {
            const totalTasks = updatedTasks.length;
            const completedTasks = updatedTasks.filter((t) => t.status === "completed").length;
            const progress = totalTasks > 0 ? Math.round(completedTasks / totalTasks * 100) : 0;
            updatedProjectWithTask = {
              ...currentProject,
              totalTasks,
              completedTasks,
              progress,
              updatedAt: Date.now()
            };
            projectStore.set(sessionKey, updatedProjectWithTask);
          }
          try {
            await saveProjectState(sessionKey, updatedProjectWithTask, updatedTasks);
            ctx.log.info("Saved updated task state to persistent storage for session " + sessionKey);
          } catch (saveError) {
            ctx.log.error({ err: saveError }, "Failed to save updated task state for session " + sessionKey);
          }
          ctx.log.info("Updated task " + args.taskId + " to status " + args.status);
          if (ctx.job?.id) {
            const projectData = createProjectData(updatedProjectWithTask, updatedTasks, args.title);
            await sendToCanvas(ctx.job.id, JSON.stringify(projectData), "text");
            ctx.log.info("Updated task data sent to canvas for visualization");
          }
          return {
            success: true,
            message: 'Task "' + updatedTask.content + '" updated to ' + args.status,
            project: updatedProjectWithTask,
            tasks: updatedTasks
          };
        case "display":
          if (ctx.job?.id) {
            const projectData = createProjectData(currentProject, currentTasks || [], args.title);
            await sendToCanvas(ctx.job.id, JSON.stringify(projectData), "text");
            ctx.log.info("Todo list data sent to canvas for visualization");
          }
          return {
            success: true,
            message: "Todo list displayed successfully",
            project: currentProject,
            tasks: currentTasks
          };
        case "clear":
          taskStore.set(sessionKey, []);
          projectStore.set(sessionKey, void 0);
          ctx.log.info("Cleared todo list and project");
          try {
            await clearSessionState(sessionKey);
            ctx.log.info("Cleared persistent state for session " + sessionKey);
          } catch (clearError) {
            ctx.log.error({ err: clearError }, "Failed to clear persistent state for session " + sessionKey);
          }
          return {
            success: true,
            message: "Todo list and project cleared"
          };
        case "recover_state":
          try {
            const recoveryNeeded = await isRecoveryNeeded(sessionKey);
            ctx.log.info("Recovery needed: " + recoveryNeeded);
            if (recoveryNeeded) {
              const savedState = await loadProjectState(sessionKey);
              if (savedState) {
                projectStore.set(sessionKey, savedState.project);
                taskStore.set(sessionKey, savedState.tasks);
                ctx.log.info("Recovered state for session " + sessionKey);
                if (ctx.job?.id) {
                  const projectData = createProjectData(savedState.project, savedState.tasks, args.title);
                  await sendToCanvas(ctx.job.id, JSON.stringify(projectData), "text");
                  ctx.log.info("Recovered state sent to canvas for visualization");
                }
                return {
                  success: true,
                  message: "State recovered successfully",
                  recoveryStatus: "Recovery was needed and completed",
                  project: savedState.project,
                  tasks: savedState.tasks
                };
              } else {
                ctx.log.info("No saved state found for session " + sessionKey);
                return {
                  success: true,
                  message: "No saved state found for recovery",
                  recoveryStatus: "No previous state to recover"
                };
              }
            } else {
              ctx.log.info("No recovery needed for session " + sessionKey);
              return {
                success: true,
                message: "State loaded successfully",
                recoveryStatus: "Recovery was not needed",
                project: currentProject,
                tasks: currentTasks || []
              };
            }
          } catch (recoverError) {
            const errorMessage = recoverError instanceof Error ? recoverError.message : String(recoverError);
            ctx.log.error({ err: recoverError }, "Failed to recover state for session " + sessionKey + ": " + errorMessage);
            return {
              error: "Failed to recover state: " + errorMessage
            };
          }
        default:
          return { error: "Unknown action: " + args.action };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      ctx.log.error({ err: error }, "Error in enhancedTodoListTool: " + errorMessage);
      return { error: "Failed to manage enhanced todo list: " + errorMessage };
    }
  },
  name: "enhanced_todo_list",
  parameters
};

export {
  parameters,
  enhancedTodoListOutput,
  enhancedTodoListTool
};
