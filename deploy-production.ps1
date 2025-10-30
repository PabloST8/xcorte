# Script PowerShell para deploy em produção com configurações corretas para Firebase
# Garante que as fotos funcionem em https://agendamentos.codxis.com.br

Write-Host "🚀 Iniciando deploy de produção..." -ForegroundColor Green

# 1. Build do projeto
Write-Host "📦 Building projeto..." -ForegroundColor Yellow
npm run build

# 2. Verificar se arquivo de configuração existe
Write-Host "🔧 Verificando configuração de produção..." -ForegroundColor Yellow
if (-not (Test-Path "src\config\productionFirebase.js")) {
    Write-Host "❌ Erro: Arquivo de configuração de produção não encontrado!" -ForegroundColor Red
    exit 1
}

# 3. Verificar configurações Firebase
Write-Host "🔍 Validando configurações Firebase..." -ForegroundColor Yellow
$configContent = Get-Content "src\config\productionFirebase.js" -Raw
if ($configContent -match "xcortes-e6f64\.firebasestorage\.app") {
    Write-Host "✅ Bucket Firebase correto encontrado" -ForegroundColor Green
} else {
    Write-Host "⚠️ Aviso: Bucket Firebase pode estar incorreto" -ForegroundColor Yellow
}

# 4. Criar arquivo de ambiente para produção
Write-Host "📝 Criando .env para produção..." -ForegroundColor Yellow
$envContent = @"
VITE_FIREBASE_API_KEY=AIzaSyBYKvlk8ioYDecLYg-yupH1Oyy5U_ury9s
VITE_FIREBASE_AUTH_DOMAIN=xcortes-e6f64.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=xcortes-e6f64
VITE_FIREBASE_STORAGE_BUCKET=xcortes-e6f64.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1016197568464
VITE_FIREBASE_APP_ID=1:1016197568464:web:f6ee67ab1ffbdb333d4bd5
"@

$envContent | Out-File -FilePath ".env.production" -Encoding utf8
Write-Host "✅ Arquivo .env.production criado" -ForegroundColor Green

# 5. Verificar se CORS está configurado
Write-Host "🌐 Verificando CORS..." -ForegroundColor Yellow
Write-Host "Execute o seguinte comando se necessário:" -ForegroundColor Cyan
Write-Host "gsutil cors set cors.json gs://xcortes-e6f64.firebasestorage.app" -ForegroundColor White

# 6. Logs de debug
Write-Host "🐛 Configurações para debug:" -ForegroundColor Magenta
Write-Host "- URL Produção: https://agendamentos.codxis.com.br" -ForegroundColor White
Write-Host "- Bucket: xcortes-e6f64.firebasestorage.app" -ForegroundColor White
Write-Host "- CORS: Deve estar configurado para agendamentos.codxis.com.br" -ForegroundColor White

# 7. Instruções de deploy
Write-Host "📤 Próximos passos para deploy:" -ForegroundColor Yellow
Write-Host "1. Upload dos arquivos da pasta 'dist' para o servidor" -ForegroundColor White
Write-Host "2. Certificar que .env.production está no servidor" -ForegroundColor White
Write-Host "3. Verificar se configuração de produção está ativa" -ForegroundColor White
Write-Host "4. Testar upload de fotos no ambiente de produção" -ForegroundColor White

Write-Host "🎉 Deploy preparado com sucesso!" -ForegroundColor Green
Write-Host "⚠️ IMPORTANTE: Verificar se componente ProductionPhotoTest mostra configuração correta após deploy" -ForegroundColor Yellow