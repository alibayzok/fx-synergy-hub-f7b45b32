/**
 * Firebase Configuration for FCM Push Notifications
 * 
 * يجب إعداد هذه القيم من Firebase Console:
 * Project Settings > General > Your apps > Firebase SDK snippet
 */

// Firebase config - يجب تعبئتها من Firebase Console
export const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};

// VAPID Key for web push - from Firebase Console > Cloud Messaging > Web Push certificates
export const vapidKey = "";

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
