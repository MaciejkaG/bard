const handlebars = require("handlebars");
const lib = require(".");
const lang = new lib.localisation.language(process.env.LANGUAGE);

module.exports = {
    checkUserInChannel: function (user_id, channel) {
        for (let key of channel.members.keys()) {
            if (key == user_id) return true;
        }
        return false;
    },
    constructMessagePage: function (message, type) {
        let color;
        let title;
        if (type === 0) {
            color = "#00ff00";
            title = lang.getText("message");
        } else if (type === 2) {
            color = "#ff0000";
            title = lang.getText("errro");
        } else {
            color = "#ffff00";
            title = lang.getText("warning");
        }
        let template = handlebars.compile(fs.readFileSync(path.join(__dirname, 'templates/message.html'), 'utf8'));
        return template({ message: message, color: color, title: title, back: lang.getText("backHome") })
    },
    checkUserInGuild: function (guilds, id) {
        let isInGuild = false;
        for (let i = 0; i < guilds.length; i++) {
            const elem = guilds[i];
            if (elem.id === id) {
                isInGuild = true;
            }
        }
        return isInGuild;
    },
    getMutualServers: function (guildList1, guildList2) {
        const idList = guildList2.map((x) => x.id);
        let mutual = [];

        for (let i = 0; i < guildList1.length; i++) {
            const elem = guildList1[i];
            if (idList.includes(elem.id)) {
                mutual.push(elem);
            }
        }

        return mutual;
    },
    getUserTheme: function (db, user_id, callback) {
        db.get(`SELECT theme_id FROM user_config WHERE user_id = "${user_id}"`, function (err, row) {
            if (err) {
                console.log(err);
            } else {
                if (row == null) {
                    db.run(`INSERT INTO user_config(user_id, theme_id) VALUES ("${user_id}", 0)`);
                    callback(lib.themes.getThemeById(0));
                } else if (row.theme_id == null) {
                    db.run(`UPDATE user_config SET theme_id = 0 WHERE user_id = "${user_id}"`);
                    callback(lib.themes.getThemeById(0));
                } else {
                    callback(lib.themes.getThemeById(row.theme_id));
                }
            }
        })
    }
}