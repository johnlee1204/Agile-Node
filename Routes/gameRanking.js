const fileSystem = require("fs");
const path = require("path");
const sharedFunctions = require(path.join("../sharedFunctions.js"));

module.exports = function(app){

    app.get("/gameRankings", (request, response) => {
        sharedFunctions.validateCookie(request, response, (userInformation) => {
            fileSystem.readFile(path.join("public", "html", "gameRankings.html"), (error, content) => {
                if(error) {
                    throw error;
                }

                response.writeHead(200, "content-type:text:html");
                response.write(content);
                response.end();
            });
        });
    });

    app.post("/addGameRanking", (request, response) => {
        sharedFunctions.validateCookie(request, response, (userInformation) => {
            sharedFunctions.connection.query("DELETE FROM GameRanking WHERE userId = ? AND game = ?", [userInformation.userId, request.body.game], error => {
                if(error) {
                    throw error;
                }

                sharedFunctions.connection.query("INSERT INTO GameRanking(date, userId, game, plot, gameplay, graphics, atmosphere) VALUES(current_timestamp(), ?, ?, ?, ?, ?, ?)", [
                    userInformation.userId,
                    request.body.game,
                    request.body.plot,
                    request.body.gameplay,
                    request.body.graphics,
                    request.body.atmosphere
                ], error => {
                    if(error) {
                        throw error;
                    }

                    response.redirect('/gameRankings');
                });
            });
        });
    });

    app.get("/api/gameRankings", (request, response) => {
        sharedFunctions.connection.query("SELECT CONCAT(firstName, ' ', lastName) name, game, plot, gameplay, graphics, atmosphere FROM GameRanking JOIN User ON User.userId = GameRanking.userId ORDER BY GameRanking.date DESC", [], (error, result) => {
            if(error) {
                throw error;
            }

            response.writeHead(200, "content-type:application/json");
            response.write(JSON.stringify({success:true, data:result}));
            response.end();
        });
    });
}