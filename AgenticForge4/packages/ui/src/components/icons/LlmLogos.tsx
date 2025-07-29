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

export const GrokLogo: React.FC<{ className?: string }> = ({ className }) => (
  <span className={className}>Grok</span>
);

export const Kimika2Logo: React.FC<{ className?: string }> = ({ className }) => (
  <span className={className}>Kimika2</span>
);

export const DeepseekLogo: React.FC<{ className?: string }> = ({ className }) => (
  <span className={className}>Deepseek</span>
);

export const HuggingFaceLogo: React.FC<{ className?: string }> = ({ className }) => (
  <span className={className}>HuggingFace</span>
);

export const MixtralLogo: React.FC<{ className?: string }> = ({ className }) => (
  <span className={className}>Mixtral</span>
);

export const OllamaLogo: React.FC<{ className?: string }> = ({ className }) => (
  <span className={className}>Ollama</span>
);

export const LMStudioLogo: React.FC<{ className?: string }> = ({ className }) => (
  <span className={className}>LM Studio</span>
);

export const LlmLogo: React.FC<LlmLogoProps> = ({ provider, className }) => {
  switch (provider) {
    case 'openai':
      return <OpenAILogo className={className} />;
    case 'grok':
      return <GrokLogo className={className} />;
    case 'kimika2':
      return <Kimika2Logo className={className} />;
    case 'deepseek':
      return <DeepseekLogo className={className} />;
    case 'huggingface':
      return <HuggingFaceLogo className={className} />;
    case 'mixtral':
      return <MixtralLogo className={className} />;
    case 'ollama':
      return <OllamaLogo className={className} />;
    case 'lmstudio':
      return <LMStudioLogo className={className} />;
    default:
      return <span className={className}>{provider}</span>;
  }
};
