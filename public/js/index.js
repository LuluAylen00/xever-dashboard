async function fetchGoogleSheetData(spreadsheetId, apiKey) {
  const sheetName = "Datos XEVER"; // Cambia esto al nombre de tu hoja si es distinto
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}?key=${apiKey}`;
 // https://docs.google.com/spreadsheets/d/166e5MqfdBd76dg7KOmqnaRlGoV5uOAXZC-5Jez_VJzM/edit?usp=sharing
  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data.values) {
      console.error("No se encontraron datos en la hoja");
      return [];
    }

    // Convertir las filas en objetos literales
    const [headers, ...rows] = data.values; // Separar encabezados y datos
    const result = rows.map(row => {
      return headers.reduce((obj, header, index) => {
        obj[header] = row[index] || ""; // Asignar valores con encabezados como claves
        return obj;
      }, {});
    });

    console.log("Datos extraídos:", result);
    return result;
  } catch (error) {
    console.error("Error al obtener los datos de Google Sheets:", error);
    return [];
  }
}

// Usa tu ID de hoja y clave de API
const spreadsheetId = "166e5MqfdBd76dg7KOmqnaRlGoV5uOAXZC-5Jez_VJzM"; // Reemplaza con tu ID
const apiKey = "AIzaSyDjcpdyrdcn8_ESTpHLCOnrT0MIMbg7OCk"; // Reemplaza con tu clave de API



let socket = io();

let activePage = "1v1";

function trunc (x, posiciones = 0) {
  var s = x.toString()
  var l = s.length
  var decimalLength = s.indexOf('.') + 1

  if (l - decimalLength <= posiciones){
    return x
  }
  // Parte decimal del número
  var isNeg  = x < 0
  var decimal =  x % 1
  var entera  = isNeg ? Math.ceil(x) : Math.floor(x)
  // Parte decimal como número entero
  // Ejemplo: parte decimal = 0.77
  // decimalFormated = 0.77 * (10^posiciones)
  // si posiciones es 2 ==> 0.77 * 100
  // si posiciones es 3 ==> 0.77 * 1000
  var decimalFormated = Math.floor(
    Math.abs(decimal) * Math.pow(10, posiciones)
  )
  // Sustraemos del número original la parte decimal
  // y le sumamos la parte decimal que hemos formateado
  var finalNum = entera + 
    ((decimalFormated / Math.pow(10, posiciones))*(isNeg ? -1 : 1))
  
  return finalNum
}

async function getImage(name) {
  try {
    // let steamdata;
    // console.log(name.split("/"));
    // if (steamId.split("/").length > 1 && steamId.split("/")[1] == "steam") {
      // console.log();
      
      let steamfetch = await fetch(`/json/players.json`);
      // console.log(steamfetch);
      let steamdata = await steamfetch.json();
      // console.log(steamdata);
      
      let img = steamdata.find(pl => pl.name == name).image;
      if (img.includes("/static/")){
        img = "https://www.aoe2insights.com" + img;
      }
      
      return img;
    // }
    // return "/img/default.png";
  } catch (error) {
    // console.log(error);
    return "/img/default.png";
  }
}

  async function updatePlayers(){
    let playerList = JSON.parse(sessionStorage.getItem("players"));

    let updateButton = document.querySelector("#update-button button i.fas");
    updateButton.classList.add("reloading");

    console.log("Iniciando...");
    let startTime = Date.now();
    
    let players = [];
    if (activePage == "1v1") {
      for (let i = 0; i < 215; i++) {
        try {
          let page = await fetch(`/proxy?url=https://aoe-api.worldsedgelink.com/community/leaderboard/getLeaderBoard2?leaderboard_id=3&platform=PC_STEAM&title=age2&sortBy=1&start=${i*200 || 1}&count=200`);
          // console.log(page);
          
          let data = await page.json();
    
          let newPlayers = data.leaderboardStats.map((player,i)=>{
            let thisOne = data.statGroups.find(pl => pl.id == player.statgroup_id).members[0];
            // let steamdata;
            // try {
            //   console.log(thisOne.name.split("/"));
            //   if (thisOne.name.split("/").length > 1 && thisOne.name.split("/")[1] == "steam") {
  
            //     let steamfetch = await fetch(`/proxy?url=http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=3BA33E85060D48ED356099E45C56A3D0&steamids=${thisOne.name.split("/")[2]}`);
            //     console.log(steamfetch);
            //     steamdata = await steamfetch.json();
            //   }
            // } catch (error) {
            //   // console.log(error);
              
            // }
            
            // console.log(thisOne.name.split("/")[2]);
            
  
            return {
              ...player,
              name: thisOne.alias,
              url: thisOne.name,
              country: thisOne.country,
              clan: thisOne.clanlist_name,
              image: "/img/default.png"
            }
          })
    
          // console.log(newPlayers);
          players = [...players, ...newPlayers];
        } catch (error) {
          console.log(error);
        }
        
      }
      players = players.filter(pl => (pl.name.startsWith("XEVER |") || pl.name.startsWith("X |") || (pl.name.toLowerCase().includes("xever") && pl.clan.toLowerCase().includes("xever"))));
    } else {
      players = playerList.rm1v1 ? playerList.rm1v1.players : [];
    }

    let playersTg = [];
    if (activePage == "tg") {
      for (let i = 0; i < 215; i++) {
        try {
          let page = await fetch(`/proxy?url=https://aoe-api.worldsedgelink.com/community/leaderboard/getLeaderBoard2?leaderboard_id=4&platform=PC_STEAM&title=age2&sortBy=1&start=${i*200 || 1}&count=200`);
          // console.log(page);
          
          let data = await page.json();
    
          let newPlayers = data.leaderboardStats.map((player,i)=>{
            let thisOne = data.statGroups.find(pl => pl.id == player.statgroup_id).members[0];
            // let steamdata;
            // try {
            //   console.log(thisOne.name.split("/"));
            //   if (thisOne.name.split("/").length > 1 && thisOne.name.split("/")[1] == "steam") {
  
            //     let steamfetch = await fetch(`/proxy?url=http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=3BA33E85060D48ED356099E45C56A3D0&steamids=${thisOne.name.split("/")[2]}`);
            //     console.log(steamfetch);
            //     steamdata = await steamfetch.json();
            //   }
            // } catch (error) {
            //   // console.log(error);
              
            // }
            
            // console.log(thisOne.name.split("/")[2]);
            
  
            return {
              ...player,
              name: thisOne.alias,
              url: thisOne.name,
              country: thisOne.country,
              clan: thisOne.clanlist_name,
              image: "/img/default.png"
            }
          })
    
          // console.log(newPlayers);
          playersTg = [...playersTg, ...newPlayers];
        } catch (error) {
          console.log(error);
        }
        
      }
      playersTg = playersTg.filter(pl => (pl.name.startsWith("XEVER |") || pl.name.startsWith("X |") || (pl.name.toLowerCase().includes("xever") && pl.clan.toLowerCase().includes("xever"))));
    } else {
      playersTg = playerList.rmTg ? playerList.rmTg.players : [];
    }


    console.log("Finalizando luego de "+ (Date.now() - startTime) / 1000  + " segundos");
    console.log({ rm1v1: players, rmTg: playersTg});
    

    updateButton.classList.remove("reloading");
    
    socket.emit("update-players", { rm1v1: players, rmTg: playersTg});
  }

  // updatePlayers();

  async function modifyTableBody(players, tbody) {
    // let tbody = document.querySelector("tbody");
    tbody.innerHTML = "";
    for (let i = 0; i < players.players.length; i++) {
      const player = players.players[i];
      tbody.innerHTML += `
        <tr>
          <th scope="row">${i + 1}</th>
          <td><img src="${await getImage(player.name)}"> ${player.name}</td>
          <td class="td-center td-rating">${player.rating}</td>
          <td class="td-center td-streak ${parseInt(player.streak) > 0 ? "td-streak-positive" : "td-streak-negative"}"><i>${player.streak}</i></td>
          <td class="td-center td-totalmatches">${player.losses + player.wins}</td>
          <td class="td-center td-wins">${player.wins}</td>
          <td class="td-center td-losses">${player.losses}</td>
          <td class="td-center td-winrate">${trunc(100 * player.wins / (player.losses + player.wins), 2)}%</td>
        </tr>
      `;
    }
  }

  // Función para unir jugadores sin duplicados
  function mergeUniquePlayers(data) {
    const players1v1 = data.rm1v1.players;
    const playersTg = data.rmTg.players;

    // Unimos los arrays y eliminamos duplicados por statgroup_id
    const uniquePlayers = [
        ...new Map(
            [...players1v1, ...playersTg].map(player => [player.statgroup_id, player])
        ).values()
    ];

    console.log(uniquePlayers);
    

    return uniquePlayers;
  }


  /*
  function generateEvents(players, tbody) {
    document.querySelector("#order-number").addEventListener("click",()=>{
      let state = document.querySelector("#order-number").getAttribute("data-state");
      if (!state || state == "0") {
        players.players.sort((a,b)=> a.rating - b.rating);
        document.querySelector("#order-number").setAttribute("data-state","1");
      } else if (state == "1"){
        players.players.sort((a,b)=> a.rating - b.rating);
        document.querySelector("#order-number").setAttribute("data-state","2");
      } else {
        players.players.sort((a,b)=> a.rating - b.rating);
        document.querySelector("#order-number").setAttribute("data-state","0");
      }

      modifyTableBody(players, tbody);
      generateEvents(players, tbody);
    })
    document.querySelector("#order-nick").addEventListener("click",()=>{
      let state = document.querySelector("#order-nick").getAttribute("data-state");
      if (!state || state == "0") {
        players.players.sort((a,b)=> a.name - b.name)
        document.querySelector("#order-nick").setAttribute("data-state","1");
      } else if (state == "1"){
        players.players.sort((a,b)=> a.name - b.name)
        document.querySelector("#order-nick").setAttribute("data-state","2");
      } else {
        players.players.sort((a,b)=> a.rating - b.rating);
        document.querySelector("#order-nick").setAttribute("data-state","0");
      }

      modifyTableBody(players, tbody);
      generateEvents(players, tbody);
    })
    document.querySelector("#order-rating").addEventListener("click",()=>{
      let state = document.querySelector("#order-rating").getAttribute("data-state");
      if (!state || state == "0") {
        players.players.sort((a,b)=> a.rating - b.rating)
        document.querySelector("#order-rating").setAttribute("data-state","1");
      } else if (state == "1"){
        players.players.sort((a,b)=> a.rating - b.rating)
        document.querySelector("#order-rating").setAttribute("data-state","2");
      } else {
        players.players.sort((a,b)=> a.rating - b.rating);
        document.querySelector("#order-rating").setAttribute("data-state","0");
      }

      modifyTableBody(players, tbody);
      generateEvents(players, tbody);
    })
    document.querySelector("#order-streak").addEventListener("click",()=>{
      let state = document.querySelector("#order-streak").getAttribute("data-state");
      if (!state || state == "0") {
        players.players.sort((a,b)=> a.streak - b.streak)
        document.querySelector("#order-streak").setAttribute("data-state","1");
      } else if (state == "1"){
        players.players.sort((a,b)=> a.streak - b.streak)
        document.querySelector("#order-streak").setAttribute("data-state","2");
      } else {
        players.players.sort((a,b)=> a.rating - b.rating);
        document.querySelector("#order-streak").setAttribute("data-state","0");
      }

      modifyTableBody(players, tbody);
      generateEvents(players, tbody);
    })
    document.querySelector("#order-matches").addEventListener("click",()=>{
      let state = document.querySelector("#order-matches").getAttribute("data-state");
      if (!state || state == "0") {
        players.players.sort((a,b)=> (a.losses + a.wins) - (b.losses + b.wins))
        document.querySelector("#order-matches").setAttribute("data-state","1");
      } else if (state == "1"){
        players.players.sort((a,b)=> (a.losses + a.wins) - (b.losses + b.wins))
        document.querySelector("#order-matches").setAttribute("data-state","2");
      } else {
        players.players.sort((a,b)=> a.rating - b.rating);
        document.querySelector("#order-matches").setAttribute("data-state","0");
      }

      modifyTableBody(players, tbody);
      generateEvents(players, tbody);
    })
    document.querySelector("#order-victorias").addEventListener("click",()=>{
      let state = document.querySelector("#order-victorias").getAttribute("data-state");
      if (!state || state == "0") {
        players.players.sort((a,b)=> a.wins - b.wins)
        document.querySelector("#order-victorias").setAttribute("data-state","1");
      } else if (state == "1"){
        players.players.sort((a,b)=> a.wins - b.wins)
        document.querySelector("#order-victorias").setAttribute("data-state","2");
      } else {
        players.players.sort((a,b)=> a.rating - b.rating);
        document.querySelector("#order-victorias").setAttribute("data-state","0");
      }

      modifyTableBody(players, tbody);
      generateEvents(players, tbody);
    })
    document.querySelector("#order-derrotas").addEventListener("click",()=>{
      let state = document.querySelector("#order-derrotas").getAttribute("data-state");
      if (!state || state == "0") {
        players.players.sort((a,b)=> a.losses - b.losses)
        document.querySelector("#order-derrotas").setAttribute("data-state","1");
      } else if (state == "1"){
        players.players.sort((a,b)=> a.losses - b.losses)
        document.querySelector("#order-derrotas").setAttribute("data-state","2");
      } else {
        players.players.sort((a,b)=> a.rating - b.rating);
        document.querySelector("#order-derrotas").setAttribute("data-state","0");
      }

      modifyTableBody(players, tbody);
      generateEvents(players, tbody);
    })
    document.querySelector("#order-winrate").addEventListener("click",()=>{
      let state = document.querySelector("#order-winrate").getAttribute("data-state");
      if (!state || state == "0") {
        players.players.sort((a,b)=> trunc(100 * a.wins / (a.losses + a.wins), 2) - trunc(100 * b.wins / (b.losses + b.wins), 2))
        document.querySelector("#order-winrate").setAttribute("data-state","1");
      } else if (state == "1"){
        players.players.sort((a,b)=> trunc(100 * a.wins / (a.losses + a.wins), 2) - trunc(100 * b.wins / (b.losses + b.wins), 2))
        document.querySelector("#order-winrate").setAttribute("data-state","2");
      } else {
        players.players.sort((a,b)=> a.rating - b.rating);
        document.querySelector("#order-winrate").setAttribute("data-state","0");
      }

      modifyTableBody(players, tbody);
      generateEvents(players, tbody);
    })
  }
  */
  async function loadDashboard(players){
    let spreadsheet = await fetchGoogleSheetData(spreadsheetId, apiKey);

    if (activePage == "tg") {
      players = players.rmTg;
    } else if (activePage == "1v1") {
      players = players.rm1v1;
    } else if (activePage == "birthday") {
      players = {
        players: mergeUniquePlayers(players).map(player => {
          let playerInSpreadsheet = spreadsheet.find(pl => player.url.includes(pl["ID STEAM"]))
          return {
            ...player,
            alias: playerInSpreadsheet ? playerInSpreadsheet["AKA"] : undefined ,
            birthday: playerInSpreadsheet ? playerInSpreadsheet["CUMPLEAÑOS"] : undefined ,
            team: playerInSpreadsheet ? playerInSpreadsheet["GRUPO"] : undefined 
          }
        }),
        updateTime: players.rm1v1.updateTime,
      };
      console.log(players);
      
    } else if (activePage == "teams") {
      players = {
        players: mergeUniquePlayers(players).map(player => {

          return {
            ...player,
            alias: playerInSpreadsheet ? playerInSpreadsheet["AKA"] : undefined ,
            birthday: playerInSpreadsheet ? playerInSpreadsheet["CUMPLEAÑOS"] : undefined ,
            team: playerInSpreadsheet ? playerInSpreadsheet["GRUPO"] : undefined 
          }
        }),
        updateTime: players.rm1v1.updateTime,
      };
    }

    if (activePage == "birthday") {
      // Datos de ejemplo con cumpleaños
      // const players = [
      //   { name: "Player 1", birthday: "3 de octubre" },
      //   { name: "Player 2", birthday: "27 de diciembre" },
      //   { name: "Player 3", birthday: "15 de enero" },
      //   { name: "Player 4", birthday: "28 de diciembre" }
      // ];

      // Función para ordenar cumpleaños desde hoy hasta un día antes
      function sortBirthdaysFromToday(players) {
        const today = new Date(); // Fecha actual
        const currentYear = today.getFullYear();
    
        players.forEach(player => {
            if (!player.birthday) {
                player.dateObject = null; // Manejar undefined como nulo
                return;
            }
    
            const [day, monthName] = player.birthday.split(" de ");
            const monthIndex = [
                "enero", "febrero", "marzo", "abril", "mayo", "junio",
                "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
            ].indexOf(monthName);
    
            if (monthIndex === -1) {
                player.dateObject = null; // Manejar entradas inválidas como nulo
                return;
            }
    
            // Crear dos fechas: una para este año y otra para el próximo
            const birthdayThisYear = new Date(currentYear, monthIndex, day);
            const birthdayNextYear = new Date(currentYear + 1, monthIndex, day);
    
            // Seleccionar la fecha más cercana desde hoy
            player.dateObject = birthdayThisYear >= today ? birthdayThisYear : birthdayNextYear;
        });
    
        // Ordenar: primero por `dateObject` válido y luego por la fecha
        players.sort((a, b) => {
            if (!a.dateObject && !b.dateObject) return 0;
            if (!a.dateObject) return 1; // Mover indefinidos al final
            if (!b.dateObject) return -1; // Mover indefinidos al final
            return a.dateObject - b.dateObject; // Ordenar por fecha
        });
    
        // Limpiar las fechas temporales antes de devolver
        players.forEach(player => delete player.dateObject);
    
        return players;
      }
      const sortedPlayers = sortBirthdaysFromToday(players.players);
      console.log(sortedPlayers);

      // Ordenar el array

      let dataInfo = document.getElementById("data-info");
      {
        // let minElo = document.createElement("div");
        let spinner = `
          <div class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        `;
    
        dataInfo.innerHTML = `
          <div class="card card-birthday" style="">
            <div class="card-body">
              <i class="fas fa-birthday-cake"></i>
              <div>
                <h5 class="card-title">Ultimo cumpleaños</h5>
                <p class="card-text">${sortedPlayers.filter(pl => pl.birthday)[sortedPlayers.filter(pl => pl.birthday).length-1].name}</p>
                <i>${sortedPlayers.filter(pl => pl.birthday)[sortedPlayers.filter(pl => pl.birthday).length-1].birthday}</i>
              </div>
            </div>
          </div>
          <div class="card card-birthday" style="">
            <div class="card-body">
              <i class="fas fa-glass-cheers"></i>
              <div>
                <h5 class="card-title">Próximo cumpleaños</h5>
                <p class="card-text">${sortedPlayers[0].name}</p>
                <i>${sortedPlayers[0].birthday}</i>
              </div>
            </div>
          </div>
        `
      }
      

      let dataTable = document.getElementById("data-table");
      
      let spinner = `
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      `;
      dataTable.innerHTML = spinner;
      {
        let table = document.createElement("table");
        table.classList.add("table");
        table.classList.add("table-striped");
    
        {
          let thead = document.createElement("thead");
          thead.innerHTML = `
            <tr>
              <th scope="col" data-state="0" id="order-number"><section><span># </span></th>
              <th scope="col" data-state="0" id="order-nick"><section><span>Nick </span></th>
              <th scope="col" data-state="0" id="order-birthday" class="td-center"> <section><span>Cumpleaños </span></th>
            </tr>
          `;
          table.appendChild(thead);
        }
        {
          let tbody = document.createElement("tbody");
          
          for (let i = 0; i < sortedPlayers.length; i++) {
            const player = sortedPlayers[i];
            tbody.innerHTML += `
              <tr data-name="${player.name}" data-rating="${player.rating}" data-streak="${player.streak}" data-totalmatches="${player.losses + player.wins}" data-wins="${player.wins}" data-losses="${player.losses}" data-winrate="${trunc(100 * player.wins / (player.losses + player.wins), 2)}">
                <th class="td-number" scope="row">${i + 1}</th>
                <td class="td-nick"><img src="${await getImage(player.name)}"> ${player.name} <i>(#${player.rank})</i></td>
                <td class="td-center td-wins">${player.birthday}</td>
              </tr>
            `;
          }
          table.appendChild(tbody);
  
          
          // players.players.forEach((player, i) => {
            
          // })
        }
    
        dataTable.innerHTML = "";
        dataTable.appendChild(table);
  
        // let tbody = document.querySelector("tbody");
        // generateEvents(players, tbody);
  
      }
    } else {
      let dataInfo = document.getElementById("data-info");
      {
        // let minElo = document.createElement("div");
        let spinner = `
          <div class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        `;
    
        dataInfo.innerHTML = `
          <div class="card" style="">
            <div class="card-body">
              <i class="fas fa-chevron-down"></i>
              <h5 class="card-title">Elo mínimo</h5>
              <p class="card-text">${players.min || spinner}</p>
            </div>
          </div>
          <div class="card" style="">
            <div class="card-body">
              <i class="fas fa-balance-scale"></i>
              <h5 class="card-title">Elo promedio</h5>
              <p class="card-text">${players.avg ? Math.trunc(players.avg) : spinner}</p>
            </div>
          </div>
          <div class="card" style="">
            <div class="card-body">
              <i class="fas fa-chart-line"></i>
              <h5 class="card-title">Elo máximo</h5>
              <p class="card-text">${players.max || spinner}</p>
            </div>
          </div>
          <div class="card" style="">
            <div class="card-body">
              <i class="fas fa-calculator"></i>
              <h5 class="card-title">Cantidad de jugadores</h5>
              <p class="card-text">${players.length || spinner}</p>
            </div>
          </div>
        `
      }
    
      let dataDivision = document.querySelector("#data-division");
      {
        let date = new Date(players.updateTime);
        dataDivision.innerHTML = `
          <div id="last-update">Ultima actualización: ${date.toLocaleString(navigator.language || 'es-AR', { hour12: false })}</div>
          <div id="update-button">
            <button type="button" class="btn btn-secondary"><i class="fas fa-sync-alt"></i></button>
          </div>
        `;
  
        let updateButton = document.querySelector("#update-button button");
        updateButton.addEventListener("click", () => {
          console.log("Actualizando...");
          updatePlayers();
        });
      }
  
      
    
      let dataTable = document.getElementById("data-table");
      
      let spinner = `
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      `;
      dataTable.innerHTML = spinner;
      {
        let table = document.createElement("table");
        table.classList.add("table");
        table.classList.add("table-striped");
    
        {
          let thead = document.createElement("thead");
          thead.innerHTML = `
            <tr>
              <th scope="col" data-state="0" id="order-number"><section><span># </span><i class="fas fa-caret-up"></i><i class="fas fa-caret-down"></i><i class="fas fa-minus"></i></section></th>
              <th scope="col" data-state="0" id="order-nick"><section><span>Nick </span><i class="fas fa-caret-up"></i><i class="fas fa-caret-down"></i><i class="fas fa-minus"></i></section></th>
              <th scope="col" data-state="0" id="order-rating" class="td-center"> <section><span>Elo actual</span><i class="fas fa-caret-up"></i><i class="fas fa-caret-down"></i><i class="fas fa-minus"></i></section></th>
              <th scope="col" data-state="0" id="order-streak" class="td-center"> <section><span>Racha </span><i class="fas fa-caret-up"></i><i class="fas fa-caret-down"></i><i class="fas fa-minus"></i></section></th>
              <th scope="col" data-state="0" id="order-totalmatches" class="td-center"> <section><span>Partidas </span><i class="fas fa-caret-up"></i><i class="fas fa-caret-down"></i><i class="fas fa-minus"></i></section></th>
              <th scope="col" data-state="0" id="order-wins" class="td-center"> <section><span>Victorias </span><i class="fas fa-caret-up"></i><i class="fas fa-caret-down"></i><i class="fas fa-minus"></i></section></th>
              <th scope="col" data-state="0" id="order-losses" class="td-center"> <section><span>Derrotas </span><i class="fas fa-caret-up"></i><i class="fas fa-caret-down"></i><i class="fas fa-minus"></i></section></th>
              <th scope="col" data-state="0" id="order-winrate" class="td-center"> <section><span>Winrate </span><i class="fas fa-caret-up"></i><i class="fas fa-caret-down"></i><i class="fas fa-minus"></i></section></th>
            </tr>
          `;
          table.appendChild(thead);
        }
        {
          let tbody = document.createElement("tbody");
          for (let i = 0; i < players.players.length; i++) {
            const player = players.players[i];
            tbody.innerHTML += `
              <tr data-name="${player.name}" data-rating="${player.rating}" data-streak="${player.streak}" data-totalmatches="${player.losses + player.wins}" data-wins="${player.wins}" data-losses="${player.losses}" data-winrate="${trunc(100 * player.wins / (player.losses + player.wins), 2)}">
                <th class="td-number" scope="row">${i + 1}</th>
                <td class="td-nick"><img src="${await getImage(player.name)}"> ${player.name} <i>(#${player.rank})</i></td>
                <td class="td-center td-rating">${player.rating}</td>
                <td class="td-center td-streak ${parseInt(player.streak) > 0 ? "td-streak-positive" : "td-streak-negative"}"><i>${player.streak}</i></td>
                <td class="td-center td-totalmatches">${player.losses + player.wins}</td>
                <td class="td-center td-wins">${player.wins}</td>
                <td class="td-center td-losses">${player.losses}</td>
                <td class="td-center td-winrate">${trunc(100 * player.wins / (player.losses + player.wins), 2)}%</td>
              </tr>
            `;
          }
          table.appendChild(tbody);
  
          
          // players.players.forEach((player, i) => {
            
          // })
        }
    
        dataTable.innerHTML = "";
        dataTable.appendChild(table);
  
        // let tbody = document.querySelector("tbody");
        // generateEvents(players, tbody);
  
        // const table = document.querySelector("table");
        const headers = table.querySelectorAll("thead th");
        const tbody = table.querySelector("tbody");
  
        headers.forEach(header => {
          header.addEventListener("click", () => {
            const key = header.id.replace("order-", ""); // Extraer el criterio de ordenación
            const state = parseInt(header.dataset.state, 10); // Obtener estado actual de ordenación
            const newState = state === 0 || state === -1 ? 1 : -1; // Alternar entre ascendente y descendente
            header.dataset.state = newState;
  
            // Quitar el estado de otros encabezados
            headers.forEach(h => {
              if (h !== header) h.dataset.state = 0;
            });
  
            // Obtener y ordenar las filas
            const rows = Array.from(tbody.querySelectorAll("tr"));
            rows.sort((a, b) => {
              const aValue = a.dataset[key];
              const bValue = b.dataset[key];
  
              // Comparar como números si es posible, de lo contrario como cadenas
              const aParsed = isNaN(aValue) ? aValue : parseFloat(aValue);
              const bParsed = isNaN(bValue) ? bValue : parseFloat(bValue);
  
              if (aParsed < bParsed) return -newState;
              if (aParsed > bParsed) return newState;
              return 0;
            });
  
            // Reordenar las filas en el DOM
            rows.forEach(row => tbody.appendChild(row));
          });
        })
      }
    }


    // ASDASDASD
  }

socket.on("players", (players) => {
  console.log(players);
  sessionStorage.setItem("players", JSON.stringify(players));
  
  loadDashboard(players);
});

let playerList = JSON.parse(sessionStorage.getItem("players"));
console.log(playerList);

loadDashboard(playerList);

function cleanButtons() {
  let links = document.querySelectorAll(".nav-link");
  links.forEach(link => link.classList.remove("active"));
}

document.querySelector("#rmtg-button").addEventListener("click",()=>{
  activePage = "tg";
  cleanButtons();
  document.querySelector("#rmtg-button").classList.add("active");
  loadDashboard(playerList);
})

document.querySelector("#rm1v1-button").addEventListener("click",()=>{
  activePage = "1v1";
  cleanButtons();
  document.querySelector("#rm1v1-button").classList.add("active");
  loadDashboard(playerList);
})

document.querySelector("#birthday-button").addEventListener("click",()=>{
  activePage = "birthday";
  cleanButtons();
  document.querySelector("#birthday-button").classList.add("active");
  loadDashboard(playerList);
})

// updateButton.addEventListener("click", () => {
//   console.log("Actualizando...");
  updatePlayers();
// });