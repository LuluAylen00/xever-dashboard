const model = require('../models/index');
const fs = require("fs");
const path = require("path");

const controller = {
    home: (req,res) => {
        return res.sendFile(path.resolve(__dirname, "../views/index.html"));
    },
    apiList: async (req,res) => {
        return res.send({
            data: await model.listData(),
            status: 200
        })
    },
    apiCreate: async function (req, res) {
        try {
            await model.create()
        } catch (error) {
            return res.send({
                status: 400
            })    
        }
        return res.send({
            status: 200
        })
    }
}

module.exports = controller;