import { GripVertical, Plus, Trash2, Save, Info } from 'lucide-react';
import { memo, useState, useEffect } from 'react';
import { useStore } from '../lib/store';
import { OpenAILogo, AnthropicLogo, GeminiLogo, MistralLogo, GrokLogo, OllamaLogo, OpenRouterLogo } from './icons/LlmLogos';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { LoadingSpinner } from './LoadingSpinner';
import { Card, CardContent, CardHeader } from './ui/card';
import { useToast } from '../lib/hooks/useToast';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { motion } from 'framer-motion';

interface LlmProviderConfig {
  id: string;
  name: string;
  logo: React.ComponentType<{ className?: string }>;
  models: string[];
  baseUrl?: string;
}

const INITIAL_PROVIDERS: LlmProviderConfig[] = [
  { id: 'openai', name: 'OpenAI', logo: OpenAILogo, models: ['gpt-4.5', 'gpt-3'], baseUrl: 'https://api.openai.com/v1' },
  { id: 'anthropic', name: 'Anthropic', logo: AnthropicLogo, models: ['claude-sonnet-4'], baseUrl: 'https://api.anthropic.com' },
  { id: 'gemini', name: 'Google Gemini', logo: GeminiLogo, models: ['gemini-2.5-flash', 'gemini-2.5-pro'], baseUrl: 'https://generativelanguage.googleapis.com' },
  { id: 'mistral', name: 'Mistral AI', logo: MistralLogo, models: ['mistral-large', 'mistral-medium', 'mistral-small'], baseUrl: 'https://api.mistral.ai/v1' },
  { id: 'grok', name: 'Grok', logo: GrokLogo, models: ['grok3', 'grok4', 'grok4heavy'], baseUrl: 'https://api.x.ai/v1' },
  { id: 'ollama', name: 'Ollama', logo: OllamaLogo, models: ['(URL and API key required - uses Bearer authentication)'], baseUrl: 'http://localhost:11434/v1' },
  { id: 'openrouter', name: 'OpenRouter', logo: OpenRouterLogo, models: ['moonshotai/kimi-k2:free', 'qwen/qwen3-coder:free'], baseUrl: 'https://openrouter.ai/api/v1' },
];

const PROVIDER_COLORS: Record<string, { bg: string; header: string; badge: string; hover: string }> = {
  openai: { bg: 'bg-gradient-to-br from-purple-50 to-blue-50', header: 'bg-gradient-to-r from-purple-500 to-blue-500', badge: 'bg-purple-100 text-purple-800', hover: 'hover:from-purple-500 hover:to-blue-600' },
  anthropic: { bg: 'bg-gradient-to-br from-orange-50 to-red-50', header: 'bg-gradient-to-r from-orange-500 to-red-500', badge: 'bg-orange-100 text-orange-800', hover: 'hover:from-orange-500 hover:to-red-600' },
  gemini: { bg: 'bg-gradient-to-br from-blue-50 to-green-50', header: 'bg-gradient-to-r from-blue-500 to-green-500', badge: 'bg-blue-100 text-blue-800', hover: 'hover:from-blue-500 hover:to-green-600' },
  mistral: { bg: 'bg-gradient-to-br from-amber-50 to-yellow-50', header: 'bg-gradient-to-r from-amber-500 to-yellow-500', badge: 'bg-amber-100 text-amber-800', hover: 'hover:from-amber-500 hover:to-yellow-600' },
  grok: { bg: 'bg-gradient-to-br from-gray-50 to-slate-50', header: 'bg-gradient-to-r from-gray-500 to-slate-500', badge: 'bg-gray-100 text-gray-800', hover: 'hover:from-gray-500 hover:to-slate-600' },
  ollama: { bg: 'bg-gradient-to-br from-emerald-50 to-teal-50', header: 'bg-gradient-to-r from-emerald-500 to-teal-500', badge: 'bg-emerald-100 text-emerald-800', hover: 'hover:from-emerald-500 hover:to-teal-600' },
  openrouter: { bg: 'bg-gradient-to-br from-indigo-50 to-violet-50', header: 'bg-gradient-to-r from-indigo-500 to-violet-500', badge: 'bg-indigo-100 text-indigo-800', hover: 'hover:from-indigo-500 hover:to-violet-600' },
};

interface SortableApiKeyItemProps {
    id: string;
    apiKey: string;
    index: number;
    onKeyChange: (index: number, value: string) => void;
    onRemove: (index: number) => void;
}

const SortableApiKeyItem: React.FC<SortableApiKeyItemProps> = ({ id, apiKey, index, onKeyChange, onRemove }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
  };

  return (
    <motion.div 
      ref={setNodeRef} 
      style={style} 
      {...attributes}
      className="flex items-center gap-2 bg-background p-2 rounded-md shadow-sm"
    >
      <Button 
        variant="ghost" 
        size="icon" 
        {...listeners} 
        className="cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </Button>
      <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
      <Input
        id={`api-key-${index}`}
        name={`api-key-${index}`}
        type="password"
        placeholder="Enter API Token"
        value={apiKey}
        onChange={(e) => onKeyChange(index, e.target.value)}
        className="flex-1"
      />
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => onRemove(index)}
      >
        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500 transition-colors" />
      </Button>
    </motion.div>
  );
};

const ProviderCard = ({ provider, dragHandleProps }: { provider: LlmProviderConfig, dragHandleProps?: Record<string, unknown> }) => {
  const { toast } = useToast();
  const llmApiKeys = useStore((state) => state.llmApiKeys);
  const addLlmApiKey = useStore((state) => state.addLlmApiKey);
  const removeLlmApiKey = useStore((state) => state.removeLlmApiKey);
  const isAddingLlmApiKey = useStore((state) => state.isAddingLlmApiKey);

  const [apiKeys, setApiKeys] = useState<{ id: string; key: string }[]>([]);
  const colors = PROVIDER_COLORS[provider.id] || PROVIDER_COLORS.openai;

  useEffect(() => {
    const existingKeys = llmApiKeys
      .filter(k => k.provider === provider.id)
      .map((k, index) => ({ id: `key-${index}-${k.key}`, key: k.key }));
    if (existingKeys.length > 0) {
      setApiKeys(existingKeys);
    } else {
      setApiKeys([{ id: `key-new-0`, key: '' }]);
    }
  }, [llmApiKeys, provider.id]);

  const handleAddInput = () => {
    setApiKeys([...apiKeys, { id: `key-new-${apiKeys.length}`, key: '' }]);
  };

  const handleRemoveInput = async (index: number) => {
    const keyToRemove = apiKeys[index].key;
    const globalIndex = llmApiKeys.findIndex(k => k.key === keyToRemove && k.provider === provider.id);
    if (globalIndex !== -1) {
      await removeLlmApiKey(globalIndex);
    }
    const newKeys = apiKeys.filter((_, i) => i !== index);
    setApiKeys(newKeys);
  };

  const handleKeyChange = (index: number, value: string) => {
    const newKeys = [...apiKeys];
    newKeys[index].key = value;
    setApiKeys(newKeys);
  };

  const handleSaveKeys = async () => {
    const existingKeys = llmApiKeys.filter(k => k.provider === provider.id);
    
    for (const key of existingKeys) {
      const globalIndex = llmApiKeys.findIndex(k => k.key === key.key && k.provider === provider.id);
      if (globalIndex !== -1) {
        await removeLlmApiKey(globalIndex);
      }
    }

    for (const apiKey of apiKeys) {
      if (apiKey.key.trim()) {
        await addLlmApiKey(provider.id, apiKey.key, provider.baseUrl, provider.models[0]);
      }
    }
    toast({ title: "Success", description: `API keys for ${provider.name} saved.` });
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setApiKeys((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const Logo = provider.logo;

  return (
    <Card className={`overflow-hidden shadow-lg ${colors.bg} transition-all duration-300`}>
      <CardHeader className={`${colors.header} p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              {...dragHandleProps} 
              className="cursor-grab active:cursor-grabbing mr-2"
            >
              <GripVertical className="h-5 w-5 text-white" />
            </Button>
            <Logo className="h-8 w-8 mr-3 text-white" />
            <span className="text-xl font-bold text-white">{provider.name}</span>
          </div>
          <Button 
            size="sm" 
            onClick={handleAddInput} 
            variant="secondary"
            className="bg-white/20 hover:bg-white/30 text-white border-white/30"
          >
            <Plus className="h-4 w-4 mr-1" /> Add Token
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block flex items-center">
            API Tokens (Drag to reorder)
            <Info className="h-4 w-4 ml-1 text-muted-foreground" />
          </label>
          <DndContext id={`api-tokens-dnd-${provider.id}`} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext id={`api-tokens-sortable-${provider.id}`} items={apiKeys.map(k => k.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {apiKeys.map((apiKey, index) => (
                  <SortableApiKeyItem
                    key={apiKey.id}
                    id={apiKey.id}
                    apiKey={apiKey.key}
                    index={index}
                    onKeyChange={handleKeyChange}
                    onRemove={handleRemoveInput}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block flex items-center">
            Available Models
            <Info className="h-4 w-4 ml-1 text-muted-foreground" />
          </label>
          <div id={`available-models-${provider.id}`} className="flex flex-wrap gap-2">
            {provider.models.map(model => (
              <motion.div
                key={model}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Badge className={`${colors.badge} px-3 py-1`}>
                  {model}
                </Badge>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="flex justify-end">
          <Button 
            onClick={handleSaveKeys} 
            disabled={isAddingLlmApiKey}
            className={`${colors.hover} text-white transition-all duration-300`}
          >
            {isAddingLlmApiKey ? <LoadingSpinner className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
            Save {provider.name} Keys
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const SortableProviderCard = ({ provider }: { provider: LlmProviderConfig }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: provider.id });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
    >
      <ProviderCard provider={provider} dragHandleProps={listeners} />
    </motion.div>
  );
};

export const LlmApiKeyManagementPage = memo(() => {
  const [providers, setProviders] = useState<LlmProviderConfig[]>(INITIAL_PROVIDERS);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setProviders((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
    <motion.div 
      className="p-6 max-w-6xl mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <h2 className="text-lg font-semibold text-blue-800 mb-2">Authentication Setup</h2>
        <p className="text-sm text-blue-700">
          To use the agent, you need to provide a valid authentication token. 
          This can be done in two ways:
        </p>
        <ol className="list-decimal list-inside mt-2 text-sm text-blue-700 space-y-1">
          <li>Connect through OAuth providers (GitHub, Google, Twitter) in the OAuth Management section</li>
          <li>Manually enter your bearer token below for any provider</li>
        </ol>
        <p className="mt-2 text-sm text-blue-700">
          For manual setup, enter your bearer token in the appropriate field below and click "Save Keys".
        </p>
      </motion.div>
      
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={providers.map(p => p.id)} strategy={verticalListSortingStrategy}>
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            {providers.map((provider) => (
              <SortableProviderCard key={provider.id} provider={provider} />
            ))}
          </motion.div>
        </SortableContext>
      </DndContext>
    </motion.div>
  );
});