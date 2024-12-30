# Usa una imagen de Node.js con Puppeteer preconfigurado
FROM ghcr.io/puppeteer/puppeteer:20.10.0

# Establece el directorio de trabajo
WORKDIR /usr/src/app

# Copia los archivos de tu proyecto
COPY package*.json ./
COPY . .

# Instala las dependencias del proyecto
RUN npm install

# Expone el puerto que tu app necesita (ajústalo según sea necesario)
EXPOSE 3418

# Comando para iniciar tu aplicación
CMD ["npm", "start"]
