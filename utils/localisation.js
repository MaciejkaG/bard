const path = require('node:path');
const fs = require('node:fs');

module.exports = {
    language: class {
        constructor(lang) {
            const languagesPath = path.join(__dirname, '../lang');
            if (fs.readdirSync(languagesPath).includes(`${lang}.json`)) {
                try {
                    this.allText = JSON.parse(fs.readFileSync(path.join(languagesPath, `${lang}.json`), 'utf8'));
                } catch {
                    throw new Error(`Couldn't open language file '${lang}.json'. Please make sure it uses UTF-8 encryption.`);
                }
            } else {
                throw new Error(`Language file '${lang}.json' doesn't exist. If you mischanged the LANGUAGE property in .env file, change it to en_GB for English (default).`);
            }
        }
        getText(key) {
            if (this.allText == null) {
                throw new Error(`Language class has been improperly configured. (Unknown localisation module error)`);
            } else {
                return this.allText[key];
            }
        }
    }
};