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
    // console.log(insightsId);
    
      await page.goto(`https://www.aoe2insights.com/user/${insightsId}`);
      // Extraer datos de jugadores
      // let matches = [];

      let players = await page.evaluate(() => {
          // let matches2 = [];
          console.log("Empezamos a evaluar...");
          // matches.push({a: "asd"});
          // matches2.push({a: "asd"});
          // return matches;
          // let divs = document.querySelectorAll('.match-line')
          // console.log(divs);
          
          // let matches3 = Array.from(document.querySelectorAll('.match-tile')).map(m => {
          //   matches2.push({a: "a"})
          //   return {a: "a"}
          // })
          // return matches2;
          let matches = Array.from(document.querySelectorAll('.match-tile')).map(row => {
            // return {a: "asd"};
            let matchData = row.querySelector("div");
            // let teams = row.querySelectorAll(".teams");
            let matchDataExtra = matchData.querySelectorAll("div");

            let matchDataExtraDurationAndDate = matchDataExtra[3].querySelectorAll("div");

            let matchTeams = row.querySelectorAll(".team");
            // return 
            let matchComplete = {
              mapIcon: matchData.querySelector("picture img").getAttribute("src"),
              matchMode: matchDataExtra[0].querySelector("a.stretched-link strong em") ? matchDataExtra[0].querySelector("a.stretched-link strong em").innerHTML.replaceAll("\n", "").trim() : "---",
              mapName: matchDataExtra[2] ? matchDataExtra[2].innerHTML.replaceAll("\n", "").trim() : "---",
              // matchDataExtraDurationAndDate: matchDataExtra[3].innerHTML,
              matchDuration: matchDataExtraDurationAndDate[0].querySelector("small") ?  matchDataExtraDurationAndDate[0].querySelector("small").innerHTML : "---",
              matchDate: matchDataExtraDurationAndDate[1].querySelector("small span") ? matchDataExtraDurationAndDate[1].querySelector("small span").innerHTML.replace("&nbsp;", " ") : "---",
              teamA: {
                status: row.querySelectorAll(".team")[0].classList.contains("won"),
                list: Array.from(row.querySelectorAll(".team")[0].querySelectorAll("li")).map(everyPlayerDiv => {
                  return {
                    // d: everyPlayerDiv.querySelector("div").querySelector("div").outerHTML,
                    // di: everyPlayerDiv.querySelector("div").innerHTML,
                    name: everyPlayerDiv.querySelector("div").querySelector("a") ? everyPlayerDiv.querySelector("div").querySelector("a").innerHTML.replaceAll("\n", "").trim() : "---",
                    color: everyPlayerDiv.querySelector("div").getAttribute("class").split(" ")[1].split("-")[3],
                    civIcon: everyPlayerDiv.querySelector("div").querySelector("i picture img").getAttribute("src"),
                    // playerElo: everyPlayerDiv.querySelector("div").querySelector("div.appendix small.rating span").innerHTML,
                    // eloVariation: everyPlayerDiv.querySelector("div").querySelector(".rating span.rating-change").innerHTML
                  }
                })
                // list: matchTeams[0].querySelectorAll("li")
              },
              teamB: {
                status: row.querySelectorAll(".team")[1].classList.contains("won"),
                list: Array.from(row.querySelectorAll(".team")[1].querySelectorAll("li")).map(everyPlayerDiv => {
                  return {
                    // d: everyPlayerDiv.querySelector("div").querySelector("div").outerHTML,
                    // di: everyPlayerDiv.querySelector("div").innerHTML,
                    name: everyPlayerDiv.querySelector("div").querySelector("a") ? everyPlayerDiv.querySelector("div").querySelector("a").innerHTML.replaceAll("\n", "").trim() : "---",
                    color: everyPlayerDiv.querySelector("div").getAttribute("class").split(" ")[1].split("-")[3],
                    civIcon: everyPlayerDiv.querySelector("div").querySelector("i picture img").getAttribute("src"),
                    // playerElo: everyPlayerDiv.querySelector("div").querySelector("div.appendix small.rating span").innerHTML,
                    // eloVariation: everyPlayerDiv.querySelector("div").querySelector(".rating span.rating-change").innerHTML
                  }
                })
                // list: matchTeams[0].querySelectorAll("li")
              },
            }
            // console.log(matchComplete);
            
            // matches.push({a: "asd"})
            // return {a: "asd"}
            return matchComplete;
          })
          return matches;
      });
      
      // players = players.filter((pl) => pl.name.includes('XEVER | '))
      // console.log("players",players[0]);
      // console.log("playersasdasd",players[0].teamA.list);
      // console.log("matches",matches);
      
      
      
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