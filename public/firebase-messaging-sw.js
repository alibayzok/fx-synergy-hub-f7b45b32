/**
 * Firebase Cloud Messaging - Background Service Worker
 * يُستورد داخل Service Worker الرئيسي عبر importScripts
 */

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBpF4bUl1pbNV0jJhL1yso4dsUxmKhtZig",
  authDomain: "assassin-fx.firebaseapp.com",
  projectId: "assassin-fx",
  storageBucket: "assassin-fx.firebasestorage.app",
  messagingSenderId: "6648159991",
  appId: "1:6648159991:web:2105e88611383d25e7fdf2",
  measurementId: "G-VKXH8EPFN3",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);
  const notification = payload.notification || {};
  self.registration.showNotification(notification.title || 'ASSASSIN FX', {
    body: notification.body || 'لديك إشعار جديد',
    icon: notification.icon || '/favicon.ico',
    badge: '/favicon.ico',
    data: payload.data || {},
    vibrate: [200, 100, 200],
    tag: payload.data?.type || 'general',
    renotify: true,
  });
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if (url !== '/') client.navigate(url);
          return;
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
