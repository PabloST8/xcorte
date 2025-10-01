// Script de debug para verificar usuários com fotos no Firestore
console.log("🔍 Verificando usuários no Firestore...");

// No console do navegador, execute:
// window.debugUserPhotos()

window.debugUserPhotos = async () => {
  const { db } = await import("./src/services/firebase.js");
  const { collection, getDocs, doc, getDoc } = await import(
    "firebase/firestore"
  );

  console.log("📋 Listando usuários...");

  // Verificar se existe usuário Pablo Felipe
  try {
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);

    console.log(`👥 Total de usuários encontrados: ${snapshot.size}`);

    snapshot.forEach((doc) => {
      const userData = doc.data();
      console.log(`👤 Usuário: ${doc.id}`, {
        name: userData.name,
        phone: userData.phone,
        email: userData.email,
        photoURL: userData.photoURL,
        hasPhoto: !!userData.photoURL,
      });
    });

    // Verificar especificamente Pablo Felipe
    const pabloEmails = [
      "pablofafstar@gmail.com",
      "88994464373", // telefone como ID
    ];

    for (const id of pabloEmails) {
      try {
        const userDoc = await getDoc(doc(db, "users", id));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log(`🎯 Encontrado usuário ${id}:`, userData);
        } else {
          console.log(`❌ Usuário ${id} não encontrado`);
        }
      } catch (error) {
        console.log(`❌ Erro ao buscar ${id}:`, error);
      }
    }
  } catch (error) {
    console.error("❌ Erro ao buscar usuários:", error);
  }
};

console.log(
  "✅ Script carregado. Execute window.debugUserPhotos() no console."
);
