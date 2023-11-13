const { useQueue } = require("discord-player");

module.exports = function (app, client, __dirname, db, lib, lang, oauth) {
    app.post('/api/music/seek', async (req, res) => {
        if (await oauth.checkLoggedIn(req) || req.session.guild_id != null) {
            oauth.getUser(req.session.access_token).then(user => {
                const queue = useQueue(req.session.guild_id);
                if (queue == null) {
                    res.send({ status: "queueNoExist" });
                } else {
                    if (lib.dash.checkUserInChannel(user.id, queue.channel)) {
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
    });
}