# X-Corte API Quick Reference (Frontend Alignment)

Este arquivo resume os endpoints principais usados no frontend e o mapeamento interno de status.

## Base URL
Variável: `VITE_API_BASE_URL` (fallback proxy `/api` em dev ou domínio público em prod).

Exemplo local: `http://localhost:5000/api`

## Status de Agendamento
Frontend usa enum em `types/api.js`:
```
AGENDADO | CONFIRMADO | CANCELADO | CONCLUIDO
```
Compatibilidade automática com valores legados: `pending, confirmed, cancelled|canceled, completed`.

## Endpoints Principais
| Domínio        | Método & Caminho                                    | Uso Frontend |
|----------------|------------------------------------------------------|--------------|
| Auth           | POST /auth/register-enterprise                       | Registro empresa + admin |
| Auth           | POST /auth/login                                     | Login |
| Products (pub) | GET /products/public/{enterpriseEmail}               | Catálogo público |
| Products (adm) | POST /products                                       | Criar produto |
| Products (adm) | GET /admin/products                                  | Listar (filtros) |
| Employees      | GET /employees?enterpriseEmail=...                   | Listar funcionários |
| Employees      | POST /employees                                      | Criar funcionário |
| Employees      | POST /employees/{id}/skills                          | Adicionar skill |
| Bookings       | POST /bookings                                       | Criar agendamento |
| Bookings       | GET /bookings?enterpriseEmail=...                    | Listar (filtros) |
| Bookings       | PUT /bookings/{id}/confirm                           | Confirmar |
| Bookings       | PUT /bookings/{id}/cancel                            | Cancelar |
| Availability   | GET /employees/availability/slots                    | Horários disponíveis |
| Availability   | GET /employees/availability/check                    | Verificar slot |
| Availability   | GET /bookings/available-employees                    | Funcionários disponíveis |

## Formatos
- Data: `YYYY-MM-DD`
- Hora: `HH:MM`
- Preço: FRONT guarda em centavos internamente; backend pode retornar decimal. Adaptar se necessário.

## Normalização Implementada
- `LEGACY_STATUS_MAP` converte status antigos.
- `DataAdapters.bookingToAPI` converte dados antigos do localStorage.
- `validateBooking` converte status legado antes de validar.

## Pendências / Observações
- Verificar se backend sempre retorna `success` / `data`. Criar adaptador se divergente.
- Se backend usar preço decimal (ex: 25.00) converter para centavos antes de persistir interno.
- Endpoints de dashboard, relatórios e notificações ainda mockados no frontend (`adminService`).

## Próximos Passos Sugeridos
1. Unificar uso somente dos serviços (`bookingService`, `productService`, etc.) — remover duplicados em `barbershopService`.
2. Ajustar fluxo de criação de agendamento para usar disponibilidade real antes de POST.
3. Integrar fluxo de pagamento (se aplicável) após `/bookings`.

---
Gerado automaticamente para manter alinhamento rápido entre equipe e AI.
