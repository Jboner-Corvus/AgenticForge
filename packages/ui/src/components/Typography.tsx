import React from 'react';

interface TypographyProps {
  variant: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'small';
  children: React.ReactNode;
  className?: string;
}

export const Typography: React.FC<TypographyProps> = ({ variant, children, className }) => {
  const getTypographyClass = () => {
    switch (variant) {
      case 'h1':
        return 'text-4xl font-bold';
      case 'h2':
        return 'text-3xl font-bold';
      case 'h3':
        return 'text-2xl font-bold';
      case 'h4':
        return 'text-xl font-bold';
      case 'p':
        return 'text-base';
      case 'small':
        return 'text-sm';
      default:
        return 'text-base';
    }
  };

  const Tag = variant === 'p' ? 'p' : variant;

  return (
    <Tag className={`${getTypographyClass()} ${className}`}>
      {children}
    </Tag>
  );
};