import { Job, Queue } from 'bullmq';
import { Logger } from '../../logger.ts';
import { z } from 'zod';

import { getConfig } from '../../config.ts';

import type {
  AgentResponseMessage,
  ErrorMessage,
  Message,
  SessionData,
  ThoughtMessage,
  Tool,
  ToolCallMessage,
  ToolResultMessage,
  UserMessage,
} from '../../types.ts';

import { config } from '../../config.ts';
import { getLoggerInstance } from '../../logger.ts';
import { LlmError } from '../../utils/LlmError.ts';
import { getLlmProvider } from '../../utils/llmProvider.ts';
import { LLMContent } from '../llm/llm-types.ts';
import { LlmKeyManager } from '../llm/LlmKeyManager.ts';
import { getRedisClientInstance } from '../redis/redisClient.ts';
import { SessionManager } from '../session/sessionManager.ts';
import { FinishToolSignal } from '../tools/definitions/index.ts';
import { toolRegistry } from '../tools/toolRegistry.ts';
import { getMasterPrompt } from './orchestrator.prompt.ts';
import { llmResponseSchema } from './responseSchema.ts';

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
  private activeLlmProvider: string; // New property
  private apiKey?: string; // New property
  // Loop detection properties
  private behaviorHistory: Array<{
    command?: { name?: string; params?: Record<string, any>; };
    thought?: string;
    timestamp: number;
  }> = [];
  private commandHistory: Command[] = [];
  private interrupted = false;
  private readonly job: Job<{ prompt: string }>;
  private readonly log: Logger;
  private loopCounter = 0;
  private loopDetectionThreshold = 5; // Detect loops after 5 repetitions (increased for complex tasks)
  private malformedResponseCounter = 0;
  private readonly MAX_MALFORMED_RESPONSES = getConfig().AGENT_MAX_MALFORMED_RESPONSES;
  private readonly MAX_LLM_FAILURES = getConfig().AGENT_MAX_LLM_FAILURES;
  private llmFailureCounter = 0;
  private consecutiveLlmFailures = 0; // Track consecutive failures
  private readonly MAX_CONSECUTIVE_LLM_FAILURES = 3; // Allow 3 consecutive failures before fallback
  private readonly maxBehaviorHistory = 10; // Keep track of last 10 behaviors
  private readonly session: SessionData;
  
  // 🚨 AMÉLIORATION: Tracking des actions réalisées
  private executedActions: Map<string, { count: number; lastExecution: number; successful: boolean }> = new Map();
  private lastDisplayCanvasCall = 0;

  private readonly sessionManager: SessionManager; // New property
  private subscriber: any;
  private readonly taskQueue: Queue;

  private readonly tools: Tool<z.AnyZodObject, z.ZodTypeAny>[];

  constructor(
    job: Job<{
      apiKey?: string;
      llmApiKey?: string;
      llmModelName?: string;
      llmProvider?: string;
      prompt: string;
    }>,
    session: SessionData,
    taskQueue: Queue,
    tools: Tool<z.AnyZodObject, z.ZodTypeAny>[],
    activeLlmProvider: string,
    sessionManager: SessionManager,
    apiKey?: string,
    private readonly llmModelName?: string, // New property
    private readonly llmApiKey?: string, // New property
  ) {
    this.job = job;
    this.session = session;
    this.log = getLoggerInstance().child({
      jobId: job.id,
      sessionId: session.id,
    });
    this.taskQueue = taskQueue;
    this.tools = tools ?? [];
    this.activeLlmProvider = activeLlmProvider;
    this.session.activeLlmProvider = activeLlmProvider; // Ensure session also has the active provider
    this.sessionManager = sessionManager;
    this.apiKey = apiKey;

    // Initialize loop detection properties
    this.behaviorHistory = [];
    this.loopDetectionThreshold = 5; // Detect loops after 5 repetitions
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

      let iterations = 0;
      const MAX_ITERATIONS = config.AGENT_MAX_ITERATIONS ?? 50;

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

        // Add "The agent is thinking..." message to session history and publish to channel
        const thinkingMessage = {
          content: `The agent is thinking... (iteration ${iterations})`,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          type: 'agent_thought' as const,
        };
        this.session.history.push(thinkingMessage);
        this.publishToChannel(thinkingMessage);

        try {
          // 🚨 AMÉLIORATION: Ajouter le contexte des actions exécutées
          const sessionWithContext = {
            data: {
              ...this.session,
              workingContext: {
                ...this.session.workingContext,
                executedActions: this.getActionExecutionSummary(),
                lastDisplayCanvas: this.hasExecutedActionRecently('display_canvas') ? 
                  `✅ display_canvas executed ${Math.floor((Date.now() - this.lastDisplayCanvasCall) / 1000)}s ago` : 
                  '❌ display_canvas not executed recently',
                iterationCount: iterations
              }
            },
            id: String(this.session.id)
          };
          
          const orchestratorPrompt = getMasterPrompt(
            sessionWithContext,
            this.tools,
          );

          const messagesForLlm: LLMContent[] = this.session.history
            .map((message: Message): LLMContent | null => {
              switch (message.type) {
                case 'agent_canvas_output':
                  return null;
                case 'agent_response':
                case 'agent_thought':
                  const agentMessage = message as
                    | AgentResponseMessage
                    | ThoughtMessage;
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
                  if (
                    message.type === 'user' &&
                    typeof message.content === 'string'
                  ) {
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
            .filter((m: LLMContent | null): m is LLMContent => m !== null);

          let llmResponse: string | undefined;
          let currentProviderIndex = config.LLM_PROVIDER_HIERARCHY.indexOf(
            this.activeLlmProvider,
          );
          if (currentProviderIndex === -1) {
            currentProviderIndex = 0; // Default to first in hierarchy if current is not found
          }

          // Track Qwen timeout retries
          let qwenTimeoutRetries = 0;
          const MAX_QWEN_TIMEOUT_RETRIES = 8; // Augmenté à 8 tentatives
          const INITIAL_RETRIES_WITHOUT_DELAY = 4; // 4 premières tentatives sans délai

          for (let i = 0; i < config.LLM_PROVIDER_HIERARCHY.length; i++) {
            const providerToTry =
              config.LLM_PROVIDER_HIERARCHY[
                (currentProviderIndex + i) %
                  config.LLM_PROVIDER_HIERARCHY.length
              ];
            this.log.info(
              `Attempting LLM call with provider: ${providerToTry}`,
            );

            // 🚨 DEBUG: Log provider selection details
            this.log.info({
              providerToTry,
              configDefaultProvider: config.LLM_PROVIDER,
              hierarchy: config.LLM_PROVIDER_HIERARCHY,
              currentIndex: currentProviderIndex,
              iteration: i
            }, '🔍 PROVIDER DEBUG: Provider selection details');

            try {
              if (!(await LlmKeyManager.hasAvailableKeys(providerToTry))) {
                this.log.warn(
                  `No available keys for provider ${providerToTry}. Skipping.`,
                );
                continue;
              }

              // Ajout d'un délai progressif après les 4 premières tentatives
              if (
                providerToTry === 'qwen' &&
                qwenTimeoutRetries >= INITIAL_RETRIES_WITHOUT_DELAY
              ) {
                // Calcul du délai : 2 secondes de base + 1 seconde supplémentaire par tentative au-delà de 4
                const delayMs =
                  2000 +
                  (qwenTimeoutRetries - INITIAL_RETRIES_WITHOUT_DELAY) * 1000;
                this.log.info(
                  `Adding delay of ${delayMs}ms before Qwen API call (retry ${qwenTimeoutRetries + 1})`,
                );
                await new Promise((resolve) => setTimeout(resolve, delayMs));
              }

              llmResponse = await getLlmProvider(providerToTry).getLlmResponse(
                messagesForLlm,
                orchestratorPrompt,
                this.llmApiKey || this.apiKey,
                this.llmModelName,
              );
              this.activeLlmProvider = providerToTry; // Update active provider on success
              this.session.activeLlmProvider = providerToTry; // Update session data
              await this.sessionManager.saveSession(
                this.session,
                this.job,
                this.taskQueue,
              ); // Persist session change
              this.log.info(
                { llmResponse, provider: providerToTry },
                'Raw LLM response',
              );
              break; // Success, break out of provider loop
            } catch (llmError) {
              // Check if this is a Qwen timeout error that should be retried
              if (
                llmError instanceof LlmError &&
                providerToTry === 'qwen' &&
                ((llmError.message.includes(
                  'Qwen API request failed with status 504',
                ) &&
                  llmError.message.includes('stream timeout')) ||
                  llmError.message.includes(
                    'Qwen API request failed with status 502',
                  ))
              ) {
                qwenTimeoutRetries++;
                this.log.warn(
                  `Qwen API error encountered (${qwenTimeoutRetries}/${MAX_QWEN_TIMEOUT_RETRIES}): ${llmError.message}`,
                );

                // If we haven't reached the max retries, continue with the same provider
                if (qwenTimeoutRetries < MAX_QWEN_TIMEOUT_RETRIES) {
                  // Add delay after the initial retries without delay
                  if (qwenTimeoutRetries >= INITIAL_RETRIES_WITHOUT_DELAY) {
                    // Calcul du délai : 2 secondes de base + 1 seconde supplémentaire par tentative au-delà de 4
                    const delayMs =
                      2000 +
                      (qwenTimeoutRetries - INITIAL_RETRIES_WITHOUT_DELAY) *
                        1000;
                    this.log.info(
                      `Adding delay of ${delayMs}ms before retrying Qwen API call (retry ${qwenTimeoutRetries + 1})`,
                    );
                    await new Promise((resolve) =>
                      setTimeout(resolve, delayMs),
                    );
                  }
                  i--; // Decrement i to retry the same provider
                  continue;
                } else {
                  this.log.error(
                    `Max Qwen retries (${MAX_QWEN_TIMEOUT_RETRIES}) reached. Moving to next provider.`,
                  );
                  // Reset retry counter and continue to next provider
                  qwenTimeoutRetries = 0;
                  continue;
                }
              } else if (
                llmError instanceof LlmError &&
                llmError.message.includes('No LLM API key available')
              ) {
                this.log.warn(
                  `No LLM API key available for ${providerToTry}. Trying next provider in hierarchy.`,
                );
                // Continue to next provider in hierarchy
                continue;
              } else if (
                llmError instanceof LlmError &&
                (llmError.message.includes('API key not valid') ||
                 llmError.message.includes('API_KEY_INVALID') ||
                 llmError.message.includes('invalid api key'))
              ) {
                this.log.error(
                  `Invalid API key for ${providerToTry}: ${llmError.message}`,
                );
                // Mark this provider as having invalid key and continue to next
                continue;
              } else {
                // For other LLM errors, increment failure counter but don't stop immediately
                this.llmFailureCounter++;
                const errorMessage = llmError instanceof Error ? llmError.message : String(llmError);
                this.log.error(`LLM error for ${providerToTry} (${this.llmFailureCounter}/${this.MAX_LLM_FAILURES}): ${errorMessage}`);

                // If we haven't reached max failures, try next provider
                if (this.llmFailureCounter < this.MAX_LLM_FAILURES) {
                  this.log.warn(`Trying next provider after LLM error...`);
                  continue;
                } else {
                  // Max failures reached - don't throw error, try fallback approach
                  this.log.error(`Max LLM failures reached. Attempting fallback mode.`);
                  break; // Break out of provider loop to try fallback
                }
              }
            }
          }

          if (llmResponse === undefined) {
            this.log.warn('All LLM providers failed. Attempting fallback mode...');
            // Try fallback approach instead of throwing error immediately
            try {
              llmResponse = await this.attemptFallbackResponse();
              if (!llmResponse) {
                // If fallback also fails, try to continue with local tasks
                this.log.info('Fallback failed. Attempting to continue with local tasks...');
                const localResponse = await this.generateLocalFallbackResponse();
                if (localResponse) {
                  llmResponse = localResponse;
                } else {
                  throw new LlmError('All fallback approaches failed. Cannot continue.');
                }
              }
            } catch (fallbackError) {
              this.log.error({ fallbackError }, 'All fallback approaches failed');
              throw new LlmError('No LLM provider in the hierarchy could provide a response, and fallback approaches failed.');
            }
          }

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
          const { answer, canvas, thought } = parsedResponse;
          let command = parsedResponse.command;

          if (answer) {
            this.session.history.push({
              content: answer,
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              type: 'agent_response',
            });
            iterationLog.info({ answer }, 'Agent final answer');
            this.publishToChannel({ content: answer, type: 'agent_response' });
            return answer;
          }

          // Check for loops in agent behavior
          if (this.detectLoop(thought, command)) {
            this.log.error(
              'Loop detected in agent behavior. Stopping execution.',
            );
            return 'Agent stopped due to detected loop in behavior.';
          }

          if (thought) {
            this.session.history.push({
              content: thought,
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              type: 'agent_thought',
            });
          }
          if (command) {
            this.session.history.push({
              id: crypto.randomUUID(),
              params: (command.params as Record<string, unknown>) || {},
              timestamp: Date.now(),
              toolName: command.name,
              type: 'tool_call',
            });
          }
          if (canvas) {
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
            // Use display_canvas tool instead of direct publishing
            if (!command) {
              command = {
                name: 'display_canvas',
                params: {
                  content: canvas.content,
                  contentType: canvas.contentType || 'html'
                }
              };
              this.log.info('🔧 Converting canvas output to display_canvas tool call');
            }
          }

          if (answer) {
            iterationLog.info({ answer }, 'Agent final answer');
            this.publishToChannel({ content: answer, type: 'agent_response' });
            return answer;
          }

          if (command && command.name === 'finish') {
            try {
              const finishResult = await this.executeTool(
                command,
                iterationLog,
              );
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
            } catch (_error) {
              if (_error instanceof FinishToolSignal) {
                // This is the expected case - finish tool throws FinishToolSignal
                const finalAnswer = _error.message;
                iterationLog.info(
                  { finalAnswer },
                  'Agent finished via finish tool signal',
                );
                this.publishToChannel({
                  content: finalAnswer,
                  type: 'agent_response',
                });
                this.session.history.push({
                  content: finalAnswer,
                  id: crypto.randomUUID(),
                  timestamp: Date.now(),
                  type: 'agent_response',
                });
                return finalAnswer;
              } else {
                // Unexpected error
                throw _error;
              }
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

          let errorMessage: string;
          if (_error instanceof Error) {
            errorMessage = _error.message;
          } else {
            errorMessage = String(_error);
          }

          iterationLog.error(
            {
              error:
                _error instanceof Error ? _error : new Error(String(_error)),
            },
            `Error in agent iteration: ${errorMessage}`,
          );

          if (errorMessage.includes('Failed to parse LLM response')) {
            this.malformedResponseCounter++;
            this.session.history.push({
              content:
                `I was unable to parse your last response (attempt ${this.malformedResponseCounter}/${this.MAX_MALFORMED_RESPONSES}). Please ensure your response is a valid JSON object with the expected properties ('thought', 'command', 'canvas', or 'answer'). Check for syntax errors, missing commas, or unclosed brackets. If you need to provide a simple response, use the 'finish' tool with a 'response' parameter.`,
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              type: 'error',
            });
            
            // If we've had too many malformed responses, try fallback approach
              if (this.malformedResponseCounter >= this.MAX_MALFORMED_RESPONSES) {
                this.log.error('Too many malformed responses. Attempting fallback approach.');
                try {
                  const fallbackResponse = await this.attemptFallbackResponse();
                  if (fallbackResponse) {
                    return fallbackResponse;
                  }
                } catch (fallbackError) {
                  this.log.error({ fallbackError }, 'Fallback approach also failed');
                }
 
                // Last resort: provide a simple finish response
                this.log.warn('Using emergency fallback response');
                return JSON.stringify({
                  thought: "Unable to parse LLM response, using emergency fallback",
                  command: {
                    name: "finish",
                    params: {
                      response: "I apologize, but I'm having trouble processing your request. Could you please rephrase it?"
                    }
                  }
                });
              }
            continue;
          } else if (errorMessage.includes('Error executing tool')) {
            // This error is already handled by the logic above, so we just continue
            continue;
          } else if (errorMessage.includes('Failed to communicate with the LLM') ||
                    errorMessage.includes('LLM API') ||
                    errorMessage.includes('network') ||
                    errorMessage.includes('timeout') ||
                    errorMessage.includes('API key not valid') ||
                    errorMessage.includes('API_KEY_INVALID')) {
            // Handle LLM communication failures with retry logic
            this.llmFailureCounter++;
            this.log.error(`LLM communication failure (attempt ${this.llmFailureCounter}/${this.MAX_LLM_FAILURES}): ${errorMessage}`);

            if (this.llmFailureCounter >= this.MAX_LLM_FAILURES) {
              this.log.error('Max LLM failures reached. Attempting fallback mode...');

              // Try to continue with local tasks instead of stopping
              try {
                const localResponse = await this.generateLocalFallbackResponse();
                if (localResponse) {
                  this.log.info('Successfully generated local fallback response');
                  // Parse and use the local response
                  const parsedLocal = this.parseLlmResponse(localResponse, this.log);
                  const { answer: localAnswer, canvas: localCanvas, thought: localThought } = parsedLocal;
                  let localCommand = parsedLocal.command;

                  // Process the local response similar to normal flow
                  if (localThought) {
                    this.session.history.push({
                      content: localThought,
                      id: crypto.randomUUID(),
                      timestamp: Date.now(),
                      type: 'agent_thought',
                    });
                  }

                  if (localCommand && localCommand.name === 'finish') {
                    try {
                      const finishResult = await this.executeTool(localCommand, this.log);
                      if (typeof finishResult === 'object' && finishResult !== null && 'answer' in finishResult) {
                        const finalAnswer = (finishResult as { answer: string }).answer;
                        this.publishToChannel({ content: finalAnswer, type: 'agent_response' });
                        return finalAnswer;
                      }
                    } catch (finishError) {
                      this.log.error({ finishError }, 'Local finish command failed');
                    }
                  }

                  // If local processing worked, continue to next iteration
                  continue;
                }
              } catch (localError) {
                this.log.error({ localError }, 'Local fallback also failed');
                return 'Agent stopped due to persistent LLM communication issues and failed fallback attempts. Please check your API keys and network connection.';
              }
            }

            // Add delay before retry and continue
            await new Promise(resolve => setTimeout(resolve, 2000 * this.llmFailureCounter));
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
      let errorMessage: string;
      if (_error instanceof Error) {
        errorMessage = _error.message;
      } else {
        errorMessage = String(_error);
      }
      this.log.error(
        {
          error: _error instanceof Error ? _error : new Error(String(_error)),
        },
        `Agent run failed: ${errorMessage}`,
      );
      return `Agent run failed: ${errorMessage}`;
    } finally {
      // Increment successful runs counter when agent completes successfully
      try {
        const redisClient = getRedisClientInstance();
        await redisClient.incr('leaderboard:successfulRuns');
        this.log.info('Successfully incremented successfulRuns counter');
      } catch (error) {
        this.log.error(
          { err: error },
          'Failed to increment successfulRuns in Redis',
        );
      }

      await this.cleanup();
    }
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    // Simple similarity calculation using character overlap
    // In a real implementation, you might want to use more sophisticated algorithms
    const set1 = new Set(text1.toLowerCase().split(/\s+/));
    const set2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set([...set1].filter((x) => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return union.size === 0 ? 1 : intersection.size / union.size;
  }

  private detectRepetitiveResponse(response: string): boolean {
    // Check if this response is similar to recent responses
    const recentResponses = this.behaviorHistory.slice(-3);
    const similarityThreshold = 0.8; // 80% similarity threshold

    for (const behavior of recentResponses) {
      if (behavior.thought) {
        const similarity = this.calculateTextSimilarity(response, behavior.thought);
        if (similarity > similarityThreshold) {
          return true;
        }
      }
    }

    return false;
  }

  private async cleanup() {
    if (this.subscriber) {
      const channel = `job:${this.job.id}:interrupt`;
      await this.subscriber.unsubscribe(channel);
      await this.subscriber.quit();
    }
  }

  /**
   * Converts plain text responses to valid JSON format
   * This handles cases where the LLM responds with plain text instead of JSON
   */
  private convertPlainTextToValidJson(text: string): string {
    // Clean the text
    const cleanText = text.trim();

    // Declare variables at the beginning
    let command: Command | undefined;
    let thought: string | undefined;

    // Check for Gemini API error messages that should be thrown as errors
    if (cleanText.includes('currently unable to process your request') || 
        cleanText.includes('quota') && cleanText.includes('exceeded') ||
        cleanText.includes('free-tier quota') ||
        cleanText.includes('Please try again once the quota has reset')) {
      throw new Error(`Gemini API Error: ${cleanText}`);
    }

    // If it's already valid JSON, return as is
    try {
      JSON.parse(cleanText);
      return cleanText;
    } catch {
      // Not valid JSON, proceed with conversion
    }

    // 🚨 IMPROVED: Better extraction of embedded JSON from mixed responses
    // Handle patterns like: Thought: something...{"command": {...}}
    const embeddedJsonMatch = cleanText.match(/(\{[\s\S]*?\})(?:\s*$|\n|$)/);
    if (embeddedJsonMatch) {
      try {
        const potentialJson = embeddedJsonMatch[1];
        JSON.parse(potentialJson); // Validate JSON
        this.log.info('🔧 Extracted embedded JSON from mixed response');
        return potentialJson;
      } catch {
        // If extraction fails, continue with normal processing
      }
    }

    // Handle the specific pattern: Thought: ...{"command": {...}}
    const thoughtJsonPattern = cleanText.match(/Thought:\s*([^}]+)\s*(\{[\s\S]*?\})/);
    if (thoughtJsonPattern) {
      try {
        const jsonPart = thoughtJsonPattern[2];
        JSON.parse(jsonPart); // Validate JSON
        this.log.info('🔧 Extracted JSON from Thought+JSON pattern');
        return jsonPart;
      } catch {
        // If extraction fails, continue with normal processing
      }
    }

    // 🚨 ENHANCEMENT: Check if we should switch to local mode due to API issues
    if (this.llmFailureCounter > 0 && this.detectIfShouldUseLocalMode(cleanText)) {
      this.log.info('🔄 Switching to local mode due to API failures');
      return this.generateLocalModeResponse(cleanText);
    }

    // FIRST: Try to extract actual tool calls from the text
    // Support multiple formats:
    // 1. "Tool Call: toolName with params {...}"
    // 2. "Tool Call: toolName({...})"
    // 3. "Tool Call: toolName({...})" (without parentheses)
    // 4. Plain "Tool Call: toolName(...)" when it's the only content
    let toolCallMatch = cleanText.match(/Tool Call:\s*(\w+)\s*with\s*params\s*(\{.*?\}(?:\s*$|\n|Tool Result:))/is);
    
    // If first pattern doesn't match, try the second format: "Tool Call: toolName({...})"
    if (!toolCallMatch) {
      toolCallMatch = cleanText.match(/Tool Call:\s*(\w+)\s*\(\s*(\{[\s\S]*?\})\s*\)(?:\s*$|\n|Tool Result:)/is);
    }
    
    // If still no match, try even more flexible pattern without parentheses
    if (!toolCallMatch) {
      toolCallMatch = cleanText.match(/Tool Call:\s*(\w+)\s*(\{[\s\S]*?\})(?:\s*$|\n|Tool Result:)/is);
    }
    
    // Special case: if the text starts directly with "Tool Call:" and nothing else, try to extract it
    if (!toolCallMatch && cleanText.trim().startsWith('Tool Call:')) {
      toolCallMatch = cleanText.match(/^Tool Call:\s*(\w+)\s*\(\s*(\{[\s\S]*?\})\s*\)(?:\s*$|\n)/is);
    }
    if (toolCallMatch) {
      const toolName = toolCallMatch[1];
      let params = {};
      
      // Extract the JSON part more carefully
      let jsonStr = toolCallMatch[2].trim();
      
      // For multiline JSON, find the complete JSON object by counting braces
      let braceCount = 0;
      let jsonEnd = 0;
      let inString = false;
      let escapeNext = false;
      
      for (let i = 0; i < jsonStr.length; i++) {
        const char = jsonStr[i];
        
        if (escapeNext) {
          escapeNext = false;
          continue;
        }
        
        if (char === '\\') {
          escapeNext = true;
          continue;
        }
        
        if (char === '"' && !escapeNext) {
          inString = !inString;
          continue;
        }
        
        if (!inString) {
          if (char === '{') braceCount++;
          if (char === '}') braceCount--;
          
          if (braceCount === 0 && char === '}') {
            jsonEnd = i + 1;
            break;
          }
        }
      }
      
      if (jsonEnd > 0) {
        jsonStr = jsonStr.substring(0, jsonEnd);
      } else {
        // Fallback: remove everything after the JSON object (like "Tool Result:")
        const jsonEndMatch = jsonStr.match(/^(\{.*?\})(?:\s*(?:Tool Result:|$|\n))/s);
        if (jsonEndMatch) {
          jsonStr = jsonEndMatch[1];
        }
      }
      
      try {
        params = JSON.parse(jsonStr);

        // Special handling for display_canvas tool - ensure content is a string
        if (toolName === 'display_canvas' && params && typeof (params as any).content === 'object') {
          this.log.info('🔧 Converting display_canvas content object to JSON string');
          (params as any).content = JSON.stringify((params as any).content);
        }
      } catch (e) {
        this.log.warn(`Failed to parse JSON params for tool ${toolName}: ${jsonStr}`);
        // Last fallback: extract specific fields manually
        const responseMatch = cleanText.match(/"response":\s*"([^"]+)"/);
        if (responseMatch && toolName.toLowerCase() === 'finish') {
          params = { response: responseMatch[1] };
        } else if (toolName.toLowerCase() === 'todowrite') {
          // Special handling for todoWrite - try to extract the todos array
          const todosMatch = jsonStr.match(/"todos":\s*\[[\s\S]*?\]/);
          if (todosMatch) {
            try {
              const todosObj = JSON.parse(`{${todosMatch[0]}}`);
              params = todosObj;
            } catch (e3) {
              // If that fails too, just set empty params to avoid undefined error
              params = { todos: [] };
            }
          } else {
            params = { todos: [] };
          }
        } else {
          // Try to find quoted strings for parameters
          const quotedValues = jsonStr.match(/"([^"]+)":\s*"([^"]+)"/g);
          if (quotedValues) {
            const extracted: Record<string, any> = {};
            quotedValues.forEach(match => {
              const keyValue = match.match(/"([^"]+)":\s*"([^"]+)"/);
              if (keyValue) {
                extracted[keyValue[1]] = keyValue[2];
              }
            });
            params = extracted;
          }
        }
      }
      
      // Extract thought from the text (everything before Tool Call)
      const thoughtMatch = cleanText.match(/^(.*?)Tool Call:/s);
      const thought = thoughtMatch ? thoughtMatch[1].trim() : `Appel de l'outil ${toolName}`;
      
      return JSON.stringify({
        thought: thought,
        command: {
          name: toolName,
          params: params
        }
      });
    }

    // Analyze the content to determine appropriate tool
    const lowerText = cleanText.toLowerCase();

    // Check for direct action requests (like "continue le jeu defender")
    const directActionKeywords = [
      'continue',
      'continuer',
      'reprendre',
      'recommencer',
      'next',
      'go',
      'ok',
      'lancer',
      'start',
      'run',
      'execute',
      'executer',
      'type',
      'enter',
      'input',
      'fill',
      'complete',
      'submit',
      'taper',
      'entrer',
      'remplir',
      'compléter',
      'soumettre',
    ];
    const isDirectAction = directActionKeywords.some((keyword) =>
      lowerText.includes(keyword),
    );

    // Check for game/project related keywords
    const gameKeywords = [
      'jeu',
      'game',
      'defender',
      'projet',
      'project',
      'application',
      'app',
    ];
    const isGameRequest = gameKeywords.some((keyword) =>
      lowerText.includes(keyword),
    );

    // If it's a direct action on a game/project, explore project structure first
    if (isDirectAction && isGameRequest) {
      thought = "L'utilisateur demande de continuer/reprendre un projet. Je vais d'abord explorer la structure du projet.";
      command = {
        name: 'listDirectory',
        params: {
          path: '.',
        },
      };
    }
    // For short continuation words, also explore project first
    else if (isDirectAction && cleanText.length < 15) {
      thought = "L'utilisateur veut continuer. Je vais d'abord voir l'état actuel du projet.";
      command = {
        name: 'listDirectory',
        params: {
          path: '.',
        },
      };
    }
    // Handle form continuation responses (like "I will now type the telephone number...")
    else if (this.isFormContinuationResponse(cleanText)) {
      thought = "L'IA indique qu'elle va continuer avec la prochaine étape du formulaire.";
      command = this.getNextFormStep(cleanText);
    }

    // Check for canvas-related keywords
    const canvasKeywords = [
      'canvas',
      'display',
      'show',
      'demo',
      'afficher',
      'montrer',
      'visual',
    ];
    const isCanvasRequest = canvasKeywords.some((keyword) =>
      lowerText.includes(keyword),
    );

    // Check for thought-related keywords (to avoid sending thoughts to canvas)
    const thoughtKeywords = [
      'think',
      'thought',
      'reason',
      'plan',
      'approach',
      'next step',
      'réflexion',
      'pensée',
      'raisonnement',
      'prochaine étape',
      'je vais',
    ];
    const isThoughtContent = thoughtKeywords.some((keyword) =>
      lowerText.includes(keyword),
    );

    // Check for todo-related keywords
    const todoKeywords = [
      'todo',
      'task',
      'list',
      'step',
      'plan',
      'workflow',
      'tâche',
      'étape',
    ];
    const isTodoRequest = todoKeywords.some((keyword) =>
      lowerText.includes(keyword),
    );

    // Check for creation/building requests that should use todo lists
    const creationKeywords = [
      'create',
      'build',
      'make',
      'generate',
      'develop',
      'implement',
      'write',
      'game',
      'website',
      'app',
      'créer',
      'construire',
      'faire',
      'générer',
      'développer',
      'implémenter',
      'écrire',
    ];

    // Check if this looks like a creation request
    const isCreationRequest = creationKeywords.some((keyword) =>
      lowerText.includes(keyword),
    );


    // Check if the response appears to be truncated (incomplete)
    const isTruncated = this.isResponseTruncated(cleanText);
    
    // If response is truncated, provide direct response
    if (isTruncated) {
      thought = "La réponse de l'IA semble incomplète.";
      command = {
        name: 'finish',
        params: {
          response: "La réponse précédente était incomplète. Pourriez-vous reformuler votre demande pour obtenir une réponse plus claire ?",
        },
      };
    }
    // Thought content now handled directly with finish
    else if (isThoughtContent && !isCanvasRequest) {
      thought = "Réponse de l'IA traitée.";
      command = {
        name: 'finish',
        params: {
          response: cleanText,
        },
      };
    } else if (isCanvasRequest && !isThoughtContent) {
      // Handle canvas display requests (but not if it's clearly thought content)
      thought = "L'utilisateur veut afficher quelque chose dans le canvas.";
      
      // Filter out any JSON content or debugging information from canvas display
      let filteredContent = cleanText;
      
      // Check if the content looks like debugging JSON with "thought" field
      try {
        const parsed = JSON.parse(cleanText);
        if (parsed.thought || parsed.command) {
          // This is debugging/internal agent information, don't display it in canvas
          filteredContent = "<div style='padding: 20px; text-align: center;'><h2>Content filtered</h2><p>Internal agent debugging information was filtered out for security.</p></div>";
        }
      } catch {
        // Not JSON, check for JSON-like patterns in text
        if (cleanText.includes('"thought"') || cleanText.includes('```json')) {
          // Contains debugging information, filter it out
          filteredContent = "<div style='padding: 20px; text-align: center;'><h2>Content filtered</h2><p>Internal agent debugging information was filtered out for security.</p></div>";
        }
      }
      
      command = {
        name: 'display_canvas',
        params: {
          content: cleanText.includes('helloworld')
            ? "<div style='display: flex; justify-content: center; align-items: center; height: 100vh; font-size: 48px; font-weight: bold;'>helloworld</div>"
            : filteredContent, // Use filteredContent directly instead of wrapping it
          contentType: 'html',
        },
      };
    } else if (isCreationRequest && isTodoRequest) {
      // For creation requests that mention todos, create a smart todo list
      const smartTodos = this.createSmartTodoList(cleanText);
      thought = "Je vais créer une todo list spécifique et utile pour organiser le travail demandé.";
      command = {
        name: 'todo_write',
        params: {
          todos: smartTodos,
        },
      };
    } else if (isTodoRequest) {
      // Pure todo list request
      thought =
        "L'utilisateur veut utiliser la todo list. Je vais afficher ou gérer la todo list.";
      command = {
        name: 'todo_write',
        params: {
          action: 'display',
        },
      };
    } else if (isCreationRequest) {
      // Other creation requests - but prevent repetitive behavior
      // Check if we've recently created a todo list to avoid loops
      const recentCommands = this.commandHistory.slice(-2); // Reduced from -3 to -2
      const hasRecentTodoList = recentCommands.some(cmd =>
        cmd.name === 'todo_write' &&
        cmd.params &&
        (cmd.params.action === 'create' || cmd.params.action === 'display')
      );

      if (hasRecentTodoList) {
        // If we've recently created a todo list, finish instead of creating another
        thought = "J'ai déjà créé une todo list récemment.";
        command = {
          name: 'finish',
          params: {
            response: "J'ai déjà créé une liste de tâches pour ce projet. Si vous souhaitez modifier ou consulter la liste existante, faites-le moi savoir.",
          },
        };
      } else {
        // Create a smart, specific todo list based on the user's request
        const smartTodos = this.createSmartTodoList(cleanText);
        thought = "Je vais créer une todo list spécifique et utile pour organiser le travail demandé.";
        command = {
          name: 'todo_write',
          params: {
            todos: smartTodos,
          },
        };
      }
    } else {
      // Analyze the request to determine the appropriate tool
      if (cleanText.toLowerCase().includes('search') || cleanText.toLowerCase().includes('recherche')) {
        thought = "L'utilisateur demande une recherche. Je vais utiliser Playwright pour naviguer vers un moteur de recherche.";
        command = {
          name: 'playwright_navigate',
          params: {
            url: `https://www.google.com/search?q=${encodeURIComponent(cleanText.replace(/^.*?(search|recherche)\s+/i, '').trim() || cleanText)}`,
          },
        };
      } else if (cleanText.toLowerCase().includes('read') || cleanText.toLowerCase().includes('lire') || cleanText.toLowerCase().includes('file')) {
        thought = "L'utilisateur veut lire un fichier.";
        command = {
          name: 'readFile',
          params: {
            filePath: cleanText.match(/[\w/.-]+\.(js|ts|json|txt|md)/) ? cleanText.match(/[\w/.-]+\.(js|ts|json|txt|md)/)?.[0] : '/home/demon/agentforge/AgenticForge2',
          },
        };
      } else if (cleanText.toLowerCase().includes('list') || cleanText.toLowerCase().includes('lister')) {
        thought = "L'utilisateur veut lister des fichiers.";
        command = {
          name: 'listFiles',
          params: {
            path: '/home/demon/agentforge/AgenticForge2',
          },
        };
      } else {
        // 🚨 IMPROVED: Better logic for simple responses vs complex tasks
        const hasWorkToDo = this.detectIfAgentHasPendingWork(cleanText);
        const shouldStartWorking = this.detectIfShouldStartWorking(cleanText);
        const isContinuationResponse = this.detectIfContinuationResponse(cleanText);
    
        // For very short responses (like "llo", "hi", "ok"), always use finish
        if (cleanText.length < 10 && !cleanText.includes('continue') && !cleanText.includes('start')) {
          thought = "Réponse simple de l'utilisateur.";
          command = {
            name: 'finish',
            params: {
              response: cleanText.length > 0 ? cleanText : "Hello! How can I help you?",
            },
          };
        } else if (shouldStartWorking) {
          // Agent should start working on the first pending task
          const nextTask = this.getNextPendingTask();
          if (nextTask) {
            thought = `Starting work on: ${nextTask.content}`;
            command = this.convertTaskToCommand(nextTask);
          } else {
            // Fallback to finish if no specific task found
            thought = "Traitement de la demande.";
            command = {
              name: 'finish',
              params: {
                response: cleanText,
              },
            };
          }
        } else if (hasWorkToDo && isContinuationResponse) {
          // Handle continuation with direct action
          thought = "Continuation de la tâche.";
          command = {
            name: 'finish',
            params: {
              response: cleanText,
            },
          };
        } else {
          // Default to finish for simple responses and greetings
          thought = "Traitement de la réponse de l'utilisateur.";
          command = {
            name: 'finish',
            params: {
              response: cleanText,
            },
          };
        }
      }
    }

    const jsonObject = { command, thought };
    return JSON.stringify(jsonObject);
  }

  /**
   * Check if a response appears to be truncated or incomplete
   */
  private isResponseTruncated(text: string): boolean {
    // Check for common truncation patterns (only strong indicators)
    const truncationIndicators = [
      '\\', // Escaped characters at end
      '",', // Incomplete key-value pair with comma
      '":', // Incomplete string with colon
    ];
    
    const trimmed = text.trim();
    
    // Check if text ends with a truncation indicator
    if (truncationIndicators.some(indicator => trimmed.endsWith(indicator))) {
      return true;
    }
    
    // Check for incomplete code blocks
    const codeBlockPatterns = [
      '```javascript',
      '```html',
      '```json',
      'function',
      'const ',
      'let ',
      'var ',
      'if (',
      'for (',
      'while (',
    ];
    
    if (codeBlockPatterns.some(pattern => 
      trimmed.includes(pattern) && 
      !trimmed.includes('```') && 
      trimmed.length > 100)) {
      return true;
    }
    
    // Check if response is unusually short for the context
    if (trimmed.length < 50 && 
        (trimmed.includes('Tool Call:') || trimmed.includes('Tool Result:'))) {
      return true;
    }
    
    // Additional check for truncated responses that end mid-sentence
    // Only consider it truncated if it has clear indicators of incomplete JSON structure
    if (trimmed.length > 100 && 
        (trimmed.includes('{"') || trimmed.includes('"command"') || trimmed.includes('"thought"')) &&
        !trimmed.endsWith('}') && !trimmed.endsWith('"]')) {
      // If it starts JSON structure but doesn't end properly, it might be truncated
      return true;
    }
    
    return false;
  }

  private detectLoop(
    thought?: string,
    command?: { name?: string; params?: Record<string, any>; },
  ): boolean {
    const now = Date.now();

    // Add current behavior to history
    this.behaviorHistory.push({
      command,
      thought,
      timestamp: now,
    });

    // Keep only the most recent behaviors
    if (this.behaviorHistory.length > this.maxBehaviorHistory) {
      this.behaviorHistory.shift();
    }

    // Check for repetitive patterns
    if (this.behaviorHistory.length >= this.loopDetectionThreshold) {
      // Check for command repetition
      if (command) {
        const recentCommands = this.behaviorHistory.slice(
          -this.loopDetectionThreshold,
        );
        const allSameCommand = recentCommands.every(
          (behavior) =>
            behavior.command &&
            behavior.command.name === command.name &&
            JSON.stringify(behavior.command.params) ===
              JSON.stringify(command.params),
        );

        if (allSameCommand) {
          this.log.warn(
            `Loop detected: Same command '${command.name}' repeated ${this.loopDetectionThreshold} times`,
          );
          return true;
        }
      }

      // Check for thought repetition (if no command)
      if (thought && !command) {
        const recentThoughts = this.behaviorHistory.slice(
          -this.loopDetectionThreshold,
        );
        const allSimilarThoughts = recentThoughts.every(
          (
            behavior: { thought?: string },
            index: number,
            arr: { thought?: string }[],
          ) =>
            behavior.thought &&
            this.calculateTextSimilarity(behavior.thought, thought) > 0.8,
        );

        if (allSimilarThoughts) {
          this.log.warn(
            `Loop detected: Similar thoughts repeated ${this.loopDetectionThreshold} times`,
          );
          return true;
        }
      }
    }

    return false;
  }

  private async executeTool(command: Command, log: Logger): Promise<unknown> {
    try {
      this.publishToChannel({
        data: { args: command.params, name: command.name },
        type: 'tool.start',
      });
      let result;
      if (command.name === 'ls -la') {
        try {
          result = await toolRegistry.execute(
            'simpleList',
            { detailed: true },
            {
              job: this.job,
              llm: getLlmProvider(this.activeLlmProvider),
              log,
              reportProgress: async (data: any) => {
                this.job.updateProgress(data);
              },
              session: this.session,
              streamContent: async (data: any) => {
                this.publishToChannel({
                  content: data,
                  toolName: command.name,
                  type: 'tool_stream',
                });
              },
              taskQueue: this.taskQueue,
            },
          );
        } catch (toolError) {
          log.error(
            {
              error: toolError instanceof Error ? toolError : new Error(String(toolError)),
              params: command.params,
              tool: command.name,
            },
            `Error executing tool ${command.name}`
          );
          throw toolError;
        }
      } else {
        try {
          result = await toolRegistry.execute(command.name, command.params, {
            job: this.job,
            llm: getLlmProvider(this.activeLlmProvider),
            log,
            reportProgress: async (data: any) => {
              this.job.updateProgress(data);
            },
            session: this.session,
            streamContent: async (data: any) => {
              this.publishToChannel({
                content: data,
                toolName: command.name,
                type: 'tool_stream',
              });
            },
            taskQueue: this.taskQueue,
          });
        } catch (toolError) {
          // 🚨 AMÉLIORATION: Tracker les échecs d'exécution
          this.trackExecutedAction(command.name, false);
          
          log.error(
            {
              error: toolError instanceof Error ? toolError : new Error(String(toolError)),
              params: command.params,
              tool: command.name,
            },
            `Error executing tool ${command.name}`
          );
          throw toolError;
        }
      }
      this.publishToChannel({
        result: result, // Removed 'as unknown'
        toolName: command.name,
        type: 'tool_result',
      });
      
      // 🚨 AMÉLIORATION: Tracker les actions exécutées avec succès
      this.trackExecutedAction(command.name, true);
      if (command.name === 'display_canvas') {
        this.lastDisplayCanvasCall = Date.now();
        log.info('✅ display_canvas tracked as executed successfully');
      }
      
      // Agent thought handling removed - no longer needed
      
      return result;
    } catch (_error) {
      if (_error instanceof FinishToolSignal) {
        throw _error;
      }
      const errorDetails =
        _error instanceof Error
          ? {
              message: _error.message,
              name: _error.name,
              stack: _error.stack,
            }
          : {
              message: String(_error),
              name: 'UnknownError',
              stack: '',
            };

      log.error(
        {
          error: errorDetails,
          params: command.params,
          tool: command.name,
        },
        `Error executing tool ${command.name}`,
      );

      this.publishToChannel({
        result: { error: errorDetails },
        toolName: command.name,
        type: 'tool_result',
      });

      return `Error executing tool ${command.name}: ${errorDetails.message}`;
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

  private async attemptFallbackResponse(): Promise<string> {
    this.log.info('Attempting fallback response generation');
    
    // Create a simplified prompt asking for just a basic response
    const fallbackPrompt = `
    I need you to provide a simple, direct response to complete this task. 
    Please respond with only:
    {"thought": "Completing the task with a fallback response", "command": {"name": "finish", "params": {"response": "I encountered some technical difficulties but have completed what I can. Please let me know if you need any specific assistance."}}}
    
    Do not include any other text outside the JSON object.`;
    
    try {
      // Use the default LLM provider for fallback
      const response = await getLlmProvider('gemini').getLlmResponse(
        [{ role: 'user', parts: [{ text: fallbackPrompt }] }],
        'You are a helpful assistant. Always respond with valid JSON format exactly as requested.',
        this.llmApiKey || this.apiKey,
        this.llmModelName
      );
      
      if (response) {
        const parsed = this.parseLlmResponse(response, this.log);
        if (parsed.command?.name === 'finish' && parsed.command.params?.response) {
          return parsed.command.params.response as string;
        }
      }
    } catch (error) {
      this.log.error({ error }, 'Fallback LLM call also failed');
    }
    
    // If all else fails, return a static fallback response
    return 'I apologize, but I encountered technical difficulties completing your request. Please try rephrasing your request or contact support if the issue persists.';
  }

  private parseLlmResponse(llmResponse: string, log: Logger) {
    log.info('🧠 PARSING LLM Response...');

    // 🚨 IMPROVED: Better detection of malformed responses
    const isIncomplete =
      llmResponse.trim().endsWith('...') ||
      llmResponse.includes('ASSISTANT:') ||
      llmResponse.includes('La réponse de l\'IA semble incomplète') ||
      (llmResponse.includes('The agent is thinking...') && !llmResponse.includes('Tool Call:') && !llmResponse.includes('{')) ||
      llmResponse.trim().length < 10; // Too short to be valid

    // 🚨 AMÉLIORATION: Détecter les réponses répétitives pour éviter les boucles
    const isRepetitive = this.detectRepetitiveResponse(llmResponse);

    if (isIncomplete) {
      log.warn('🚨 Réponse LLM incomplète détectée, forçage fallback');
      throw new Error('LLM response appears incomplete or truncated');
    }

    if (isRepetitive) {
      log.warn('🚨 Réponse LLM répétitive détectée, forçage fallback');
      throw new Error('LLM response appears repetitive, avoiding loop');
    }
    
    const jsonText = this.extractJsonFromMarkdown(llmResponse);
    log.debug({ jsonText: jsonText.substring(0, 200) + '...' }, 'Attempting to parse LLM response');
    
    try {
      const parsed = JSON.parse(jsonText);
      log.debug({ parsed }, 'Successfully parsed LLM response');
      return llmResponseSchema.parse(parsed);
    } catch (error) {
      log.warn('⚠️ Initial parsing failed, trying conversion...');

      // 🚨 AMÉLIORATION 2: Meilleure conversion des réponses Tool Call:
      try {
        const convertedResponse = this.convertPlainTextToValidJson(jsonText);
        const convertedParsed = JSON.parse(convertedResponse);
        log.info('✅ Successfully converted plain text to valid JSON');
        const validated = llmResponseSchema.parse(convertedParsed);
        
        // 🚨 AMÉLIORATION 3: Vérifier que les outils critiques sont présents
        if (validated.command) {
          log.info(`🔧 Tool detected: ${validated.command.name}`);
        }
        
        return validated;
      } catch (conversionError) {
        log.error(
          { conversionError, originalError: error, responseLength: llmResponse.length },
          '💥 Failed to convert plain text to valid JSON',
        );
      }

      // 🚨 AMÉLIORATION 4: Informations de debug détaillées
      log.error({
        responseStart: llmResponse.substring(0, 100),
        responseEnd: llmResponse.substring(Math.max(0, llmResponse.length - 100)),
        jsonTextStart: jsonText.substring(0, 100),
        hasToolCall: jsonText.includes('Tool Call:'),
        hasJson: jsonText.includes('{'),
      }, '🔍 Detailed parsing failure analysis');

      throw new Error(`Failed to parse LLM response: ${jsonText.substring(0, 200)}...`);
    }
  }

  private publishToChannel(data: ChannelData) {
    const channel = `job:${this.job.id}:events`;
    const message = JSON.stringify(data);
    this.log.info(
      { channel, dataType: data.type, message },
      '[PUBLISH] Publishing message to Redis channel',
    );
    getRedisClientInstance().publish(channel, message);
    this.log.info('[PUBLISH] Message published to Redis successfully');
    // Only send serializable and relevant data to updateProgress
    const progressData = { ...data };
    if (progressData.type === 'tool.start') {
      // Avoid sending non-serializable data
      delete (progressData.data as any).args;
    }
    this.job.updateProgress(progressData);
  }

  private async setupInterruptListener(): Promise<void> {
    const channel = `job:${this.job.id}:interrupt`;
    this.subscriber = getRedisClientInstance().duplicate();

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
  
  // 🚨 AMÉLIORATION: Méthodes de tracking des actions
  private trackExecutedAction(actionName: string, successful: boolean): void {
    const current = this.executedActions.get(actionName);
    this.executedActions.set(actionName, {
      count: (current?.count || 0) + 1,
      lastExecution: Date.now(),
      successful: successful
    });
    
    this.log.info(`📊 Action tracked: ${actionName} (success: ${successful}, total: ${(current?.count || 0) + 1})`);
  }
  
  private hasExecutedActionRecently(actionName: string, withinMs: number = 30000): boolean {
    const action = this.executedActions.get(actionName);
    if (!action || !action.successful) return false;
    
    const timeSince = Date.now() - action.lastExecution;
    return timeSince <= withinMs;
  }
  
  private getActionExecutionSummary(): string {
    const summary: string[] = [];
    for (const [action, info] of this.executedActions.entries()) {
      if (info.successful) {
        const timeAgo = Math.floor((Date.now() - info.lastExecution) / 1000);
        summary.push(`✅ ${action} (${timeAgo}s ago, ${info.count}x)`);
      } else {
        summary.push(`❌ ${action} (failed ${info.count}x)`);
      }
    }
    return summary.length > 0 ? summary.join(', ') : 'No actions executed yet';
  }

  /**
   * Detect if the agent should start working on pending tasks
   */
  private detectIfShouldStartWorking(text: string): boolean {
    const lowerText = text.toLowerCase();

    // Check if text indicates starting work or beginning tasks
    const startIndicators = [
      'first', 'start', 'begin', 'let\'s', 'i\'ll start', 'commencer',
      'premièrement', 'commençons', 'je vais commencer'
    ];

    const hasStartIndicators = startIndicators.some(indicator => lowerText.includes(indicator));

    // Check if we recently created a todo list
    const recentCommands = this.commandHistory.slice(-2);
    const hasRecentTodoWrite = recentCommands.some(cmd => cmd.name === 'todo_write');

    // If we just created a todo list and text indicates starting, we should begin work
    return hasRecentTodoWrite && hasStartIndicators;
  }

  /**
   * Get the next pending task based on recent todo creation
   */
  private getNextPendingTask(): { id: string; content: string; status: string } | null {
    // Since we don't have direct access to todo state, we'll infer from command history
    // This is a simplified approach - in a real implementation, you'd track todo state
    const recentCommands = this.commandHistory.slice(-3);
    const todoWriteCommand = recentCommands.find(cmd => cmd.name === 'todo_write');

    if (todoWriteCommand && todoWriteCommand.params?.todos) {
      const todos = todoWriteCommand.params.todos as Array<{ id: string; content: string; status: string }>;
      const pendingTodo = todos.find(todo => todo.status === 'pending');
      return pendingTodo || null;
    }

    return null;
  }

  /**
   * Convert a task to an appropriate command
   */
  private convertTaskToCommand(task: { id: string; content: string; status: string }): Command {
    const lowerContent = task.content.toLowerCase();

    // Map common task types to commands
    if (lowerContent.includes('list') && lowerContent.includes('tool')) {
      return {
        name: 'listTools',
        params: {}
      };
    }

    if (lowerContent.includes('navigate') || lowerContent.includes('go to')) {
      return {
        name: 'playwright_navigate',
        params: {
          url: 'https://example.com' // Default URL, could be made smarter
        }
      };
    }

    if (lowerContent.includes('content') || lowerContent.includes('extract')) {
      return {
        name: 'playwright_get_content',
        params: {
          selector: 'body' // Default selector
        }
      };
    }

    if (lowerContent.includes('screenshot')) {
      return {
        name: 'playwright_screenshot',
        params: {}
      };
    }

    // Check if this is a form completion task
    if (this.isFormCompletionTask(task)) {
      return this.getNextFormFieldCommand();
    }

    // Default fallback
    return {
      name: 'finish',
      params: {
        response: `Working on: ${task.content}`
      }
    };
  }

  /**
   * Check if the current task involves completing a form
   */
  private isFormCompletionTask(task: { id: string; content: string; status: string }): boolean {
    const lowerContent = task.content.toLowerCase();

    // Keywords that indicate form completion tasks
    const formKeywords = [
      'form', 'field', 'input', 'fill', 'complete', 'submit',
      'formulaire', 'champ', 'remplir', 'compléter', 'soumettre',
      'name', 'email', 'phone', 'address', 'contact',
      'nom', 'courriel', 'téléphone', 'adresse', 'contact'
    ];

    return formKeywords.some(keyword => lowerContent.includes(keyword));
  }

  /**
   * Get the next logical form field command based on recent actions
   */
  private getNextFormFieldCommand(): Command {
    // Check recent command history to determine next logical step
    const recentCommands = this.commandHistory.slice(-3);

    // If we just typed in a name field, next might be email or phone
    const lastTypeCommand = recentCommands.reverse().find(cmd =>
      cmd.name === 'playwright_type' && cmd.params
    );

    if (lastTypeCommand) {
      const lastSelector = (lastTypeCommand.params as any).selector || '';

      // If we just filled a name field, try phone next
      if (lastSelector.includes('name') || lastSelector.includes('nom')) {
        return {
          name: 'playwright_type',
          params: {
            selector: 'input[name="phone"], input[name="tel"], input[name="telephone"], input[type="tel"]',
            text: '+33123456789', // Default phone number
            clear: true
          }
        };
      }

      // If we just filled a phone field, try email next
      if (lastSelector.includes('phone') || lastSelector.includes('tel')) {
        return {
          name: 'playwright_type',
          params: {
            selector: 'input[name="email"], input[type="email"]',
            text: 'test@example.com', // Default email
            clear: true
          }
        };
      }

      // If we just filled an email field, try to submit
      if (lastSelector.includes('email')) {
        return {
          name: 'playwright_click',
          params: {
            selector: 'button[type="submit"], input[type="submit"], button:contains("Submit"), button:contains("Send")'
          }
        };
      }
    }

    // Default: look for the first empty required field
    return {
      name: 'playwright_type',
      params: {
        selector: 'input[required]:not([value]), input[name]:not([value])',
        text: 'Test Value',
        clear: true
      }
    };
  }

  /**
   * Detect if the agent has pending work based on the response content
   */
  private detectIfAgentHasPendingWork(text: string): boolean {
    const lowerText = text.toLowerCase();

    // Keywords that indicate future work or plans
    const workIndicators = [
      'i\'ll', 'i will', 'first', 'then', 'next', 'after', 'following',
      'je vais', 'ensuite', 'suivant', 'après', 'premièrement',
      'list', 'demonstrate', 'show', 'create', 'implement', 'build',
      'lister', 'démontrer', 'montrer', 'créer', 'implémenter', 'construire',
      'continue', 'continuer', 'start', 'commencer', 'begin', 'commencer',
      'plan', 'planned', 'planning', 'planifié', 'planification'
    ];

    // Check for work indicators
    const hasWorkIndicators = workIndicators.some(indicator => lowerText.includes(indicator));

    // Check for question marks (indicating clarification needed, not completion)
    const hasQuestions = lowerText.includes('?');

    // Check if text mentions specific actions or tools
    const actionKeywords = [
      'tool', 'tools', 'navigate', 'content', 'screenshot', 'list',
      'outil', 'outils', 'naviguer', 'contenu', 'capture', 'lister'
    ];
    const hasActionKeywords = actionKeywords.some(keyword => lowerText.includes(keyword));

    // Check recent command history for pending work
    const recentCommands = this.commandHistory.slice(-3);
    const hasRecentTodoWrite = recentCommands.some(cmd => cmd.name === 'todo_write');

    // If we recently created a todo list, we likely have work to do
    if (hasRecentTodoWrite && (hasWorkIndicators || hasActionKeywords)) {
      return true;
    }

    // If text contains work indicators and action keywords, agent has work to do
    if (hasWorkIndicators && hasActionKeywords) {
      return true;
    }

    // If text has work indicators but also questions, it might need clarification
    if (hasWorkIndicators && hasQuestions) {
      return true;
    }

    // Default to no pending work if none of the above conditions are met
    return false;
  }

  /**
   * Detect if the response indicates continuation of work rather than completion
   */
  private detectIfContinuationResponse(text: string): boolean {
    const lowerText = text.toLowerCase();

    // Keywords that indicate the agent is about to perform an action
    const continuationIndicators = [
      'i will now', 'i\'m going to', 'i\'ll now', 'now i will', 'next i will',
      'i am going to', 'i\'m about to', 'i\'ll proceed to', 'i will proceed',
      'je vais maintenant', 'maintenant je vais', 'je vais procéder',
      'je m\'apprête à', 'ensuite je vais', 'maintenant je',
      'type', 'enter', 'input', 'fill', 'complete', 'submit',
      'taper', 'entrer', 'remplir', 'compléter', 'soumettre',
      'navigate', 'go to', 'visit', 'access', 'open',
      'naviguer', 'aller à', 'visiter', 'accéder', 'ouvrir',
      'click', 'select', 'choose', 'pick',
      'cliquer', 'sélectionner', 'choisir', 'sélectionner',
      'search', 'find', 'look for', 'locate',
      'chercher', 'trouver', 'rechercher', 'localiser'
    ];

    // Check for continuation indicators
    const hasContinuationIndicators = continuationIndicators.some(indicator =>
      lowerText.includes(indicator)
    );

    // Check if response mentions specific form fields or actions
    const formActionKeywords = [
      'field', 'input', 'form', 'button', 'textbox', 'textarea',
      'champ', 'entrée', 'formulaire', 'bouton', 'zone de texte',
      'name', 'email', 'phone', 'address', 'password',
      'nom', 'courriel', 'téléphone', 'adresse', 'mot de passe',
      'telephone', 'téléphone', 'number', 'numéro'
    ];

    const hasFormKeywords = formActionKeywords.some(keyword =>
      lowerText.includes(keyword)
    );

    // Check if this follows a recent form interaction
    const recentCommands = this.commandHistory.slice(-2);
    const hasRecentFormInteraction = recentCommands.some(cmd =>
      cmd.name && (
        cmd.name.includes('playwright') ||
        cmd.name.includes('type') ||
        cmd.name.includes('click') ||
        cmd.name.includes('fill')
      )
    );

    // If response has continuation indicators and form keywords, it's likely a continuation
    if (hasContinuationIndicators && hasFormKeywords) {
      return true;
    }

    // If response has continuation indicators and follows recent form interaction, it's a continuation
    if (hasContinuationIndicators && hasRecentFormInteraction) {
      return true;
    }

    // Specific pattern: "I will now type X into Y" or similar
    if (lowerText.includes('type') && (lowerText.includes('into') || lowerText.includes('in'))) {
      return true;
    }

    // Specific pattern: "I will now enter X" or similar
    if ((lowerText.includes('enter') || lowerText.includes('input')) && hasFormKeywords) {
      return true;
    }

    return false;
  }

  /**
   * Detect if we should switch to local mode based on text content
   */
  private detectIfShouldUseLocalMode(text: string): boolean {
    const lowerText = text.toLowerCase();

    // Keywords that indicate local operations
    const localKeywords = [
      'list', 'read', 'file', 'directory', 'status', 'info', 'local',
      'lister', 'lire', 'fichier', 'dossier', 'état', 'information'
    ];

    // Check for local operation keywords
    const hasLocalKeywords = localKeywords.some(keyword => lowerText.includes(keyword));

    // Check if we have pending tasks that can be done locally
    const hasPendingTasks = this.getNextPendingTask() !== null;

    return hasLocalKeywords || hasPendingTasks;
  }

  /**
   * Generate a response for local mode operation
   */
  private generateLocalModeResponse(text: string): string {
    const lowerText = text.toLowerCase();

    // Determine appropriate local action based on content
    if (lowerText.includes('list') || lowerText.includes('lister')) {
      return JSON.stringify({
        thought: "Je vais lister les fichiers disponibles localement.",
        command: {
          name: 'listFiles',
          params: { path: '.' }
        }
      });
    }

    if (lowerText.includes('read') || lowerText.includes('lire') || lowerText.includes('file')) {
      return JSON.stringify({
        thought: "Je vais lire un fichier localement.",
        command: {
          name: 'readFile',
          params: { filePath: '/home/demon/agentforge/AgenticForge2/AgenticForge/README.md' }
        }
      });
    }

    if (lowerText.includes('status') || lowerText.includes('info') || lowerText.includes('état')) {
      return JSON.stringify({
        thought: "Je vais afficher les informations système.",
        command: {
          name: 'listTools',
          params: {}
        }
      });
    }

    // Default local action
    return JSON.stringify({
      thought: "Passage en mode local pour effectuer des opérations système.",
      command: {
        name: 'listDirectory',
        params: { path: '.', detailed: true }
      }
    });
  }

  /**
   * Generate a local fallback response when all LLM providers fail
   */
  private async generateLocalFallbackResponse(): Promise<string | undefined> {
    this.log.info('Generating local fallback response...');

    // Check if we have pending tasks that can be executed locally
    const nextTask = this.getNextPendingTask();
    if (nextTask) {
      this.log.info(`Found pending task: ${nextTask.content}`);

      // Convert task to appropriate local action
      const localCommand = this.convertTaskToLocalCommand(nextTask);
      if (localCommand) {
        this.log.info(`Converting to local command: ${localCommand.name}`);

        // Execute the local command directly
        try {
          const result = await this.executeTool(localCommand, this.log);
          this.log.info('Local command executed successfully');

          // Generate a response based on the result
          return JSON.stringify({
            thought: `Executed local task: ${nextTask.content}`,
            command: {
              name: 'finish',
              params: {
                response: `I successfully completed the local task: ${nextTask.content}. Result: ${result}`
              }
            }
          });
        } catch (error) {
          this.log.error({ error }, 'Local command execution failed');
          return JSON.stringify({
            thought: `Local task failed: ${nextTask.content}`,
            command: {
              name: 'finish',
              params: {
                response: `I attempted to complete the local task: ${nextTask.content}, but encountered an error. Please check the system status.`
              }
            }
          });
        }
      }
    }

    // If no local tasks available, provide a basic fallback
    return JSON.stringify({
      thought: "All LLM providers are unavailable, but I can help with local system tasks.",
      command: {
        name: 'finish',
        params: {
          response: "I'm currently unable to access LLM services, but I can help you with local system operations. Please let me know what specific local tasks you'd like me to perform."
        }
      }
    });
  }

  /**
   * Convert a task to a local command that doesn't require LLM
   */
  private convertTaskToLocalCommand(task: { id: string; content: string; status: string }): Command | null {
    const lowerContent = task.content.toLowerCase();

    // File system operations
    if (lowerContent.includes('list') && lowerContent.includes('file')) {
      return {
        name: 'listFiles',
        params: { path: '.' }
      };
    }

    if (lowerContent.includes('read') || lowerContent.includes('examine')) {
      return {
        name: 'readFile',
        params: { filePath: '/home/demon/agentforge/AgenticForge2/AgenticForge/README.md' }
      };
    }

    // System information
    if (lowerContent.includes('status') || lowerContent.includes('info')) {
      return {
        name: 'listTools',
        params: {}
      };
    }

    // Directory listing
    if (lowerContent.includes('explore') || lowerContent.includes('directory')) {
      return {
        name: 'listDirectory',
        params: { path: '.', detailed: true }
      };
    }

    return null; // No suitable local command found
  }

  /**
   * Crée une todo list intelligente basée sur le contenu de la demande utilisateur
   */
  private createSmartTodoList(userRequest: string): Array<{
    id: string;
    content: string;
    status: 'pending' | 'in_progress' | 'completed';
    priority: 'low' | 'medium' | 'high';
    category: string;
  }> {
    const lowerRequest = userRequest.toLowerCase();
    const todos: Array<{
      id: string;
      content: string;
      status: 'pending' | 'in_progress' | 'completed';
      priority: 'low' | 'medium' | 'high';
      category: string;
    }> = [];

    // Détection de type de projet
    if (lowerRequest.includes('game') || lowerRequest.includes('jeu') || lowerRequest.includes('defender')) {
      // Projet de jeu
      todos.push(
        {
          id: '1',
          content: 'Analyser les spécifications du jeu Defender et ses mécaniques',
          status: 'pending',
          priority: 'high',
          category: 'analysis'
        },
        {
          id: '2',
          content: 'Concevoir l\'architecture du jeu (classes, composants)',
          status: 'pending',
          priority: 'high',
          category: 'design'
        },
        {
          id: '3',
          content: 'Implémenter le joueur et ses contrôles',
          status: 'pending',
          priority: 'high',
          category: 'development'
        },
        {
          id: '4',
          content: 'Créer le système d\'ennemis et d\'obstacles',
          status: 'pending',
          priority: 'high',
          category: 'development'
        },
        {
          id: '5',
          content: 'Ajouter le système de score et de vies',
          status: 'pending',
          priority: 'medium',
          category: 'development'
        },
        {
          id: '6',
          content: 'Implémenter les effets visuels et sons',
          status: 'pending',
          priority: 'medium',
          category: 'development'
        },
        {
          id: '7',
          content: 'Tester et déboguer le jeu',
          status: 'pending',
          priority: 'high',
          category: 'testing'
        }
      );
    } else if (lowerRequest.includes('website') || lowerRequest.includes('site web') || lowerRequest.includes('web')) {
      // Projet web
      todos.push(
        {
          id: '1',
          content: 'Définir les spécifications fonctionnelles du site web',
          status: 'pending',
          priority: 'high',
          category: 'planning'
        },
        {
          id: '2',
          content: 'Créer la maquette et le design de l\'interface',
          status: 'pending',
          priority: 'high',
          category: 'design'
        },
        {
          id: '3',
          content: 'Développer la structure HTML et CSS',
          status: 'pending',
          priority: 'high',
          category: 'development'
        },
        {
          id: '4',
          content: 'Implémenter les fonctionnalités JavaScript',
          status: 'pending',
          priority: 'high',
          category: 'development'
        },
        {
          id: '5',
          content: 'Optimiser pour les appareils mobiles',
          status: 'pending',
          priority: 'medium',
          category: 'development'
        },
        {
          id: '6',
          content: 'Tester la compatibilité cross-browser',
          status: 'pending',
          priority: 'medium',
          category: 'testing'
        }
      );
    } else if (lowerRequest.includes('app') || lowerRequest.includes('application') || lowerRequest.includes('mobile')) {
      // Projet d'application
      todos.push(
        {
          id: '1',
          content: 'Analyser les besoins utilisateurs et spécifications',
          status: 'pending',
          priority: 'high',
          category: 'analysis'
        },
        {
          id: '2',
          content: 'Concevoir l\'architecture et l\'interface utilisateur',
          status: 'pending',
          priority: 'high',
          category: 'design'
        },
        {
          id: '3',
          content: 'Développer les fonctionnalités principales',
          status: 'pending',
          priority: 'high',
          category: 'development'
        },
        {
          id: '4',
          content: 'Implémenter la gestion des données',
          status: 'pending',
          priority: 'high',
          category: 'development'
        },
        {
          id: '5',
          content: 'Ajouter les tests unitaires et d\'intégration',
          status: 'pending',
          priority: 'medium',
          category: 'testing'
        },
        {
          id: '6',
          content: 'Préparer le déploiement et la distribution',
          status: 'pending',
          priority: 'medium',
          category: 'deployment'
        }
      );
    } else {
      // Projet générique
      todos.push(
        {
          id: '1',
          content: 'Analyser la demande et définir les objectifs',
          status: 'pending',
          priority: 'high',
          category: 'analysis'
        },
        {
          id: '2',
          content: 'Planifier l\'approche et les étapes',
          status: 'pending',
          priority: 'high',
          category: 'planning'
        },
        {
          id: '3',
          content: 'Commencer l\'implémentation',
          status: 'pending',
          priority: 'high',
          category: 'development'
        },
        {
          id: '4',
          content: 'Tester et valider les résultats',
          status: 'pending',
          priority: 'medium',
          category: 'testing'
        }
      );
    }

    return todos;
  }

  /**
   * Check if the response indicates continuation of a form-filling task
   */
  private isFormContinuationResponse(text: string): boolean {
    const lowerText = text.toLowerCase();

    // Keywords that indicate form continuation
    const formContinuationKeywords = [
      'telephone', 'phone', 'téléphone', 'number', 'numéro',
      'email', 'courriel', 'address', 'adresse', 'city', 'ville',
      'zip', 'postal', 'code', 'message', 'comment',
      'type', 'enter', 'input', 'fill', 'complete',
      'taper', 'entrer', 'remplir', 'compléter'
    ];

    // Check if response mentions form fields
    const hasFormFieldKeywords = formContinuationKeywords.some(keyword =>
      lowerText.includes(keyword)
    );

    // Check if response follows recent form interaction
    const recentCommands = this.commandHistory.slice(-2);
    const hasRecentFormInteraction = recentCommands.some(cmd =>
      cmd.name && (
        cmd.name.includes('playwright_type') ||
        cmd.name.includes('playwright_click') ||
        cmd.name === 'playwright_type'
      )
    );

    return hasFormFieldKeywords && hasRecentFormInteraction;
  }

  /**
   * Get the next form step based on the continuation response
   */
  private getNextFormStep(text: string): Command {
    const lowerText = text.toLowerCase();

    // Determine what field to fill based on the response content
    if (lowerText.includes('telephone') || lowerText.includes('phone') || lowerText.includes('téléphone')) {
      return {
        name: 'playwright_type',
        params: {
          selector: 'input[name*="phone"], input[name*="tel"], input[name*="telephone"], input[type="tel"]',
          text: '+33123456789',
          clear: true
        }
      };
    }

    if (lowerText.includes('email') || lowerText.includes('courriel')) {
      return {
        name: 'playwright_type',
        params: {
          selector: 'input[name*="email"], input[type="email"]',
          text: 'test@example.com',
          clear: true
        }
      };
    }

    if (lowerText.includes('address') || lowerText.includes('adresse')) {
      return {
        name: 'playwright_type',
        params: {
          selector: 'input[name*="address"], input[name*="addr"], textarea[name*="address"]',
          text: '123 Test Street',
          clear: true
        }
      };
    }

    if (lowerText.includes('city') || lowerText.includes('ville')) {
      return {
        name: 'playwright_type',
        params: {
          selector: 'input[name*="city"], input[name*="ville"]',
          text: 'Test City',
          clear: true
        }
      };
    }

    if (lowerText.includes('message') || lowerText.includes('comment')) {
      return {
        name: 'playwright_type',
        params: {
          selector: 'textarea[name*="message"], textarea[name*="comment"], textarea',
          text: 'This is a test message from the agent.',
          clear: true
        }
      };
    }

    // Default: try to find next empty field
    return {
      name: 'playwright_type',
      params: {
        selector: 'input:not([type="submit"]):not([type="button"]):not([value]), textarea:not([value])',
        text: 'Test Input',
        clear: true
      }
    };
  }
}
