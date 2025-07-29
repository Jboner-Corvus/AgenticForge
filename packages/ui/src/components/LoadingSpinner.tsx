import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className="flex items-center justify-center p-4">
      <Loader2 className={`h-8 w-8 animate-spin text-primary ${className}`} />
      <span className="sr-only">Loading...</span>
    </div>
  );
};
