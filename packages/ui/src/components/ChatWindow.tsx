import React, { useCallback, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { useAgentStream } from '../lib/hooks/useAgentStream';
import { useStore } from '../lib/store';
import { fr } from '../constants/fr';
import { ThoughtBubble } from './ThoughtBubble';
import { ToolCallCard } from './ToolCallCard';
import { ToolResultDisplay } from './ToolResultDisplay';
import { Avatar } from './ui/avatar';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Textarea } from './ui/textarea';

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

  const handleMessageInputChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageInputValue(event.target.value);
  }, [setMessageInputValue]);

  return (
    <main className="flex-1 p-4 flex flex-col bg-background">
      <Card className="flex-1 flex flex-col bg-secondary border-border text-foreground">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          <section aria-live="assertive" className="space-y-4">
            {displayItems.map((item, index) => {
              switch (item.type) {
                case 'agent_response':
                  return (
                    <div className={`flex items-start gap-4 ${item.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`} key={index}>
                      {item.sender === 'assistant' && <Avatar sender="assistant" />}
                      <div className={`max-w-[70%] p-3 rounded-lg ${item.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                        <div className="message-content prose prose-invert">
                          {item.sender === 'assistant' ? (
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {item.content}
                            </ReactMarkdown>
                          ) : (
                            item.content
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{new Date().toLocaleTimeString()}</div>
                      </div>
                      {item.sender === 'user' && <Avatar sender="user" />}
                    </div>
                  );
                case 'agent_thought':
                  return <ThoughtBubble content={item.content} key={index} />;
                case 'tool_call':
                  return <ToolCallCard key={index} params={item.params} toolName={item.toolName} />;
                case 'tool_result':
                  return <ToolResultDisplay key={index} result={item.result} toolName={item.toolName} />;
                default:
                  return null;
              }
            })}
            {isProcessing && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-muted text-muted-foreground p-3 rounded-lg typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
          </section>
        </CardContent>
        <div className="p-4 border-t border-border">
          <form className="flex items-center space-x-2" onSubmit={handleSendMessage}>
            <Button aria-label="Attach file" className="text-muted-foreground hover:text-foreground" type="button" variant="ghost">
              <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.49"></path></svg>
            </Button>
            <Textarea
              aria-label="Message input field"
              className="flex-1 bg-input border-border text-foreground placeholder-muted-foreground resize-none overflow-hidden"
              disabled={!authToken || !sessionId || isProcessing || !serverHealthy}
              id="messageInput"
              onInput={handleMessageInputChange}
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
                <svg className="lucide lucide-square-x" fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><rect height="18" rx="2" ry="2" width="18" x="3" y="3"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
              </Button>
            ) : (
              <Button
                aria-label="Send Message"
                className="bg-primary hover:bg-primary/80 text-primary-foreground"
                disabled={!authToken || !sessionId || isProcessing || !serverHealthy}
                type="submit"
              >
                <svg className="lucide lucide-send" fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
              </Button>
            )}
          </form>
        </div>
      </Card>
    </main>
  );
}
