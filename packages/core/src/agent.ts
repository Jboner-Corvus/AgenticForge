import { Job, Queue } from 'bullmq';
import { Content } from 'fastmcp';
import { Logger } from 'pino';
import { z } from 'zod';

import { config } from './config.js';
import { LLMContent } from './llm-types.js';
import logger from './logger.js';
import { getMasterPrompt } from './prompts/orchestrator.prompt.js';
import { redis } from './redisClient.js';
import { toolRegistry } from './toolRegistry.js';
import { FinishToolSignal } from './tools/index.js';
import { AgentProgress, Ctx, SessionData, Tool } from './types.js';
import { llmProvider } from './utils/llmProvider.js';

// Schéma Zod pour la réponse du LLM
const llmResponseSchema = z.object({
  answer: z.string().optional(),
  command: z
    .object({
      name: z.string(),
      params: z.unknown(),
    })
    .optional(),
  thought: z.string().optional(),
});

type ChannelData =
  | { content: string; type: 'agent_response' }
  | { content: string; type: 'agent_thought' }
  | { content: string; type: 'raw_llm_response' }
  | { data: { args: unknown; name: string }; type: 'tool.start' }
  | { result: unknown; toolName: string; type: 'tool_result' };

interface Command {
  name: string;
  params?: unknown;
}

export class Agent {
  private interrupted = false;
  private readonly job: Job;
  private lastCommand: Command | undefined;
  private readonly log: Logger;
  private loopCounter = 0;
  private readonly session: SessionData;
  private readonly taskQueue: Queue;
  private readonly tools: Tool<z.AnyZodObject, z.ZodTypeAny>[];

  constructor(
    job: Job,
    session: SessionData,
    taskQueue: Queue,
    tools?: Tool<z.AnyZodObject, z.ZodTypeAny>[],
  ) {
    this.job = job;
    this.session = session;
    this.log = logger.child({ jobId: job.id, sessionId: session.id });
    this.taskQueue = taskQueue;
    this.tools = tools ?? [];
  }

  public async run(): Promise<string> {
    this.log.info('Agent starting...');
    const { prompt } = this.job.data;
    this.session.history.push({ content: prompt, role: 'user' });

    try {
      this.log.info(
        { count: this.tools.length },
        'All tools are available in the registry.',
      );

      await this.setupInterruptListener();

      let iterations = 0;
      const MAX_ITERATIONS = config.AGENT_MAX_ITERATIONS ?? 10;

      while (iterations < MAX_ITERATIONS) {
        // Check if the job has been stopped or interrupted.
        if (this.interrupted) {
          this.log.info('Job has been interrupted.');
          break;
        }
        if (await this.job.isFailed()) {
          this.log.info('Job has failed.');
          this.interrupted = true;
          break;
        }

        iterations++;
        const iterationLog = this.log.child({ iteration: iterations });
        iterationLog.info(`Agent iteration starting`);

        const orchestratorPrompt = getMasterPrompt(
          { data: this.session, id: this.session.id },
          toolRegistry.getAll(),
        );

        iterationLog.info({ history: this.session.history }, 'Session history');

        const messagesForLlm: LLMContent[] = this.session.history
          .map((message): LLMContent | null => {
            const role = message.role === 'tool' ? 'user' : message.role;
            this.log.info(
              { mappedRole: role, role: message.role },
              'Mapping role',
            );
            if (role === 'user' || role === 'model') {
              return {
                parts: [{ text: message.content }],
                role,
              };
            }
            return null;
          })
          .filter((m): m is LLMContent => m !== null);

        const llmResponse = await llmProvider.getLlmResponse(
          messagesForLlm,
          orchestratorPrompt,
        );
        this.log.info({ llmResponse }, 'Raw LLM response');

        if (typeof llmResponse !== 'string') {
          const errorMessage = 'The `generate` tool did not return a string.';
          iterationLog.error(errorMessage);
          this.session.history.push({
            content: errorMessage,
            role: 'user',
          });
          continue;
        }

        // Add the LLM's raw response to the history with 'model' role
        this.session.history.push({
          content: llmResponse,
          role: 'model',
        });

        const parsedResponse = this.parseLlmResponse(llmResponse, iterationLog);

        if (!parsedResponse) {
          const errorMessage = `Your last response was not a valid command. You must choose a tool from the list or provide a final answer. Please try again. Last response: ${llmResponse}`;
          iterationLog.warn(errorMessage);
          this.session.history.push({
            content: errorMessage,
            role: 'user',
          });
          continue;
        }

        const { answer, command, thought } = parsedResponse;

        if (thought) {
          iterationLog.info({ thought }, 'Agent thought');
          this.publishToChannel({ content: thought, type: 'agent_thought' });
        }

        if (answer) {
          iterationLog.info({ answer }, 'Agent final answer');
          this.publishToChannel({
            content: answer,
            type: 'agent_response',
          });
          return answer;
        }

        if (command) {
          if (
            this.lastCommand &&
            JSON.stringify(this.lastCommand) === JSON.stringify(command)
          ) {
            this.loopCounter++;
          } else {
            this.loopCounter = 0;
          }
          this.lastCommand = command;

          if (this.loopCounter > 3) {
            this.log.warn('Loop detected. Breaking.');
            return 'Agent stuck in a loop.';
          }

          if (command.name === 'finish' && !command.params) {
            command.params = { response: 'Goal achieved.' };
          }

          const eventData: ChannelData = {
            data: {
              args: command.params,
              name: command.name,
            },
            type: 'tool.start',
          };
          this.publishToChannel(eventData);

          const toolResult = await this.executeTool(command, iterationLog);
          const summarizedResult = this.summarizeToolResult(toolResult);

          this.session.history.push({
            content: `Tool result: ${JSON.stringify(summarizedResult)}`,
            role: 'tool',
          });
        } else {
          iterationLog.warn('No command or answer from LLM.');
          return "I'm not sure how to proceed.";
        }
      }

      if (this.interrupted) {
        return 'Agent execution interrupted.';
      }

      return 'Agent reached maximum iterations without a final answer.';
    } catch (error) {
      if (error instanceof FinishToolSignal) {
        this.log.info(
          { response: error.response },
          'Finish tool detected, stopping agent execution.',
        );
        return error.response;
      }
      this.log.error({ error }, 'Error during agent run');
      return `Error: ${(error as Error).message}`;
    }
  }

  private createToolContext(log: Logger): Ctx {
    return {
      job: this.job,
      llm: llmProvider,
      log,
      reportProgress: async (progress: AgentProgress) => {
        log.debug(
          `Tool progress: ${progress.current}/${progress.total} ${
            progress.unit || ''
          }`,
        );
      },
      session: this.session,
      streamContent: async (content: Content | Content[]) => {
        log.debug(`Tool stream: ${JSON.stringify(content)}`);
      },
      taskQueue: this.taskQueue,
    };
  }

  private async executeTool(command: Command, log: Logger): Promise<unknown> {
    try {
      log.info({ command }, 'Executing tool');
      const toolResult = await toolRegistry.execute(
        command.name,
        command.params,
        this.createToolContext(log),
      );
      this.publishToChannel({
        result: toolResult,
        toolName: command.name,
        type: 'tool_result',
      });

      if (!this.session.workingContext) {
        this.session.workingContext = {};
      }
      this.session.workingContext.lastAction = command.name;

      if (
        (command.name === 'writeFile' || command.name === 'editFile') &&
        command.params &&
        typeof command.params === 'object' &&
        'path' in command.params &&
        typeof command.params.path === 'string'
      ) {
        this.session.workingContext.currentFile = command.params.path;
      }

      return toolResult;
    } catch (error) {
      if (error instanceof FinishToolSignal) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorDetails = {
        error: errorMessage,
        params: command.params,
        toolName: command.name,
      };
      log.error(
        { error: errorDetails },
        `Error executing tool ${command.name}`,
      );

      const thought = `Tool ${command.name} failed with error: ${errorMessage}. Parameters: ${JSON.stringify(command.params)}. I will now attempt to recover.`;
      this.publishToChannel({ content: thought, type: 'agent_thought' });

      // Publish a structured tool_result with the error
      this.publishToChannel({
        result: {
          error: errorMessage,
          params: command.params,
          toolName: command.name,
        },
        toolName: command.name,
        type: 'tool_result',
      });

      this.session.history.push({
        content: `Error executing tool ${command.name}: ${errorMessage}`,
        role: 'tool',
      });
      return errorDetails;
    }
  }

  private parseLlmResponse(
    response: string,
    log: Logger,
  ): null | z.infer<typeof llmResponseSchema> {
    if (!response.trim()) {
      log.warn('LLM response is empty.');
      return null;
    }
    try {
      const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/;
      const match = response.match(jsonBlockRegex);

      if (!match || !match[1]) {
        log.error(
          { responseText: response },
          'No JSON code block found in LLM response.',
        );
        const firstBraceIndex = response.indexOf('{');
        const lastBraceIndex = response.lastIndexOf('}');
        if (firstBraceIndex === -1 || lastBraceIndex === -1) {
          return null;
        }
        const jsonString = response.substring(
          firstBraceIndex,
          lastBraceIndex + 1,
        );
        const parsed = JSON.parse(jsonString);
        const validation = llmResponseSchema.safeParse(parsed);
        return validation.success ? validation.data : null;
      }

      const jsonString = match[1];
      const parsed = JSON.parse(jsonString);
      const validation = llmResponseSchema.safeParse(parsed);

      if (validation.success) {
        return validation.data;
      }

      log.error(
        {
          error: validation.error.flatten(),
          responseText: response,
        },
        'LLM response validation failed against Zod schema',
      );
      return null;
    } catch (error) {
      log.error(
        { error, responseText: response },
        'Failed to parse LLM response as JSON',
      );
      return null;
    }
  }

  private publishToChannel(data: ChannelData) {
    const channel = `job:${this.job.id}:events`;
    redis.publish(channel, JSON.stringify(data));
  }

  private setupInterruptListener() {
    const subscriber = redis.duplicate();
    const channel = `job:${this.job.id}:interrupt`;

    return new Promise<void>((resolve, reject) => {
      subscriber.subscribe(channel, (err, count) => {
        if (err) {
          this.log.error(err, `Failed to subscribe to ${channel}`);
          return reject(err);
        }
        this.log.info(
          `Subscribed to ${channel}, number of subscriptions: ${count}`,
        );
        resolve();
      });

      subscriber.on('message', (ch, message) => {
        if (ch === channel) {
          this.log.info(`Received interrupt signal: ${message}`);
          this.interrupted = true;
          subscriber.unsubscribe(channel);
          subscriber.quit();
        }
      });
    });
  }

  private summarizeToolResult(toolResult: unknown): unknown {
    if (Array.isArray(toolResult) && toolResult.length > 20) {
      return `Result too large. First 20 items: ${JSON.stringify(toolResult.slice(0, 20))}`;
    }
    if (typeof toolResult === 'string' && toolResult.length > 2000) {
      return `Result too large. First 2000 characters: ${toolResult.substring(0, 2000)}`;
    }
    return toolResult;
  }
}
