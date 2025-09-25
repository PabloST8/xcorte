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
 * Persiste metadados da foto do funcionário em Firestore (enterprises/{enterpriseEmail}/employees/{staffId}).
 * Campos: photoURL, photoPath, photoVersion, photoUpdatedAt
 */
const staffPhotoService = {
  /**
   * Atualiza o documento do funcionário com os dados da nova foto
   * @param {string} enterpriseEmail - Email da empresa
   * @param {string} staffId - ID do funcionário
   * @param {{ url: string, path: string }} photo - Dados retornados do upload
   */
  async setStaffPhoto(enterpriseEmail, staffId, photo) {
    console.log("📸 staffPhotoService.setStaffPhoto chamado:", {
      enterpriseEmail,
      staffId,
      photo,
    });

    if (!enterpriseEmail) throw new Error("enterpriseEmail obrigatório");
    if (!staffId) throw new Error("staffId obrigatório");
    if (!photo?.url) throw new Error("URL da foto obrigatória");

    // Usar o email do funcionário como ID do documento na coleção employees
    // Se staffId não for um email, precisamos do email do funcionário
    const employeeEmail = staffId.includes("@") ? staffId : staffId; // Assumir que staffId é o email
    const ref = doc(db, "employees", employeeEmail);
    const version = Date.now();

    console.log("📸 Referência do documento:", ref.path);
    console.log("📸 Version gerada:", version);

    // Garante que o doc existe
    const snap = await getDoc(ref);
    console.log("📸 Documento existe?", snap.exists());

    if (!snap.exists()) {
      console.log("📸 Criando documento do funcionário...");
      await setDoc(
        ref,
        {
          id: String(staffId),
          enterpriseEmail: enterpriseEmail,
        },
        { merge: true }
      );
    }

    console.log("📸 Atualizando documento com metadados da foto...");

    // Preparar dados para atualização, removendo campos undefined
    const updateData = {
      photoURL: photo.url,
      photoVersion: version,
      photoUpdatedAt: serverTimestamp(),
      // Manter também o campo avatarUrl para compatibilidade
      avatarUrl: photo.url,
    };

    // Só incluir photoPath se ele existir
    if (photo.path) {
      updateData.photoPath = photo.path;
    }

    await updateDoc(ref, updateData);

    console.log(
      "📸 Metadados da foto do funcionário salvos com sucesso no Firestore"
    );

    return {
      photoURL: photo.url,
      photoPath: photo.path,
      photoVersion: version,
      avatarUrl: photo.url,
    };
  },

  /**
   * Remove metadados de foto do funcionário no Firestore
   * (não deleta o arquivo do Storage)
   */
  async clearStaffPhoto(enterpriseEmail, staffId) {
    console.log("📸 staffPhotoService.clearStaffPhoto chamado:", {
      enterpriseEmail,
      staffId,
    });

    if (!staffId) throw new Error("staffId obrigatório");

    // Usar o email do funcionário como ID do documento
    const employeeEmail = staffId.includes("@") ? staffId : staffId;
    const ref = doc(db, "employees", employeeEmail);
    await updateDoc(ref, {
      photoURL: deleteField(),
      photoPath: deleteField(),
      photoVersion: deleteField(),
      photoUpdatedAt: serverTimestamp(),
      avatarUrl: deleteField(),
    });
    return true;
  },

  /**
   * Carrega metadados de foto do funcionário do Firestore
   */
  async getStaffPhoto(enterpriseEmail, staffId) {
    console.log("📸 staffPhotoService.getStaffPhoto chamado:", {
      enterpriseEmail,
      staffId,
    });

    if (!staffId) return null;

    try {
      // Usar o email do funcionário como ID do documento
      const employeeEmail = staffId.includes("@") ? staffId : staffId;
      const ref = doc(db, "employees", employeeEmail);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        console.log("📸 Documento do funcionário não encontrado");
        return null;
      }

      const data = snap.data();
      console.log("📸 Dados do funcionário encontrados:", data);

      if (data.photoURL) {
        let versioned = data.photoURL;
        if (data.photoVersion) {
          try {
            const u = new URL(data.photoURL);
            u.searchParams.set("v", String(data.photoVersion));
            versioned = u.toString();
          } catch {
            versioned = `${data.photoURL}${
              data.photoURL.includes("?") ? "&" : "?"
            }v=${data.photoVersion}`;
          }
        }

        return {
          photoURL: versioned,
          photoPath: data.photoPath,
          photoVersion: data.photoVersion,
          avatarUrl: versioned,
        };
      }

      return null;
    } catch (error) {
      console.error("📸 Erro ao buscar foto do funcionário:", error);
      return null;
    }
  },
};

export default staffPhotoService;
