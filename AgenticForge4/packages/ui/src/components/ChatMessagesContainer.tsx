
import { Message } from './Message';
import { useStore } from '../lib/store';
import type { ChatMessage } from '../types/chat';

export function ChatMessagesContainer() {
  const messages = useStore((state) => state.messages as ChatMessage[]);

  return (
    <div className="flex-1 p-6 overflow-y-auto space-y-4">
      {messages.map((msg: ChatMessage) => (
        <Message key={msg.id} message={msg} />
      ))}
    </div>
  );
}
