import { memo, useEffect, useState } from 'react';
import { useCombinedStore } from '../store';
import { LlmApiKey } from '../store';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Shield } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

// API function placeholders - these will need to be implemented in api.ts
const getMasterKey = async (): Promise<LlmApiKey | null> => {
  // Simulate fetching the master key from .env on the backend
  console.log('Fetching master key...');
  // In a real implementation, this would be an API call.
  // Returning a mock key for now.
  return {
    provider: 'Master',
    key: 'loaded-from-env',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-5'
  };
};

const saveKeyHierarchy = async (orderedKeys: LlmApiKey[]) => {
  // Simulate saving the new order to the backend
  console.log('Saving new key hierarchy:', orderedKeys.map(k => k.provider));
  // In a real implementation, this would be an API call.
  await new Promise(resolve => setTimeout(resolve, 500));
};


const SortableKeyItem = ({ apiKey, isMaster }: { apiKey: LlmApiKey, isMaster: boolean }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: apiKey.key, disabled: isMaster });

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
        <span className="font-bold text-white">{apiKey.provider}</span>
        <span className="text-xs text-gray-400 ml-2">({apiKey.model})</span>
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
  const userKeys = useCombinedStore((state) => state.llmApiKeys);
  const [masterKey, setMasterKey] = useState<LlmApiKey | null>(null);
  const [orderedKeys, setOrderedKeys] = useState<LlmApiKey[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchMaster = async () => {
      const key = await getMasterKey();
      setMasterKey(key);
    };
    fetchMaster();
  }, []);

  useEffect(() => {
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
        const oldIndex = keys.findIndex(k => k.key === active.id);
        const newIndex = keys.findIndex(k => k.key === over.id);
        // Prevent master key from being moved
        if (oldIndex === 0 || newIndex === 0) return keys;
        return arrayMove(keys, oldIndex, newIndex);
      });
    }
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    // Filter out the master key before sending to the backend
    const userConfigurableKeys = orderedKeys.filter(k => k.provider !== 'Master');
    await saveKeyHierarchy(userConfigurableKeys);
    // Here you might want to refetch or update the store based on the response
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
          <SortableContext items={orderedKeys.map(k => k.key)} strategy={verticalListSortingStrategy}>
            {orderedKeys.map((key) => (
              <SortableKeyItem key={key.key} apiKey={key} isMaster={key.provider === 'Master'} />
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
