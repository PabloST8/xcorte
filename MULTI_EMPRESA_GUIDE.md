# Sistema Multi-Empresas - XCorte

## 📋 Resumo

O sistema XCorte agora suporta múltiplas empresas através de URLs dinâmicas. Cada empresa tem sua própria URL única, e o sistema detecta automaticamente qual empresa acessar baseado na URL.

## 🌐 Como Funciona

### Estrutura de URLs

- **Rota raiz**: `http://localhost:5174/` - Redireciona automaticamente para uma empresa
- **Empresa específica**: `http://localhost:5174/nome-da-empresa` - Acessa uma empresa específica
- **Páginas da empresa**: `http://localhost:5174/nome-da-empresa/pagina` - Ex: `/profile`, `/cart`, `/appointments`
- **Seleção de empresas**: `http://localhost:5174/empresas` - Lista todas as empresas disponíveis

### Funcionamento Automático

1. **Detecção automática**: Quando uma nova empresa é criada no Firestore, a URL é automaticamente gerada
2. **Redirecionamento inteligente**:
   - Se há apenas uma empresa: redireciona automaticamente para ela
   - Se há múltiplas empresas: permite escolher ou redireciona para a empresa atual
3. **Slug automático**: O nome da empresa é convertido em um slug URL-friendly

### Exemplos de URLs

```
http://localhost:5174/barbearia-do-joao          # Empresa "Barbearia do João"
http://localhost:5174/barbearia-do-joao/profile  # Página de perfil dessa empresa
http://localhost:5174/barbearia-do-joao/cart     # Carrinho dessa empresa
http://localhost:5174/salao-da-maria             # Empresa "Salão da Maria"
http://localhost:5174/salao-da-maria/appointments # Agendamentos dessa empresa
```

## 🚀 Componentes Implementados

### 1. EnterpriseDetector

- Detecta a empresa pela URL
- Redireciona automaticamente se necessário
- Gerencia o loading state

### 2. EnterpriseRouter

- Controla redirecionamentos baseado na quantidade de empresas
- Otimiza navegação para casos de empresa única

### 3. EnterpriseSelector

- Página para listar todas as empresas disponíveis
- Interface para escolher uma empresa específica

### 4. EnterpriseHeader

- Mostra informações da empresa atual
- Botão para trocar de empresa

### 5. useEnterpriseNavigation Hook

- Facilita navegação dentro do contexto da empresa
- Mantém consistência nas URLs

## 🔧 Funcionalidades

### Navegação Automática

Todas as páginas agora usam o sistema de navegação da empresa:

- Links internos mantêm o contexto da empresa
- Navegação entre páginas preserva a URL da empresa
- Redirecionamentos automáticos quando necessário

### Gestão de Estado

- Context API gerencia empresa atual
- LocalStorage persiste seleção do usuário
- Firestore como fonte de dados das empresas

### URLs Amigáveis

- Slugs baseados no nome da empresa
- Fallback para email da empresa se necessário
- URLs limpas e SEO-friendly

## 📁 Estrutura de Arquivos

```
src/
├── components/
│   ├── EnterpriseDetector.jsx      # Detecção automática de empresa
│   ├── EnterpriseRouter.jsx        # Roteamento inteligente
│   ├── EnterpriseHeader.jsx        # Header com info da empresa
│   └── ...
├── pages/
│   ├── EnterpriseSelector.jsx      # Seleção de empresas
│   └── ...
├── hooks/
│   ├── useEnterpriseNavigation.js  # Hook de navegação
│   └── ...
├── contexts/
│   ├── EnterpriseContext.jsx       # Context de empresas
│   └── ...
└── utils/
    ├── slug.js                     # Utilitários de slug
    └── ...
```

## 🎯 Como Usar

### Para Desenvolvedores

1. **Navegação entre páginas**:

```jsx
import { useEnterpriseNavigation } from "../hooks/useEnterpriseNavigation";

function MeuComponente() {
  const { navigateToPage, getEnterpriseUrl } = useEnterpriseNavigation();

  // Navegar para perfil da empresa atual
  const irParaPerfil = () => navigateToPage("profile");

  // Gerar URL para uma página
  const urlCart = getEnterpriseUrl("cart"); // /empresa-atual/cart
}
```

2. **Links com contexto de empresa**:

```jsx
import { Link } from "react-router-dom";
import { useEnterpriseNavigation } from "../hooks/useEnterpriseNavigation";

function MeuLink() {
  const { getEnterpriseUrl } = useEnterpriseNavigation();

  return <Link to={getEnterpriseUrl("appointments")}>Meus Agendamentos</Link>;
}
```

### Para Usuários

1. **Acessar empresa específica**: Digite `localhost:5174/nome-da-empresa`
2. **Ver todas as empresas**: Acesse `localhost:5174/empresas`
3. **Trocar de empresa**: Use o botão "Trocar empresa" no header (quando há múltiplas)

## 🔄 Migração de Código Antigo

Para migrar código existente:

1. **Substitua links hardcoded**:

```jsx
// Antes
<Link to="/profile">Perfil</Link>

// Depois
<Link to={getEnterpriseUrl('profile')}>Perfil</Link>
```

2. **Substitua navigate hardcoded**:

```jsx
// Antes
navigate("/cart");

// Depois
navigateToPage("cart");
```

3. **Use o EnterpriseHeader**:

```jsx
// Adicione no topo das páginas principais
<EnterpriseHeader showSelector={true} />
```

## 🎨 Interface do Usuário

- **Loading states**: Indicadores visuais durante carregamento
- **Error handling**: Tratamento de empresas não encontradas
- **Responsive design**: Funciona em desktop e mobile
- **Acessibilidade**: ARIAs e navegação por teclado

## 🚧 Próximos Passos

1. **SEO**: Meta tags dinâmicas por empresa
2. **Analytics**: Tracking por empresa
3. **Subdomínios**: `empresa.xcorte.com.br` (opcional)
4. **Cache**: Otimização de carregamento
5. **PWA**: Service workers por empresa

## 📝 Notas Técnicas

- **React Router v6**: Aproveitamento de nested routes
- **Context API**: Gerenciamento de estado global
- **LocalStorage**: Persistência de seleção
- **Firestore**: Fonte de dados real-time
- **URL Slugs**: Normalização automática de nomes
