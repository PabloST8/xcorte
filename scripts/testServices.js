// Script para criar serviços de teste
const testServices = [
  {
    name: "Corte Masculino",
    description: "Corte de cabelo masculino tradicional",
    price: 2500, // R$ 25,00 em centavos
    duration: { hours: 0, minutes: 30 },
    category: "Cortes",
  },
  {
    name: "Barba",
    description: "Aparar e fazer barba",
    price: 1500, // R$ 15,00 em centavos
    duration: { hours: 0, minutes: 20 },
    category: "Barbearia",
  },
  {
    name: "Corte Feminino",
    description: "Corte de cabelo feminino",
    price: 4000, // R$ 40,00 em centavos
    duration: { hours: 1, minutes: 0 },
    category: "Cortes",
  },
  {
    name: "Escova",
    description: "Escova modeladora",
    price: 3000, // R$ 30,00 em centavos
    duration: { hours: 0, minutes: 45 },
    category: "Penteados",
  },
  {
    name: "Coloração",
    description: "Pintura e coloração",
    price: 8000, // R$ 80,00 em centavos
    duration: { hours: 2, minutes: 0 },
    category: "Coloração",
  },
];

// Para usar no console do navegador:
// 1. Vá para /admin/services
// 2. Use o botão "Novo Serviço" para criar cada um dos serviços acima
console.log("Serviços de teste para criar:", testServices);
