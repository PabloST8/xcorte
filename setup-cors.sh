#!/bin/bash

# Script para configurar CORS no Firebase Storage
# Resolve problemas de CORS policy no upload de fotos

echo "🔧 Configurando CORS para Firebase Storage..."

# Verificar se gsutil está instalado
if ! command -v gsutil &> /dev/null; then
    echo "❌ gsutil não encontrado. Instalando Google Cloud SDK..."
    echo "Por favor, instale o Google Cloud SDK:"
    echo "https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Bucket do projeto
BUCKET="xcortes-e6f64.appspot.com"

echo "📦 Bucket: gs://$BUCKET"

# Verificar se o arquivo cors.json existe
if [ ! -f "cors.json" ]; then
    echo "📝 Criando arquivo cors.json..."
    cat > cors.json << EOF
[
  {
    "origin": ["*"],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "Authorization", "Range"]
  }
]
EOF
fi

echo "📋 Configuração CORS:"
cat cors.json

# Aplicar CORS
echo "🚀 Aplicando configuração CORS..."
gsutil cors set cors.json gs://$BUCKET

if [ $? -eq 0 ]; then
    echo "✅ CORS configurado com sucesso!"
    echo "🔍 Verificando configuração..."
    gsutil cors get gs://$BUCKET
else
    echo "❌ Erro ao configurar CORS"
    echo "💡 Soluções alternativas:"
    echo "1. Verificar permissões no Google Cloud Console"
    echo "2. Usar firebase login para autenticar"
    echo "3. Configurar CORS via Console do Firebase"
fi

echo "🌐 Testando conectividade..."
curl -I https://firebasestorage.googleapis.com/v0/b/$BUCKET/o

echo "📊 Diagnóstico concluído!"