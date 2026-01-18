// Firebase configuration for AfterHour
import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';

// AfterHour Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBjRyTaqk7f7x17UwSxG0JHEBLxIuaBOfc",
    authDomain: "afterhours-bd73e.firebaseapp.com",
    projectId: "afterhours-bd73e",
    storageBucket: "afterhours-bd73e.firebasestorage.app",
    messagingSenderId: "802683658779",
    appId: "1:802683658779:web:c141f97a1551f6f3cc0ebe",
    measurementId: "G-759FYBB4ZX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export { RecaptchaVerifier, signInWithPhoneNumber };
export type { ConfirmationResult };
