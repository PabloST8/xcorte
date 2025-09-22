// Serviço para integração com Evolution API para verificação por WhatsApp
// Gerencia envio e verificação de códigos de verificação

class WhatsAppVerificationService {
  constructor() {
    this.apiKey = import.meta.env.VITE_EVOLUTION_API_KEY;
    this.apiUrl = import.meta.env.VITE_EVOLUTION_API_URL || 'https://api.evolution.com.br';
    this.instance = import.meta.env.VITE_EVOLUTION_INSTANCE || 'default';
    
    // Store temporário para códigos (em produção, usar Redis ou banco)
    this.verificationCodes = new Map();
    this.attempts = new Map();
    
    // Configurações
    this.CODE_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutos
    this.MAX_ATTEMPTS = 3;
    this.CODE_LENGTH = 6;
  }

  // Gera código de verificação de 6 dígitos
  generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Formata número de telefone para padrão brasileiro
  formatPhoneNumber(phone) {
    // Remove todos os caracteres não numéricos
    const digits = phone.replace(/\D/g, '');
    
    // Se já está no formato completo com 55, mantém
    if (digits.startsWith('55') && digits.length === 13) {
      return digits;
    }
    
    // Se tem 11 dígitos (formato brasileiro sem código do país), adiciona 55
    if (digits.length === 11) {
      return '55' + digits;
    }
    
    // Se tem 10 dígitos (telefone fixo), adiciona 55
    if (digits.length === 10) {
      return '55' + digits;
    }
    
    // Se começar com 55 mas não tiver 13 dígitos, tenta corrigir
    if (digits.startsWith('55')) {
      return digits;
    }
    
    // Para outros casos, adiciona 55 na frente
    return '55' + digits;
  }

  // Envia código de verificação via WhatsApp
  async sendVerificationCode(phoneNumber) {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      const code = this.generateVerificationCode();
      const expiresAt = Date.now() + this.CODE_EXPIRY_TIME;

      // Armazena o código com timestamp de expiração
      this.verificationCodes.set(formattedPhone, {
        code,
        expiresAt,
        attempts: 0
      });

      // Reset attempts counter
      this.attempts.delete(formattedPhone);

      // Monta a mensagem
      const message = `Seu código de verificação é: ${code}\n\nEste código expira em 5 minutos.`;

      // Chama a API do Evolution
      const response = await fetch(`${this.apiUrl}/message/sendText/${this.instance}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey
        },
        body: JSON.stringify({
          number: formattedPhone,
          options: {
            delay: 1200,
            presence: 'composing'
          },
          textMessage: {
            text: message
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Erro na API Evolution: ${response.status}`);
      }

      await response.json();

      return {
        success: true,
        message: 'Código de verificação enviado',
        data: {
          phoneNumber: formattedPhone,
          expiresIn: this.CODE_EXPIRY_TIME / 1000 // em segundos
        }
      };

    } catch (error) {
      console.error('Erro ao enviar código WhatsApp:', error);
      return {
        success: false,
        error: 'Erro ao enviar código',
        message: 'Não foi possível enviar o código de verificação. Tente novamente.'
      };
    }
  }

  // Verifica o código informado pelo usuário
  async verifyCode(phoneNumber, userCode) {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      const storedData = this.verificationCodes.get(formattedPhone);

      // Verifica se existe código para este número
      if (!storedData) {
        return {
          success: false,
          error: 'Código não encontrado',
          message: 'Nenhum código de verificação foi enviado para este número.'
        };
      }

      // Verifica se o código expirou
      if (Date.now() > storedData.expiresAt) {
        this.verificationCodes.delete(formattedPhone);
        return {
          success: false,
          error: 'Código expirado',
          message: 'O código de verificação expirou. Solicite um novo código.'
        };
      }

      // Incrementa tentativas
      storedData.attempts += 1;

      // Verifica se excedeu o número máximo de tentativas
      if (storedData.attempts > this.MAX_ATTEMPTS) {
        this.verificationCodes.delete(formattedPhone);
        return {
          success: false,
          error: 'Muitas tentativas',
          message: 'Número máximo de tentativas excedido. Solicite um novo código.'
        };
      }

      // Verifica se o código está correto
      if (storedData.code !== userCode.toString()) {
        const attemptsLeft = this.MAX_ATTEMPTS - storedData.attempts;
        return {
          success: false,
          error: 'Código inválido',
          message: `Código incorreto. Você ainda tem ${attemptsLeft} tentativa(s).`,
          attemptsLeft
        };
      }

      // Código correto - remove da memória
      this.verificationCodes.delete(formattedPhone);

      return {
        success: true,
        message: 'Código confirmado',
        data: {
          phoneNumber: formattedPhone,
          verified: true
        }
      };

    } catch (error) {
      console.error('Erro ao verificar código:', error);
      return {
        success: false,
        error: 'Erro interno',
        message: 'Erro interno do servidor. Tente novamente.'
      };
    }
  }

  // Limpa códigos expirados (pode ser chamado periodicamente)
  cleanExpiredCodes() {
    const now = Date.now();
    for (const [phone, data] of this.verificationCodes.entries()) {
      if (now > data.expiresAt) {
        this.verificationCodes.delete(phone);
      }
    }
  }

  // Verifica se um número tem código ativo
  hasActiveCode(phoneNumber) {
    const formattedPhone = this.formatPhoneNumber(phoneNumber);
    const storedData = this.verificationCodes.get(formattedPhone);
    return storedData && Date.now() <= storedData.expiresAt;
  }

  // Cancela verificação para um número
  cancelVerification(phoneNumber) {
    const formattedPhone = this.formatPhoneNumber(phoneNumber);
    return this.verificationCodes.delete(formattedPhone);
  }
}

// Instância singleton
export const whatsAppVerificationService = new WhatsAppVerificationService();

// Limpa códigos expirados a cada 5 minutos
setInterval(() => {
  whatsAppVerificationService.cleanExpiredCodes();
}, 5 * 60 * 1000);

export default whatsAppVerificationService;
