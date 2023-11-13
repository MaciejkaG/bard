module.exports = function (app, client, __dirname, db, lib, lang, oauth) {
    app.post('/api/music/get-servers', async (req, res) => {
        if (await oauth.checkLoggedIn(req)) {
            oauth.getUser(req.session.access_token).then(user => {
                oauth.getUserGuilds(req.session.access_token).then(guilds => {
                    const mutual = lib.dash.getMutualServers(guilds, client.guilds.cache)

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
    });
}