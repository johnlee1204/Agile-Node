module.exports = function(app, sharedFunctions){
    app.get("/logout", (request, response) => {
        response.clearCookie("agile");
        response.redirect('/login?loggedout=1');
    });
}