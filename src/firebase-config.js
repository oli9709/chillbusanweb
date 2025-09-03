import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBz5li490b2Hy50EUEVcQqkxMzI8eYFmEo",
  authDomain: "chilltours-web.firebaseapp.com",
  projectId: "chilltours-web",
  storageBucket: "chilltours-web.firebasestorage.app",
  messagingSenderId: "804760219885",
  appId: "1:804760219885:web:11dada464f60c65e8bdce4",
  measurementId: "G-CPY35E4DNR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app); 