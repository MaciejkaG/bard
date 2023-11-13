const { useQueue } = require("discord-player");

module.exports = function (app, client, __dirname, db, lib, lang, oauth) {
    app.post('/api/music/skip-song', async (req, res) => {
        if (await oauth.checkLoggedIn(req) || req.session.guild_id != null) {
            oauth.getUser(req.session.access_token).then(user => {
                const queue = useQueue(req.session.guild_id);
                if (queue == null) {
                    res.send({ status: "queueNoExist" });
                } else {
                    if (lib.dash.checkUserInChannel(user.id, queue.channel)) {
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
    });
}