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
require(path.join(path.dirname(require.main.filename), "Routes", "main.js"))(app, sharedFunctions);//Must be last for 404 catch!!!

app.listen(5000);

