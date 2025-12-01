// frontend/firebase/client.js
import { initializeApp } from "firebase/app";
import {
    getAuth,
    RecaptchaVerifier,
    signInWithPhoneNumber,
} from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MSID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
auth.useDeviceLanguage();

const storage = getStorage(app);

export { auth, RecaptchaVerifier, signInWithPhoneNumber, storage };
