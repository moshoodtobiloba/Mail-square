import { useState, useCallback, useEffect } from 'react';

interface AppNotification {
  id: string;
  title: string;
  desc: string;
  type: 'info' | 'success' | 'alert';
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [error, setError] = useState<string | null>(null);

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      setError("This browser does not support desktop notification");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setError(null);
    } else {
      setError("Permission denied");
    }
  }, []);

  const addNotification = useCallback((notification: Omit<AppNotification, 'id'>) => {
    const id = Date.now().toString();
    const newNotif = { ...notification, id };
    setNotifications(prev => [...prev, newNotif]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
    
    // Browser notification
    if (document.hidden && Notification.permission === 'granted') {
      try {
        new Notification(newNotif.title, { body: newNotif.desc });
      } catch (e) {
        console.error("Browser notification failed", e);
      }
    }
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return { notifications, addNotification, clearNotifications, requestPermission, error, token: null };
}
