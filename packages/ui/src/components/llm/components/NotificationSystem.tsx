import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import type { NotificationProps } from '../hooks/useNotifications';

interface NotificationSystemProps {
  notifications: Array<NotificationProps & { id: string }>;
  onRemoveNotification: (id: string) => void;
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({
  notifications,
  onRemoveNotification,
}) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className={`p-4 rounded-lg shadow-lg border max-w-sm ${
              notification.type === 'success'
                ? 'bg-green-900/90 border-green-700 text-green-100'
                : notification.type === 'error'
                ? 'bg-red-900/90 border-red-700 text-red-100'
                : notification.type === 'warning'
                ? 'bg-yellow-900/90 border-yellow-700 text-yellow-100'
                : 'bg-blue-900/90 border-blue-700 text-blue-100'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                {notification.type === 'success' && (
                  <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                )}
                {notification.type === 'error' && (
                  <XCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                )}
                {notification.type === 'warning' && (
                  <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                )}
                {notification.type === 'info' && (
                  <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <h4 className="font-semibold text-sm">{notification.title}</h4>
                  <p className="text-sm opacity-90 mt-1">{notification.message}</p>
                </div>
              </div>
              <button
                onClick={() => onRemoveNotification(notification.id)}
                className="text-current opacity-70 hover:opacity-100 ml-2"
              >
                ×
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationSystem;