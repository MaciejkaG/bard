const { useMainPlayer } = require("discord-player");

module.exports = function (app, client, __dirname, db, lib, lang, oauth) {
    app.post('/api/music/play', async (req, res) => {
        if (await oauth.checkLoggedIn(req) || req.session.guild_id != null) {
            if (req.session.isInGuild) {
                oauth.getUser(req.session.access_token).then(user => {
                    if (req.body.query == null || req.body.query.length < 0 || typeof req.body.query !== "string" || req.body.query.length > 100) {
                        res.send({ status: "valueError" });
                    } else {
                        const player = useMainPlayer();
                        const guild = client.guilds.cache.find(guild => guild.id === req.session.guild_id);
                        const member = guild.members.cache.find(searchedUser => searchedUser.id === user.id);

                        if (member && member.voice.channel) {
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
                        }
                    }
                })
            } else {
                res.send({ status: "permissionError" })
            }
        } else {
            res.send({ status: "authorisationError" });
        }
    });
}