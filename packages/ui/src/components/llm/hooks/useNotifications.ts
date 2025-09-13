import { useState, useCallback } from 'react';

export interface NotificationProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

export interface UseNotificationsReturn {
  notifications: Array<NotificationProps & { id: string }>;
  addNotification: (notification: NotificationProps) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

/**
 * Hook pour gérer les notifications dans l'application
 */
export const useNotifications = (): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<
    Array<NotificationProps & { id: string }>
  >([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const addNotification = useCallback(
    (notification: NotificationProps) => {
      const id = Math.random().toString(36).substring(2, 9);
      const notificationWithId = { ...notification, id };

      setNotifications((prev) => [...prev, notificationWithId]);

      // Auto-remove après la durée spécifiée
      const duration = notification.duration || 5000;
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    },
    [removeNotification],
  );

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
  };
};
