import { useState, useEffect } from "react";

/**
 * Hook personalizado para implementar debounce em valores
 * @param {any} value - O valor a ser "debouncado"
 * @param {number} delay - O delay em milissegundos
 * @returns {any} - O valor com debounce aplicado
 */
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook personalizado para busca manual apenas
 * @param {string} initialValue - Valor inicial da busca
 * @returns {object} - { searchTerm, searchQuery, setSearchTerm, triggerSearch }
 */
export function useSearchWithDebounce(initialValue = "") {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [searchQuery, setSearchQuery] = useState(initialValue);

  // Função para disparar busca manual
  const triggerSearch = () => {
    setSearchQuery(searchTerm);
  };

  // Indicar se há busca pendente (searchTerm diferente do searchQuery)
  const isSearchPending = searchTerm !== searchQuery;

  return {
    searchTerm,
    debouncedSearchTerm: searchQuery, // Manter nome para compatibilidade
    setSearchTerm,
    triggerSearch,
    isSearching: isSearchPending,
  };
}
