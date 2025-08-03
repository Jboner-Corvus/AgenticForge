import React from 'react';

export const Logo: React.FC = () => {
  return (
    <div className="flex items-center space-x-2">
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-primary"
      >
        <path d="M14 2L18 6L14 10L10 6L14 2Z" />
        <path d="M10 6L6 2L2 6L6 10L10 6Z" />
        <path d="M14 10L18 14L14 18L10 14L14 10Z" />
        <path d="M10 14L6 18L2 14L6 10L10 14Z" />
      </svg>
      <span className="text-xl font-bold">G-Forge</span>
    </div>
  );
};