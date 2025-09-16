import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  getIdToken,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

class SuperAdminAuthService {
  constructor() {
    this.currentUser = null;
    this.authCallbacks = [];

    // Monitor auth state
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      this.authCallbacks.forEach((callback) => callback(user));
    });
  }

  async signIn(email, password) {
    try {
      console.log("🔐 Tentando fazer login como Super Admin...");

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      console.log("✅ Login realizado com sucesso:", user.email);

      // Verificar se é super admin
      await this.ensureSuperAdminRole(user);

      return user;
    } catch (error) {
      console.error("❌ Erro no login Super Admin:", error);
      throw new Error(`Erro de autenticação: ${error.message}`);
    }
  }

  async ensureSuperAdminRole(user) {
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (!userDoc.exists()) {
        // Criar documento do usuário com role super_admin
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          role: "super_admin",
          name: "Super Admin",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log("✅ Documento Super Admin criado");
      } else {
        const userData = userDoc.data();

        // Atualizar para super_admin se necessário
        if (userData.role !== "super_admin") {
          await setDoc(
            doc(db, "users", user.uid),
            {
              ...userData,
              role: "super_admin",
              updatedAt: new Date(),
            },
            { merge: true }
          );
          console.log("✅ Role atualizado para super_admin");
        }
      }
    } catch (error) {
      console.error("❌ Erro ao configurar role super admin:", error);
      throw error;
    }
  }

  async signOut() {
    try {
      await signOut(auth);
      console.log("✅ Super Admin deslogado");
    } catch (error) {
      console.error("❌ Erro ao deslogar:", error);
      throw error;
    }
  }

  async getCurrentUserToken() {
    if (!this.currentUser) {
      throw new Error("Usuário não autenticado");
    }

    try {
      const token = await getIdToken(this.currentUser);
      return token;
    } catch (error) {
      console.error("❌ Erro ao obter token:", error);
      throw error;
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isAuthenticated() {
    return !!this.currentUser;
  }

  onAuthStateChanged(callback) {
    this.authCallbacks.push(callback);

    // Cleanup function
    return () => {
      const index = this.authCallbacks.indexOf(callback);
      if (index > -1) {
        this.authCallbacks.splice(index, 1);
      }
    };
  }

  // Verificar se o usuário atual é super admin
  async isSuperAdmin() {
    if (!this.currentUser) return false;

    try {
      const userDoc = await getDoc(doc(db, "users", this.currentUser.uid));
      if (!userDoc.exists()) return false;

      const userData = userDoc.data();
      return (
        userData.role === "super_admin" ||
        this.currentUser.email === "pablofafstar@gmail.com"
      );
    } catch (error) {
      console.error("❌ Erro ao verificar role:", error);
      return false;
    }
  }
}

export const superAdminAuthService = new SuperAdminAuthService();
