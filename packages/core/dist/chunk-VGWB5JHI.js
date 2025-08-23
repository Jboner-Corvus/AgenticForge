import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  clearSessionState,
  isRecoveryNeeded,
  loadProjectState,
  saveProjectState
} from "./chunk-FG6D2ATS.js";
import {
  sendToCanvas
} from "./chunk-5OJML75I.js";
import {
  init_esm_shims
} from "./chunk-SB7UONON.js";

// src/modules/tools/definitions/system/enhancedTodoList.tool.ts
init_esm_shims();
import { z } from "zod";
var projectItemSchema = z.object({
  actualTime: z.number().optional().describe("Actual time spent in minutes"),
  assignedTo: z.string().optional().describe("Agent or team assigned to this task"),
  category: z.string().optional().describe("Category or project the task belongs to"),
  content: z.string().describe("Description of the task"),
  createdAt: z.number().describe("Timestamp when task was created"),
  dependencies: z.array(z.string()).optional().describe("IDs of tasks that must be completed before this one"),
  estimatedTime: z.number().optional().describe("Estimated time to complete in minutes"),
  id: z.string().describe("Unique identifier for the todo item"),
  parentId: z.string().optional().describe("ID of parent task for hierarchical tasks"),
  priority: z.enum(["low", "medium", "high", "critical"]).optional().describe("Priority level of the task"),
  projectId: z.string().optional().describe("ID of the project this task belongs to"),
  status: z.enum(["pending", "in_progress", "completed", "blocked", "cancelled"]).describe("Current status of the task"),
  tags: z.array(z.string()).optional().describe("Tags for categorization"),
  updatedAt: z.number().describe("Timestamp when task was last updated")
});
var projectSchema = z.object({
  actualEndDate: z.number().optional().describe("Actual end date"),
  actualStartDate: z.number().optional().describe("Actual start date"),
  completedTasks: z.number().describe("Number of completed tasks"),
  createdAt: z.number().describe("Timestamp when project was created"),
  description: z.string().describe("Description of the project"),
  endDate: z.number().optional().describe("Planned end date"),
  id: z.string().describe("Unique identifier for the project"),
  name: z.string().describe("Name of the project"),
  progress: z.number().describe("Project progress percentage (0-100)"),
  startDate: z.number().optional().describe("Planned start date"),
  status: z.enum(["planning", "in_progress", "on_hold", "completed", "cancelled"]).describe("Current status of the project"),
  totalTasks: z.number().describe("Total number of tasks in the project"),
  updatedAt: z.number().describe("Timestamp when project was last updated")
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
  projectId: z.string().optional().describe("ID of specific project to work with"),
  recoveryData: z.any().optional().describe("Data for state recovery"),
  status: z.enum(["pending", "in_progress", "completed", "blocked", "cancelled"]).optional().describe("New status for update action"),
  taskId: z.string().optional().describe("ID of specific task to update (for update action)"),
  tasks: z.array(projectItemSchema).optional().describe("Array of task items for create/update actions"),
  title: z.string().optional().describe("Title for the todo list display")
});
var enhancedTodoListOutput = z.union([
  z.object({
    message: z.string(),
    project: projectSchema.optional(),
    recoveryStatus: z.string().optional(),
    success: z.boolean(),
    tasks: z.array(projectItemSchema).optional()
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
    console.error(
      "Error initializing from persistence for session " + sessionKey + ":",
      error
    );
  }
  return false;
};
var createProjectData = (project, tasks, title) => {
  return {
    project,
    stats: {
      blocked: tasks.filter((t) => t.status === "blocked").length,
      cancelled: tasks.filter((t) => t.status === "cancelled").length,
      completed: tasks.filter((t) => t.status === "completed").length,
      in_progress: tasks.filter((t) => t.status === "in_progress").length,
      pending: tasks.filter((t) => t.status === "pending").length,
      projectProgress: project ? project.progress : 0,
      total: tasks.length
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
      priority: task.priority || "medium",
      projectId: task.projectId,
      status: task.status,
      tags: task.tags || [],
      updatedAt: task.updatedAt
    })),
    timestamp: Date.now(),
    title: title || (project ? project.name : "Enhanced Todo List"),
    type: "enhanced_todo_list"
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
        case "clear":
          taskStore.set(sessionKey, []);
          projectStore.set(sessionKey, void 0);
          ctx.log.info("Cleared todo list and project");
          try {
            await clearSessionState(sessionKey);
            ctx.log.info("Cleared persistent state for session " + sessionKey);
          } catch (clearError) {
            ctx.log.error(
              { err: clearError },
              "Failed to clear persistent state for session " + sessionKey
            );
          }
          return {
            message: "Todo list and project cleared",
            success: true
          };
        case "create_project":
          if (!args.project) {
            return {
              error: "No project data provided for create_project action"
            };
          }
          const newProject = {
            ...args.project,
            completedTasks: args.project.completedTasks || 0,
            createdAt: args.project.createdAt || Date.now(),
            id: args.project.id || generateId(),
            progress: args.project.progress || 0,
            totalTasks: args.project.totalTasks || 0,
            updatedAt: args.project.updatedAt || Date.now()
          };
          projectStore.set(sessionKey, newProject);
          try {
            await saveProjectState(sessionKey, newProject, currentTasks || []);
            ctx.log.info(
              "Saved project state to persistent storage for session " + sessionKey
            );
          } catch (saveError) {
            ctx.log.error(
              { err: saveError },
              "Failed to save project state for session " + sessionKey
            );
          }
          ctx.log.info("Created project: " + newProject.name);
          if (ctx.job?.id) {
            const projectData = createProjectData(
              newProject,
              currentTasks || [],
              args.title
            );
            await sendToCanvas(ctx.job.id, JSON.stringify(projectData), "text");
            ctx.log.info("Project data sent to canvas for visualization");
          }
          return {
            message: 'Project "' + newProject.name + '" created successfully',
            project: newProject,
            success: true,
            tasks: currentTasks
          };
        case "create_task":
          if (!args.tasks || args.tasks.length === 0) {
            return { error: "No tasks provided for create_task action" };
          }
          const newTasks = args.tasks.map((task) => ({
            ...task,
            createdAt: task.createdAt || Date.now(),
            id: task.id || generateId(),
            updatedAt: task.updatedAt || Date.now()
          }));
          const allTasks = [...currentTasks || [], ...newTasks];
          taskStore.set(sessionKey, allTasks);
          let updatedProjectWithTasks = currentProject;
          if (currentProject !== void 0) {
            const totalTasks = allTasks.length;
            const completedTasks = allTasks.filter(
              (t) => t.status === "completed"
            ).length;
            const progress = totalTasks > 0 ? Math.round(completedTasks / totalTasks * 100) : 0;
            updatedProjectWithTasks = {
              ...currentProject,
              completedTasks,
              progress,
              totalTasks,
              updatedAt: Date.now()
            };
            projectStore.set(sessionKey, updatedProjectWithTasks);
          }
          try {
            await saveProjectState(
              sessionKey,
              updatedProjectWithTasks,
              allTasks
            );
            ctx.log.info(
              "Saved task state to persistent storage for session " + sessionKey
            );
          } catch (saveError) {
            ctx.log.error(
              { err: saveError },
              "Failed to save task state for session " + sessionKey
            );
          }
          ctx.log.info("Created " + newTasks.length + " tasks");
          if (ctx.job?.id) {
            const projectData = createProjectData(
              updatedProjectWithTasks,
              allTasks,
              args.title
            );
            await sendToCanvas(ctx.job.id, JSON.stringify(projectData), "text");
            ctx.log.info("Task data sent to canvas for visualization");
          }
          return {
            message: "Created " + newTasks.length + " tasks successfully",
            project: updatedProjectWithTasks,
            success: true,
            tasks: allTasks
          };
        case "display":
          if (ctx.job?.id) {
            const projectData = createProjectData(
              currentProject,
              currentTasks || [],
              args.title
            );
            await sendToCanvas(ctx.job.id, JSON.stringify(projectData), "text");
            ctx.log.info("Todo list data sent to canvas for visualization");
          }
          return {
            message: "Todo list displayed successfully",
            project: currentProject,
            success: true,
            tasks: currentTasks
          };
        case "update_project":
          if (!args.project) {
            return {
              error: "No project data provided for update_project action"
            };
          }
          if (currentProject === void 0) {
            return {
              error: "No project exists to update. Create a project first."
            };
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
            await saveProjectState(
              sessionKey,
              updatedProject,
              currentTasks || []
            );
            ctx.log.info(
              "Saved updated project state to persistent storage for session " + sessionKey
            );
          } catch (saveError) {
            ctx.log.error(
              { err: saveError },
              "Failed to save updated project state for session " + sessionKey
            );
          }
          ctx.log.info("Updated project: " + updatedProject.name);
          if (ctx.job?.id) {
            const projectData = createProjectData(
              updatedProject,
              currentTasks || [],
              args.title
            );
            await sendToCanvas(ctx.job.id, JSON.stringify(projectData), "text");
            ctx.log.info(
              "Updated project data sent to canvas for visualization"
            );
          }
          return {
            message: 'Project "' + updatedProject.name + '" updated successfully',
            project: updatedProject,
            success: true,
            tasks: currentTasks
          };
        case "update_task":
          if (!args.taskId) {
            return { error: "No taskId provided for update_task action" };
          }
          if (!args.status) {
            return { error: "No status provided for update_task action" };
          }
          const taskIndex = (currentTasks || []).findIndex(
            (t) => t.id === args.taskId
          );
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
            const completedTasks = updatedTasks.filter(
              (t) => t.status === "completed"
            ).length;
            const progress = totalTasks > 0 ? Math.round(completedTasks / totalTasks * 100) : 0;
            updatedProjectWithTask = {
              ...currentProject,
              completedTasks,
              progress,
              totalTasks,
              updatedAt: Date.now()
            };
            projectStore.set(sessionKey, updatedProjectWithTask);
          }
          try {
            await saveProjectState(
              sessionKey,
              updatedProjectWithTask,
              updatedTasks
            );
            ctx.log.info(
              "Saved updated task state to persistent storage for session " + sessionKey
            );
          } catch (saveError) {
            ctx.log.error(
              { err: saveError },
              "Failed to save updated task state for session " + sessionKey
            );
          }
          ctx.log.info(
            "Updated task " + args.taskId + " to status " + args.status
          );
          if (ctx.job?.id) {
            const projectData = createProjectData(
              updatedProjectWithTask,
              updatedTasks,
              args.title
            );
            await sendToCanvas(ctx.job.id, JSON.stringify(projectData), "text");
            ctx.log.info("Updated task data sent to canvas for visualization");
          }
          return {
            message: 'Task "' + updatedTask.content + '" updated to ' + args.status,
            project: updatedProjectWithTask,
            success: true,
            tasks: updatedTasks
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
                  const projectData = createProjectData(
                    savedState.project,
                    savedState.tasks,
                    args.title
                  );
                  await sendToCanvas(
                    ctx.job.id,
                    JSON.stringify(projectData),
                    "text"
                  );
                  ctx.log.info(
                    "Recovered state sent to canvas for visualization"
                  );
                }
                return {
                  message: "State recovered successfully",
                  project: savedState.project,
                  recoveryStatus: "Recovery was needed and completed",
                  success: true,
                  tasks: savedState.tasks
                };
              } else {
                ctx.log.info("No saved state found for session " + sessionKey);
                return {
                  message: "No saved state found for recovery",
                  recoveryStatus: "No previous state to recover",
                  success: true
                };
              }
            } else {
              ctx.log.info("No recovery needed for session " + sessionKey);
              return {
                message: "State loaded successfully",
                project: currentProject,
                recoveryStatus: "Recovery was not needed",
                success: true,
                tasks: currentTasks || []
              };
            }
          } catch (recoverError) {
            const errorMessage = recoverError instanceof Error ? recoverError.message : String(recoverError);
            ctx.log.error(
              { err: recoverError },
              "Failed to recover state for session " + sessionKey + ": " + errorMessage
            );
            return {
              error: "Failed to recover state: " + errorMessage
            };
          }
        default:
          return { error: "Unknown action: " + args.action };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      ctx.log.error(
        { err: error },
        "Error in enhancedTodoListTool: " + errorMessage
      );
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
