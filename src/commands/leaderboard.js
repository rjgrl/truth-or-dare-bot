const { SlashCommandBuilder } = require('discord.js');
const { leaderboardEmbed } = require('../utils/embeds');
const { getTopPlayers } = require('../utils/leaderboard');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View the server Truth or Dare leaderboard'),
  async execute(interaction) {
    const entries = await getTopPlayers(interaction.guildId);
    await interaction.reply({
      embeds: [leaderboardEmbed(entries, interaction.guild?.name ?? 'Server')],
    });
  },
};
