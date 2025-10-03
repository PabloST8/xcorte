# Fix de Campo Notes com Informação de Pagamento

## Problema Identificado

A função `formatPaymentMethod` estava mostrando "Não informado" porque o campo `notes` dos agendamentos estava vazio no Firestore. O debug confirmou:

```
⚠️ [Payment] No payment found for appointment: {
  id: 'qfatvppiE27ENdt1ckBp',
  clientName: 'Pablo Felipe Araújo Ferreira',
  notes: '', // ← VAZIO!
  allFields: Array(0)
}
```

## Causa Raiz

No `BookingOverlay.jsx`, o campo `notes` não estava sendo construído com a informação do pagamento, apenas os campos `paymentMethod` e `paymentId` eram salvos (mas não enviados para o campo `notes` da API).

## Solução Implementada

### BookingOverlay.jsx

Adicionei o campo `notes` com formato esperado:

```jsx
const bookingData = {
  // ... outros campos
  paymentMethod: result.paymentMethod,
  paymentId: result.paymentId,
  notes: result.paymentMethod ? `pagamento: ${result.paymentMethod}` : "",
};
```

### Cart.jsx (já estava correto)

```jsx
const payload = {
  // ... outros campos
  notes: it.notes
    ? `${it.notes} | pagamento: ${paymentMethod}`
    : `Agendamento via carrinho | pagamento: ${paymentMethod}`,
};
```

## Resultado Esperado

- Novos agendamentos do BookingOverlay terão `notes: "pagamento: pix"` (ou outro método)
- A função `formatPaymentMethod` conseguirá extrair o tipo de pagamento
- A coluna "Pagamento" na tela admin mostrará o tipo correto
- Agendamentos antigos continuarão mostrando "Não informado" até serem substituídos

## Status

✅ Implementado - aguardando teste
