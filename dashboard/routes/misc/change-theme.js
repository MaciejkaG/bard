

module.exports = function (app, client, __dirname, db, lib, lang, oauth) {
    app.post('/api/misc/change-theme', async (req, res) => {
        if (await oauth.checkLoggedIn(req)) {
            if (req.session.isInGuild) {
                oauth.getUser(req.session.access_token).then(user => {
                    const themes = lib.themes.themeList();
                    if (req.body.target == null || !Number.isInteger(req.body.target) || req.body.target < 0 || req.body.target > themes.length) {
                        res.send({ status: "valueError" });
                    } else {
                        db.run(`UPDATE user_config SET theme_id = ${req.body.target} WHERE user_id = ${user.id}`);

                        res.send({ status: "success" });
                    }
                })
            } else {
                res.send({ status: "permissionError" });
            }
        } else {
            res.send({ status: "authorisationError" });
        }
    });
}