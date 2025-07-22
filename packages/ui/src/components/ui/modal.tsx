
import React, { useEffect, useRef, useCallback } from 'react';

interface ModalProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

export const Modal: React.FC<ModalProps> = ({ children, isOpen, onClose, title }) => {
  const modalRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const modalElement = modalRef.current;
    if (modalElement) {
      if (isOpen) {
        modalElement.showModal();
      } else {
        modalElement.close();
      }
    }
  }, [isOpen]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.removeEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  return (
    <dialog
      ref={modalRef}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 backdrop:bg-black backdrop:bg-opacity-50"
      onClose={onClose} // Handle closing via escape key or backdrop click
      aria-labelledby="modal-title"
      aria-modal="true"
    >
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md relative">
        <div className="flex justify-between items-center border-b border-gray-700 pb-3 mb-4">
          <h3 id="modal-title" className="text-lg font-semibold text-white">{title}</h3>
          <button
            className="text-gray-400 hover:text-white absolute top-2 right-2 p-2"
            onClick={onClose}
            aria-label="Close modal"
          >
            <span className="sr-only">Close</span>
            &times;
          </button>
        </div>
        <div>{children}</div>
      </div>
    </dialog>
  );
};
