import { Job, Queue } from 'bullmq';
import { Content } from 'fastmcp';
import { Logger } from 'pino';
import { z } from 'zod';

import { config } from './config.js';
import logger from './logger.js';
import { getMasterPrompt } from './prompts/orchestrator.prompt.js';
import { redis } from './redisClient.js';
import { toolRegistry } from './toolRegistry.js';
import { AgentProgress, Ctx, Message, SessionData } from './types.js';
import { llmProvider } from './utils/llmProvider.js';
import { getTools } from './utils/toolLoader.js';

// Schéma Zod pour la réponse du LLM
const llmResponseSchema = z.object({
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
  private readonly interruptChannel: string;
  private interrupted = false;
  private readonly job: Job;
  private readonly log: Logger;
  private readonly session: SessionData;
  private readonly taskQueue: Queue;

  constructor(job: Job, session: SessionData, taskQueue: Queue) {
    this.job = job;
    this.session = session;
    this.log = logger.child({ jobId: job.id, sessionId: session.id });
    this.taskQueue = taskQueue;
    this.interruptChannel = `job:${job.id}:interrupt`;
  }

  public async run(): Promise<string> {
    this.log.info('Agent starting...');
    const { prompt } = this.job.data;
    this.session.history.push({ content: prompt, role: 'user' });

    try {
      await getTools(); // Ensure tools are loaded
      this.setupInterruptListener();

      let iterations = 0;
      const MAX_ITERATIONS = config.AGENT_MAX_ITERATIONS ?? 10;

      while (iterations < MAX_ITERATIONS && !this.interrupted) {
        iterations++;
        const iterationLog = this.log.child({ iteration: iterations });
        iterationLog.info(`Agent iteration starting`);

        const orchestratorPrompt = getMasterPrompt(
          { data: this.session, id: this.session.id },
          toolRegistry.getAll(),
        );

        const llmResponse = await llmProvider.getLlmResponse(
          this.session.history.map((h) => ({
            parts: [{ text: h.content }],
            role: h.role as 'model' | 'user',
          })),
          orchestratorPrompt,
        );

        const parsedResponse = this.parseLlmResponse(llmResponse, iterationLog);

        if (!parsedResponse || !parsedResponse.command) {
          const errorMessage = `Your last response was not a valid command. You must choose a tool from the list. Please try again.`;
          iterationLog.warn(errorMessage);
          this.session.history.push({
            content: errorMessage,
            role: 'user',
          });
          continue;
        }

        const { command, thought } = parsedResponse;

        if (thought) {
          iterationLog.info({ thought }, 'Agent thought');
          this.publishToChannel({ content: thought, type: 'agent_thought' });
        }

        if (command) {
          // Envoyer un événement au frontend pour chaque outil sur le point d'être exécuté
          const eventData: ChannelData = {
            data: {
              args: command.params,
              name: command.name,
            },
            type: 'tool.start',
          };
          this.publishToChannel(eventData);

          const toolResult = await this.executeTool(command, iterationLog);

          if (command.name === 'finish') {
            iterationLog.info(
              'Finish tool detected, stopping agent execution.',
            );
            this.publishToChannel({
              content: toolResult as string,
              type: 'agent_response',
            });
            return toolResult as string;
          }

          this.session.history.push({
            content: `Tool result: ${JSON.stringify(toolResult)}`,
            role: 'model',
          });
        } else if (thought) {
          return thought;
        } else {
          iterationLog.warn('No command or thought from LLM.');
          return "I'm not sure how to proceed.";
        }
      }

      if (this.interrupted) {
        return 'Agent execution interrupted.';
      }

      return 'Agent reached maximum iterations without a final answer.';
    } catch (error) {
      this.log.error({ error }, 'Error during agent run');
      return `Error: ${(error as Error).message}`;
    }
  }

  private createToolContext(log: Logger): Ctx {
    return {
      job: this.job,
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

      // Update working context
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
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      log.error({ error }, `Error executing tool ${command.name}`);

      const thought = `Tool ${command.name} failed with error: ${errorMessage}. I will now attempt to recover.`;
      this.publishToChannel({ content: thought, type: 'agent_thought' });

      this.session.history.push({
        content: `Error executing tool ${command.name}: ${errorMessage}`,
        role: 'tool',
      });
      return errorMessage;
    }
  }

  private async getLlmResponse(prompt: string, log: Logger): Promise<string> {
    const history = this.session.history.map((msg: Message) => ({
      parts: [{ text: msg.content }],
      role: msg.role as 'model' | 'user',
    }));

    const response = await llmProvider.getLlmResponse([
      ...history,
      { parts: [{ text: prompt }], role: 'user' },
    ]);

    log.info({ modelResponseContent: response }, 'Model response');
    this.publishToChannel({
      content: response,
      type: 'raw_llm_response', // Utilisez le nouveau type pour le debug
    });

    return response;
  }

  private parseLlmResponse(
    response: string,
    log: Logger,
  ): null | z.infer<typeof llmResponseSchema> {
    try {
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      const textToParse = jsonMatch ? jsonMatch[1] : response;
      const parsed = JSON.parse(textToParse);
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
    subscriber.subscribe(this.interruptChannel, (error, count) => {
      if (error) {
        this.log.error(error, 'Failed to subscribe to interrupt channel');
        return;
      }
      this.log.info(
        `Subscribed to interrupt channel: ${this.interruptChannel} (count: ${count})`,
      );
    });

    subscriber.on('message', (channel: string, message: string) => {
      if (channel === this.interruptChannel && message === 'interrupt') {
        this.log.info('Agent interrupted by user.');
        this.interrupted = true;
        subscriber.unsubscribe(this.interruptChannel);
        subscriber.quit();
      }
    });
  }
}
