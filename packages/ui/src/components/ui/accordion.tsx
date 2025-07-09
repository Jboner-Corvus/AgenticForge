
import React, { useState } from 'react';

interface AccordionProps {
  children: React.ReactNode;
  title: string;
}

export const Accordion: React.FC<AccordionProps> = ({ children, title }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="border-b border-gray-600">
      <button
        className="w-full flex justify-between items-center p-2 text-left font-medium text-gray-300 hover:bg-gray-700"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{title}</span>
        <span>{isOpen ? '−' : '+'}</span>
      </button>
      {isOpen && <div className="p-2">{children}</div>}
    </div>
  );
};
