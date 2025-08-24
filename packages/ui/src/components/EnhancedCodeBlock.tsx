import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Copy, 
  Check, 
  Download, 
  Play, 
  FileText, 
  Eye, 
  EyeOff,
  Maximize2,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface EnhancedCodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  collapsible?: boolean;
  showLineNumbers?: boolean;
  maxHeight?: number;
}

export const EnhancedCodeBlock: React.FC<EnhancedCodeBlockProps> = ({
  code,
  language = 'text',
  filename,
  collapsible = false,
  showLineNumbers = true,
  maxHeight = 400
}) => {
  const [copied, setCopied] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(collapsible);
  const [showFullCode, setShowFullCode] = useState(false);
  
  const lines = code.split('\n');
  const isLongCode = lines.length > 20;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const downloadCode = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `code.${language}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLanguageBadgeColor = (lang: string) => {
    const colors = {
      javascript: 'bg-yellow-500/20 text-yellow-300',
      typescript: 'bg-blue-500/20 text-blue-300',
      python: 'bg-green-500/20 text-green-300',
      jsx: 'bg-cyan-500/20 text-cyan-300',
      tsx: 'bg-purple-500/20 text-purple-300',
      css: 'bg-pink-500/20 text-pink-300',
      html: 'bg-orange-500/20 text-orange-300',
      json: 'bg-gray-500/20 text-gray-300',
    };
    return colors[lang as keyof typeof colors] || 'bg-gray-500/20 text-gray-300';
  };

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative group bg-gray-900 rounded-xl border border-gray-700 overflow-hidden shadow-lg"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 bg-gray-800/50 border-b border-gray-700">
          <div className="flex items-center gap-3">
            {collapsible && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="h-6 w-6 hover:bg-gray-700"
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            )}
            
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-400" />
              {filename && (
                <span className="text-sm text-gray-300 font-mono">{filename}</span>
              )}
            </div>
            
            <Badge className={getLanguageBadgeColor(language)} variant="outline">
              {language}
            </Badge>
            
            <Badge variant="outline" className="text-xs text-gray-400">
              {lines.length} {lines.length === 1 ? 'ligne' : 'lignes'}
            </Badge>
          </div>

          <div className="flex items-center gap-1">
            {isLongCode && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowFullCode(!showFullCode)}
                    className="h-8 w-8 hover:bg-gray-700"
                  >
                    {showFullCode ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{showFullCode ? 'Réduire' : 'Voir tout le code'}</p>
                </TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={copyCode}
                  className="h-8 w-8 hover:bg-gray-700"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{copied ? 'Copié !' : 'Copier le code'}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={downloadCode}
                  className="h-8 w-8 hover:bg-gray-700"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Télécharger le fichier</p>
              </TooltipContent>
            </Tooltip>

            {(language === 'javascript' || language === 'python') && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-gray-700"
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Exécuter le code</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Code Content */}
        {!isCollapsed && (
          <motion.div
            initial={collapsible ? { height: 0 } : false}
            animate={collapsible ? { height: 'auto' } : false}
            className="relative"
          >
            <pre
              className={`overflow-auto p-4 text-sm font-mono ${
                !showFullCode && isLongCode ? 'max-h-80' : ''
              }`}
              style={{ maxHeight: showFullCode ? 'none' : maxHeight }}
            >
              <code className="text-gray-100">
                {showLineNumbers ? (
                  <div className="table w-full">
                    {lines.map((line, index) => (
                      <div key={index} className="table-row">
                        <div className="table-cell text-right pr-4 text-gray-500 select-none w-12">
                          {index + 1}
                        </div>
                        <div className="table-cell">{line}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  code
                )}
              </code>
            </pre>
            
            {!showFullCode && isLongCode && (
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-900 to-transparent flex items-end justify-center pb-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFullCode(true)}
                  className="bg-gray-800 hover:bg-gray-700"
                >
                  <Maximize2 className="h-4 w-4 mr-2" />
                  Voir le code complet ({lines.length - 20}+ lignes)
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </TooltipProvider>
  );
};