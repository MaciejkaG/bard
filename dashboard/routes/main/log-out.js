module.exports = function (app, client, __dirname, db, lib, lang, oauth) {
    app.post('/api/music/log-out', async (req, res) => {
        if (await oauth.checkLoggedIn(req)) {
            req.session.destroy((err) => {
                res.send({ status: "success" })
            })
        } else {
            res.send({ status: "authorisationError" });
        }
    });
}