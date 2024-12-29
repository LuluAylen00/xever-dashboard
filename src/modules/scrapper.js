const puppeteer = require('puppeteer');

module.exports = {
  scrapInsights: async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    let allPlayers = [];
  
    // Iterar sobre las páginas (en este caso, de 1 a 435)
    for (let i = 1; i <= 435; i++) {
      await page.goto(`https://www.aoe2insights.com/leaderboard/3/?page=${i}`);
      
      // Extraer datos de jugadores
      let players = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('tbody tr')).map(row => {
              let data = row.querySelectorAll('td');
              return {
                  name: data[2].querySelector("a").innerHTML.replaceAll("\n", "").trim(),
                  elo: data[3].innerHTML.replaceAll("\n", "").trim(),
                  games: {
                    total: data[5].innerHTML.replaceAll("\n", "").trim(),
                    won: data[6].innerHTML.replaceAll("\n", "").trim(),
                    lost: data[7].innerHTML.replaceAll("\n", "").trim(),
                    winrate: data[8].innerHTML.replaceAll("\n", "").trim()
                  },
                  country: {
                    name: data[2].querySelector("span").getAttribute("aria-label").trim(),
                    class: data[2].querySelector("span").getAttribute("class").split(" ")[1]
                  },
                  image: data[2].querySelector("img").getAttribute("src"),
                  insightsId: data[2].querySelector("a").getAttribute("href").split("/")[2],
  
              }
          });
      });
      
      players = players.filter((pl) => pl.name.includes('XEVER | '))
      console.log(players);
      
      
  
      allPlayers.push(...players);
      console.log(`Page ${i} scraped.`);
    }
  
    await browser.close();
  
    allPlayers = allPlayers.map((player,i) =>{
      return {
        index: i + 1,
        indexChange: "-",
        ...player
      }
    })
  
    // Guardar los datos en un archivo JSON
    const fs = require('fs');
    fs.writeFileSync('../data/xever-data.json', JSON.stringify(allPlayers, null, 2));
  },
  getInsightsMatches: async (insightsId) => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // let allPlayers = [];
  
    // Iterar sobre las páginas (en este caso, de 1 a 435)
    // for (let i = 1; i <= 435; i++) {
    console.log(insightsId);
    
      await page.goto(`https://www.aoe2insights.com/user/${insightsId}`);
      let matches = [];
      // Extraer datos de jugadores
      let players = await page.evaluate(() => {
        console.log("Empezamos a evaluar...");
        
          return Array.from(document.querySelectorAll('.match-line')).map(row => {
            
            let matchData = row.querySelector("div");
            // let teams = row.querySelectorAll(".teams");
            // return 
            let matchComplete = {
              mapIcon: matchData.querySelector("picture img").getAttribute("src"),
              matchMode: matchData.querySelector("div:firstChild strong em").innerHTML,
              mapName: matchData.querySelector("div:nthChild(2)").innerHTML,
              matchDuration: matchData.querySelector("div:nthChild(3):firstChild "),
              matchDate: matchData.querySelector("div:nthChild(3):lastChild"),
              teamA: {
                status: row.querySelectorAll(".teams").classList.includes("won"),
                list: row.querySelectorAll(".teams:firstChild > li > div").map(everyPlayerDiv => {
                  return {
                    name: everyPlayerDiv.querySelector("a").innerHTML,
                    color: everyPlayerDiv.getAttribute("class").split(" ")[1],
                    civIcon: everyPlayerDiv.querySelector("i picture img").getAttribute("src"),
                    playerElo: everyPlayerDiv.querySelector(".rating span").innerHTML,
                    eloVariation: everyPlayerDiv.querySelector(".rating span.rating-change").innerHTML
                  }
                })
              },
              teamB: {
                status: row.querySelectorAll(".teams").classList.includes("won"),
                list: row.querySelectorAll(".teams:lastChild > li > div").map(everyPlayerDiv => {
                  return {
                    name: everyPlayerDiv.querySelector("a").innerHTML,
                    color: everyPlayerDiv.getAttribute("class").split(" ")[1],
                    civIcon: everyPlayerDiv.querySelector("i picture img").getAttribute("src"),
                    playerElo: everyPlayerDiv.querySelector(".rating span").innerHTML,
                    eloVariation: everyPlayerDiv.querySelector(".rating span.rating-change").innerHTML
                  }
                })
              }
            }
            console.log(matchComplete);
            
            // matches.push()

            return matchComplete;
          });
      });
      
      // players = players.filter((pl) => pl.name.includes('XEVER | '))
      console.log("players",players);
      
      
      
      // allPlayers.push(...players);
      // console.log(`Page ${i} scraped.`);
    // }
  
    await browser.close();
  
    // allPlayers = allPlayers.map((player,i) =>{
    //   return {
    //     index: i + 1,
    //     indexChange: "-",
    //     ...player
    //   }
    // })
  
    // Guardar los datos en un archivo JSON
    // const fs = require('fs');
    // fs.writeFileSync('../data/xever-data.json', JSON.stringify(allPlayers, null, 2));
    return players;
  },
  scrapXeverLiquipedia: async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    let allPlayers = [];
  
    // Iterar sobre las páginas (en este caso, de 1 a 435)
    // for (let i = 1; i <= 435; i++) {
      await page.goto(`https://liquipedia.net/ageofempires/XEVER`);
      
      // Extraer datos de jugadores
      let players = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('tbody tr')).map(row => {
              let data = row.querySelectorAll('td');
              return {
                  name: data[2].querySelector("a").innerHTML.replaceAll("\n", "").trim(),
                  elo: data[3].innerHTML.replaceAll("\n", "").trim(),
                  games: {
                    total: data[5].innerHTML.replaceAll("\n", "").trim(),
                    won: data[6].innerHTML.replaceAll("\n", "").trim(),
                    lost: data[7].innerHTML.replaceAll("\n", "").trim(),
                    winrate: data[8].innerHTML.replaceAll("\n", "").trim()
                  },
                  country: {
                    name: data[2].querySelector("span").getAttribute("aria-label").trim(),
                    class: data[2].querySelector("span").getAttribute("class").split(" ")[1]
                  },
                  image: data[2].querySelector("img").getAttribute("src"),
                  insightsId: data[2].querySelector("a").getAttribute("href").split("/")[2],
  
              }
          });
      });
      
      players = players.filter((pl) => pl.name.includes('XEVER | '))
      console.log(players);
      
      
  
      allPlayers.push(...players);
      console.log(`Page ${i} scraped.`);
    // }
  
    await browser.close();
  
    allPlayers = allPlayers.map((player,i) =>{
      return {
        index: i + 1,
        indexChange: "-",
        ...player
      }
    })
  
    // Guardar los datos en un archivo JSON
    const fs = require('fs');
    fs.writeFileSync('../data/xever-data.json', JSON.stringify(allPlayers, null, 2));
  }
}