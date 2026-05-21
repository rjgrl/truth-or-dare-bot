const { SlashCommandBuilder } = require('discord.js');
const { getDailyChallenge } = require('../utils/questions');
const { dailyEmbed, errorEmbed } = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Get today\'s Truth or Dare daily challenge'),
  async execute(interaction) {
    const result = getDailyChallenge();
    if (!result) {
      return interaction.reply({
        embeds: [errorEmbed('Daily challenges are not configured yet.')],
      });
    }
    await interaction.reply({
      embeds: [dailyEmbed(result.challenge, result.day)],
    });
  },
};
