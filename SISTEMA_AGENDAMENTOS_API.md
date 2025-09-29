# Sistema de Agendamentos via API 📅

## Visão Geral

Sistema completo de gerenciamento de agendamentos integrado com a API backend `https://x-corte-api.codxis.com.br/api/bookings`.

## 🏗️ Arquitetura

### Arquivos Principais

1. **`src/services/bookingApiService.js`** - Serviço de integração com a API
2. **`src/hooks/useBookings.js`** - Hook para gerenciar estado dos agendamentos
3. **`src/pages/admin/AdminBookings.jsx`** - Página principal de gerenciamento
4. **`src/components/CreateBookingModal.jsx`** - Modal para criar novos agendamentos

### Fluxo de Dados

```
API Backend ↔️ bookingApiService.js ↔️ useBookings.js ↔️ AdminBookings.jsx
                                                      ↔️ CreateBookingModal.jsx
```

## 🚀 Funcionalidades

### ✅ Implementadas

- **Listagem de Agendamentos**: Exibe todos os agendamentos com status coloridos
- **Filtros Avançados**: Por data, status e busca textual
- **Criar Agendamentos**: Modal completo com validação
- **Confirmar Agendamentos**: Mudança de status para confirmado
- **Cancelar Agendamentos**: Cancelamento com confirmação
- **Estatísticas**: Dashboard com resumo por status
- **Interface Responsiva**: Design moderno com Tailwind CSS

### 🎯 Status de Agendamento

| Status      | Cor      | Descrição              |
| ----------- | -------- | ---------------------- |
| `pending`   | Amarelo  | Aguardando confirmação |
| `confirmed` | Verde    | Confirmado pelo admin  |
| `cancelled` | Vermelho | Cancelado              |
| `completed` | Azul     | Concluído              |

## 🔧 Como Usar

### Acessar o Sistema

1. Faça login como admin no sistema
2. No menu lateral, clique em **"Reservas"**
3. A página `/admin/bookings` será carregada

### Criar Novo Agendamento

1. Clique no botão **"Novo Agendamento"** (canto superior direito)
2. Preencha os dados do cliente:
   - Nome (obrigatório)
   - Telefone (obrigatório)
   - Email (opcional)
3. Selecione o serviço (obrigatório)
4. Escolha um funcionário (opcional - qualquer um se não selecionado)
5. Defina data e horário
6. Adicione observações (opcional)
7. Clique em **"Criar Agendamento"**

### Gerenciar Agendamentos

#### Filtrar Agendamentos

- **Por Data**: Selecione uma data específica
- **Por Status**: Escolha pending, confirmed, cancelled ou completed
- **Busca**: Digite nome, telefone ou nome do serviço
- **Limpar**: Remove todos os filtros

#### Ações nos Agendamentos

- **Confirmar**: Muda status de `pending` para `confirmed`
- **Cancelar**: Muda status para `cancelled` (com confirmação)

## 🛠️ Configuração Técnica

### Endpoints da API

```javascript
const BASE_URL = "https://x-corte-api.codxis.com.br/api/bookings";

// GET /api/bookings - Listar agendamentos
// POST /api/bookings - Criar agendamento
// PUT /api/bookings/:id/confirm - Confirmar agendamento
// PUT /api/bookings/:id/cancel - Cancelar agendamento
// GET /api/bookings/available-employees - Funcionários disponíveis
// POST /api/bookings/:id/reminder - Enviar lembrete
```

### Estados do Hook useBookings

```javascript
const {
  bookings, // Array de agendamentos
  isLoading, // Loading state
  error, // Mensagem de erro
  loadBookings, // Carregar agendamentos
  createBooking, // Criar novo agendamento
  confirmBooking, // Confirmar agendamento
  cancelBooking, // Cancelar agendamento
  clearError, // Limpar erro
} = useBookings();
```

### Validação de Formulário

O modal de criação inclui validação completa:

- **Nome**: Obrigatório, texto não vazio
- **Telefone**: Obrigatório, apenas números
- **Email**: Opcional, formato válido se preenchido
- **Serviço**: Obrigatório, deve existir na lista
- **Data**: Obrigatória, não pode ser no passado
- **Horário**: Obrigatório, slots de 30 minutos (8h às 18h)

## 📊 Integração com React Query

O sistema usa React Query para:

- ✅ **Cache inteligente** de dados
- ✅ **Refetch automático** após mutações
- ✅ **Loading states** adequados
- ✅ **Error handling** robusto
- ✅ **Invalidação** de cache quando necessário

## 🎨 Interface

### Design System

- **Cores**: Amber (principal), Verde (sucesso), Vermelho (erro), Azul (informação)
- **Ícones**: Lucide React
- **Layout**: Responsivo com Tailwind CSS
- **Componentes**: Modais, Cards, Filtros, Notificações

### Estados Visuais

- **Loading**: Spinner animado
- **Empty State**: Mensagem com ação para criar primeiro agendamento
- **Error State**: Mensagem de erro com botão para tentar novamente
- **Success State**: Notificações toast de sucesso

## 🔍 Debug e Logs

O sistema inclui logs detalhados no console:

```javascript
// Logs do serviço API
console.log("📡 [bookingApiService] Buscando agendamentos...");

// Logs do hook
console.log("🔄 [useBookings] Carregando agendamentos...");

// Logs da UI
console.log("✅ [AdminBookings] Agendamentos carregados:", bookings);
```

## 🚀 Próximos Passos

### Melhorias Sugeridas

1. **Notificações Push**: Integração com service workers
2. **Relatórios**: Exportação de dados em PDF/Excel
3. **Calendário Visual**: View de calendário além da lista
4. **Automatizações**: Confirmação automática, lembretes
5. **Integração WhatsApp**: Notificações via WhatsApp
6. **Recorrência**: Agendamentos recorrentes
7. **Múltiplos Serviços**: Agendamento de vários serviços por vez

### Otimizações Técnicas

1. **Paginação**: Para lidar com grandes volumes
2. **Filtros Avançados**: Por funcionário, valor, duração
3. **Exportação**: Relatórios em diferentes formatos
4. **Offline Support**: Funcionalidade offline com sync
5. **Real-time**: Updates em tempo real via WebSocket

## 🎉 Status Atual

**✅ SISTEMA TOTALMENTE FUNCIONAL**

O sistema está completamente implementado e testado, pronto para uso em produção. Todas as funcionalidades core estão funcionando perfeitamente com a API backend.

---

_Última atualização: 26/09/2025_
