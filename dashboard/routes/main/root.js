const handlebars = require("handlebars");
const fs = require("fs");
const path = require("node:path");

module.exports = function (app, client, __dirname, db, lib, lang, oauth) {
    app.get('/', async (req, res) => {
        let template = handlebars.compile(fs.readFileSync(path.join(__dirname, 'templates/root.html'), 'utf8'));
        if (await oauth.checkLoggedIn(req)) {
            res.send(template({ subtitle: lang.getText("rootSubtitle"), login: lang.getText("noLogin") }));
        } else {
            res.send(template({ subtitle: lang.getText("rootSubtitle"), login: lang.getText("login") }));
        }

    });
}