import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

const metaEnv = (import.meta as any).env || {};

function getActiveFirebaseConfig() {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('CUSTOM_FIREBASE_CONFIG');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.projectId) {
          return {
            config: {
              apiKey: parsed.apiKey || firebaseConfig.apiKey,
              authDomain: parsed.authDomain || `${parsed.projectId}.firebaseapp.com`,
              projectId: parsed.projectId,
              storageBucket: parsed.storageBucket || `${parsed.projectId}.appspot.com`,
              messagingSenderId: parsed.messagingSenderId || firebaseConfig.messagingSenderId || '',
              appId: parsed.appId || firebaseConfig.appId || '',
            },
            databaseId: parsed.databaseId || firebaseConfig.firestoreDatabaseId || '(default)',
            isCustom: true
          };
        }
      } catch (e) {
        console.warn('Invalid CUSTOM_FIREBASE_CONFIG in localStorage:', e);
      }
    }
  }

  return {
    config: {
      apiKey: metaEnv.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
      authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
      projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
      storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
      messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
      appId: metaEnv.VITE_FIREBASE_APP_ID || firebaseConfig.appId,
    },
    databaseId: metaEnv.VITE_FIREBASE_DATABASE_ID || firebaseConfig.firestoreDatabaseId || '(default)',
    isCustom: Boolean(metaEnv.VITE_FIREBASE_PROJECT_ID)
  };
}

const activeSetup = getActiveFirebaseConfig();
const config = activeSetup.config;
const databaseId = activeSetup.databaseId;

export const isUsingCustomFirebase = activeSetup.isCustom;
export const currentProjectId = config.projectId;

const app = initializeApp(config);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, databaseId);
export const auth = getAuth();
export const googleProvider = new GoogleAuthProvider();
export { signInWithPopup, signInWithRedirect, getRedirectResult };

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error Details: ', JSON.stringify(errInfo));
  // We log the error instead of throwing it to prevent the entire app from crashing.
  // This allows the UI to at least render, while developers can check logs.
}
