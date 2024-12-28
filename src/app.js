const express = require("express");
const app = express();
const fs = require("fs");
const path = require("path")

let port = process.env.PORT || 3418
// app.listen(port, ()=> console.log("Servidor corriendo en el puerto "+port))

const http = require('http');
const server = http.createServer(app);
server.listen(port)

const socketIo = require("socket.io");
const io = new socketIo.Server(server);

let fetch;
(async () => {
  fetch = (await import('node-fetch')).default;
})();

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

// let mensajes = [];
let totalCount = 0;
let actualCount = 0;
let maxCount = {
    count: 0,
    time: Date.now()
};
let data = {
    players: [],
    updateTime: Date.now(),
};

io.on('connection', async (socket) => {
    console.log("Un usuario está dentro");
    socket.emit("players", data);

    socket.on('new-guest', () => {

        // console.log(io.sockets.sockets);
        actualCount = actualCount + 1;
        totalCount = totalCount + 1;
        if (actualCount > maxCount.count) {
            console.log("Se superó el record");
            maxCount.count = actualCount;
            maxCount.time = Date.now();
        };
        // console.log({total: totalCount, actual: actualCount , max: maxCount});
        io.sockets.emit("guest-list", {total: totalCount, actual: actualCount , max: maxCount});
    })

    socket.on("disconnect", () => {
        actualCount -= 1;
        io.sockets.emit("guest-list", {total: totalCount, actual: actualCount , max: maxCount});
    })
    
    socket.on("new-content", (data) => {
        io.sockets.emit("new-content", data);
    })

    socket.on("update-players", (incomingData) => {
        // Función para obtener el rating más bajo
        function getLowestRating(players) {
            return Math.min(...players.map(player => player.rating));
        }

        // Función para obtener el rating más alto
        function getHighestRating(players) {
            return Math.max(...players.map(player => player.rating));
        }

        // Función para obtener el promedio de rating
        function getAverageRating(players) {
            const ratings = players.map(player => player.rating);
            return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
        }

        data = {
            rm1v1: {
                players: incomingData.rm1v1,
                length: incomingData.rm1v1.length,
                min: getLowestRating(incomingData.rm1v1),
                max: getHighestRating(incomingData.rm1v1),
                avg: getAverageRating(incomingData.rm1v1),
                updateTime: Date.now(),
            },
            rmTg: {
                players: incomingData.rmTg,
                length: incomingData.rmTg.length,
                min: getLowestRating(incomingData.rmTg),
                max: getHighestRating(incomingData.rmTg),
                avg: getAverageRating(incomingData.rmTg),
                updateTime: Date.now(),
            }
        };
        io.sockets.emit("players", data);
    })
    // socket.on("messages-list", () =>{
    //     io.sockets.emit("messages", mensajes);
    // })

    // socket.on("new-message", (mensaje) => {
    //     mensajes.push({
    //         mensaje: mensaje.texto,
    //         emisor: mensaje.emisor
    //     })
    //     io.sockets.emit("messages", mensajes);
    // })
});

app.use(express.json());
app.use(express.static(path.resolve(__dirname, "../public")));

app.get('/proxy', async (req, res) => {
    const url = `${req.query.url}&platform=${req.query.platform}&title=${req.query.title}&sortBy=${req.query.sortBy}&start=${req.query.start}&count=${req.query.count}`;
    // console.log(url);
    
    try {
      const response = await fetch(url);
      const data = await response.json();
    //   console.log(data);
      
      res.json(data);
    } catch (error) {
      console.error("Error al realizar el fetch:", error);
      res.status(500).send("Error en el servidor al intentar obtener los datos.");
    }
  });

app.use("/", require("./router/index"));

// app.use("/sorteo", require("./router/index"));
// app.use("/brackets", require("./router/index"));
// app.use("/handbook", require("./router/index"));

// app.use((req,res,next) => {
//     return res.redirect("/");
// })
