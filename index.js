require('dotenv').config()
const clientId = process.env.BOT_CLIENT_ID;
const token = process.env.DISCORD_TOKEN
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const { Player } = require('discord-player');
const { REST, Routes } = require('discord.js');
const colors = require('colors');

const lib = require("./utils");
const dashboard = require("./dashboard");

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMembers] });
client.player = new Player(client);
client.language = new lib.localisation.language(process.env.LANGUAGE);

const commands = [];
const foldersPath = path.join(__dirname, 'cmd');
const commandFolders = fs.readdirSync(foldersPath);

client.commands = new Collection();
dashboard.main(client);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
            client.commands.set(command.data.name, command);
        } else {
            console.log(`${'[COMMANDS]'.magenta} ${'[WARNING]'.yellow} The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}
const rest = new REST().setToken(token);

(async () => {
    try {
        console.log(`${'[COMMANDS]'.magenta} Started refreshing ${commands.length} application (/) commands.`);

        const data = await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands },
        );

        console.log(`${'[COMMANDS]'.magenta} Successfully reloaded ${data.length} application (/) commands.`);

        await client.player.extractors.load
        await client.player.extractors.loadDefault();
        client.player.events.on('playerStart', (queue, track) => {
            queue.metadata.send(`${client.language.getText("startedPlaying")}: \`\`${track.title}\`\` @ ${track.source}`);
        });
    } catch (error) {
        console.error(error);
    }
})();

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.log(`${'[COMMANDS]'.magenta} ${'[WARNING]'.yellow} No command matching ${interaction.commandName} was found.`);
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
    console.log(`${'[BOT]'.blue} Logged in as ${c.user.tag}`);
    if (client.guilds.cache.size>10) {
        console.log(`${'[BOT]'.blue} ${'[WARNING]'.yellow} This instance of Bard is in more than 10 servers. Remember that the creator of this bot takes no responsibility for consequences of publicly hosting Bard.`)
    }
});

client.login(token);