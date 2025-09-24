import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
const firebaseConfig = {
  apiKey: process.env.REACT_APP_KEY_FIREBASE,
  authDomain: "tripmaster-14702.firebaseapp.com",
  projectId: "tripmaster-14702",
  storageBucket: "tripmaster-14702.firebasestorage.app",
  messagingSenderId: "90099423431",
  appId: "1:90099423431:web:0ad469404341e0df9bc6e2",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
