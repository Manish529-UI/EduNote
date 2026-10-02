
import { initializeApp } from "firebase/app";
import {getAuth, GoogleAuthProvider} from "firebase/auth"

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: window.location.hostname || "edunote-23aed.firebaseapp.com",
  projectId: "edunote-23aed",
  storageBucket: "edunote-23aed.firebasestorage.app",
  messagingSenderId: "606246396553",
  appId: "1:606246396553:web:690db55d42a53fb1619c58"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app)

const provider = new GoogleAuthProvider()

export {auth , provider}