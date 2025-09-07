import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { LoadingSpinner } from '../../LoadingSpinner';
import {
  Key,
  Calendar,
  XCircle,
  Zap,
  Settings,
  MoreHorizontal,
  Copy,
  BarChart3,
  Trash2,
  Edit,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import type { BackendLlmApiKey } from '../../../store/types';

interface BackendKeysListProps {
  keys: BackendLlmApiKey[];
  isLoading: boolean;
  testingKeyIndex: number | null;
  onTestKey: (index: number) => void;
  onEditKey?: (key: BackendLlmApiKey, index: number) => void;
  onDeleteKey?: (key: BackendLlmApiKey, index: number) => void;
  onCopyKey?: (key: BackendLlmApiKey) => void;
}

const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic Claude',
  'google-flash': 'Google Gemini Flash',
  gemini: 'Gemini',
  google: 'Google Gemini',
  xai: 'xAI Grok',
  qwen: 'Qwen3 Coder',
  openrouter: 'OpenRouter',
};

const BackendKeysList: React.FC<BackendKeysListProps> = ({
  keys,
  isLoading,
  testingKeyIndex,
  onTestKey,
  onEditKey,
  onDeleteKey,
  onCopyKey,
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <LoadingSpinner />
      </div>
    );
  }

  if (keys.length === 0) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-6 text-center">
          <Key className="mx-auto h-12 w-12 text-gray-500" />
          <h3 className="mt-4 text-lg font-medium text-gray-300">
            Aucune clé API ajoutée
          </h3>
          <p className="mt-2 text-gray-500">
            Ajoutez votre première clé API pour commencer à utiliser différents
            fournisseurs LLM.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {keys.map((key, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border-2 transition-all ${
            index === 0
              ? 'bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-green-600/50'
              : key.isPermanentlyDisabled
                ? 'bg-gradient-to-r from-red-900/30 to-rose-900/30 border-red-600/50'
                : 'bg-gray-700/50 border-gray-600/50'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
            <div className="flex items-center space-x-2">
              {index === 0 && (
                <Badge className="bg-green-900/50 text-green-300 border border-green-700/50">
                  <Zap className="h-3 w-3 mr-1" />
                  ACTIVE
                </Badge>
              )}
              {key.isPermanentlyDisabled && index !== 0 && (
                <Badge className="bg-red-900/50 text-red-300 border border-red-700/50">
                  <XCircle className="h-3 w-3 mr-1" />
                  DÉSACTIVÉE
                </Badge>
              )}
              {key.priority && (
                <Badge className="bg-blue-900/50 text-blue-300 border border-blue-700/50">
                  <Settings className="h-3 w-3 mr-1" />
                  Priorité: {key.priority}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-purple-900/50 text-purple-300 border border-purple-700/50">
                {PROVIDER_DISPLAY_NAMES[key.apiProvider] || key.apiProvider}
              </Badge>
              <span className="text-white font-medium">
                {key.apiModel || 'Modèle par défaut'}
              </span>
              <span className="text-gray-400 text-sm truncate max-w-xs">
                Clé: {key.apiKey?.substring(0, 8)}...
                {key.apiKey?.substring(key.apiKey.length - 4)}
              </span>
              {key.baseUrl && (
                <span className="text-blue-400 text-xs">
                  {new URL(key.baseUrl).hostname}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-2 md:mt-0">
            {key.lastUsed && (
              <Badge className="bg-green-900/50 text-green-300 border border-green-700/50 text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                {new Date(key.lastUsed).toLocaleDateString()}
              </Badge>
            )}
            {key.errorCount > 0 && (
              <Badge
                className={`${
                  key.errorCount > 5
                    ? 'bg-red-900/50 text-red-300 border-red-700/50'
                    : 'bg-orange-900/50 text-orange-300 border-orange-700/50'
                } text-xs`}
              >
                Erreurs: {key.errorCount}
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onTestKey(index)}
              disabled={testingKeyIndex === index}
              className="border-purple-500/50 text-purple-400 hover:bg-purple-900/30 hover:text-purple-300 text-xs"
            >
              {testingKeyIndex === index ? (
                <>
                  <LoadingSpinner className="h-3 w-3 mr-1" />
                  Test...
                </>
              ) : (
                'Tester'
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-gray-800 border-gray-700"
              >
                {onCopyKey && (
                  <DropdownMenuItem
                    onClick={() => onCopyKey(key)}
                    className="hover:bg-purple-900/30"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copier
                  </DropdownMenuItem>
                )}
                {onEditKey && (
                  <DropdownMenuItem
                    onClick={() => onEditKey(key, index)}
                    className="hover:bg-purple-900/30"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem className="hover:bg-purple-900/30">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Statistiques
                </DropdownMenuItem>
                {onDeleteKey && (
                  <DropdownMenuItem
                    onClick={() => onDeleteKey(key, index)}
                    className="text-red-400 hover:bg-red-900/30"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default BackendKeysList;
