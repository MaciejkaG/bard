# Bard
Simple yet advanced Discord music bot with a single server support intended for private use.<br>
**This software is intended for private use only. We take no responsibility for how it is used and the consequences of doing so. You may not use it for commercial closed-source projects as it is against the GPL v3 license (see: `LICENSE`).**
## Installation
1. Either download and extract the code .zip file from GitHub or clone it any other way.
2. Add a redirect URI in Discord Developer Portal > Your bot > OAuth2 > General > Redirects. It should be in this format: ``YOUR_ADDRESS_AND_PORT_HERE/api/auth/redirect``
3. Create a .env file in the project's directory and use the .env template below to configure your bot.
4. Open a terminal in the project's directory.
5. Install required dependencies using the following command: ``npm install``
6. Run ``node .`` to start the bot.
## .env Template
```
# General configuration
DISCORD_TOKEN=YOUR_TOKEN_HERE
BOT_CLIENT_ID=YOUR_BOT_ID_HERE
GUILD_ID=YOUR_SERVER_ID_HERE
LANGUAGE=en_GB # Default: en_GB, pl_PL

DP_FORCE_YTDL_MOD="play-dl" # For compatibility purposes, don't modify

# Dashboard server configuration
PORT=5555 # You can put anything you want here, if you have access to port 80, use it as it is the main port used by web browsers
CLIENT_SECRET=YOUR_CLIENT_SECRET # You can get it from Discord Developer Portal > Your bot > OAuth2 > General
REDIRECT=http://localhost:5555 # You should put your server address without '/' at the end here
```
## The Ways of Customising Bard to Fit Your Needs
### Custom Dashboard Themes
Custom dashboard themes can be configured by editing the utils/themes.json file. Add a new JSON element to the themes list. You need to set it's name and colors. ``mainColor1`` is the first color of the background gradient, followed by ``mainColor2`` being the second color. ``altColor`` is the color of audio player elements e.g. the progress bar or volume bar.
### Custom languages
Custom languages can be added by duplicating the ``lang/en_GB.json`` file, setting it's name to `ja_JP.json` for example and translating all strings in that file to your language. Then you need to change `LANGUAGE` property in .env file to your file's name without .json extension (e.g. `ja_JP`).
## To-Do
- More dashboard features (e.g. loop mode button, queue control, lyrics tab).
- Websocket implementation (to make web player elements smoother and not lag the server with multiple hour long tracks).
- More Discord commands.
