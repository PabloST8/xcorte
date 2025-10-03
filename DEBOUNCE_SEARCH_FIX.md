# Hook useSearchWithDebounce

## Problema resolvido

A busca na página de agendamentos do admin estava causando reload/refetch a cada letra digitada, resultando em performance ruim e muitas requisições desnecessárias ao servidor.

## Solução implementada

Criado hook `useSearchWithDebounce` que implementa debounce na busca, aguardando 500ms após o usuário parar de digitar antes de executar a busca.

## Como usar

```jsx
import { useSearchWithDebounce } from "../../hooks/useDebounce";

function MyComponent() {
  // Hook retorna: searchTerm, debouncedSearchTerm, setSearchTerm, triggerSearch, isSearching
  const {
    searchTerm,
    debouncedSearchTerm,
    setSearchTerm,
    triggerSearch,
    isSearching,
  } = useSearchWithDebounce("", 500);

  // Use searchTerm para o input (valor imediato)
  // Use debouncedSearchTerm para requisições/filtros (valor com delay)
  // Use triggerSearch para busca manual
  // Use isSearching para feedback visual

  return (
    <div className="flex space-x-2">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyPress={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            triggerSearch();
          }
        }}
        placeholder="Buscar..."
        className="flex-1 px-3 py-2 border rounded-lg"
      />
      <button
        onClick={triggerSearch}
        className={`px-3 py-2 rounded-lg ${
          isSearching ? "bg-yellow-600" : "bg-blue-600"
        } text-white`}
      >
        Buscar
      </button>
    </div>
  );
}
```

## Benefícios

- ✅ **Performance melhorada**: Reduz requisições desnecessárias
- ✅ **UX melhor**: Evita loading states constantes
- ✅ **Flexibilidade**: Debounce automático OU busca manual com botão/Enter
- ✅ **Acessibilidade**: Suporte a Enter para usuários de teclado
- ✅ **Feedback visual**: Indicador quando há busca pendente
- ✅ **Reutilizável**: Pode ser usado em outros componentes de busca
- ✅ **Configurável**: Delay personalizável (padrão: 500ms)

## Arquivos modificados

- `src/hooks/useDebounce.js` - Novo hook criado
- `src/pages/admin/AdminAppointments.jsx` - Implementação do debounce
- `src/hooks/useAdmin.js` - Melhorada configuração do React Query

## Outros componentes que podem se beneficiar

Os seguintes componentes também têm busca sem debounce e podem ser atualizados:

- `src/pages/SuperAdmin.jsx`
- `src/pages/admin/AdminStaffNew.jsx`
- `src/pages/admin/AdminStaff.jsx`
- `src/pages/admin/AdminServices.jsx`
- `src/pages/admin/AdminClients.jsx`
