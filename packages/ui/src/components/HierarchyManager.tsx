import { memo, useEffect, useState } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Shield, Key } from 'lucide-react';
import { useLLMKeysStore, LLMKey } from '../store/llmKeysStore';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { getMasterLlmApiKeyApi } from '../lib/api';

// API function to fetch the master key
const fetchMasterKey = async (): Promise<LLMKey | null> => {
  try {
    // Get auth token from localStorage
    const authToken = localStorage.getItem('backendAuthToken');
    if (!authToken) return null;
    
    const masterKeyData = await getMasterLlmApiKeyApi(authToken, null);
    if (!masterKeyData) return null;
    
    return {
      id: 'master-key',
      providerId: masterKeyData.providerId || 'Master',
      providerName: masterKeyData.providerName || 'Master',
      keyName: 'Master Key (.env)',
      keyValue: masterKeyData.keyValue || '',
      isEncrypted: false,
      isActive: true,
      priority: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
      metadata: { environment: 'universal', tags: ['master'] }
    };
  } catch (error) {
    console.warn('Failed to fetch master key:', error);
    return null;
  }
};

const saveKeyHierarchy = async (orderedKeys: LLMKey[]) => {
  // In a real implementation, this would make an API call to save the new order.
  console.log('Saving new key hierarchy:', orderedKeys.map(k => k.keyName));
  await new Promise(resolve => setTimeout(resolve, 500));
};

const SortableKeyItem = ({ apiKey, isMaster }: { apiKey: LLMKey, isMaster: boolean }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: apiKey.id, disabled: isMaster });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`flex items-center p-3 mb-2 rounded-lg border bg-gray-800/50 ${
        isMaster ? 'border-yellow-500/50' : 'border-gray-600'
      }`}
    >
      <div {...listeners} className={`cursor-grab ${isMaster ? 'cursor-not-allowed text-gray-600' : 'text-gray-400'}`}>
        <GripVertical className="h-5 w-5" />
      </div>
      <div className="ml-4 flex-grow">
        <div className="font-bold text-white flex items-center">
          {apiKey.providerName}
          {isMaster && (
            <Shield className="h-4 w-4 ml-2 text-yellow-500" />
          )}
        </div>
        <div className="text-xs text-gray-400 flex items-center">
          <Key className="h-3 w-3 mr-1" />
          {apiKey.keyName}
        </div>
        <div className="text-xs text-gray-500">{apiKey.providerId}</div>
      </div>
      {isMaster && (
        <Badge className="bg-yellow-900/50 text-yellow-300 border border-yellow-700/50">
          <Shield className="h-3 w-3 mr-1" />
          Master
        </Badge>
      )}
    </div>
  );
};

export const HierarchyManager = memo(() => {
  const { keys: userKeys, fetchKeys } = useLLMKeysStore();
  const [masterKey, setMasterKey] = useState<LLMKey | null>(null);
  const [orderedKeys, setOrderedKeys] = useState<LLMKey[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Fetch keys from the store when the component mounts
    fetchKeys();
    const fetchMaster = async () => {
      const key = await fetchMasterKey();
      setMasterKey(key);
    };
    fetchMaster();
  }, [fetchKeys]);

  useEffect(() => {
    // Combine master key with user keys from the store
    const allKeys = [...(masterKey ? [masterKey] : []), ...userKeys];
    setOrderedKeys(allKeys);
  }, [userKeys, masterKey]);

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
    const userConfigurableKeys = orderedKeys.filter(k => k.providerId !== 'Master' && k.id !== 'master-key');
    await saveKeyHierarchy(userConfigurableKeys);
    setIsSaving(false);
  };

  return (
    <Card className="mb-6 bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-200">Hiérarchie des Clés</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-400 mb-4">
          Glissez-déposez les clés pour définir leur ordre de priorité. Le système essaiera les clés dans cet ordre, en commençant par la clé Master.
        </p>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={orderedKeys.map(k => k.id)} strategy={verticalListSortingStrategy}>
            {orderedKeys.map((key) => (
              <SortableKeyItem 
                key={key.id} 
                apiKey={key} 
                isMaster={key.providerId === 'Master' || key.id === 'master-key'} 
              />
            ))}
          </SortableContext>
        </DndContext>
        <div className="mt-4 flex justify-end">
          <Button onClick={handleSaveChanges} disabled={isSaving}>
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder la Hiérarchie'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});