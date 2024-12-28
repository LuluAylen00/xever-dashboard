const { Router } = require("express");
const app = Router();
const controller = require("../controllers/index")

app.get("/", controller.home);

app.get("/api/show-data", controller.apiList);

// app.put("/api/update-player-info", controller.apiUpdatePlayerInfo);
// app.put("/api/update-match-info", controller.apiUpdateMatchInfo);

// app.put("/api/set-winner", controller.apiSetWinner);

app.post('/api/create', controller.apiCreate);

app.use((req,res,next) => {
    return res.redirect("/");
})

module.exports = app;