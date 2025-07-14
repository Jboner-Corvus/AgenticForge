import React from 'react';
import { ErrorMessage as ErrorMessageType } from '../types/chat';

export const ErrorMessage: React.FC<{ content: ErrorMessageType['content'] }> = ({ content }) => (
    <div className="my-2">
        <div className="bg-red-100 dark:bg-red-900 p-2 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">{content}</p>
        </div>
    </div>
);
