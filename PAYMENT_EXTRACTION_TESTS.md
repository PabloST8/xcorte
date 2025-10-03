# 🔧 Testes da Extração de Pagamento

## Exemplos de Funcionamento

A função `formatPaymentMethod()` agora extrai o tipo de pagamento do campo `notes` do Firestore.

### ✅ Casos de Sucesso

```javascript
// Dados reais do Firestore
const appointment1 = {
  notes: "pagamento: pix",
  // outros campos...
};
// Resultado: PIX (roxo)

const appointment2 = {
  notes: "Agendamento via carrinho | pagamento: dinheiro",
  // outros campos...
};
// Resultado: Dinheiro (verde)

const appointment3 = {
  notes: "pagamento: cartão",
  // outros campos...
};
// Resultado: Cartão (azul)
```

### 🔄 Fallback para Campos Diretos

```javascript
const appointment4 = {
  notes: "Observações gerais sem pagamento",
  paymentMethod: "pix",
};
// Resultado: PIX (roxo)

const appointment5 = {
  payment_method: "credito",
};
// Resultado: Crédito (índigo)
```

### ⚪ Casos Sem Informação

```javascript
const appointment6 = {
  notes: "Apenas observações",
  // sem campos de pagamento
};
// Resultado: Não informado (cinza)
```

## Padrões Reconhecidos

### Formato Principal (campo notes)

- `"pagamento: pix"`
- `"pagamento: dinheiro"`
- `"pagamento: cartão"`
- `"Outras informações | pagamento: débito"`

### Regex Utilizada

```javascript
/pagamento:\s*([^|]+)/;
```

- `pagamento:` - Texto literal
- `\s*` - Zero ou mais espaços
- `([^|]+)` - Captura qualquer coisa exceto "|"

## Mapeamento de Cores

| Tipo          | Cores CSS                       |
| ------------- | ------------------------------- |
| Dinheiro      | `bg-green-100 text-green-800`   |
| PIX           | `bg-purple-100 text-purple-800` |
| Cartão        | `bg-blue-100 text-blue-800`     |
| Débito        | `bg-orange-100 text-orange-800` |
| Crédito       | `bg-indigo-100 text-indigo-800` |
| Não informado | `bg-gray-100 text-gray-800`     |

## Exemplo de Dados do Firestore

```json
{
  "clientEmail": "",
  "clientName": "Pablo Felipe Araújo Ferreira",
  "clientPhone": "88994464373",
  "createdAt": "2025-09-11T22:11:01.541Z",
  "date": "2025-09-15",
  "employeeId": "ddd@gmail.com",
  "endTime": "10:00",
  "enterpriseEmail": "empresaadmin@xcortes.com",
  "notes": "pagamento: pix", // ← AQUI está o tipo de pagamento
  "productDuration": 30,
  "productId": "cjLnjOYhbfCC1ZEnAjzA",
  "productName": "Corte masculino",
  "productPrice": 2500,
  "staffName": "ddd",
  "startTime": "09:30",
  "status": "scheduled",
  "updatedAt": "2025-09-11T22:11:01.541Z"
}
```
