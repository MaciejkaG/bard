const { SlashCommandBuilder } = require('discord.js');
const { useQueue } = require("discord-player");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skips a song from queue')
        .setDescriptionLocalizations({
            pl: 'Pomija piosenkę z kolejki',
        })
        .setDMPermission(false),
    async execute(interaction) {
        const queue = useQueue(interaction.guild.id);
        const channel = interaction.member.voice.channel;
        if (channel!==queue.channel) return interaction.reply(interaction.client.language.getText("notInVoice"));
        await interaction.deferReply();
        const skippingTitle = queue.currentTrack.title;
        queue.node.skip();
        return interaction.followUp(`${interaction.client.language.getText("trackSkipped")}: \`\`${skippingTitle}\`\``);
    },
};