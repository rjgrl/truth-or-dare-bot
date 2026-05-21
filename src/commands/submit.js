const { SlashCommandBuilder } = require('discord.js');
const { categoryChoices, ratingChoices } = require('../utils/commandOptions');
const { addSubmission } = require('../utils/submissions');
const { submissionEmbed } = require('../utils/embeds');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { PREFIX } = require('../utils/buttons');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('submit')
    .setDescription('Submit a truth or dare for the approval queue')
    .addStringOption((o) =>
      o.setName('type').setDescription('Truth or dare').setRequired(true).addChoices(
        { name: 'Truth', value: 'truth' },
        { name: 'Dare', value: 'dare' }
      )
    )
    .addStringOption((o) => o.setName('question').setDescription('Your question').setRequired(true))
    .addStringOption((o) =>
      o.setName('category').setDescription('Category').setRequired(true).addChoices(...categoryChoices)
    )
    .addStringOption((o) =>
      o
        .setName('rating')
        .setDescription('Content rating')
        .setRequired(false)
        .addChoices(...ratingChoices)
    ),
  async execute(interaction) {
    const type = interaction.options.getString('type');
    const question = interaction.options.getString('question');
    const categorySlug = interaction.options.getString('category');
    const rating = interaction.options.getString('rating') || 'PG13';
    const { getCategoryBySlug } = require('../config');
    const cat = getCategoryBySlug(categorySlug);

    const entry = addSubmission({
      userId: interaction.user.id,
      guildId: interaction.guildId,
      type,
      question,
      category: cat?.name || categorySlug,
      rating,
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`${PREFIX}:vote:${entry.id}:up`)
        .setLabel('Approve vibe')
        .setStyle(ButtonStyle.Success)
        .setEmoji('👍'),
      new ButtonBuilder()
        .setCustomId(`${PREFIX}:vote:${entry.id}:down`)
        .setLabel('Not for us')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('👎')
    );

    await interaction.reply({
      embeds: [submissionEmbed({ ...entry, type, category: cat?.name }, 'pending — awaiting votes')],
      components: [row],
    });
  },
};
