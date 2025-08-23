import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  config
} from "./chunk-DVHMHG4X.js";
import {
  __export,
  init_esm_shims
} from "./chunk-SB7UONON.js";

// src/modules/tools/definitions/code/executeShellCommand.tool.ts
init_esm_shims();
import { z } from "zod";

// src/utils/shellUtils.ts
var shellUtils_exports = {};
__export(shellUtils_exports, {
  executeShellCommand: () => executeShellCommand
});
init_esm_shims();
import { spawn } from "child_process";
import { access, constants } from "fs/promises";
async function executeShellCommand(command, ctx, timeoutMs = 3e4) {
  const dangerousCommands = [
    "rm -rf /",
    "mkfs",
    "dd if=",
    "format",
    "fdisk",
    "shutdown",
    "reboot",
    "halt",
    "poweroff",
    "init 0",
    "init 6",
    "killall -9",
    "pkill -9 -f"
  ];
  const commandLower = command.toLowerCase();
  for (const dangerous of dangerousCommands) {
    if (commandLower.includes(dangerous.toLowerCase())) {
      throw new Error(`Commande dangereuse d\xE9tect\xE9e et bloqu\xE9e: ${dangerous}`);
    }
  }
  if (command.length > 1e3) {
    throw new Error("Commande trop longue (max 1000 caract\xE8res)");
  }
  const workingDir = config.WORKER_WORKSPACE_PATH || config.HOST_PROJECT_PATH;
  async function findBashPath() {
    const possiblePaths = ["/bin/bash", "/usr/bin/bash"];
    for (const p of possiblePaths) {
      try {
        await access(p, constants.X_OK);
        return p;
      } catch (_e) {
      }
    }
    throw new Error("Bash executable not found at expected paths.");
  }
  let shellPath;
  try {
    shellPath = await findBashPath();
  } catch (error) {
    ctx.log.error({ err: error }, "Failed to find bash executable.");
    throw error;
  }
  return new Promise((resolve, reject) => {
    ctx.log.info(
      {
        cwd: workingDir,
        path: process.env.PATH,
        shell: shellPath,
        timeoutMs
      },
      "Executing shell command with environment:"
    );
    const child = spawn(shellPath, ["-c", command], {
      cwd: workingDir,
      env: process.env,
      stdio: "pipe"
    });
    let stdout = "";
    let stderr = "";
    let isFinished = false;
    const timeoutId = setTimeout(() => {
      if (!isFinished) {
        isFinished = true;
        child.kill("SIGKILL");
        reject(
          new Error(`Commande interrompue apr\xE8s ${timeoutMs}ms (timeout)`)
        );
      }
    }, timeoutMs);
    const MAX_OUTPUT_SIZE = 10 * 1024 * 1024;
    child.stdout?.on("data", (data) => {
      const chunk = data.toString();
      if (stdout.length + chunk.length > MAX_OUTPUT_SIZE) {
        child.kill("SIGKILL");
        clearTimeout(timeoutId);
        if (!isFinished) {
          isFinished = true;
          reject(
            new Error("Sortie trop volumineuse (>10MB), commande interrompue")
          );
        }
        return;
      }
      stdout += chunk;
      if (ctx.streamContent) {
        ctx.streamContent([
          { content: chunk, toolName: "executeShellCommand", type: "stdout" }
        ]);
      }
    });
    child.stderr?.on("data", (data) => {
      const chunk = data.toString();
      if (stderr.length + chunk.length > MAX_OUTPUT_SIZE) {
        child.kill("SIGKILL");
        clearTimeout(timeoutId);
        if (!isFinished) {
          isFinished = true;
          reject(
            new Error("Erreur trop volumineuse (>10MB), commande interrompue")
          );
        }
        return;
      }
      stderr += chunk;
      if (ctx.streamContent) {
        ctx.streamContent([
          { content: chunk, toolName: "executeShellCommand", type: "stderr" }
        ]);
      }
    });
    child.on("close", (code) => {
      clearTimeout(timeoutId);
      if (!isFinished) {
        isFinished = true;
        resolve({ exitCode: code, stderr, stdout });
      }
    });
    child.on("error", (err) => {
      clearTimeout(timeoutId);
      if (!isFinished) {
        isFinished = true;
        ctx.log.error(
          {
            cwd: workingDir,
            err,
            path: process.env.PATH,
            shell: shellPath
          },
          "Shell command execution failed"
        );
        reject(err);
      }
    });
  });
}

// src/modules/tools/definitions/code/executeShellCommand.tool.ts
var executeShellCommandParams = z.object({
  command: z.string().describe("The shell command to execute."),
  detach: z.boolean().optional().describe(
    "If true, the command will be executed in the background and the tool will return immediately."
  )
});
var executeShellCommandOutput = z.object({
  exitCode: z.number().nullable(),
  stderr: z.string(),
  stdout: z.string()
});
var executeShellCommandTool = {
  description: "Executes ANY shell command, including complex ones like `ls -la`. Use this for direct OS interaction like listing files, running scripts, or process management. Be cautious with destructive commands.",
  execute: async (args, ctx) => {
    const detachCommand = args.detach ?? false;
    if (detachCommand) {
      const jobId = `shell-command-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      await ctx.taskQueue.add(
        "execute-shell-command-detached",
        // Job name for the worker
        {
          command: args.command,
          jobId: ctx.job.id,
          notificationChannel: `job:${ctx.job.id}:events`
        },
        { jobId, removeOnComplete: true, removeOnFail: true }
      );
      ctx.log.info(
        `Enqueued detached shell command: ${args.command} with job ID: ${jobId}`
      );
      return {
        exitCode: 0,
        stderr: "",
        stdout: `Command "${args.command}" enqueued for background execution with job ID: ${jobId}. Results will be streamed to the frontend.`
      };
    }
    try {
      const result = await executeShellCommand(args.command, ctx);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      ctx.log.error(
        { err: error },
        `Error executing shell command: ${errorMessage}`
      );
      return {
        exitCode: 1,
        stderr: `An unexpected error occurred: ${errorMessage}`,
        stdout: ""
      };
    }
  },
  name: "executeShellCommand",
  parameters: executeShellCommandParams
};

export {
  executeShellCommand,
  shellUtils_exports,
  executeShellCommandParams,
  executeShellCommandOutput,
  executeShellCommandTool
};
