import { Check, X } from 'lucide-react';
import { memo, useState } from 'react';
import { useStore } from '../lib/store';
import { LlmLogo, OpenAILogo, GrokLogo, Kimika2Logo, DeepseekLogo, HuggingFaceLogo, MixtralLogo, OllamaLogo, LMStudioLogo } from './icons/LlmLogos';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { LoadingSpinner } from './LoadingSpinner';


export const LlmApiKeyManagementPage = memo(() => {
  const llmApiKeys = useStore((state) => state.llmApiKeys);
  const activeLlmApiKeyIndex = useStore((state) => state.activeLlmApiKeyIndex);
  const addLlmApiKey = useStore((state) => state.addLlmApiKey);
  const removeLlmApiKey = useStore((state) => state.removeLlmApiKey);
  const setActiveLlmApiKey = useStore((state) => state.setActiveLlmApiKey);

  const isAddingLlmApiKey = useStore((state) => state.isAddingLlmApiKey);
  const isRemovingLlmApiKey = useStore((state) => state.isRemovingLlmApiKey);
  const isSettingActiveLlmApiKey = useStore((state) => state.isSettingActiveLlmApiKey);

  const [openAiApiKey, setOpenAiApiKey] = useState('');
  const [grokApiKey, setGrokApiKey] = useState('');
  const [kimika2ApiKey, setKimika2ApiKey] = useState('');
  const [deepseekApiKey, setDeepseekApiKey] = useState('');
  const [huggingFaceApiKey, setHuggingFaceApiKey] = useState('');
  const [mixtralApiKey, setMixtralApiKey] = useState('');
  const [ollamaApiKey, setOllamaApiKey] = useState('');
  const [lmStudioApiKey, setLmStudioApiKey] = useState('');

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        LLM API Key Management
      </h2>
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <OpenAILogo className="h-6 w-6" />
          <Input
            id="openai-api-key"
            placeholder="sk-..."
            type="password"
            value={openAiApiKey}
            onChange={(e) => setOpenAiApiKey(e.target.value)}
            aria-label="OpenAI API Key Input"
          />
          <Button onClick={() => { addLlmApiKey('openai', openAiApiKey); setOpenAiApiKey(''); }} aria-label="Add OpenAI API Key" disabled={isAddingLlmApiKey}>
            {isAddingLlmApiKey ? <LoadingSpinner className="h-4 w-4" /> : <Check className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <GrokLogo className="h-6 w-6" />
          <Input
            id="grok-api-key"
            placeholder="grok-..."
            type="password"
            value={grokApiKey}
            onChange={(e) => setGrokApiKey(e.target.value)}
            aria-label="Grok API Key Input"
          />
          <Button onClick={() => { addLlmApiKey('grok', grokApiKey); setGrokApiKey(''); }} aria-label="Add Grok API Key" disabled={isAddingLlmApiKey}>
            {isAddingLlmApiKey ? <LoadingSpinner className="h-4 w-4" /> : <Check className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Kimika2Logo className="h-6 w-6" />
          <Input
            id="kimika2-api-key"
            placeholder="kimika2-..."
            type="password"
            value={kimika2ApiKey}
            onChange={(e) => setKimika2ApiKey(e.target.value)}
            aria-label="Kimika2 API Key Input"
          />
          <Button onClick={() => { addLlmApiKey('kimika2', kimika2ApiKey); setKimika2ApiKey(''); }} aria-label="Add Kimika2 API Key" disabled={isAddingLlmApiKey}>
            {isAddingLlmApiKey ? <LoadingSpinner className="h-4 w-4" /> : <Check className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <DeepseekLogo className="h-6 w-6" />
          <Input
            id="deepseek-api-key"
            placeholder="deepseek-..."
            type="password"
            value={deepseekApiKey}
            onChange={(e) => setDeepseekApiKey(e.target.value)}
            aria-label="Deepseek API Key Input"
          />
          <Button onClick={() => { addLlmApiKey('deepseek', deepseekApiKey); setDeepseekApiKey(''); }} aria-label="Add Deepseek API Key" disabled={isAddingLlmApiKey}>
            {isAddingLlmApiKey ? <LoadingSpinner className="h-4 w-4" /> : <Check className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <HuggingFaceLogo className="h-6 w-6" />
          <Input
            id="huggingface-api-key"
            placeholder="hf_..."
            type="password"
            value={huggingFaceApiKey}
            onChange={(e) => setHuggingFaceApiKey(e.target.value)}
            aria-label="HuggingFace API Key Input"
          />
          <Button onClick={() => { addLlmApiKey('huggingface', huggingFaceApiKey); setHuggingFaceApiKey(''); }} aria-label="Add HuggingFace API Key" disabled={isAddingLlmApiKey}>
            {isAddingLlmApiKey ? <LoadingSpinner className="h-4 w-4" /> : <Check className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <MixtralLogo className="h-6 w-6" />
          <Input
            id="mixtral-api-key"
            placeholder="mix_..."
            type="password"
            value={mixtralApiKey}
            onChange={(e) => setMixtralApiKey(e.target.value)}
            aria-label="Mixtral API Key Input"
          />
          <Button onClick={() => { addLlmApiKey('mixtral', mixtralApiKey); setMixtralApiKey(''); }} aria-label="Add Mixtral API Key" disabled={isAddingLlmApiKey}>
            {isAddingLlmApiKey ? <LoadingSpinner className="h-4 w-4" /> : <Check className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <OllamaLogo className="h-6 w-6" />
          <Input
            id="ollama-api-key"
            placeholder="ollama-..."
            type="password"
            value={ollamaApiKey}
            onChange={(e) => setOllamaApiKey(e.target.value)}
            aria-label="Ollama API Key Input"
          />
          <Button onClick={() => { addLlmApiKey('ollama', ollamaApiKey); setOllamaApiKey(''); }} aria-label="Add Ollama API Key" disabled={isAddingLlmApiKey}>
            {isAddingLlmApiKey ? <LoadingSpinner className="h-4 w-4" /> : <Check className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <LMStudioLogo className="h-6 w-6" />
          <Input
            id="lmstudio-api-key"
            placeholder="lmstudio-..."
            type="password"
            value={lmStudioApiKey}
            onChange={(e) => setLmStudioApiKey(e.target.value)}
            aria-label="LM Studio API Key Input"
          />
          <Button onClick={() => { addLlmApiKey('lmstudio', lmStudioApiKey); setLmStudioApiKey(''); }} aria-label="Add LM Studio API Key" disabled={isAddingLlmApiKey}>
            {isAddingLlmApiKey ? <LoadingSpinner className="h-4 w-4" /> : <Check className="h-4 w-4" />}
          </Button>
        </div>

      </div>
      <div className="space-y-2 mt-6">
        <h3 className="text-lg font-semibold mb-4">Your API Keys</h3>
        {llmApiKeys.length === 0 ? (
          <p className="text-muted-foreground text-sm">No LLM API keys added yet.</p>
        ) : (
          llmApiKeys.map((llmKey, index) => (
            <div key={index} className="flex items-center justify-between p-2 border border-border rounded-md">
              <span className="text-sm truncate flex items-center">
                <LlmLogo provider={llmKey.provider} className="mr-2 h-5 w-5" />
                {`${llmKey.provider}: ${llmKey.key.substring(0, 5)}...${llmKey.key.substring(llmKey.key.length - 5)}`}
                {activeLlmApiKeyIndex === index && <Badge variant="secondary" className="ml-2">Active</Badge>}
              </span>
              <div className="flex space-x-1">
                <Button size="icon" variant="ghost" onClick={() => setActiveLlmApiKey(index)} aria-label="Set as active" disabled={isSettingActiveLlmApiKey || isRemovingLlmApiKey}>
                  {isSettingActiveLlmApiKey ? <LoadingSpinner className="h-4 w-4" /> : <LlmLogo provider={llmKey.provider} className="h-4 w-4" />}
                </Button>
                <Button size="icon" variant="ghost" onClick={() => removeLlmApiKey(index)} aria-label="Remove API Key" disabled={isSettingActiveLlmApiKey || isRemovingLlmApiKey}>
                  {isRemovingLlmApiKey ? <LoadingSpinner className="h-4 w-4" /> : <X className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
});
