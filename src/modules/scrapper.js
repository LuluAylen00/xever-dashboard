const puppeteer = require('puppeteer');

module.export = async () => {
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
};