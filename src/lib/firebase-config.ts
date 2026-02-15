/**
 * Firebase Configuration for FCM Push Notifications
 * 
 * يجب إعداد هذه القيم من Firebase Console:
 * Project Settings > General > Your apps > Firebase SDK snippet
 */

// Firebase config - يجب تعبئتها من Firebase Console
export const firebaseConfig = {
  apiKey: "AIzaSyBpF4bUl1pbNV0jJhL1yso4dsUxmKhtZig",
  authDomain: "assassin-fx.firebaseapp.com",
  projectId: "assassin-fx",
  storageBucket: "assassin-fx.firebasestorage.app",
  messagingSenderId: "6648159991",
  appId: "1:6648159991:web:2105e88611383d25e7fdf2",
  measurementId: "G-VKXH8EPFN3",
};

// VAPID Key for web push - from Firebase Console > Cloud Messaging > Web Push certificates
export const vapidKey = "BIbi_hjNzFp6kfD3cWlRAhxHM3e7_XBGcpWRL8vtUD_gftuvgvvTQyRZlZWKDkPoC81VkR30mXbDkXYWkcqNNZE";

/**
 * التحقق من إعداد Firebase
 */
export function isFirebaseConfigured(): boolean {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId &&
    vapidKey
  );
}
