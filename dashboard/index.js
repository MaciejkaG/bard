require('dotenv').config()
const express = require("express");
const { v4: uuidv4 } = require('uuid');
const session = require('express-session');
const fetch = require("node-fetch");
const DiscordOauth2 = require("discord-oauth2");
const handlebars = require("handlebars");
const path = require('node:path');
const lib = require("../utils");
const querystring = require("querystring");
const fs = require('fs');
const { useQueue } = require("discord-player");
const lang = new lib.localisation.language(process.env.LANGUAGE);

module.exports = {
    main: async function(client) {
        const app = express();
        const oauth = new DiscordOauth2({
            clientId: process.env.BOT_CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            redirectUri: `${process.env.REDIRECT}/api/auth/redirect`,
        });

        app.use(express.static(path.join(__dirname, 'public')))
        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));
        app.set('views', path.join(__dirname, 'templates'));
        app.use(session({
            genid: function (req) {
                return uuidv4()
            },
            secret: 'Oxa8kfx8gtjQRImTBPImRWQOTXHEyqeY',
            resave: false,
            saveUninitialized: true,
            cookie: { secure: false }
        }))

        try {
            app.get('/', (req, res) => {
                var template = handlebars.compile(fs.readFileSync(path.join(__dirname, 'templates/root.html'), 'utf8'));
                res.send(template({ subtitle: lang.getText("rootSubtitle"), login: lang.getText("login") }))
            })


            app.get('/login', (req, res) => {
                if (checkLoggedIn(req)) {
                    res.redirect("/dashboard")
                } else {
                    res.redirect(`https://discord.com/api/oauth2/authorize?client_id=1138900172651380818&redirect_uri=${encodeURI(process.env.REDIRECT)}%2Fapi%2Fauth%2Fredirect&response_type=code&scope=identify%20guilds`)
                }
            })

            app.get('/api/auth/redirect', (req, res) => {
                if (req.query.code != undefined) {
                    var data = new URLSearchParams({
                        client_id: process.env.BOT_CLIENT_ID,
                        client_secret: process.env.CLIENT_SECRET,
                        grant_type: 'authorization_code',
                        code: req.query.code,
                        redirect_uri: `${process.env.REDIRECT}/api/auth/redirect`
                    }).toString();

                    fetch('https://discord.com/api/oauth2/token', {
                        method: 'post',
                        body: data,
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                    })
                        .then(response => response.json())
                        .then(jsonRes => {
                            if (jsonRes.error === undefined) {
                                req.session.token_expiration = new Date().getTime() / 1000 + jsonRes.expires_in
                                req.session.access_token = jsonRes.access_token
                                req.session.refresh_token = jsonRes.refresh_token
                                res.redirect("/dashboard")
                            } else {
                                res.send(constructMessagePage(lang.getText("authorisationError"), 2));
                            }
                        })
                        .catch(error => res.send(constructMessagePage(lang.getText("authorisationError"), 2)));
                }
            })

            app.get('/dashboard', (req, res) => {
                if (checkLoggedIn(req)) {
                    oauth.getUserGuilds(req.session.access_token).then(guilds => {
                        if (!checkUserInGuild(guilds)) {
                            res.send(constructMessagePage(lang.getText("permissionError"), 2));
                        } else {
                            var template = handlebars.compile(fs.readFileSync(path.join(__dirname, 'templates/dashboard.html'), 'utf8'));
                            res.send(template());
                        }
                    })

                } else {
                    res.redirect(`https://discord.com/api/oauth2/authorize?client_id=1138900172651380818&redirect_uri=${encodeURI(process.env.REDIRECT)}%2Fapi%2Fauth%2Fredirect&response_type=code&scope=identify%20guilds`)
                }
            })

            app.post('/api/music/skip-song', (req, res) => {
                if (checkLoggedIn(req)) {
                    oauth.getUserGuilds(req.session.access_token).then(guilds => {
                        if (!checkUserInGuild(guilds)) {
                            res.send(constructMessagePage(lang.getText("permissionError"), 2));
                        } else {
                            const queue = useQueue(process.env.GUILD_ID);
                            queue.node.skip();
                            res.send(constructMessagePage("Successful track skip", 0));
                        }
                    })
                } else {
                    res.send(constructMessagePage(lang.getText("authorisationError"), 2));
                }
            })

            app.listen(process.env.PORT, () => {
                console.log(`Server listening on ${process.env.PORT}`);
            });
        } catch (e) {
            console.log(e);
        }
    }
}

function checkLoggedIn(req) {
    if (req.session.token_expiration === undefined || new Date().getTime() / 1000 > req.session.token_expiration) {
        return false
    } else {
        return true
    }
}

function constructMessagePage(message, type) {
    let color;
    let title;
    if (type===0) {
        color = "#00ff00";
        title = lang.getText("message");
    } else if (type===2) {
        color = "#ff0000";
        title = lang.getText("errro");
    } else {
        color = "#ffff00";
        title = lang.getText("warning");
    }
    var template = handlebars.compile(fs.readFileSync(path.join(__dirname, 'templates/message.html'), 'utf8'));
    return template({ message: message, color: color, title: title, back: lang.getText("backHome") })
}

function checkUserInGuild(guilds) {
    let isInGuild = false;
    for (let i = 0; i < guilds.length; i++) {
        const elem = guilds[i];
        if (elem.id===process.env.GUILD_ID) {
            isInGuild = true;
        }
    }
    return isInGuild;
}