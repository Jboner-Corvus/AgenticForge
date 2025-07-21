import { Job, Queue } from 'bullmq';
import { Logger } from 'pino';
import { z } from 'zod';

import { config } from '../../config.js';
import logger from '../../logger.js';
import { Ctx as _Ctx, SessionData, Tool } from '../../types.js';
import { llmProvider } from '../../utils/llmProvider.js';
import { LLMContent } from '../llm/llm-types.js';
import { redis } from '../redis/redisClient.js';
import { FinishToolSignal } from '../tools/definitions/index.js';
import { toolRegistry } from '../tools/toolRegistry.js';
import { getMasterPrompt } from './orchestrator.prompt.js';

const llmResponseSchema = z.object({
  answer: z.string().optional(),
  canvas: z
    .object({
      content: z.string(),
      contentType: z.enum(['html', 'markdown', 'url', 'text']),
    })
    .optional(),
  command: z
    .object({
      name: z.string(),
      params: z.unknown(),
    })
    .optional(),
  thought: z.string().optional(),
});

type ChannelData =
  | {
      content: string;
      contentType: 'html' | 'markdown' | 'text' | 'url';
      type: 'agent_canvas_output';
    }
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
      this.tools.push(...toolRegistry.getAll());
      this.log.info(
        { count: this.tools.length },
        'All tools are available in the registry.',
      );
    } catch (error) {
      this.log.error({ error }, 'Agent run failed during tool loading');
      return `Error: ${(error as Error).message}`;
    }

    await this.setupInterruptListener();

    let iterations = 0;
    const MAX_ITERATIONS = config.AGENT_MAX_ITERATIONS ?? 10;

    while (iterations < MAX_ITERATIONS) {
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

      try {
        const orchestratorPrompt = getMasterPrompt(
          { data: this.session, id: this.session.id },
          this.tools,
        );

        const messagesForLlm: LLMContent[] = this.session.history
          .map((message): LLMContent | null => {
            const role = message.role === 'tool' ? 'user' : message.role;
            if (role === 'user' || role === 'model') {
              return { parts: [{ text: message.content }], role };
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
          throw new Error('The `generate` tool did not return a string.');
        }

        this.session.history.push({ content: llmResponse, role: 'model' });

        const parsedResponse = this.parseLlmResponse(llmResponse, iterationLog);
        const { answer, canvas, command, thought } = parsedResponse;

        if (thought) {
          iterationLog.info({ thought }, 'Agent thought');
          this.publishToChannel({ content: thought, type: 'agent_thought' });
        }
        if (canvas) {
          iterationLog.info({ canvas }, 'Agent canvas output');
          this.publishToChannel({
            content: canvas.content,
            contentType: canvas.contentType,
            type: 'agent_canvas_output',
          });
        }

        if (answer) {
          iterationLog.info({ answer }, 'Agent final answer');
          this.publishToChannel({ content: answer, type: 'agent_response' });
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

          const toolResult = await this.executeTool(command, iterationLog);
          const resultForHistory = this.summarizeToolResult(toolResult);
          this.session.history.push({
            content: `Tool result: ${JSON.stringify(resultForHistory)}`,
            role: 'tool',
          });
        } else if (!thought && !canvas) {
          this.session.history.push({
            content:
              'You must provide a command, a thought, a canvas output, or a final answer.',
            role: 'user',
          });
        }
      } catch (error) {
        if (error instanceof FinishToolSignal) {
          this.log.info(
            { answer: error.message },
            'Agent finished by tool signal.',
          );
          return error.message;
        }

        const errorMessage = (error as Error).message;
        iterationLog.error(
          { error },
          `Error in agent iteration: ${errorMessage}`,
        );

        if (errorMessage.includes('Failed to parse LLM response')) {
          this.session.history.push({
            content: `Your last response was not a valid command. You must choose a tool from the list or provide a final answer. Please try again. Last response: ${this.session.history.at(-1)?.content}`,
            role: 'user',
          });
        } else {
          this.session.history.push({ content: errorMessage, role: 'tool' });
        }
      }
    }

    if (this.interrupted) {
      return 'Agent execution interrupted.';
    }
    return 'Agent reached maximum iterations without a final answer.';
  }

  private async executeTool(command: Command, log: Logger): Promise<unknown> {
    try {
      const result = await toolRegistry.execute(command.name, command.params, {
        job: this.job,
        llm: llmProvider,
        log,
        session: this.session,
        taskQueue: this.taskQueue,
      });
      if (result instanceof FinishToolSignal) {
        throw result;
      }
      return result;
    } catch (error) {
      if (error instanceof FinishToolSignal) {
        throw error;
      }
      log.error({ error }, `Error executing tool ${command.name}`);
      throw new Error(
        `Error executing tool ${command.name}: ${(error as Error).message}`,
      );
    }
  }

  private extractJsonFromMarkdown(text: string): string {
    const match = text.match(/```(?:json)?\n([\s\S]+)\n```/);
    return match ? match[1] : text;
  }

  private parseLlmResponse(llmResponse: string, log: Logger) {
    const jsonText = this.extractJsonFromMarkdown(llmResponse);
    try {
      const parsed = JSON.parse(jsonText);
      return llmResponseSchema.parse(parsed);
    } catch (error) {
      log.error(
        { error, llmResponse: jsonText },
        'Failed to parse LLM response',
      );
      throw new Error(`Failed to parse LLM response.`);
    }
  }

  private publishToChannel(data: ChannelData) {
    this.job.updateProgress(data);
  }

  private async setupInterruptListener() {
    const subscriber = redis.duplicate();
    const channel = `job:${this.job.id}:interrupt`;

    subscriber.on('message', (messageChannel, message) => {
      this.log.info(`Received message from ${messageChannel}: ${message}`);
      if (message === 'interrupt') {
        this.interrupted = true;
        subscriber.unsubscribe(channel);
        subscriber.quit();
      }
    });

    await subscriber.subscribe(channel, (err, count) => {
      if (err) {
        this.log.error(err, 'Failed to subscribe to interrupt channel');
        return;
      }
      this.log.info(`Subscribed to ${count} interrupt channels.`);
    });
  }

  private summarizeToolResult(result: unknown): unknown {
    if (typeof result === 'string' && result.length > 1000) {
      return `${result.slice(0, 1000)}... (truncated)`;
    }
    if (typeof result === 'object' && result !== null) {
      const json = JSON.stringify(result);
      if (json.length > 1000) {
        return `${json.slice(0, 1000)}... (truncated)`;
      }
    }
    return result;
  }
}
