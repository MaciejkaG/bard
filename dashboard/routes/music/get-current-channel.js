const { useQueue } = require("discord-player");

module.exports = function (app, client, __dirname, db, lib, lang, oauth) {
    app.post('/api/music/get-current-channel', async (req, res) => {
        if (await oauth.checkLoggedIn(req) || req.session.guild_id != null) {
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
    });
}