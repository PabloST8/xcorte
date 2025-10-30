# 🔧 CORREÇÃO: Habilitar Autenticação Anônima no Firebase

## 🎯 Problema Identificado

```
Firebase: Error (auth/admin-restricted-operation)
```

Este erro indica que a autenticação anônima está desabilitada no Firebase Console.

## 🚀 Solução Rápida

### Passo 1: Acessar Firebase Console

1. Vá para: https://console.firebase.google.com/
2. Selecione o projeto: **xcortes-e6f64**
3. No menu lateral, clique em **Authentication**
4. Vá para a aba **Sign-in method**

### Passo 2: Habilitar Autenticação Anônima

1. Encontre **Anonymous** na lista de provedores
2. Clique no **Anonymous**
3. **Ative o toggle** "Enable"
4. Clique em **Save**

### Passo 3: Verificar Configuração

- Status deve ficar: **Anonymous: Enabled**

## 🔄 Alternativa: Upload Sem Autenticação

Se você não quiser habilitar autenticação anônima, podemos modificar o código para fazer upload sem autenticação (usando apenas as regras permissivas do Storage).

---

**📋 Status Atual:**

- ✅ DNS resolvido (.appspot.com funcionando)
- ✅ CORS configurado
- ❌ Autenticação anônima desabilitada (facilmente corrigível)

**⏰ Tempo estimado para correção:** 2 minutos no Firebase Console
