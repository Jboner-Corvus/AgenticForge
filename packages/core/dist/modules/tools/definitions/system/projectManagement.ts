import { z } from 'zod';

import {
  enhancedProjectSchema,
  enhancedTodoItemSchema,
} from './todoDataModels';
import { TodoStateManager } from './todoStateManagement';

interface AddTaskToProjectResult extends ProjectOperationResult {
  message?: string;
  task?: z.infer<typeof enhancedTodoItemSchema>;
}

interface CalculateProjectProgressResult extends ProjectOperationResult {
  completed?: number;
  progress?: number;
  total?: number;
}

interface CompleteProjectMilestoneResult extends ProjectOperationResult {
  message?: string;
  project?: z.infer<typeof enhancedProjectSchema>;
}

interface CreateProjectResult extends ProjectOperationResult {
  message?: string;
  project?: z.infer<typeof enhancedProjectSchema>;
}

interface DeleteProjectResult extends ProjectOperationResult {
  message?: string;
}

interface GenerateProjectTimelineResult extends ProjectOperationResult {
  timeline?: Record<string, z.infer<typeof enhancedTodoItemSchema>[]>;
}

interface GetProjectResult extends ProjectOperationResult {
  project?: z.infer<typeof enhancedProjectSchema>;
}

interface GetProjectsResult extends ProjectOperationResult {
  projects?: z.infer<typeof enhancedProjectSchema>[];
}

interface GetProjectStatsResult extends ProjectOperationResult {
  stats?: {
    priority: Record<string, number>;
    progress: number;
    status: Record<string, number>;
    totalTasks: number;
  };
}

interface GetProjectTasksResult extends ProjectOperationResult {
  project?: z.infer<typeof enhancedProjectSchema>;
  tasks?: z.infer<typeof enhancedTodoItemSchema>[];
}

// Define return types for better type safety
interface ProjectOperationResult {
  error?: string;
  success: boolean;
}

interface SetProjectMilestoneResult extends ProjectOperationResult {
  message?: string;
  project?: z.infer<typeof enhancedProjectSchema>;
}

interface UpdateProjectResult extends ProjectOperationResult {
  message?: string;
  project?: z.infer<typeof enhancedProjectSchema>;
}

// Project management service
export class ProjectManagementService {
  private stateManager: TodoStateManager;

  constructor(stateManager: TodoStateManager) {
    this.stateManager = stateManager;
  }

  // Add a task to a project
  async addTaskToProject(
    sessionKey: string,
    projectId: string,
    taskData: z.infer<typeof enhancedTodoItemSchema>,
  ): Promise<AddTaskToProjectResult> {
    try {
      // First verify the project exists
      const projectResult = this.getProject(sessionKey, projectId);
      if (!projectResult.success || !projectResult.project) {
        return {
          error:
            projectResult.error || `Project with ID ${projectId} not found`,
          success: false,
        };
      }

      const project = projectResult.project;

      // Ensure all required fields are present for the task
      const completeTaskData: z.infer<typeof enhancedTodoItemSchema> = {
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
        id:
          taskData.id ||
          Date.now().toString(36) + Math.random().toString(36).substr(2),
        labels: taskData.labels || [],
        parentId: taskData.parentId,
        priority: taskData.priority || 'medium',
        progress: taskData.progress || 0,
        projectId: taskData.projectId || projectId,
        startDate: taskData.startDate,
        status: taskData.status || 'pending',
        subtasks: taskData.subtasks || [],
        tags: taskData.tags || [],
        timeSpent: taskData.timeSpent || 0,
        updatedAt: taskData.updatedAt || Date.now(),
        watchers: taskData.watchers || [],
      };

      // Create the task
      const task = await this.stateManager.createTask(
        sessionKey,
        completeTaskData,
      );

      // Update project task count
      await (this.stateManager as any).updateProjectTaskCount(
        sessionKey,
        projectId,
      );

      return {
        message: `Task "${task.content}" added to project "${project.name}" successfully`,
        success: true,
        task: completeTaskData, // Return the complete task data
      };
    } catch (error) {
      return {
        error: `Failed to add task to project: ${error}`,
        success: false,
      };
    }
  }

  // Complete project milestone
  async completeProjectMilestone(
    sessionKey: string,
    projectId: string,
    milestoneId: string,
  ): Promise<CompleteProjectMilestoneResult> {
    try {
      // Verify the project exists
      const projectResult = this.getProject(sessionKey, projectId);
      if (!projectResult.success || !projectResult.project) {
        return {
          error:
            projectResult.error || `Project with ID ${projectId} not found`,
          success: false,
        };
      }

      const project = projectResult.project;

      // Find and update the milestone
      const milestones = [...(project.milestones || [])];
      const milestoneIndex = milestones.findIndex((m) => m.id === milestoneId);

      if (milestoneIndex === -1) {
        return {
          error: `Milestone with ID ${milestoneId} not found`,
          success: false,
        };
      }

      milestones[milestoneIndex] = {
        ...milestones[milestoneIndex],
        completed: true,
        completedAt: Date.now(),
      };

      // Create updated project data
      const updatedProjectData: z.infer<typeof enhancedProjectSchema> = {
        ...project,
        milestones,
      };

      return {
        message: `Milestone "${milestones[milestoneIndex].name}" marked as completed`,
        project: updatedProjectData,
        success: true,
      };
    } catch (error) {
      return {
        error: `Failed to complete project milestone: ${error}`,
        success: false,
      };
    }
  }

  // Create a new project
  async createProject(
    sessionKey: string,
    projectData: z.infer<typeof enhancedProjectSchema>,
  ): Promise<CreateProjectResult> {
    try {
      // Create a simplified project object for the state manager
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
        updatedAt: projectData.updatedAt,
      };

      const project = await this.stateManager.createProject(
        sessionKey,
        simplifiedProject,
      );

      // Convert back to enhanced schema for the result
      const enhancedProject: z.infer<typeof enhancedProjectSchema> = {
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
        status: project.status || 'planning',
        taskCount: project.taskCount || 0,
        team: projectData.team || [],
        updatedAt: project.updatedAt || Date.now(),
        velocity: projectData.velocity || 0,
      };

      return {
        message: `Project "${project.name}" created successfully`,
        project: enhancedProject,
        success: true,
      };
    } catch (error) {
      return {
        error: `Failed to create project: ${error}`,
        success: false,
      };
    }
  }

  // Delete a project
  async deleteProject(
    sessionKey: string,
    projectId: string,
  ): Promise<DeleteProjectResult> {
    try {
      const projectKey = `${sessionKey}:${projectId}`;
      const project = (this.stateManager as any).projects.get(projectKey);

      if (!project) {
        return {
          error: `Project with ID ${projectId} not found`,
          success: false,
        };
      }

      // Remove the project
      (this.stateManager as any).projects.delete(projectKey);

      // Also remove all tasks associated with this project
      const tasks = this.stateManager.getTasks(sessionKey);
      const tasksToRemove = tasks.filter(
        (task) => task.projectId === projectId,
      );

      for (const task of tasksToRemove) {
        await this.stateManager.deleteTask(sessionKey, task.id);
      }

      // Convert to enhanced schema for the result
      const enhancedProject: z.infer<typeof enhancedProjectSchema> = {
        actualEndDate: undefined,
        actualStartDate: undefined,
        budget: undefined,
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
        status: project.status || 'planning',
        taskCount: project.taskCount || 0,
        team: [],
        updatedAt: project.updatedAt || Date.now(),
        velocity: 0,
      };

      return {
        message: `Project "${enhancedProject.name}" and ${tasksToRemove.length} associated tasks deleted successfully`,
        success: true,
      };
    } catch (error) {
      return {
        error: `Failed to delete project: ${error}`,
        success: false,
      };
    }
  }

  // Get a project by ID
  getProject(sessionKey: string, projectId: string): GetProjectResult {
    const project = this.stateManager.getProject(sessionKey, projectId);
    if (!project) {
      return {
        error: `Project with ID ${projectId} not found`,
        success: false,
      };
    }

    // Convert to enhanced schema for the result
    const enhancedProject: z.infer<typeof enhancedProjectSchema> = {
      actualEndDate: undefined,
      actualStartDate: undefined,
      budget: undefined,
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
      status: project.status || 'planning',
      taskCount: project.taskCount || 0,
      team: [],
      updatedAt: project.updatedAt || Date.now(),
      velocity: 0,
    };

    return {
      project: enhancedProject,
      success: true,
    };
  }

  // Get all projects for a session
  getProjects(sessionKey: string): GetProjectsResult {
    // This is a simplified implementation
    // In a real system, we would have a more sophisticated way to retrieve all projects
    const projects: z.infer<typeof enhancedProjectSchema>[] = [];

    // Get all project keys for this session
    const projectKeys = Array.from(
      (this.stateManager as any).projects.keys(),
    ).filter(
      (key) => typeof key === 'string' && key.startsWith(`${sessionKey}:`),
    );

    projectKeys.forEach((key) => {
      const project = (this.stateManager as any).projects.get(key);
      if (project) {
        // Convert to enhanced schema for the result
        const enhancedProject: z.infer<typeof enhancedProjectSchema> = {
          actualEndDate: undefined,
          actualStartDate: undefined,
          budget: undefined,
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
          status: project.status || 'planning',
          taskCount: project.taskCount || 0,
          team: [],
          updatedAt: project.updatedAt || Date.now(),
          velocity: 0,
        };
        projects.push(enhancedProject);
      }
    });

    return {
      projects,
      success: true,
    };
  }

  // Get all tasks for a project
  getProjectTasks(
    sessionKey: string,
    projectId: string,
  ): GetProjectTasksResult {
    // Verify the project exists
    const projectResult = this.getProject(sessionKey, projectId);
    if (!projectResult.success || !projectResult.project) {
      return {
        error: projectResult.error || `Project with ID ${projectId} not found`,
        success: false,
      };
    }

    const project = projectResult.project;

    // Get tasks for this project
    const tasks = this.stateManager.getTasks(sessionKey, { projectId });

    // Ensure all tasks have required fields
    const completeTasks: z.infer<typeof enhancedTodoItemSchema>[] = tasks.map(
      (task) => ({
        actualTime: task.actualTime,
        assignedTo: task.assignedTo,
        attachments: (task as any).attachments || [],
        automationRules: (task as any).automationRules || [],
        category: task.category,
        comments: (task as any).comments || [],
        completedAt: (task as any).completedAt,
        content: task.content,
        createdAt: task.createdAt,
        customFields: (task as any).customFields || {},
        dependencies: task.dependencies || [],
        dueDate: (task as any).dueDate,
        estimatedTime: task.estimatedTime,
        id: task.id,
        labels: (task as any).labels || [],
        parentId: task.parentId,
        priority: task.priority || 'medium',
        progress: task.progress || 0,
        projectId: task.projectId,
        startDate: (task as any).startDate,
        status: task.status || 'pending',
        subtasks: (task as any).subtasks || [],
        tags: task.tags || [],
        timeSpent: (task as any).timeSpent || 0,
        updatedAt: task.updatedAt || Date.now(),
        watchers: (task as any).watchers || [],
      }),
    );

    return {
      project,
      success: true,
      tasks: completeTasks,
    };
  }

  // Set project milestone
  async setProjectMilestone(
    sessionKey: string,
    projectId: string,
    milestoneData: any,
  ): Promise<SetProjectMilestoneResult> {
    try {
      // Verify the project exists
      const projectResult = this.getProject(sessionKey, projectId);
      if (!projectResult.success || !projectResult.project) {
        return {
          error:
            projectResult.error || `Project with ID ${projectId} not found`,
          success: false,
        };
      }

      const project = projectResult.project;

      // For the state manager, we need to work with the simplified schema
      // We'll store milestones in the enhanced project data but not in the state manager
      const updatedProjectData: z.infer<typeof enhancedProjectSchema> = {
        ...project,
        milestones: [
          ...(project.milestones || []),
          {
            ...milestoneData,
            completed: false,
            id: Date.now().toString(36) + Math.random().toString(36).substr(2),
          },
        ],
      };

      // Since we can't store the enhanced data in the state manager,
      // we'll just return the enhanced project data
      return {
        message: `Milestone "${milestoneData.name}" added to project successfully`,
        project: updatedProjectData,
        success: true,
      };
    } catch (error) {
      return {
        error: `Failed to set project milestone: ${error}`,
        success: false,
      };
    }
  }

  // Update an existing project
  async updateProject(
    sessionKey: string,
    projectId: string,
    updates: Partial<z.infer<typeof enhancedProjectSchema>>,
  ): Promise<UpdateProjectResult> {
    try {
      // Create a simplified update object for the state manager
      const simplifiedUpdates: any = {};
      if (updates.id !== undefined) simplifiedUpdates.id = updates.id;
      if (updates.name !== undefined) simplifiedUpdates.name = updates.name;
      if (updates.description !== undefined)
        simplifiedUpdates.description = updates.description;
      if (updates.status !== undefined)
        simplifiedUpdates.status = updates.status;
      if (updates.createdAt !== undefined)
        simplifiedUpdates.createdAt = updates.createdAt;
      if (updates.updatedAt !== undefined)
        simplifiedUpdates.updatedAt = updates.updatedAt;
      if (updates.startDate !== undefined)
        simplifiedUpdates.startDate = updates.startDate;
      if (updates.endDate !== undefined)
        simplifiedUpdates.endDate = updates.endDate;
      if (updates.progress !== undefined)
        simplifiedUpdates.progress = updates.progress;
      if (updates.taskCount !== undefined)
        simplifiedUpdates.taskCount = updates.taskCount;
      if (updates.completedTaskCount !== undefined)
        simplifiedUpdates.completedTaskCount = updates.completedTaskCount;

      const project = await this.stateManager.updateProject(
        sessionKey,
        projectId,
        simplifiedUpdates,
      );
      if (!project) {
        return {
          error: `Project with ID ${projectId} not found`,
          success: false,
        };
      }

      // Convert to enhanced schema for the result
      const enhancedProject: z.infer<typeof enhancedProjectSchema> = {
        actualEndDate: (updates as any).actualEndDate,
        actualStartDate: (updates as any).actualStartDate,
        budget: (updates as any).budget,
        burndownData: (updates as any).burndownData || [],
        completedTaskCount: project.completedTaskCount || 0,
        createdAt: project.createdAt,
        customFields: (updates as any).customFields || {},
        dependencies: (updates as any).dependencies || [],
        description: project.description,
        endDate: project.endDate,
        id: project.id,
        milestones: (updates as any).milestones || [],
        name: project.name,
        phases: (updates as any).phases || [],
        progress: project.progress || 0,
        resources: (updates as any).resources || [],
        risks: (updates as any).risks || [],
        startDate: project.startDate,
        status: project.status || 'planning',
        taskCount: project.taskCount || 0,
        team: (updates as any).team || [],
        updatedAt: project.updatedAt || Date.now(),
        velocity: (updates as any).velocity || 0,
      };

      return {
        message: `Project "${project.name}" updated successfully`,
        project: enhancedProject,
        success: true,
      };
    } catch (error) {
      return {
        error: `Failed to update project: ${error}`,
        success: false,
      };
    }
  }
}
