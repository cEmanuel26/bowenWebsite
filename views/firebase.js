// firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyANAWA2zQbcyWFfDa5tYfLdUjLl-YEzXDM',

  authDomain: 'bowentherapy-42520.firebaseapp.com',

  projectId: 'bowentherapy-42520',

  storageBucket: 'bowentherapy-42520.firebasestorage.app',

  messagingSenderId: '718635625527',

  appId: '1:718635625527:web:b975f17f9453d22991a3b2',

  measurementId: 'G-TBD5KK1YJC',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
