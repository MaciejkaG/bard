const { useQueue } = require("discord-player");

module.exports = function (app, client, __dirname, db, lib, lang, oauth) {
    app.post('/api/music/remove-from-queue', async (req, res) => {
        if (await oauth.checkLoggedIn(req) || req.session.guild_id != null) {
            oauth.getUser(req.session.access_token).then(user => {
                const queue = useQueue(req.session.guild_id);
                if (queue == null) {
                    res.send({ status: "queueNoExist" });
                } else {
                    if (lib.dash.checkUserInChannel(user.id, queue.channel)) {
                        if (req.body.target == null || !Number.isInteger(req.body.target) || req.body.target < 0 || req.body.target > queue.tracks.toArray().length) {
                            res.send({ status: "valueError" });
                        } else {
                            if (queue.tracks.toArray()[req.body.target] == null) {
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
            .catch(err => res.send({"status": "requestError"}));
        } else {
            res.send({ status: "authorisationError" });
        }
    });
}