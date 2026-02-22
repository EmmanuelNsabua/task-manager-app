// ==========================================================================
// AUTH SERVICE — Firebase Authentication
// ==========================================================================

import { auth, googleProvider } from './firebaseConfig.js'
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js"

// --- Sign Up ---
export async function signUp(email, password, fullName) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    // Set display name
    await updateProfile(userCredential.user, { displayName: fullName })
    return userCredential.user
}

// --- Log In ---
export async function logIn(email, password) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return userCredential.user
}

// --- Google Sign In ---
export async function googleSignIn() {
    const result = await signInWithPopup(auth, googleProvider)
    return result.user
}

// --- Log Out ---
export async function logOut() {
    await signOut(auth)
    localStorage.removeItem('taskflow_user')
    localStorage.removeItem('activeView')
}

// --- Auth State Listener ---
export function onAuthChange(callback) {
    return onAuthStateChanged(auth, (user) => {
        if (user) {
            // Cache user data locally
            localStorage.setItem('taskflow_user', JSON.stringify({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || user.email?.split('@')[0] || 'User',
                photoURL: user.photoURL
            }))
        } else {
            localStorage.removeItem('taskflow_user')
        }
        callback(user)
    })
}

// --- Get Current User ---
export function getCurrentUser() {
    return auth.currentUser
}

// --- Get Cached User (sync, for quick access) ---
export function getCachedUser() {
    try {
        return JSON.parse(localStorage.getItem('taskflow_user'))
    } catch {
        return null
    }
}
