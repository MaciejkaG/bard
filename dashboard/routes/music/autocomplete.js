const { useMainPlayer } = require("discord-player");

module.exports = function (app, client, __dirname, db, lib, lang, oauth) {
    app.post('/api/music/autocomplete', async (req, res) => {
        if (await oauth.checkLoggedIn(req) || req.session.guild_id != null) {
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
                .catch(err => res.send({"status": "requestError"}));
            } else {
                res.send({ status: "permissionError" })
            }
        } else {
            res.send({ status: "authorisationError" });
        }
    });
}