const express = require("express");
const cookieParser = require('cookie-parser')
const fileSystem = require("fs");
const path = require("path");
const mysql = require("mysql")
const bcrypt = require('bcrypt');
const crypto = require("crypto");
const webSocket = require('ws')


const app = express();

const webSocketServer = new webSocket.Server({port: 8080})

let webSocketClients = [];

webSocketServer.on('connection', ws => {
    webSocketClients.push(ws);
    connection.query("SELECT date, message FROM Chat ORDER BY date", [], (error, result) => {
        if(error) {
            throw error;
        }

        ws.send(JSON.stringify({success:true, data:result}));
    });
    ws.on('message', message => {
        message = message.toString();

        if(message === "") {
            return;
        }

        connection.query("INSERT INTO Chat(date, message) VALUES(current_timestamp(), ?)", [message], error => {
            if(error) {
                throw error;
            }
            connection.query("SELECT date, message FROM Chat ORDER BY date", [], (error, result) => {
                if(error) {
                    throw error;
                }

                for(let client of webSocketClients) {
                    client.send(JSON.stringify({success:true, data:result}));
                }
            });
        });
    });
});

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Echo120499!',
    database: 'Agile'
});

connection.connect(error => {
    if(error) {
        throw error;
    }
});

app.use(express.urlencoded());
app.use(express.json());
app.use(cookieParser());
app.use(logRequest);

app.get("/", (request, response) => {
    validateCookie(request, response, () => {
        fileSystem.readFile(path.join(__dirname, "public", "html", "index.html"), (error, content) => {
            if(error) {
                throw error;
            }

            response.writeHead(200, "content-type:text/html");
            response.write(content);
            response.end();
        });
    });
});

app.get("/robots.txt", (request, response) => {
    fileSystem.readFile(path.join(__dirname, "public", "robots.txt"), (error, content) => {
        if(error) {
            throw error;
        }

        response.writeHead(200, "content-type:text/html");
        response.write(content);
        response.end();
    });
});

app.get("/about", (request, response) => {
    validateCookie(request, response, () => {
        fileSystem.readFile(path.join(__dirname, "public", "html", "about.html"), (error, content) => {
            if(error) {
                throw error;
            }

            response.writeHead(200, "content-type:text/html");
            response.write(content);
            response.end();
        });
    });
});

app.get("/webSocket", (request, response) => {
    validateCookie(request, response, () => {
        fileSystem.readFile(path.join(__dirname, "public", "html", "webSocket.html"), (error, content) => {
            if(error) {
                throw error;
            }

            response.writeHead(200, "content-type:text/html");
            response.write(content);
            response.end();
        });
    });
});

app.get("/webSocket.js", (request, response) => {
    validateCookie(request, response, () => {
        fileSystem.readFile(path.join(__dirname, "public", "js", "webSocket.js"), (error, content) => {
            if(error) {
                throw error;
            }

            response.writeHead(200, "content-type:application/javascript");
            response.write(content);
            response.end();
        });
    });
});

app.get("/users", (request, response) => {
    validateCookie(request, response, () => {
        fileSystem.readFile(path.join(__dirname, "public", "html", "users.html"), (error, content) => {
            if(error) {
                throw error;
            }

            response.writeHead(200, "content-type:text/html");
            response.write(content);
            response.end();
        });
    });
});

app.get("/users.js", (request, response) => {
    validateCookie(request, response, () => {
        fileSystem.readFile(path.join(__dirname, "public", "js", "users.js"), (error, content) => {
            if(error) {
                throw error;
            }

            response.writeHead(200, "content-type:application/javascript");
            response.write(content);
            response.end();
        });
    });
});

app.get("/accessLog", (request, response) => {
    validateCookie(request, response, () => {
        fileSystem.readFile(path.join(__dirname, "public", "html", "accessLog.html"), (error, content) => {
            if(error) {
                throw error;
            }

            response.writeHead(200, "content-type:text/html");
            response.write(content);
            response.end();
        });
    });
});

app.get("/accessLog.js", (request, response) => {
    validateCookie(request, response, () => {
        fileSystem.readFile(path.join(__dirname, "public", "js", "accessLog.js"), (error, content) => {
            if(error) {
                throw error;
            }

            response.writeHead(200, "content-type:application/javascript");
            response.write(content);
            response.end();
        });
    });
});

app.get("/table.css", (request, response) => {
    validateCookie(request, response, () => {
        fileSystem.readFile(path.join(__dirname, "public", "css", "table.css"), (error, content) => {
            if(error) {
                throw error;
            }

            response.writeHead(200, "content-type:application/javascript");
            response.write(content);
            response.end();
        });
    });
});

app.get("/form.css", (request, response) => {
    validateCookie(request, response, () => {
        fileSystem.readFile(path.join(__dirname, "public", "css", "form.css"), (error, content) => {
            if(error) {
                throw error;
            }

            response.writeHead(200, "content-type:application/javascript");
            response.write(content);
            response.end();
        });
    });
});

app.get("/createAccount", (request, response) => {
    fileSystem.readFile(path.join(__dirname, "public", "html", "createAccount.html"), (error, content) => {
        if(error) {
            throw error;
        }

        response.writeHead(200, "content-type:text/html");

        if(request.query.hasOwnProperty("usernametaken")) {
            response.write("<h1>User Name Taken!</h1>")
        }

        response.write(content);
        response.end();
    });
});

app.post("/api/user", (request, response) => {
    let inputs = request.body;
    connection.query("SELECT userName FROM User WHERE userName = ?", [inputs.userName], (error, results) => {
        if(error) {
            throw error;
        }
        if(results.length > 0) {
            response.redirect('/createAccount?usernametaken=1');
        } else {
            let hash = hashAndSaltPassword(inputs.password);
            connection.query("INSERT INTO User(userName, passwordHash, firstName, lastName) VALUES(?,?,?,?)", [inputs.userName, hash, inputs.firstName, inputs.lastName], error => {
                if(error) {
                    throw error;
                }

                response.redirect('/login');
            });
        }
    });
});

app.get("/api/users", (request, response) => {
    connection.query("SELECT userName, firstName, lastName FROM User", [], (error, result) => {
        if(error) {
            throw error;
        }

        response.writeHead(200, "content-type:application/json");
        response.write(JSON.stringify({success:true, data:result}));
        response.end();
    });
});

app.get("/api/accessLog", (request, response) => {
    connection.query("SELECT LogAccess.date, LogAccess.userName, User.firstName, User.lastName, LogAccess.url, LogAccess.query, LogAccess.body FROM LogAccess LEFT JOIN User ON User.userId = LogAccess.userId ORDER BY LogAccess.date DESC", [], (error, result) => {
        if(error) {
            throw error;
        }

        response.writeHead(200, "content-type:application/json");
        response.write(JSON.stringify({success:true, data:result}));
        response.end();
    });
});

app.get("/login", (request, response) => {
    fileSystem.readFile(path.join(__dirname, "public", "html", "login.html"), (error, content) => {
        if(error) {
            throw error;
        }

        response.writeHead(200, "content-type:text/html");
        if(request.query.hasOwnProperty("userNotFound")) {
            response.write("<h1>User Not Found!</h1>")
        }
        if(request.query.hasOwnProperty("loggedout")) {
            response.write("<h1>Logged Out!</h1>")
        }
        response.write(content);
        response.end();
    });
});

app.post("/login", (request, response) => {
    let inputs = request.body;
    connection.query("SELECT userId, passwordHash FROM User WHERE userName = ?", [inputs.userName], (error, results) => {
        if(error) {
            throw error;
        }

        if(results.length === 0) {
            response.redirect('/login?userNotFound=1&redirect=' + request.query.redirect);
            return;
        }

        if(!validatePassword(inputs.password, results[0].passwordHash)) {
            response.redirect('/login?userNotFound=1&redirect=' + request.query.redirect);
        } else {
            let sessionToken = crypto.randomBytes(32).toString('hex');
            connection.query("INSERT INTO Session(userId, token, createDate) VALUES(?, ?, ?)", [results[0].userId, sessionToken, new Date()], error => {
                if(error) {
                    throw error;
                }

                connection.query("UPDATE USER SET lastLogin = ? WHERE userId = ?", [new Date(), results[0].userId], error => {
                    if(error) {
                        throw error;
                    }
                });

                response.cookie('agile', sessionToken, {maxAge: 365*24*60*60*1000});

                if(request.query.hasOwnProperty("redirect") && request.query.redirect && request.query.redirect !== "undefined") {
                    response.redirect('' + request.query.redirect)
                } else {
                    response.redirect('/');
                }
            });
        }
    });
});

app.get("/logout", (request, response) => {
    response.clearCookie("agile");
    response.redirect('/login?loggedout=1');
});

app.get("/public/images/404.jpg", (request, response) => {
    fileSystem.readFile(path.join(__dirname, "public", "images", "404.jpg"), (error, content) => {
        if(error) {
            throw error;
        }

        response.writeHead(200, "content-type:image/jpg");
        response.write(content);
        response.end();
    });
});

app.get("*", (request, response) => {
    fileSystem.readFile(path.join(__dirname, "public", "html", "404.html"), (error, content) => {
       if(error) {
           throw error;
       }

       response.writeHead(404, "content-type:text/html");
       response.write(content);
       response.end();
    });
});

app.listen(5000);

function validateCookie(request, response, callback) {
    connection.query("SELECT userId FROM Session WHERE token = ?", [request.cookies.agile], (error, results) => {
        if(error) {
            throw error;
        }

        if(results.length === 0) {
            response.redirect('/login?redirect=' + request.url);
            return;
        }

        connection.query("UPDATE USER SET lastActivity = ? WHERE userId = ?", [new Date(), results[0].userId], error => {
            if(error) {
                throw error;
            }
        });

        callback.call();
    })

    return true;
}

function hashAndSaltPassword(password) {
    let salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(password, salt);
}

function validatePassword(password, hash) {
    return bcrypt.compareSync(password, hash); // true
}
function logRequest (request, response, next) {
    connection.query("SELECT Session.userId, userName FROM Session JOIN User ON User.userId = Session.userId WHERE token = ?", [request.cookies.agile], (error, results) => {
        if(error) {
            throw error;
        }

        let userId = null;
        let userName = null;

        if(results.length > 0) {
            userId = results[0].userId;
            userName = results[0].userName;
        }

        let body = JSON.stringify(request.body);

        if(request.url.toLowerCase() === "/login" && request.method === "POST") {
            body = "REDACTED";
        }

        connection.query("INSERT INTO LogAccess(date, userId, userName, url,`query`, `body`) VALUES (current_timestamp(), ?, ?, ?, ?, ?)", [userId, userName, request.url, JSON.stringify(request.query), body], error => {
            if(error) {
                throw error;
            }
        });
    });

    next()
}