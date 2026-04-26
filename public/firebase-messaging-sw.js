// importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
// importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// For modern modular SDK in SW, we usually use a build tool or CDN
// Here we'll use the compat version for simplicity in the SW environment

importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBlvzT1OlUN6HfE5H4ODY-4-Yt62GzOXWw",
  authDomain: "mailsquare-9db8c.firebaseapp.com",
  projectId: "mailsquare-9db8c",
  storageBucket: "mailsquare-9db8c.firebasestorage.app",
  messagingSenderId: "200883317402",
  appId: "1:200883317402:web:99785d1bcc708a5ae64d23"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.svg'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
