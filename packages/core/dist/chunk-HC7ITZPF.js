import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  sendToCanvas
} from "./chunk-KBBD5YYX.js";
import {
  init_esm_shims
} from "./chunk-SB7UONON.js";

// src/modules/tools/definitions/planning/projectPlanning.tool.ts
init_esm_shims();
import { z } from "zod";
var projectPlanningParams = z.object({
  projectName: z.string().describe("Name of the project to plan"),
  projectDescription: z.string().describe("Detailed description of the project"),
  projectId: z.string().optional().describe("ID of existing project to update"),
  complexity: z.enum(["simple", "medium", "complex"]).optional().describe("Complexity level of the project")
});
var projectPlanningOutput = z.union([
  z.object({
    success: z.boolean(),
    message: z.string(),
    plan: z.array(z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      phase: z.string(),
      priority: z.enum(["low", "medium", "high", "critical"]),
      estimatedTime: z.number()
    }))
  }),
  z.object({
    error: z.string()
  })
]);
var GAME_DEVELOPMENT_TEMPLATE = {
  name: "Game Development Project",
  tasks: [
    {
      title: "Project Setup & Planning",
      description: "Define project scope, create development environment, and establish team roles",
      phase: "Pre-Production",
      priority: "high",
      estimatedTime: 120
    },
    {
      title: "Game Design Document",
      description: "Create comprehensive GDD including story, mechanics, characters, and level design",
      phase: "Pre-Production",
      priority: "critical",
      estimatedTime: 240
    },
    {
      title: "Prototype Development",
      description: "Build basic gameplay prototype to test core mechanics",
      phase: "Pre-Production",
      priority: "high",
      estimatedTime: 180
    },
    {
      title: "Art Asset Creation",
      description: "Design and create all visual assets including characters, environments, and UI elements",
      phase: "Production",
      priority: "high",
      estimatedTime: 480
    },
    {
      title: "Core Engine Development",
      description: "Implement game engine with physics, rendering, and audio systems",
      phase: "Production",
      priority: "critical",
      estimatedTime: 360
    },
    {
      title: "Level Design",
      description: "Create engaging levels with proper difficulty progression",
      phase: "Production",
      priority: "high",
      estimatedTime: 300
    },
    {
      title: "Gameplay Implementation",
      description: "Code all gameplay mechanics, controls, and interactions",
      phase: "Production",
      priority: "critical",
      estimatedTime: 420
    },
    {
      title: "Audio Implementation",
      description: "Integrate sound effects, music, and voice acting",
      phase: "Production",
      priority: "medium",
      estimatedTime: 180
    },
    {
      title: "UI/UX Development",
      description: "Design and implement user interface and experience elements",
      phase: "Production",
      priority: "high",
      estimatedTime: 240
    },
    {
      title: "Testing & QA",
      description: "Conduct thorough testing including unit tests, integration tests, and playtesting",
      phase: "Post-Production",
      priority: "critical",
      estimatedTime: 300
    },
    {
      title: "Bug Fixes & Polishing",
      description: "Address all identified issues and polish the game for release",
      phase: "Post-Production",
      priority: "high",
      estimatedTime: 240
    },
    {
      title: "Deployment & Release",
      description: "Prepare final build, create distribution packages, and deploy to platforms",
      phase: "Post-Production",
      priority: "medium",
      estimatedTime: 180
    }
  ]
};
var generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);
var createProjectPlanTemplate = (projectName, plan) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
      <title>Project Plan: ${projectName}</title>
      <meta charset="utf-8">
      <style>
          body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              margin: 0;
              padding: 20px;
              min-height: 100vh;
          }
          .container {
              max-width: 1200px;
              margin: 0 auto;
              background: white;
              border-radius: 12px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.2);
              overflow: hidden;
          }
          .header {
              background: linear-gradient(135deg, #2c3e50, #34495e);
              color: white;
              padding: 30px;
              text-align: center;
          }
          .header h1 {
              margin: 0 0 10px 0;
              font-size: 2.5em;
              font-weight: 300;
          }
          .header p {
              margin: 0;
              opacity: 0.9;
              font-size: 1.1em;
          }
          .stats {
              display: flex;
              justify-content: center;
              gap: 30px;
              padding: 20px;
              background: #f8f9fa;
              border-bottom: 1px solid #e9ecef;
          }
          .stat {
              text-align: center;
          }
          .stat-value {
              font-size: 2em;
              font-weight: bold;
              margin-bottom: 5px;
          }
          .stat-label {
              font-size: 0.9em;
              color: #6c757d;
              text-transform: uppercase;
              letter-spacing: 1px;
          }
          .content {
              padding: 30px;
          }
          .phases-container {
              display: grid;
              gap: 25px;
          }
          .phase-card {
              background: white;
              border: 1px solid #e9ecef;
              border-radius: 8px;
              padding: 25px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          }
          .phase-title {
              margin: 0 0 15px 0;
              color: #2c3e50;
              font-size: 1.5em;
              border-bottom: 2px solid #667eea;
              padding-bottom: 10px;
          }
          .task-list {
              list-style: none;
              padding: 0;
              margin: 0;
          }
          .task-item {
              padding: 15px;
              border: 1px solid #e9ecef;
              border-radius: 6px;
              margin-bottom: 12px;
              background: #f8f9fa;
          }
          .task-item:last-child {
              margin-bottom: 0;
          }
          .task-title {
              font-weight: 600;
              margin-bottom: 8px;
              color: #2c3e50;
          }
          .task-desc {
              color: #6c757d;
              font-size: 0.9em;
              margin-bottom: 12px;
              line-height: 1.4;
          }
          .task-meta {
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 0.85em;
          }
          .priority-critical {
              background: #fee2e2;
              color: #dc2626;
              padding: 4px 8px;
              border-radius: 12px;
              border: 1px solid #fecaca;
              font-weight: 600;
          }
          .priority-high {
              background: #fee2e2;
              color: #dc2626;
              padding: 4px 8px;
              border-radius: 12px;
              border: 1px solid #fecaca;
              font-weight: 600;
          }
          .priority-medium {
              background: #fef3c7;
              color: #d97706;
              padding: 4px 8px;
              border-radius: 12px;
              border: 1px solid #fed7aa;
              font-weight: 600;
          }
          .priority-low {
              background: #dcfce7;
              color: #16a34a;
              padding: 4px 8px;
              border-radius: 12px;
              border: 1px solid #bbf7d0;
              font-weight: 600;
          }
          .time-estimate {
              background: #e0f2fe;
              color: #0369a1;
              padding: 4px 8px;
              border-radius: 12px;
              border: 1px solid #bae6fd;
          }
          @media (max-width: 768px) {
              .stats {
                  flex-direction: column;
                  gap: 15px;
              }
              .header h1 {
                  font-size: 2em;
              }
              .content {
                  padding: 20px;
              }
          }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="header">
              <h1>${projectName}</h1>
              <p>Project Plan & Timeline</p>
          </div>
          
          <div class="stats">
              <div class="stat">
                  <div class="stat-value" style="color: #667eea;">${plan.length}</div>
                  <div class="stat-label">Tasks</div>
              </div>
              <div class="stat">
                  <div class="stat-value" style="color: #10b981;">${plan.filter((t) => t.phase === "Implementation").length}</div>
                  <div class="stat-label">In Progress</div>
              </div>
              <div class="stat">
                  <div class="stat-value" style="color: #f59e0b;">${Math.round(plan.reduce((sum, task) => sum + task.estimatedTime, 0) / 60)}h</div>
                  <div class="stat-label">Estimated</div>
              </div>
          </div>
          
          <div class="content">
              <div id="phases-container" class="phases-container">
                  <!-- Phases will be populated by JavaScript -->
              </div>
          </div>
      </div>
      
      <script>
          // Project plan data
          const projectPlan = ${JSON.stringify(plan)};
          
          // Group tasks by phase
          const phases = {};
          projectPlan.forEach(function(task) {
              if (!phases[task.phase]) {
                  phases[task.phase] = [];
              }
              phases[task.phase].push(task);
          });
          
          // Function to format time estimate
          function formatTime(minutes) {
              if (minutes < 60) return minutes + ' min';
              const hours = Math.floor(minutes / 60);
              const mins = minutes % 60;
              return mins > 0 ? hours + 'h ' + mins + 'min' : hours + 'h';
          }
          
          // Function to get priority class
          function getPriorityClass(priority) {
              return 'priority-' + priority;
          }
          
          // Populate phases
          const container = document.getElementById('phases-container');
          Object.keys(phases).forEach(function(phaseName) {
              const tasks = phases[phaseName];
              const totalHours = Math.round(tasks.reduce(function(sum, task) { return sum + task.estimatedTime; }, 0) / 60);
              
              // Build task list HTML
              var taskListHtml = '';
              tasks.forEach(function(task) {
                  var priorityLabel = task.priority === 'critical' ? '\u{1F525} CRITICAL' : 
                                     task.priority === 'high' ? '\u26A1 HIGH' : 
                                     task.priority === 'medium' ? '\u{1F538} MEDIUM' : '\u{1F331} LOW';
                  var timeEstimate = formatTime(task.estimatedTime);
                  var priorityClass = getPriorityClass(task.priority);
                  
                  taskListHtml += 
                      '<li class="task-item">' +
                          '<div class="task-title">' + task.title + '</div>' +
                          '<div class="task-desc">' + task.description + '</div>' +
                          '<div class="task-meta">' +
                              '<span class="' + priorityClass + '">' +
                                  priorityLabel +
                              '</span>' +
                              '<span class="time-estimate">' + timeEstimate + '</span>' +
                          '</div>' +
                      '</li>';
              });
              
              var phaseHtml = 
                  '<div class="phase-card">' +
                      '<h3 class="phase-title">' + phaseName + '</h3>' +
                      '<div style="font-size: 12px; color: #6b7280; margin-bottom: 16px;">' +
                          tasks.length + ' tasks \u2022 ~' + totalHours + ' hours' +
                      '</div>' +
                      '<ul class="task-list">' +
                          taskListHtml +
                      '</ul>' +
                  '</div>';
              
              container.innerHTML += phaseHtml;
          });
      </script>
  </body>
  </html>
  `;
};
var projectPlanningTool = {
  description: "Creates detailed project plans by breaking down complex projects into manageable tasks and phases. Useful for planning large projects like game development, software development, or research projects.",
  execute: async (args, ctx) => {
    try {
      ctx.log.info(`Generating project plan for: ${args.projectName}`);
      let template = GAME_DEVELOPMENT_TEMPLATE;
      if (args.projectDescription.toLowerCase().includes("game") || args.projectDescription.toLowerCase().includes("jeu") || args.projectName.toLowerCase().includes("game") || args.projectName.toLowerCase().includes("jeu")) {
        template = GAME_DEVELOPMENT_TEMPLATE;
      }
      const planWithIds = template.tasks.map((task) => ({
        ...task,
        id: generateId()
      }));
      if (ctx.job?.id) {
        const planTemplate = createProjectPlanTemplate(args.projectName, planWithIds);
        await sendToCanvas(ctx.job.id, planTemplate, "html");
        ctx.log.info("Project plan sent to canvas for visualization");
      }
      return {
        success: true,
        message: `Project plan generated for "${args.projectName}" with ${planWithIds.length} tasks`,
        plan: planWithIds
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      ctx.log.error({ err: error }, `Error in projectPlanningTool: ${errorMessage}`);
      return { error: `Failed to generate project plan: ${errorMessage}` };
    }
  },
  name: "project_planning",
  parameters: projectPlanningParams
};

export {
  projectPlanningTool
};
