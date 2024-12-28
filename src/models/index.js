const fs = require('fs');
const path = require('path');
const ftp = require('../modules/ftp');

let fileDataPath = path.resolve(__dirname, '../data/xever-data.json')
let fileData = JSON.parse(fs.readFileSync(fileDataPath, 'utf8')); 

function read(){
    return fileData;
}

function save(d,path) {
    fs.writeFileSync(path, JSON.stringify(d,null,2));
    return;
}

const model = {
    updatePlayer: async function (body){
        
    },
    listData: async function (){
        try {
            return await ftp.readFile("xever-data.json");
        } catch (error) {
            console.log("No se ha cargado la información guardada.", error);
            return fileData;
        }
    },
    create: async function (){
        try {
            await ftp.deleteFile("xever-data.json");
            await ftp.uploadFile(fileData);
        } catch (error) {
            console.log(error);
        }
    }
}

// model.setWinner(1,1,0);
// model.createGroupMatches(1)
// model.createGroupMatches(2)
// model.createGroupMatches(3)


module.exports = model;