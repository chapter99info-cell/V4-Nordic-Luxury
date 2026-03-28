import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, clearIndexedDbPersistence } from 'firebase/firestore';
import { getMessaging } from 'firebase/messaging';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

const config = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string) || firebaseConfig.apiKey,
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) || firebaseConfig.authDomain,
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) || firebaseConfig.projectId,
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) || firebaseConfig.storageBucket,
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || firebaseConfig.messagingSenderId,
  appId: (import.meta.env.VITE_FIREBASE_APP_ID as string) || firebaseConfig.appId,
  measurementId: (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string) || firebaseConfig.measurementId,
};

const app = initializeApp(config);

const databaseId = (import.meta.env.VITE_FIREBASE_DATABASE_ID as string) || 
  (config.projectId === firebaseConfig.projectId ? firebaseConfig.firestoreDatabaseId : '(default)');

const firestoreSettings = {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  experimentalForceLongPolling: true
};

export const db = (databaseId && databaseId !== '(default)') 
  ? initializeFirestore(app, firestoreSettings, databaseId)
  : initializeFirestore(app, firestoreSettings);

// เพิ่มบรรทัดนี้เข้าไปชั่วคราวเพื่อล้างข้อมูลที่ค้างอยู่ค่ะ
clearIndexedDbPersistence(db).catch((err) => {
  console.error("Could not clear persistence:", err);
});

export const auth = getAuth(app);
export const messaging = getMessaging(app);
export const storage = getStorage(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
  FETCH_STAFF = 'FETCH_STAFF',
  FETCH_SERVICES = 'FETCH_SERVICES',
  FETCH_BOOKINGS = 'FETCH_BOOKINGS',
  FETCH_WEB_BOOKINGS = 'FETCH_WEB_BOOKINGS',
  CREATE_BOOKING = 'CREATE_BOOKING',
  CREATE_CLEANING = 'CREATE_CLEANING',
}

// ใช้ any เพื่อปิดปากระบบตรวจคำผิด ไม่ให้มันบ่นอีก
export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any; 
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
