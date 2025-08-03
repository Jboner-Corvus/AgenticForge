import { Check, Plus, Edit3, Trash2 } from 'lucide-react';
import { memo, useState } from 'react';
import { useStore } from '../lib/store';
import { LlmLogo, OpenAILogo, AnthropicLogo, GeminiLogo, MistralLogo, GrokLogo, OllamaLogo, OpenRouterLogo } from './icons/LlmLogos';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { LoadingSpinner } from './LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface LlmProviderConfig {
  id: string;
  name: string;
  logo: React.ComponentType<{ className?: string }>;
  models: string[];
}

const MAIN_PROVIDERS: LlmProviderConfig[] = [
  { id: 'openai', name: 'OpenAI', logo: OpenAILogo, models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
  { id: 'anthropic', name: 'Anthropic', logo: AnthropicLogo, models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'] },
  { id: 'gemini', name: 'Google Gemini', logo: GeminiLogo, models: ['gemini-pro', 'gemini-pro-vision'] },
  { id: 'mistral', name: 'Mistral AI', logo: MistralLogo, models: ['mistral-large', 'mistral-medium', 'mistral-small'] },
  { id: 'grok', name: 'Grok', logo: GrokLogo, models: ['grok-1'] },
  { id: 'ollama', name: 'Ollama', logo: OllamaLogo, models: ['llama2', 'mistral', 'codellama'] },
  { id: 'openrouter', name: 'OpenRouter', logo: OpenRouterLogo, models: ['openrouter/auto', 'mistralai/mistral-7b-instruct', 'google/palm-2-codechat-bison'] },
];

export const LlmApiKeyManagementPage = memo(() => {
  const llmApiKeys = useStore((state) => state.llmApiKeys);
  const activeLlmApiKeyIndex = useStore((state) => state.activeLlmApiKeyIndex);
  const addLlmApiKey = useStore((state) => state.addLlmApiKey);
  const removeLlmApiKey = useStore((state) => state.removeLlmApiKey);
  const editLlmApiKey = useStore((state) => state.editLlmApiKey);
  const setActiveLlmApiKey = useStore((state) => state.setActiveLlmApiKey);

  const isAddingLlmApiKey = useStore((state) => state.isAddingLlmApiKey);
  const isRemovingLlmApiKey = useStore((state) => state.isRemovingLlmApiKey);
  const isSettingActiveLlmApiKey = useStore((state) => state.isSettingActiveLlmApiKey);

  // Form state for adding/editing API keys
  const [newApiKey, setNewApiKey] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [baseUrl, setBaseUrl] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleAddApiKey = () => {
    if (!newApiKey.trim() || !selectedProvider) return;
    
    if (editingIndex !== null) {
      // Editing existing key
      editLlmApiKey(editingIndex, selectedProvider, newApiKey, baseUrl || undefined, model || undefined);
    } else {
      // Adding new key
      addLlmApiKey(selectedProvider, newApiKey, baseUrl || undefined, model || undefined);
    }
    
    // Reset form
    setNewApiKey('');
    setSelectedProvider('');
    setBaseUrl('');
    setModel('');
    setIsAdding(false);
    setEditingIndex(null);
  };

  const handleEditKey = (index: number) => {
    const key = llmApiKeys[index];
    setEditingIndex(index);
    setSelectedProvider(key.provider);
    setNewApiKey(key.key);
    setBaseUrl(key.baseUrl || '');
    setModel(key.model || '');
    setIsAdding(true);
  };

  // Group API keys by provider
  const groupedKeys = llmApiKeys.reduce((acc, key) => {
    if (!acc[key.provider]) {
      acc[key.provider] = [];
    }
    acc[key.provider].push(key);
    return acc;
  }, {} as Record<string, typeof llmApiKeys>);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        LLM API Key Management
      </h2>
      
      {/* Provider Cards */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>LLM Providers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {MAIN_PROVIDERS.map((provider) => {
              const Logo = provider.logo;
              const keysForProvider = groupedKeys[provider.id] || [];
              
              return (
                <div 
                  key={provider.id} 
                  className="border rounded-lg p-4 flex flex-col items-center text-center hover:bg-accent transition-colors"
                >
                  <Logo className="h-8 w-8 mb-2" />
                  <span className="text-sm font-medium">{provider.name}</span>
                  {keysForProvider.length > 0 ? (
                    <Badge variant="secondary" className="mt-2">
                      {keysForProvider.length} key{keysForProvider.length > 1 ? 's' : ''}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="mt-2">Not configured</Badge>
                  )}
                  <div className="mt-2 text-xs text-muted-foreground text-center">
                    {provider.models.slice(0, 2).join(', ')}
                    {provider.models.length > 2 ? '...' : ''}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 w-full"
                    onClick={() => {
                      setSelectedProvider(provider.id);
                      setNewApiKey('');
                      setBaseUrl(provider.id === 'openai' ? 'https://api.openai.com/v1' : 
                                 provider.id === 'anthropic' ? 'https://api.anthropic.com' :
                                 provider.id === 'gemini' ? 'https://generativelanguage.googleapis.com' :
                                 provider.id === 'mistral' ? 'https://api.mistral.ai/v1' :
                                 provider.id === 'grok' ? 'https://api.x.ai/v1' :
                                 provider.id === 'ollama' ? 'http://localhost:11434/v1' :
                                 provider.id === 'openrouter' ? 'https://openrouter.ai/api/v1' : '');
                      setModel(provider.models[0] || '');
                      setIsAdding(true);
                      setEditingIndex(null);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Key
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* Add/Edit API Key Form */}
      {(isAdding) && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {editingIndex !== null ? `Edit API Key for ${MAIN_PROVIDERS.find(p => p.id === selectedProvider)?.name || selectedProvider}` : 'Add New API Key'}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setIsAdding(false);
                  setEditingIndex(null);
                  setNewApiKey('');
                  setSelectedProvider('');
                  setBaseUrl('');
                  setModel('');
                }}
              >
                Cancel
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!editingIndex && (
                <div>
                  <label className="text-sm font-medium mb-1 block">Provider</label>
                  <select
                    value={selectedProvider}
                    onChange={(e) => {
                      setSelectedProvider(e.target.value);
                      // Set default values based on provider
                      const provider = MAIN_PROVIDERS.find(p => p.id === e.target.value);
                      if (provider) {
                        setModel(provider.models[0] || '');
                        setBaseUrl(
                          e.target.value === 'openai' ? 'https://api.openai.com/v1' : 
                          e.target.value === 'anthropic' ? 'https://api.anthropic.com' :
                          e.target.value === 'gemini' ? 'https://generativelanguage.googleapis.com' :
                          e.target.value === 'mistral' ? 'https://api.mistral.ai/v1' :
                          e.target.value === 'grok' ? 'https://api.x.ai/v1' :
                          e.target.value === 'ollama' ? 'http://localhost:11434/v1' :
                          e.target.value === 'openrouter' ? 'https://openrouter.ai/api/v1' : '');
                      }
                    }}
                    className="w-full p-2 border rounded-md bg-background"
                  >
                    <option value="">Select a provider</option>
                    {MAIN_PROVIDERS.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium mb-1 block">API Key</label>
                <Input
                  placeholder="Enter API key"
                  type="password"
                  value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Base URL</label>
                <Input
                  placeholder="Enter base URL"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Model</label>
                <Input
                  placeholder="Enter model name"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                />
              </div>
              
              {selectedProvider && (
                <div>
                  <label className="text-sm font-medium mb-1 block">Available Models</label>
                  <div className="flex flex-wrap gap-2">
                    {MAIN_PROVIDERS.find(p => p.id === selectedProvider)?.models.map((model) => (
                      <Badge 
                        key={model} 
                        variant="secondary" 
                        className="cursor-pointer"
                        onClick={() => setModel(model)}
                      >
                        {model}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end">
                <Button 
                  onClick={handleAddApiKey} 
                  disabled={isAddingLlmApiKey || !newApiKey.trim() || !selectedProvider}
                >
                  {isAddingLlmApiKey ? <LoadingSpinner className="h-4 w-4 mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                  {editingIndex !== null ? 'Update API Key' : 'Add API Key'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Add/Edit API Key Form */}
      {(isAdding) && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {editingIndex !== null ? `Edit API Key for ${MAIN_PROVIDERS.find(p => p.id === selectedProvider)?.name || selectedProvider}` : 'Add New API Key'}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setIsAdding(false);
                  setEditingIndex(null);
                  setNewApiKey('');
                  setSelectedProvider('');
                  setBaseUrl('');
                  setModel('');
                }}
              >
                Cancel
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!editingIndex && (
                <div>
                  <label className="text-sm font-medium mb-1 block">Provider</label>
                  <select
                    value={selectedProvider}
                    onChange={(e) => {
                      setSelectedProvider(e.target.value);
                      // Set default values based on provider
                      const provider = MAIN_PROVIDERS.find(p => p.id === e.target.value);
                      if (provider) {
                        setModel(provider.models[0] || '');
                        setBaseUrl(
                          e.target.value === 'openai' ? 'https://api.openai.com/v1' : 
                          e.target.value === 'anthropic' ? 'https://api.anthropic.com' :
                          e.target.value === 'gemini' ? 'https://generativelanguage.googleapis.com' :
                          e.target.value === 'mistral' ? 'https://api.mistral.ai/v1' :
                          e.target.value === 'grok' ? 'https://api.x.ai/v1' :
                          e.target.value === 'ollama' ? 'http://localhost:11434/v1' :
                          e.target.value === 'openrouter' ? 'https://openrouter.ai/api/v1' : ''
                        );
                      }
                    }}
                    className="w-full p-2 border rounded-md bg-background"
                  >
                    <option value="">Select a provider</option>
                    {MAIN_PROVIDERS.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium mb-1 block">API Key</label>
                <Input
                  placeholder="Enter API key"
                  type="password"
                  value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Base URL</label>
                <Input
                  placeholder="Enter base URL"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Model</label>
                <Input
                  placeholder="Enter model name"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                />
              </div>
              
              {selectedProvider && (
                <div>
                  <label className="text-sm font-medium mb-1 block">Available Models</label>
                  <div className="flex flex-wrap gap-2">
                    {MAIN_PROVIDERS.find(p => p.id === selectedProvider)?.models.map((model) => (
                      <Badge 
                        key={model} 
                        variant="secondary" 
                        className="cursor-pointer"
                        onClick={() => setModel(model)}
                      >
                        {model}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end">
                <Button 
                  onClick={handleAddApiKey} 
                  disabled={isAddingLlmApiKey || !newApiKey.trim() || !selectedProvider}
                >
                  {isAddingLlmApiKey ? <LoadingSpinner className="h-4 w-4 mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                  {editingIndex !== null ? 'Update API Key' : 'Add API Key'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Existing API Keys List */}
      <Card>
        <CardHeader>
          <CardTitle>Your LLM API Keys</CardTitle>
        </CardHeader>
        <CardContent>
          {llmApiKeys.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">
              No LLM API keys added yet.
            </p>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedKeys).map(([providerId, keys]) => {
                const providerConfig = MAIN_PROVIDERS.find(p => p.id === providerId);
                const Logo = providerConfig?.logo || (() => <LlmLogo provider={providerConfig?.id || providerId} className="h-5 w-5 mr-2" />);
                
                return (
                  <div key={providerId} className="border rounded-lg">
                    <div className="flex items-center p-3 bg-secondary rounded-t-lg">
                      <Logo className="h-5 w-5 mr-2" />
                      <span className="font-medium">{providerConfig?.name || providerId}</span>
                      <span className="ml-2 text-sm text-muted-foreground">
                        ({keys.length} key{keys.length > 1 ? 's' : ''})
                      </span>
                    </div>
                    
                    <div className="p-2 space-y-2">
                      {keys.map((llmKey, keyIndex) => {
                        const globalIndex = llmApiKeys.findIndex(k => 
                          k.provider === llmKey.provider && 
                          k.key === llmKey.key
                        );
                        
                        return (
                          <div 
                            key={keyIndex} 
                            className="flex items-center justify-between p-3 border rounded-md hover:bg-accent transition-colors"
                          >
                            <div className="flex items-center">
                              <span className="font-mono text-sm truncate max-w-[200px]">
                                {llmKey.key.substring(0, 8)}...{llmKey.key.substring(llmKey.key.length - 8)}
                              </span>
                              {activeLlmApiKeyIndex === globalIndex && (
                                <Badge variant="secondary" className="ml-2">Active</Badge>
                              )}
                              <div className="ml-2 text-xs text-muted-foreground">
                                {llmKey.model && `Model: ${llmKey.model}`}
                                {llmKey.baseUrl && ` | URL: ${llmKey.baseUrl}`}
                              </div>
                            </div>
                            
                            <div className="flex space-x-1">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleEditKey(globalIndex)}
                              >
                                <Edit3 className="h-4 w-4" />
                                <span className="ml-1 hidden sm:inline">Edit</span>
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => setActiveLlmApiKey(globalIndex)} 
                                disabled={isSettingActiveLlmApiKey || isRemovingLlmApiKey || activeLlmApiKeyIndex === globalIndex}
                              >
                                {isSettingActiveLlmApiKey && activeLlmApiKeyIndex === globalIndex ? (
                                  <LoadingSpinner className="h-4 w-4" />
                                ) : (
                                  <Edit3 className="h-4 w-4" />
                                )}
                                <span className="ml-1 hidden sm:inline">Set Active</span>
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => removeLlmApiKey(globalIndex)} 
                                disabled={isSettingActiveLlmApiKey || isRemovingLlmApiKey}
                              >
                                {isRemovingLlmApiKey ? (
                                  <LoadingSpinner className="h-4 w-4" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                                <span className="ml-1 hidden sm:inline">Remove</span>
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});