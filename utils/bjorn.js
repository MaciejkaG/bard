const { HTTPError } = require("discord.js");
const fetch = require("node-fetch");

const apiEndpoint = "https://discord.com/api/v10";
const userAgent = "Bjorn by Bard (https://github.com/MaciejkaG/Bard)";

module.exports = {
    Client: class {
        constructor(clientId, clientSecret, redirectUri) {
            this.clientId = clientId;
            this.clientSecret = clientSecret;
            this.redirectUri = redirectUri;
        }
        getAccessToken(code) {
            return new Promise((resolve, reject) => {
                var data = new URLSearchParams({
                    client_id: this.clientId,
                    client_secret: this.clientSecret,
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: `${this.redirectUri}`
                }).toString();

                fetch('https://discord.com/api/oauth2/token', {
                    method: 'post',
                    body: data,
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': userAgent }
                })
                    .then(response => response.json())
                    .then(jsonRes => {
                        if (jsonRes.error === undefined) {
                            resolve(jsonRes);
                        } else {
                            reject(jsonRes.error);
                        }
                    })
                    .catch(err => reject(err));
            });
        }
        getUser(accessToken) {
            return new Promise((resolve, reject) => {
                fetch(`${apiEndpoint}/oauth2/@me`, {
                    method: 'get',
                    headers: { 'Authorization': `Bearer ${accessToken}`, 'User-Agent': userAgent }
                })
                    .then(response => { 
                        if (response.status!==200) {
                            reject(new HTTPError(response.status));
                        }
                        return response.json();
                    })
                    .then(res => resolve(res.user))
                    .catch(err => reject(err));
            });
        }
        getUserGuilds(accessToken) {
            return new Promise((resolve, reject) => {
                fetch(`${apiEndpoint}/users/@me/guilds`, {
                    method: 'get',
                    headers: { 'Authorization': `Bearer ${accessToken}`, 'User-Agent': userAgent }
                })
                    .then(response => response.json())
                    .then(res => resolve(res))
                    .catch(err => reject(err));
            });
        }
    }
};