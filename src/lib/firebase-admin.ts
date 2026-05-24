import * as admin from 'firebase-admin';

function getPrivateKey() {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (
    !privateKey ||
    privateKey.length < 1000 ||
    !privateKey.includes('-----BEGIN PRIVATE KEY-----') ||
    !privateKey.includes('-----END PRIVATE KEY-----')
  ) {
    return null;
  }
  return privateKey;
}

function getFirebaseAdminApp() {
  if (admin.apps.length) {
    return admin.app();
  }

  const privateKey = getPrivateKey();
  const isConfigured =
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    privateKey;

  if (!isConfigured) {
    return null;
  }

  try {
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
    return null;
  }
}

export function getFirebaseAuth() {
  const app = getFirebaseAdminApp();
  return app ? admin.auth(app) : null;
}

export function getFirebaseDb() {
  const app = getFirebaseAdminApp();
  return app ? admin.firestore(app) : null;
}
