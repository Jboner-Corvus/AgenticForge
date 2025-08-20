import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Key, Plus, Trash2, Eye, EyeOff, TestTube, RefreshCw, Database, 
  Upload, Download, AlertTriangle, CheckCircle, 
  Search, Globe, Lock, Unlock, Target, GripVertical, Shield
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { useLLMKeysStore, LLMKey } from '../store/llmKeysStore';
import { llmKeysApi } from '../lib/api/llmKeysApi';
import { LoadingSpinner } from './LoadingSpinner';
import { OpenAILogo, GeminiLogo } from './icons/LlmLogos';
import { OpenRouterLogo } from './icons/LlmLogos/OpenRouterLogo';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// PROVIDER LOGOS MAPPING
const PROVIDER_LOGOS: Record<string, React.ComponentType<{ className?: string }>> = {
  openai: OpenAILogo,
  anthropic: () => <div className="text-orange-400 font-bold">A</div>, // Fallback
  'google-flash': GeminiLogo,
  'google-pro': GeminiLogo,
  google: GeminiLogo, // Fallback for legacy
  xai: () => <div className="text-green-400 font-bold text-lg">𝕏</div>, // xAI/X logo
  qwen: () => <div className="text-blue-400 font-bold">Q</div>, // Qwen logo
  openrouter: OpenRouterLogo
};

// PROVIDER DISPLAY NAMES
const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic Claude',
  'google-flash': 'Google Gemini Flash',
  'gemini': 'Gemini',
  google: 'Google Gemini', // Fallback for legacy
  xai: 'xAI Grok',
  qwen: 'Qwen3 Coder',
  openrouter: 'OpenRouter'
};

// KEY PERFORMANCE STATS COMPONENT
const KeyPerformanceStats: React.FC = () => {
  const { keys } = useLLMKeysStore();
  
  // Calculate overall stats
  const totalRequests = keys.reduce((sum, key) => sum + (key.usageStats?.totalRequests || 0), 0);
  const successfulRequests = keys.reduce((sum, key) => sum + (key.usageStats?.successfulRequests || 0), 0);
  const failedRequests = keys.reduce((sum, key) => sum + (key.usageStats?.failedRequests || 0), 0);
  const successRate = totalRequests > 0 ? Math.round((successfulRequests / totalRequests) * 100) : 0;
  const activeKeys = keys.filter(key => key.isActive).length;
  
  const perfStatItems = [
    { label: 'SUCCESS RATE', value: `${successRate}%`, icon: CheckCircle, color: 'text-green-400' },
    { label: 'ACTIVE KEYS', value: activeKeys, icon: Key, color: 'text-cyan-400' },
    { label: 'TOTAL REQUESTS', value: totalRequests.toLocaleString(), icon: Target, color: 'text-purple-400' },
    { label: 'FAILED REQUESTS', value: failedRequests.toLocaleString(), icon: AlertTriangle, color: 'text-red-400' }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {perfStatItems.map((stat, index) => (
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
                {stat.value}
              </p>
            </div>
            <stat.icon className={`h-8 w-8 ${stat.color} opacity-70`} />
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// EPIC KEY STATS COMPONENT
const EpicKeyStats: React.FC = () => {
  const { stats, isLoading, isSyncing } = useLLMKeysStore();
  
  const statItems = [
    { label: 'TOTAL KEYS', value: stats.totalKeys, icon: Key, color: 'text-cyan-400' },
    { label: 'ACTIVE', value: stats.activeKeys, icon: CheckCircle, color: 'text-green-400' },
    { label: 'PROVIDERS', value: stats.providersCount, icon: Globe, color: 'text-purple-400' },
    { label: 'USAGE', value: stats.totalUsage, icon: Target, color: 'text-yellow-400' }
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
  const { syncWithRedis, importKeysFromRedis, exportKeysToRedis, cleanupDuplicates, isSyncing, error } = useLLMKeysStore();
  const [redisInfo, setRedisInfo] = useState<{ connected: boolean; keyCount: number; memory: string } | null>(null);
  const [scanning, setScanning] = useState(false);

  const fetchRedisInfo = async () => {
    try {
      const info = await llmKeysApi.getRedisInfo();
      setRedisInfo(info);
    } catch (error) {
      console.error('Failed to fetch Redis info:', error);
      // Set default disconnected state
      setRedisInfo({
        connected: false,
        keyCount: 0,
        memory: '0K'
      });
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
          Gestion des Clés
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

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
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
          <Button
            variant="outline"
            size="sm"
            onClick={cleanupDuplicates}
            disabled={isSyncing}
            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clean
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



// SORTABLE KEY ITEM FOR HIERARCHY
const SortableKeyItem = ({ keyData, isMaster, priority }: { keyData: LLMKey, isMaster: boolean, priority?: number }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: keyData.id, disabled: isMaster });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Logo = PROVIDER_LOGOS[keyData.providerId] || (() => <Key className="h-5 w-5" />);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`flex items-center p-3 mb-2 rounded-lg border bg-gray-800/50 ${
        isMaster ? 'border-yellow-500/50' : 'border-gray-600'
      }`}
    >
      <div {...listeners} className={`cursor-grab mr-3 ${isMaster ? 'cursor-not-allowed text-gray-600' : 'text-gray-400'}`}>
        <GripVertical className="h-5 w-5" />
      </div>
      <div className={`p-2 rounded-lg mr-3 ${isMaster ? 'bg-yellow-900/50' : 'bg-gray-800'}`}>
        <Logo className={`h-5 w-5 ${isMaster ? 'text-yellow-400' : 'text-gray-400'}`} />
      </div>
      <div className="flex-grow">
        <span className="font-bold text-white">{keyData.keyName}</span>
        <div className="text-xs text-gray-400">{keyData.providerName}</div>
      </div>
      {priority !== undefined && !isMaster && (
        <Badge className="bg-gray-700 text-gray-300 border-gray-600">
          P{priority}
        </Badge>
      )}
      {isMaster && (
        <Badge className="bg-yellow-900/50 text-yellow-300 border border-yellow-700/50">
          <Shield className="h-3 w-3 mr-1" />
          Master
        </Badge>
      )}
    </div>
  );
};

// HIERARCHY MANAGER COMPONENT
const HierarchyManager: React.FC = () => {
  const { keys, fetchKeys } = useLLMKeysStore();
  const [masterKey, setMasterKey] = useState<LLMKey | null>(null);
  const [orderedKeys, setOrderedKeys] = useState<LLMKey[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchMaster = async () => {
      // Fetch master key from backend
      try {
        const response = await fetch('/api/llm-keys/master-key', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('backendAuthToken') || ''}`
          }
        });
        
        if (response.ok) {
          const masterKeyData = await response.json();
          setMasterKey({
            id: 'master-key',
            providerId: 'master',
            providerName: 'Master',
            keyName: 'Master Key (.env)',
            keyValue: masterKeyData.apiKey,
            isEncrypted: false,
            isActive: true,
            priority: 0, // Highest priority for master key
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            usageCount: 0,
            metadata: { 
              environment: 'universal', 
              tags: [], 
              description: 'Master key loaded from .env file' 
            }
          });
        }
      } catch (error) {
        console.warn('Failed to fetch master key:', error);
      }
    };
    
    fetchMaster();
  }, []);

  useEffect(() => {
    // Load key hierarchy from backend
    const loadKeyHierarchy = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/llm-keys/hierarchy', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('backendAuthToken') || ''}`
          }
        });
        
        if (response.ok) {
          const hierarchy = await response.json();
          
          // Sort keys based on hierarchy
          const sortedKeys = [...keys].sort((a, b) => {
            const keyAIdentifier = `${a.providerId}|${a.keyValue}|${a.providerName}|`;
            const keyBIdentifier = `${b.providerId}|${b.keyValue}|${b.providerName}|`;
            
            const priorityA = hierarchy[keyAIdentifier] ?? Number.MAX_SAFE_INTEGER;
            const priorityB = hierarchy[keyBIdentifier] ?? Number.MAX_SAFE_INTEGER;
            
            return priorityA - priorityB;
          });
          
          setOrderedKeys([
            ...(masterKey ? [masterKey] : []),
            ...sortedKeys
          ]);
        } else {
          // Fallback to default ordering
          const allKeys = [...(masterKey ? [masterKey] : []), ...keys];
          setOrderedKeys(allKeys);
        }
      } catch (error) {
        console.warn('Failed to load key hierarchy:', error);
        // Fallback to default ordering
        const allKeys = [...(masterKey ? [masterKey] : []), ...keys];
        setOrderedKeys(allKeys);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadKeyHierarchy();
  }, [keys, masterKey]);

  const sensors = useSensors(
    useSensor(PointerSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setOrderedKeys((keys) => {
        const oldIndex = keys.findIndex(k => k.id === active.id);
        const newIndex = keys.findIndex(k => k.id === over.id);
        // Prevent master key from being moved
        if (oldIndex === 0 || newIndex === 0) return keys;
        return arrayMove(keys, oldIndex, newIndex);
      });
    }
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      // Create hierarchy object with key identifiers and priorities
      const hierarchy: {[key: string]: number} = {};
      
      orderedKeys.forEach((key, index) => {
        // Skip master key as it always has highest priority
        if (key.providerId !== 'master') {
          // Create a unique identifier for the key
          const keyIdentifier = `${key.providerId}|${key.keyValue}|${key.providerName}|`;
          hierarchy[keyIdentifier] = index;
        }
      });
      
      // Save hierarchy to backend
      const response = await fetch('/api/llm-keys/hierarchy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('backendAuthToken') || ''}`
        },
        body: JSON.stringify(hierarchy)
      });
      
      if (response.ok) {
        // Refresh keys to ensure UI is updated
        await fetchKeys();
      } else {
        throw new Error('Failed to save key hierarchy');
      }
    } catch (error) {
      console.error('Failed to save key hierarchy:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="mb-6 bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-gray-700">
        <CardContent className="p-6 flex items-center justify-center">
          <LoadingSpinner className="h-6 w-6" />
          <span className="ml-2 text-gray-400">Chargement de la hiérarchie...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-gray-700">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-cyan-400 flex items-center gap-2">
          <Target className="h-5 w-5" />
          Hiérarchie des Clés
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-400 mb-4">
          Glissez-déposez les clés pour définir leur ordre de priorité. Le système essaiera les clés dans cet ordre, en commençant par la clé Master.
        </p>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={orderedKeys.map(k => k.id)} strategy={verticalListSortingStrategy}>
            {orderedKeys.map((key, index) => (
              <SortableKeyItem 
                key={key.id} 
                keyData={key} 
                isMaster={key.providerId === 'master'} 
                priority={index}
              />
            ))}
          </SortableContext>
        </DndContext>
        <div className="mt-4 flex justify-end">
          <Button 
            onClick={handleSaveChanges} 
            disabled={isSaving}
            className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500"
          >
            {isSaving ? (
              <>
                <LoadingSpinner className="h-4 w-4 mr-2" />
                Sauvegarde...
              </>
            ) : (
              'Sauvegarder la Hiérarchie'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// ADD KEY MODAL - BEAUTIFIED VERSION
const AddKeyModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { providers, addKey, isLoading } = useLLMKeysStore();
  const [formData, setFormData] = useState({
    providerId: '',
    keyName: '',
    keyValue: '',
    isActive: true,
    priority: 5
  });

  const selectedProvider = providers.find(p => p.id === formData.providerId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider || isLoading) return; // Prevent double submission

    try {
      await addKey({
        providerId: formData.providerId,
        providerName: PROVIDER_DISPLAY_NAMES[formData.providerId] || selectedProvider.name,
        keyName: formData.keyName,
        keyValue: formData.keyValue,
        isEncrypted: false,
        isActive: formData.isActive,
        priority: formData.priority,
        metadata: {
          environment: 'universal', // Toutes les clés fonctionnent partout
          tags: [],
          description: '' // Removed description field as requested
        }
      });
      onClose();
      setFormData({
        providerId: '',
        keyName: '',
        keyValue: '',
        isActive: true,
        priority: 5
      });
    } catch (error) {
      console.error('Failed to add key:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-lg z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-3xl border border-cyan-500/20 shadow-2xl shadow-cyan-500/10 p-8 w-full max-w-lg"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-xl">
              <Plus className="h-6 w-6 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Add New API Key
              </h3>
              <p className="text-gray-400 text-sm">Connect your AI provider</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full"
          >
            ×
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Provider Selection */}
          <div className="space-y-3">
            <label htmlFor="provider-select" className="block text-sm font-semibold text-gray-300">
              AI Provider
            </label>
            <Select value={formData.providerId} onValueChange={(value) => setFormData({...formData, providerId: value})}>
              <SelectTrigger id="provider-select" className="bg-gray-800/50 border-gray-600/50 hover:border-cyan-500/50 transition-colors h-12 text-base">
                <SelectValue placeholder="Choose your AI provider">
                  {selectedProvider && (
                    <div className="flex items-center gap-3">
                      {PROVIDER_LOGOS[selectedProvider.id] && (
                        <div className="h-5 w-5">
                          {React.createElement(PROVIDER_LOGOS[selectedProvider.id], { className: "h-5 w-5" })}
                        </div>
                      )}
                      <span>{PROVIDER_DISPLAY_NAMES[selectedProvider.id] || selectedProvider.displayName}</span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                {providers.map(provider => (
                  <SelectItem key={provider.id} value={provider.id} className="hover:bg-gray-700">
                    <div className="flex items-center gap-3">
                      {PROVIDER_LOGOS[provider.id] && (
                        <div className="h-4 w-4">
                          {React.createElement(PROVIDER_LOGOS[provider.id], { className: "h-4 w-4" })}
                        </div>
                      )}
                      <span>{PROVIDER_DISPLAY_NAMES[provider.id] || provider.displayName}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Key Name */}
          <div className="space-y-3">
            <label htmlFor="key-name-input" className="block text-sm font-semibold text-gray-300">
              Key Name
            </label>
            <Input
              id="key-name-input"
              value={formData.keyName}
              onChange={(e) => setFormData({...formData, keyName: e.target.value})}
              placeholder={selectedProvider ? `My ${PROVIDER_DISPLAY_NAMES[selectedProvider.id] || selectedProvider.displayName} Key` : "Give your key a name"}
              className="bg-gray-800/50 border-gray-600/50 hover:border-cyan-500/50 focus:border-cyan-500 transition-colors h-12 text-base"
              required
            />
          </div>

          {/* API Key */}
          <div className="space-y-3">
            <label htmlFor="api-key-input" className="block text-sm font-semibold text-gray-300">
              API Key
            </label>
            <div className="relative">
              <Input
                id="api-key-input"
                type="password"
                value={formData.keyValue}
                onChange={(e) => setFormData({...formData, keyValue: e.target.value})}
                placeholder="sk-..."
                className="bg-gray-800/50 border-gray-600/50 hover:border-cyan-500/50 focus:border-cyan-500 transition-colors h-12 text-base pr-12"
                required
              />
              <Key className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-xl border border-gray-700/50">
            <div>
              <label htmlFor="activate-key-switch" className="text-sm font-semibold text-gray-300">Activate Key</label>
              <p className="text-xs text-gray-400">Enable this key immediately after adding</p>
            </div>
            <Switch
              id="activate-key-switch"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
              className="data-[state=checked]:bg-cyan-500"
            />
          </div>

          {/* Priority Slider */}
          <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-xl border border-gray-700/50">
            <div>
              <label htmlFor="priority-slider" className="text-sm font-semibold text-gray-300">Priority Level</label>
              <p className="text-xs text-gray-400">Lower numbers = higher priority (1-10)</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400 w-6">{formData.priority}</span>
              <input
                id="priority-slider"
                type="range"
                min="1"
                max="10"
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value)})}
                className="w-24 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              className="flex-1 h-12 border-gray-600 hover:border-gray-500 hover:bg-gray-800/50"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !formData.providerId || !formData.keyName || !formData.keyValue}
              className="flex-1 h-12 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-semibold"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner className="h-4 w-4 mr-2" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Key
                </>
              )}
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
        <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${keyData.isActive ? 'bg-cyan-900/50' : 'bg-gray-800'}`}>
                <Logo className={`h-6 w-6 ${keyData.isActive ? 'text-cyan-400' : 'text-gray-400'}`} />
              </div>
              <div>
                <h3 className="font-semibold text-white">{keyData.keyName}</h3>
                <p className="text-sm text-gray-400">{PROVIDER_DISPLAY_NAMES[keyData.providerId] || keyData.providerName}</p>
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
              <Badge className={`border ${keyData.priority <= 3 ? 'border-red-500/50 text-red-400 bg-red-900/20' : keyData.priority <= 6 ? 'border-yellow-500/50 text-yellow-400 bg-yellow-900/20' : 'border-green-500/50 text-green-400 bg-green-900/20'}`}>
                P{keyData.priority}
              </Badge>
            </div>
          </div>

        {/* Key Display */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-gray-400 uppercase tracking-wider">API Key</div>
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
        <div className="mb-4">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <div className="text-gray-400 uppercase tracking-wider">Usage</div>
              <div className="text-gray-300">{keyData.usageCount.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-gray-400 uppercase tracking-wider">Priority</div>
              <div className="text-gray-300">{keyData.priority}</div>
            </div>
            {keyData.usageStats && (
              <>
                <div>
                  <div className="text-gray-400 uppercase tracking-wider">Success Rate</div>
                  <div className="text-gray-300">
                    {keyData.usageStats.totalRequests > 0 
                      ? `${Math.round(((keyData.usageStats.successfulRequests / keyData.usageStats.totalRequests) * 100))}%`
                      : '0%'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 uppercase tracking-wider">Error Rate</div>
                  <div className="text-gray-300">
                    {Math.round(keyData.usageStats.errorRate * 100)}%
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Description */}
        {keyData.metadata.description && (
          <div className="mb-4">
            <div className="text-xs text-gray-400 uppercase tracking-wider">Description</div>
            <p className="mt-1 text-sm text-gray-300">{keyData.metadata.description}</p>
          </div>
        )}

        {/* Last Used */}
        {keyData.lastUsed && (
          <div className="mb-4">
            <div className="text-xs text-gray-400 uppercase tracking-wider">Last Used</div>
            <p className="mt-1 text-sm text-gray-300">
              {new Date(keyData.lastUsed).toLocaleString()}
            </p>
          </div>
        )}

        {/* Tags */}
        {keyData.metadata.tags.length > 0 && (
          <div className="mb-4">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">Tags</div>
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
    selectedProvider, setSelectedProvider,
    showInactiveKeys, 
    toggleShowInactiveKeys, isLoading, forceDeduplication 
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
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  // Force refresh to apply deduplication
                  fetchKeys();
                }}
                variant="outline"
                className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button 
                onClick={async () => {
                  console.log('🧹 Bouton Clean Duplicates cliqué !');
                  try {
                    // First try backend cleanup
                    const response = await fetch('/api/llm-keys/cleanup-duplicates', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('backendAuthToken') || ''}`
                      }
                    });
                    
                    if (response.ok) {
                      console.log('✅ Backend cleanup réussi');
                    } else {
                      console.warn('⚠️ Backend cleanup failed, using frontend fallback');
                    }
                    
                    // Always run frontend deduplication as backup
                    forceDeduplication();
                    
                    // Force refresh to ensure UI is updated
                    setTimeout(() => {
                      fetchKeys();
                    }, 500);
                    
                    console.log('✅ Déduplication terminée');
                  } catch (error) {
                    console.error('❌ Erreur:', error);
                    // Run frontend deduplication as fallback
                    forceDeduplication();
                    fetchKeys();
                  }
                }}
                variant="outline"
                className="border-red-500/50 text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clean Duplicates
              </Button>
              <Button 
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Key
              </Button>
            </div>
          </div>

          {/* Stats */}
          <EpicKeyStats />
          <KeyPerformanceStats />
        </motion.div>

        {/* Redis Control Panel */}
        <RedisControlPanel />

        {/* Hierarchy Manager */}
        <HierarchyManager />

        {/* Filters */}
        <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-gray-700 mb-6">
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-4 items-center">
              <Select value={selectedProvider || 'all'} onValueChange={(value) => setSelectedProvider(value === 'all' ? null : value)}>
                <SelectTrigger className="w-48 bg-gray-800 border-gray-600">
                  <SelectValue placeholder="All Providers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  {providers.map(provider => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {PROVIDER_DISPLAY_NAMES[provider.id] || provider.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Switch id="show-inactive-switch" checked={showInactiveKeys} onCheckedChange={toggleShowInactiveKeys} />
                <label htmlFor="show-inactive-switch" className="text-sm text-gray-300">Show inactive</label>
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