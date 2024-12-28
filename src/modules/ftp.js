// Importar el módulo ftp
const path = require('path');
const fs = require('fs');
var ftp = require("ftp");

// Crear un cliente FTP
// var client = new ftp();

require('dotenv').config();

// console.log(process.env);
// Conectarse al servidor FTP
/* client.connect({
    host: process.env.FTP_HOST, // El host del servidor FTP
    user: process.env.FTP_USER, // El nombre de usuario del servidor FTP
    password: process.env.FTP_PASSWORD, // La contraseña del servidor FTP
    port: process.env.FTP_PORT,
}); */

// Exportar el cliente FTP y los métodos para tratar archivos
module.exports = {
    // client: client,
    readFile: async function readFile(fileName) {
        const filePath = path.join(__dirname, `../data/${fileName}`);
      
        try {
          const data = await fs.promises.readFile(filePath, 'utf8');
        //   console.log(data);
          return JSON.parse(data);
        } catch (err) {
          console.error(`Error al leer el archivo ${fileName}: ${err.message}`);
          return null;
        }
    },
    uploadFile: async function (data = null) {
      let loadFilePath = path.join(__dirname,"../data/xever-data.json");
      if (data) {
        fs.writeFileSync(loadFilePath, JSON.stringify(data, null, 4));
      }

      let uploadFilePath = `/htdocs/xever-data.json`;

      /* client.put(loadFilePath, uploadFilePath, function (err) {
          if (err) throw err; 
          console.log("Archivo subido con éxito"); 
          // fs.unlinkSync(file.path)
          return true;
      }); */
      return ;
    },
    deleteFile: async function (file) {
        let filePath = `/htdocs/${file}`;
        
        if (!file.includes('default')) {
            client.delete(filePath, function (err) {
                if (err) throw err; 
                console.log("Archivo eliminado con éxito"); 
            });
          return true;
        } else {
          return false;
        }
    },
};
