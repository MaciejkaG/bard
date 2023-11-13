const { useQueue } = require("discord-player");

module.exports = function (app, client, __dirname, db, lib, lang, oauth) {
    app.get("/api/sse/queue-data", async (req, res) => {
        if (await oauth.checkLoggedIn(req) || req.session.guild_id != null) {
            oauth.getUser(req.session.access_token).then(user => {
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Content-Type', 'text/event-stream');
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Connection', 'keep-alive');
                res.flushHeaders();

                let interValID = setInterval(() => {
                    const queue = useQueue(req.session.guild_id);
                    if (queue == null) {
                        res.write(`event: queueData\ndata: ${JSON.stringify({ status: "queueNoExist" })}\n\n`);
                    } else {
                        if (lib.dash.checkUserInChannel(user.id, queue.channel)) {
                            if (queue == null || queue.tracks.length === 0) {
                                res.write(`event: queueData\ndata: ${JSON.stringify({ status: "queueEmpty" })}\n\n`);
                            } else {
                                let tracks = queue.tracks.toArray();
                                res.write(`event: queueData\ndata: ${JSON.stringify({ status: "success", tracks: tracks })}\n\n`);
                            }
                        } else {
                            res.write(`event: queueData\ndata: ${JSON.stringify({ status: "userNotInBotChannel" })}\n\n`);
                        }
                    }
                }, 500);

                res.on('close', () => {
                    clearInterval(interValID);
                    res.end();
                });
            })
        } else {
            res.send({ status: "authorisationError" });
        }
    });
}