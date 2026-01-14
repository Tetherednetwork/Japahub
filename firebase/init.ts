'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// This holds the initialized services
let firebaseServices: { firebaseApp: FirebaseApp; auth: Auth; firestore: Firestore } | null = null;

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
    // If services are already initialized, return them to ensure singleton pattern.
    if (firebaseServices) {
        return firebaseServices;
    }

    let app: FirebaseApp;
    if (getApps().length === 0) {
        // No apps initialized, so we need to initialize one.
        try {
            // In a Firebase App Hosting environment, this will be automatically configured.
            app = initializeApp();
        } catch (e) {
            // If automatic initialization fails (e.g., in local dev), fall back to config.
            app = initializeApp(firebaseConfig);
        }
    } else {
        // An app is already initialized, so we get it.
        app = getApp();
    }

    // Initialize all the SDKs we need and store them.
    firebaseServices = {
        firebaseApp: app,
        auth: getAuth(app),
        firestore: getFirestore(app),
    };

    return firebaseServices;
}

// This function is kept for compatibility but now just calls the main initializer.
export function getSdks(firebaseApp: FirebaseApp) {
    return initializeFirebase();
}
