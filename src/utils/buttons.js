const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const PREFIX = 'tod';

function buildQuestionButtons({ type, categorySlug, guildId, userId }) {
  const meta = `${guildId}:${userId}:${categorySlug || 'any'}`;
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`${PREFIX}:next:${type}:${meta}`)
        .setLabel('Next')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('➡️'),
      new ButtonBuilder()
        .setCustomId(`${PREFIX}:skip:${meta}`)
        .setLabel('Skip')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('⏭️'),
      new ButtonBuilder()
        .setCustomId(`${PREFIX}:random:${meta}`)
        .setLabel('Random')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🎲'),
      new ButtonBuilder()
        .setCustomId(`${PREFIX}:truth:${meta}`)
        .setLabel('Truth')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('💬'),
      new ButtonBuilder()
        .setCustomId(`${PREFIX}:dare:${meta}`)
        .setLabel('Dare')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('⚡')
    ),
  ];
}

function parseButtonId(customId) {
  const parts = customId.split(':');
  if (parts[0] !== PREFIX) return null;
  const action = parts[1];
  if (action === 'next') {
    return { action, type: parts[2], guildId: parts[3], userId: parts[4], categorySlug: parts[5] };
  }
  if (['skip', 'random', 'truth', 'dare'].includes(action)) {
    return { action, guildId: parts[2], userId: parts[3], categorySlug: parts[4] };
  }
  if (action === 'vote') {
    return { action, submissionId: parts[2], vote: parts[3] };
  }
  return null;
}

module.exports = { PREFIX, buildQuestionButtons, parseButtonId };
