const { HTTPError } = require("discord.js");
const fetch = require("node-fetch");
const htmlParser = require('node-html-parser');

const apiEndpoint = "https://api.genius.com";
const userAgent = "Karaokee by Bard (https://github.com/MaciejkaG/Bard)";

module.exports = {
    Client: class {
        constructor(accessToken) {
            this.accessToken = accessToken;
        }
        search(query) {
            return new Promise((resolve, reject) => {
                fetch(`${apiEndpoint}/search?` + new URLSearchParams({
                    q: query,
                }),
                {
                    method: 'get',
                    headers: { 'Authorization': `Bearer ${this.accessToken}`, 'User-Agent': userAgent }
                })
                    .then(response => {
                        if (response.status !== 200) {
                            reject(HTTPError(response.status));
                        }
                        return response.json();
                    })
                    .then(res => {
                        let results = res.response.hits;
                        let songs = [];

                        for (let i = 0; i < results.length; i++) {
                            var elem = results[i];
                            
                            if (elem.type==="song") {
                                songs.push(elem.result);
                            }
                        }

                        resolve(songs);
                    })
                    .catch(err => reject(err));
            });
        }
        getSong(songId) {
            return new Promise((resolve, reject) => {
                fetch(`${apiEndpoint}/songs/${songId}?text_format=plain`, {
                    method: 'get',
                    headers: { 'Authorization': `Bearer ${this.accessToken}`, 'User-Agent': userAgent }
                })
                    .then(response => response.json())
                    .then(res => resolve(res))
                    .catch(err => reject(err));
            });
        }
        getLyrics(songUrl) {
            return new Promise((resolve, reject) => {
                fetch(songUrl, {
                    method: 'get',
                    headers: { 'Authorization': `Bearer ${this.accessToken}`, 'User-Agent': userAgent }
                })
                    .then(response => {
                        if (response.status !== 200) {
                            reject(HTTPError(response.status));
                        }
                        return response.text();
                    })
                    .then(rawHtml => {
                        let root = htmlParser.parse(rawHtml);

                        const lyricsRoot = root.getElementById("lyrics-root");

                        const lyrics = lyricsRoot
                            .querySelectorAll("[data-lyrics-container='true']")
                            .map((x) => {
                                x.querySelectorAll("br").forEach((y) => {
                                    y.replaceWith(new htmlParser.TextNode("\n"));
                                });
                                return x.text;
                            })
                            .join("\n")
                            .trim();

                        resolve(lyrics);
                    })
                    .catch(err => reject(err));
            });
        }
    }
};