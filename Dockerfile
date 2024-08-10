# Especifica a imagem base do Node.js
FROM node:16-alpine

# Define o diretório de trabalho no contêiner
WORKDIR /app

# Instala o ipmitool e suas dependências no Alpine Linux
RUN apk update && apk add --no-cache ipmitool

# Copia o arquivo package.json e package-lock.json (se disponível) para o contêiner
COPY app/package*.json ./

# Instala as dependências do projeto
RUN npm install

# Copia o restante dos arquivos do aplicativo para o diretório de trabalho no contêiner
COPY app/ .
COPY views/ ../views

# Expõe a porta que a aplicação vai usar
EXPOSE 5000

# Comando para rodar a aplicação
CMD ["node", "server.js"]