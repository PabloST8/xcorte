# Deploy na VPS - XCorte

## Pré-requisitos na VPS

1. **Docker instalado**
2. **Git instalado**
3. **Portas 4000 liberadas** no firewall

## Comandos para deploy

### 1. Primeira vez (clone do repositório)

```bash
# Conectar na VPS via SSH
ssh user@your-vps-ip

# Clonar o repositório
git clone https://github.com/your-username/xcorte.git
cd xcorte

# Executar deploy
./deploy.sh
```

### 2. Atualizações (repositório já existe)

```bash
# Conectar na VPS
ssh user@your-vps-ip
cd xcorte

# Puxar atualizações
git pull

# Executar deploy
./deploy.sh
```

## Comandos úteis

```bash
# Ver logs da aplicação
docker logs xcorte-app

# Acompanhar logs em tempo real
docker logs -f xcorte-app

# Parar aplicação
docker stop xcorte-app

# Reiniciar aplicação
docker restart xcorte-app

# Ver status dos containers
docker ps

# Acessar aplicação
http://YOUR_VPS_IP:4000
```

## Configuração do Firewall (Ubuntu/Debian)

```bash
# Liberar porta 4000
sudo ufw allow 4000

# Verificar status
sudo ufw status
```

## Troubleshooting

### Container não inicia
```bash
# Ver logs detalhados
docker logs xcorte-app

# Verificar se a porta está sendo usada
sudo netstat -tlnp | grep :4000

# Remover container e tentar novamente
docker stop xcorte-app && docker rm xcorte-app
./deploy.sh
```

### Aplicação não carrega
1. Verificar se as variáveis de ambiente Firebase estão corretas
2. Verificar logs do container
3. Testar acesso local: `curl http://localhost:4000`

### Problemas de permissão
```bash
# Dar permissão ao script
chmod +x deploy.sh

# Executar como root se necessário
sudo ./deploy.sh
```
