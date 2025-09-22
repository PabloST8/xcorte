import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { DataAdapters } from "../utils/dataAdapters";

// Produtos/Serviços como subcoleção: enterprises/{enterpriseEmail}/products
// Campos: name, price (centavos), duration (min), description, category, isActive, createdAt, updatedAt

function collectionRef(enterpriseEmail) {
  return collection(db, "enterprises", enterpriseEmail, "products");
}

export const enterpriseProductFirestoreService = {
  async list(enterpriseEmail) {
    if (!enterpriseEmail) return [];
    const snap = await getDocs(collectionRef(enterpriseEmail));
    return snap.docs.map((d) => {
      const data = d.data();
      // Se o campo id salvo estiver vazio ou inexistente, usar o id real do documento
      const result = { ...data, id: data.id || d.id };

      console.log(
        `[DEBUG] Produto: ${result.name}, Price original:`,
        result.price,
        typeof result.price
      );

      // Garantir que o price está em centavos para compatibilidade
      // Se o price já está em centavos (>= 100), manter como está
      // Se o price está em formato de reais (< 100), converter para centavos
      if (result.price && result.price < 100 && result.price > 0) {
        console.log(`[DEBUG] Convertendo ${result.price} reais para centavos`);
        result.price = Math.round(result.price * 100);
      } else if (result.price && result.price >= 100) {
        console.log(`[DEBUG] Price já está em centavos: ${result.price}`);
      }

      // Adicionar priceInCents para compatibilidade com o frontend
      result.priceInCents = result.price;

      console.log(
        `[DEBUG] Produto: ${result.name}, Price final:`,
        result.price,
        result.priceInCents
      );

      return result;
    });
  },

  async create(enterpriseEmail, rawService) {
    const normalized = DataAdapters.serviceToAPI(rawService);
    // Garantir price em centavos se o usuário digitou número em reais (ex: 30 -> 3000)
    if (
      normalized.price < 100 &&
      rawService.price &&
      Number(rawService.price) === rawService.price
    ) {
      // provável valor em reais sem converter
      normalized.price = Math.round(normalized.price * 100);
    }
    const now = new Date().toISOString();
    normalized.createdAt = now;
    normalized.updatedAt = now;
    // Não persistir campo id vazio dentro do documento para evitar sobrescrever depois
    if (!normalized.id) delete normalized.id;
    const ref = await addDoc(collectionRef(enterpriseEmail), normalized);
    return { ...normalized, id: ref.id };
  },

  async update(enterpriseEmail, serviceId, partial) {
    const normalized = DataAdapters.serviceToAPI({ id: serviceId, ...partial });
    normalized.updatedAt = new Date().toISOString();
    // Não atualizar o campo id interno (desnecessário). Remove para prevenir inconsistências
    if (!normalized.id || normalized.id === serviceId) delete normalized.id;
    const ref = doc(db, "enterprises", enterpriseEmail, "products", serviceId);
    await updateDoc(ref, normalized);
    return { ...normalized, id: serviceId };
  },

  async remove(enterpriseEmail, serviceId) {
    const ref = doc(db, "enterprises", enterpriseEmail, "products", serviceId);
    await deleteDoc(ref);
    return true;
  },
};
