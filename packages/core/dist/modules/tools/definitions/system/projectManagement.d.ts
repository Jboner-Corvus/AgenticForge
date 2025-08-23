import { z } from 'zod';
import { enhancedTodoItemSchema, enhancedProjectSchema } from './todoDataModels.js';
import { TodoStateManager } from './todoStateManagement.js';

interface AddTaskToProjectResult extends ProjectOperationResult {
    message?: string;
    task?: z.infer<typeof enhancedTodoItemSchema>;
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
interface GetProjectResult extends ProjectOperationResult {
    project?: z.infer<typeof enhancedProjectSchema>;
}
interface GetProjectsResult extends ProjectOperationResult {
    projects?: z.infer<typeof enhancedProjectSchema>[];
}
interface GetProjectTasksResult extends ProjectOperationResult {
    project?: z.infer<typeof enhancedProjectSchema>;
    tasks?: z.infer<typeof enhancedTodoItemSchema>[];
}
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
declare class ProjectManagementService {
    private stateManager;
    constructor(stateManager: TodoStateManager);
    addTaskToProject(sessionKey: string, projectId: string, taskData: z.infer<typeof enhancedTodoItemSchema>): Promise<AddTaskToProjectResult>;
    completeProjectMilestone(sessionKey: string, projectId: string, milestoneId: string): Promise<CompleteProjectMilestoneResult>;
    createProject(sessionKey: string, projectData: z.infer<typeof enhancedProjectSchema>): Promise<CreateProjectResult>;
    deleteProject(sessionKey: string, projectId: string): Promise<DeleteProjectResult>;
    getProject(sessionKey: string, projectId: string): GetProjectResult;
    getProjects(sessionKey: string): GetProjectsResult;
    getProjectTasks(sessionKey: string, projectId: string): GetProjectTasksResult;
    setProjectMilestone(sessionKey: string, projectId: string, milestoneData: any): Promise<SetProjectMilestoneResult>;
    updateProject(sessionKey: string, projectId: string, updates: Partial<z.infer<typeof enhancedProjectSchema>>): Promise<UpdateProjectResult>;
}

export { ProjectManagementService };
