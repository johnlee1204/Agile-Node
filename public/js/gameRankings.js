let table = document.createElement("table");

var request = new XMLHttpRequest();
request.addEventListener("load", () => {
    let reply = JSON.parse(request.responseText);
    let row = document.createElement("tr");

    let name = document.createElement("th");
    name.innerText = "Name";

    let game = document.createElement("th");
    game.innerText = "Game";

    let plot = document.createElement("th");
    plot.innerText = "Plot";

    let gameplay = document.createElement("th");
    gameplay.innerText = "Gameplay";

    let graphics = document.createElement("th");
    graphics.innerText = "Graphics";

    let atmosphere = document.createElement("th");
    atmosphere.innerText = "Atmosphere";

    row.appendChild(name);
    row.appendChild(game);
    row.appendChild(plot);
    row.appendChild(gameplay);
    row.appendChild(graphics);
    row.appendChild(atmosphere);
    table.appendChild(row);
    for(let i of reply.data) {
        row = document.createElement("tr");

        let nameCell = document.createElement("td");
        nameCell.innerText = i.name;

        let gameCell = document.createElement("td");
        gameCell.innerText = i.game;

        let plotCell = document.createElement("td");
        plotCell.innerText = i.plot;

        let gameplayCell = document.createElement("td");
        gameplayCell.innerText = i.gameplay;

        let graphicsCell = document.createElement("td");
        graphicsCell.innerText = i.graphics;

        let atmosphereCell = document.createElement("td");
        atmosphereCell.innerText = i.atmosphere;

        row.appendChild(nameCell);
        row.appendChild(gameCell);
        row.appendChild(plotCell);
        row.appendChild(gameplayCell);
        row.appendChild(graphicsCell);
        row.appendChild(atmosphereCell);
        table.appendChild(row);
    }

    document.body.appendChild(table);
});
request.open("GET", "/api/gameRankings");
request.send();