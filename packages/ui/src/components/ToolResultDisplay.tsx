// packages/ui/src/components/ToolResultDisplay.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface ToolResultDisplayProps {
  result: unknown;
  toolName: string;
  timestamp: string;
}

export const ToolResultDisplay: React.FC<ToolResultDisplayProps> = ({ result, toolName, timestamp }) => {
  if (toolName === 'finish') {
    return null; // N'affiche rien pour l'outil 'finish'
  }

  // Fonction pour formater le résultat en chaîne de caractères
  const formatResult = (res: unknown): string => {
    if (typeof res === 'string') {
      return res;
    }
    // Gère le format { output: "..." } que nous avons défini
    if (res && typeof res === 'object' && 'output' in res) {
      return String((res as { output: unknown }).output);
    }
    // Fallback pour d'autres types d'objets
    return JSON.stringify(res, null, 2);
  };

  const resultString = formatResult(result);

  return (
    <Card className="bg-secondary border-border text-secondary-foreground my-2 animate-fade-in">
      <CardHeader className="flex flex-row items-center space-x-2 p-2">
        <span className="text-2xl">✅</span>
        <CardTitle className="text-base font-bold">Result from {toolName}</CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        {/* La balise <pre> préserve le formatage (espaces, sauts de ligne) */}
        <pre className="text-sm bg-background p-2 rounded-md whitespace-pre-wrap font-sans">
          {resultString}
        </pre>
        <div className="text-xs text-muted-foreground mt-1">
          {timestamp}
        </div>
      </CardContent>
    </Card>
  );
};