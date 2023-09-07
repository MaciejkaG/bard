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
const { useQueue, useMainPlayer } = require("discord-player");
const genius = require("genius-lyrics");
var colors = require('colors');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(path.join(__dirname, "../db/main.db"));
const lang = new lib.localisation.language(process.env.LANGUAGE);

module.exports = {
    main: async function(client) {
        db.run("CREATE TABLE IF NOT EXISTS user_config (user_id VARCHAR(255) NOT NULL, theme_id INT NULL)");

        const app = express();
        const oauth = new DiscordOauth2({
            clientId: process.env.BOT_CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            redirectUri: `${process.env.REDIRECT}/api/auth/redirect`,
        });
        const geniusClient = new genius.Client(process.env.GENIUS_ACCESS_TOKEN);

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
                let template = handlebars.compile(fs.readFileSync(path.join(__dirname, 'templates/root.html'), 'utf8'));
                if (checkLoggedIn(req)) {
                    res.send(template({ subtitle: lang.getText("rootSubtitle"), login: lang.getText("noLogin") }))
                } else {
                    res.send(template({ subtitle: lang.getText("rootSubtitle"), login: lang.getText("login") }))
                }
                
            })

            app.get('/login', (req, res) => {
                if (checkLoggedIn(req)) {
                    res.redirect("/dashboard")
                } else {
                    res.redirect(`https://discord.com/api/oauth2/authorize?client_id=${encodeURI(process.env.BOT_CLIENT_ID)}&redirect_uri=${encodeURI(process.env.REDIRECT)}%2Fapi%2Fauth%2Fredirect&response_type=code&scope=identify%20guilds`)
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
                                req.session.token_expiration = new Date().getTime() / 1000 + jsonRes.expires_in;
                                req.session.access_token = jsonRes.access_token;
                                req.session.refresh_token = jsonRes.refresh_token;
                                req.session.guild_id = null;
                                res.redirect("/dashboard");
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
                        req.session.isInGuild = true;
                        oauth.getUser(req.session.access_token).then(user => {
                            let themeListHTML = "";
                            getUserTheme(user.id, (theme) => {
                                let allThemes = lib.themes.themeList();
                                for (let i = 0; i < allThemes.length; i++) {
                                    const elem = allThemes[i];
                                    if (theme.name != elem.name && theme.mainColor1 != elem.mainColor1) {
                                        themeListHTML += `<span class="theme" onclick="changeTheme(${i})">${elem.name}</span>`
                                    } else {
                                        themeListHTML += `<span class="theme active">${elem.name}</span>`
                                    }
                                }

                                let template = handlebars.compile(fs.readFileSync(path.join(__dirname, 'templates/dashboard.html'), 'utf8'));
                                res.send(template({ queueFetchFailed: lang.getText("queueFetchFailed"), trackFetchFailed: lang.getText("trackFetchFailed"), connectionError: lang.getText("connectionError"), redirect: process.env.REDIRECT, queue: lang.getText("queue"), themes: lang.getText("themes"), lyrics: lang.getText("lyrics"), addedToQueue: lang.getText("addedToQueue"), addToQueue: lang.getText("addToQueue"), openSource: lang.getText("openSource"), removedFromQueue: lang.getText("removedFromQueue"), removeFromQueue: lang.getText("removeFromQueue"), serverChanged: lang.getText("serverChanged"), themeList: themeListHTML, mainColor1: theme.mainColor1, mainColor2: theme.mainColor2, altColor: theme.altColor }));
                            });

                        })
                    })

                } else {
                    res.redirect(`/login`)
                }
            })
            
            app.post('/api/misc/change-theme', (req, res) => {
                if (checkLoggedIn(req)) {
                    if (req.session.isInGuild) {
                        oauth.getUser(req.session.access_token).then(user => {
                            const themes = lib.themes.themeList();
                            if (req.body.target == null || !Number.isInteger(req.body.target) || req.body.target < 0 || req.body.target > themes.length) {
                                res.send({ status: "valueError" });
                            } else {
                                db.run(`UPDATE user_config SET theme_id = ${req.body.target} WHERE user_id = ${user.id}`);

                                res.send({ status: "success" });
                            }
                        })
                    } else {
                        res.send({ status: "permissionError" });
                    }
                } else {
                    res.send({ status: "authorisationError" });
                }
            })

            app.post('/api/music/get-current-channel', (req, res) => {
                if (checkLoggedIn(req) || req.session.guild_id != null) {
                    oauth.getUser(req.session.access_token).then(user => {
                        const queue = useQueue(req.session.guild_id);
                        if (queue == null) {
                            res.send({ status: "queueNoExist" });
                        } else {
                            if (queue == null || queue.tracks.length === 0) {
                                res.send({ "status": "queueEmpty" });
                            } else {
                                if (queue == null || queue.tracks.length === 0) {
                                    res.send({ "status": "noTrack" });
                                } else {
                                    res.send({ "status": "success", "channelName": queue.channel.name })
                                }
                            }
                        }
                    })
                } else {
                    res.send({ status: "authorisationError" });
                }
            })

            app.post('/api/music/get-lyrics', (req, res) => {
                if (checkLoggedIn(req) || req.session.guild_id != null) {
                    oauth.getUser(req.session.access_token).then(user => {
                        const queue = useQueue(req.session.guild_id);
                        if (queue == null) {
                            res.send({ status: "queueNoExist" });
                        } else {
                            if (checkUserInChannel(user.id, queue.channel)) {
                                if (queue == null || queue.tracks.length === 0) {
                                    res.send({ "status": "queueEmpty" });
                                } else {
                                    if (queue == null || queue.tracks.length === 0 || queue.currentTrack == null) {
                                        res.send({ "status": "noTrack" });
                                    } else {
                                        (async () => {
                                            try {
                                                var searches;
                                                try {
                                                    searches = await geniusClient.songs.search(`${queue.currentTrack.author} ${queue.currentTrack.title.replace(/\s*\(.*?\)\s*/g, '').replace(/\s*\[.*?\]\s*/g, '')}`);
                                                } catch {} finally {
                                                    var song;
                                                    if (searches==null || searches.length === 0) {
                                                        searches = await geniusClient.songs.search(`${queue.currentTrack.title.replace(/\s*\(.*?\)\s*/g, '').replace(/\s*\[.*?\]\s*/g, '')}`);
                                                        if (searches==null || searches.length === 0) {
                                                            return res.send({ status: "noResults" });
                                                        } else {
                                                            song = searches[0];
                                                            res.send({ "status": "success", "lyrics": await song.lyrics() });
                                                        }
                                                    } else {
                                                        song = searches[0];
                                                        res.send({ "status": "success", "lyrics": await song.lyrics() });
                                                    }
                                                }
                                                
                                            } catch (e) {
                                                if (e.toString().includes("NoResultError") || e.toString().includes("No result was found")) {
                                                    res.send({ status: "noResults" });
                                                } else if (e instanceof SyntaxError && e.toString().includes("Unexpected token '<")) {
                                                    console.log('[DASHBOARD] '.cyan + '[WARNING] '.yellow +"Seems like Genius asks for captcha. Please enter GENIUS_ACCESS_TOKEN .env variable to prevent that by using Genius's official API instead of scraping lyrics.\nFor more info please view https://github.com/codebois-dev/bard/wiki/Getting-started#use-genius-official-api-instead-of-scraping");
                                                    res.send({ status: "serverException" });
                                                } else {
                                                    console.log(`${'[DASHBOARD]'.cyan} ${'[ERROR]'.red} Bard faced an error while fetching the lyrics:\n${e}`);
                                                    res.send({ status: "unknownError" });
                                                }
                                            }
                                        })();
                                    }
                                }
                            } else {
                                res.send({ status: "userNotInBotChannel" });
                            }
                        }
                    })
                } else {
                    res.send({ status: "authorisationError" });
                }
            })

            app.post('/api/music/get-current-track', (req, res) => {
                if (checkLoggedIn(req) || req.session.guild_id != null) {
                    oauth.getUser(req.session.access_token).then(user => {
                        const queue = useQueue(req.session.guild_id);
                        if (queue == null) {
                            res.send({ status: "queueNoExist" });
                        } else {
                            if (checkUserInChannel(user.id, queue.channel)) {
                                if (queue == null || queue.tracks.length === 0) {
                                    res.send({ "status": "queueEmpty" });
                                } else {
                                    if (queue == null || queue.tracks.length === 0) {
                                        res.send({ "status": "noTrack" });
                                    } else {
                                        if (queue.currentTrack != null) {
                                            let track;
                                            try {
                                                track = queue.currentTrack.toJSON();
                                                track.progress = queue.node.getTimestamp(false).current.value;
                                                track.volume = queue.node.volume;
                                                track.paused = queue.node.isPaused();
                                            } catch {
                                                res.send({ "status": "trackGetError" });
                                                return
                                            }
                                            res.send({ status: "success", track: track });
                                        } else {
                                            res.send({ "status": "noTrack" });
                                        }
                                    }
                                }
                            } else {
                                res.send({ status: "userNotInBotChannel" });
                            }
                        }
                    })
                } else {
                    res.send({ status: "authorisationError" });
                }
            })

            app.post('/api/music/get-queue', (req, res) => {
                if (checkLoggedIn(req) || req.session.guild_id != null) {
                    oauth.getUser(req.session.access_token).then(user => {
                        const queue = useQueue(req.session.guild_id);
                        if (queue == null) {
                            res.send({ status: "queueNoExist" });
                        } else {
                            if (checkUserInChannel(user.id, queue.channel)) {
                                if (queue == null || queue.tracks.length === 0) {
                                    res.send({ "status": "queueEmpty" });
                                } else {
                                    let tracks = queue.tracks.toArray();
                                    res.send({ status: "success", tracks: tracks });
                                }
                            } else {
                                res.send({ status: "userNotInBotChannel" });
                            }
                        }
                    })
                } else {
                    res.send({ status: "authorisationError" });
                }
            })

            app.post('/api/music/pause', (req, res) => {
                if (checkLoggedIn(req) || req.session.guild_id != null) {
                    oauth.getUser(req.session.access_token).then(user => {
                        const queue = useQueue(req.session.guild_id);
                        if (queue==null) {
                            res.send({ status: "queueNoExist" });
                        } else {
                            if (checkUserInChannel(user.id, queue.channel)) {
                                queue.node.setPaused(!queue.node.isPaused());
                                res.send({ status: "success" });
                            } else {
                                res.send({ status: "userNotInBotChannel" });
                            }
                        }
                    })
                } else {
                    res.send({ status: "authorisationError" });
                }
            })

            app.post('/api/music/skip-song', (req, res) => {
                if (checkLoggedIn(req) || req.session.guild_id != null) {
                    oauth.getUser(req.session.access_token).then(user => {
                        const queue = useQueue(req.session.guild_id);
                        if (queue == null) {
                            res.send({ status: "queueNoExist" });
                        } else {
                            if (checkUserInChannel(user.id, queue.channel)) {
                                queue.node.skip();
                                queue.metadata.send(`${user.username} ${lang.getText("userSkipped")}: \`\`${queue.currentTrack.title}\`\` ${lang.getText("usingDashboard")}`);
                                res.send({ status: "success" });
                            } else {
                                res.send({ status: "userNotInBotChannel" });
                            }
                        }
                    })
                } else {
                    res.send({ status: "authorisationError" });
                }
            })

            app.post('/api/music/seek', (req, res) => {
                if (checkLoggedIn(req) || req.session.guild_id != null) {
                    oauth.getUser(req.session.access_token).then(user => {
                        const queue = useQueue(req.session.guild_id);
                        if (queue == null) {
                            res.send({ status: "queueNoExist" });
                        } else {
                            if (checkUserInChannel(user.id, queue.channel)) {
                                if (queue == null || queue.currentTrack == null) {
                                    res.send({ status: "queueNoExist" });
                                }
                                if (req.body.target == null || !Number.isInteger(req.body.target) || req.body.target < 0 || req.body.target > queue.currentTrack.durationMS / 1000) {
                                    res.send({ status: "valueError" });
                                } else {
                                    queue.node.seek(req.body.target * 1000);
                                    queue.metadata.send(`${user.username} ${lang.getText("userSeeked")} \`\`${queue.currentTrack.title}\`\` ${lang.getText("usingDashboard")}`);
                                    res.send({ status: "success" });
                                }
                            } else {
                                res.send({ status: "userNotInBotChannel" });
                            }
                        }
                    })
                } else {
                    res.send({ status: "authorisationError" });
                }
            })

            app.post('/api/music/get-servers', (req, res) => {
                if (checkLoggedIn(req)) {
                    oauth.getUser(req.session.access_token).then(user => {
                        oauth.getUserGuilds(req.session.access_token).then(guilds => {
                            const mutual = getMutualServers(guilds, client.guilds.cache)

                            let serverList = [];
                            for (let i = 0; i < mutual.length; i++) {
                                const guild = mutual[i];
                                serverList.push({ id: guild.id, name: guild.name, iconUrl: (guild.icon == null) ? '/img/discord-logo.svg' : `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.webp?size=1024` });
                            }

                            res.send({ status: "success", servers: serverList })
                        })
                    })
                } else {
                    res.send({ status: "authorisationError" });
                }
            })

            app.post('/api/music/set-user-server', (req, res) => {
                if (checkLoggedIn(req)) {
                    oauth.getUser(req.session.access_token).then(user => {
                        const guild = client.guilds.cache.get(req.body.target);
                        if (req.body.target == null || guild == null) {
                            res.send({ status: "valueError" });
                        } else {
                            oauth.getUserGuilds(req.session.access_token).then(guilds => {
                                if (!checkUserInGuild(guilds, req.body.target)) {
                                    res.send({ status: "permissionError" })
                                } else {
                                    req.session.guild_id = req.body.target;
                                    res.send({ status: "success" });
                                }
                            })
                        }
                    })
                } else {
                    res.send({ status: "authorisationError" });
                }
            })

            app.post('/api/music/get-user-server', (req, res) => {
                if (checkLoggedIn(req) || req.session.guild_id != null) {
                    oauth.getUser(req.session.access_token).then(user => {
                        res.send({ status: "success", id: req.session.guild_id })
                    })
                } else {
                    res.send({ status: "authorisationError" });
                }
            })

            app.post('/api/music/set-volume', (req, res) => {
                if (checkLoggedIn(req) || req.session.guild_id != null) {
                    oauth.getUser(req.session.access_token).then(user => {
                        const queue = useQueue(req.session.guild_id);
                        if (queue == null) {
                            res.send({ status: "queueNoExist" });
                        } else {
                            if (checkUserInChannel(user.id, queue.channel)) {
                                if (req.body.target == null || !Number.isInteger(req.body.target) || req.body.target < 0 || req.body.target > 100) {
                                    res.send({ status: "valueError" });
                                } else {
                                    queue.node.setVolume(req.body.target);
                                    queue.metadata.send(`${user.username} ${lang.getText("userSetVolume")} \`\`${queue.node.volume}%\`\` ${lang.getText("usingDashboard")}`);
                                    res.send({ status: "success" });
                                }
                            } else {
                                res.send({ status: "userNotInBotChannel" });
                            }

                        }
                    })
                } else {
                    res.send({ status: "authorisationError" });
                }
            })

            app.post('/api/music/autocomplete', (req, res) => {
                if (checkLoggedIn(req) || req.session.guild_id != null) {
                    if (req.session.isInGuild) {
                        oauth.getUser(req.session.access_token).then(user => {
                            if (req.body.query == null || req.body.query.length < 0 || typeof req.body.query !== "string" || req.body.query.length > 100) {
                                res.send({ status: "valueError" });
                            } else {
                                const player = useMainPlayer();
                                player.search(req.body.query, { fallbackSearchEngine: "youtubeSearch" }).then((result) => {
                                    if (!result.hasTracks()) {
                                        res.send({ status: "noResults" });
                                    } else {
                                        res.send({
                                            status: "success",
                                            results: result.tracks.slice(0, 5).map((t) => ({
                                                title: t.title,
                                                author: t.author,
                                                source: t.source,
                                                url: t.url,
                                            }))
                                        });
                                    }
                                });
                            }
                        })
                    } else {
                        res.send({ status: "permissionError" })
                    }
                } else {
                    res.send({ status: "authorisationError" });
                }
            })

            app.post('/api/music/play', (req, res) => {
                if (checkLoggedIn(req) || req.session.guild_id != null) {
                    if (req.session.isInGuild) {
                        oauth.getUser(req.session.access_token).then(user => {
                            if (req.body.query == null || req.body.query.length < 0 || typeof req.body.query !== "string" || req.body.query.length > 100) {
                                res.send({ status: "valueError" });
                            } else {
                                const player = useMainPlayer();
                                const guild = client.guilds.cache.find(guild => guild.id === req.session.guild_id);
                                const member = guild.members.cache.find(searchedUser => searchedUser.id === user.id);

                                if (member.voice.channel) {
                                    (async () => {
                                        try {
                                            const { track } = await player.play(member.voice.channel, req.body.query, {
                                                nodeOptions: {
                                                    metadata: member.voice.channel
                                                },
                                                fallbackSearchEngine: 'youtube'
                                            });
                                            member.voice.channel.send(`${user.username} ${lang.getText("userAddedToQueue")} \`\`${track.title}\`\` ${lang.getText("usingDashboard")}`);
                                            res.send({ status: "success" })
                                        } catch (e) {
                                            console.log(`${'[DASHBOARD]'.cyan} ${'[ERROR]'.red} Bard faced an unknown error while a user was trying to add a track to queue:\n${e}`)
                                            res.send({ status: "unknownError" })
                                        }
                                    })();
                                } else {
                                    res.send({ status: "notInVoiceChannel" });
                                };
                            }
                        })
                    } else {
                        res.send({ status: "permissionError" })
                    }
                } else {
                    res.send({ status: "authorisationError" });
                }
            })

            app.post('/api/music/remove-from-queue', (req, res) => {
                if (checkLoggedIn(req) || req.session.guild_id != null) {
                    oauth.getUser(req.session.access_token).then(user => {
                        const queue = useQueue(req.session.guild_id);
                        if (queue == null) {
                            res.send({ status: "queueNoExist" });
                        } else {
                            if (checkUserInChannel(user.id, queue.channel)) {
                                if (req.body.target == null || !Number.isInteger(req.body.target) || req.body.target < 0 || req.body.target > queue.tracks.toArray().length) {
                                    res.send({ status: "valueError" });
                                } else {
                                    if (queue.tracks.toArray()[req.body.target]==null) {
                                        res.send({ status: "valueError" });
                                    } else {
                                        let track = queue.tracks.toArray()[req.body.target];
                                        queue.removeTrack(req.body.target);
                                        queue.metadata.send(`${user.username} ${lang.getText("userRemovedFromQueue")} \`\`${track.title}\`\` ${lang.getText("usingDashboard")}`);
                                        res.send({ status: "success" });
                                    }
                                }
                            } else {
                                res.send({ status: "userNotInBotChannel" });
                            }

                        }
                    })
                } else {
                    res.send({ status: "authorisationError" });
                }
            })

            app.listen(process.env.PORT, () => {
                console.log(`${'[DASHBOARD]'.cyan} Dashboard server listening on ${process.env.PORT} (${process.env.REDIRECT}/)`);
            });
        } catch (e) {
            console.log(`${'[DASHBOARD]'.cyan} ${'[ERROR]'.red} Bard faced the following error while trying to configure the dashboard:\n${e}`)
        }
    }
}

function getUserTheme(user_id, callback) {
    db.get(`SELECT theme_id FROM user_config WHERE user_id = "${user_id}"`, function (err, row) {
        if (err) {
            console.log(err);
        } else {
            if (row==null) {
                db.run(`INSERT INTO user_config(user_id, theme_id) VALUES ("${user_id}", 0)`);
                callback(lib.themes.getThemeById(0));
            } else if (row.theme_id == null) {
                db.run(`UPDATE user_config SET theme_id = 0 WHERE user_id = "${user_id}"`);
                callback(lib.themes.getThemeById(0));
            } else {
                callback(lib.themes.getThemeById(row.theme_id));
            }
        }
    })
}

function checkLoggedIn(req) {
    if (req.session.token_expiration === undefined || new Date().getTime() / 1000 > req.session.token_expiration) {
        return false
    } else {
        return true
    }
}

function checkUserInChannel(user_id, channel) {
    for (let key of channel.members.keys()) {
        if (key==user_id) return true;
    }
    return false;
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
    let template = handlebars.compile(fs.readFileSync(path.join(__dirname, 'templates/message.html'), 'utf8'));
    return template({ message: message, color: color, title: title, back: lang.getText("backHome") })
}

function checkUserInGuild(guilds, id) {
    let isInGuild = false;
    for (let i = 0; i < guilds.length; i++) {
        const elem = guilds[i];
        if (elem.id === id) {
            isInGuild = true;
        }
    }
    return isInGuild;
}

function getMutualServers(guildList1, guildList2) {
    const idList = guildList2.map((x) => x.id);
    let mutual = [];

    for (let i = 0; i < guildList1.length; i++) {
        const elem = guildList1[i];
        if (idList.includes(elem.id)) {
            mutual.push(elem);
        }
    }

    return mutual;
}