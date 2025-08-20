import React, { useEffect } from 'react';
import { useCanvasStore } from '../store/canvasStore';

const TodoListHandler: React.FC = () => {
  const addCanvasToHistory = useCanvasStore((state) => state.addCanvasToHistory);
  
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'todo_list') {
        console.log('📝 [TodoListHandler] Todo list data received:', event.data);
        
        // Add todo list to canvas history
        const title = event.data.data?.title || `Todo List ${new Date().toLocaleTimeString()}`;
        const content = JSON.stringify(event.data.data);
        addCanvasToHistory(title, content, 'json');
      }
    };
    
    // Add event listener for todo list messages
    window.addEventListener('message', handleMessage);
    
    // Clean up event listener on unmount
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [addCanvasToHistory]);
  
  return null; // This component doesn't render anything
};

export default TodoListHandler;