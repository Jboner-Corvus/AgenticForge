import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  init_esm_shims
} from "../../../../chunk-SB7UONON.js";

// src/modules/tools/definitions/system/todoDataModels.ts
init_esm_shims();
import { z } from "zod";
var enhancedTodoItemSchema = z.object({
  actualTime: z.number().optional().describe("Actual time spent in minutes"),
  // Assignment and collaboration
  assignedTo: z.string().optional().describe("Agent or team assigned to this task"),
  // Attachments
  attachments: z.array(
    z.object({
      id: z.string().describe("Unique identifier for the attachment"),
      name: z.string().describe("Name of the attachment"),
      size: z.number().describe("Size of the attachment in bytes"),
      type: z.string().describe("Type of the attachment"),
      url: z.string().describe("URL to the attachment")
    })
  ).default([]).describe("Attachments for this task"),
  // Automation and triggers
  automationRules: z.array(
    z.object({
      action: z.string().describe("Action to perform when condition is met"),
      condition: z.string().describe("Condition that triggers the rule"),
      enabled: z.boolean().default(true).describe("Whether the rule is enabled")
    })
  ).default([]).describe("Automation rules for this task"),
  // Organization and categorization
  category: z.string().optional().describe("Category or project the task belongs to"),
  // Comments and notes
  comments: z.array(
    z.object({
      author: z.string().describe("Author of the comment"),
      content: z.string().describe("Content of the comment"),
      editedAt: z.number().optional().describe("Timestamp when comment was last edited"),
      id: z.string().describe("Unique identifier for the comment"),
      timestamp: z.number().describe("Timestamp when comment was created")
    })
  ).default([]).describe("Comments on this task"),
  completedAt: z.number().optional().describe("Completion timestamp"),
  content: z.string().min(1).describe("Description of the task"),
  // Dates and scheduling
  createdAt: z.number().describe("Timestamp when task was created"),
  // Custom fields
  customFields: z.record(z.string(), z.any()).default({}).describe("Custom fields for additional task information"),
  // Dependencies and relationships
  dependencies: z.array(z.string()).default([]).describe("IDs of tasks that must be completed before this one"),
  dueDate: z.number().optional().describe("Due date timestamp"),
  // Time tracking
  estimatedTime: z.number().optional().describe("Estimated time to complete in minutes"),
  // Core identification
  id: z.string().describe("Unique identifier for the todo item"),
  labels: z.array(z.string()).default([]).describe("Custom labels for additional categorization"),
  parentId: z.string().optional().describe("ID of parent task for hierarchical tasks"),
  // Priority system
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium").describe("Priority level of the task"),
  // Progress tracking
  progress: z.number().min(0).max(100).default(0).describe("Completion percentage"),
  projectId: z.string().optional().describe("ID of the project this task belongs to"),
  startDate: z.number().optional().describe("Start date timestamp"),
  // Status management
  status: z.enum(["pending", "in_progress", "completed", "blocked", "cancelled"]).default("pending").describe("Current status of the task"),
  subtasks: z.array(z.string()).default([]).describe("IDs of subtasks belonging to this task"),
  // Tagging and metadata
  tags: z.array(z.string()).default([]).describe("Tags for categorization"),
  timeSpent: z.number().default(0).describe("Total time spent on this task in minutes"),
  updatedAt: z.number().describe("Timestamp when task was last updated"),
  watchers: z.array(z.string()).default([]).describe("Users watching this task for updates")
});
var enhancedProjectSchema = z.object({
  actualEndDate: z.number().optional().describe("Actual end date timestamp"),
  actualStartDate: z.number().optional().describe("Actual start date timestamp"),
  // Resource management
  budget: z.number().optional().describe("Project budget"),
  burndownData: z.array(
    z.object({
      completedTasks: z.number().describe("Number of completed tasks"),
      date: z.number().describe("Date timestamp"),
      remainingTasks: z.number().describe("Number of remaining tasks")
    })
  ).default([]).describe("Burndown chart data"),
  completedTaskCount: z.number().default(0).describe("Number of completed tasks"),
  // Dates and scheduling
  createdAt: z.number().describe("Timestamp when project was created"),
  // Custom fields
  customFields: z.record(z.string(), z.any()).default({}).describe("Custom fields for additional project information"),
  // Dependencies
  dependencies: z.array(z.string()).default([]).describe("IDs of projects this project depends on"),
  description: z.string().optional().describe("Description of the project"),
  endDate: z.number().optional().describe("Planned end date timestamp"),
  // Core identification
  id: z.string().describe("Unique identifier for the project"),
  // Milestones
  milestones: z.array(
    z.object({
      completed: z.boolean().default(false).describe("Whether milestone is completed"),
      completedAt: z.number().optional().describe("When milestone was completed"),
      description: z.string().optional().describe("Milestone description"),
      dueDate: z.number().describe("Milestone due date"),
      id: z.string().describe("Milestone identifier"),
      name: z.string().describe("Milestone name")
    })
  ).default([]).describe("Project milestones"),
  name: z.string().min(1).describe("Name of the project"),
  // Phases
  phases: z.array(
    z.object({
      description: z.string().optional().describe("Phase description"),
      endDate: z.number().describe("Phase end date"),
      id: z.string().describe("Phase identifier"),
      name: z.string().describe("Phase name"),
      progress: z.number().min(0).max(100).default(0).describe("Phase progress percentage"),
      startDate: z.number().describe("Phase start date"),
      status: z.enum(["pending", "active", "completed"]).default("pending").describe("Phase status")
    })
  ).default([]).describe("Project phases"),
  // Progress tracking
  progress: z.number().min(0).max(100).default(0).describe("Project progress percentage"),
  resources: z.array(
    z.object({
      allocated: z.number().describe("Amount allocated"),
      id: z.string().describe("Resource identifier"),
      name: z.string().describe("Resource name"),
      type: z.string().describe("Resource type"),
      used: z.number().describe("Amount used")
    })
  ).default([]).describe("Resources allocated to this project"),
  // Risk management
  risks: z.array(
    z.object({
      description: z.string().describe("Risk description"),
      id: z.string().describe("Risk identifier"),
      impact: z.number().min(0).max(1).describe("Risk impact (0-1)"),
      mitigation: z.string().optional().describe("Mitigation strategy"),
      owner: z.string().optional().describe("Risk owner"),
      probability: z.number().min(0).max(1).describe("Risk probability (0-1)"),
      title: z.string().describe("Risk title")
    })
  ).default([]).describe("Project risks"),
  startDate: z.number().optional().describe("Planned start date timestamp"),
  // Status management
  status: z.enum(["planning", "active", "on_hold", "completed", "cancelled"]).default("planning").describe("Current status of the project"),
  // Task tracking
  taskCount: z.number().default(0).describe("Total number of tasks"),
  // Team management
  team: z.array(
    z.object({
      assignedTasks: z.array(z.string()).describe("Tasks assigned to this member"),
      id: z.string().describe("Team member identifier"),
      name: z.string().describe("Team member name"),
      role: z.string().describe("Role in the project")
    })
  ).default([]).describe("Team members assigned to this project"),
  updatedAt: z.number().describe("Timestamp when project was last updated"),
  // Analytics and metrics
  velocity: z.number().default(0).describe("Team velocity in tasks per sprint")
});
var commentSchema = z.object({
  author: z.string().describe("Author of the comment"),
  content: z.string().describe("Content of the comment"),
  editedAt: z.number().optional().describe("Timestamp when comment was last edited"),
  id: z.string().describe("Unique identifier for the comment"),
  reactions: z.array(
    z.object({
      timestamp: z.number().describe("When the reaction was added"),
      type: z.string().describe("Type of reaction (emoji, etc.)"),
      userId: z.string().describe("User who reacted")
    })
  ).default([]).describe("Reactions to this comment"),
  timestamp: z.number().describe("Timestamp when comment was created")
});
var attachmentSchema = z.object({
  id: z.string().describe("Unique identifier for the attachment"),
  name: z.string().describe("Name of the attachment"),
  size: z.number().describe("Size of the attachment in bytes"),
  type: z.string().describe("MIME type of the attachment"),
  uploadedAt: z.number().describe("Timestamp when attachment was uploaded"),
  uploadedBy: z.string().describe("User who uploaded the attachment"),
  url: z.string().describe("URL to the attachment")
});
var timeTrackingSchema = z.object({
  billable: z.boolean().default(false).describe("Whether this time is billable"),
  description: z.string().optional().describe("Description of work done"),
  duration: z.number().describe("Duration in minutes"),
  endTime: z.number().describe("End time timestamp"),
  id: z.string().describe("Unique identifier for the time entry"),
  startTime: z.number().describe("Start time timestamp"),
  taskId: z.string().describe("Task this time entry belongs to"),
  userId: z.string().describe("User who logged this time")
});
var automationRuleSchema = z.object({
  actions: z.array(
    z.object({
      parameters: z.record(z.string(), z.any()).describe("Parameters for the action"),
      type: z.string().describe("Type of action to perform")
    })
  ).describe("Actions to perform when triggered"),
  createdAt: z.number().describe("When the rule was created"),
  description: z.string().optional().describe("Description of what the rule does"),
  enabled: z.boolean().default(true).describe("Whether the rule is enabled"),
  id: z.string().describe("Unique identifier for the rule"),
  name: z.string().describe("Name of the rule"),
  trigger: z.object({
    conditions: z.array(
      z.object({
        field: z.string().describe("Field to check"),
        operator: z.enum([
          "equals",
          "not_equals",
          "contains",
          "not_contains",
          "greater_than",
          "less_than"
        ]).describe("Comparison operator"),
        value: z.any().describe("Value to compare against")
      })
    ).describe("Conditions that must be met"),
    event: z.string().describe("Event that triggers the rule")
  }).describe("What triggers this rule"),
  updatedAt: z.number().describe("When the rule was last updated")
});
var todoFiltersSchema = z.object({
  assignedTo: z.string().optional().describe("Filter by assignee"),
  category: z.string().optional().describe("Filter by category"),
  dueDateAfter: z.number().optional().describe("Filter by due date after this timestamp"),
  dueDateBefore: z.number().optional().describe("Filter by due date before this timestamp"),
  priority: z.array(z.string()).optional().describe("Filter by priority"),
  projectId: z.string().optional().describe("Filter by project"),
  search: z.string().optional().describe("Search in content, tags, and comments"),
  status: z.array(z.string()).optional().describe("Filter by status"),
  tags: z.array(z.string()).optional().describe("Filter by tags")
});
export {
  attachmentSchema,
  automationRuleSchema,
  commentSchema,
  enhancedProjectSchema,
  enhancedTodoItemSchema,
  timeTrackingSchema,
  todoFiltersSchema
};
