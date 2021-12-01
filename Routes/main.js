const fileSystem = require("fs");
const path = require("path");

module.exports = function(app, sharedFunctions){
    app.get("/", (request, response) => {
        sharedFunctions.validateCookie(request, response, (userInformation) => {
            fileSystem.readFile(path.join(path.dirname(require.main.filename), "public", "html", "index.html"), (error, content) => {
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
        sharedFunctions.validateCookie(request, response, (userInformation) => {
            fileSystem.readFile(path.join(path.dirname(require.main.filename), "public", "html", "about.html"), (error, content) => {
                if(error) {
                    throw error;
                }

                response.writeHead(200, "content-type:text/html");
                response.write(content);
                response.end();
            });
        });
    });

    app.get("*", (request, response) => {
        fileSystem.readFile(path.join(path.dirname(require.main.filename), "public", "html", "404.html"), (error, content) => {
            if(error) {
                throw error;
            }

            response.writeHead(404, "content-type:text/html");
            response.write(content);
            response.end();
        });
    });
}