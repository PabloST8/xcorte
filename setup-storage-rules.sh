# Script para configurar regras do Firebase Storage

# Primeiro, certifique-se de que está logado no Firebase CLI
firebase login

# Aplicar as regras de segurança do Storage
firebase deploy --only storage

# Verificar se as regras foram aplicadas
firebase storage:rules:get