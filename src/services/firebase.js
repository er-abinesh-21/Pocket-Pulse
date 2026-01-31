import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration from environment variables
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Validate Firebase configuration
export const validateFirebaseConfig = () => {
    const requiredFields = ['apiKey', 'authDomain', 'projectId', 'appId'];
    const missingFields = requiredFields.filter(field => !firebaseConfig[field]);

    if (missingFields.length > 0) {
        console.error('Missing Firebase configuration fields:', missingFields);
        console.error('Please check your .env file and ensure all VITE_FIREBASE_* variables are set correctly.');
        return false;
    }
    return true;
};

// Initialize Firebase with error handling
let app, auth, db, googleProvider;

try {
    if (validateFirebaseConfig()) {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        googleProvider = new GoogleAuthProvider();

        console.log('Firebase initialized successfully');
        console.log('Project ID:', firebaseConfig.projectId);
        console.log('Auth Domain:', firebaseConfig.authDomain);
    } else {
        throw new Error('Invalid Firebase configuration');
    }
} catch (error) {
    console.error('Firebase initialization error:', error);
    console.error('Firebase Config:', firebaseConfig);
}

export { app, auth, db, googleProvider, firebaseConfig };
