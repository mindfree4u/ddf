import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyB9wQ0GKE_hF3y_-7qPkJfyibsmAVq7pDM",
  authDomain: "drum-playground.firebaseapp.com",
  projectId: "drum-playground",
  storageBucket: "drum-playground.firebasestorage.app",
  messagingSenderId: "262246327304",
  appId: "1:262246327304:web:a1850c57d79bc81f721dbd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

// 결제 알림 이메일 전송 함수
export const sendPaymentNotification = httpsCallable(functions, 'sendPaymentNotification');

export { auth, db, storage }; 