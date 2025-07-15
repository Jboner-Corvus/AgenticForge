import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface AccordionProps {
  children: React.ReactNode;
  title: string;
}

export const Accordion: React.FC<AccordionProps> = ({ children, title }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="border-b border-border">
      <button
        className="w-full flex justify-between items-center p-4 text-left font-semibold text-foreground hover:bg-muted focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{title}</span>
        <ChevronDown
          className={`w-5 h-5 transition-transform duration-300 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-screen' : 'max-h-0'
        }`}
      >
        <div className="p-4 pt-0">{children}</div>
      </div>
    </div>
  );
};