/**
 * Configuração de CORS para servidor Fastify
 *
 * Instruções de uso:
 * 1. Instale o plugin do Fastify: npm install @fastify/cors
 * 2. Adicione esta configuração ao seu servidor Fastify
 * 3. Registre o plugin como mostrado no exemplo abaixo
 */

export const corsConfig = {
  // Métodos permitidos
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],

  // Headers permitidos
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Cache-Control",
    "X-API-Key",
  ],

  // Headers expostos para o cliente
  exposedHeaders: ["X-Total-Count", "X-API-Version"],

  // Permitir credenciais (cookies, auth headers)
  credentials: true,

  // Tempo de cache para preflight (OPTIONS)
  maxAge: 86400, // 24 horas

  // Função para validação dinâmica de origem
  origin: (origin, callback) => {
    // Lista de origens permitidas
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

    // Permitir requests sem origin (ex: aplicativos móveis, Postman)
    if (!origin) return callback(null, true);

    // Verificar se a origem está na lista permitida
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS: Origem não permitida: ${origin}`);
      callback(new Error("Origem não permitida pelo CORS"), false);
    }
  },
};

/**
 * EXEMPLO DE USO NO SERVIDOR FASTIFY:
 *
 * import Fastify from 'fastify';
 * import { corsConfig } from './corsConfig.js';
 *
 * const fastify = Fastify({ logger: true });
 *
 * // Registrar plugin de CORS
 * await fastify.register(import('@fastify/cors'), corsConfig);
 *
 * // Suas rotas aqui...
 * fastify.get('/api/bookings', async (request, reply) => {
 *   // Lógica da API
 * });
 *
 * // Iniciar servidor
 * const start = async () => {
 *   try {
 *     await fastify.listen({ port: 3000, host: '0.0.0.0' });
 *     console.log('🚀 Servidor Fastify rodando na porta 3000');
 *   } catch (err) {
 *     fastify.log.error(err);
 *     process.exit(1);
 *   }
 * };
 * start();
 */

// Configuração simplificada para desenvolvimento
export const corsConfigSimple = {
  origin: true, // Permite todas as origens (APENAS PARA DESENVOLVIMENTO!)
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
