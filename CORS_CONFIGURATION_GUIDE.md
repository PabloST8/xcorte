# 🔧 Configuração de CORS - Guia Completo

## 📋 **Cenário Atual**

- **Frontend**: `http://localhost:4000` (desenvolvimento) e `https://xcorte.app.codxis.com.br` (produção)
- **API Local**: `http://localhost:3001` (funcionando com CORS)
- **API Produção**: `https://x-corte-api.codxis.com.br` (precisa configurar CORS)

## 🎯 **Objetivo**

Configurar CORS no servidor Fastify em produção para permitir que o frontend acesse a API.

---

## 🚀 **Soluções**

### **Opção 1: Configurar CORS no Servidor Fastify (Recomendado)**

No seu servidor Fastify em produção (`https://x-corte-api.codxis.com.br`), adicione:

```javascript
// 1. Instalar plugin de CORS
npm install @fastify/cors

// 2. No código do servidor:
import Fastify from 'fastify';

const fastify = Fastify({ logger: true });

// Registrar CORS
await fastify.register(import('@fastify/cors'), {
  origin: [
    'http://localhost:4000',      // Desenvolvimento
    'http://localhost:4001',      // Desenvolvimento alternativo
    'https://xcorte.app.codxis.com.br', // Produção
    'https://xcortes-e6f64.web.app',    // Firebase (se usar)
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
});

// Suas rotas aqui...
fastify.get('/api/bookings', async (request, reply) => {
  // Lógica da API
});
```

### **Opção 2: Configurar Headers Manualmente**

Se não puder instalar plugins, adicione headers manualmente:

```javascript
// Em cada rota do Fastify:
fastify.addHook("onRequest", async (request, reply) => {
  const origin = request.headers.origin;
  const allowedOrigins = [
    "http://localhost:4000",
    "https://xcorte.app.codxis.com.br",
  ];

  if (allowedOrigins.includes(origin)) {
    reply.header("Access-Control-Allow-Origin", origin);
    reply.header("Access-Control-Allow-Credentials", "true");
    reply.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    reply.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
  }
});

// Handler para OPTIONS (preflight)
fastify.options("*", async (request, reply) => {
  reply.status(200).send();
});
```

### **Opção 3: Configurar Nginx/Proxy Reverso**

Se usar Nginx como proxy reverso:

```nginx
server {
    listen 443 ssl;
    server_name x-corte-api.codxis.com.br;

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;

        # CORS Headers
        add_header Access-Control-Allow-Origin "https://xcorte.app.codxis.com.br" always;
        add_header Access-Control-Allow-Origin "http://localhost:4000" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
        add_header Access-Control-Allow-Credentials "true" always;

        # Handle preflight
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }
}
```

---

## 🧪 **Como Testar o CORS**

### **1. Teste via curl:**

```bash
# Teste preflight (OPTIONS)
curl -X OPTIONS \
  -H "Origin: http://localhost:4000" \
  -H "Access-Control-Request-Method: GET" \
  -v https://x-corte-api.codxis.com.br/api/bookings

# Teste request real
curl -X GET \
  -H "Origin: http://localhost:4000" \
  -v https://x-corte-api.codxis.com.br/api/bookings?enterpriseEmail=test@test.com
```

### **2. Teste via JavaScript (Console do navegador):**

```javascript
fetch(
  "https://x-corte-api.codxis.com.br/api/bookings?enterpriseEmail=test@test.com",
  {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }
)
  .then((response) => {
    console.log("✅ CORS funcionando!", response.status);
    return response.json();
  })
  .then((data) => console.log("📊 Dados:", data))
  .catch((error) => console.error("❌ Erro CORS:", error));
```

---

## 🔄 **Migrar para API de Produção**

Depois que o CORS estiver configurado, atualize o frontend:

1. **Abrir arquivo**: `src/services/bookingApiService.js`
2. **Alterar**: `const USE_LOCAL_API = true;`
3. **Para**: `const USE_LOCAL_API = false;`

Ou configure via variável de ambiente:

```bash
# No .env
VITE_USE_LOCAL_API=false
```

---

## ❌ **Troubleshooting**

### **Erro: "has been blocked by CORS policy"**

- ✅ Verificar se o domínio está na lista `origin`
- ✅ Verificar se o servidor Fastify reiniciou após mudanças
- ✅ Limpar cache do navegador

### **Erro: "preflight request failed"**

- ✅ Implementar handler para método OPTIONS
- ✅ Verificar headers `Access-Control-Allow-Methods`
- ✅ Verificar headers `Access-Control-Allow-Headers`

### **Headers não chegam**

- ✅ Verificar se `credentials: true` está configurado
- ✅ Verificar se `Access-Control-Allow-Credentials` está sendo enviado

---

## 🚀 **Próximos Passos**

1. **Configure CORS no servidor Fastify** usando uma das opções acima
2. **Teste com curl** para verificar se está funcionando
3. **Teste no navegador** para confirmar
4. **Atualize o frontend** para usar a API de produção
5. **Monitore logs** para verificar se há outros erros

---

## 📞 **Suporte**

Se precisar de ajuda para implementar no seu servidor específico, me informe:

- Qual tecnologia está usando no servidor (Fastify puro, framework, etc.)
- Se tem acesso ao código do servidor
- Se está usando proxy reverso (Nginx, Apache, etc.)
