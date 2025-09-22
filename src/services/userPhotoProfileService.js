import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  deleteField,
} from "firebase/firestore";
import { db } from "./firebase";

/**
 * Persiste metadados da foto do usuário em Firestore (users/{userId}).
 * Campos: photoURL, photoPath, photoVersion, photoUpdatedAt
 */
export const userPhotoProfileService = {
  /**
   * Atualiza o documento do usuário com os dados da nova foto
   * @param {string} userId - ID do usuário (telefone puro)
   * @param {{ url: string, path: string }} photo - Dados retornados do upload
   */
  async setUserPhoto(userId, photo) {
    console.log("📸 userPhotoProfileService.setUserPhoto chamado:", {
      userId,
      photo,
    });

    if (!userId) throw new Error("userId obrigatório");
    if (!photo?.url || !photo?.path) throw new Error("Dados da foto inválidos");

    const ref = doc(db, "users", String(userId));
    const version = Date.now();

    console.log("📸 Referência do documento:", ref.path);
    console.log("📸 Version gerada:", version);

    // Garante que o doc existe
    const snap = await getDoc(ref);
    console.log("📸 Documento existe?", snap.exists());

    if (!snap.exists()) {
      console.log("📸 Criando documento do usuário...");
      await setDoc(ref, { id: String(userId) }, { merge: true });
    }

    console.log("📸 Atualizando documento com metadados da foto...");
    await updateDoc(ref, {
      photoURL: photo.url,
      photoPath: photo.path,
      photoVersion: version,
      photoUpdatedAt: serverTimestamp(),
    });

    console.log("📸 Metadados salvos com sucesso no Firestore");

    return {
      photoURL: photo.url,
      photoPath: photo.path,
      photoVersion: version,
    };
  },

  /**
   * Remove metadados de foto do usuário no Firestore
   * (não deleta o arquivo do Storage)
   */
  async clearUserPhoto(userId) {
    if (!userId) throw new Error("userId obrigatório");
    const ref = doc(db, "users", String(userId));
    await updateDoc(ref, {
      photoURL: deleteField(),
      photoPath: deleteField(),
      photoVersion: deleteField(),
      photoUpdatedAt: serverTimestamp(),
    });
    return true;
  },
};
