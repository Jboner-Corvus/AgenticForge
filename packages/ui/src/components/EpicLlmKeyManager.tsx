import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Key, Plus, Trash2, Eye, EyeOff, TestTube, RefreshCw, Database, 
  Upload, Download, AlertTriangle, CheckCircle, 
  Search, Rocket, Globe, Lock, Unlock
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { useLLMKeysStore, LLMKey } from '../store/llmKeysStore';
import { llmKeysApi } from '../lib/api/llmKeysApi';
import { LoadingSpinner } from './LoadingSpinner';
import { OpenAILogo, GeminiLogo } from './icons/LlmLogos';
import { OpenRouterLogo } from './icons/LlmLogos/OpenRouterLogo';

// PROVIDER LOGOS MAPPING
const PROVIDER_LOGOS: Record<string, React.ComponentType<{ className?: string }>> = {
  openai: OpenAILogo,
  anthropic: () => <div className="text-orange-400 font-bold">A</div>, // Fallback
  google: GeminiLogo,
  cohere: () => <div className="text-blue-400 font-bold">C</div>, // Fallback
  mistral: () => <div className="text-red-400 font-bold">M</div>, // Fallback
  openrouter: OpenRouterLogo
};

// EPIC KEY STATS COMPONENT
const EpicKeyStats: React.FC = () => {
  const { stats, isLoading, isSyncing } = useLLMKeysStore();
  // const keys = useLLMKeysStore(state => state.keys); // Unused for now
  
  const statItems = [
    { label: 'TOTAL KEYS', value: stats.totalKeys, icon: Key, color: 'text-cyan-400' },
    { label: 'ACTIVE', value: stats.activeKeys, icon: CheckCircle, color: 'text-green-400' },
    { label: 'PROVIDERS', value: stats.providersCount, icon: Globe, color: 'text-purple-400' },
    { label: 'USAGE', value: stats.totalUsage, icon: Rocket, color: 'text-yellow-400' }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {statItems.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-gray-700 hover:border-cyan-500/50 transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>
                {isLoading ? '...' : stat.value.toLocaleString()}
              </p>
            </div>
            <stat.icon className={`h-8 w-8 ${stat.color} opacity-70`} />
          </div>
          {isSyncing && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="mt-2"
            >
              <RefreshCw className="h-4 w-4 text-blue-400" />
            </motion.div>
          )}
        </motion.div>
      ))}
    </div>
  );
};

// REDIS CONTROL PANEL
const RedisControlPanel: React.FC = () => {
  const { syncWithRedis, importKeysFromRedis, exportKeysToRedis, isSyncing, error } = useLLMKeysStore();
  const [redisInfo, setRedisInfo] = useState<{ connected: boolean; keyCount: number; memory: string } | null>(null);
  const [scanning, setScanning] = useState(false);

  const fetchRedisInfo = async () => {
    try {
      const info = await llmKeysApi.getRedisInfo();
      setRedisInfo(info);
    } catch (error) {
      console.error('Failed to fetch Redis info:', error);
    }
  };

  useEffect(() => {
    fetchRedisInfo();
  }, []);

  const handleScanRedis = async () => {
    setScanning(true);
    try {
      const keys = await llmKeysApi.scanRedisKeys('llm:keys:*');
      console.log('Found Redis keys:', keys);
    } catch (error) {
      console.error('Failed to scan Redis:', error);
    } finally {
      setScanning(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-gray-700 mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-cyan-400">
          <Database className="h-5 w-5" />
          Redis Integration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className={`w-3 h-3 rounded-full ${redisInfo?.connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
            <span className="text-sm text-gray-300">
              {redisInfo?.connected ? `Connected • ${redisInfo.keyCount} keys` : 'Disconnected'}
            </span>
            {redisInfo?.memory && (
              <Badge variant="outline" className="text-gray-400 border-gray-600">
                Memory: {redisInfo.memory}
              </Badge>
            )}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchRedisInfo}
            className="border-gray-600 hover:border-cyan-500/50"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleScanRedis}
            disabled={scanning}
            className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
          >
            {scanning ? <LoadingSpinner className="h-4 w-4 mr-2" /> : <Search className="h-4 w-4 mr-2" />}
            Scan
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={syncWithRedis}
            disabled={isSyncing}
            className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
          >
            {isSyncing ? <LoadingSpinner className="h-4 w-4 mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Sync
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={importKeysFromRedis}
            disabled={isSyncing}
            className="border-green-500/50 text-green-400 hover:bg-green-500/10"
          >
            <Download className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportKeysToRedis}
            disabled={isSyncing}
            className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10"
          >
            <Upload className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg flex items-center gap-2"
          >
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <span className="text-red-300 text-sm">{error}</span>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

// ADD KEY MODAL
const AddKeyModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { providers, addKey, isLoading } = useLLMKeysStore();
  const [formData, setFormData] = useState({
    providerId: '',
    keyName: '',
    keyValue: '',
    environment: 'development' as const,
    description: '',
    tags: [] as string[],
    isActive: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const provider = providers.find(p => p.id === formData.providerId);
    if (!provider) return;

    try {
      await addKey({
        providerId: formData.providerId,
        providerName: provider.name,
        keyName: formData.keyName,
        keyValue: formData.keyValue,
        isEncrypted: false,
        isActive: formData.isActive,
        metadata: {
          environment: formData.environment,
          tags: formData.tags,
          description: formData.description
        }
      });
      onClose();
      setFormData({
        providerId: '',
        keyName: '',
        keyValue: '',
        environment: 'development',
        description: '',
        tags: [],
        isActive: true
      });
    } catch (error) {
      console.error('Failed to add key:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700 p-6 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-cyan-400 flex items-center gap-2">
            <Key className="h-5 w-5" />
            Add New Key
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Provider</label>
            <Select value={formData.providerId} onValueChange={(value) => setFormData({...formData, providerId: value})}>
              <SelectTrigger className="bg-gray-800 border-gray-600">
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                {providers.map(provider => (
                  <SelectItem key={provider.id} value={provider.id}>
                    {provider.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Key Name</label>
            <Input
              value={formData.keyName}
              onChange={(e) => setFormData({...formData, keyName: e.target.value})}
              placeholder="e.g., Production OpenAI"
              className="bg-gray-800 border-gray-600"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">API Key</label>
            <Input
              type="password"
              value={formData.keyValue}
              onChange={(e) => setFormData({...formData, keyValue: e.target.value})}
              placeholder="Enter your API key"
              className="bg-gray-800 border-gray-600"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Environment</label>
            <Select value={formData.environment} onValueChange={(value) => setFormData({...formData, environment: value as 'development'})}>
              <SelectTrigger className="bg-gray-800 border-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="development">Development</SelectItem>
                <SelectItem value="staging">Staging</SelectItem>
                <SelectItem value="production">Production</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Optional description"
              className="bg-gray-800 border-gray-600"
              rows={2}
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
              />
              Active
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="flex-1 bg-cyan-600 hover:bg-cyan-500"
            >
              {isLoading ? <LoadingSpinner className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Add Key
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// KEY CARD COMPONENT
const KeyCard: React.FC<{ keyData: LLMKey }> = ({ keyData }) => {
  const { deleteKey, toggleKeyStatus, testKey } = useLLMKeysStore();
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);

  const Logo = PROVIDER_LOGOS[keyData.providerId] || (() => <Key className="h-6 w-6" />);

  const handleTest = async () => {
    setTesting(true);
    try {
      const result = await testKey(keyData.id);
      setTestResult(result);
      setTimeout(() => setTestResult(null), 3000);
    } catch (error) {
      setTestResult(false);
      setTimeout(() => setTestResult(null), 3000);
    } finally {
      setTesting(false);
    }
  };

  const maskedKey = `${keyData.keyValue.slice(0, 8)}${'*'.repeat(20)}${keyData.keyValue.slice(-4)}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br from-gray-900/90 to-gray-800/90 rounded-xl border transition-all duration-300 ${
        keyData.isActive ? 'border-cyan-500/50' : 'border-gray-700'
      }`}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${keyData.isActive ? 'bg-cyan-900/50' : 'bg-gray-800'}`}>
              <Logo className={`h-6 w-6 ${keyData.isActive ? 'text-cyan-400' : 'text-gray-400'}`} />
            </div>
            <div>
              <h3 className="font-semibold text-white">{keyData.keyName}</h3>
              <p className="text-sm text-gray-400">{keyData.providerName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {keyData.isActive ? (
              <Badge className="bg-green-900/50 text-green-300 border-green-700/50">
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
              </Badge>
            ) : (
              <Badge className="bg-gray-700/50 text-gray-300 border-gray-600">
                Inactive
              </Badge>
            )}
          </div>
        </div>

        {/* Key Display */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-gray-400 uppercase tracking-wider">API Key</label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowKey(!showKey)}
              className="h-6 w-6 p-0"
            >
              {showKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </Button>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3 font-mono text-sm">
            <span className="text-gray-300">
              {showKey ? keyData.keyValue : maskedKey}
            </span>
          </div>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider">Environment</label>
            <div className="mt-1">
              <Badge variant="outline" className={`text-xs ${
                keyData.metadata.environment === 'production' ? 'border-red-500/50 text-red-300' :
                keyData.metadata.environment === 'staging' ? 'border-yellow-500/50 text-yellow-300' :
                'border-blue-500/50 text-blue-300'
              }`}>
                {keyData.metadata.environment}
              </Badge>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider">Usage</label>
            <div className="mt-1 text-sm text-gray-300">
              {keyData.usageCount.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Description */}
        {keyData.metadata.description && (
          <div className="mb-4">
            <label className="text-xs text-gray-400 uppercase tracking-wider">Description</label>
            <p className="mt-1 text-sm text-gray-300">{keyData.metadata.description}</p>
          </div>
        )}

        {/* Tags */}
        {keyData.metadata.tags.length > 0 && (
          <div className="mb-4">
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">Tags</label>
            <div className="flex flex-wrap gap-1">
              {keyData.metadata.tags.map(tag => (
                <Badge key={tag} variant="outline" className="text-xs border-gray-600 text-gray-400">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-700">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTest}
              disabled={testing}
              className={`border-blue-500/50 text-blue-400 hover:bg-blue-500/10 ${
                testResult === true ? 'border-green-500/50 text-green-400' :
                testResult === false ? 'border-red-500/50 text-red-400' : ''
              }`}
            >
              {testing ? (
                <LoadingSpinner className="h-4 w-4" />
              ) : testResult === true ? (
                <CheckCircle className="h-4 w-4" />
              ) : testResult === false ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <TestTube className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleKeyStatus(keyData.id)}
              className={keyData.isActive ? 
                'border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10' :
                'border-green-500/50 text-green-400 hover:bg-green-500/10'
              }
            >
              {keyData.isActive ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => deleteKey(keyData.id)}
            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

// MAIN COMPONENT
export const EpicLlmKeyManager: React.FC = () => {
  const { 
    providers, fetchKeys, fetchProviders, getFilteredKeys, 
    searchTerm, setSearchTerm, selectedProvider, setSelectedProvider,
    selectedEnvironment, setSelectedEnvironment, showInactiveKeys, 
    toggleShowInactiveKeys, isLoading 
  } = useLLMKeysStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const filteredKeys = getFilteredKeys();

  useEffect(() => {
    fetchKeys();
    fetchProviders();
  }, [fetchKeys, fetchProviders]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                🔐 LLM Key Manager
              </h1>
              <p className="text-gray-400 mt-2">Manage your AI provider keys with Redis integration</p>
            </div>
            <Button 
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Key
            </Button>
          </div>

          {/* Stats */}
          <EpicKeyStats />
        </motion.div>

        {/* Redis Control Panel */}
        <RedisControlPanel />

        {/* Filters */}
        <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-gray-700 mb-6">
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-64">
                <Input
                  placeholder="Search keys..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-gray-800 border-gray-600"
                />
              </div>
              <Select value={selectedProvider || 'all'} onValueChange={(value) => setSelectedProvider(value === 'all' ? null : value)}>
                <SelectTrigger className="w-48 bg-gray-800 border-gray-600">
                  <SelectValue placeholder="All Providers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  {providers.map(provider => (
                    <SelectItem key={provider.id} value={provider.id}>{provider.displayName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedEnvironment || 'all'} onValueChange={(value) => setSelectedEnvironment(value === 'all' ? null : value)}>
                <SelectTrigger className="w-48 bg-gray-800 border-gray-600">
                  <SelectValue placeholder="All Environments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Environments</SelectItem>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="staging">Staging</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Switch checked={showInactiveKeys} onCheckedChange={toggleShowInactiveKeys} />
                <label className="text-sm text-gray-300">Show inactive</label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Keys Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner className="h-8 w-8" />
          </div>
        ) : filteredKeys.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Key className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No keys found</h3>
            <p className="text-gray-400 mb-6">Add your first API key to get started</p>
            <Button onClick={() => setShowAddModal(true)} className="bg-cyan-600 hover:bg-cyan-500">
              <Plus className="h-4 w-4 mr-2" />
              Add First Key
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredKeys.map((key) => (
                <KeyCard key={key.id} keyData={key} />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Add Key Modal */}
        <AddKeyModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
      </div>
    </div>
  );
};