const { SlashCommandBuilder } = require('discord.js');
const { getWheelPunishments } = require('../utils/questions');
const { wheelEmbed, errorEmbed } = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('wheel')
    .setDescription('Spin the punishment wheel for a random consequence'),
  async execute(interaction) {
    const list = getWheelPunishments();
    if (!list.length) {
      return interaction.reply({
        embeds: [errorEmbed('Punishment wheel is empty. Check data/punishments.json.')],
      });
    }
    const punishment = list[Math.floor(Math.random() * list.length)];
    await interaction.reply({
      embeds: [wheelEmbed(punishment, interaction.user.username)],
    });
  },
};
