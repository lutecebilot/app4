// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getAuth,signOut} from 'firebase/auth';
import 'firebase/compat/storage'
import firebase from  'firebase/compat/app';
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCj2i3qGTHwMOcd4Bb4PaVRz-fXXdSjDu4",
  authDomain: "inventaire-87c90.firebaseapp.com",
  projectId: "inventaire-87c90",
  storageBucket: "inventaire-87c90.appspot.com",
  messagingSenderId: "654905249075",
  appId: "1:654905249075:web:bc3d72432c0598793c0246"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
export const FIREBASE_APP = initializeApp(firebaseConfig);
export const FIREBASE_AUTH = getAuth(FIREBASE_APP);
export const FIREBASE_STORAGE= firebase.storage();
export const FIREBASE_DATABASE=getFirestore(FIREBASE_APP);
export const signOutUser = () => {
    return signOut(FIREBASE_AUTH);
  };