const { MessageFlags } = require('discord.js');
const { errorEmbed } = require('../utils/embeds');
const { parseButtonId } = require('../utils/buttons');
const { sendQuestion, sendRandom } = require('../utils/questionResponder');
const { addPoints } = require('../utils/leaderboard');
const { recordPartyAction } = require('../utils/party');
const { vote } = require('../utils/submissions');
const { logger } = require('../utils/logger');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    try {
      if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        await command.execute(interaction, client);
        return;
      }

      if (interaction.isButton()) {
        const parsed = parseButtonId(interaction.customId);
        if (!parsed) return;

        if (parsed.action === 'vote') {
          await vote(parsed.submissionId, parsed.vote);
          return interaction.reply({
            embeds: [errorEmbed('Vote recorded! Thanks for helping moderate submissions.')],
            flags: MessageFlags.Ephemeral,
          });
        }

        const categorySlug = parsed.categorySlug === 'any' ? undefined : parsed.categorySlug;

        if (parsed.action === 'skip') {
          await addPoints(interaction.guildId, interaction.user.id, { skipped: 1, points: 1 });
          if (interaction.guildId) {
            const partyResult = await recordPartyAction(
              interaction.guildId,
              interaction.user.id,
              'skipped'
            );
            if (partyResult?.error === 'not_your_turn') {
              return interaction.reply({
                embeds: [errorEmbed('Party mode: wait for your turn!')],
                flags: MessageFlags.Ephemeral,
              });
            }
          }
          await sendRandom(interaction, categorySlug);
          return;
        }

        if (parsed.action === 'random') {
          await sendRandom(interaction, categorySlug);
          return;
        }

        if (parsed.action === 'truth') {
          await sendQuestion(interaction, 'truth', categorySlug);
          return;
        }

        if (parsed.action === 'dare') {
          await sendQuestion(interaction, 'dare', categorySlug);
          return;
        }

        if (parsed.action === 'next') {
          await sendQuestion(interaction, parsed.type, categorySlug);
        }
      }
    } catch (err) {
      logger.error('Interaction error:', err);
      const payload = {
        embeds: [errorEmbed('Something went wrong. Try again in a moment!')],
        flags: MessageFlags.Ephemeral,
      };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(payload).catch(() => {});
      } else {
        await interaction.reply(payload).catch(() => {});
      }
    }
  },
};
