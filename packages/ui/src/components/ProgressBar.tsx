import React from 'react';

interface ProgressBarProps {
  progress: number; // 0-100
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
      <div
        className="bg-blue-600 h-2.5 rounded-full"
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  );
};
