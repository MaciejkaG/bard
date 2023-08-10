require('dotenv').config()
const token = process.env.DISCORD_TOKEN
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const { Player } = require('discord-player');
const { SpotifyExtractor, SoundCloudExtractor, YouTubeExtractor } = require('@discord-player/extractor');

const lib = require("./lib");

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });
client.player = new Player(client);
client.language = new lib.localisation.language(process.env.LANGUAGE);

const express = require("express");

const app = express();

app.listen(process.env.PORT, () => {
  console.log(`Server listening on ${process.env.PORT}`);
});

(async () => {
    await client.player.extractors.load
    await client.player.extractors.loadDefault();
    client.player.events.on('playerStart', (queue, track) => {
        queue.metadata.channel.send(`${client.language.getText("startedPlaying")}: \`\`${track.title}\`\` @ ${track.source}`);
    });
})();

client.commands = new Collection();

const foldersPath = path.join(__dirname, 'cmd');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
});

client.once(Events.ClientReady, c => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.login(token);