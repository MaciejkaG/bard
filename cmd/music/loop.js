const { SlashCommandBuilder } = require('discord.js');
const { useQueue } = require("discord-player");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('Changes loop mode')
        .setDescriptionLocalizations({
            pl: 'Zmienia tryb pętli',
        })
        .setDMPermission(false)
        .addIntegerOption(option =>
            option.setName('mode')
                .setNameLocalizations({
                    pl: 'tryb',
                })
                .setDescription('Loop mode')
                .setDescriptionLocalizations({
                    pl: 'Tryb pętli',
                })
                .setRequired(true)
                .addChoices(
                    { name: 'Off', value: 0 },
                    { name: 'Track', value: 1 },
                    { name: 'Queue', value: 2 },
                )),
    async execute(interaction) {
        const mode = interaction.options.getInteger('mode');
        const channel = interaction.member.voice.channel;
        const queue = useQueue(interaction.guild.id);
        if (channel !== queue.channel) return interaction.reply(interaction.client.language.getText("notInVoice"));
        await interaction.deferReply();
        queue.setRepeatMode(mode);
        return interaction.followUp(`${interaction.client.language.getText("loopModeSet")}: \`\`${mode}\`\``);
    },
};