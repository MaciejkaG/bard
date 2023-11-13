const handlebars = require("handlebars");
const fs = require("fs");
const path = require("node:path");

module.exports = function (app, client, __dirname, db, lib, lang, oauth) {
    app.get('/change-log', (req, res) => {
        let template = handlebars.compile(fs.readFileSync(path.join(__dirname, 'templates/changelog.html'), 'utf8'));

        res.send(template());
    })
}