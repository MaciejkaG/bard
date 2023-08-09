const { SlashCommandBuilder } = require('discord.js');
const { useQueue } = require("discord-player");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('volume')
        .setDescription('Changes music volume!')
        .setDescriptionLocalizations({
            pl: 'Zmienia głośność muzyki',
        })
        .setDMPermission(false)
        .addIntegerOption(option =>
            option
                .setName('volume')
                .setNameLocalizations({
                    pl: 'głośność',
                })
                .setDescription('Volume level in %')
                .setDescriptionLocalizations({
                    pl: 'Poziom głośności w %',
                })
                .setMaxValue(100)
                .setMinValue(1)
                .setRequired(true)),
    async execute(interaction) {
        const channel = interaction.member.voice.channel;
        if (!channel) return interaction.reply(interaction.client.language.getText("notInVoice"));
        const volume = interaction.options.getInteger('volume', true);
        await interaction.deferReply();
        const queue = useQueue(interaction.guild.id);
        queue.node.setVolume(volume);
        return interaction.followUp(`${interaction.client.language.getText("volumeChanged")} \`\`${volume}%\`\``);
    },
};