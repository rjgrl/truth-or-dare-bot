const { SlashCommandBuilder } = require('discord.js');
const { categoriesEmbed } = require('../utils/embeds');
const { getStats } = require('../utils/questions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('categories')
    .setDescription('List all question categories'),
  async execute(interaction) {
    const stats = getStats();
    const embed = categoriesEmbed();
    embed.addFields({
      name: '📊 Library',
      value: `**${stats.truths}** truths · **${stats.dares}** dares`,
    });
    await interaction.reply({ embeds: [embed] });
  },
};
