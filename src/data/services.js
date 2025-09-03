// Dados compartilhados da aplicação - Alinhado com API

export const serviceCategories = [
  { id: "Todos", name: "Todos", displayName: "Todos os Serviços" },
  { id: "Cortes", name: "Cortes", displayName: "Corte de Cabelo" },
  { id: "Barba", name: "Barba", displayName: "Serviços de Barba" },
  { id: "Pinturas", name: "Pinturas", displayName: "Pintura e Coloração" },
];

export const allServices = [
  // Cortes
  {
    id: "1",
    name: "Corte Masculino Clássico",
    duration: 30, // minutos
    price: 3000, // centavos (R$ 30,00)
    category: "Cortes",
    description: "Corte tradicional e elegante",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Corte Moderno",
    duration: 35, // minutos
    price: 3500, // centavos (R$ 35,00)
    category: "Cortes",
    description: "Estilo contemporâneo e atual",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Corte Social",
    duration: 25, // minutos
    price: 2500, // centavos (R$ 25,00)
    category: "Cortes",
    description: "Ideal para ambiente profissional",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "4",
    name: "Corte Degradê",
    duration: 40, // minutos
    price: 4000, // centavos (R$ 40,00)
    category: "Cortes",
    description: "Corte com degradê lateral",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Barbas
  {
    id: "5",
    name: "Barba Completa",
    duration: 25, // minutos
    price: 2500, // centavos (R$ 25,00)
    category: "Barba",
    description: "Aparar e modelar barba completa",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "6",
    name: "Aparar Barba",
    duration: 15, // minutos
    price: 1500, // centavos (R$ 15,00)
    category: "Barba",
    description: "Manutenção rápida da barba",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "7",
    name: "Barba + Bigode",
    duration: 30, // minutos
    price: 3000, // centavos (R$ 30,00)
    category: "Barba",
    description: "Cuidado completo facial",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "8",
    name: "Design de Barba",
    duration: 35, // minutos
    price: 3500, // centavos (R$ 35,00)
    category: "Barba",
    description: "Modelagem artística da barba",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Pinturas
  {
    id: "9",
    name: "Pintura Simples",
    duration: 45, // minutos
    price: 5000, // centavos (R$ 50,00)
    category: "Pinturas",
    description: "Pintura em tom único",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "10",
    name: "Mechas",
    duration: 60, // minutos
    price: 7500, // centavos (R$ 75,00)
    category: "Pinturas",
    description: "Mechas destacadas",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "11",
    name: "Pintura Completa",
    duration: 90, // minutos
    price: 10000, // centavos (R$ 100,00)
    category: "Pinturas",
    description: "Mudança completa de cor",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "12",
    name: "Luzes",
    duration: 75, // minutos
    price: 8500, // centavos (R$ 85,00)
    category: "Pinturas",
    description: "Luzes naturais no cabelo",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Funcionários alinhados com API
export const staffMembers = [
  {
    id: "1",
    name: "João Silva",
    email: "joao@barbearia.com",
    phone: "11999999999",
    specialty: "Cortes Clássicos",
    rating: 4.9,
    experience: "8 anos",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    description: "Especialista em cortes tradicionais e sociais",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Pedro Santos",
    email: "pedro@barbearia.com",
    phone: "11888888888",
    specialty: "Barba & Bigode",
    rating: 4.8,
    experience: "6 anos",
    image:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    description: "Mestre em cuidados com barba e design facial",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Carlos Lima",
    email: "carlos@barbearia.com",
    phone: "11777777777",
    specialty: "Cortes Modernos",
    rating: 4.9,
    experience: "5 anos",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    description: "Especialista em tendências e estilos inovadores",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "4",
    name: "Ana Costa",
    email: "ana@barbearia.com",
    phone: "11666666666",
    specialty: "Pintura & Coloração",
    rating: 4.7,
    experience: "7 anos",
    image:
      "https://images.unsplash.com/photo-1494790108755-2616b612b550?w=150&h=150&fit=crop&crop=face",
    description: "Artista em coloração e técnicas avançadas",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
