import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  sendToCanvas
} from "./chunk-L6WJ56J2.js";
import {
  init_esm_shims
} from "./chunk-SB7UONON.js";

// src/modules/tools/definitions/planning/projectPlanning.tool.ts
init_esm_shims();
import { z } from "zod";
import { promises as fs } from "fs";
import path from "path";
var projectPlanningParams = z.object({
  complexity: z.enum(["simple", "medium", "complex"]).optional().describe("Complexity level of the project"),
  projectDescription: z.string().describe("Detailed description of the project"),
  projectId: z.string().optional().describe("ID of existing project to update"),
  projectName: z.string().describe("Name of the project to plan")
});
var projectPlanningOutput = z.union([
  z.object({
    message: z.string(),
    plan: z.array(
      z.object({
        description: z.string(),
        estimatedTime: z.number(),
        id: z.string(),
        phase: z.string(),
        priority: z.enum(["low", "medium", "high", "critical"]),
        title: z.string()
      })
    ),
    success: z.boolean()
  }),
  z.object({
    error: z.string()
  })
]);
var GAME_DEVELOPMENT_TEMPLATE = {
  name: "Game Development Project",
  tasks: [
    {
      description: "Define project scope, create development environment, and establish team roles",
      estimatedTime: 120,
      phase: "Pre-Production",
      priority: "high",
      title: "Project Setup & Planning"
    },
    {
      description: "Create comprehensive GDD including story, mechanics, characters, and level design",
      estimatedTime: 240,
      phase: "Pre-Production",
      priority: "critical",
      title: "Game Design Document"
    },
    {
      description: "Build basic gameplay prototype to test core mechanics",
      estimatedTime: 180,
      phase: "Pre-Production",
      priority: "high",
      title: "Prototype Development"
    },
    {
      description: "Design and create all visual assets including characters, environments, and UI elements",
      estimatedTime: 480,
      phase: "Production",
      priority: "high",
      title: "Art Asset Creation"
    },
    {
      description: "Implement game engine with physics, rendering, and audio systems",
      estimatedTime: 360,
      phase: "Production",
      priority: "critical",
      title: "Core Engine Development"
    },
    {
      description: "Create engaging levels with proper difficulty progression",
      estimatedTime: 300,
      phase: "Production",
      priority: "high",
      title: "Level Design"
    },
    {
      description: "Code all gameplay mechanics, controls, and interactions",
      estimatedTime: 420,
      phase: "Production",
      priority: "critical",
      title: "Gameplay Implementation"
    },
    {
      description: "Integrate sound effects, music, and voice acting",
      estimatedTime: 180,
      phase: "Production",
      priority: "medium",
      title: "Audio Implementation"
    },
    {
      description: "Design and implement user interface and experience elements",
      estimatedTime: 240,
      phase: "Production",
      priority: "high",
      title: "UI/UX Development"
    },
    {
      description: "Conduct thorough testing including unit tests, integration tests, and playtesting",
      estimatedTime: 300,
      phase: "Post-Production",
      priority: "critical",
      title: "Testing & QA"
    },
    {
      description: "Address all identified issues and polish the game for release",
      estimatedTime: 240,
      phase: "Post-Production",
      priority: "high",
      title: "Bug Fixes & Polishing"
    },
    {
      description: "Prepare final build, create distribution packages, and deploy to platforms",
      estimatedTime: 180,
      phase: "Post-Production",
      priority: "medium",
      title: "Deployment & Release"
    }
  ]
};
var generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);
var parseExistingMarkdown = async (filePath) => {
  try {
    const content = await fs.readFile(filePath, "utf8");
    const nameMatch = content.match(/^# (.+)$/m);
    const projectName = nameMatch ? nameMatch[1] : path.basename(filePath, "_plan.md");
    const descMatch = content.match(/\*\*Description:\*\* (.+)$/m);
    const projectDescription = descMatch ? descMatch[1] : "";
    const tasks = [];
    const phaseMatches = [...content.matchAll(/### (.+?)(?=###|$)/gs)];
    for (const phaseMatch of phaseMatches) {
      const phaseName = phaseMatch[1].split("\n")[0].trim();
      const phaseContent = phaseMatch[1];
      const taskMatches = [...phaseContent.matchAll(/#### \d+\. (.+?)\n\n\*\*Description:\*\* (.+?)\n\n\*\*Priorité:\*\* [🔥⚡🔸🌱] ([A-Z]+)\s*\n\*\*Estimation:\*\* ([\d.]+)h/g)];
      for (const taskMatch of taskMatches) {
        const [, title, description, priority, hours] = taskMatch;
        tasks.push({
          title: title.trim(),
          description: description.trim(),
          priority: priority.toLowerCase(),
          estimatedTime: Math.round(parseFloat(hours) * 60),
          phase: phaseName,
          id: generateId()
        });
      }
    }
    return {
      projectName,
      projectDescription,
      tasks,
      found: true
    };
  } catch (error) {
    return { found: false, tasks: [] };
  }
};
var createProjectPlanMarkdown = (projectName, projectDescription, plan) => {
  const totalHours = Math.round(plan.reduce((sum, task) => sum + task.estimatedTime, 0) / 60);
  const phases = plan.reduce((acc, task) => {
    if (!acc[task.phase]) {
      acc[task.phase] = [];
    }
    acc[task.phase].push(task);
    return acc;
  }, {});
  const priorityEmojis = {
    critical: "\u{1F525}",
    high: "\u26A1",
    medium: "\u{1F538}",
    low: "\u{1F331}"
  };
  let markdown = `# ${projectName}

`;
  markdown += `**Description:** ${projectDescription}

`;
  markdown += `## \u{1F4CA} Statistiques du projet

`;
  markdown += `- **Nombre total de t\xE2ches:** ${plan.length}
`;
  markdown += `- **Estimation totale:** ${totalHours} heures
`;
  markdown += `- **Phases:** ${Object.keys(phases).length}
`;
  markdown += `- **Date de g\xE9n\xE9ration:** ${(/* @__PURE__ */ new Date()).toLocaleDateString("fr-FR")}

`;
  markdown += `## \u{1F4CB} Plan d\xE9taill\xE9

`;
  Object.keys(phases).forEach((phaseName) => {
    const tasks = phases[phaseName];
    const phaseHours = Math.round(tasks.reduce((sum, task) => sum + task.estimatedTime, 0) / 60);
    markdown += `### ${phaseName}

`;
    markdown += `*${tasks.length} t\xE2ches \u2022 ~${phaseHours} heures*

`;
    tasks.forEach((task, index) => {
      const hours = Math.round(task.estimatedTime / 60 * 10) / 10;
      const priorityText = priorityEmojis[task.priority] + " " + task.priority.toUpperCase();
      markdown += `#### ${index + 1}. ${task.title}

`;
      markdown += `**Description:** ${task.description}

`;
      markdown += `**Priorit\xE9:** ${priorityText}  
`;
      markdown += `**Estimation:** ${hours}h

`;
    });
  });
  markdown += `---

`;
  markdown += `*Plan g\xE9n\xE9r\xE9 automatiquement par AgenticForge*
`;
  return markdown;
};
var createProjectPlanTemplate = (projectName, plan) => {
  const totalHours = Math.round(plan.reduce((sum, task) => sum + task.estimatedTime, 0) / 60);
  const phases = plan.reduce((acc, task) => {
    if (!acc[task.phase]) {
      acc[task.phase] = [];
    }
    acc[task.phase].push(task);
    return acc;
  }, {});
  const priorityLabels = {
    critical: "\u{1F525} CRITICAL",
    high: "\u26A1 HIGH",
    medium: "\u{1F538} MEDIUM",
    low: "\u{1F331} LOW"
  };
  let phasesHtml = "";
  Object.keys(phases).forEach((phaseName) => {
    const tasks = phases[phaseName];
    const phaseHours = Math.round(tasks.reduce((sum, task) => sum + task.estimatedTime, 0) / 60);
    let tasksHtml = "";
    tasks.forEach((task) => {
      const hours = Math.round(task.estimatedTime / 60 * 10) / 10;
      const timeText = hours < 1 ? `${task.estimatedTime}min` : `${hours}h`;
      tasksHtml += `
        <div class="task-item priority-${task.priority}">
          <div class="task-title">${task.title}</div>
          <div class="task-desc">${task.description}</div>
          <div class="task-meta">
            <span class="priority-badge">${priorityLabels[task.priority]}</span>
            <span class="time-badge">${timeText}</span>
          </div>
        </div>`;
    });
    phasesHtml += `
      <div class="phase-card">
        <h3 class="phase-title">${phaseName}</h3>
        <div class="phase-meta">${tasks.length} t\xE2ches \u2022 ~${phaseHours}h</div>
        <div class="tasks-container">${tasksHtml}</div>
      </div>`;
  });
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Plan: ${projectName}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #667eea, #764ba2); min-height: 100vh; }
    .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); overflow: hidden; }
    .header { background: linear-gradient(135deg, #2c3e50, #34495e); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 2.5em; font-weight: 300; }
    .stats { display: flex; justify-content: center; gap: 30px; padding: 20px; background: #f8f9fa; border-bottom: 1px solid #e9ecef; }
    .stat { text-align: center; }
    .stat-value { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
    .stat-label { font-size: 0.9em; color: #6c757d; text-transform: uppercase; }
    .content { padding: 30px; }
    .phases-container { display: grid; gap: 25px; }
    .phase-card { background: white; border: 1px solid #e9ecef; border-radius: 8px; padding: 25px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
    .phase-title { margin: 0 0 10px 0; color: #2c3e50; font-size: 1.5em; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
    .phase-meta { font-size: 0.9em; color: #6b7280; margin-bottom: 16px; }
    .tasks-container { display: grid; gap: 12px; }
    .task-item { padding: 15px; border-radius: 6px; background: #f8f9fa; border-left: 4px solid #ddd; }
    .task-item.priority-critical { border-left-color: #dc2626; }
    .task-item.priority-high { border-left-color: #ea580c; }
    .task-item.priority-medium { border-left-color: #d97706; }
    .task-item.priority-low { border-left-color: #16a34a; }
    .task-title { font-weight: 600; margin-bottom: 8px; color: #2c3e50; }
    .task-desc { color: #6c757d; font-size: 0.9em; margin-bottom: 12px; line-height: 1.4; }
    .task-meta { display: flex; justify-content: space-between; align-items: center; font-size: 0.85em; }
    .priority-badge, .time-badge { padding: 4px 8px; border-radius: 12px; font-weight: 600; font-size: 0.8em; }
    .time-badge { background: #e0f2fe; color: #0369a1; }
    @media (max-width: 768px) { 
      .stats { flex-direction: column; gap: 15px; }
      .header h1 { font-size: 2em; }
      .content { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${projectName}</h1>
      <p>Plan de projet & chronologie</p>
    </div>
    <div class="stats">
      <div class="stat">
        <div class="stat-value" style="color: #667eea;">${plan.length}</div>
        <div class="stat-label">T\xE2ches</div>
      </div>
      <div class="stat">
        <div class="stat-value" style="color: #10b981;">${Object.keys(phases).length}</div>
        <div class="stat-label">Phases</div>
      </div>
      <div class="stat">
        <div class="stat-value" style="color: #f59e0b;">${totalHours}h</div>
        <div class="stat-label">Estimation</div>
      </div>
    </div>
    <div class="content">
      <div class="phases-container">${phasesHtml}</div>
    </div>
  </div>
</body>
</html>`;
};
var projectPlanningTool = {
  description: "Creates detailed project plans by breaking down complex projects into manageable tasks and phases. Automatically loads existing project plans from Markdown files if found, or creates new ones. Saves plans as Markdown files in the current directory. Useful for planning large projects like game development, software development, or research projects.",
  execute: async (args, ctx) => {
    try {
      ctx.log.info(`Generating/loading project plan for: ${args.projectName}`);
      const sanitizedName = args.projectName.replace(/[^a-zA-Z0-9-_]/g, "_");
      const filename = `${sanitizedName}_plan.md`;
      const currentDir = process.cwd();
      const filePath = path.join(currentDir, filename);
      const existingProject = await parseExistingMarkdown(filePath);
      let planWithIds;
      let actualProjectName = args.projectName;
      let actualProjectDescription = args.projectDescription;
      if (existingProject.found && existingProject.tasks.length > 0) {
        planWithIds = existingProject.tasks;
        actualProjectName = existingProject.projectName || args.projectName;
        actualProjectDescription = existingProject.projectDescription || args.projectDescription;
        ctx.log.info(`Found existing project plan with ${planWithIds.length} tasks. Loading from file.`);
      } else {
        ctx.log.info(`No existing project found. Generating new plan.`);
        let template = GAME_DEVELOPMENT_TEMPLATE;
        if (args.projectDescription.toLowerCase().includes("game") || args.projectDescription.toLowerCase().includes("jeu") || args.projectName.toLowerCase().includes("game") || args.projectName.toLowerCase().includes("jeu")) {
          template = GAME_DEVELOPMENT_TEMPLATE;
        }
        planWithIds = template.tasks.map((task) => ({
          ...task,
          id: generateId()
        }));
      }
      if (ctx.job?.id) {
        const planTemplate = createProjectPlanTemplate(
          actualProjectName,
          planWithIds
        );
        await sendToCanvas(ctx.job.id, planTemplate, "html");
        ctx.log.info("Project plan sent to canvas for visualization");
      }
      if (!existingProject.found || existingProject.tasks.length === 0) {
        try {
          const markdownContent = createProjectPlanMarkdown(
            actualProjectName,
            actualProjectDescription,
            planWithIds
          );
          await fs.writeFile(filePath, markdownContent, "utf8");
          ctx.log.info(`Project plan automatically saved to: ${filePath}`);
        } catch (saveError) {
          ctx.log.warn("Failed to auto-save project plan as Markdown:", saveError);
        }
      }
      const statusMessage = existingProject.found ? `Existing project plan loaded for "${actualProjectName}" with ${planWithIds.length} tasks from "${filename}".` : `New project plan generated for "${actualProjectName}" with ${planWithIds.length} tasks. Plan automatically saved as "${filename}" in current directory.`;
      return {
        message: statusMessage,
        plan: planWithIds,
        success: true
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      ctx.log.error(
        { err: error },
        `Error in projectPlanningTool: ${errorMessage}`
      );
      return { error: `Failed to generate project plan: ${errorMessage}` };
    }
  },
  name: "project_planning",
  parameters: projectPlanningParams
};

export {
  projectPlanningTool
};
