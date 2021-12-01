const fileSystem = require("fs");
const path = require("path");
const webSocket = require("ws");

module.exports = function(app, sharedFunctions){
    const webSocketServer = new webSocket.Server({port: 8080})

    let webSocketClients = [];

    webSocketServer.on('connection', ws => {
        webSocketClients.push(ws);
        sharedFunctions.connection.query("SELECT date, message FROM Chat ORDER BY date", [], (error, result) => {
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

            sharedFunctions.connection.query("INSERT INTO Chat(date, message) VALUES(current_timestamp(), ?)", [message], error => {
                if(error) {
                    throw error;
                }
                sharedFunctions.connection.query("SELECT date, message FROM Chat ORDER BY date", [], (error, result) => {
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