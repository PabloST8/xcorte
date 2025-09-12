# Configuração de Login Admin com Firebase

## 📋 Visão Geral

O sistema foi configurado para usar Firebase Authentication para login de administradores, com fallback local para desenvolvimento.

## 🔧 Configuração Inicial

### 1. **Configurar Firebase** (Já feito ✅)

- Projeto Firebase: `xcortes-e6f64`
- Variáveis configuradas em `.env.local`

### 2. **Criar Usuário Admin no Firebase**

#### Opção A: Via Interface da Aplicação

1. Acesse `http://localhost:5174/admin/login`
2. Clique em "🔧 Criar Usuário Admin no Firebase"
3. Siga as instruções exibidas

#### Opção B: Via Firebase Console

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Selecione o projeto `xcortes-e6f64`
3. Vá em **Authentication > Users**
4. Clique em **Add User**
5. Configure:
   - **Email**: `empresaadmin@xcortes.com`
   - **Password**: `admin123`
6. Salve o usuário

### 3. **Criar Documento no Firestore**

O documento de usuário será criado automaticamente quando usar o botão na interface, ou você pode criar manualmente:

```javascript
// Documento em: users/empresaadmin@xcortes.com
{
  email: "empresaadmin@xcortes.com",
  name: "Administrador XCortes",
  role: "admin",
  status: "active",
  enterpriseEmail: "test@empresa.com",
  createdAt: "2025-09-11T...",
  updatedAt: "2025-09-11T...",
  permissions: {
    dashboard: true,
    appointments: true,
    clients: true,
    services: true,
    staff: true,
    reports: true,
    settings: true
  }
}
```

## 🚀 Como Usar

### Login Administrativo

1. Acesse `http://localhost:5174/admin/login`
2. Digite as credenciais:
   - **Email**: `empresaadmin@xcortes.com`
   - **Senha**: `admin123`
3. Clique em **Entrar**
4. Será redirecionado para `/admin/dashboard`

### Fluxo de Autenticação

1. **Firebase Authentication**: Verifica email/senha
2. **Firestore Lookup**: Busca dados do usuário e verifica role
3. **Validação de Role**: Confirma se é `admin` ou `owner`
4. **Token Storage**: Salva token JWT e dados do usuário

## 🔒 Segurança

### Validações Implementadas

- ✅ **Email/senha válidos** no Firebase Auth
- ✅ **Role verification**: Apenas `admin` ou `owner`
- ✅ **Token JWT**: Autenticação segura
- ✅ **Auto logout**: Se role inválido
- ✅ **Fallback local**: Para desenvolvimento

### Proteção de Rotas

- `/admin/*` - Protegidas por `ProtectedRoute` com `adminOnly={true}`
- Redirecionamento automático para `/admin/login` se não autenticado
- Verificação contínua de role nos componentes

## 🔄 Fallback System

Se o Firebase falhar, o sistema usa credenciais locais:

- **Email**: `empresaadmin@xcortes.com`
- **Senha**: `admin123`
- **Usuário local**: Criado temporariamente

## 🛠️ Troubleshooting

### Problema: "Credenciais inválidas"

**Soluções**:

1. Verifique se o usuário existe no Firebase Authentication
2. Confirme se a senha está correta
3. Verifique se o documento existe no Firestore
4. Use o botão "Criar Usuário Admin" se necessário

### Problema: "Acesso negado"

**Soluções**:

1. Verifique se o campo `role` no Firestore é `"admin"` ou `"owner"`
2. Confirme se o documento está em `users/{email}`

### Problema: Firebase não conecta

**Soluções**:

1. Verifique as variáveis em `.env.local`
2. Confirme se o projeto Firebase está ativo
3. O fallback local funcionará como backup

## 📱 URLs Importantes

- **Login Admin**: `http://localhost:5174/admin/login`
- **Dashboard**: `http://localhost:5174/admin/dashboard`
- **Appointments**: `http://localhost:5174/admin/appointments`
- **Clients**: `http://localhost:5174/admin/clients`
- **Services**: `http://localhost:5174/admin/services`

## 🎯 Próximos Passos

1. **Produção**: Configurar variáveis de ambiente no servidor
2. **Múltiplos Admins**: Criar mais usuários admin conforme necessário
3. **Permissões**: Implementar permissões granulares por funcionalidade
4. **2FA**: Adicionar autenticação de dois fatores (opcional)
5. **Logs**: Implementar auditoria de acessos admin

---

✅ **Sistema configurado e pronto para uso!**
