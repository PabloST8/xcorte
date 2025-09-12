# 🚀 Dockerfile para XCorte - React App com Vite
# Configurado para expor na porta 4000

# Usar Node.js 18 Alpine para menor tamanho
FROM node:18-alpine

# Definir diretório de trabalho
WORKDIR /app

# Instalar dependências do sistema necessárias
RUN apk add --no-cache \
    git \
    curl

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production && \
    npm cache clean --force

# Copiar código fonte
COPY . .

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Mudar proprietário dos arquivos
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expor a porta 4000
EXPOSE 4000

# Definir variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=4000
ENV HOST=0.0.0.0

# Comando de saúde para verificar se a aplicação está rodando
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:4000 || exit 1

# Comando para iniciar a aplicação
CMD ["npm", "run", "dev", "--", "--port", "4000", "--host", "0.0.0.0"]