const fileSystem = require("fs");
const path = require("path");

module.exports = function(app, sharedFunctions){
    app.get("/accessLog", (request, response) => {
        sharedFunctions.validateCookie(request, response, (userInformation) => {
            fileSystem.readFile(path.join(path.dirname(require.main.filename), "public", "html", "accessLog.html"), (error, content) => {
                if(error) {
                    throw error;
                }

                response.writeHead(200, "content-type:text/html");
                response.write(content);
                response.end();
            });
        });
    });

    app.get("/api/accessLog", (request, response) => {
        sharedFunctions.connection.query("SELECT LogAccess.date, LogAccess.userName, User.firstName, User.lastName, LogAccess.url, LogAccess.query, LogAccess.body FROM LogAccess LEFT JOIN User ON User.userId = LogAccess.userId ORDER BY LogAccess.date DESC", [], (error, result) => {
            if(error) {
                throw error;
            }

            response.writeHead(200, "content-type:application/json");
            response.write(JSON.stringify({success:true, data:result}));
            response.end();
        });
    });
}