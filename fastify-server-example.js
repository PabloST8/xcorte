/**
 * Exemplo de servidor Fastify com CORS configurado
 *
 * Para usar no seu servidor em produção:
 * 1. npm install fastify @fastify/cors
 * 2. Copie este código para seu servidor
 * 3. Configure as variáveis de ambiente
 * 4. Execute: node fastify-server.js
 */

import Fastify from "fastify";

const fastify = Fastify({
  logger: {
    level: "info",
    transport: {
      target: "pino-pretty",
    },
  },
});

// Configuração de CORS
await fastify.register(import("@fastify/cors"), {
  origin: (origin, callback) => {
    const allowedOrigins = [
      "http://localhost:4000",
      "http://localhost:4001",
      "http://localhost:3000",
      "http://127.0.0.1:4000",
      "http://127.0.0.1:4001",
      "http://127.0.0.1:3000",
      "https://xcorte.app.codxis.com.br",
      "https://x-corte.codxis.com.br",
      "https://xcortes-e6f64.web.app",
      "https://xcortes-e6f64.firebaseapp.com",
    ];

    // Permitir requests sem origin (aplicativos móveis, Postman, etc)
    if (!origin) {
      fastify.log.info("📱 Request sem origin - permitido");
      return callback(null, true);
    }

    // Verificar se a origem está permitida
    if (allowedOrigins.includes(origin)) {
      fastify.log.info(`✅ CORS permitido para: ${origin}`);
      callback(null, true);
    } else {
      fastify.log.warn(`🚫 CORS negado para: ${origin}`);
      callback(new Error("Origem não permitida pelo CORS"), false);
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Cache-Control",
    "X-API-Key",
  ],
  credentials: true,
  maxAge: 86400, // 24 horas
});

// Middleware de logging para debug
fastify.addHook("onRequest", async (request, reply) => {
  fastify.log.info(
    {
      method: request.method,
      url: request.url,
      origin: request.headers.origin,
      userAgent: request.headers["user-agent"],
    },
    "Incoming request"
  );
});

// Hook para adicionar headers de debug
fastify.addHook("onSend", async (request, reply, payload) => {
  reply.header("X-API-Version", "1.0.0");
  reply.header("X-Powered-By", "Fastify");
  return payload;
});

// Rota de health check
fastify.get("/health", async (request, reply) => {
  return {
    status: "ok",
    timestamp: new Date().toISOString(),
    cors: "enabled",
  };
});

// Rota de teste de CORS
fastify.get("/api/cors-test", async (request, reply) => {
  return {
    message: "CORS está funcionando!",
    origin: request.headers.origin || "No origin",
    timestamp: new Date().toISOString(),
  };
});

// Rota principal de bookings
fastify.get("/api/bookings", async (request, reply) => {
  const { enterpriseEmail, date, status } = request.query;

  fastify.log.info(
    {
      enterpriseEmail,
      date,
      status,
      origin: request.headers.origin,
    },
    "Buscando agendamentos"
  );

  // Aqui você conectaria com seu banco de dados
  // Por enquanto, retorno de exemplo
  return {
    success: true,
    data: [],
    total: 0,
    timestamp: new Date().toISOString(),
    source: "fastify-api",
    query: { enterpriseEmail, date, status },
  };
});

// Rota POST para criar agendamentos
fastify.post("/api/bookings", async (request, reply) => {
  const bookingData = request.body;

  fastify.log.info(
    {
      bookingData,
      origin: request.headers.origin,
    },
    "Criando novo agendamento"
  );

  // Aqui você salvaria no banco de dados
  // Por enquanto, retorno de exemplo
  return {
    success: true,
    message: "Agendamento criado com sucesso",
    data: {
      id: "booking_" + Date.now(),
      ...bookingData,
      createdAt: new Date().toISOString(),
    },
  };
});

// Handler de erro global
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);

  // Erro de CORS
  if (error.message.includes("CORS")) {
    reply.status(403).send({
      error: "CORS_ERROR",
      message: "Origem não permitida",
      origin: request.headers.origin,
    });
    return;
  }

  // Outros erros
  reply.status(500).send({
    error: "INTERNAL_ERROR",
    message: "Erro interno do servidor",
  });
});

// Iniciar o servidor
const start = async () => {
  try {
    const port = process.env.PORT || 3000;
    const host = process.env.HOST || "0.0.0.0";

    await fastify.listen({ port, host });

    fastify.log.info(`
🚀 Servidor Fastify iniciado!
📡 URL: http://${host}:${port}
🔐 CORS: Habilitado
📋 Rotas disponíveis:
   - GET  /health
   - GET  /api/cors-test  
   - GET  /api/bookings
   - POST /api/bookings
    `);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
