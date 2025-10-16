let firestore: any = null;
let initPromise: Promise<void> | null = null;

// Check if Firebase environment variables are available (lazy evaluation)
function hasFirebaseConfig() {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  );
}

async function initializeFirebase(): Promise<void> {
  if (!hasFirebaseConfig()) {
    console.warn('⚠️ Firebase environment variables not configured');
    console.warn('   Required: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
    return;
  }

  try {
    const admin = await import('firebase-admin');
    
    // Parse the private key properly
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (privateKey) {
      // Handle both escaped and unescaped newlines
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    };

    if (!admin.default.apps.length) {
      console.log('🔥 Initializing Firebase Admin SDK...');
      admin.default.initializeApp({
        credential: admin.default.credential.cert(serviceAccount),
      });
      console.log('✅ Firebase Admin SDK initialized successfully');
    }

    firestore = admin.default.firestore();
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack available',
    });
    firestore = null;
  }
}

// Initialize Firebase on import if config is available
if (hasFirebaseConfig()) {
  initPromise = initializeFirebase();
}

// Export a function to get firestore (ensuring initialization is complete)
export async function getFirestore() {
  // If no init promise exists and config is available, start initialization
  if (!initPromise && hasFirebaseConfig()) {
    initPromise = initializeFirebase();
  }
  
  if (initPromise) {
    await initPromise;
  }
  return firestore;
}

// Export firestore instance (could be null if not configured)
export { firestore };

// Export a function to check if Firebase is available
export const isFirebaseAvailable = () => firestore !== null;
