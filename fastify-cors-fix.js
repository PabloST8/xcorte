// 🔧 CORREÇÃO PARA SEU SERVIDOR FASTIFY
// Substitua a configuração atual por esta:

async function setupPlugins() {
  await server.register(cors, {
    origin:
      process.env.NODE_ENV === "production"
        ? [
            "https://agendamentos.codxis.com.br",
            "https://xcorte.app.codxis.com.br", // ✅ Seu domínio de produção
            "https://xcortes-e6f64.web.app", // ✅ Firebase (se usar)
            "https://xcortes-e6f64.firebaseapp.com", // ✅ Firebase alternativo
          ]
        : [
            "http://localhost:4000", // ✅ Seu desenvolvimento
            "http://localhost:4001", // ✅ Alternativo
            "http://localhost:3000", // ✅ Alternativo
            "http://127.0.0.1:4000", // ✅ IP local
            "http://127.0.0.1:4001", // ✅ IP local alternativo
          ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // ✅ Métodos explícitos
    allowedHeaders: ["Content-Type", "Authorization"], // ✅ Headers explícitos
  });
}
