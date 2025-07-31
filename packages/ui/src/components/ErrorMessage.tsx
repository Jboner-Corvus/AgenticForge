import React from 'react';
import type { ErrorMessage as ErrorMessageType } from '../types/chat';

export const ErrorMessage: React.FC<{ content: ErrorMessageType['content'] }> = ({ content }) => (
    <div className="animate-fade-in" role="alert">
        <div className="bg-destructive/10 p-3 rounded-xl shadow-sm">
            <p className="text-sm text-destructive">{content}</p>
        </div>
    </div>
);
