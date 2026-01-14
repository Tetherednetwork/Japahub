
'use client';

import { getStorage, ref, uploadBytes, getDownloadURL, FirebaseStorage } from 'firebase/storage';
import { initializeFirebase } from './index';

let storage: FirebaseStorage;

function getStorageInstance() {
    if (!storage) {
        const { firebaseApp } = initializeFirebase();
        storage = getStorage(firebaseApp);
    }
    return storage;
}

/**
 * Uploads a file to Firebase Storage.
 * @param file The file to upload.
 * @param path The path where the file should be stored in Firebase Storage.
 * @returns A promise that resolves with the public download URL of the uploaded file.
 */
const uploadFile = async (file: File, path: string): Promise<string> => {
  const storageInstance = getStorageInstance();
  const storageRef = ref(storageInstance, path);
  try {
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error(`Error uploading file to ${path}:`, error);
    throw new Error("File upload failed.");
  }
};


/**
 * Uploads an image file to Firebase Storage.
 * @param file The image file to upload.
 * @param path The path where the file should be stored in Firebase Storage (e.g., 'profile-pictures/user123.jpg').
 * @returns A promise that resolves with the public download URL of the uploaded image.
 */
export const uploadImage = async (file: File, path: string): Promise<string> => {
  return uploadFile(file, path);
};

/**
 * Uploads a video file to Firebase Storage.
 * @param file The video file to upload.
 * @param path The path where the file should be stored in Firebase Storage (e.g., 'posts/user123/video.mp4').
 * @returns A promise that resolves with the public download URL of the uploaded video.
 */
export const uploadVideo = async (file: File, path: string): Promise<string> => {
    return uploadFile(file, path);
};
