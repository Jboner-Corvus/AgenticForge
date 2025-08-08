
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
        if (!modalElement.open) {
          modalElement.showModal();
        }
      } else {
        if (modalElement.open) {
          modalElement.close();
        }
      }
    }
  }, [isOpen]);

  const handleBackdropClick = useCallback((event: React.MouseEvent<HTMLDialogElement>) => {
    if (event.target === modalRef.current) {
      onClose();
    }
  }, [onClose]);

  return (
    <dialog
      ref={modalRef}
      onClose={onClose}
      onClick={handleBackdropClick}
      className="bg-card text-card-foreground rounded-lg shadow-xl p-6 w-full max-w-md relative backdrop:bg-black backdrop:bg-opacity-50"
      aria-labelledby="modal-title"
      aria-modal="true"
    >
      <div className="flex justify-between items-center border-b border-border pb-3 mb-4">
        <h3 id="modal-title" className="text-lg font-semibold">{title}</h3>
        <button
          className="text-muted-foreground hover:text-card-foreground absolute top-2 right-2 p-2"
          onClick={onClose}
          aria-label="Close modal"
        >
          <span className="sr-only">Close</span>
          &times;
        </button>
      </div>
      <div>{children}</div>
    </dialog>
  );
};
