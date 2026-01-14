
'use client';

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, getFirestore, serverTimestamp, writeBatch, Timestamp } from 'firebase/firestore';
import { initializeFirebase } from '../index';
import { UserProfile } from '@/lib/types';
import { generateUsernameSuggestions } from '@/lib/username';

const { firebaseApp: app } = initializeFirebase();
const auth = getAuth(app);
const db = getFirestore(app);

export const isUsernameAvailable = async (username: string): Promise<boolean> => {
  const usernameDocRef = doc(db, 'usernames', username.toLowerCase());
  const docSnap = await getDoc(usernameDocRef);
  return !docSnap.exists();
};


const createProfileInFirestore = async (user: User, additionalData: Partial<UserProfile> = {}) => {
  const userProfileRef = doc(db, 'users', user.uid);

  // Use set with merge: true. This is idempotent.
  // It creates the doc if it doesn't exist, or merges data if it does.
  // This gracefully handles both initial sign-up and subsequent sign-ins.
  try {
    const docSnap = await getDoc(userProfileRef);

    if (!docSnap.exists()) {
      // --- This is a brand new user, create the full profile ---
      const isAdmin = user.email === 'folarin@supportnex.co.uk';

      const nameParts = user.displayName?.split(' ') || [];
      const googleFirstName = nameParts[0] || '';
      const googleLastName = nameParts.slice(1).join(' ') || '';

      let finalUsername = additionalData.username || user.email?.split('@')[0] || `user${user.uid.substring(0, 5)}`;
      if (!additionalData.username) {
        let isAvailable = await isUsernameAvailable(finalUsername);
        let attempts = 0;
        while (!isAvailable && attempts < 5) {
          finalUsername = `${finalUsername}${(Math.floor(Math.random() * 900) + 100)}`;
          isAvailable = await isUsernameAvailable(finalUsername);
          attempts++;
        }
        if (!isAvailable) {
          finalUsername = `user${user.uid}` // fallback to UID based username
        }
      } else {
        const isAvailable = await isUsernameAvailable(finalUsername);
        if (!isAvailable) {
          throw new Error('Username is already taken.');
        }
      }

      const newUserProfile: Omit<UserProfile, 'id'> = {
        displayName: user.displayName || `${additionalData.firstName} ${additionalData.lastName}` || 'Anonymous',
        username: finalUsername,
        firstName: additionalData.firstName || googleFirstName,
        lastName: additionalData.lastName || googleLastName,
        email: user.email || '',
        avatar: user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`,
        isVerified: user.emailVerified,
        role: isAdmin ? 'admin' : 'user',
        verificationLevel: 'unverified',
        createdAt: serverTimestamp() as unknown as Timestamp,
        country: additionalData.country || '',
        city: additionalData.city || '',
        phoneNumber: additionalData.phoneNumber || '',
        ...additionalData,
      };

      const batch = writeBatch(db);
      batch.set(userProfileRef, newUserProfile);
      const usernameDocRef = doc(db, 'usernames', finalUsername.toLowerCase());
      batch.set(usernameDocRef, { userId: user.uid });
      await batch.commit();

    } else {
      // --- User exists, just merge new provider data ---
      await setDoc(userProfileRef, {
        displayName: user.displayName || docSnap.data().displayName,
        email: user.email,
        avatar: user.photoURL || docSnap.data().avatar,
        isVerified: user.emailVerified,
      }, { merge: true });
    }

    return { data: 'User profile handled successfully.' };

  } catch (error: any) {
    console.error("Error creating/updating user profile in Firestore: ", error);
    return { error };
  }
};


export const signUpWithEmail = async (email: string, password: string, firstName: string, lastName: string, username: string, city: string, phoneNumber: string, country: string) => {

  // First, check if username is available before creating user
  const isAvailable = await isUsernameAvailable(username);
  if (!isAvailable) {
    return { error: { message: 'Username is already taken.' } };
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const displayName = `${firstName} ${lastName}`;

    // Update Firebase Auth profile
    await updateProfile(user, { displayName });

    // Send verification email
    await sendEmailVerification(user);

    // Create user profile in Firestore (this will also handle the username doc)
    const profileResult = await createProfileInFirestore(user, { firstName, lastName, username, city, phoneNumber, displayName, country });

    if (profileResult.error) {
      // If profile creation fails, we should probably delete the auth user to allow retry
      await user.delete();
      throw profileResult.error;
    }

    return { data: user };
  } catch (error: any) {
    // Make sure to return a consistent error object shape
    return { error: { message: error.message || "An unknown error occurred during sign-up." } };
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    await createProfileInFirestore(userCredential.user);
    return { data: userCredential.user };
  } catch (error: any) {
    return { error };
  }
};

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    await createProfileInFirestore(user, { displayName: user.displayName || '' });
    return { data: user };
  } catch (error: any) {
    return { error };
  }
};

export const signOutUser = async () => {
  try {
    await signOut(auth);
    return { data: 'User signed out successfully.' };
  } catch (error: any) {
    return { error };
  }
};

export const resendVerificationEmail = async () => {
  const user = auth.currentUser;
  if (user) {
    try {
      await sendEmailVerification(user);
      return { data: 'Verification email sent.' };
    } catch (error: any) {
      return { error };
    }
  }
  return { error: new Error('No user is currently signed in.') };
};

export const sendPasswordResetLink = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { data: 'Password reset email sent.' };
  } catch (error: any) {
    return { error };
  }
};
