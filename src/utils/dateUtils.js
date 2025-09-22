/**
 * Utilitários para formatação de datas no padrão brasileiro
 */

/**
 * Formatar data no padrão brasileiro (dd/mm/aaaa)
 * @param {string|Date} dateInput - Data no formato ISO (YYYY-MM-DD) ou objeto Date
 * @returns {string} Data formatada (dd/mm/aaaa)
 */
export const formatDateBR = (dateInput) => {
  if (!dateInput) return "Data não informada";
  
  try {
    let date;
    
    if (typeof dateInput === 'string') {
      // Se for string no formato YYYY-MM-DD, criar Date sem problemas de timezone
      if (dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateInput.split('-');
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        date = new Date(dateInput);
      }
    } else {
      date = new Date(dateInput);
    }
    
    if (isNaN(date.getTime())) {
      return dateInput.toString();
    }
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.warn('Erro ao formatar data:', error, dateInput);
    return dateInput?.toString() || "Data inválida";
  }
};

/**
 * Formatar data e hora no padrão brasileiro (dd/mm/aaaa às HH:mm)
 * @param {string|Date} dateInput - Data
 * @param {string} timeInput - Hora no formato HH:mm
 * @returns {string} Data e hora formatada
 */
export const formatDateTimeBR = (dateInput, timeInput) => {
  const formattedDate = formatDateBR(dateInput);
  const formattedTime = timeInput || "Horário não informado";
  
  if (formattedDate === "Data não informada" || formattedDate === "Data inválida") {
    return formattedDate;
  }
  
  return `${formattedDate} às ${formattedTime}`;
};

/**
 * Formatar data por extenso no padrão brasileiro
 * @param {string|Date} dateInput - Data
 * @returns {string} Data por extenso
 */
export const formatDateLongBR = (dateInput) => {
  if (!dateInput) return "Data não informada";
  
  try {
    let date;
    
    if (typeof dateInput === 'string') {
      if (dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateInput.split('-');
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        date = new Date(dateInput);
      }
    } else {
      date = new Date(dateInput);
    }
    
    if (isNaN(date.getTime())) {
      return dateInput.toString();
    }
    
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.warn('Erro ao formatar data por extenso:', error, dateInput);
    return dateInput?.toString() || "Data inválida";
  }
};

/**
 * Formatar data para exibição em tabelas/listas
 * @param {string|Date} dateInput - Data
 * @returns {string} Data formatada
 */
export const formatDateTableBR = (dateInput) => {
  if (!dateInput) return "-";
  
  try {
    let date;
    
    if (typeof dateInput === 'string') {
      if (dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateInput.split('-');
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        date = new Date(dateInput);
      }
    } else {
      date = new Date(dateInput);
    }
    
    if (isNaN(date.getTime())) {
      return "-";
    }
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch {
    return "-";
  }
};

/**
 * Formatar hora no padrão brasileiro (HH:mm)
 * @param {string} timeInput - Hora
 * @returns {string} Hora formatada
 */
export const formatTimeBR = (timeInput) => {
  if (!timeInput) return "Horário não informado";
  
  // Se já está no formato HH:mm, retornar
  if (typeof timeInput === 'string' && timeInput.match(/^\d{2}:\d{2}/)) {
    return timeInput.slice(0, 5); // Pegar apenas HH:mm
  }
  
  return timeInput.toString();
};

/**
 * Obter data atual no formato brasileiro
 * @returns {string} Data atual (dd/mm/aaaa)
 */
export const getCurrentDateBR = () => {
  return formatDateBR(new Date());
};

/**
 * Obter data e hora atual no formato brasileiro
 * @returns {string} Data e hora atual (dd/mm/aaaa às HH:mm)
 */
export const getCurrentDateTimeBR = () => {
  const now = new Date();
  const time = now.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  return formatDateTimeBR(now, time);
};