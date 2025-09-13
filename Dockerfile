# 🚀 Dockerfile para XCorte - React App com Vite
# Configurado para expor na porta 4000
# Atualizado em 13/09/2025 com Node.js 22 LTS
# Multi-stage build para otimização

# Estágio 1: Build
FROM node:22-alpine AS builder

# Definir diretório de trabalho
WORKDIR /app

# Instalar dependências do sistema necessárias para build
RUN apk add --no-cache \
    git \
    python3 \
    make \
    g++

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar todas as dependências (incluindo devDependencies)
RUN npm ci

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Estágio 2: Produção
FROM node:22-alpine AS production

# Definir diretório de trabalho
WORKDIR /app

# Instalar dependências do sistema mínimas
RUN apk add --no-cache \
    curl \
    dumb-init

# Instalar serve globalmente para servir arquivos estáticos
RUN npm install -g serve

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && \
    adduser -S xcorte -u 1001

# Copiar build da aplicação do estágio anterior
COPY --from=builder --chown=xcorte:nodejs /app/dist ./dist

# Mudar para usuário não-root
USER xcorte

# Expor a porta 4000
EXPOSE 4000

# Definir variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=4000
ENV HOST=0.0.0.0

# Comando de saúde para verificar se a aplicação está rodando
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:4000 || exit 1

# Usar dumb-init para gerenciamento de processos
ENTRYPOINT ["dumb-init", "--"]

# Comando para servir a aplicação buildada com serve (otimizado para produção)
CMD ["serve", "-s", "dist", "-l", "4000", "--no-clipboard", "--no-port-switching"]