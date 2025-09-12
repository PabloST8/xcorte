# XCorte - Sistema de Agendamento Multi-Empresas

Um sistema moderno e completo de agendamento para barbearias e salões de beleza, construído com React, Firebase, e Tailwind CSS.

## 🚀 Tecnologias Utilizadas

- **React 19** - Biblioteca JavaScript para interfaces de usuário
- **Vite 7** - Build tool rápida e moderna
- **Tailwind CSS v4** - Framework CSS utility-first
- **React Router v7** - Roteamento com API moderna
- **Firebase** - Authentication, Firestore, Storage
- **Docker** - Containerização para deploy

## ⚡ Funcionalidades Principais

### 🏢 Sistema Multi-Empresas
- URLs dinâmicas por empresa (`/nome-da-empresa`)
- Detecção automática de empresa pela URL
- Gestão centralizada de múltiplas empresas
- Interface para seleção de empresas

### 🔐 Sistema de Autenticação
- Login via telefone com verificação WhatsApp
- Autenticação Firebase integrada
- Sistema de roles (cliente/admin)
- Login administrativo com Firebase Auth

### 📅 Sistema de Agendamentos
- Calendário interativo com disponibilidade
- Agendamento de múltiplos serviços
- Gestão de horários por funcionário
- Status de agendamento em tempo real
- Carrinho de agendamentos

### 👥 Gestão de Funcionários
- Cadastro de profissionais
- Horários de trabalho configuráveis
- Skills e especialidades
- Disponibilidade em tempo real

### 💼 Painel Administrativo
- Dashboard com métricas
- Gestão de agendamentos
- Cadastro de serviços
- Relatórios e estatísticas

## 🌐 Estrutura de URLs

### URLs Dinâmicas por Empresa
```
http://localhost:5173/                           # Página inicial
http://localhost:5173/empresas                   # Seleção de empresas
http://localhost:5173/barbearia-do-joao          # Empresa específica
http://localhost:5173/barbearia-do-joao/profile  # Perfil do usuário
http://localhost:5173/barbearia-do-joao/cart     # Carrinho
http://localhost:5173/barbearia-do-joao/appointments # Agendamentos
```

### URLs Administrativas
```
http://localhost:5173/admin/login                # Login admin
http://localhost:5173/admin/dashboard            # Dashboard
http://localhost:5173/admin/appointments         # Gestão de agendamentos
http://localhost:5173/admin/services             # Gestão de serviços
http://localhost:5173/admin/staff                # Gestão de funcionários
```

## 📁 Estrutura do Projeto

```
xcorte/
├── src/
│   ├── components/           # Componentes reutilizáveis
│   │   ├── EnterpriseDetector.jsx    # Detecção de empresa
│   │   ├── EnterpriseHeader.jsx      # Header da empresa
│   │   ├── FloatingMenu.jsx          # Menu flutuante
│   │   ├── LoadingSpinner.jsx        # Spinner de loading
│   │   └── ProtectedRoute.jsx        # Rotas protegidas
│   ├── contexts/             # Contexts React
│   │   ├── AuthContext.jsx           # Autenticação
│   │   ├── EnterpriseContext.jsx     # Empresa atual
│   │   └── CartContext.jsx           # Carrinho de compras
│   ├── hooks/               # Custom hooks
│   │   ├── useAuth.js               # Hook de autenticação
│   │   ├── useEnterpriseNavigation.js # Navegação por empresa
│   │   └── useAdmin.js              # Hook admin
│   ├── pages/               # Páginas da aplicação
│   │   ├── Home.jsx                 # Página inicial
│   │   ├── EnterpriseSelector.jsx   # Seleção de empresas
│   │   ├── Calendar.jsx             # Calendário de agendamentos
│   │   ├── Cart.jsx                 # Carrinho
│   │   ├── Profile.jsx              # Perfil do usuário
│   │   └── admin/                   # Páginas administrativas
│   ├── services/            # Serviços e APIs
│   │   ├── firebase.js              # Configuração Firebase
│   │   ├── authService.js           # Serviços de autenticação
│   │   ├── bookingService.js        # Serviços de agendamento
│   │   └── adminService.js          # Serviços administrativos
│   ├── types/               # Tipos e interfaces
│   │   └── api.js                   # Tipos da API
│   └── utils/               # Utilitários
│       └── dataAdapters.js          # Adaptadores de dados
├── public/                  # Arquivos públicos
├── dist/                    # Build de produção
├── scripts/                 # Scripts utilitários
├── .env.local              # Variáveis de ambiente
├── Dockerfile              # Configuração Docker
├── deploy.sh               # Script de deploy
└── firebase.json           # Configuração Firebase
```

## 🔧 Configuração e Instalação

### 1. Pré-requisitos
- Node.js 18+ 
- NPM ou Yarn
- Conta Firebase
- Docker (opcional, para deploy)

### 2. Instalação Local

```bash
# Clonar o repositório
git clone <url-do-repositorio>
cd xcorte

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# Editar .env.local com suas credenciais Firebase

# Executar em desenvolvimento
npm run dev
```

### 3. Configuração Firebase

#### Variáveis de Ambiente (.env.local)
```bash
VITE_FIREBASE_API_KEY=sua_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto-id
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

#### Configurar Firestore Rules
```bash
# Deploy das regras de segurança
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
```

### 4. Configuração Admin

#### Criar Usuário Admin
1. Acesse `/admin/login`
2. Clique em "🔧 Criar Usuário Admin no Firebase"
3. Use as credenciais:
   - **Email**: `empresaadmin@xcortes.com`
   - **Senha**: `admin123`

## 🚀 Deploy

### Deploy com Docker

#### Script Automatizado
```bash
# Tornar o script executável
chmod +x deploy.sh

# Executar deploy
./deploy.sh
```

#### Manual
```bash
# Build da imagem
docker build -t xcorte-app .

# Executar container
docker run -d -p 8080:4000 --name xcorte xcorte-app
```

### Deploy em VPS

1. **Clonar projeto na VPS**:
```bash
git clone <url-do-repositorio>
cd xcorte
```

2. **Configurar ambiente**:
```bash
# Copiar variáveis de ambiente
cp .env.example .env.local
# Editar com as credenciais corretas
nano .env.local
```

3. **Executar deploy**:
```bash
chmod +x deploy.sh
./deploy.sh
```

4. **Verificar**:
```bash
docker ps
curl http://localhost:8080
```

## 📊 API e Estruturas de Dados

### Status de Agendamentos
```javascript
const BOOKING_STATUS = {
  SCHEDULED: "scheduled",    # Agendado
  CONFIRMED: "confirmed",    # Confirmado
  IN_PROGRESS: "in_progress", # Em andamento
  COMPLETED: "completed",    # Concluído
  CANCELLED: "cancelled",    # Cancelado
  NO_SHOW: "no_show"        # Não compareceu
};
```

### Estrutura de Produto/Serviço
```javascript
{
  id: "string",
  name: "string",
  description: "string",
  price: number,           // em centavos
  duration: number,        // em minutos
  category: "string",
  isActive: boolean,
  enterpriseEmail: "string",
  createdAt: "string",
  updatedAt: "string"
}
```

### Estrutura de Agendamento
```javascript
{
  id: "string",
  enterpriseEmail: "string",
  clientName: "string",
  clientPhone: "string",
  clientEmail: "string",
  productId: "string",
  productName: "string",
  productPrice: number,    // em centavos
  productDuration: number, // em minutos
  employeeId: "string",
  employeeName: "string",
  date: "YYYY-MM-DD",
  startTime: "HH:MM",
  endTime: "HH:MM",
  status: "string",
  notes: "string",
  createdAt: "string",
  updatedAt: "string"
}
```

## 🔒 Segurança

### Firestore Security Rules
- Autenticação obrigatória para escrita
- Leitura pública para dados de empresas
- Isolamento de dados por empresa
- Validação de roles e permissões

### Autenticação
- Firebase Auth para administradores
- Autenticação anônima para clientes
- Tokens JWT seguros
- Logout automático em caso de erro

## 🐛 Solução de Problemas

### Tela Branca no Docker
- Verificar se `.env.local` está sendo copiado
- Verificar se Firebase está configurado
- Checar logs: `docker logs <container-id>`

### Erros de Permissão Firebase
- Verificar regras do Firestore
- Confirmar autenticação do usuário
- Verificar configuração do projeto Firebase

### Problemas de Build
- Limpar cache: `npm clean-install`
- Verificar versões do Node.js
- Verificar variáveis de ambiente

## 📝 Scripts Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run preview      # Preview do build
npm run lint         # Verificar código
./deploy.sh          # Deploy automatizado
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🆘 Suporte

Para dúvidas ou problemas:
- Abra uma issue no GitHub
- Consulte a documentação dos componentes
- Verifique os logs de erro no console

---

**XCorte** - Sistema de Agendamento Profissional 💈✂️
