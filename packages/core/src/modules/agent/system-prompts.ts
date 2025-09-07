import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface SystemPromptTemplate {
  name: string;
  displayName: string;
  description: string;
  content: string;
}

const loadSystemPrompt = (mode: string): string => {
  try {
    const filePath = path.resolve(__dirname, `system.prompt.${mode}.md`);
    return readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.warn(`Failed to load system prompt for ${mode}, using fallback`);
    return `# AgenticForge - ${mode.charAt(0).toUpperCase() + mode.slice(1)} Mode

You are AgenticForge, an AI assistant specialized in ${mode}.

## Response JSON Schema

{{RESPONSE_JSON_SCHEMA}}`;
  }
};

export const SYSTEM_PROMPT_TEMPLATES: Record<string, SystemPromptTemplate> = {
  architect: {
    name: 'architect',
    displayName: 'Architect',
    description:
      'System design, architecture planning, and technical specifications',
    content: loadSystemPrompt('architect'),
  },
  coder: {
    name: 'coder',
    displayName: 'Coder',
    description: 'Code implementation, debugging, and development',
    content: loadSystemPrompt('coder'),
  },
  explain: {
    name: 'explain',
    displayName: 'Explain',
    description: 'Code explanation, teaching, and knowledge sharing',
    content: loadSystemPrompt('explain'),
  },
  debug: {
    name: 'debug',
    displayName: 'Debug',
    description: 'Debugging, troubleshooting, and problem solving',
    content: loadSystemPrompt('debug'),
  },
  orchestrate: {
    name: 'orchestrate',
    displayName: 'Orchestrate',
    description: 'Project management, coordination, and workflow optimization',
    content: loadSystemPrompt('orchestrate'),
  },
  frontend: {
    name: 'frontend',
    displayName: 'FrontEnd',
    description: 'Frontend development, UI/UX, and user interface design',
    content: loadSystemPrompt('frontend'),
  },
  trading: {
    name: 'trading',
    displayName: 'Trading',
    description:
      'Financial analysis, trading strategies, and market insights with Alpha Vantage tools',
    content: loadSystemPrompt('trading'),
  },
};

export const DEFAULT_SYSTEM_PROMPT = 'architect';

export function getSystemPromptTemplate(
  name: string,
): SystemPromptTemplate | null {
  return SYSTEM_PROMPT_TEMPLATES[name] || null;
}

export function getAllSystemPromptTemplates(): SystemPromptTemplate[] {
  return Object.values(SYSTEM_PROMPT_TEMPLATES);
}

export function getSystemPromptNames(): string[] {
  return Object.keys(SYSTEM_PROMPT_TEMPLATES);
}
