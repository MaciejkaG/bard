# simple-musicbot
Simple Discord music bot with a single server support intended for private use.<br>
**This software is intended for private use only. We take no responsibility for how it is used and the consequences of doing so. You may not use it for commercial closed-source projects as it is against the GPL v3 license (see: `LICENSE`).**
## Installation
1. Either download and extract the code .zip file from GitHub or clone it any other way.
2. Create a .env file in the project's directory and edit it for your needs. The file must include following variables: ``DISCORD_TOKEN`` - Your Discord bot's token, ``CLIENT_ID`` - Your Discord bot's ID, ``GUILD_ID`` - Your Discord server's ID (we currently support only one server and do not plan to change that), ``LANGUAGE`` - Language key of your choice. The default ones are `en_GB` and `pl_PL` but you can create your own language file in the `/lang` directory.
3. Open a terminal in the project's directory.
4. Install required dependencies and configure the bot using the following command: ``npm install``
5. Run ``node .`` to start the bot.
