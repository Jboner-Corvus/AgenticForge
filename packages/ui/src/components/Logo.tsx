import React from 'react';

interface LogoProps {
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({ showText = true, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8', 
    lg: 'w-10 h-10'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Logo Wolf SVG basé sur title.png */}
      <svg
        className={`${sizeClasses[size]} text-primary`}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Forme de loup stylisée inspirée du logo */}
        <path 
          d="M100 20 L140 40 L160 80 L180 120 L160 140 L140 160 L100 180 L60 160 L40 140 L20 120 L40 80 L60 40 L100 20 Z" 
          stroke="currentColor" 
          strokeWidth="3" 
          fill="none"
        />
        <path 
          d="M80 60 L100 80 L120 60" 
          stroke="currentColor" 
          strokeWidth="2" 
          fill="none"
        />
        <circle cx="85" cy="70" r="3" fill="currentColor" />
        <circle cx="115" cy="70" r="3" fill="currentColor" />
        <path 
          d="M90 100 L100 110 L110 100" 
          stroke="currentColor" 
          strokeWidth="2" 
          fill="none"
        />
        {/* Détails géométriques */}
        <path 
          d="M70 90 L100 120 L130 90" 
          stroke="currentColor" 
          strokeWidth="2" 
          fill="none"
        />
        <path 
          d="M60 130 L100 150 L140 130" 
          stroke="currentColor" 
          strokeWidth="2" 
          fill="none"
        />
      </svg>
      {showText && (
        <span className={`${textSizeClasses[size]} font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent`}>
          AgenticForge
        </span>
      )}
    </div>
  );
};