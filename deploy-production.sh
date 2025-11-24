#!/bin/bash

# Script para fazer deploy em produção com configurações corretas para Firebase
# Garante que as fotos funcionem em https://agendamentos.codxis.com.br

echo "🚀 Iniciando deploy de produção..."

# 1. Build do projeto
echo "📦 Building projeto..."
npm run build

# 2. Verificar se arquivo de configuração existe
echo "🔧 Verificando configuração de produção..."
if [ ! -f "src/config/productionFirebase.js" ]; then
    echo "❌ Erro: Arquivo de configuração de produção não encontrado!"
    exit 1
fi

# 3. Verificar configurações Firebase
echo "🔍 Validando configurações Firebase..."
if grep -q "xcortes-e6f64.firebasestorage.app" src/config/productionFirebase.js; then
    echo "✅ Bucket Firebase correto encontrado"
else
    echo "⚠️ Aviso: Bucket Firebase pode estar incorreto"
fi

# 4. Criar arquivo de ambiente para produção
echo "📝 Criando .env para produção..."
cat > .env.production << EOL
VITE_FIREBASE_API_KEY=AIzaSyBYKvlk8ioYDecLYg-yupH1Oyy5U_ury9s
VITE_FIREBASE_AUTH_DOMAIN=xcortes-e6f64.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=xcortes-e6f64
VITE_FIREBASE_STORAGE_BUCKET=xcortes-e6f64.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1016197568464
VITE_FIREBASE_APP_ID=1:1016197568464:web:f6ee67ab1ffbdb333d4bd5
EOL

echo "✅ Arquivo .env.production criado"

# 5. Verificar se CORS está configurado
echo "🌐 Verificando CORS..."
echo "Execute o seguinte comando se necessário:"
echo "gsutil cors set cors.json gs://xcortes-e6f64.firebasestorage.app"

# 6. Logs de debug
echo "🐛 Configurações para debug:"
echo "- URL Produção: https://agendamentos.codxis.com.br"
echo "- Bucket: xcortes-e6f64.firebasestorage.app"
echo "- CORS: Deve estar configurado para agendamentos.codxis.com.br"

# 7. Instruções de deploy
echo "📤 Próximos passos para deploy:"
echo "1. Upload dos arquivos da pasta 'dist' para o servidor"
echo "2. Certificar que .env.production está no servidor"
echo "3. Verificar se configuração de produção está ativa"
echo "4. Testar upload de fotos no ambiente de produção"

echo "🎉 Deploy preparado com sucesso!"
echo "⚠️ IMPORTANTE: Verificar se componente ProductionPhotoTest mostra configuração correta após deploy"