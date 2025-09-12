import { storage } from "./firebase";
import { firebaseAuthService } from "./firebaseAuthService";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Uploads a File/Blob and returns the public URL
export async function uploadImage(file, { folder = "uploads", name } = {}) {
  if (!file) throw new Error("Arquivo inválido");
  // Make sure there's a Firebase auth context
  await firebaseAuthService.ensureAnonymous();
  const safeName =
    name ||
    `${Date.now()}-${Math.random().toString(36).slice(2)}-${
      file.name || "image"
    }`;
  const path = `${folder}/${safeName}`;
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  const url = await getDownloadURL(snapshot.ref);
  return { url, path };
}

// Helper to build user/staff folders
export const storagePaths = {
  userAvatar: (userId) => `avatars/users/${userId}.jpg`,
  staffAvatar: (email) => `avatars/staff/${email}.jpg`,
};
