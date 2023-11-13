const handlebars = require("handlebars");
const fs = require("fs");
const path = require("node:path");

module.exports = function (app, client, __dirname, db, lib, lang, oauth) {
    app.get('/dashboard', async (req, res) => {
        if (await oauth.checkLoggedIn(req)) {
            oauth.getUserGuilds(req.session.access_token).then(guilds => {
                req.session.isInGuild = true;
                oauth.getUser(req.session.access_token).then(user => {
                    let themeListHTML = "";
                    lib.dash.getUserTheme(db, user.id, (theme) => {
                        let allThemes = lib.themes.themeList();
                        for (let i = 0; i < allThemes.length; i++) {
                            const elem = allThemes[i];
                            if (theme.name != elem.name && theme.mainColour1 != elem.mainColour1) {
                                themeListHTML += `<span class="theme unactive" onclick="changeTheme(${i})" data-colour1="${elem.mainColour1}" data-colour2="${elem.mainColour2}" data-colour3="${elem.altColour}">${elem.name}</span>`
                            } else {
                                themeListHTML += `<span class="theme active">${elem.name}</span>`
                            }
                        }

                        let template = handlebars.compile(fs.readFileSync(path.join(__dirname, 'templates/dashboard.html'), 'utf8'));
                        res.send(template({ queueFetchFailed: lang.getText("queueFetchFailed"), trackFetchFailed: lang.getText("trackFetchFailed"), connectionError: lang.getText("connectionError"), redirect: process.env.REDIRECT, queue: lang.getText("queue"), themes: lang.getText("themes"), lyrics: lang.getText("lyrics"), addedToQueue: lang.getText("addedToQueue"), addToQueue: lang.getText("addToQueue"), openSource: lang.getText("openSource"), removedFromQueue: lang.getText("removedFromQueue"), removeFromQueue: lang.getText("removeFromQueue"), serverChanged: lang.getText("serverChanged"), selectServer: lang.getText("selectServer"), changeServer: lang.getText("changeServer"), logOut: lang.getText("logOut"), themeList: themeListHTML, mainColour1: theme.mainColour1, mainColour2: theme.mainColour2, altColour: theme.altColour }));
                    });

                })
            })

        } else {
            res.redirect(`/login`)
        }
    });
}