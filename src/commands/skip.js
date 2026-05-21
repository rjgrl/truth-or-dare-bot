const { SlashCommandBuilder } = require('discord.js');
const { sendRandom } = require('../utils/questionResponder');
const { addPoints } = require('../utils/leaderboard');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip the current question and get a new random one'),
  async execute(interaction) {
    await addPoints(interaction.guildId, interaction.user.id, { skipped: 1, points: 1 });
    await interaction.deferReply();
    await sendRandom(interaction, undefined);
  },
};
