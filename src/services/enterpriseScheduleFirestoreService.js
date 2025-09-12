// Skeleton para escalas/schedules em subcoleção enterprises/{enterpriseEmail}/schedules
import { db } from "./firebase";
import { collection, getDocs } from "firebase/firestore";

function schedulesRef(email) {
  return collection(db, "enterprises", email, "schedules");
}

export const enterpriseScheduleFirestoreService = {
  async list(enterpriseEmail) {
    if (!enterpriseEmail) return [];
    const snap = await getDocs(schedulesRef(enterpriseEmail));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },
};
