import React from 'react';

interface LlmLogoProps {
  provider: string;
  className?: string;
}

export const GoogleLogo: React.FC<{ className?: string }> = ({ className }) => (
  <span className={className}>Google</span>
);

export const GithubLogo: React.FC<{ className?: string }> = ({ className }) => (
  <span className={className}>GitHub</span>
);

export const DiscordLogo: React.FC<{ className?: string }> = ({ className }) => (
  <span className={className}>Discord</span>
);

export const TelegramLogo: React.FC<{ className?: string }> = ({ className }) => (
  <span className={className}>Telegram</span>
);

export const OpenAILogo: React.FC<{ className?: string }> = ({ className }) => (
  <span className={className}>OpenAI</span>
);

export const AnthropicLogo: React.FC<{ className?: string }> = ({ className }) => (
  <span className={className}>Anthropic</span>
);

export const GeminiLogo: React.FC<{ className?: string }> = ({ className }) => (
  <span className={className}>Gemini</span>
);

export const MistralLogo: React.FC<{ className?: string }> = ({ className }) => (
  <span className={className}>Mistral</span>
);

export const GrokLogo: React.FC<{ className?: string }> = ({ className }) => (
  <span className={className}>Grok</span>
);

export const OllamaLogo: React.FC<{ className?: string }> = ({ className }) => (
  <span className={className}>Ollama</span>
);

export const OpenRouterLogo: React.FC<{ className?: string }> = ({ className }) => (
  <span className={className}>OpenRouter</span>
);

export const QwenLogo: React.FC<{ className?: string }> = ({ className }) => (
  <span className={className}>Qwen</span>
);

export const LlmLogo: React.FC<LlmLogoProps> = ({ provider, className }) => {
  switch (provider) {
    case 'openai':
      return <OpenAILogo className={className} />;
    case 'anthropic':
      return <AnthropicLogo className={className} />;
    case 'gemini':
      return <GeminiLogo className={className} />;
    case 'mistral':
      return <MistralLogo className={className} />;
    case 'grok':
      return <GrokLogo className={className} />;
    case 'ollama':
      return <OllamaLogo className={className} />;
    case 'openrouter':
      return <OpenRouterLogo className={className} />;
    case 'qwen':
      return <QwenLogo className={className} />;
    default:
      return <span className={className}>{provider}</span>;
  }
};