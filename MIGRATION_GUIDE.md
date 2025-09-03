# Migração para API - Guia Completo

Este documento descreve as mudanças realizadas para alinhar o projeto com a API da X-Corte.

## 📋 Resumo das Mudanças

### 1. **Criação de Tipos e Interfaces**

- ✅ **Arquivo criado:** `src/types/api.js`
- ✅ **Interfaces:** Product, Booking, TimeSlot, Schedule, Enterprise
- ✅ **Validadores:** validateProduct(), validateBooking()
- ✅ **Utilitários:** formatPrice(), parseDuration(), calculateEndTime()

### 2. **Atualização dos Dados**

- ✅ **Arquivo atualizado:** `src/data/services.js`
- ✅ **Mudanças principais:**
  - `price`: string → number (centavos)
  - `duration`: string → number (minutos)
  - `id`: number → string
  - Adicionado: `isActive`, `createdAt`, `updatedAt`

### 3. **Serviços Atualizados**

- ✅ **productService.js:** Validação de dados + tipos corretos
- ✅ **bookingService.js:** Estrutura Booking completa + validação
- ✅ **adminService.js:** Dados usando BOOKING_STATUS + centavos

### 4. **Componentes Atualizados**

- ✅ **Calendar.jsx:** Usando formatPrice() e dados corretos
- ✅ **Appointment.jsx:** Estrutura Booking + API fields
- ✅ **AdminServices.jsx:** DataAdapters para conversão

### 5. **Utilitários Criados**

- ✅ **dataAdapters.js:** Conversão entre formatos antigos/API
- ✅ **migration.js:** Scripts de migração automática

## 🔧 Como Usar

### Validar um Produto

```javascript
import { validateProduct } from "./types/api.js";

const product = {
  name: "Corte Masculino",
  price: 3000, // centavos
  duration: 30, // minutos
  isActive: true,
};

const errors = validateProduct(product);
if (errors.length > 0) {
  console.log("Erros:", errors);
}
```

### Criar um Agendamento

```javascript
import { BOOKING_STATUS, calculateEndTime } from "./types/api.js";

const booking = {
  enterpriseEmail: "empresa@email.com",
  clientName: "João Silva",
  clientPhone: "11999999999",
  productId: "1",
  productName: "Corte Masculino",
  productDuration: 30,
  productPrice: 3000,
  date: "2025-09-03",
  startTime: "14:00",
  status: BOOKING_STATUS.PENDING,
};

// EndTime é calculado automaticamente
booking.endTime = calculateEndTime(booking.startTime, booking.productDuration);
```

### Converter Dados Antigos

```javascript
import { DataAdapters } from "./utils/dataAdapters.js";

// Converter serviço antigo para API
const oldService = { id: 1, price: "R$ 30,00", duration: "30 min" };
const apiService = DataAdapters.serviceToAPI(oldService);

// Converter serviço da API para display
const displayService = DataAdapters.serviceFromAPI(apiService);
```

## 📊 Estruturas de Dados

### Product (Serviço)

```javascript
{
  id: "1",                    // string
  name: "Corte Masculino",    // string
  price: 3000,                // number (centavos)
  duration: 30,               // number (minutos)
  description: "...",         // string
  category: "Cortes",         // string
  isActive: true,             // boolean
  createdAt: "2025-09-03T...", // ISO string
  updatedAt: "2025-09-03T..."  // ISO string
}
```

### Booking (Agendamento)

```javascript
{
  id: "1",
  enterpriseEmail: "empresa@email.com",
  clientName: "João Silva",
  clientPhone: "11999999999",
  clientEmail: "joao@email.com",
  productId: "1",
  productName: "Corte Masculino",
  productDuration: 30,        // minutos
  productPrice: 3000,         // centavos
  date: "2025-09-03",         // YYYY-MM-DD
  startTime: "14:00",         // HH:MM
  endTime: "14:30",           // HH:MM
  status: "pending",          // enum
  notes: "",
  createdAt: "2025-09-03T...",
  updatedAt: "2025-09-03T..."
}
```

## 🎯 Status dos Agendamentos

```javascript
export const BOOKING_STATUS = {
  PENDING: "pending", // Pendente
  CONFIRMED: "confirmed", // Confirmado
  COMPLETED: "completed", // Concluído
  CANCELLED: "cancelled", // Cancelado
};
```

## 💰 Preços em Centavos

- **R$ 30,00** = `3000` centavos
- **R$ 25,50** = `2550` centavos
- **R$ 100,00** = `10000` centavos

### Funções de Conversão

```javascript
// String para centavos
parsePrice("R$ 30,00"); // → 3000

// Centavos para string formatada
formatPrice(3000); // → "R$ 30,00"
```

## ⏱️ Duração em Minutos

- **30 min** = `30`
- **1h 30min** = `90`
- **2h** = `120`

### Funções de Conversão

```javascript
// String para minutos
parseDuration("1h 30min"); // → 90

// Minutos para string formatada
formatDuration(90); // → "1h 30min"
```

## 🔄 Scripts de Migração

### Executar Migração Completa

```javascript
import { runMigrations } from "./utils/migration.js";

const migratedData = runMigrations();
console.log("Dados migrados:", migratedData);
```

### Validar Dados Migrados

```javascript
import { validateMigratedData } from "./utils/migration.js";

const errors = validateMigratedData(migratedData);
if (errors.length === 0) {
  console.log("✅ Todos os dados estão válidos!");
}
```

## 🚨 Pontos de Atenção

1. **Preços sempre em centavos** - nunca usar decimais
2. **IDs sempre string** - mesmo que sejam números
3. **Datas no formato ISO** - YYYY-MM-DD
4. **Status usar constantes** - BOOKING_STATUS enum
5. **Validar antes de enviar** - usar validate functions

## 📝 TODO - Próximos Passos

- [ ] Atualizar componentes de agendamento restantes
- [ ] Implementar TimeSlot nos horários disponíveis
- [ ] Adicionar Schedule para horários de funcionamento
- [ ] Atualizar testes para nova estrutura
- [ ] Documentar APIs endpoints específicos
- [ ] Implementar error handling consistente

## 🐛 Resolução de Problemas

### Erro: "price must be a number"

```javascript
// ❌ Errado
{
  price: "R$ 30,00";
}

// ✅ Correto
{
  price: 3000;
}
```

### Erro: "status must be valid"

```javascript
// ❌ Errado
{
  status: "confirmado";
}

// ✅ Correto
{
  status: BOOKING_STATUS.CONFIRMED;
}
```

### Erro: "date format invalid"

```javascript
// ❌ Errado
{
  date: "03/09/2025";
}

// ✅ Correto
{
  date: "2025-09-03";
}
```
