/**
 * Utilitários para trabalhar com Firestore
 */

/**
 * Remove campos com valor undefined de um objeto para evitar erros do Firestore
 * @param {Object} data - Objeto com os dados
 * @returns {Object} - Objeto limpo sem campos undefined
 */
export const removeUndefinedFields = (data) => {
  if (!data || typeof data !== "object") return data;

  return Object.keys(data).reduce((acc, key) => {
    if (data[key] !== undefined) {
      acc[key] = data[key];
    }
    return acc;
  }, {});
};

/**
 * Remove campos vazios (null, undefined, string vazia) de um objeto
 * @param {Object} data - Objeto com os dados
 * @returns {Object} - Objeto limpo
 */
export const removeEmptyFields = (data) => {
  if (!data || typeof data !== "object") return data;

  return Object.keys(data).reduce((acc, key) => {
    const value = data[key];
    if (value !== undefined && value !== null && value !== "") {
      acc[key] = value;
    }
    return acc;
  }, {});
};

/**
 * Prepara dados para envio ao Firestore, removendo campos inválidos
 * @param {Object} data - Dados a serem enviados
 * @returns {Object} - Dados limpos e válidos para Firestore
 */
export const prepareFirestoreData = (data) => {
  return removeUndefinedFields(data);
};
