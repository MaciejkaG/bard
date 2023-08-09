const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Plays a song or adds it to the queue!')
        .setDescriptionLocalizations({
            pl: 'Puszcza piosenkę lub dodaje ją do kolejki!',
        })
        .setDMPermission(false)
        .addStringOption(option =>
			option
				.setName('query')
                .setNameLocalizations({
                    pl: 'zapytanie',
                })
				.setDescription('Query to search')
                .setDescriptionLocalizations({
                    pl: 'Zapytanie do wyszukania',
                })
                .setRequired(true)),
    async execute(interaction) {
        const channel = interaction.member.voice.channel;
        if (!channel) return interaction.reply(interaction.client.language.getText("notInVoice"));
        const query = interaction.options.getString('query', true);

        await interaction.deferReply();

        try {
            const { track } = await interaction.client.player.play(channel, query, {
                nodeOptions: {
                    metadata: interaction
                }
            });
            return interaction.followUp(`${interaction.client.language.getText("trackAddedToQueue")}: **${track.title}**`);
        } catch (e) {
            return interaction.followUp(`${interaction.client.language.getText("somethingWentWrong")}: ${e}`);
        }
    },
};