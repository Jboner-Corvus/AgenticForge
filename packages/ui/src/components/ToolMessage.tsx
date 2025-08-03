import React from 'react';
import type { ToolCallMessage, ToolResultMessage } from '../types/chat';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Code } from 'lucide-react';
import { motion } from 'framer-motion';

// This component can display either a tool call or a tool result
type ToolMessageProps =
  | { message: ToolCallMessage }
  | { message: ToolResultMessage };

export const ToolMessage: React.FC<ToolMessageProps> = ({ message }) => {
  const isToolCall = message.type === 'tool_call';
  const toolName = message.toolName;
  const details = isToolCall ? message.params : message.result;
  const title = isToolCall ? 'Tool Call' : 'Tool Result';
  const detailLabel = isToolCall ? 'Parameters' : 'Result';

  return (
    <motion.div 
      className="animate-fade-in"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2 }}
    >
      <Card className="bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200 text-cyan-800 rounded-xl shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="p-3">
          <CardTitle className="text-sm font-medium flex items-center">
            <Code className="h-4 w-4 mr-2 text-cyan-600" />
            {title}: {toolName}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="text-xs text-cyan-700 mb-2 flex items-center">
            <span className="w-2 h-2 rounded-full bg-cyan-400 mr-2"></span>
            {detailLabel}:
          </div>
          <pre className="text-xs bg-white/50 p-2 rounded-md overflow-x-auto border border-cyan-100">
            {JSON.stringify(details, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </motion.div>
  );
};
