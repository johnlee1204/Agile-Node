const express = require("express");
const cookieParser = require('cookie-parser')
const fileSystem = require("fs");
const path = require("path");
const mysql = require("mysql")
const bcrypt = require('bcrypt');
const crypto = require("crypto");
const e = require("express");

const app = express();

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
app.use(cookieParser());

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

app.get("/createAccount", (request, response) => {
    fileSystem.readFile(path.join(__dirname, "public", "html", "createAccount.html"), (error, content) => {
        if(error) {
            throw error;
        }

        response.writeHead(200, "content-type:text/html");
        response.write(content);
        response.end();
    });
});

app.post("/api/user", (request, response) => {
    let inputs = request.body;
    let hash = hashAndSaltPassword(inputs.password);
    connection.query("INSERT INTO User(userName, passwordHash, firstName, lastName) VALUES(?,?,?,?)", [inputs.userName, hash, inputs.firstName, inputs.lastName], error => {
        if(error) {
            throw error;
        }

        response.redirect('http://localhost:5000/login');
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
            response.redirect('http://localhost:5000/login?userNotFound=1&redirect=' + request.query.redirect);
            return;
        }

        if(!validatePassword(inputs.password, results[0].passwordHash)) {
            response.redirect('http://localhost:5000/login?userNotFound=1&redirect=' + request.query.redirect);
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

                if(request.query.hasOwnProperty("redirect") && request.query.redirect) {
                    response.redirect('http://localhost:5000' + request.query.redirect)
                } else {
                    response.redirect('http://localhost:5000/');
                }
            });
        }
    });
});

app.get("/logout", (request, response) => {
    response.clearCookie("agile");
    response.redirect('http://localhost:5000/login?loggedout=1');
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
            response.redirect('http://localhost:5000/login?redirect=' + request.url);
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