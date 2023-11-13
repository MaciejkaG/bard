module.exports = function (app, client, __dirname, db, lib, lang, oauth) {
    app.get('/api/auth/redirect', async (req, res) => {
        if (req.query.code != undefined) {
            oauth.getAccessToken(req.query.code)
                .then(jsonRes => {
                    req.session.token_expiration = new Date().getTime() / 1000 + jsonRes.expires_in;
                    req.session.access_token = jsonRes.access_token;
                    req.session.refresh_token = jsonRes.refresh_token;
                    req.session.guild_id = null;
                    res.redirect("/dashboard");
                })
                .catch(err => res.send(lib.dash.constructMessagePage(lang.getText("authorisationError"), 2)));
        }
    });
}