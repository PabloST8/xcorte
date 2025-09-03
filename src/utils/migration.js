// Script de migração para converter dados antigos para nova estrutura da API

import { DataAdapters } from "./dataAdapters.js";
import { allServices, staffMembers } from "../data/services.js";

// Migrar serviços
export const migrateServices = () => {
  return allServices.map((service) => DataAdapters.serviceToAPI(service));
};

// Migrar funcionários
export const migrateStaff = () => {
  return staffMembers.map((member) => DataAdapters.employeeToAPI(member));
};

// Migrar agendamentos existentes (se houver no localStorage)
export const migrateBookings = () => {
  const savedBookings = localStorage.getItem("bookings");
  if (!savedBookings) return [];

  try {
    const bookings = JSON.parse(savedBookings);
    return bookings.map((booking) => DataAdapters.bookingToAPI(booking));
  } catch (error) {
    console.error("Erro ao migrar agendamentos:", error);
    return [];
  }
};

// Função para executar todas as migrações
export const runMigrations = () => {
  console.log("🔄 Iniciando migração dos dados...");

  const migratedServices = migrateServices();
  console.log(`✅ ${migratedServices.length} serviços migrados`);

  const migratedStaff = migrateStaff();
  console.log(`✅ ${migratedStaff.length} funcionários migrados`);

  const migratedBookings = migrateBookings();
  console.log(`✅ ${migratedBookings.length} agendamentos migrados`);

  // Salvar dados migrados (opcional)
  const migratedData = {
    services: migratedServices,
    staff: migratedStaff,
    bookings: migratedBookings,
    migrationDate: new Date().toISOString(),
  };

  console.log("🎉 Migração concluída!", migratedData);
  return migratedData;
};

// Validar se os dados estão no formato correto da API
export const validateMigratedData = (data) => {
  const errors = [];

  // Validar serviços
  data.services?.forEach((service, index) => {
    if (typeof service.price !== "number") {
      errors.push(`Serviço ${index}: price deve ser number (centavos)`);
    }
    if (typeof service.duration !== "number") {
      errors.push(`Serviço ${index}: duration deve ser number (minutos)`);
    }
    if (typeof service.isActive !== "boolean") {
      errors.push(`Serviço ${index}: isActive deve ser boolean`);
    }
  });

  // Validar funcionários
  data.staff?.forEach((employee, index) => {
    if (!employee.email || typeof employee.email !== "string") {
      errors.push(`Funcionário ${index}: email é obrigatório`);
    }
    if (!employee.phone || typeof employee.phone !== "string") {
      errors.push(`Funcionário ${index}: phone é obrigatório`);
    }
  });

  // Validar agendamentos
  data.bookings?.forEach((booking, index) => {
    if (typeof booking.productPrice !== "number") {
      errors.push(
        `Agendamento ${index}: productPrice deve ser number (centavos)`
      );
    }
    if (typeof booking.productDuration !== "number") {
      errors.push(
        `Agendamento ${index}: productDuration deve ser number (minutos)`
      );
    }
    if (!booking.enterpriseEmail) {
      errors.push(`Agendamento ${index}: enterpriseEmail é obrigatório`);
    }
  });

  return errors;
};

// Helper para mostrar comparação antes/depois
export const showMigrationPreview = (oldData, newData) => {
  console.log("📋 Preview da migração:");
  console.log("--- ANTES (formato antigo) ---");
  console.log("Serviço exemplo:", oldData.services?.[0]);
  console.log("--- DEPOIS (formato API) ---");
  console.log("Serviço exemplo:", newData.services?.[0]);
  console.log("");
  console.log("--- Principais mudanças ---");
  console.log("• price: string → number (centavos)");
  console.log("• duration: string → number (minutos)");
  console.log("• id: number → string");
  console.log("• Adicionado: isActive, createdAt, updatedAt");
  console.log("• Agendamentos: service → productName, price → productPrice");
};

export default {
  migrateServices,
  migrateStaff,
  migrateBookings,
  runMigrations,
  validateMigratedData,
  showMigrationPreview,
};
