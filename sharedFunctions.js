const mysql = require("mysql");
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'jlee',
    password: 'Echo120499!',
    database: 'Agile'
});

connection.connect(error => {
    if(error) {
        throw error;
    }
});

module.exports = {
    connection: connection,
    validateCookie: function(request, response, callback) {
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

            callback(results[0]);
        })

        return true;
    },
    logRequest: function(request, response, next) {
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

            if((request.url.toLowerCase() === "/login" || request.url.toLowerCase() === "/api/user") && request.method === "POST") {
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

};