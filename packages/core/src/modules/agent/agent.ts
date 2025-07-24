import { Job, Queue } from 'bullmq';
import { Logger } from 'pino';
import { z } from 'zod';

import { Ctx as _Ctx, AgentResponseMessage, ErrorMessage, Message, SessionData, ThoughtMessage, Tool, ToolCallMessage, ToolResultMessage, UserMessage } from '@/types.js';

import { config } from '../../config.js';
import logger from '../../logger.js';
import { getLlmProvider } from '../../utils/llmProvider.js';
import { LLMContent } from '../llm/llm-types.js';
import { redis } from '../redis/redisClient.js';
import { FinishToolSignal } from '../tools/definitions/index.js';
import { toolRegistry } from '../tools/toolRegistry.js';
import { getMasterPrompt } from './orchestrator.prompt.js';
import { llmResponseSchema } from './responseSchema.js';

type ChannelData =
  | {
      content: string;
      contentType: 'html' | 'markdown' | 'text' | 'url';
      type: 'agent_canvas_output';
    }
  | { content: string; toolName: string; type: 'tool_stream' } // Added toolName
  | { content: string; type: 'agent_response' }
  | { content: string; type: 'agent_thought' }
  | { content: string; type: 'raw_llm_response' }
  | { data: { args: unknown; name: string }; type: 'tool.start' }
  | { result: unknown; toolName: string; type: 'tool_result' }
  | { type: 'agent_canvas_close' };

interface Command {
  name: string;
  params?: Record<string, unknown>;
}

export class Agent {
  private commandHistory: Command[] = [];
  private interrupted = false;
  private readonly job: Job<{ prompt: string }>;
  private lastCommand: Command | undefined;
  private readonly log: Logger;
  private loopCounter = 0;
  private malformedResponseCounter = 0;
  private readonly session: SessionData;
  private subscriber: any;
  private readonly taskQueue: Queue;
  private readonly tools: Tool<z.AnyZodObject, z.ZodTypeAny>[];

  constructor(
     
    job: Job<{ prompt: string }>,
     
    session: SessionData,
     
    _taskQueue: Queue,
     
    _tools?: Tool<z.AnyZodObject, z.ZodTypeAny>[],
  ) {
    this.job = job;
    this.session = session;
    this.log = logger.child({ jobId: job.id, sessionId: session.id });
    this.taskQueue = _taskQueue;
    this.tools = _tools ?? [];
  }

  public async run(): Promise<string> {
    this.log.info('Agent starting...');
    await this.setupInterruptListener();
    try {
      const jobData = this.job.data as { prompt: string };
      const { prompt } = jobData;

      const newUserMessage: UserMessage = {
        content: prompt,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        type: 'user',
      };
      (this.session.history as Message[]).push(newUserMessage);

      try {
        this.tools.push(...toolRegistry.getAll());
        this.log.info(
          { count: this.tools.length },
          'All tools are available in the registry.',
        );
      } catch (_error) {
        this.log.error(
          { error: _error },
          'Agent run failed during tool loading',
        );
        return `Error: ${(_error as Error).message}`;
      }

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
              switch (message.type) {
                case 'agent_canvas_output':
                  return null;
                case 'agent_response':
                case 'agent_thought':
                  const agentMessage = message as AgentResponseMessage | ThoughtMessage;
                  if (typeof agentMessage.content === 'string') {
                    return {
                      parts: [{ text: agentMessage.content }],
                      role: 'model',
                    };
                  }
                  return null;
                case 'error':
                  const errorMessage = message as ErrorMessage;
                  return {
                    parts: [{ text: `Error: ${errorMessage.content}` }],
                    role: 'tool',
                  };
                case 'tool_call':
                  const toolCallMessage = message as ToolCallMessage;
                  return {
                    parts: [
                      {
                        text: `Tool Call: ${toolCallMessage.toolName} with params ${JSON.stringify(toolCallMessage.params)}`,
                      },
                    ],
                    role: 'tool',
                  };
                case 'tool_result':
                  const toolResultMessage = message as ToolResultMessage;
                  return {
                    parts: [
                      {
                        text: `Tool Result: ${toolResultMessage.toolName} output: ${JSON.stringify(toolResultMessage.result)}`,
                      },
                    ],
                    role: 'tool',
                  };
                case 'user':
                  if (message.type === 'user' && typeof message.content === 'string') {
                    return {
                      parts: [{ text: message.content }],
                      role: 'user',
                    } as LLMContent;
                  }
                  return null;
                default:
                  return null;
              }
            })
            .filter((m): m is LLMContent => m !== null);

          const llmResponse = await getLlmProvider().getLlmResponse(
            messagesForLlm,
            orchestratorPrompt,
          );
          this.log.info({ llmResponse }, 'Raw LLM response');

          if (this.interrupted) {
            this.log.info('Job has been interrupted.');
            break;
          }

          if (typeof llmResponse !== 'string' || llmResponse.trim() === '') {
            this.log.error(
              { llmResponse, type: typeof llmResponse },
              'The `generate` tool did not return a string as expected or returned an empty string.',
            );
            this.session.history.push({
              content:
                'Error: The `generate` tool returned an unexpected non-string or empty response.',
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              type: 'error',
            });
            this.malformedResponseCounter++;
            if (this.malformedResponseCounter > 2) {
              this.log.error('Malformed response limit reached. Breaking.');
              return 'Agent stopped due to persistent malformed responses.';
            }
            continue;
          }

          this.malformedResponseCounter = 0;

          const parsedResponse = this.parseLlmResponse(
            llmResponse,
            iterationLog,
          );
          this.log.debug(
            { parsedResponse },
            'Parsed LLM response before answer check',
          );
          const { answer, canvas, command, thought } = parsedResponse;

          if (answer) {
            this.session.history.push({
              content: answer,
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              type: 'agent_response',
            });
          } else if (thought) {
            this.session.history.push({
              content: thought,
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              type: 'agent_thought',
            });
          } else if (command) {
            this.session.history.push({
              id: crypto.randomUUID(),
              params: (command.params as Record<string, unknown>) || {},
              timestamp: Date.now(),
              toolName: command.name,
              type: 'tool_call',
            });
          } else if (canvas) {
            this.session.history.push({
              content: canvas.content,
              contentType: canvas.contentType,
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              type: 'agent_canvas_output',
            });
          }

          if (this.interrupted) {
            this.log.info('Job has been interrupted.');
            break;
          }

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
            if (!command) {
              this.publishToChannel({ type: 'agent_canvas_close' });
              return 'Agent displayed content on the canvas.';
            }
          }

          if (answer) {
            iterationLog.info({ answer }, 'Agent final answer');
            this.publishToChannel({ content: answer, type: 'agent_response' });
            return answer;
          }

          if (command && command.name === 'finish') {
            const finishResult = await this.executeTool(command, iterationLog);
            if (
              typeof finishResult === 'object' &&
              finishResult !== null &&
              'answer' in finishResult &&
              typeof (finishResult as { answer: unknown }).answer === 'string'
            ) {
              const finalAnswer = (finishResult as { answer: string }).answer;
              iterationLog.info(
                { finalAnswer },
                'Agent finished via finish tool',
              );
              this.publishToChannel({
                content: finalAnswer,
                type: 'agent_response',
              });
              this.session.history.push({
                id: crypto.randomUUID(),
                result: finishResult,
                timestamp: Date.now(),
                toolName: 'finish',
                type: 'tool_result',
              });
              return finalAnswer;
            } else {
              // If finish tool doesn't return an object with 'answer', treat it as an error
              const errorMessage = `Finish tool did not return a valid answer object: ${JSON.stringify(finishResult)}`;
              iterationLog.error(errorMessage);
              this.session.history.push({
                content: `Error: ${errorMessage}`,
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                type: 'error',
              });
              return errorMessage;
            }
          } else if (command) {
            this.commandHistory.push(command);
            if (this.commandHistory.length > 5) {
              this.commandHistory.shift();
            }

            const lastTwoCommands = this.commandHistory.slice(-2);
            if (
              this.commandHistory.length > 1 &&
              JSON.stringify(lastTwoCommands[0]) ===
                JSON.stringify(lastTwoCommands[1])
            ) {
              this.loopCounter++;
            } else {
              this.loopCounter = 0;
            }

            if (this.loopCounter > 2) {
              this.log.warn('Loop detected. Breaking.');
              return 'Agent stuck in a loop.';
            }

            const toolResult = await this.executeTool(command, iterationLog);
            this.session.history.push({
              id: crypto.randomUUID(),
              result: toolResult as Record<string, unknown>,
              timestamp: Date.now(),
              toolName: command.name,
              type: 'tool_result',
            });
            if (
              typeof toolResult === 'string' &&
              toolResult.startsWith('Error executing tool')
            ) {
              this.session.history.push({
                content: `The tool execution failed with the following error: ${toolResult}. Please analyze the error and try a different approach. You can use another tool, or try to fix the problem with the previous tool.`,
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                type: 'error',
              });
            }
          } else if (!thought && !canvas) {
            this.session.history.push({
              content:
                'You must provide a command, a thought, a canvas output, or a final answer.',
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              type: 'error',
            });
          }
        } catch (_error) {
          if (_error instanceof FinishToolSignal) {
            this.log.info(
              { answer: _error.message },
              'Agent finished by tool signal.',
            );
            this.publishToChannel({
              content: _error.message,
              type: 'agent_response',
            });
            return _error.message;
          }

          const errorMessage = (_error as Error).message;
          iterationLog.error(
            { error: _error },
            `Error in agent iteration: ${errorMessage}`,
          );

          if (errorMessage.includes('Failed to parse LLM response')) {
            this.session.history.push({
              content:
                'I was unable to parse your last response. Please ensure your response is a valid JSON object with the expected properties (`thought`, `command`, `canvas`, or `answer`). Check for syntax errors, missing commas, or unclosed brackets.',
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              type: 'error',
            });
            // Add the error message to history and continue the loop
            continue;
          } else if (errorMessage.includes('Error executing tool')) {
            // This error is already handled by the logic above, so we just continue
            continue;
          } else {
            this.session.history.push({
              content: `An unexpected error occurred: ${errorMessage}`,
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              type: 'error',
            });
            this.interrupted = true;
            return `Error in agent iteration: ${errorMessage}`;
          }
        }
      }

      if (this.interrupted) {
        return 'Agent execution interrupted.';
      }
      if (iterations >= MAX_ITERATIONS) {
        return 'Agent reached maximum iterations without a final answer.';
      }
      // If the loop finishes without returning, it means no final answer was provided
      // and it wasn't interrupted, so it reached max iterations.
      return 'Agent reached maximum iterations without a final answer.';
    } catch (_error) {
      if (_error instanceof FinishToolSignal) {
        this.log.info(
          { answer: _error.message },
          'Agent finished by tool signal.',
        );
        this.publishToChannel({
          content: _error.message,
          type: 'agent_response',
        });
        return _error.message;
      }
      const errorMessage = (_error as Error).message;
      this.log.error({ error: _error }, `Agent run failed: ${errorMessage}`);
      return `Agent run failed: ${errorMessage}`;
    } finally {
      await this.cleanup();
    }
  }

  private async cleanup() {
    if (this.subscriber) {
      const channel = `job:${this.job.id}:interrupt`;
      await this.subscriber.unsubscribe(channel);
      await this.subscriber.quit();
    }
  }

  private async executeTool(command: Command, log: Logger): Promise<unknown> {
    try {
      this.publishToChannel({
        data: { args: command.params, name: command.name },
        type: 'tool.start',
      });
      const result = await toolRegistry.execute(command.name, command.params, {
        job: this.job,
        llm: getLlmProvider(),
        log,
        session: this.session,
        taskQueue: this.taskQueue,
      });
      this.publishToChannel({
        result: result, // Removed 'as unknown'
        toolName: command.name,
        type: 'tool_result',
      });
      return result;
    } catch (_error) {
      if (_error instanceof FinishToolSignal) {
        throw _error;
      }
      const errorMessage = (_error as Error).message;
      log.error({ error: _error }, `Error executing tool ${command.name}`);
      this.publishToChannel({
        result: { error: errorMessage },
        toolName: command.name,
        type: 'tool_result',
      });
      return `Error executing tool ${command.name}: ${errorMessage}`;
    }
  }

  private extractJsonFromMarkdown(text: string): string {
    const match = text.match(/```(?:json)?\s*\n([\s\S]+?)\n```/);
    if (match && match[1]) {
      try {
        // Just validate, return the extracted string for the main parser
        JSON.parse(match[1]);
        return match[1];
      } catch (error) {
        // Le contenu n'est pas un JSON valide, on lance une erreur
        throw new Error(
          `Invalid JSON in markdown: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }
    return text.trim();
  }

  private parseLlmResponse(llmResponse: string, log: Logger) {
    const jsonText = this.extractJsonFromMarkdown(llmResponse);
    log.debug({ jsonText }, 'Attempting to parse LLM response');
    try {
      const parsed = JSON.parse(jsonText);
      log.debug({ parsed }, 'Successfully parsed LLM response');
      return llmResponseSchema.parse(parsed);
    } catch (error) {
      log.error(
        { error, llmResponse: jsonText },
        'Failed to parse LLM response',
      );
      throw new Error(`Failed to parse LLM response: ${jsonText}`);
    }
  }

  private publishToChannel(data: ChannelData) {
    const channel = `job:${this.job.id}:events`;
    const message = JSON.stringify(data);
    redis.publish(channel, message);
    // Only send serializable and relevant data to updateProgress
    const progressData = { ...data };
    if (progressData.type === 'tool.start') {
      // Avoid sending non-serializable data
      delete (progressData.data as any).args;
    }
    this.job.updateProgress(progressData);
  }

  private async setupInterruptListener() {
    const channel = `job:${this.job.id}:interrupt`;
    this.subscriber = redis.duplicate();

    const messageHandler = (messageChannel: string, message: string): void => {
      if (messageChannel === channel) {
        this.log.warn(`Interrupting job ${this.job.id}: ${message}`);
        this.interrupted = true;
      }
    };

    this.subscriber.on('message', messageHandler);

    await this.subscriber.subscribe(
      channel,
      (err: Error | null, count: number) => {
        if (err) {
          this.log.error(err, `Error subscribing to ${channel}`);
          return;
        }
        this.log.info(
          `Subscribed to ${channel}. Total subscriptions: ${count}`,
        );
      },
    );
  }

  private summarizeToolResult(result: unknown): unknown {
    const resultString =
      typeof result === 'string' ? result : JSON.stringify(result, null, 2);
    if (resultString.length > 5000) {
      try {
        const parsed = JSON.parse(resultString);
        // If it's a JSON object, try to summarize it more intelligently
        if (typeof parsed === 'object' && parsed !== null) {
          const summary = {
            ...Object.keys(parsed).reduce((acc, key) => {
              const value = parsed[key];
              if (typeof value === 'string') {
                (acc as any)[key] =
                  value.substring(0, 100) + (value.length > 100 ? '...' : '');
              } else {
                (acc as any)[key] = value;
              }
              return acc;
            }, {}),
            _summary: 'Object summarized due to size.',
          };
          return JSON.stringify(summary, null, 2);
        }
      } catch (_e) {
        // Not a valid JSON, so just truncate
      }
      return resultString.substring(0, 4975) + '... (truncated)';
    }
    return resultString;
  }
}
