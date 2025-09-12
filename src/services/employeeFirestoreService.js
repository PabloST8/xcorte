import { db } from "./firebase";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";

// Coleção raiz: employees
// Schema:
// id (doc id = email ou auto)
// name, email, phone, enterpriseEmail, position, isActive, createdAt, updatedAt, avatarUrl
// skills: [ { productId, productName, canPerform, estimatedDuration, experienceLevel } ]
// workSchedule: { monday: { isWorking, startTime, endTime }, ... }

export const employeeFirestoreService = {
  async list(enterpriseEmail) {
    const q = query(
      collection(db, "employees"),
      where("enterpriseEmail", "==", enterpriseEmail)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  async create(data) {
    const id = data.email; // usar email como id para fácil consulta
    const ref = doc(db, "employees", id);
    const payload = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(ref, payload);
    return { id, ...data };
  },

  async get(id) {
    const snap = await getDocs(
      query(collection(db, "employees"), where("email", "==", id))
    );
    if (!snap.empty) {
      const d = snap.docs[0];
      return { id: d.id, ...d.data() };
    }
    return null;
  },

  async update(id, data) {
    const ref = doc(db, "employees", id);
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
    return { id, ...data };
  },

  async remove(id) {
    const ref = doc(db, "employees", id);
    await deleteDoc(ref);
    return true;
  },
};
