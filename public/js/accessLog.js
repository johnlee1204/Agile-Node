let table = document.createElement("table");

var request = new XMLHttpRequest();
request.addEventListener("load", () => {
    let reply = JSON.parse(request.responseText);
    let row = document.createElement("tr");
    let dateCell = document.createElement("th");
    dateCell.innerText = "Date";
    let userNameCell = document.createElement("th");
    userNameCell.innerText = "User Name";
    let firstNameCell = document.createElement("th");
    firstNameCell.innerText = "First Name";
    let lastNameCell = document.createElement("th");
    lastNameCell.innerText = "Last Name";
    let urlCell = document.createElement("th");
    urlCell.innerText = "Url";
    let queryCell = document.createElement("th");
    queryCell.innerText = "Query";
    let bodyCell = document.createElement("th");
    bodyCell.innerText = "Body";
    row.appendChild(dateCell);
    row.appendChild(userNameCell);
    row.appendChild(firstNameCell);
    row.appendChild(lastNameCell);
    row.appendChild(urlCell);
    row.appendChild(queryCell);
    row.appendChild(bodyCell);
    table.appendChild(row);
    for(let i of reply.data) {
        row = document.createElement("tr");
        dateCell = document.createElement("td");
        let date = new Date(i.date);
        dateCell.innerText = date.toLocaleString();
        userNameCell = document.createElement("td");
        userNameCell.innerText = i.userName;
        firstNameCell = document.createElement("td");
        firstNameCell.innerText = i.firstName;
        lastNameCell = document.createElement("td");
        lastNameCell.innerText = i.lastName;
        urlCell = document.createElement("td");
        urlCell.innerText = i.url;
        queryCell = document.createElement("td");
        queryCell.innerText = i.query;
        bodyCell = document.createElement("td");
        bodyCell.innerText = i.body;
        row.appendChild(dateCell);
        row.appendChild(userNameCell);
        row.appendChild(firstNameCell);
        row.appendChild(lastNameCell);
        row.appendChild(urlCell);
        row.appendChild(queryCell);
        row.appendChild(bodyCell);
        table.appendChild(row);
    }

    document.body.appendChild(table);
});
request.open("GET", "/api/accessLog");
request.send();