const fileSystem = require("fs");
const path = require("path");

module.exports = function(app, sharedFunctions){
    app.get("/api/accessLog", (request, response) => {
        sharedFunctions.connection.query("SELECT DATE_FORMAT(LogAccess.date, '%Y-%m-%d %H:%i:%s') date, LogAccess.userName, CONCAT(User.firstName,' ', User.lastName) name, LogAccess.url, LogAccess.query, LogAccess.body FROM LogAccess LEFT JOIN User ON User.userId = LogAccess.userId ORDER BY LogAccess.date DESC", [], (error, result) => {
            if(error) {
                throw error;
            }

            response.writeHead(200, "content-type:application/json");
            response.write(JSON.stringify({success:true, data:result}));
            response.end();
        });
    });
}