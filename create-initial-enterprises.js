// Script para criar empresas iniciais no Firebase xcortes-e6f64
// Rode este código no console do navegador na página da aplicação

const createInitialEnterprises = async () => {
  console.log("🏗️ CRIANDO EMPRESAS INICIAIS NO FIREBASE xcortes-e6f64");
  console.log("=======================================================");

  try {
    // Configuração Firebase correta
    const firebaseConfig = {
      apiKey: "AIzaSyBYKvlk8ioYDecLYg-yupH1Oyy5U_ury9s",
      authDomain: "xcortes-e6f64.firebaseapp.com",
      projectId: "xcortes-e6f64",
      storageBucket: "xcortes-e6f64.firebasestorage.app",
      messagingSenderId: "1016197568464",
      appId: "1:1016197568464:web:f6ee67ab1ffbdb333d4bd5",
    };

    // Inicializar Firebase
    if (!window.firebase || !window.firebase.apps.length) {
      console.log("🔧 Inicializando Firebase...");
      firebase.initializeApp(firebaseConfig);
    }

    const db = firebase.firestore();

    // Empresas de teste para validação
    const testEnterprises = [
      {
        id: "pablofafstar@gmail.com",
        name: "Barbearia do Pablo",
        email: "pablofafstar@gmail.com",
        phone: "(11) 99999-2222",
        address: "Rua Augusta, 1234 - Consolação, São Paulo - SP",
        displayName: "Barbearia do Pablo",
        description: "Barbearia especializada em cortes modernos",
        photoURL: "",
        active: true,
        blocked: false,
        isActive: true,
        isBlocked: false,
        createdAt: firebase.firestore.Timestamp.now(),
        updatedAt: firebase.firestore.Timestamp.now(),
        settings: {
          workingHours: {
            start: "08:00",
            end: "18:00",
            days: [1, 2, 3, 4, 5, 6],
          },
          appointmentDuration: 30,
          allowOnlineBooking: true,
        },
      },
      {
        id: "empresaadmin@xcortes.com",
        name: "XCorte Admin",
        email: "empresaadmin@xcortes.com",
        phone: "(11) 99999-1111",
        address: "Av. Paulista, 567 - Bela Vista, São Paulo - SP",
        displayName: "XCorte Admin",
        description: "Empresa administrativa do sistema XCorte",
        photoURL: "",
        active: true,
        blocked: false,
        isActive: true,
        isBlocked: false,
        createdAt: firebase.firestore.Timestamp.now(),
        updatedAt: firebase.firestore.Timestamp.now(),
        settings: {
          workingHours: {
            start: "08:00",
            end: "18:00",
            days: [1, 2, 3, 4, 5, 6],
          },
          appointmentDuration: 30,
          allowOnlineBooking: true,
        },
      },
      {
        id: "barbeariamikael@gmail.com",
        name: "Barbearia Mikael",
        email: "barbeariamikael@gmail.com",
        phone: "(11) 98888-7777",
        address: "Rua das Palmeiras, 456 - Vila Madalena, São Paulo - SP",
        displayName: "Barbearia Mikael",
        description: "Barbearia tradicional com atendimento personalizado",
        photoURL: "",
        active: true,
        blocked: false,
        isActive: true,
        isBlocked: false,
        createdAt: firebase.firestore.Timestamp.now(),
        updatedAt: firebase.firestore.Timestamp.now(),
        settings: {
          workingHours: {
            start: "09:00",
            end: "19:00",
            days: [1, 2, 3, 4, 5, 6],
          },
          appointmentDuration: 45,
          allowOnlineBooking: true,
        },
      },
    ];

    console.log("📝 Criando empresas...");

    for (const enterprise of testEnterprises) {
      try {
        console.log(`📝 Criando empresa: ${enterprise.email}`);
        await db
          .collection("enterprises")
          .doc(enterprise.email)
          .set(enterprise);
        console.log(`✅ Empresa criada: ${enterprise.name}`);
      } catch (error) {
        console.error(`❌ Erro ao criar empresa ${enterprise.email}:`, error);
      }
    }

    console.log("\\n🎉 EMPRESAS CRIADAS COM SUCESSO!");
    console.log("=================================");

    // Verificar criação
    console.log("🔍 Verificando empresas criadas...");
    const snapshot = await db.collection("enterprises").get();
    console.log(`📊 Total de empresas: ${snapshot.size}`);

    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`- ${data.name} (${doc.id})`);
    });

    console.log("\\n🧪 PRONTO PARA TESTAR!");
    console.log("======================");
    console.log("Agora você pode testar o CT003-002:");
    console.log("1. Vá para SuperAdmin");
    console.log("2. Clique em 'Nova Empresa'");
    console.log("3. Tente usar um destes emails:");
    console.log("   - pablofafstar@gmail.com");
    console.log("   - empresaadmin@xcortes.com");
    console.log("   - barbeariamikael@gmail.com");
    console.log("4. Deve aparecer: 'Já existe uma empresa com este email'");
  } catch (error) {
    console.error("❌ Erro na inicialização:", error);
  }
};

// Executar automaticamente
createInitialEnterprises();
