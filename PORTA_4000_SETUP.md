# 🚀 Configuração para Expor Porta 4000 - XCorte

Este documento explica como configurar o servidor de desenvolvimento do XCorte para rodar na porta 4000 e como torná-la acessível externamente.

## 📋 Índice

- [Configuração do Vite](#configuração-do-vite)
- [Configuração do Firewall](#configuração-do-firewall)
- [Roteador/Modem](#roteadormodem)
- [Comandos Úteis](#comandos-úteis)
- [Verificação](#verificação)
- [Troubleshooting](#troubleshooting)

---

## 🔧 Configuração do Vite

### 1. Modificar o arquivo `vite.config.js`

Atualize o arquivo `vite.config.js` para incluir a configuração da porta 4000:

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 4000,           // Define a porta como 4000
    host: '0.0.0.0',      // Permite acesso externo (todas as interfaces)
    strictPort: true,     // Falha se a porta 4000 estiver ocupada
    proxy: {
      "/api": {
        target: "https://x-corte-api.hiarley.me",
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
```

### 2. Atualizar scripts do package.json (Opcional)

Você pode criar um script específico para rodar na porta 4000:

```json
{
  "scripts": {
    "dev": "vite",
    "dev:4000": "vite --port 4000 --host 0.0.0.0",
    "build": "vite build",
    "preview": "vite preview --port 4000 --host 0.0.0.0"
  }
}
```

---

## 🔥 Configuração do Firewall (Windows)

### 1. Abrir Firewall do Windows

```powershell
# Comando para abrir a porta 4000 no Firewall
netsh advfirewall firewall add rule name="XCorte Dev Server Port 4000" dir=in action=allow protocol=TCP localport=4000
```

### 2. Verificar se a regra foi criada

```powershell
netsh advfirewall firewall show rule name="XCorte Dev Server Port 4000"
```

### 3. Remover a regra (se necessário)

```powershell
netsh advfirewall firewall delete rule name="XCorte Dev Server Port 4000"
```

---

## 🌐 Roteador/Modem

### Port Forwarding

Para acessar externamente (fora da rede local), configure o port forwarding no seu roteador:

1. **Acesse o painel do roteador** (geralmente `192.168.1.1` ou `192.168.0.1`)
2. **Procure por "Port Forwarding"** ou "Redirecionamento de Porta"
3. **Configure:**
   - **Porta Externa:** 4000
   - **Porta Interna:** 4000
   - **IP do Dispositivo:** [Seu IP local]
   - **Protocolo:** TCP

### Descobrir seu IP local

```powershell
# Windows
ipconfig | findstr "IPv4"

# Ou mais específico
(Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Ethernet*" | Select-Object IPAddress).IPAddress
```

---

## 💻 Comandos Úteis

### Iniciar o servidor na porta 4000

```powershell
# Método 1: Usando o vite.config.js configurado
npm run dev

# Método 2: Forçando a porta via comando
npm run dev -- --port 4000 --host 0.0.0.0

# Método 3: Usando o script personalizado (se criado)
npm run dev:4000
```

### Verificar se a porta está sendo usada

```powershell
# Verificar se algo está rodando na porta 4000
netstat -an | findstr :4000

# Mais detalhado - mostra o processo
netstat -ano | findstr :4000
```

### Matar processo na porta 4000

```powershell
# Encontrar o PID do processo na porta 4000
$pid = (Get-NetTCPConnection -LocalPort 4000).OwningProcess
Stop-Process -Id $pid -Force
```

---

## ✅ Verificação

### 1. Acesso Local

Após iniciar o servidor, teste os seguintes URLs:

- `http://localhost:4000`
- `http://127.0.0.1:4000`
- `http://[SEU_IP_LOCAL]:4000`

### 2. Acesso na Rede Local

De outro dispositivo na mesma rede:

- `http://[IP_DO_SEU_COMPUTADOR]:4000`

### 3. Acesso Externo

Se configurou port forwarding:

- `http://[SEU_IP_PUBLICO]:4000`

### Comando para descobrir IP público

```powershell
# Método 1
curl.exe -s https://ifconfig.me

# Método 2
Invoke-RestMethod -Uri "https://ipinfo.io/ip"
```

---

## 🔍 Troubleshooting

### Problema: Porta 4000 ocupada

```powershell
# Verificar qual processo está usando a porta
netstat -ano | findstr :4000

# Matar o processo (substitua [PID] pelo ID do processo)
taskkill /PID [PID] /F
```

### Problema: Acesso negado externamente

1. ✅ Verifique se o firewall está configurado
2. ✅ Verifique se o servidor está rodando com `host: '0.0.0.0'`
3. ✅ Verifique o port forwarding no roteador
4. ✅ Teste primeiro o acesso local

### Problema: Vite não inicia na porta 4000

```powershell
# Forçar uma porta específica
npm run dev -- --port 4000

# Ou usar uma porta disponível automaticamente
npm run dev -- --port 0
```

### Verificar logs do Vite

O Vite mostrará a URL de acesso no terminal:

```
  ➜  Local:   http://localhost:4000/
  ➜  Network: http://192.168.1.100:4000/
```

---

## 📝 Exemplo de Configuração Completa

### vite.config.js

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 4000,
    host: '0.0.0.0',
    strictPort: true,
    proxy: {
      "/api": {
        target: "https://x-corte-api.hiarley.me",
        changeOrigin: true,
        secure: true,
      },
    },
  },
  preview: {
    port: 4000,
    host: '0.0.0.0',
  },
});
```

### package.json (scripts)

```json
{
  "scripts": {
    "dev": "vite",
    "dev:4000": "vite --port 4000 --host 0.0.0.0",
    "build": "vite build",
    "preview": "vite preview",
    "preview:4000": "vite preview --port 4000 --host 0.0.0.0"
  }
}
```

---

## 🔐 Considerações de Segurança

⚠️ **Importante:** Expor a porta 4000 externamente pode ser um risco de segurança.

### Recomendações:

1. **Apenas para desenvolvimento:** Use esta configuração apenas em ambiente de desenvolvimento
2. **Firewall:** Mantenha o firewall ativo
3. **VPN:** Para acesso remoto, considere usar VPN
4. **HTTPS:** Para produção, sempre use HTTPS
5. **Autenticação:** Implemente autenticação robusta

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs do terminal
2. Teste o acesso local primeiro
3. Verifique as configurações do firewall
4. Consulte a documentação do Vite: https://vitejs.dev/config/server-options.html

---

*Documento criado para o projeto XCorte - Sistema de Agendamento*
