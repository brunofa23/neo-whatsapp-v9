# Definindo a imagem base (Node.js)
FROM node:18-buster

# Definindo o diretório de trabalho dentro do contêiner
WORKDIR /usr/src/app

# Copiando os arquivos do seu projeto para o contêiner
COPY package*.json ./

# Instalando as dependências
RUN npm install

# Instalando dependências necessárias para o Puppeteer (Chromium)
RUN apt-get update && apt-get install -y \
    libnss3 \
    libatk-bridge2.0-0 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxi6 \
    libgdk-pixbuf2.0-0 \
    wget \
    --no-install-recommends

# Copiando o restante do código da aplicação
COPY . .

# Expondo a porta que o aplicativo vai rodar (por exemplo, 3000)
EXPOSE 3000

# Definindo o comando para rodar o seu aplicativo
CMD ["npm", "start"]
