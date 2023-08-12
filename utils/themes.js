const path = require('node:path');
const fs = require('node:fs');

module.exports = {
    getThemeById: function(themeId) {
        try {
            return themesJSON()[themeId];
        } catch {
            return themesJSON()[0];
        }
    },
    themeList: function() {
        return themesJSON();
    }
};

function themesJSON() {
    if (fs.readdirSync(__dirname).includes(`themes.json`)) {
        try {
            return JSON.parse(fs.readFileSync(path.join(__dirname, `themes.json`), 'utf8')).themes;
        } catch {
            throw new Error(`Couldn't open themes file.`);
        }
    } else {
        throw new Error(`Themes file doesn't exist.`);
    }
}