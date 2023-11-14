require('dotenv').config();
const express = require("express");
const { v4: uuidv4 } = require('uuid');
const session = require('express-session');
const path = require('node:path');
const lib = require("../utils");
const fs = require('fs');
const colors = require('colors');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(path.join(__dirname, "../db/main.db"));
const lang = new lib.localisation.language(process.env.LANGUAGE);

module.exports = {
    main: async function(client) {
        db.run("CREATE TABLE IF NOT EXISTS user_config (user_id VARCHAR(255) NOT NULL, theme_id INT NULL)");

        const app = express();
        const oauth = new lib.bjorn.Client(process.env.BOT_CLIENT_ID, process.env.CLIENT_SECRET, `${process.env.REDIRECT}/api/auth/redirect`);
        const geniusClient = new lib.karaokee.Client(process.env.GENIUS_ACCESS_TOKEN);

        app.use(express.static(path.join(__dirname, 'public')));
        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));
        app.set('views', path.join(__dirname, 'templates'));
        app.use(session({
            genid: function (req) {
                return uuidv4()
            },
            secret: 'Oxa8kfx8gtjQRImTBPImRWQOTXHEyqeY',
            resave: false,
            saveUninitialized: true,
            cookie: { secure: false }
        }));

        try {
            const foldersPath = path.join(__dirname, 'routes');
            const routeFolders = fs.readdirSync(foldersPath);
            let i = 0;
            for (const folder of routeFolders) {
                const routesPath = path.join(foldersPath, folder);
                const routeFiles = fs.readdirSync(routesPath).filter(file => file.endsWith('.js'));
                for (const file of routeFiles) {
                    const filePath = path.join(routesPath, file);
                    require(filePath)(app, client, __dirname, db, lib, lang, oauth, geniusClient);
                    i++;
                }
            }

            console.log(`${'[DASHBOARD]'.cyan} Successfully loaded ${i} Express routes.`);

            app.listen(process.env.PORT, () => {
                console.log(`${'[DASHBOARD]'.cyan} Dashboard server listening on ${process.env.PORT} (${process.env.REDIRECT}/)`);
            });
        } catch (e) {
            console.log(`${'[DASHBOARD]'.cyan} ${'[ERROR]'.red} Bard faced the following error while trying to set up the dashboard:\n${e}`);
        }
    }
}