#!/bin/bash

# Script de deploy para VPS
# Execute este script na sua VPS após clonar o repositório

set -e  # Para em caso de erro

echo "🚀 Iniciando deploy do XCorte..."

# Variáveis
IMAGE_NAME="xcorte-front"
CONTAINER_NAME="xcorte-container-front"
PORT="4000"

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Inicie o Docker primeiro."
    exit 1
fi

# Parar e remover container existente
echo "⏹️ Verificando e parando container existente..."
if docker ps -a --format "table {{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
    echo "🗑️ Parando container: ${CONTAINER_NAME}"
    docker stop ${CONTAINER_NAME}
    echo "🗑️ Removendo container: ${CONTAINER_NAME}"
    docker rm ${CONTAINER_NAME}
else
    echo "ℹ️ Container ${CONTAINER_NAME} não existe ou já foi removido"
fi
# Remover imagem antiga (opcional)
echo "🧹 Removendo imagem antiga se existir..."
docker rmi ${IMAGE_NAME} 2>/dev/null || echo "ℹ️ Imagem antiga não existe ou já foi removida"

# Fazer build da nova imagem
echo "🔨 Fazendo build da nova imagem..."
if docker build -t ${IMAGE_NAME} .; then
    echo "✅ Build concluído com sucesso"
else
    echo "❌ Erro no build da imagem"
    exit 1
fi

# Executar o novo container
echo "🚀 Iniciando nova instância..."
docker run -d \
  --name ${CONTAINER_NAME} \
  --restart unless-stopped \
  -p ${PORT}:${PORT} \
  ${IMAGE_NAME}

# Aguardar alguns segundos para o container inicializar
echo "⏳ Aguardando inicialização..."
sleep 5

# Verificar se está rodando
echo "✅ Verificando status..."
if docker ps | grep -q ${CONTAINER_NAME}; then
    echo "🎉 Deploy concluído com sucesso!"
    echo "📱 Aplicação disponível em: http://localhost:${PORT}"
    echo "🔍 Para ver logs: docker logs ${CONTAINER_NAME}"
    echo "🔄 Para parar: docker stop ${CONTAINER_NAME}"
    echo "📊 Status do container:"
    docker ps --filter "name=${CONTAINER_NAME}"
else
    echo "❌ Erro: Container não está rodando"
    echo "� Logs do container:"
    docker logs ${CONTAINER_NAME}
    exit 1
fi

echo ""
echo "✨ Deploy finalizado!"
echo "🔧 Comandos úteis:"
echo "   docker logs ${CONTAINER_NAME}           # Ver logs"
echo "   docker stop ${CONTAINER_NAME}           # Parar"
echo "   docker start ${CONTAINER_NAME}          # Iniciar"
echo "   docker restart ${CONTAINER_NAME}        # Reiniciar"
echo "   curl http://localhost:${PORT}           # Testar"

echo "🎯 Deploy finalizado!"
