import { Send, Paperclip, SquareX } from 'lucide-react';
import React, { useEffect, useRef } from 'react';

import { useAgentStream } from '../lib/hooks/useAgentStream';
import { useStore } from '../lib/store';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Textarea } from './ui/textarea';
import { AgentThoughtBubble } from './AgentThoughtBubble';
import { ToolCallDisplay } from './ToolCallDisplay';
import { ToolResultDisplay } from './ToolResultDisplay';
import { ToolListDisplay } from './ToolListDisplay';
import { AgentResponseBubble } from './AgentResponseBubble';
import { UserMessageBubble } from './UserMessageBubble';
import { fr } from '../constants/fr';
import { ProgressBar } from './ProgressBar';

export function ChatWindow() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const authToken = useStore((state) => state.authToken);
  const agentStatus = useStore((state) => state.agentStatus);
  const agentProgress = useStore((state) => state.agentProgress);
  const toolStatus = useStore((state) => state.toolStatus);
  const displayItems = useStore((state) => state.displayItems);
  const isProcessing = useStore((state) => state.isProcessing);
  const messageInputValue = useStore((state) => state.messageInputValue);
  const serverHealthy = useStore((state) => state.serverHealthy);
  const sessionId = useStore((state) => state.sessionId);
  const setMessageInputValue = useStore((state) => state.setMessageInputValue);

  const { startAgent, interruptAgent } = useAgentStream();

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [messageInputValue]);

  const handleSendMessage = (event: React.FormEvent) => {
    event.preventDefault();
    startAgent();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      
      // TODO: Implement file upload logic
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleInterrupt = () => {
    interruptAgent();
  };

  return (
    <main className="flex-1 p-4 flex flex-col bg-background">
      <Card className="flex-1 flex flex-col bg-secondary border-border text-foreground">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          <section aria-live="assertive" className="space-y-4">
            {displayItems.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center">
                <p className="text-lg">Start by describing your goal!</p>
                <p className="text-sm">e.g., "Create a simple web server using Node.js and Express."</p>
              </div>
            )}
            {displayItems.map((item) => {
              switch (item.type) {
                case 'agent_response':
                  return (
                    <AgentResponseBubble
                      key={item.id}
                      content={item.content}
                      id={item.id}
                      timestamp={item.timestamp}
                    />
                  );
                case 'user_message':
                  return (
                    <UserMessageBubble
                      key={item.id}
                      content={item.content}
                      timestamp={item.timestamp}
                    />
                  );
                case 'agent_thought':
                  return (
                    <AgentThoughtBubble content={item.content} key={item.id} timestamp={item.timestamp} />
                  );
                case 'tool_call':
                  return (
                    <ToolCallDisplay
                      key={item.id}
                      params={item.params}
                      toolName={item.toolName}
                      timestamp={item.timestamp}
                    />
                  );
                case 'tool_result':
                  return (
                    <ToolResultDisplay
                      key={item.id}
                      result={item.result}
                      toolName={item.toolName}
                      timestamp={item.timestamp}
                    />
                  );
                case 'tool_list':
                  return <ToolListDisplay key={item.id} tools={item.tools} timestamp={item.timestamp} />;
                default:
                  return null;
              }
            })}
            {isProcessing && (
              <div className="flex flex-col justify-start animate-fade-in">
                <div className="bg-muted text-muted-foreground p-3 rounded-lg typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div className="ml-2 text-muted-foreground text-sm">
                  {toolStatus ? (
                    <p dangerouslySetInnerHTML={{ __html: toolStatus }} />
                  ) : (
                    <p>{agentStatus || fr.agentThinking}</p>
                  )}
                </div>
                <ProgressBar progress={agentProgress} />
              </div>
            )}
          </section>
        </CardContent>
        <div className="p-4 border-t border-border">
          <form
            className="flex items-center space-x-2"
            onSubmit={handleSendMessage}
          >
            <Button
              aria-label="Attach file"
              className="text-muted-foreground hover:text-foreground"
              type="button"
              variant="ghost"
              onClick={handleAttachClick}
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <Textarea
              aria-label="Message input field"
              className="flex-1 bg-input border-border text-foreground placeholder-muted-foreground resize-none overflow-hidden"
              disabled={
                !authToken || !sessionId || isProcessing || !serverHealthy
              }
              id="messageInput"
              onInput={(e) =>
                setMessageInputValue(
                  (e.target as HTMLTextAreaElement).value,
                )
              }
              placeholder={
                isProcessing
                  ? fr.agentThinking
                  : !serverHealthy
                  ? fr.serverOffline
                  : !authToken
                  ? fr.tokenRequiredInput
                  : fr.describeYourGoal
              }
              ref={textareaRef}
              rows={1}
              value={messageInputValue}
            />
            {isProcessing ? (
              <Button
                aria-label="Interrupt"
                className="bg-destructive hover:bg-destructive/80 text-destructive-foreground"
                onClick={handleInterrupt}
                type="button"
              >
                <SquareX className="h-6 w-6" />
              </Button>
            ) : (
              <Button
                aria-label="Send Message"
                className="bg-primary hover:bg-primary/80 text-primary-foreground"
                disabled={
                  !authToken || !sessionId || isProcessing || !serverHealthy
                }
                type="submit"
              >
                <Send className="h-6 w-6" />
              </Button>
            )}
          </form>
        </div>
      </Card>
    </main>
  );
}