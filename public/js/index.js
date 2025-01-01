// Usa tu ID de hoja y clave de API
const spreadsheetId = "166e5MqfdBd76dg7KOmqnaRlGoV5uOAXZC-5Jez_VJzM"; // Reemplaza con tu ID
const apiKey = "AIzaSyDjcpdyrdcn8_ESTpHLCOnrT0MIMbg7OCk"; // Reemplaza con tu clave de API

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

async function modifyTableBody(players, tbody) {
  // let tbody = document.querySelector("tbody");
  tbody.innerHTML = "";
  for (let i = 0; i < players.players.length; i++) {
    const player = players.players[i];
    tbody.innerHTML += `
      <tr class="player-menu" data-profile="${players.statGroups_id}">
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

window.addEventListener("load", async ()=> {

  let sessionData = JSON.parse(sessionStorage.getItem("players"))

  let spreadsheet = await fetchGoogleSheetData(spreadsheetId, apiKey);





  let socket = io();

  let activePage = "rm1v1";



  async function updatePlayers(){
    let playerList = JSON.parse(sessionStorage.getItem("players")) || [];

    let updateButton = document.querySelector("#update-button button i.fas");
    updateButton.classList.add("reloading");

    console.log("Iniciando...");
    let startTime = Date.now();
    
    let players = [];

    let pageUrl;
    if (activePage == "rmTg") {
      console.log("preparando para actualizar tg");
      pageUrl = ["/proxy?url=https://aoe-api.worldsedgelink.com/community/leaderboard/getLeaderBoard2?leaderboard_id=4&platform=PC_STEAM&title=age2&type=default&sortBy=1&start=","&count=200"];
    } else {
      console.log("preparando para actualizar 1v1");
      pageUrl = ["/proxy?url=https://aoe-api.worldsedgelink.com/community/leaderboard/getLeaderBoard2?leaderboard_id=3&platform=PC_STEAM&title=age2&type=default&sortBy=1&start=","&count=200"];
    }

    let amount = 4;
    let progressCont = document.querySelector(".progress");
    progressCont.classList.remove("hide");
    let progressBar = document.querySelector(".progress-bar");
    progressBar.classList.remove("hide");
    for (let i = 0; i < amount; i++) {
      // console.log(`${i || 1} de ${amount}`);
      
      let page = await fetch(pageUrl[0]+(i*200 || 1)+pageUrl[1]);
      let data = await page.json();

      amount = data.rankTotal / 200;

      progressBar.setAttribute("style", `width: ${(i || 1) * 100 / amount}%`);
      
      let newPlayers = data.leaderboardStats.map((player,i)=>{
        let thisOne = data.statGroups.find(pl => pl.id == player.statgroup_id).members[0];            
        // console.log("newplayers", player);
        // console.log("thisOne", thisOne);

        let cleanPlayerStats = {
          name: thisOne.alias,
          url: thisOne.name,
          country: thisOne.country,
          clan: thisOne.clanlist_name,
          image: "/img/default.png",
        }
        
        let ladderStats = {
          rank: player.rank,
          highestrank: player.highestrank,
          drops: player.drops,
          rating: player.rating,
          highestrating: player.highestrating,
          losses: player.losses,
          wins: player.wins,
          streak: player.streak,
          lastmatchdate: player.lastmatchdate 
        }

        cleanPlayerStats[player.leaderboard_id == "3" ? "rm1v1" : "rmTg"] = ladderStats;
        // console.log("cleanplayerstats", cleanPlayerStats);
        
        
        return cleanPlayerStats;
      })
      players = [...players, ...newPlayers];
    };

    function isWhiteListed(urlDeSteam) {
      let urls = [
        "76561198096340360", // Bl4ck principal
        // "76561199234087198", // Bl4ck secundaria
        "76561198314917416", // m0re principal
        "76561198420133451" // Mago principal
      ]
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        if (urlDeSteam.includes(url)) {
          return true;
        }
      }
      return false;
    };

    players = players.filter(pl => {
      // Si está en el clan normalmente (o si tiene la X en lugar de XEVER)
      if (pl.name.startsWith("XEVER |") || pl.name.startsWith("X |")) {
        return true;
        // Si está en el clan pero no tiene la barra vertical en el nombre
      } else if (pl.name.toLowerCase().includes("xever") && pl.clan.toLowerCase().includes("xever")){
        return true;
        // Si tienen coronita y no se van a poner el tag.......
      } else if (isWhiteListed(pl.url)) {
        return true;
      } else {
        return false;
      }
    });

    console.log(players);
    
    let finalList = [];
    
    let completeArray = [...sessionData.players, ...players];
    
    completeArray.forEach(async pl => {
      let playerInSpreadsheet = spreadsheet.find(p => pl.url.includes(p["ID STEAM"]))
          
      pl.alias = playerInSpreadsheet ? playerInSpreadsheet["AKA"] : undefined;
      pl.birthday = playerInSpreadsheet ? playerInSpreadsheet["CUMPLEAÑOS"] : undefined;
      pl.team = playerInSpreadsheet ? playerInSpreadsheet["GRUPO"] : undefined; 
          

      let playerFound = finalList.find(p => {
        return p.name == pl.name;
      })
      let existentPlayer = finalList.indexOf(playerFound);
      // console.log();
      
      // console.log(existentPlayer);
      if (existentPlayer > -1) {
        finalList[existentPlayer]["rm1v1"] = pl.rm1v1 ? pl.rm1v1 : finalList[existentPlayer]["rm1v1"];
        finalList[existentPlayer]["rmTg"] = pl.rmTg ? pl.rmTg : finalList[existentPlayer]["rmTg"];
        // finalList.push(existentPlayer);
      } else {
        finalList.push(pl);
        // console.log(`${pl.name} no existía, asique se añadió uno mas al total de ${finalList.length}`);
        
      }
    })
    // console.log(finalList);
    
    
    console.log("Finalizando luego de "+ (Date.now() - startTime) / 1000  + " segundos");
    updateButton.classList.remove("reloading");
    
    progressCont.classList.add("hide");
    progressBar.classList.add("hide");
    
    socket.emit("update-players", finalList);
  }

  // updatePlayers();

  

  // Función para unir jugadores sin duplicados
  

  let playerData;
  socket.on("player-data", data => playerData = data);
  async function loadDashboard(){
    let totalPlayers = sessionData;
    console.log(sessionData);
    
    let variable = activePage;
    let players = {};

    sessionData.players.sort((a,b) => {
      if (activePage == "rm1v1") {
        return (b.rm1v1 ? b.rm1v1.rating : 0) - (a.rm1v1 ? a.rm1v1.rating : 100);
      } else if (activePage == "rmTg") {
        return ( b.rmTg ? b.rmTg.rating : 0) - ( a.rmTg ? a.rmTg.rating : 100);
      }
    })

    if (activePage == "birthday") {
      
      const sortedPlayers = sortBirthdaysFromToday(sessionData.players);

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
                <td class="td-nick"><img src="${await getImage(player.name)}"> ${player.name}</td>
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
        // console.log(sessionData);
        // console.log(activePage);
        
        dataInfo.innerHTML = `
          <div class="card" style="">
            <div class="card-body">
              <i class="fas fa-chevron-down"></i>
              <h5 class="card-title">Elo mínimo</h5>
              <p class="card-text">${sessionData[variable].min || spinner}</p>
            </div>
          </div>
          <div class="card" style="">
            <div class="card-body">
              <i class="fas fa-balance-scale"></i>
              <h5 class="card-title">Elo promedio</h5>
              <p class="card-text">${sessionData[variable].avg ? Math.trunc(sessionData[variable].avg) : spinner}</p>
            </div>
          </div>
          <div class="card" style="">
            <div class="card-body">
              <i class="fas fa-chart-line"></i>
              <h5 class="card-title">Elo máximo</h5>
              <p class="card-text">${sessionData[variable].max || spinner}</p>
            </div>
          </div>
          <div class="card" style="">
            <div class="card-body">
              <i class="fas fa-calculator"></i>
              <h5 class="card-title">Cantidad de jugadores</h5>
              <p class="card-text">${sessionData[variable].length || spinner}</p>
            </div>
          </div>
        `
      }
    
      let dataDivision = document.querySelector("#data-division");
      {
        let date = new Date(sessionData[variable].updateTime);
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
          for (let i = 0; i < sessionData.players.filter(p => p[variable]).length; i++) {
            const player = sessionData.players.filter(p => p[variable])[i];
            tbody.innerHTML += `
              <tr data-name="${player.name}" data-rating="${player[variable].rating}" data-streak="${player[variable].streak}" data-totalmatches="${player[variable].losses + player[variable].wins}" data-wins="${player[variable].wins}" data-losses="${player[variable].losses}" data-winrate="${trunc(100 * player[variable].wins / (player[variable].losses + player[variable].wins), 2)}">
                <th class="td-number" scope="row">${i + 1}</th>
                <td class="td-nick"><img src="${await getImage(player.name)}"> ${player.name} <i>(#${player[variable].rank})</i></td>
                <td class="td-center td-rating">${player[variable].rating}</td>
                <td class="td-center td-streak ${parseInt(player[variable].streak) > 0 ? "td-streak-positive" : "td-streak-negative"}"><i>${player[variable].streak}</i></td>
                <td class="td-center td-totalmatches">${player[variable].losses + player[variable].wins}</td>
                <td class="td-center td-wins">${player[variable].wins}</td>
                <td class="td-center td-losses">${player[variable].losses}</td>
                <td class="td-center td-winrate">${trunc(100 * player[variable].wins / (player[variable].losses + player[variable].wins), 2)}%</td>
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

        let tableRows = document.querySelectorAll("#data-table tbody tr");
        // console.log(tableRows);
        tableRows.forEach(tableRow => {
          tableRow.addEventListener("click", () => {
            // console.log(tableRow.dataset);
            // Aquí podrías mostrar información detallada del jugador seleccionado
            //...

            // socket.emit("find-player", tableRow.dataset.name);

            fetch(`/json/players.json`)
            .then((res)=> res.json())
            .then(async (resultPlayers)=> {
              let foundPlayer = resultPlayers.find(pl => pl.name == tableRow.dataset.name);
              // console.log(totalPlayers);
              
              let gotPlayer = sessionData.players.find(pl => pl.name == tableRow.dataset.name);
              
              // let playerInSpreadsheet = {};
              // if (gotPlayer) {
              //  playerInSpreadsheet = spreadsheet.find(pl => gotPlayer.url.includes(pl["ID STEAM"])); 
              // }
              foundPlayer = {
                ...foundPlayer,
                // ...playerInSpreadsheet,
                ...gotPlayer
              }
              console.log(foundPlayer);

              let matches;
              // socket.emit("bring-player-matches", foundPlayer.insightsId);
              // socket.on("player-matches",(data)=>{
              //   console.log("llegó data", data);
              //   // matches = data;
                
              //   // let htmlMatches = data.map(match => {

              //   //   // return 
              //   // })
              // });
              
              if (foundPlayer && foundPlayer.insightsId) {
                /* 
                let dataJson = await fetch(`/proxy?url=https://aoe-api.worldsedgelink.com/community/leaderboard/getRecentMatchHistory?title=age2&profile_ids=[${foundPlayer.insightsId}]`)
                let profileResult = await dataJson.json();
                console.log(profileResult);
                
                let profiles = profileResult.profiles;
                let recentMatches = profileResult.matchHistoryStats;

                recentMatches.sort((a,b)=> b.id - a.id);
                console.log(recentMatches);
                
                recentMatches = recentMatches.map(match => {
                  let matchhistorymember = match.matchhistorymember;
                  let matchhistoryreportresults = match.matchhistoryreportresults;
                  matchhistoryreportresults = matchhistoryreportresults.map((m => {
                    return {
                      ...m,
                      ...matchhistorymember.find(ma => ma.profile_id == m.profile_id),
                      ...profiles.find(p => p.profile_id == m.profile_id)
                    };
                  }))

                  
                //   function sanitizeBase64(base64String) {
                //     return base64String.replace(/[\n\r\s]/g, '');
                // }
                function decompressGzipBase64(base64Compressed) {
                  try {
                      const fixedBase64 = fixBase64Length(base64Compressed);
                      const binaryString = atob(fixedBase64);
                      // console.log("binary string",binaryString);
                      
                      const binaryData = Uint8Array.from(binaryString, char => char.charCodeAt(0));
                      // console.log("binary data",binaryData);

                      const decompressedData = pako.inflate(binaryData, { to: 'string' });
                      // console.log("decompressed data",decompressedData);

                      // const asdasd = atob(decompressedData);
                      // console.log(asdasd);
                      
                      return decompressedData;
                  } catch (error) {
                      console.error("Error al descomprimir y decodificar:", error);
                      return null;
                  }
              }
              
              // function decodeBase64(base64String) {
              //   var byteCharacters = atob(base64String);
              //   var byteNumbers = new Array(byteCharacters.length);
              //   for (var i = 0; i < byteCharacters.length; i++) {
              //     byteNumbers[i] = byteCharacters.charCodeAt(i);
              //   }
  
              //   var byteArray = new Uint8Array(byteNumbers);
              //   var blob = new Blob([ byteArray ], {
              //     type : undefined
              //   });

              //   // console.log(byteArray, blob);
                
              //   return blob;
              // }
              
              function fixBase64Length(base64String) {
                  const padding = base64String.length % 4;
                  if (padding !== 0) {
                      base64String += '='.repeat(4 - padding);
                  }
                  return base64String;
              }
              
              // function sanitizeBase64(base64String) {
              //     return base64String.replace(/[\n\r\s]/g, '');
              // }
              
              // Tu cadena comprimida
              // const compressedBase64Input = `eNpFUs1upDAMfpc+AQw0Ug89MAqtspWdMpsZiT0uXbE1q2WkdgTk6evECeVkYn8//rn72XQNfwdws28WjnSjYElvdL0dQ6inzRIskm/V7zHma/TX+2OIdL9YatoQopsUCGdt3fUmmE7h6SO8lcw5d//eXi/FpX07fF6c//W3I9Sn94fbS/nj9OqKxDOvsJwF4+YKk0/U7ClqTgf7f4q1Vp+z5j3jNsmPex7dqEA8HywNlXgaFHTxrUTKmL7cMdSrP91Z+qB2gwYiP/dpQgCO5+RYj8bn6MEB/5tN5jUW9r1YU+xjLPwVcyX+UWGXPLm5lPzAc2yfYt63gf9JtIxCJ/OFoCO+VtRzBU0vcZgXnVNNn3tb0c+1cLehDyPcJnAvoDPnvrMN9Jx8m9VSvwjW8P6NeCFQSM2z8MSey1RfcE2uL3MfwHNEMqJDQ76tir3XxzHW1gGX9D1Svqlh34V1+8157idpTDxL4UUfdpV26TK+W3Pe8q4Svvq+2aH+vo8h91+Fmz3G+xh5F9M+I8t3j+K9Bto9BI7Huy+rsPqW`;
              // const compressedBase64Input = `eNpFUs1upDAMfpc+AQw0Ug89MAqtspWdMpsZiT0uXbE1q2WkdgTk6evECeVkYn8//rn72XQNfwdws28WjnSjYElvdL0dQ6inzRIskm/V7zHma/TX+2OIdL9YatoQopsUCGdt3fUmmE7h6SO8lcw5d//eXi/FpX07fF6c//W3I9Sn94fbS/nj9OqKxDOvsJwF4+YKk0/U7ClqTgf7f4q1Vp+z5j3jNsmPex7dqEA8HywNlXgaFHTxrUTKmL7cMdSrP91Z+qB2gwYiP/dpQgCO5+RYj8bn6MEB/5tN5jUW9r1YU+xjLPwVcyX+UWGXPLm5lPzAc2yfYt63gf9JtIxCJ/OFoCO+VtRzBU0vcZgXnVNNn3tb0c+1cLehDyPcJnAvoDPnvrMN9Jx8m9VSvwjW8P6NeCFQSM2z8MSey1RfcE2uL3MfwHNEMqJDQ76tir3XxzHW1gGX9D1Svqlh34V1+8157idpTDxL4UUfdpV26TK+W3Pe8q4Svvq+2aH+vo8h91+Fmz3G+xh5F9M+I8t3j+K9Bto9BI7Huy+rsPqW`;
              
              const step1Decompressed = decompressGzipBase64(match.options);
              // console.log("Paso 1 - Gzip descomprimido:", step1Decompressed);

              // Función para decodificar base64 de forma segura
              function decodeBase64ToText(base64String) {
                // Limpiar la cadena base64 (eliminar saltos de línea y espacios)
                base64String = base64String.replace(/[\r\n]/g, '').replace(/\s/g, '');
                
                // Agregar padding si es necesario
                while (base64String.length % 4) {
                    base64String += '=';
                }
                
                // Intentar decodificar el base64
                try {
                    return atob(base64String);
                } catch (e) {
                    console.error('Error al decodificar Base64:', e);
                    return null;
                }
              }

              // Ejemplo de uso con el string que proporcionaste
              // const base64String = "SAQAAAA2MTozAwAAADA6MwQAAAA2MjpuBQAAADkyOjMwAwAAADE6bgQAAAA4Nzp5BAAAADYwOjAEAAAANTk6MAQAAAA4OTpuAwAAADQ6NRsAAAA1MjpoQldPV0VEd2tVTzZhQjNDRi9uK1JRPT0EAAAANToxMwUAAAA1MTo3NAQAAAA2NDpuBAAAADk2OnkEAAAAODU6MAQAAAA5NToyBAAAADg2OnkEAAAANTg6MgQAAAA2Ojc3AwAAADc6MQQAAAA1NjoyBAAAADY1OnkEAAAANjY6eQUAAAA4OjEyMAMAAAA5OjAIAAAAMTA6MTA5NjgGAAAAOTM6MTIyBQAAADg0Oi0xBQAAADgzOi0xBAAAADY3OjEEAAAANjg6NQQAAAA2OTo1BAAAADcwOjEFAAAANzE6MTAFAAAAMTI6NTAEAAAAMTM6MQUAAAAxNDo3MAYAAAAxNToxMjUEAAAAMTY6MQQAAAAxNzo4BAAAADE4OjEIAAAANzI6MTAwMDAEAAAAMTk6MAQAAAAyMDoxBQAAADIxOjYwBAAAADIyOjIFAAAAMjM6NjAGAAAANzM6MTI1BQAAADI0OjIwBAAAADI1OjEFAAAAMjY6NjIEAAAAMjc6MwQAAAA3NDo4BgAAADI4OjIwMAQAAAAzNjp5BAAAADc1OnkEAAAAOTE6bgQAAAAzNzowBAAAADk3OjIEAAAANzY6eQQAAAA1NTp5BAAAADQxOjIEAAAAOTA6bgQAAAA3Nzp5BAAAADc4OnkEAAAANTc6MAQAAAA3OTpuBwAAADgwOjkwMDAEAAAAODE6NwQAAAA4MjowBAAAADk4Onk=";
              // "SAQAAAA2MTozAwAAADA6MwQAAAA2MjpuBQAAADkyOjMwAwAAADE6bgQAAAA4Nzp5BAAAADYwOjAEAAAANTk6MAQAAAA4OTpuAwAAADQ6NRsAAAA1MjpoQldPV0VEd2tVTzZhQjNDRi9uK1JRPT0EAAAANToxMwUAAAA1MTo3NAQAAAA2NDpuBAAAADk2OnkEAAAAODU6MAQAAAA5NToyBAAAADg2OnkEAAAANTg6MgQAAAA2Ojc3AwAAADc6MQQAAAA1NjoyBAAAADY1OnkEAAAANjY6eQUAAAA4OjEyMAMAAAA5OjAIAAAAMTA6MTA5NjgGAAAAOTM6MTIyBQAAADg0Oi0xBQAAADgzOi0xBAAAADY3OjEEAAAANjg6NQQAAAA2OTo1BAAAADcwOjEFAAAANzE6MTAFAAAAMTI6NTAEAAAAMTM6MQUAAAAxNDo3MAYAAAAxNToxMjUEAAAAMTY6MQQAAAAxNzo4BAAAADE4OjEIAAAANzI6MTAwMDAEAAAAMTk6MAQAAAAyMDoxBQAAADIxOjYwBAAAADIyOjIFAAAAMjM6NjAGAAAANzM6MTI1BQAAADI0OjIwBAAAADI1OjEFAAAAMjY6NjIEAAAAMjc6MwQAAAA3NDo4BgAAADI4OjIwMAQAAAAzNjp5BAAAADc1OnkEAAAAOTE6bgQAAAAzNzowBAAAADk3OjIEAAAANzY6eQQAAAA1NTp5BAAAADQxOjIEAAAAOTA6bgQAAAA3Nzp5BAAAADc4OnkEAAAANTc6MAQAAAA3OTpuBwAAADgwOjkwMDAEAAAAODE6NwQAAAA4MjowBAAAADk4Onk="
              // "SAQAAAA2MTozAwAAADA6MwQAAAA2MjpuBQAAADkyOjMwAwAAADE6bgQAAAA4Nzp5BAAAADYwOjAEAAAANTk6MAQAAAA4OTpuAwAAADQ6NRsAAAA1MjpoQldPV0VEd2tVTzZhQjNDRi9uK1JRPT0EAAAANToxMwUAAAA1MTo3NAQAAAA2NDpuBAAAADk2OnkEAAAAODU6MAQAAAA5NToyBAAAADg2OnkEAAAANTg6MgQAAAA2Ojc3AwAAADc6MQQAAAA1NjoyBAAAADY1OnkEAAAANjY6eQUAAAA4OjEyMAMAAAA5OjAIAAAAMTA6MTA5NjgGAAAAOTM6MTIyBQAAADg0Oi0xBQAAADgzOi0xBAAAADY3OjEEAAAANjg6NQQAAAA2OTo1BAAAADcwOjEFAAAANzE6MTAFAAAAMTI6NTAEAAAAMTM6MQUAAAAxNDo3MAYAAAAxNToxMjUEAAAAMTY6MQQAAAAxNzo4BAAAADE4OjEIAAAANzI6MTAwMDAEAAAAMTk6MAQAAAAyMDoxBQAAADIxOjYwBAAAADIyOjIFAAAAMjM6NjAGAAAANzM6MTI1BQAAADI0OjIwBAAAADI1OjEFAAAAMjY6NjIEAAAAMjc6MwQAAAA3NDo4BgAAADI4OjIwMAQAAAAzNjp5BAAAADc1OnkEAAAAOTE6bgQAAAAzNzowBAAAADk3OjIEAAAANzY6eQQAAAA1NTp5BAAAADQxOjIEAAAAOTA6bgQAAAA3Nzp5BAAAADc4OnkEAAAANTc6MAQAAAA3OTpuBwAAADgwOjkwMDAEAAAAODE6NwQAAAA4MjowBAAAADk4Onk="

              // Llamamos a la función para obtener el texto
              // const decodedText = decodeBase64ToText(base64String);

              // Mostramos el resultado
              // if (decodedText) {

                // console.log("PREVIOUS decodedText",base64String);
                // console.log("decodedText",decodedText);
                // console.log("PREVIOUS decodedText2",decompressGzipBase64(match.options).replaceAll('"', ""));
                // console.log("decodedText2",decodeBase64ToText(decompressGzipBase64(match.options).replaceAll('"', "")));
              //   // console.log(decodedText);
              // } else {
              //   console.error("No se pudo decodificar el texto.");
              // }
              
              if (step1Decompressed) {
                // console.log(atob(step1Decompressed).replace(/\+/g, " "));
                  // const sanitizedDecompressed = sanitizeBase64();
                  // console.log(step1Decompressed == decodedText);
                  // console.log(match.options);
                  console.log(decompressGzipBase64(match.options).replaceAll('"', ""));
                  
                  const finalDecodedResult = decodeBase64ToText(decompressGzipBase64(match.options).replaceAll('"', ""));

                  
                  console.log("Resultado final:", finalDecodedResult);
              }


              

              
              
              
                
                  
                  return {
                    id: match.id,
                    startTime: match.startgametime,
                    endTime: match.completiontime,
                    map: match.mapname,
                    decodedInfo: decodeBase64ToText(decompressGzipBase64(match.options).replaceAll('"', "")),
                    // slotInfo: decodeBase64ToText(decompressGzipBase64(match.slotinfo).replaceAll('"', "")),
                    teamA: {
                      status: matchhistoryreportresults.find(m => m.teamid == 0).resulttype,
                      list: matchhistoryreportresults.filter(m => m.teamid == 0)
                    },
                    teamB: {
                      status: matchhistoryreportresults.find(m => m.teamid == 1).resulttype,
                      list: matchhistoryreportresults.filter(m => m.teamid == 1)
                    }
                  }
                })
                console.log(recentMatches);
                console.log(recentMatches[0].decodedInfo);
                console.log(recentMatches[0].decodedInfo.replaceAll("\u0000","---").replaceAll("\u0001","---").replaceAll("\u0002","---").replaceAll("\u0003","---").replaceAll("\u0004","---").replaceAll("\u0005","---").replaceAll("\u0006","---").replaceAll("\u0007","---").replaceAll("\u0008","---").replaceAll("\u0009","---").split("---").filter(asd => asd.length > 0));
                */
                // console.log(recentMatches[0].slotInfo);
                // console.log(recentMatches[0].slotInfo.replaceAll("\u0000","---").replaceAll("\u0001","---").replaceAll("\u0002","---").replaceAll("\u0003","---").replaceAll("\u0004","---").replaceAll("\u0005","---").replaceAll("\u0006","---").replaceAll("\u0007","---").replaceAll("\u0008","---").replaceAll("\u0009","---").split("---").filter(asd => asd.length > 0));
                console.log(foundPlayer);
                // socket.emit("bring-player-matches", foundPlayer.insightsId);
                Swal.fire({
                  html: `
                    <div class="player-overlay">
                      <div class="player-left">
                        <picture>
                            <img src="${await getImage(foundPlayer.name)}" alt="${foundPlayer.name}">
                        </picture>
                        ${
                          foundPlayer.alias 
                          ?
                            `
                              <h4>${foundPlayer.name}</h4>
                              <i>${foundPlayer.alias}</i>
                            `
                          :
                            `
                              <h4>${foundPlayer.name}</h4>
                            `

                        }
                        <a href="https://www.aoe2insights.com/user/${foundPlayer.insightsId}" target="_blank">Perfil en AoE2Insights <i class="fas fa-chevron-circle-right"></i></a>
                      </div>
                      <section class="player-right">
                          <div class="player-cards">
                            <div class="card-1v1">
                              <div class="card-title">1v1 RM</div>
                              <div class="card-rank">${foundPlayer.rm1v1 ? "#"+foundPlayer.rm1v1.rank : "-"}</div>
                              <div class="card-rating">Rating ${foundPlayer.rm1v1 ? "#"+foundPlayer.rm1v1.rating : "-"}</div>
                              <div class="card-alltimehigh">All Time High ${foundPlayer.rm1v1 ? "#"+foundPlayer.rm1v1.highestrating : "-"}</div>
                            </div>
                            <div class="card-tg">
                              <div class="card-title">Team RM</div>
                              <div class="card-rank">${foundPlayer.rmTg ? "#"+foundPlayer.rmTg.rank : "-"}</div>
                              <div class="card-rating">Rating ${foundPlayer.rmTg ? "#"+foundPlayer.rmTg.rating : "-"}</div>
                              <div class="card-alltimehigh">All Time High ${foundPlayer.rmTg ? "#"+foundPlayer.rmTg.highestrating : "-"}</div>
                            </div>
                            <div class="card-birthday">
                              <i class="fas fa-birthday-cake"></i>
                              <div>
                                <h5 class="card-title">Cumpleaños</h5>
                                <p class="card-text">${foundPlayer.birthday ? foundPlayer.birthday : "No tiene :("}</p>
                              </div>
                            </div>
                          </div>
                          <ul class="player-matches">
                              <div class="spinner-border" role="status">
                                <span class="visually-hidden">Loading...</span>
                              </div>
                          </ul>
                      </section>
                      </div>
                  `,
                  showClass: {
                      popup: `
                        animate__animated
                        animate__fadeIn
                        animate__faster
                      `
                    },
                    hideClass: {
                      popup: `
                        animate__animated
                        animate__fadeOut
                        animate__faster
                      `
                    },
                  showCloseButton: true,
                  showConfirmButton: false
                  // confirmButtonAriaLabel: "Thumbs up, great!",
                  // cancelButtonText: `
                  //   <i class="fa fa-thumbs-down"></i>
                  // `,
                  // cancelButtonAriaLabel: "Thumbs down"
                });
                // socket.on("player-matches",async (data)=>{
                //   console.log(data);
                //   document.querySelector(".player-matches").innerHTML = "Asd";
                  
                // });

                let dataFetched = await fetch(`/api/profile/${foundPlayer.insightsId}`);
                let dataJson = await dataFetched.json()
                  .then(resp => {
                    let matchesDiv = document.querySelector(".player-matches");
                    matchesDiv.innerHTML = "";
                    console.log(resp.data);
                    resp.data.forEach(match => {
                      matchesDiv.innerHTML += `
                        <li class="every-match">
                          <a href="https://www.aoe2insights.com${match.url}" target="_blank" class="match-link"></a>
                          <img src="https://www.aoe2insights.com/${match.mapIcon}" alt="" />
                          <div class="every-match-info">
                            <span class="match-mode">${match.matchMode}</span>
                            <span class="match-map">${match.mapName}</span>
                            <span class="match-duration">${match.matchDuration}</span>
                            <span class="match-date">${match.matchDate}</span>
                          </div>
                          <div class="every-match-teams">
                            <ul class="team-one ${match.teamA.status ? "won" : "" }"> 
                              ${
                                String(match.teamA.list.map(play => {
                                  return `<li>
                                      <span class="player-color color-${play.color}"></span>
                                      <img src="https://www.aoe2insights.com/${play.civIcon}" />
                                      <span class="player-name">${play.name}</span>
                                    </li>`
                                })).replaceAll(">,<", "><")
                              }
                              <span class="won-detail"><i class="fas fa-crown"></i></span>
                            </ul>
                            <span class="vs">vs</span>
                            <ul class="team-two ${match.teamB.status ? "won" : "" }"> 
                              ${
                                String(match.teamB.list.map(play => {
                                  return `<li>
                                      <span class="player-name">${play.name}</span>
                                      <img src="https://www.aoe2insights.com/${play.civIcon}" />
                                      <span class="player-color color-${play.color}"></span>
                                    </li>`
                                })).replaceAll(">,<", "><")
                              }
                              <span class="won-detail"><i class="fas fa-crown"></i></span>
                            </ul>
                          </div>
                        </li>
                      `;
                    });
                  })
                // console.log(dataJson);

              }

              
            })
            // console.log(steamfetch);
            // let steamdata = await steamfetch.json();
            // console.log(playerData);
            
          });
        })
        
      }
    }


    // ASDASDASD
  }

  socket.on("players", (players) => {
    console.log(players);
    sessionStorage.setItem("players", JSON.stringify(players));
    sessionData = players;
    
    loadDashboard(sessionData);
  });

  // let playerList = JSON.parse(sessionStorage.getItem("players"));
  console.log(sessionData);

  loadDashboard(sessionData);

  function cleanButtons() {
    let links = document.querySelectorAll(".nav-link");
    links.forEach(link => link.classList.remove("active"));
  }

  document.querySelector("#rmtg-button").addEventListener("click",()=>{
    activePage = "rmTg";
    cleanButtons();
    document.querySelector("#rmtg-button").classList.add("active");
    loadDashboard(sessionData);
  })

  document.querySelector("#rm1v1-button").addEventListener("click",()=>{
    activePage = "rm1v1";
    cleanButtons();
    document.querySelector("#rm1v1-button").classList.add("active");
    loadDashboard(sessionData);
  })

  document.querySelector("#birthday-button").addEventListener("click",()=>{
    activePage = "birthday";
    cleanButtons();
    document.querySelector("#birthday-button").classList.add("active");
    loadDashboard(sessionData);
  })

  // updateButton.addEventListener("click", () => {
  //   console.log("Actualizando...");
    // updatePlayers();
  // });

  
})