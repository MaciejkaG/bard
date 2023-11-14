module.exports = function (app, client, __dirname, db, lib, lang, oauth) {
    app.post('/api/music/get-user-server', async (req, res) => {
        if (await oauth.checkLoggedIn(req) || req.session.guild_id != null) {
            oauth.getUser(req.session.access_token).then(user => {
                res.send({ status: "success", id: req.session.guild_id })
            })
            .catch(err => res.send({"status": "requestError"}));
        } else {
            res.send({ status: "authorisationError" });
        }
    });
}