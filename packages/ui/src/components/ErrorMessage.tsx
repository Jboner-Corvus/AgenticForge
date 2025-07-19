import React from 'react';
import { ErrorMessage as ErrorMessageType } from '../types/chat';

export const ErrorMessage: React.FC<{ content: ErrorMessageType['content'] }> = ({ content }) => (
    <div className="my-2 animate-fade-in">
        <div className="bg-destructive/10 p-3 rounded-lg">
            <p className="text-sm text-destructive">{content}</p>
        </div>
    </div>
);
