import { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '../store';

export const useResizablePanel = (initialControlPanelWidth: number) => {
  const [controlPanelWidth, setControlPanelWidth] = useState(initialControlPanelWidth);
  const isResizingControlPanel = useRef(false);
  const isResizingCanvas = useRef(false);
  const canvasWidth = useStore(state => state.canvasWidth);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingControlPanel.current) {
        const newWidth = e.clientX;
        if (newWidth > 100 && newWidth < window.innerWidth / 2) {
          setControlPanelWidth(newWidth);
        }
      } else if (isResizingCanvas.current) {
        const newWidth = window.innerWidth - e.clientX;
        const maxWidth = Math.min(800, window.innerWidth * 0.6);
        if (newWidth >= 300 && newWidth <= maxWidth) {
          useStore.getState().setCanvasWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      isResizingControlPanel.current = false;
      isResizingCanvas.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleMouseDownControlPanel = (e: React.MouseEvent) => {
    isResizingControlPanel.current = true;
    e.preventDefault();
  };

  const handleMouseDownCanvas = (e: React.MouseEvent) => {
    isResizingCanvas.current = true;
    e.preventDefault();
  };

  return {
    controlPanelWidth,
    setControlPanelWidth,
    canvasWidth,
    setCanvasWidth: useStore.getState().setCanvasWidth,
    handleMouseDownControlPanel,
    handleMouseDownCanvas,
  };
};