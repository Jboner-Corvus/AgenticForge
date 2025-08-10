import { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '../store';

export const useResizablePanel = (initialControlPanelWidth: number) => {
  const [controlPanelWidth, setControlPanelWidth] = useState(initialControlPanelWidth);
  const isResizingControlPanel = useRef(false);
  const isResizingCanvas = useRef(false);
  const setCanvasWidth = useStore(state => state.setCanvasWidth);
  const canvasWidth = useStore(state => state.canvasWidth);

  const handleMouseDownControlPanel = useCallback((e: React.MouseEvent) => {
    isResizingControlPanel.current = true;
    e.preventDefault();
  }, []);

  const handleMouseDownCanvas = useCallback((e: React.MouseEvent) => {
    isResizingCanvas.current = true;
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isResizingControlPanel.current) {
      const newWidth = e.clientX;
      if (newWidth > 100 && newWidth < window.innerWidth / 2) {
        setControlPanelWidth(newWidth);
      }
    } else if (isResizingCanvas.current) {
      const newWidth = window.innerWidth - e.clientX;
      const maxWidth = Math.min(800, window.innerWidth * 0.6);
      if (newWidth >= 300 && newWidth <= maxWidth) {
        setCanvasWidth(newWidth);
      }
    }
  }, [setCanvasWidth]);

  const handleMouseUp = useCallback(() => {
    isResizingControlPanel.current = false;
    isResizingCanvas.current = false;
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return {
    controlPanelWidth,
    setControlPanelWidth,
    canvasWidth,
    setCanvasWidth,
    handleMouseDownControlPanel,
    handleMouseDownCanvas,
  };
};