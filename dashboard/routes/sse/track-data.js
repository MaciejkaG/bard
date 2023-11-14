const { useQueue } = require("discord-player");

module.exports = function (app, client, __dirname, db, lib, lang, oauth) {
    app.get('/api/sse/track-data', async (req, res) => {
        if (await oauth.checkLoggedIn(req) || req.session.guild_id != null) {
            oauth.getUser(req.session.access_token).then(user => {
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Content-Type', 'text/event-stream');
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Connection', 'keep-alive');
                res.flushHeaders();

                let interValID = setInterval(() => {
                    let queue = useQueue(req.session.guild_id);
                    if (queue == null) {
                        res.write(`event: trackData\ndata: ${JSON.stringify({ status: "queueNoExist" })}\n\n`);
                    } else {
                        if (lib.dash.checkUserInChannel(user.id, queue.channel)) {
                            if (queue == null || queue.tracks.length === 0) {
                                res.write(`event: trackData\ndata: ${JSON.stringify({ status: "queueEmpty" })}\n\n`);
                            } else {
                                if (queue == null || queue.tracks.length === 0) {
                                    res.write(`event: trackData\ndata: ${JSON.stringify({ status: "noTrack" })}\n\n`);
                                } else {
                                    if (queue.currentTrack != null) {
                                        let track;
                                        try {
                                            track = queue.currentTrack.toJSON();
                                            track.durationS = Math.round(track.durationMS / 1000);
                                            track.progress = Math.round(queue.node.getTimestamp(false).current.value / 1000);
                                            track.volume = queue.node.volume;
                                            track.paused = queue.node.isPaused();
                                        } catch {
                                            res.write(`event: trackData\ndata: ${JSON.stringify({ status: "trackGetError" })}\n\n`);
                                            return
                                        }
                                        res.write(`event: trackData\ndata: ${JSON.stringify({ status: "success", track: track })}\n\n`);
                                    } else {
                                        res.write(`event: trackData\ndata: ${JSON.stringify({ status: "noTrack" })}\n\n`);
                                    }
                                }
                            }
                        } else {
                            res.write(`event: trackData\ndata: ${JSON.stringify({ status: "userNotInBotChannel" })}\n\n`);
                        }
                    }
                }, 300);

                res.on('close', () => {
                    clearInterval(interValID);
                    res.end();
                });
            })
            .catch(err => res.send({"status": "requestError"}));
        } else {
            res.send({ status: "authorisationError" });
        }
    });
}