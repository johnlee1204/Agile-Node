const fileSystem = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");

module.exports = function(app, sharedFunctions){
    app.get("/users", (request, response) => {
        sharedFunctions.validateCookie(request, response, (userInformation) => {
            fileSystem.readFile(path.join(path.dirname(require.main.filename), "public", "html", "users.html"), (error, content) => {
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
        fileSystem.readFile(path.join(path.dirname(require.main.filename), "public", "html", "createAccount.html"), (error, content) => {
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
        sharedFunctions.connection.query("SELECT userName FROM User WHERE userName = ?", [inputs.userName], (error, results) => {
            if(error) {
                throw error;
            }
            if(results.length > 0) {
                response.redirect('/createAccount?usernametaken=1');
            } else {
                let hash = hashAndSaltPassword(inputs.password);
                sharedFunctions.connection.query("INSERT INTO User(userName, passwordHash, firstName, lastName) VALUES(?,?,?,?)", [inputs.userName, hash, inputs.firstName, inputs.lastName], error => {
                    if(error) {
                        throw error;
                    }

                    response.redirect('/login');
                });
            }
        });
    });

    app.get("/api/users", (request, response) => {
        sharedFunctions.connection.query("SELECT userName, firstName, lastName FROM User", [], (error, result) => {
            if(error) {
                throw error;
            }

            response.writeHead(200, "content-type:application/json");
            response.write(JSON.stringify({success:true, data:result}));
            response.end();
        });
    });
}

function hashAndSaltPassword(password) {
    let salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(password, salt);
}