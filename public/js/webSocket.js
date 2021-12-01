const socket = new WebSocket('ws:/' + location.hostname + ':8080');

socket.addEventListener('message', function (event) {
    let data = JSON.parse(event.data);

    let oldTable = document.getElementById("table");

    if(oldTable) {
        document.body.removeChild(oldTable);
    }

    let table = document.createElement("table");
    table.id = "table";
    table.height

    let tableHead = document.createElement("thead");

    let row = document.createElement("tr");

    let messageCell = document.createElement("th");
    messageCell.innerText = "Message";

    row.appendChild(messageCell);

    tableHead.appendChild(row);

    table.appendChild(tableHead);

    let tableBody = document.createElement("tbody");

    for(let i of data.data) {
        row = document.createElement("tr");
        dateCell = document.createElement("td");
        let date = new Date(i.date);
        dateCell.innerText = date.toLocaleString();

        let nameCell = document.createElement("td");
        nameCell.innerText = i.name;

        messageCell = document.createElement("td");
        messageCell.innerText = i.message;

        row.appendChild(dateCell);
        row.appendChild(nameCell);
        row.appendChild(messageCell);
        tableBody.appendChild(row);
    }

    table.appendChild(tableBody);

    document.body.appendChild(table);

    tableBody.scrollTo(0, tableBody.scrollHeight);
});

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}