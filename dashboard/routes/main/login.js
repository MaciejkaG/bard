module.exports = function (app, client, __dirname, db, lib, lang, oauth) {
    app.get('/login', async (req, res) => {
        if (await oauth.checkLoggedIn(req)) {
            res.redirect("/dashboard")
        } else {
            res.redirect(`https://discord.com/api/oauth2/authorize?client_id=${encodeURI(process.env.BOT_CLIENT_ID)}&redirect_uri=${encodeURI(process.env.REDIRECT)}%2Fapi%2Fauth%2Fredirect&response_type=code&scope=identify%20guilds`)
        }
    });
}