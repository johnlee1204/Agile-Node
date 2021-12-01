const express = require("express");
const cookieParser = require('cookie-parser')
const fileSystem = require("fs");
const path = require("path");
const mysql = require("mysql")
const bcrypt = require('bcrypt');
const crypto = require("crypto");
const webSocket = require('ws');
const sharedFunctions = require(path.join(__dirname, "sharedFunctions.js"));

const app = express();

app.use(express.urlencoded());
app.use(express.json());
app.use(cookieParser());
app.use(sharedFunctions.logRequest);
app.use(express.static(path.join(path.dirname(require.main.filename), "public")));

require(path.join(path.dirname(require.main.filename), "Routes", "gameRanking.js"))(app, sharedFunctions);
require(path.join(path.dirname(require.main.filename), "Routes", "accessLog.js"))(app, sharedFunctions);
require(path.join(path.dirname(require.main.filename), "Routes", "logout.js"))(app, sharedFunctions);
require(path.join(path.dirname(require.main.filename), "Routes", "login.js"))(app, sharedFunctions);
require(path.join(path.dirname(require.main.filename), "Routes", "user.js"))(app, sharedFunctions);
require(path.join(path.dirname(require.main.filename), "Routes", "websocket.js"))(app, sharedFunctions);

app.get("/", (request, response) => {
    sharedFunctions.validateCookie(request, response, (userInformation) => {
        fileSystem.readFile(path.join(path.dirname(require.main.filename), "public", "html", "index.html"), (error, content) => {
            if(error) {
                throw error;
            }

            response.writeHead(200, "content-type:text/html");
            response.write(content);
            response.end();
        });
    });
});

app.get("/about", (request, response) => {
    sharedFunctions.validateCookie(request, response, (userInformation) => {
        fileSystem.readFile(path.join(path.dirname(require.main.filename), "public", "html", "about.html"), (error, content) => {
            if(error) {
                throw error;
            }

            response.writeHead(200, "content-type:text/html");
            response.write(content);
            response.end();
        });
    });
});

app.get("*", (request, response) => {
    fileSystem.readFile(path.join(path.dirname(require.main.filename), "public", "html", "404.html"), (error, content) => {
       if(error) {
           throw error;
       }

       response.writeHead(404, "content-type:text/html");
       response.write(content);
       response.end();
    });
});

app.listen(5000);

