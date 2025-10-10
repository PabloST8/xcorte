// Script para criar empresas de teste no Firestore
// Rode este script no console do navegador na página SuperAdmin

const createTestEnterprises = async () => {
  console.log("🏗️ Criando empresas de teste no Firestore...");

  // Acessar o Firestore através do módulo disponível
  const { db } = await import("./src/services/firebase.js");
  const { doc, setDoc, Timestamp } = await import("firebase/firestore");

  const testEnterprises = [
    {
      id: "pablofafstar@gmail.com",
      name: "Barbearia do Pablo",
      email: "pablofafstar@gmail.com",
      phone: "(11) 99999-2222",
      address: "Rua Augusta, 1234 - Consolação, São Paulo - SP",
      description: "Barbearia do Pablo",
      displayName: "Barbearia do Pablo",
      photoURL: "",
      active: true,
      blocked: false,
      isActive: true,
      isBlocked: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
    {
      id: "empresaadmin@xcortes.com",
      name: "XCorte Admin",
      email: "empresaadmin@xcortes.com",
      phone: "(11) 99999-1111",
      address: "Av. Paulista, 567 - Bela Vista, São Paulo - SP",
      description: "Empresa Admin XCortes",
      displayName: "XCorte Admin",
      photoURL: "",
      active: true,
      blocked: false,
      isActive: true,
      isBlocked: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
  ];

  for (const enterprise of testEnterprises) {
    try {
      console.log(`📝 Criando empresa: ${enterprise.email}`);
      const enterpriseRef = doc(db, "enterprises", enterprise.email);
      await setDoc(enterpriseRef, enterprise);
      console.log(`✅ Empresa criada: ${enterprise.name}`);
    } catch (error) {
      console.error(`❌ Erro ao criar empresa ${enterprise.email}:`, error);
    }
  }

  console.log("🎉 Empresas de teste criadas no Firestore!");
  console.log("🧪 Agora teste criar uma empresa com email duplicado!");
};

// Exportar para uso no console
window.createTestEnterprises = createTestEnterprises;
