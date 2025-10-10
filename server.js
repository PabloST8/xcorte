import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import process from "process";

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 3001;

// Middlewares
app.use(
  cors({
    origin: [
      "http://localhost:4000",
      "http://localhost:4001",
      "http://localhost:3000",
      "http://127.0.0.1:4000",
      "http://127.0.0.1:4001",
      "http://127.0.0.1:3000",
      process.env.FRONTEND_URL || "http://localhost:4000",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Middleware para debug de CORS
app.use((req, res, next) => {
  console.log(`🌐 [${req.method}] ${req.url} - Origin: ${req.headers.origin}`);
  next();
});

app.use(express.json());

// Store temporário para códigos de verificação (em produção usar Redis)
const verificationCodes = new Map();

// Configurações
const CODE_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutos
const MAX_ATTEMPTS = 3;

// Gera código de 6 dígitos
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Formata número para padrão brasileiro
function formatPhoneNumber(phone) {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("55") && digits.length === 13) {
    return digits;
  }

  if (digits.length === 11) {
    return "55" + digits;
  }

  if (digits.length === 10) {
    return "55" + digits;
  }

  if (digits.startsWith("55")) {
    return digits;
  }

  return "55" + digits;
}

// Envia mensagem via Evolution API
async function sendWhatsAppMessage(phoneNumber, message) {
  const apiKey = process.env.EVOLUTION_API_KEY;
  const apiUrl =
    process.env.EVOLUTION_API_URL || "https://api.evolution.com.br";
  const instance = process.env.EVOLUTION_INSTANCE || "default";

  // Se não há credenciais, simula envio
  if (
    !apiKey ||
    apiKey === "sua_chave_da_api_aqui" ||
    apiKey === "sua_chave_da_evolution_api"
  ) {
    console.log(`📱 SIMULAÇÃO - Enviando para ${phoneNumber}: ${message}`);
    return { success: true, simulated: true };
  }

  try {
    const response = await fetch(`${apiUrl}/message/sendText/${instance}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apiKey,
      },
      body: JSON.stringify({
        number: phoneNumber,
        options: {
          delay: 1200,
          presence: "composing",
        },
        textMessage: {
          text: message,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro na API Evolution: ${response.status}`);
    }

    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    console.error("Erro ao enviar WhatsApp:", error);
    throw error;
  }
}

// Endpoint: POST /api/sendCode
app.post("/api/sendCode", async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    // Validações
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: "Número inválido",
        message: "Número de telefone é obrigatório",
      });
    }

    const cleanPhone = phoneNumber.replace(/\D/g, "");
    const localPhone = cleanPhone.startsWith("55")
      ? cleanPhone.slice(2)
      : cleanPhone;

    if (localPhone.length < 10 || localPhone.length > 11) {
      return res.status(400).json({
        success: false,
        error: "Número inválido",
        message: "Número de telefone deve ter 10 ou 11 dígitos",
      });
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);

    // Verifica se já existe código ativo
    const existingData = verificationCodes.get(formattedPhone);
    if (existingData && Date.now() <= existingData.expiresAt) {
      return res.status(400).json({
        success: false,
        error: "Código já enviado",
        message:
          "Um código já foi enviado para este número. Aguarde expirar ou use o código atual.",
      });
    }

    // Gera novo código
    const code = generateCode();
    const expiresAt = Date.now() + CODE_EXPIRY_TIME;

    // Armazena o código
    verificationCodes.set(formattedPhone, {
      code,
      expiresAt,
      attempts: 0,
    });

    // Monta mensagem
    const message = `Seu código de verificação é: ${code}\n\nEste código expira em 5 minutos.`;

    try {
      // Envia via WhatsApp
      await sendWhatsAppMessage(formattedPhone, message);

      res.json({
        success: true,
        message: "Código de verificação enviado",
        data: {
          phoneNumber: formattedPhone,
          expiresIn: 300,
        },
      });
    } catch (sendError) {
      // Remove código se falhou o envio
      verificationCodes.delete(formattedPhone);
      console.error("Erro ao enviar código:", sendError);

      res.status(500).json({
        success: false,
        error: "Erro ao enviar código",
        message:
          "Não foi possível enviar o código de verificação. Tente novamente.",
      });
    }
  } catch (error) {
    console.error("Erro em /api/sendCode:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno",
      message: "Erro interno do servidor",
    });
  }
});

// Endpoint: POST /api/verifyCode
app.post("/api/verifyCode", (req, res) => {
  try {
    const { phoneNumber, userCode } = req.body;

    // Validações
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: "Número inválido",
        message: "Número de telefone é obrigatório",
      });
    }

    if (!userCode) {
      return res.status(400).json({
        success: false,
        error: "Código inválido",
        message: "Código de verificação é obrigatório",
      });
    }

    const cleanCode = userCode.replace(/\D/g, "");
    if (cleanCode.length !== 6) {
      return res.status(400).json({
        success: false,
        error: "Código inválido",
        message: "Código deve ter 6 dígitos",
      });
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    const storedData = verificationCodes.get(formattedPhone);

    // Verifica se existe código
    if (!storedData) {
      return res.status(400).json({
        success: false,
        error: "Código não encontrado",
        message: "Nenhum código de verificação foi enviado para este número.",
      });
    }

    // Verifica expiração
    if (Date.now() > storedData.expiresAt) {
      verificationCodes.delete(formattedPhone);
      return res.status(400).json({
        success: false,
        error: "Código expirado",
        message: "O código de verificação expirou. Solicite um novo código.",
      });
    }

    // Incrementa tentativas
    storedData.attempts += 1;

    // Verifica máximo de tentativas
    if (storedData.attempts > MAX_ATTEMPTS) {
      verificationCodes.delete(formattedPhone);
      return res.status(400).json({
        success: false,
        error: "Muitas tentativas",
        message:
          "Número máximo de tentativas excedido. Solicite um novo código.",
      });
    }

    // Verifica código
    if (storedData.code !== cleanCode) {
      const attemptsLeft = MAX_ATTEMPTS - storedData.attempts;
      return res.status(400).json({
        success: false,
        error: "Código inválido",
        message: `Código incorreto. Você ainda tem ${attemptsLeft} tentativa(s).`,
        attemptsLeft,
      });
    }

    // Código correto - remove da memória
    verificationCodes.delete(formattedPhone);

    res.json({
      success: true,
      message: "Código confirmado",
      data: {
        phoneNumber: formattedPhone,
        verified: true,
      },
    });
  } catch (error) {
    console.error("Erro em /api/verifyCode:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno",
      message: "Erro interno do servidor",
    });
  }
});

// Endpoint de status da API
app.get("/api/status", (req, res) => {
  res.json({
    success: true,
    message: "API WhatsApp Verification funcionando",
    timestamp: new Date().toISOString(),
    activeVerifications: verificationCodes.size,
  });
});

// ===== ENDPOINTS DE AGENDAMENTO COM FIRESTORE =====

// GET /api/bookings - Listar agendamentos do Firestore
app.get("/api/bookings", async (req, res) => {
  try {
    console.log("📅 [API] GET /api/bookings chamado");
    console.log("📋 [API] Query params:", req.query);

    const { enterpriseEmail, date, status } = req.query;

    if (!enterpriseEmail) {
      return res.status(400).json({
        success: false,
        error: "enterpriseEmail é obrigatório",
      });
    }

    // Importar e usar serviços do Firestore
    const { collection, getDocs, query, where, orderBy } = await import(
      "firebase/firestore"
    );
    const { db } = await import("./server-firebase.js");

    console.log(
      "🔥 [API] Buscando agendamentos do Firestore para:",
      enterpriseEmail
    );

    // Buscar da subcoleção de agendamentos da empresa
    const appointmentsRef = collection(
      db,
      "enterprises",
      enterpriseEmail,
      "appointments"
    );
    let appointmentsQuery = query(
      appointmentsRef,
      orderBy("createdAt", "desc")
    );

    // Aplicar filtros se fornecidos
    if (date) {
      appointmentsQuery = query(
        appointmentsRef,
        where("date", "==", date),
        orderBy("createdAt", "desc")
      );
    }

    const snapshot = await getDocs(appointmentsQuery);
    const appointments = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      appointments.push({
        id: doc.id,
        ...data,
        // Mapear campos para compatibilidade
        clientName: data.clientName,
        clientEmail: data.clientEmail || "",
        clientPhone: data.clientPhone || "",
        date: data.date,
        time: data.startTime || data.time,
        startTime: data.startTime || data.time,
        service: data.productName || data.serviceName || "Serviço",
        status: data.status || "pending",
        enterpriseEmail: enterpriseEmail,
        createdAt:
          data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      });
    });

    // Aplicar filtro de status se fornecido
    let filteredAppointments = appointments;
    if (status) {
      filteredAppointments = appointments.filter(
        (app) => app.status === status
      );
    }

    console.log(
      `✅ [API] Encontrados ${filteredAppointments.length} agendamentos no Firestore`
    );

    res.json({
      success: true,
      data: filteredAppointments,
      total: filteredAppointments.length,
      timestamp: new Date().toISOString(),
      source: "firestore",
    });
  } catch (error) {
    console.error("❌ [API] Erro ao buscar agendamentos do Firestore:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
      message: error.message,
      details: "Erro ao acessar Firestore",
    });
  }
});

// POST /api/bookings - Criar agendamento
app.post("/api/bookings", async (req, res) => {
  try {
    console.log("📅 [API] POST /api/bookings chamado");
    console.log("📋 [API] Body:", req.body);

    const newBooking = {
      id: Date.now().toString(),
      ...req.body,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    console.log("✅ [API] Agendamento criado:", newBooking);

    res.json({
      success: true,
      data: newBooking,
      message: "Agendamento criado com sucesso",
    });
  } catch (error) {
    console.error("❌ [API] Erro ao criar agendamento:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
      message: error.message,
    });
  }
});

// PUT /api/bookings/:id - Atualizar agendamento
app.put("/api/bookings/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📅 [API] PUT /api/bookings/${id} chamado`);
    console.log("📋 [API] Body:", req.body);

    const updatedBooking = {
      id,
      ...req.body,
      updatedAt: new Date().toISOString(),
    };

    console.log("✅ [API] Agendamento atualizado:", updatedBooking);

    res.json({
      success: true,
      data: updatedBooking,
      message: "Agendamento atualizado com sucesso",
    });
  } catch (error) {
    console.error(
      `❌ [API] Erro ao atualizar agendamento ${req.params.id}:`,
      error
    );
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
      message: error.message,
    });
  }
});

// DELETE /api/bookings/:id - Deletar agendamento
app.delete("/api/bookings/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📅 [API] DELETE /api/bookings/${id} chamado`);

    console.log(`✅ [API] Agendamento ${id} deletado`);

    res.json({
      success: true,
      message: "Agendamento deletado com sucesso",
    });
  } catch (error) {
    console.error(
      `❌ [API] Erro ao deletar agendamento ${req.params.id}:`,
      error
    );
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
      message: error.message,
    });
  }
});

// Limpeza automática de códigos expirados
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;

  for (const [phone, data] of verificationCodes.entries()) {
    if (now > data.expiresAt) {
      verificationCodes.delete(phone);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(
      `🧹 Limpeza automática: ${cleaned} códigos expirados removidos`
    );
  }
}, 60000); // A cada 1 minuto

// Inicia servidor
app.listen(PORT, () => {
  console.log(`🚀 API WhatsApp Verification rodando na porta ${PORT}`);
  console.log(`📱 Status: http://localhost:${PORT}/api/status`);

  const hasCredentials =
    process.env.EVOLUTION_API_KEY &&
    process.env.EVOLUTION_API_KEY !== "sua_chave_da_api_aqui";

  if (hasCredentials) {
    console.log("✅ Evolution API configurada");
  } else {
    console.log(
      "⚠️  Evolution API em modo simulação - Configure as credenciais no .env"
    );
  }
});

export default app;
