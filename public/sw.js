/**
 * ============================================================
 * Service Worker - ASSASSIN FX
 * ============================================================
 * 
 * يدير:
 * - Firebase Cloud Messaging (FCM)
 * - Push Notifications
 * - Background Sync (مستقبلاً)
 * 
 * ============================================================
 */

// Import Firebase Messaging SW
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Initialize Firebase in Service Worker
firebase.initializeApp({
  apiKey: "AIzaSyBpF4bUl1pbNV0jJhL1yso4dsUxmKhtZig",
  authDomain: "assassin-fx.firebaseapp.com",
  projectId: "assassin-fx",
  storageBucket: "assassin-fx.firebasestorage.app",
  messagingSenderId: "6648159991",
  appId: "1:6648159991:web:2105e88611383d25e7fdf2",
  measurementId: "G-VKXH8EPFN3",
});

// Enable background messaging
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

const CACHE_NAME = 'assassin-fx-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(clients.claim());
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Push received:', event);
  
  let notificationData = {
    title: 'ASSASSIN FX',
    body: 'لديك إشعار جديد',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: {}
  };

  if (event.data) {
    try {
      const data = event.data.json();
      const notification = data.notification || {};
      notificationData = {
        title: notification.title || notificationData.title,
        body: notification.body || notificationData.body,
        icon: notification.icon || notificationData.icon,
        badge: notificationData.badge,
        data: data.data || {}
      };
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      data: notificationData.data,
      vibrate: [200, 100, 200],
      tag: notificationData.data?.type || 'general',
      renotify: true,
      requireInteraction: false
    })
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if (url !== '/') {
            client.navigate(url);
          }
          return;
        }
      }
      
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Background sync (for future use)
self.addEventListener('sync', (event) => {
  console.log('Background sync:', event.tag);
});
