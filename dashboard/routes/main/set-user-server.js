module.exports = function (app, client, __dirname, db, lib, lang, oauth) {
    app.post('/api/music/set-user-server', async (req, res) => {
        if (await oauth.checkLoggedIn(req)) {
            oauth.getUser(req.session.access_token).then(user => {
                const guild = client.guilds.cache.get(req.body.target);
                if (req.body.target == null || guild == null) {
                    res.send({ status: "valueError" });
                } else {
                    oauth.getUserGuilds(req.session.access_token).then(guilds => {
                        if (!lib.dash.checkUserInGuild(guilds, req.body.target)) {
                            res.send({ status: "permissionError" })
                        } else {
                            req.session.guild_id = req.body.target;
                            res.send({ status: "success" });
                        }
                    })
                }
            })
            .catch(err => res.send({"status": "requestError"}));
        } else {
            res.send({ status: "authorisationError" });
        }
    });
}