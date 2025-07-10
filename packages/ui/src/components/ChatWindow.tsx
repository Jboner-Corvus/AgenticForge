import { Send, Paperclip, SquareX } from 'lucide-react';
import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { useAgentStream } from '../lib/hooks/useAgentStream';
import { useStore } from '../lib/store';
import { Avatar } from './ui/avatar';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Textarea } from './ui/textarea';
import { ThoughtBubble } from './ThoughtBubble';
import { ToolCallCard } from './ToolCallCard';
import { ToolResultDisplay } from './ToolResultDisplay';
import { fr } from '../constants/fr';

export function ChatWindow() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const authToken = useStore((state) => state.authToken);
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

  const handleInterrupt = () => {
    interruptAgent();
  };

  return (
    <main className="flex-1 p-4 flex flex-col bg-background">
      <Card className="flex-1 flex flex-col bg-secondary border-border text-foreground">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          <section aria-live="assertive" className="space-y-4">
            {displayItems.map((item) => {
              switch (item.type) {
                case 'agent_response':
                  return (
                    <div
                      className={`flex items-start gap-4 ${
                        item.sender === 'user'
                          ? 'justify-end'
                          : 'justify-start'
                      } animate-fade-in`}
                      key={item.id}
                    >
                      {item.sender === 'assistant' && (
                        <Avatar sender="assistant" />
                      )}
                      <div
                        className={`max-w-[70%] p-3 rounded-lg ${
                          item.sender === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-card text-card-foreground'
                        }`}
                      >
                        <div className="message-content prose prose-invert">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {item.content}
                          </ReactMarkdown>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date().toLocaleTimeString()}
                        </div>
                      </div>
                      {item.sender === 'user' && <Avatar sender="user" />}
                    </div>
                  );
                case 'agent_thought':
                  return (
                    <ThoughtBubble content={item.content} key={item.id} />
                  );
                case 'tool_call':
                  return (
                    <ToolCallCard
                      key={item.id}
                      params={item.params}
                      toolName={item.toolName}
                    />
                  );
                case 'tool_result':
                  return (
                    <ToolResultDisplay
                      key={item.id}
                      result={item.result}
                      toolName={item.toolName}
                    />
                  );
                default:
                  return null;
              }
            })}
            {isProcessing && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-muted text-muted-foreground p-3 rounded-lg typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
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
            >
              <Paperclip className="h-5 w-5" />
            </Button>
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