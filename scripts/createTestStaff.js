// Script para criar funcionários de teste
import { employeeFirestoreService } from "../src/services/employeeFirestoreService.js";

const testStaff = [
  {
    name: "João Silva",
    email: "joao@xcortes.com",
    phone: "11999887766",
    position: "Barbeiro Senior",
    enterpriseEmail: "empresaadmin@xcortes.com",
    isActive: true,
    avatarUrl: "",
    skills: [
      { serviceId: "1", serviceName: "Corte Masculino", canPerform: true },
      { serviceId: "2", serviceName: "Barba", canPerform: true },
      { serviceId: "3", serviceName: "Acabamento", canPerform: true },
    ],
    workSchedule: {
      monday: {
        isWorking: true,
        morningStart: "08:00",
        morningEnd: "12:00",
        afternoonStart: "13:00",
        afternoonEnd: "17:00",
      },
      tuesday: {
        isWorking: true,
        morningStart: "08:00",
        morningEnd: "12:00",
        afternoonStart: "13:00",
        afternoonEnd: "17:00",
      },
      wednesday: {
        isWorking: true,
        morningStart: "08:00",
        morningEnd: "12:00",
        afternoonStart: "13:00",
        afternoonEnd: "17:00",
      },
      thursday: {
        isWorking: true,
        morningStart: "08:00",
        morningEnd: "12:00",
        afternoonStart: "13:00",
        afternoonEnd: "17:00",
      },
      friday: {
        isWorking: true,
        morningStart: "08:00",
        morningEnd: "12:00",
        afternoonStart: "13:00",
        afternoonEnd: "17:00",
      },
    },
  },
  {
    name: "Maria Santos",
    email: "maria@xcortes.com",
    phone: "11888776655",
    position: "Cabeleireira",
    enterpriseEmail: "empresaadmin@xcortes.com",
    isActive: true,
    avatarUrl: "",
    skills: [
      { serviceId: "4", serviceName: "Corte Feminino", canPerform: true },
      { serviceId: "5", serviceName: "Escova", canPerform: true },
      { serviceId: "6", serviceName: "Coloração", canPerform: true },
      { serviceId: "7", serviceName: "Hidratação", canPerform: true },
    ],
    workSchedule: {
      tuesday: {
        isWorking: true,
        morningStart: "09:00",
        morningEnd: "12:00",
        afternoonStart: "14:00",
        afternoonEnd: "18:00",
      },
      wednesday: {
        isWorking: true,
        morningStart: "09:00",
        morningEnd: "12:00",
        afternoonStart: "14:00",
        afternoonEnd: "18:00",
      },
      thursday: {
        isWorking: true,
        morningStart: "09:00",
        morningEnd: "12:00",
        afternoonStart: "14:00",
        afternoonEnd: "18:00",
      },
      friday: {
        isWorking: true,
        morningStart: "09:00",
        morningEnd: "12:00",
        afternoonStart: "14:00",
        afternoonEnd: "18:00",
      },
      saturday: {
        isWorking: true,
        morningStart: "08:00",
        morningEnd: "14:00",
        afternoonStart: "",
        afternoonEnd: "",
      },
    },
  },
];

async function createTestStaff() {
  try {
    for (const staff of testStaff) {
      await employeeFirestoreService.create(staff);
      console.log(`Funcionário ${staff.name} criado com sucesso!`);
    }
    console.log("Todos os funcionários de teste foram criados!");
  } catch (error) {
    console.error("Erro ao criar funcionários de teste:", error);
  }
}

// Para usar no console do navegador:
// createTestStaff();
