import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  init_esm_shims
} from "./chunk-SB7UONON.js";

// src/modules/tools/definitions/system/projectManagement.ts
init_esm_shims();
var ProjectManagementService = class {
  stateManager;
  constructor(stateManager) {
    this.stateManager = stateManager;
  }
  // Add a task to a project
  async addTaskToProject(sessionKey, projectId, taskData) {
    try {
      const projectResult = this.getProject(sessionKey, projectId);
      if (!projectResult.success || !projectResult.project) {
        return {
          error: projectResult.error || `Project with ID ${projectId} not found`,
          success: false
        };
      }
      const project = projectResult.project;
      const completeTaskData = {
        actualTime: taskData.actualTime,
        assignedTo: taskData.assignedTo,
        attachments: taskData.attachments || [],
        automationRules: taskData.automationRules || [],
        category: taskData.category,
        comments: taskData.comments || [],
        completedAt: taskData.completedAt,
        content: taskData.content,
        createdAt: taskData.createdAt || Date.now(),
        customFields: taskData.customFields || {},
        dependencies: taskData.dependencies || [],
        dueDate: taskData.dueDate,
        estimatedTime: taskData.estimatedTime,
        id: taskData.id || Date.now().toString(36) + Math.random().toString(36).substr(2),
        labels: taskData.labels || [],
        parentId: taskData.parentId,
        priority: taskData.priority || "medium",
        progress: taskData.progress || 0,
        projectId: taskData.projectId || projectId,
        startDate: taskData.startDate,
        status: taskData.status || "pending",
        subtasks: taskData.subtasks || [],
        tags: taskData.tags || [],
        timeSpent: taskData.timeSpent || 0,
        updatedAt: taskData.updatedAt || Date.now(),
        watchers: taskData.watchers || []
      };
      const task = await this.stateManager.createTask(
        sessionKey,
        completeTaskData
      );
      await this.stateManager.updateProjectTaskCount(
        sessionKey,
        projectId
      );
      return {
        message: `Task "${task.content}" added to project "${project.name}" successfully`,
        success: true,
        task: completeTaskData
        // Return the complete task data
      };
    } catch (error) {
      return {
        error: `Failed to add task to project: ${error}`,
        success: false
      };
    }
  }
  // Complete project milestone
  async completeProjectMilestone(sessionKey, projectId, milestoneId) {
    try {
      const projectResult = this.getProject(sessionKey, projectId);
      if (!projectResult.success || !projectResult.project) {
        return {
          error: projectResult.error || `Project with ID ${projectId} not found`,
          success: false
        };
      }
      const project = projectResult.project;
      const milestones = [...project.milestones || []];
      const milestoneIndex = milestones.findIndex((m) => m.id === milestoneId);
      if (milestoneIndex === -1) {
        return {
          error: `Milestone with ID ${milestoneId} not found`,
          success: false
        };
      }
      milestones[milestoneIndex] = {
        ...milestones[milestoneIndex],
        completed: true,
        completedAt: Date.now()
      };
      const updatedProjectData = {
        ...project,
        milestones
      };
      return {
        message: `Milestone "${milestones[milestoneIndex].name}" marked as completed`,
        project: updatedProjectData,
        success: true
      };
    } catch (error) {
      return {
        error: `Failed to complete project milestone: ${error}`,
        success: false
      };
    }
  }
  // Create a new project
  async createProject(sessionKey, projectData) {
    try {
      const simplifiedProject = {
        completedTaskCount: projectData.completedTaskCount,
        createdAt: projectData.createdAt,
        description: projectData.description,
        endDate: projectData.endDate,
        id: projectData.id,
        name: projectData.name,
        progress: projectData.progress,
        startDate: projectData.startDate,
        status: projectData.status,
        taskCount: projectData.taskCount,
        updatedAt: projectData.updatedAt
      };
      const project = await this.stateManager.createProject(
        sessionKey,
        simplifiedProject
      );
      const enhancedProject = {
        actualEndDate: projectData.actualEndDate,
        actualStartDate: projectData.actualStartDate,
        budget: projectData.budget,
        burndownData: projectData.burndownData || [],
        completedTaskCount: project.completedTaskCount || 0,
        createdAt: project.createdAt,
        customFields: projectData.customFields || {},
        dependencies: projectData.dependencies || [],
        description: project.description,
        endDate: project.endDate,
        id: project.id,
        milestones: projectData.milestones || [],
        name: project.name,
        phases: projectData.phases || [],
        progress: project.progress || 0,
        resources: projectData.resources || [],
        risks: projectData.risks || [],
        startDate: project.startDate,
        status: project.status || "planning",
        taskCount: project.taskCount || 0,
        team: projectData.team || [],
        updatedAt: project.updatedAt || Date.now(),
        velocity: projectData.velocity || 0
      };
      return {
        message: `Project "${project.name}" created successfully`,
        project: enhancedProject,
        success: true
      };
    } catch (error) {
      return {
        error: `Failed to create project: ${error}`,
        success: false
      };
    }
  }
  // Delete a project
  async deleteProject(sessionKey, projectId) {
    try {
      const projectKey = `${sessionKey}:${projectId}`;
      const project = this.stateManager.projects.get(projectKey);
      if (!project) {
        return {
          error: `Project with ID ${projectId} not found`,
          success: false
        };
      }
      this.stateManager.projects.delete(projectKey);
      const tasks = this.stateManager.getTasks(sessionKey);
      const tasksToRemove = tasks.filter(
        (task) => task.projectId === projectId
      );
      for (const task of tasksToRemove) {
        await this.stateManager.deleteTask(sessionKey, task.id);
      }
      const enhancedProject = {
        actualEndDate: void 0,
        actualStartDate: void 0,
        budget: void 0,
        burndownData: [],
        completedTaskCount: project.completedTaskCount || 0,
        createdAt: project.createdAt,
        customFields: {},
        dependencies: [],
        description: project.description,
        endDate: project.endDate,
        id: project.id,
        milestones: [],
        name: project.name,
        phases: [],
        progress: project.progress || 0,
        resources: [],
        risks: [],
        startDate: project.startDate,
        status: project.status || "planning",
        taskCount: project.taskCount || 0,
        team: [],
        updatedAt: project.updatedAt || Date.now(),
        velocity: 0
      };
      return {
        message: `Project "${enhancedProject.name}" and ${tasksToRemove.length} associated tasks deleted successfully`,
        success: true
      };
    } catch (error) {
      return {
        error: `Failed to delete project: ${error}`,
        success: false
      };
    }
  }
  // Get a project by ID
  getProject(sessionKey, projectId) {
    const project = this.stateManager.getProject(sessionKey, projectId);
    if (!project) {
      return {
        error: `Project with ID ${projectId} not found`,
        success: false
      };
    }
    const enhancedProject = {
      actualEndDate: void 0,
      actualStartDate: void 0,
      budget: void 0,
      burndownData: [],
      completedTaskCount: project.completedTaskCount || 0,
      createdAt: project.createdAt,
      customFields: {},
      dependencies: [],
      description: project.description,
      endDate: project.endDate,
      id: project.id,
      milestones: [],
      name: project.name,
      phases: [],
      progress: project.progress || 0,
      resources: [],
      risks: [],
      startDate: project.startDate,
      status: project.status || "planning",
      taskCount: project.taskCount || 0,
      team: [],
      updatedAt: project.updatedAt || Date.now(),
      velocity: 0
    };
    return {
      project: enhancedProject,
      success: true
    };
  }
  // Get all projects for a session
  getProjects(sessionKey) {
    const projects = [];
    const projectKeys = Array.from(
      this.stateManager.projects.keys()
    ).filter(
      (key) => typeof key === "string" && key.startsWith(`${sessionKey}:`)
    );
    projectKeys.forEach((key) => {
      const project = this.stateManager.projects.get(key);
      if (project) {
        const enhancedProject = {
          actualEndDate: void 0,
          actualStartDate: void 0,
          budget: void 0,
          burndownData: [],
          completedTaskCount: project.completedTaskCount || 0,
          createdAt: project.createdAt,
          customFields: {},
          dependencies: [],
          description: project.description,
          endDate: project.endDate,
          id: project.id,
          milestones: [],
          name: project.name,
          phases: [],
          progress: project.progress || 0,
          resources: [],
          risks: [],
          startDate: project.startDate,
          status: project.status || "planning",
          taskCount: project.taskCount || 0,
          team: [],
          updatedAt: project.updatedAt || Date.now(),
          velocity: 0
        };
        projects.push(enhancedProject);
      }
    });
    return {
      projects,
      success: true
    };
  }
  // Get all tasks for a project
  getProjectTasks(sessionKey, projectId) {
    const projectResult = this.getProject(sessionKey, projectId);
    if (!projectResult.success || !projectResult.project) {
      return {
        error: projectResult.error || `Project with ID ${projectId} not found`,
        success: false
      };
    }
    const project = projectResult.project;
    const tasks = this.stateManager.getTasks(sessionKey, { projectId });
    const completeTasks = tasks.map(
      (task) => ({
        actualTime: task.actualTime,
        assignedTo: task.assignedTo,
        attachments: task.attachments || [],
        automationRules: task.automationRules || [],
        category: task.category,
        comments: task.comments || [],
        completedAt: task.completedAt,
        content: task.content,
        createdAt: task.createdAt,
        customFields: task.customFields || {},
        dependencies: task.dependencies || [],
        dueDate: task.dueDate,
        estimatedTime: task.estimatedTime,
        id: task.id,
        labels: task.labels || [],
        parentId: task.parentId,
        priority: task.priority || "medium",
        progress: task.progress || 0,
        projectId: task.projectId,
        startDate: task.startDate,
        status: task.status || "pending",
        subtasks: task.subtasks || [],
        tags: task.tags || [],
        timeSpent: task.timeSpent || 0,
        updatedAt: task.updatedAt || Date.now(),
        watchers: task.watchers || []
      })
    );
    return {
      project,
      success: true,
      tasks: completeTasks
    };
  }
  // Set project milestone
  async setProjectMilestone(sessionKey, projectId, milestoneData) {
    try {
      const projectResult = this.getProject(sessionKey, projectId);
      if (!projectResult.success || !projectResult.project) {
        return {
          error: projectResult.error || `Project with ID ${projectId} not found`,
          success: false
        };
      }
      const project = projectResult.project;
      const updatedProjectData = {
        ...project,
        milestones: [
          ...project.milestones || [],
          {
            ...milestoneData,
            completed: false,
            id: Date.now().toString(36) + Math.random().toString(36).substr(2)
          }
        ]
      };
      return {
        message: `Milestone "${milestoneData.name}" added to project successfully`,
        project: updatedProjectData,
        success: true
      };
    } catch (error) {
      return {
        error: `Failed to set project milestone: ${error}`,
        success: false
      };
    }
  }
  // Update an existing project
  async updateProject(sessionKey, projectId, updates) {
    try {
      const simplifiedUpdates = {};
      if (updates.id !== void 0) simplifiedUpdates.id = updates.id;
      if (updates.name !== void 0) simplifiedUpdates.name = updates.name;
      if (updates.description !== void 0)
        simplifiedUpdates.description = updates.description;
      if (updates.status !== void 0)
        simplifiedUpdates.status = updates.status;
      if (updates.createdAt !== void 0)
        simplifiedUpdates.createdAt = updates.createdAt;
      if (updates.updatedAt !== void 0)
        simplifiedUpdates.updatedAt = updates.updatedAt;
      if (updates.startDate !== void 0)
        simplifiedUpdates.startDate = updates.startDate;
      if (updates.endDate !== void 0)
        simplifiedUpdates.endDate = updates.endDate;
      if (updates.progress !== void 0)
        simplifiedUpdates.progress = updates.progress;
      if (updates.taskCount !== void 0)
        simplifiedUpdates.taskCount = updates.taskCount;
      if (updates.completedTaskCount !== void 0)
        simplifiedUpdates.completedTaskCount = updates.completedTaskCount;
      const project = await this.stateManager.updateProject(
        sessionKey,
        projectId,
        simplifiedUpdates
      );
      if (!project) {
        return {
          error: `Project with ID ${projectId} not found`,
          success: false
        };
      }
      const enhancedProject = {
        actualEndDate: updates.actualEndDate,
        actualStartDate: updates.actualStartDate,
        budget: updates.budget,
        burndownData: updates.burndownData || [],
        completedTaskCount: project.completedTaskCount || 0,
        createdAt: project.createdAt,
        customFields: updates.customFields || {},
        dependencies: updates.dependencies || [],
        description: project.description,
        endDate: project.endDate,
        id: project.id,
        milestones: updates.milestones || [],
        name: project.name,
        phases: updates.phases || [],
        progress: project.progress || 0,
        resources: updates.resources || [],
        risks: updates.risks || [],
        startDate: project.startDate,
        status: project.status || "planning",
        taskCount: project.taskCount || 0,
        team: updates.team || [],
        updatedAt: project.updatedAt || Date.now(),
        velocity: updates.velocity || 0
      };
      return {
        message: `Project "${project.name}" updated successfully`,
        project: enhancedProject,
        success: true
      };
    } catch (error) {
      return {
        error: `Failed to update project: ${error}`,
        success: false
      };
    }
  }
};

export {
  ProjectManagementService
};
