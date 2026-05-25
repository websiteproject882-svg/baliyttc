import * as admin from 'firebase-admin';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';

type FirebaseDecodedToken = {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
};

const firebaseJwks = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'),
);

function cleanEnv(value: string | undefined) {
  return value?.replace(/\\r/g, '').replace(/\r/g, '').replace(/^["']|["']$/g, '').trim();
}

function getProjectId() {
  return cleanEnv(process.env.FIREBASE_PROJECT_ID) || cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
}

function getPrivateKey() {
  const privateKey = cleanEnv(process.env.FIREBASE_PRIVATE_KEY)?.replace(/\\n/g, '\n');
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
  const projectId = getProjectId();
  const clientEmail = cleanEnv(process.env.FIREBASE_CLIENT_EMAIL);
  const isConfigured =
    projectId &&
    clientEmail &&
    privateKey;

  if (!isConfigured) {
    return null;
  }

  try {
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
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

function decodedPayloadToFirebaseToken(payload: JWTPayload): FirebaseDecodedToken {
  const uid = typeof payload.sub === 'string' ? payload.sub : '';
  const email = typeof payload.email === 'string' ? payload.email : undefined;
  const name = typeof payload.name === 'string' ? payload.name : undefined;
  const picture = typeof payload.picture === 'string' ? payload.picture : undefined;
  return { uid, email, name, picture };
}

export async function verifyFirebaseIdToken(idToken: string): Promise<FirebaseDecodedToken | null> {
  const firebaseAuth = getFirebaseAuth();
  if (firebaseAuth) {
    return firebaseAuth.verifyIdToken(idToken);
  }

  const projectId = getProjectId();
  if (!projectId) {
    return null;
  }

  const { payload } = await jwtVerify(idToken, firebaseJwks, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  });

  const decodedToken = decodedPayloadToFirebaseToken(payload);
  return decodedToken.uid ? decodedToken : null;
}

export function getFirebaseDb() {
  const app = getFirebaseAdminApp();
  return app ? admin.firestore(app) : null;
}
