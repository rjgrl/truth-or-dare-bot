const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { categoryChoices, ratingChoices } = require('../utils/commandOptions');
const { isAdmin } = require('../utils/permissions');
const { addQuestion, removeQuestion, reloadQuestions, getStats } = require('../utils/questions');
const { getCategoryBySlug } = require('../config');
const { errorEmbed, successEmbed } = require('../utils/embeds');
const { approveSubmission, rejectSubmission, getPending } = require('../utils/submissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Admin tools for managing questions (Manage Server required)')
    .addSubcommand((sub) =>
      sub
        .setName('addtruth')
        .setDescription('Add a new truth question')
        .addStringOption((o) => o.setName('question').setDescription('Question text').setRequired(true))
        .addStringOption((o) =>
          o.setName('category').setDescription('Category').setRequired(true).addChoices(...categoryChoices)
        )
        .addStringOption((o) =>
          o.setName('rating').setDescription('Rating').setRequired(false).addChoices(...ratingChoices)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('adddare')
        .setDescription('Add a new dare')
        .addStringOption((o) => o.setName('question').setDescription('Dare text').setRequired(true))
        .addStringOption((o) =>
          o.setName('category').setDescription('Category').setRequired(true).addChoices(...categoryChoices)
        )
        .addStringOption((o) =>
          o.setName('rating').setDescription('Rating').setRequired(false).addChoices(...ratingChoices)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('remove')
        .setDescription('Remove a question by ID')
        .addIntegerOption((o) => o.setName('id').setDescription('Question ID').setRequired(true))
    )
    .addSubcommand((sub) => sub.setName('reload').setDescription('Reload all question JSON files from disk'))
    .addSubcommand((sub) =>
      sub
        .setName('approve')
        .setDescription('Approve a user submission')
        .addStringOption((o) => o.setName('submission_id').setDescription('Submission ID').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('reject')
        .setDescription('Reject a user submission')
        .addStringOption((o) => o.setName('submission_id').setDescription('Submission ID').setRequired(true))
    )
    .addSubcommand((sub) => sub.setName('queue').setDescription('View pending submissions')),
  async execute(interaction) {
    if (!isAdmin(interaction.member, interaction.user.id)) {
      return interaction.reply({
        embeds: [errorEmbed('You need **Manage Server** or be a configured admin to use this.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    const sub = interaction.options.getSubcommand();

    if (sub === 'addtruth' || sub === 'adddare') {
      const type = sub === 'addtruth' ? 'truth' : 'dare';
      const question = interaction.options.getString('question');
      const slug = interaction.options.getString('category');
      const rating = interaction.options.getString('rating') || 'PG13';
      const cat = getCategoryBySlug(slug);
      const entry = addQuestion(type, { question, category: cat?.name || slug, rating });
      return interaction.reply({
        embeds: [successEmbed('Added!', `**${type}** #${entry.id} saved to \`${slug}.json\``)],
      });
    }

    if (sub === 'remove') {
      const id = interaction.options.getInteger('id');
      const ok = removeQuestion(id);
      return interaction.reply({
        embeds: [
          ok ? successEmbed('Removed', `Question #${id} deleted.`) : errorEmbed(`No question with ID ${id}.`),
        ],
      });
    }

    if (sub === 'reload') {
      const counts = reloadQuestions();
      return interaction.reply({
        embeds: [
          successEmbed('Reloaded', `**${counts.truths}** truths · **${counts.dares}** dares loaded from disk.`),
        ],
      });
    }

    if (sub === 'approve') {
      const id = interaction.options.getString('submission_id');
      const subEntry = approveSubmission(id);
      if (!subEntry) {
        return interaction.reply({ embeds: [errorEmbed('Submission not found.')], flags: MessageFlags.Ephemeral });
      }
      addQuestion(subEntry.type, {
        question: subEntry.question,
        category: subEntry.category,
        rating: subEntry.rating || 'PG13',
      });
      return interaction.reply({
        embeds: [successEmbed('Approved', `Added to ${subEntry.type} library.`)],
      });
    }

    if (sub === 'reject') {
      const id = interaction.options.getString('submission_id');
      rejectSubmission(id);
      return interaction.reply({ embeds: [successEmbed('Rejected', 'Submission removed from queue.')] });
    }

    if (sub === 'queue') {
      const pending = getPending(interaction.guildId);
      const list =
        pending.length > 0
          ? pending.map((p) => `\`${p.id}\` — **${p.type}** (${p.category}): ${p.question.slice(0, 80)}…`).join('\n')
          : '_Queue is empty_';
      return interaction.reply({
        embeds: [successEmbed('Pending submissions', list)],
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
