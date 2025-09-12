#!/bin/bash

# Script de deploy para VPS
# Execute este script na sua VPS após clonar o repositório

set -e  # Para em caso de erro

echo "🚀 Iniciando deploy do XCorte..."

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Inicie o Docker primeiro."
    exit 1
fi

# Parar e remover containers existentes com nomes relacionados
echo "⏹️ Verificando e parando containers existentes..."
CONTAINERS=$(docker ps -aq --filter "name=xcorte" --filter "ancestor=xcorte-frontend" --filter "ancestor=vite-frontend")
if [ ! -z "$CONTAINERS" ]; then
    echo "🗑️ Parando containers: $CONTAINERS"
    docker stop $CONTAINERS 2>/dev/null || true
    docker rm $CONTAINERS 2>/dev/null || true
    echo "✅ Containers removidos"
else
    echo "ℹ️ Nenhum container relacionado encontrado"
fi

# Remover imagens antigas (opcional - descomente se quiser)
echo "🧹 Limpando imagens antigas..."
docker rmi xcorte-frontend vite-frontend 2>/dev/null || true

# Fazer build da nova imagem
echo "🔨 Fazendo build da nova imagem..."
if docker build -t xcorte-frontend .; then
    echo "✅ Build concluído com sucesso"
else
    echo "❌ Erro no build da imagem"
    exit 1
fi

# Executar o novo container
echo "🚀 Iniciando nova instância..."
docker run -d \
  --name xcorte-app \
  --restart unless-stopped \
  -p 4000:4000 \
  xcorte-frontend

# Aguardar alguns segundos para o container inicializar
echo "⏳ Aguardando inicialização..."
sleep 5

# Verificar se está rodando
echo "✅ Verificando status..."
if docker ps | grep -q xcorte-app; then
    echo "🎉 Deploy concluído com sucesso!"
    echo "📱 Aplicação disponível em: http://$(curl -s ifconfig.me):4000"
    echo "🔍 Para ver logs: docker logs xcorte-app"
    echo "🔄 Para acompanhar logs: docker logs -f xcorte-app"
    echo "⏹️ Para parar: docker stop xcorte-app"
else
    echo "❌ Erro no deploy. Verificando logs..."
    docker logs xcorte-app || true
    exit 1
fi

echo "🎯 Deploy finalizado!"
