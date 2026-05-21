const { SlashCommandBuilder } = require('discord.js');
const { categoryChoices } = require('../utils/commandOptions');
const { sendRandom } = require('../utils/questionResponder');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('random')
    .setDescription('Truth or dare? Let fate decide!')
    .addStringOption((opt) =>
      opt
        .setName('category')
        .setDescription('Optional category filter')
        .setRequired(false)
        .addChoices(...categoryChoices)
    ),
  async execute(interaction) {
    const category = interaction.options.getString('category');
    await sendRandom(interaction, category);
  },
};
