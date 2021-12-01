const fileSystem = require("fs");
const path = require("path");
const webSocket = require("ws");

module.exports = function(app, sharedFunctions){
    const webSocketServer = new webSocket.Server({port: 8080})

    let webSocketClients = [];

    webSocketServer.on('connection', ws => {
        webSocketClients.push(ws);
        sharedFunctions.connection.query("SELECT date, CONCAT(firstName, ' ', lastName) name, message FROM Chat JOIN User ON User.userId = Chat.userId ORDER BY date", [], (error, result) => {
            if(error) {
                throw error;
            }

            ws.send(JSON.stringify({success:true, data:result}));
        });
        ws.on('message', message => {
            message = message.toString();

            message = JSON.parse(message);

            if(message.message === "") {
                return;
            }

            sharedFunctions.connection.query("SELECT Session.userId FROM Session JOIN User ON User.userId = Session.userId WHERE token = ?", [message.session], (error, results) => {
                if(error) {
                    throw error;
                }

                let userId = null;

                if(results.length > 0) {
                    userId = results[0].userId;
                } else {
                    return;
                }

                sharedFunctions.connection.query("INSERT INTO Chat(date, message, userId) VALUES(current_timestamp(), ?, ?)", [message.message, userId], error => {
                    if(error) {
                        throw error;
                    }
                    sharedFunctions.connection.query("SELECT date, CONCAT(firstName, ' ', lastName) name, message FROM Chat JOIN User ON User.userId = Chat.userId ORDER BY date", [], (error, result) => {
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
    });

    app.get("/webSocket", (request, response) => {
        sharedFunctions.validateCookie(request, response, (userInformation) => {
            fileSystem.readFile(path.join(path.dirname(require.main.filename), "public", "html", "webSocket.html"), (error, content) => {
                if(error) {
                    throw error;
                }

                response.writeHead(200, "content-type:text/html");
                response.write(content);
                response.end();
            });
        });
    });
}