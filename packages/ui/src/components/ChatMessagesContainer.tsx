
import { Message } from './Message';
import { useStore } from '../lib/store';
import type { ChatMessage } from '../types/chat';

export function ChatMessagesContainer() {
  const messages = useStore((state) => state.messages as ChatMessage[]);
  const debugLog = useStore((state) => state.debugLog);

  return (
    <div className="flex-1 overflow-y-auto space-y-4">
      {messages.map((msg: ChatMessage) => (
        <Message key={msg.id} message={msg} />
      ))}

      {debugLog.length > 0 && (
        <div className="mt-8 p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-md">
          <h3 className="font-semibold mb-2">Error Log</h3>
          <ul className="list-disc list-inside">
            {debugLog.map((log, index) => (
              <li key={index} className="text-sm">{log}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
