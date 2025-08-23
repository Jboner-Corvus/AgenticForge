import { z } from 'zod';

declare const enhancedTodoItemSchema: z.ZodObject<{
    actualTime: z.ZodOptional<z.ZodNumber>;
    assignedTo: z.ZodOptional<z.ZodString>;
    attachments: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        size: z.ZodNumber;
        type: z.ZodString;
        url: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: string;
        name: string;
        id: string;
        url: string;
        size: number;
    }, {
        type: string;
        name: string;
        id: string;
        url: string;
        size: number;
    }>, "many">>;
    automationRules: z.ZodDefault<z.ZodArray<z.ZodObject<{
        action: z.ZodString;
        condition: z.ZodString;
        enabled: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        action: string;
        condition: string;
        enabled: boolean;
    }, {
        action: string;
        condition: string;
        enabled?: boolean | undefined;
    }>, "many">>;
    category: z.ZodOptional<z.ZodString>;
    comments: z.ZodDefault<z.ZodArray<z.ZodObject<{
        author: z.ZodString;
        content: z.ZodString;
        editedAt: z.ZodOptional<z.ZodNumber>;
        id: z.ZodString;
        timestamp: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id: string;
        content: string;
        timestamp: number;
        author: string;
        editedAt?: number | undefined;
    }, {
        id: string;
        content: string;
        timestamp: number;
        author: string;
        editedAt?: number | undefined;
    }>, "many">>;
    completedAt: z.ZodOptional<z.ZodNumber>;
    content: z.ZodString;
    createdAt: z.ZodNumber;
    customFields: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
    dependencies: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    dueDate: z.ZodOptional<z.ZodNumber>;
    estimatedTime: z.ZodOptional<z.ZodNumber>;
    id: z.ZodString;
    labels: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    parentId: z.ZodOptional<z.ZodString>;
    priority: z.ZodDefault<z.ZodEnum<["low", "medium", "high", "critical"]>>;
    progress: z.ZodDefault<z.ZodNumber>;
    projectId: z.ZodOptional<z.ZodString>;
    startDate: z.ZodOptional<z.ZodNumber>;
    status: z.ZodDefault<z.ZodEnum<["pending", "in_progress", "completed", "blocked", "cancelled"]>>;
    subtasks: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    timeSpent: z.ZodDefault<z.ZodNumber>;
    updatedAt: z.ZodNumber;
    watchers: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    status: "in_progress" | "pending" | "completed" | "blocked" | "cancelled";
    id: string;
    content: string;
    createdAt: number;
    dependencies: string[];
    priority: "high" | "low" | "medium" | "critical";
    tags: string[];
    updatedAt: number;
    progress: number;
    attachments: {
        type: string;
        name: string;
        id: string;
        url: string;
        size: number;
    }[];
    automationRules: {
        action: string;
        condition: string;
        enabled: boolean;
    }[];
    comments: {
        id: string;
        content: string;
        timestamp: number;
        author: string;
        editedAt?: number | undefined;
    }[];
    customFields: Record<string, any>;
    labels: string[];
    subtasks: string[];
    timeSpent: number;
    watchers: string[];
    actualTime?: number | undefined;
    assignedTo?: string | undefined;
    category?: string | undefined;
    estimatedTime?: number | undefined;
    parentId?: string | undefined;
    projectId?: string | undefined;
    startDate?: number | undefined;
    completedAt?: number | undefined;
    dueDate?: number | undefined;
}, {
    id: string;
    content: string;
    createdAt: number;
    updatedAt: number;
    status?: "in_progress" | "pending" | "completed" | "blocked" | "cancelled" | undefined;
    actualTime?: number | undefined;
    assignedTo?: string | undefined;
    category?: string | undefined;
    dependencies?: string[] | undefined;
    estimatedTime?: number | undefined;
    parentId?: string | undefined;
    priority?: "high" | "low" | "medium" | "critical" | undefined;
    projectId?: string | undefined;
    tags?: string[] | undefined;
    progress?: number | undefined;
    startDate?: number | undefined;
    attachments?: {
        type: string;
        name: string;
        id: string;
        url: string;
        size: number;
    }[] | undefined;
    automationRules?: {
        action: string;
        condition: string;
        enabled?: boolean | undefined;
    }[] | undefined;
    comments?: {
        id: string;
        content: string;
        timestamp: number;
        author: string;
        editedAt?: number | undefined;
    }[] | undefined;
    completedAt?: number | undefined;
    customFields?: Record<string, any> | undefined;
    dueDate?: number | undefined;
    labels?: string[] | undefined;
    subtasks?: string[] | undefined;
    timeSpent?: number | undefined;
    watchers?: string[] | undefined;
}>;
declare const enhancedProjectSchema: z.ZodObject<{
    actualEndDate: z.ZodOptional<z.ZodNumber>;
    actualStartDate: z.ZodOptional<z.ZodNumber>;
    budget: z.ZodOptional<z.ZodNumber>;
    burndownData: z.ZodDefault<z.ZodArray<z.ZodObject<{
        completedTasks: z.ZodNumber;
        date: z.ZodNumber;
        remainingTasks: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        date: number;
        completedTasks: number;
        remainingTasks: number;
    }, {
        date: number;
        completedTasks: number;
        remainingTasks: number;
    }>, "many">>;
    completedTaskCount: z.ZodDefault<z.ZodNumber>;
    createdAt: z.ZodNumber;
    customFields: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
    dependencies: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    description: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodNumber>;
    id: z.ZodString;
    milestones: z.ZodDefault<z.ZodArray<z.ZodObject<{
        completed: z.ZodDefault<z.ZodBoolean>;
        completedAt: z.ZodOptional<z.ZodNumber>;
        description: z.ZodOptional<z.ZodString>;
        dueDate: z.ZodNumber;
        id: z.ZodString;
        name: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        id: string;
        completed: boolean;
        dueDate: number;
        description?: string | undefined;
        completedAt?: number | undefined;
    }, {
        name: string;
        id: string;
        dueDate: number;
        description?: string | undefined;
        completed?: boolean | undefined;
        completedAt?: number | undefined;
    }>, "many">>;
    name: z.ZodString;
    phases: z.ZodDefault<z.ZodArray<z.ZodObject<{
        description: z.ZodOptional<z.ZodString>;
        endDate: z.ZodNumber;
        id: z.ZodString;
        name: z.ZodString;
        progress: z.ZodDefault<z.ZodNumber>;
        startDate: z.ZodNumber;
        status: z.ZodDefault<z.ZodEnum<["pending", "active", "completed"]>>;
    }, "strip", z.ZodTypeAny, {
        status: "pending" | "completed" | "active";
        name: string;
        id: string;
        endDate: number;
        progress: number;
        startDate: number;
        description?: string | undefined;
    }, {
        name: string;
        id: string;
        endDate: number;
        startDate: number;
        status?: "pending" | "completed" | "active" | undefined;
        description?: string | undefined;
        progress?: number | undefined;
    }>, "many">>;
    progress: z.ZodDefault<z.ZodNumber>;
    resources: z.ZodDefault<z.ZodArray<z.ZodObject<{
        allocated: z.ZodNumber;
        id: z.ZodString;
        name: z.ZodString;
        type: z.ZodString;
        used: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: string;
        name: string;
        id: string;
        allocated: number;
        used: number;
    }, {
        type: string;
        name: string;
        id: string;
        allocated: number;
        used: number;
    }>, "many">>;
    risks: z.ZodDefault<z.ZodArray<z.ZodObject<{
        description: z.ZodString;
        id: z.ZodString;
        impact: z.ZodNumber;
        mitigation: z.ZodOptional<z.ZodString>;
        owner: z.ZodOptional<z.ZodString>;
        probability: z.ZodNumber;
        title: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        title: string;
        description: string;
        id: string;
        impact: number;
        probability: number;
        mitigation?: string | undefined;
        owner?: string | undefined;
    }, {
        title: string;
        description: string;
        id: string;
        impact: number;
        probability: number;
        mitigation?: string | undefined;
        owner?: string | undefined;
    }>, "many">>;
    startDate: z.ZodOptional<z.ZodNumber>;
    status: z.ZodDefault<z.ZodEnum<["planning", "active", "on_hold", "completed", "cancelled"]>>;
    taskCount: z.ZodDefault<z.ZodNumber>;
    team: z.ZodDefault<z.ZodArray<z.ZodObject<{
        assignedTasks: z.ZodArray<z.ZodString, "many">;
        id: z.ZodString;
        name: z.ZodString;
        role: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        id: string;
        assignedTasks: string[];
        role: string;
    }, {
        name: string;
        id: string;
        assignedTasks: string[];
        role: string;
    }>, "many">>;
    updatedAt: z.ZodNumber;
    velocity: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    status: "completed" | "cancelled" | "planning" | "on_hold" | "active";
    name: string;
    id: string;
    createdAt: number;
    dependencies: string[];
    updatedAt: number;
    progress: number;
    customFields: Record<string, any>;
    burndownData: {
        date: number;
        completedTasks: number;
        remainingTasks: number;
    }[];
    completedTaskCount: number;
    milestones: {
        name: string;
        id: string;
        completed: boolean;
        dueDate: number;
        description?: string | undefined;
        completedAt?: number | undefined;
    }[];
    phases: {
        status: "pending" | "completed" | "active";
        name: string;
        id: string;
        endDate: number;
        progress: number;
        startDate: number;
        description?: string | undefined;
    }[];
    resources: {
        type: string;
        name: string;
        id: string;
        allocated: number;
        used: number;
    }[];
    risks: {
        title: string;
        description: string;
        id: string;
        impact: number;
        probability: number;
        mitigation?: string | undefined;
        owner?: string | undefined;
    }[];
    taskCount: number;
    team: {
        name: string;
        id: string;
        assignedTasks: string[];
        role: string;
    }[];
    velocity: number;
    description?: string | undefined;
    actualEndDate?: number | undefined;
    actualStartDate?: number | undefined;
    endDate?: number | undefined;
    startDate?: number | undefined;
    budget?: number | undefined;
}, {
    name: string;
    id: string;
    createdAt: number;
    updatedAt: number;
    status?: "completed" | "cancelled" | "planning" | "on_hold" | "active" | undefined;
    description?: string | undefined;
    dependencies?: string[] | undefined;
    actualEndDate?: number | undefined;
    actualStartDate?: number | undefined;
    endDate?: number | undefined;
    progress?: number | undefined;
    startDate?: number | undefined;
    customFields?: Record<string, any> | undefined;
    budget?: number | undefined;
    burndownData?: {
        date: number;
        completedTasks: number;
        remainingTasks: number;
    }[] | undefined;
    completedTaskCount?: number | undefined;
    milestones?: {
        name: string;
        id: string;
        dueDate: number;
        description?: string | undefined;
        completed?: boolean | undefined;
        completedAt?: number | undefined;
    }[] | undefined;
    phases?: {
        name: string;
        id: string;
        endDate: number;
        startDate: number;
        status?: "pending" | "completed" | "active" | undefined;
        description?: string | undefined;
        progress?: number | undefined;
    }[] | undefined;
    resources?: {
        type: string;
        name: string;
        id: string;
        allocated: number;
        used: number;
    }[] | undefined;
    risks?: {
        title: string;
        description: string;
        id: string;
        impact: number;
        probability: number;
        mitigation?: string | undefined;
        owner?: string | undefined;
    }[] | undefined;
    taskCount?: number | undefined;
    team?: {
        name: string;
        id: string;
        assignedTasks: string[];
        role: string;
    }[] | undefined;
    velocity?: number | undefined;
}>;
declare const commentSchema: z.ZodObject<{
    author: z.ZodString;
    content: z.ZodString;
    editedAt: z.ZodOptional<z.ZodNumber>;
    id: z.ZodString;
    reactions: z.ZodDefault<z.ZodArray<z.ZodObject<{
        timestamp: z.ZodNumber;
        type: z.ZodString;
        userId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: string;
        timestamp: number;
        userId: string;
    }, {
        type: string;
        timestamp: number;
        userId: string;
    }>, "many">>;
    timestamp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: string;
    content: string;
    timestamp: number;
    author: string;
    reactions: {
        type: string;
        timestamp: number;
        userId: string;
    }[];
    editedAt?: number | undefined;
}, {
    id: string;
    content: string;
    timestamp: number;
    author: string;
    editedAt?: number | undefined;
    reactions?: {
        type: string;
        timestamp: number;
        userId: string;
    }[] | undefined;
}>;
declare const attachmentSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    size: z.ZodNumber;
    type: z.ZodString;
    uploadedAt: z.ZodNumber;
    uploadedBy: z.ZodString;
    url: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: string;
    name: string;
    id: string;
    url: string;
    size: number;
    uploadedAt: number;
    uploadedBy: string;
}, {
    type: string;
    name: string;
    id: string;
    url: string;
    size: number;
    uploadedAt: number;
    uploadedBy: string;
}>;
declare const timeTrackingSchema: z.ZodObject<{
    billable: z.ZodDefault<z.ZodBoolean>;
    description: z.ZodOptional<z.ZodString>;
    duration: z.ZodNumber;
    endTime: z.ZodNumber;
    id: z.ZodString;
    startTime: z.ZodNumber;
    taskId: z.ZodString;
    userId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    taskId: string;
    userId: string;
    billable: boolean;
    duration: number;
    endTime: number;
    startTime: number;
    description?: string | undefined;
}, {
    id: string;
    taskId: string;
    userId: string;
    duration: number;
    endTime: number;
    startTime: number;
    description?: string | undefined;
    billable?: boolean | undefined;
}>;
declare const automationRuleSchema: z.ZodObject<{
    actions: z.ZodArray<z.ZodObject<{
        parameters: z.ZodRecord<z.ZodString, z.ZodAny>;
        type: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: string;
        parameters: Record<string, any>;
    }, {
        type: string;
        parameters: Record<string, any>;
    }>, "many">;
    createdAt: z.ZodNumber;
    description: z.ZodOptional<z.ZodString>;
    enabled: z.ZodDefault<z.ZodBoolean>;
    id: z.ZodString;
    name: z.ZodString;
    trigger: z.ZodObject<{
        conditions: z.ZodArray<z.ZodObject<{
            field: z.ZodString;
            operator: z.ZodEnum<["equals", "not_equals", "contains", "not_contains", "greater_than", "less_than"]>;
            value: z.ZodAny;
        }, "strip", z.ZodTypeAny, {
            field: string;
            operator: "contains" | "equals" | "not_equals" | "not_contains" | "greater_than" | "less_than";
            value?: any;
        }, {
            field: string;
            operator: "contains" | "equals" | "not_equals" | "not_contains" | "greater_than" | "less_than";
            value?: any;
        }>, "many">;
        event: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        conditions: {
            field: string;
            operator: "contains" | "equals" | "not_equals" | "not_contains" | "greater_than" | "less_than";
            value?: any;
        }[];
        event: string;
    }, {
        conditions: {
            field: string;
            operator: "contains" | "equals" | "not_equals" | "not_contains" | "greater_than" | "less_than";
            value?: any;
        }[];
        event: string;
    }>;
    updatedAt: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    name: string;
    id: string;
    createdAt: number;
    updatedAt: number;
    enabled: boolean;
    actions: {
        type: string;
        parameters: Record<string, any>;
    }[];
    trigger: {
        conditions: {
            field: string;
            operator: "contains" | "equals" | "not_equals" | "not_contains" | "greater_than" | "less_than";
            value?: any;
        }[];
        event: string;
    };
    description?: string | undefined;
}, {
    name: string;
    id: string;
    createdAt: number;
    updatedAt: number;
    actions: {
        type: string;
        parameters: Record<string, any>;
    }[];
    trigger: {
        conditions: {
            field: string;
            operator: "contains" | "equals" | "not_equals" | "not_contains" | "greater_than" | "less_than";
            value?: any;
        }[];
        event: string;
    };
    description?: string | undefined;
    enabled?: boolean | undefined;
}>;
type Attachment = z.infer<typeof attachmentSchema>;
type AutomationRule = z.infer<typeof automationRuleSchema>;
type Comment = z.infer<typeof commentSchema>;
type EnhancedProject = z.infer<typeof enhancedProjectSchema>;
type EnhancedTodoItem = z.infer<typeof enhancedTodoItemSchema>;
type PriorityLevel = z.infer<typeof enhancedTodoItemSchema>['priority'];
type ProjectStatus = z.infer<typeof enhancedProjectSchema>['status'];
type TimeTrackingEntry = z.infer<typeof timeTrackingSchema>;
type TodoStatus = z.infer<typeof enhancedTodoItemSchema>['status'];
declare const todoFiltersSchema: z.ZodObject<{
    assignedTo: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    dueDateAfter: z.ZodOptional<z.ZodNumber>;
    dueDateBefore: z.ZodOptional<z.ZodNumber>;
    priority: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    projectId: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    status?: string[] | undefined;
    search?: string | undefined;
    assignedTo?: string | undefined;
    category?: string | undefined;
    priority?: string[] | undefined;
    projectId?: string | undefined;
    tags?: string[] | undefined;
    dueDateAfter?: number | undefined;
    dueDateBefore?: number | undefined;
}, {
    status?: string[] | undefined;
    search?: string | undefined;
    assignedTo?: string | undefined;
    category?: string | undefined;
    priority?: string[] | undefined;
    projectId?: string | undefined;
    tags?: string[] | undefined;
    dueDateAfter?: number | undefined;
    dueDateBefore?: number | undefined;
}>;
type TodoFilters = z.infer<typeof todoFiltersSchema>;

export { type Attachment, type AutomationRule, type Comment, type EnhancedProject, type EnhancedTodoItem, type PriorityLevel, type ProjectStatus, type TimeTrackingEntry, type TodoFilters, type TodoStatus, attachmentSchema, automationRuleSchema, commentSchema, enhancedProjectSchema, enhancedTodoItemSchema, timeTrackingSchema, todoFiltersSchema };
