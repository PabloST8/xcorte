# Sistema de Verificação WhatsApp para Cadastro

Este documento explica como funciona o sistema de verificação por WhatsApp implementado no cadastro de usuários.

## 📋 Visão Geral

O sistema de verificação por WhatsApp foi integrado ao processo de cadastro para garantir que apenas números de telefone válidos sejam utilizados. O fluxo funciona da seguinte forma:

1. **Preenchimento do formulário**: Usuário preenche nome e telefone
2. **Verificação automática**: Sistema inicia processo de verificação via WhatsApp
3. **Envio do código**: Código de 6 dígitos é enviado para o WhatsApp do usuário
4. **Confirmação**: Usuário digita o código recebido
5. **Finalização**: Após verificação bem-sucedida, conta é criada automaticamente

## 🔧 Configuração

### Variáveis de Ambiente

Configure as seguintes variáveis no arquivo `.env`:

```env
# Evolution API - Configurações obrigatórias
VITE_EVOLUTION_API_KEY=sua_chave_da_api_evolution
VITE_EVOLUTION_API_URL=https://api.evolution.com.br
VITE_EVOLUTION_INSTANCE=nome_da_sua_instancia
```

### Pré-requisitos

1. **Conta na Evolution API**: Necessária para envio de mensagens WhatsApp
2. **Instância configurada**: Uma instância do WhatsApp configurada na Evolution API
3. **Chave de API**: Token de acesso válido

## 📂 Arquivos Implementados

### Serviços

- **`src/services/whatsappVerificationService.js`**: Serviço principal para gerenciar códigos
- **`src/services/whatsappAPI.js`**: API endpoints simulados para envio/verificação

### Componentes

- **`src/components/WhatsAppVerification.jsx`**: Componente UI para verificação
- **`src/pages/Register.jsx`**: Página de cadastro modificada

## 🚀 Como Funciona

### 1. Envio do Código

```javascript
// Usuário clica em "Criar conta"
const result = await sendVerificationCode(phoneNumber);

if (result.success) {
  // Código enviado com sucesso
  // Usuário recebe: "Seu código de verificação é: 123456"
}
```

### 2. Verificação do Código

```javascript
// Usuário digita o código recebido
const verification = await verifyVerificationCode(phoneNumber, userCode);

if (verification.success) {
  // Verificação bem-sucedida, proceder com registro
  // Conta é criada automaticamente
}
```

## ⚙️ Regras do Sistema

### Temporização

- **Expiração**: Códigos expiram em **5 minutos**
- **Tentativas**: Máximo de **3 tentativas** por código
- **Código único**: Apenas **1 código ativo** por número de telefone

### Validações

- **Formato do número**: Deve ter 10 ou 11 dígitos
- **Código**: Deve ter exatamente 6 dígitos numéricos
- **Reenvio**: Possível após expiração ou esgotamento de tentativas

### Segurança

- Códigos são removidos da memória após verificação bem-sucedida
- Limpeza automática de códigos expirados a cada 5 minutos
- Controle de tentativas para prevenir ataques de força bruta

## 🎯 Fluxo de Uso

### Passo 1: Formulário de Cadastro

```
┌─────────────────────┐
│  Nome: João Silva   │
│  Telefone: (11)     │
│  99999-9999         │
│                     │
│  [ Criar conta ]    │
└─────────────────────┘
```

### Passo 2: Tela de Verificação

```
┌─────────────────────┐
│  📱 Verificação     │
│     WhatsApp        │
│                     │
│  Enviamos código    │
│  para: +5511999...  │
│                     │
│  [ Enviar código ]  │
└─────────────────────┘
```

### Passo 3: Inserção do Código

```
┌─────────────────────┐
│  Digite o código:   │
│                     │
│  [ 1 2 3 4 5 6 ]    │
│                     │
│  Expira em: 4:32    │
│                     │
│  [ Verificar ]      │
│  Reenviar código    │
└─────────────────────┘
```

### Passo 4: Sucesso

```
┌─────────────────────┐
│  ✅ Verificação     │
│     concluída!      │
│                     │
│  Seu número foi     │
│  verificado com     │
│  sucesso.           │
└─────────────────────┘
```

## 📱 Mensagem Enviada

O usuário recebe a seguinte mensagem no WhatsApp:

```
Seu código de verificação é: 123456

Este código expira em 5 minutos.
```

## 🔍 Exemplos de Resposta da API

### ✅ Código Enviado com Sucesso

```json
{
  "success": true,
  "message": "Código de verificação enviado",
  "data": {
    "phoneNumber": "5511999999999",
    "expiresIn": 300
  }
}
```

### ✅ Verificação Bem-sucedida

```json
{
  "success": true,
  "message": "Código confirmado",
  "data": {
    "phoneNumber": "5511999999999",
    "verified": true
  }
}
```

### ❌ Código Incorreto

```json
{
  "success": false,
  "error": "Código inválido",
  "message": "Código incorreto. Você ainda tem 2 tentativa(s).",
  "attemptsLeft": 2
}
```

### ❌ Código Expirado

```json
{
  "success": false,
  "error": "Código expirado",
  "message": "O código de verificação expirou. Solicite um novo código."
}
```

## 🚨 Tratamento de Erros

### Erros Comuns

1. **API Evolution indisponível**

   - Mensagem: "Não foi possível enviar o código de verificação"
   - Ação: Verificar configuração da Evolution API

2. **Número inválido**

   - Mensagem: "Número de telefone deve ter 10 ou 11 dígitos"
   - Ação: Usuário deve corrigir o número

3. **Muitas tentativas**

   - Mensagem: "Número máximo de tentativas excedido"
   - Ação: Usuário deve solicitar novo código

4. **Código expirado**
   - Mensagem: "O código de verificação expirou"
   - Ação: Usuário pode reenviar código

## 🔧 Desenvolvimento

### Testar Localmente

1. Configure as variáveis de ambiente no `.env`
2. Inicie o servidor de desenvolvimento
3. Acesse a página de cadastro
4. Teste o fluxo completo

### Debug

Para debug, verifique:

- Console do browser para logs de erro
- Network tab para requisições à Evolution API
- Estado dos componentes React

## 📚 Dependências

### Pacotes Utilizados

- `lucide-react`: Ícones da interface
- `react-router-dom`: Navegação entre páginas

### APIs Externas

- **Evolution API**: Para envio de mensagens WhatsApp

## 🔒 Considerações de Segurança

1. **Armazenamento temporário**: Códigos ficam apenas na memória
2. **Expiração automática**: Códigos são removidos após 5 minutos
3. **Limite de tentativas**: Máximo 3 tentativas por código
4. **Validação de entrada**: Números e códigos são validados
5. **Limpeza periódica**: Códigos expirados são removidos automaticamente

## 🚀 Próximos Passos

Para produção, considere:

1. **Armazenamento persistente**: Usar Redis ou banco de dados
2. **Rate limiting**: Limitar tentativas por IP/número
3. **Logs**: Implementar logging detalhado
4. **Monitoramento**: Alertas para falhas na Evolution API
5. **Backup**: Fallback para SMS em caso de falha do WhatsApp

---

**Nota**: Este sistema foi implementado apenas para o **cadastro** de novos usuários. Para login, continue utilizando o fluxo atual do sistema.
