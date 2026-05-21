const { SlashCommandBuilder } = require('discord.js');
const { getNhie } = require('../utils/questions');
const { nhieEmbed, errorEmbed } = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nhie')
    .setDescription('Never Have I Ever — random statement for the group'),
  async execute(interaction) {
    const item = await getNhie({
      guildId: interaction.guildId,
      channelId: interaction.channelId,
    });
    if (!item) {
      return interaction.reply({
        embeds: [errorEmbed('No Never Have I Ever statements loaded. Run `npm run generate-data`.')],
      });
    }
    await interaction.reply({
      embeds: [nhieEmbed(item.statement || item.question, interaction.user.username)],
      content: 'React with 👍 if you **have**, 👎 if you **haven\'t**!',
    });
    const msg = await interaction.fetchReply();
    await msg.react('👍').catch(() => {});
    await msg.react('👎').catch(() => {});
  },
};
