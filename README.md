# Barbearia Elite - Sistema de Agendamento

Um site prateleira moderno para barbearia/salão construído com React, Tailwind CSS e React Router usando Vite como bundler.

## 🚀 Tecnologias Utilizadas

- **React 18** - Biblioteca JavaScript para construir interfaces de usuário
- **Vite 7** - Ferramenta de build rápida e moderna
- **Tailwind CSS v4** - Framework CSS utility-first (versão mais recente)
- **React Router v7** - Roteamento declarativo para React (API moderna com `createBrowserRouter`)

## ⚡ Funcionalidades

### 🏠 Página Principal

- **Topbar** com nome da barbearia e notificações
- **Promoção diária** em destaque (25% de desconto)
- **Nossos Serviços** - 3 principais + ver todos
- **Nossa Equipe** - 3 profissionais + ver todos
- **Calendário** interativo mostrando disponibilidade

### 👤 Sistema de Cadastro

- Registro via número de celular
- Verificação por código WhatsApp
- Cadastro de nome completo
- Persistência de dados no localStorage

### 📱 Design Responsivo

- Interface otimizada para mobile
- Cards interativos com hover effects
- Calendário visual com status dos dias
- Gradientes modernos e animações

## 📁 Estrutura do Projeto

```
src/
├── components/
│   └── Navbar.jsx      # Navegação (removida da home)
├── pages/
│   ├── Home.jsx        # Página principal da barbearia
│   ├── Services.jsx    # Lista completa de serviços
│   ├── Staff.jsx       # Equipe completa
│   ├── Register.jsx    # Cadastro por telefone
│   ├── Verification.jsx # Verificação de código
│   ├── Name.jsx        # Inserir nome
│   ├── About.jsx       # Página sobre
│   └── Contact.jsx     # Página de contato
├── App.jsx             # Configuração de rotas
├── main.jsx            # Ponto de entrada
└── index.css           # Estilos Tailwind
```

## 🛠️ Instalação e Uso

1. Instale as dependências:

```bash
npm install
```

2. Execute o servidor de desenvolvimento:

```bash
npm run dev
```

3. Acesse http://localhost:5173/ ou http://localhost:5174/

4. Para gerar a build de produção:

```bash
npm run build
```

## 📄 Páginas Disponíveis

### Principal

- **Home** (`/`) - Interface da barbearia com todos os recursos
- **Serviços** (`/services`) - Lista completa de serviços
- **Equipe** (`/staff`) - Todos os profissionais

### Cadastro

- **Registro** (`/register`) - Inserir número de celular
- **Verificação** (`/verification`) - Código do WhatsApp
- **Nome** (`/name`) - Cadastro do nome

### Outras

- **Sobre** (`/about`) - Informações da empresa
- **Contato** (`/contact`) - Formulário de contato

## 🎨 Recursos da Interface

### 🏠 Home da Barbearia

- Topbar com nome "Barbearia Elite" e sino de notificação
- Banner de promoção diária (25% desconto)
- Grid de 3 serviços principais com preços
- Grid de 3 profissionais com avaliações
- Calendário mensal com status visual:
  - 🟢 Verde: Dias disponíveis
  - 🟠 Laranja: Dias ocupados
  - 🔴 Vermelho: Fechado (domingos)
  - 🔵 Azul: Dia atual

### 💼 Serviços

- 8 serviços completos com descrições
- Preços e duração de cada serviço
- Botões de agendamento
- Layout responsivo em grid

### 👥 Equipe

- 5 profissionais com especialidades
- Avaliações e anos de experiência
- Tags de serviços que cada um oferece
- Botões personalizados de agendamento

## 🔧 Configuração Técnica

- **Vite Config**: Plugin do Tailwind CSS integrado
- **React Router**: API moderna com `createBrowserRouter`
- **Tailwind**: Importação via `@import "tailwindcss"`
- **Build**: Otimização automática com Vite + Rollup

## 📦 Scripts Disponíveis

- `npm run dev` - Servidor de desenvolvimento
- `npm run build` - Build de produção
- `npm run preview` - Preview da build

## 🆕 Recursos Implementados

- ✅ Interface completa de barbearia
- ✅ Sistema de cadastro via WhatsApp
- ✅ Calendário interativo com disponibilidade
- ✅ Cards de serviços e profissionais
- ✅ Design responsivo moderno
- ✅ Navegação fluida entre páginas
- ✅ Estados de loading e feedback
- ✅ Persistência de dados do usuário
