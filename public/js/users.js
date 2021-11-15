let table = document.createElement("table");

var request = new XMLHttpRequest();
request.addEventListener("load", () => {
    let reply = JSON.parse(request.responseText);
    let row = document.createElement("tr");
    let userNameCell = document.createElement("th");
    userNameCell.innerText = "User Name";
    let firstNameCell = document.createElement("th");
    firstNameCell.innerText = "First Name";
    let lastNameCell = document.createElement("th");
    lastNameCell.innerText = "Last Name";
    row.appendChild(userNameCell);
    row.appendChild(firstNameCell);
    row.appendChild(lastNameCell);
    table.appendChild(row);
    for(let i of reply.data) {
        row = document.createElement("tr");
        let userNameCell = document.createElement("td");
        userNameCell.innerText = i.userName;
        let firstNameCell = document.createElement("td");
        firstNameCell.innerText = i.firstName;
        let lastNameCell = document.createElement("td");
        lastNameCell.innerText = i.lastName;
        row.appendChild(userNameCell);
        row.appendChild(firstNameCell);
        row.appendChild(lastNameCell);
        table.appendChild(row);
    }

    document.body.appendChild(table);
});
request.open("GET", "/api/users");
request.send();