import { z, ZodTypeAny } from 'zod';

import { getLoggerInstance } from '../../logger.js';
import { Ctx, Tool } from '../../types.js';
import { AppError, UserError } from '../../utils/errorUtils.js';

class ToolRegistry {
  private static instance: ToolRegistry;
  private readonly tools = new Map<string, Tool<z.AnyZodObject, ZodTypeAny>>();

  private constructor() {}

  public static getInstance(): ToolRegistry {
    if (!ToolRegistry.instance) {
      ToolRegistry.instance = new ToolRegistry();
    }
    return ToolRegistry.instance;
  }

  public clear(): void {
    this.tools.clear();
  }

  public async execute(
    name: string,
    params: unknown,
    ctx: Ctx,
  ): Promise<unknown> {
    const tool = this.get(name);
    if (!tool) {
      throw new UserError(`Tool not found: ${name}`);
    }

    let parsedParams: Record<string, unknown>;
    try {
      parsedParams = tool.parameters.parse(params);
    } catch (error) {
      let errorMessage = `Invalid tool parameters for tool '${name}': `;
      if (error instanceof z.ZodError) {
        errorMessage += JSON.stringify(error.issues);
      } else if (error instanceof Error) {
        errorMessage += error.message;
      } else if (
        typeof error === 'object' &&
        error !== null &&
        'message' in error
      ) {
        errorMessage += String(error.message);
      } else {
        errorMessage += String(error);
      }
      throw new AppError(errorMessage, {
        statusCode: 400,
      });
    }

    ctx.log.info(
      `Executing tool: ${name} with params: ${JSON.stringify(parsedParams)}`,
    );
    return tool.execute(parsedParams, ctx);
  }

  public get(name: string): Tool<z.AnyZodObject, z.ZodTypeAny> | undefined {
    return this.tools.get(name);
  }

  public getAll(): Tool[] {
    return Array.from(this.tools.values());
  }

  public register(tool: Tool<z.AnyZodObject, z.ZodTypeAny>): void {
    if (this.tools.has(tool.name)) {
      throw new UserError(`Tool with name ${tool.name} already registered.`);
    }
    this.tools.set(tool.name, tool);
    console.log(`Tool registered: ${tool.name}`);
    getLoggerInstance().debug(
      { parameters: tool.parameters.shape, toolName: tool.name },
      `Tool registered: ${tool.name}`,
    );
  }

  public unregister(name: string): void {
    if (this.tools.delete(name)) {
      getLoggerInstance().info(`Outil désenregistré : "${name}"`);
    } else {
      getLoggerInstance().warn(
        `Tentative de désenregistrer un outil inconnu : "${name}"`,
      );
    }
  }
}

export const toolRegistry = ToolRegistry.getInstance();
