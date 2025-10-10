// Utilitário para formatação e validação de telefone brasileiro
// Usado para garantir consistência em todos os formulários do sistema

import { useState } from "react";

/**
 * Formata um número de telefone brasileiro
 * Limita a 11 dígitos e aplica formatação automática
 *
 * @param {string} value - Valor a ser formatado
 * @returns {string} - Telefone formatado no padrão (XX) XXXXX-XXXX
 *
 * Exemplos:
 * "11999999999" → "(11) 99999-9999"
 * "119999999999999" → "(11) 99999-9999" (limitado a 11 dígitos)
 * "11abc999def9999" → "(11) 99999-9999" (caracteres não numéricos removidos)
 */
export const formatPhone = (value) => {
  const digits = String(value || "")
    .replace(/\D/g, "") // Remove caracteres não numéricos
    .slice(0, 11); // Limita a 11 dígitos

  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

/**
 * Valida se um telefone brasileiro é válido
 *
 * @param {string} phone - Telefone a ser validado
 * @returns {object} - {isValid: boolean, error: string}
 */
export const validatePhone = (phone) => {
  if (!phone || !phone.trim()) {
    return { isValid: false, error: "Telefone é obrigatório" };
  }

  const digits = phone.replace(/\D/g, "");

  if (digits.length < 10) {
    return { isValid: false, error: "Telefone deve ter pelo menos 10 dígitos" };
  }

  if (digits.length > 11) {
    return { isValid: false, error: "Telefone deve ter no máximo 11 dígitos" };
  }

  // Validar padrões brasileiros básicos
  if (digits.length === 11) {
    // Celular: deve começar com 9 após o DDD
    const ddd = digits.slice(0, 2);
    const firstDigit = digits.charAt(2);

    // DDDs válidos (principais)
    const validDDDs = [
      "11",
      "12",
      "13",
      "14",
      "15",
      "16",
      "17",
      "18",
      "19", // SP
      "21",
      "22",
      "24", // RJ
      "27",
      "28", // ES
      "31",
      "32",
      "33",
      "34",
      "35",
      "37",
      "38", // MG
      "41",
      "42",
      "43",
      "44",
      "45",
      "46", // PR
      "47",
      "48",
      "49", // SC
      "51",
      "53",
      "54",
      "55", // RS
      "61", // DF
      "62",
      "64", // GO
      "63", // TO
      "65",
      "66", // MT
      "67", // MS
      "68", // AC
      "69", // RO
      "71",
      "73",
      "74",
      "75",
      "77", // BA
      "79", // SE
      "81",
      "87", // PE
      "82", // AL
      "83", // PB
      "84", // RN
      "85",
      "88", // CE
      "86",
      "89", // PI
      "91",
      "93",
      "94", // PA
      "92",
      "97", // AM
      "95", // RR
      "96", // AP
      "98",
      "99", // MA
    ];

    if (!validDDDs.includes(ddd)) {
      return { isValid: false, error: "DDD inválido" };
    }

    if (firstDigit !== "9") {
      return { isValid: false, error: "Celular deve começar com 9 após o DDD" };
    }
  }

  if (digits.length === 10) {
    // Telefone fixo: primeiro dígito não pode ser 9
    const firstDigit = digits.charAt(2);
    if (firstDigit === "9") {
      return { isValid: false, error: "Telefone fixo não pode começar com 9" };
    }
  }

  return { isValid: true, error: "" };
};

/**
 * Hook para gerenciar estado de telefone com formatação automática
 *
 * @param {string} initialValue - Valor inicial
 * @returns {object} - {phone: string, setPhone: function, isValid: boolean, error: string}
 */
export const usePhoneInput = (initialValue = "") => {
  const [phone, setPhoneInternal] = useState(formatPhone(initialValue));

  const setPhone = (value) => {
    const formatted = formatPhone(value);
    setPhoneInternal(formatted);
  };

  const validation = validatePhone(phone);

  return {
    phone,
    setPhone,
    isValid: validation.isValid,
    error: validation.error,
  };
};

export default {
  formatPhone,
  validatePhone,
  usePhoneInput,
};
