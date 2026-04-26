import { useEffect, useState } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging, db, auth } from '../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export function useNotifications() {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const requestPermission = async () => {
    try {
      if (!messaging) return;

      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const currentToken = await getToken(messaging, {
          vapidKey: 'BOGkUhD5U9re0qSmJyTJ5gaO3D117FZNv93kxIH8la-UrwEU7jazgtM3bOetZ0xpZypP639BhObQPnBKaYOvjgo'
        });

        if (currentToken) {
          setToken(currentToken);
          // Store token in Firestore for the current user
          if (auth.currentUser) {
            await setDoc(doc(db, 'fcm_tokens', auth.currentUser.uid), {
              token: currentToken,
              updatedAt: serverTimestamp(),
              email: auth.currentUser.email
            }, { merge: true });
          }
        } else {
          console.warn('No registration token available. Request permission to generate one.');
        }
      }
    } catch (err) {
      console.error('An error occurred while retrieving token. ', err);
      setError(err as Error);
    }
  };

  useEffect(() => {
    if (messaging) {
      onMessage(messaging, (payload) => {
        console.log('Message received. ', payload);
        // Custom logic to show notification when app is in foreground
        if (payload.notification) {
          new Notification(payload.notification.title || 'New Notification', {
            body: payload.notification.body,
            icon: '/logo.svg'
          });
        }
      });
    }
  }, []);

  return { token, error, requestPermission };
}
