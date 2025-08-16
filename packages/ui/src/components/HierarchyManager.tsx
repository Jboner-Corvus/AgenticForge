import { memo, useEffect, useState } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Shield } from 'lucide-react';
import { useLLMKeysStore, LLMKey } from '../store/llmKeysStore';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

// API function placeholders
const getMasterKey = async (): Promise<LLMKey | null> => {
  // This simulates fetching a master/environment key that is always at the top.
  return {
    id: 'master-key',
    providerId: 'Master',
    providerName: 'Master',
    keyName: 'Master Key (.env)',
    keyValue: 'loaded-from-env',
    isEncrypted: false,
    isActive: true,
    priority: 1, // Priorité élevée pour la clé master
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
    metadata: { environment: 'universal', tags: [] }
  };
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
        <div className="font-bold text-white">{apiKey.providerName}</div>
        <div className="text-xs text-gray-400">{apiKey.keyName}</div>
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
      const key = await getMasterKey();
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
    const userConfigurableKeys = orderedKeys.filter(k => k.providerId !== 'Master');
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
              <SortableKeyItem key={key.id} apiKey={key} isMaster={key.providerId === 'Master'} />
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