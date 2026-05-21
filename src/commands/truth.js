const { SlashCommandBuilder } = require('discord.js');
const { categoryChoices } = require('../utils/commandOptions');
const { sendQuestion } = require('../utils/questionResponder');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('truth')
    .setDescription('Get a random truth question')
    .addStringOption((opt) =>
      opt
        .setName('category')
        .setDescription('Optional category filter')
        .setRequired(false)
        .addChoices(...categoryChoices)
    ),
  async execute(interaction) {
    const category = interaction.options.getString('category');
    await sendQuestion(interaction, 'truth', category);
  },
};
