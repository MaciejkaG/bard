const { useQueue } = require("discord-player");

module.exports = function (app, client, __dirname, db, lib, lang, oauth, geniusClient) {
    app.post('/api/music/get-lyrics', async (req, res) => {
        if (process.env.GENIUS_ACCESS_TOKEN == null) {
            res.send({ "status": "lyricsDisabled" });
            return;
        }
        if (await oauth.checkLoggedIn(req) || req.session.guild_id != null) {
            oauth.getUser(req.session.access_token).then(user => {
                const queue = useQueue(req.session.guild_id);
                if (queue == null) {
                    res.send({ status: "queueNoExist" });
                } else {
                    if (lib.dash.checkUserInChannel(user.id, queue.channel)) {
                        if (queue == null || queue.tracks.length === 0) {
                            res.send({ "status": "queueEmpty" });
                        } else {
                            if (queue == null || queue.tracks.length === 0 || queue.currentTrack == null) {
                                res.send({ "status": "noTrack" });
                            } else {
                                geniusClient.search(`${queue.currentTrack.author} ${queue.currentTrack.title.replace(/\s*\(.*?\)\s*/g, '').replace(/\s*\[.*?\]\s*/g, '')}`)
                                    .then((results) => {
                                        if (results.length > 0) {
                                            geniusClient.getLyrics(results[0].url).then((lyrics => {
                                                res.send({ "status": "success", "lyrics": lyrics, "source": results[0].url });
                                            }));
                                        } else {
                                            geniusClient.search(`${queue.currentTrack.title.replace(/\s*\(.*?\)\s*/g, '').replace(/\s*\[.*?\]\s*/g, '')}`)
                                                .then((results) => {
                                                    if (results.length > 0) {
                                                        geniusClient.getLyrics(results[0].url).then((lyrics => {
                                                            res.send({ "status": "success", "lyrics": lyrics, "source": results[0].url });
                                                        }));
                                                    } else {
                                                        return res.send({ status: "noResults" });
                                                    }
                                                });
                                        }
                                    })
                                    .catch(err => res.send({"status": "requestError"}));
                            }
                        }
                    } else {
                        res.send({ status: "userNotInBotChannel" });
                    }
                }
            })
            .catch(err => res.send(lib.dash.constructMessagePage(lang.getText("authorisationError"), 2)));
        } else {
            res.send({ status: "authorisationError" });
        }
    });
}