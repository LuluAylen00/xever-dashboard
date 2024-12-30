const express = require("express");
const app = express();
const fs = require("fs");
const path = require("path");

const scrapper = require('./modules/scrapper');

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
    rm1v1: {
        updateTime: Date.now(),
        min: null,
        max: null,
        avg: null
    },
    rmTg: {
        updateTime: Date.now(),
        min: null,
        max: null,
        avg: null
    },
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
        function getLowestRating(players, ladder) {
            return Math.min(...players.map(player => player[ladder].rating));
        }

        // Función para obtener el rating más alto
        function getHighestRating(players, ladder) {
            return Math.max(...players.map(player => player[ladder].rating));
        }

        // Función para obtener el promedio de rating
        function getAverageRating(players, ladder) {
            const ratings = players.map(player => player[ladder].rating);
            return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
        }

        let playersTg = incomingData.filter(p => p.rmTg);
        let players1v1 = incomingData.filter(p => p.rm1v1);

        data = {
            players: incomingData,
            rm1v1: {
                length: players1v1.length,
                min: getLowestRating(players1v1, "rm1v1"),
                max: getHighestRating(players1v1, "rm1v1"),
                avg: getAverageRating(players1v1, "rm1v1"),
                updateTime: Date.now(),
            },
            rmTg: {
                length: playersTg.length,
                min: getLowestRating(playersTg, "rmTg"),
                max: getHighestRating(playersTg, "rmTg"),
                avg: getAverageRating(playersTg, "rmTg"),
                updateTime: Date.now(),
            }
        };
        io.sockets.emit("players", data);
    })

    socket.on("bring-player-matches", async (insightsId) => {
        console.log("Llegó una petición a.... "+insightsId);
        
        let matches = await scrapper.getInsightsMatches(insightsId);
        // console.log(matches);
        
        socket.emit("player-matches", matches);
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
    let url;
    // console.log(req.query);
    
    if (req.query.type == "default") {
        url = `${req.query.url}&platform=${req.query.platform}&title=${req.query.title}&sortBy=${req.query.sortBy}&start=${req.query.start}&count=${req.query.count}`;
    } else {
        url = `${req.query.url}&title=${req.query.title}&profile_ids=${req.query.profile_ids}`;
    }
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

app.get("/api/profile/:id", async (req, res) => {
    res.send ({
        status: 200,
        data: await scrapper.getInsightsMatches(req.params.id)
    })
});
app.use("/", require("./router/index"));

// scrapper.getInsightsMatches("2826785");

// app.use("/sorteo", require("./router/index"));
// app.use("/brackets", require("./router/index"));
// app.use("/handbook", require("./router/index"));

// app.use((req,res,next) => {
//     return res.redirect("/");
// })
