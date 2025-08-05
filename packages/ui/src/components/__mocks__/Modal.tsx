import React, { useEffect, useRef } from 'react';

interface ModalProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

export const Modal: React.FC<ModalProps> = ({ children, isOpen, onClose, title }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const modalElement = modalRef.current;
    if (modalElement) {
      // Add mock functions to avoid errors
      if (!(modalElement as unknown as Record<string, unknown>).showModal) {
        (modalElement as unknown as Record<string, unknown>).showModal = () => {};
      }
      if (!(modalElement as unknown as Record<string, unknown>).close) {
        (modalElement as unknown as Record<string, unknown>).close = () => {};
      }
      if (!(modalElement as unknown as Record<string, unknown>).open) {
        (modalElement as unknown as Record<string, unknown>).open = isOpen;
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md relative backdrop:bg-black backdrop:bg-opacity-50">
        <div className="flex justify-between items-center border-b border-gray-700 pb-3 mb-4">
          <h3 id="modal-title" className="text-lg font-semibold text-white">{title}</h3>
          <button
            className="text-gray-400 hover:text-white absolute top-2 right-2 p-2"
            onClick={onClose}
            aria-label="Close modal"
          >
            <span className="sr-only">Close</span>
            ×
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};