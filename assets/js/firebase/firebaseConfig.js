// ==========================================================================
// FIREBASE CONFIGURATION — Auth Only (Free Spark Plan)
// ==========================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js"
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js"

const firebaseConfig = {
    apiKey: "AIzaSyBdy3BVASQUSpMo0F7ebQztu6YKeaBoG8I",
    authDomain: "taskflow-e8993.firebaseapp.com",
    projectId: "taskflow-e8993",
    storageBucket: "taskflow-e8993.firebasestorage.app",
    messagingSenderId: "312150649794",
    appId: "1:312150649794:web:4763a035b4dbfb6e9fc45b",
    measurementId: "G-NDVQZ6QKP6"
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const googleProvider = new GoogleAuthProvider()

export { app, auth, googleProvider }
