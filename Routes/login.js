const fileSystem = require("fs");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcrypt");

module.exports = function(app, sharedFunctions){
    app.get("/login", (request, response) => {
        fileSystem.readFile(path.join(path.dirname(require.main.filename), "public", "html", "login.html"), (error, content) => {
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
        sharedFunctions.connection.query("SELECT userId, passwordHash FROM User WHERE userName = ?", [inputs.userName], (error, results) => {
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
                sharedFunctions.connection.query("INSERT INTO Session(userId, token, createDate) VALUES(?, ?, ?)", [results[0].userId, sessionToken, new Date()], error => {
                    if(error) {
                        throw error;
                    }

                    sharedFunctions.connection.query("UPDATE USER SET lastLogin = ? WHERE userId = ?", [new Date(), results[0].userId], error => {
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
}

function validatePassword(password, hash) {
    return bcrypt.compareSync(password, hash); // true
}