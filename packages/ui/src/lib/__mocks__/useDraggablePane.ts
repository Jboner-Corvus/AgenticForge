export const useDraggablePane = vi.fn().mockReturnValue({
  handleDragStart: vi.fn(),
  height: 300,
  isDragging: false,
});

export const useDraggableSidebar = vi.fn().mockReturnValue({
  handleDragStart: vi.fn(),
  width: 320,
  isDragging: false,
});