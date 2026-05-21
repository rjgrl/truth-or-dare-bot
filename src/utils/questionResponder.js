const { config } = require('../config');
const { pickRandom } = require('./questions');
const { truthEmbed, dareEmbed, randomEmbed, errorEmbed } = require('./embeds');
const { buildQuestionButtons } = require('./buttons');
const { isOnCooldown, setCooldown } = require('./cooldowns');
const { addPoints } = require('./leaderboard');
const { getParty, getCurrentPlayer } = require('./party');

async function maybeAiFallback(type) {
  if (!config.enableAiFallback || !config.openaiApiKey) return null;
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: `Generate one short, fun ${type} question for a friend group (PG13). Reply with only the question text.`,
          },
        ],
        max_tokens: 80,
      }),
    });
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) return null;
    return {
      id: 0,
      question: text,
      category: 'Funny',
      rating: 'PG13',
      enabled: true,
      aiGenerated: true,
    };
  } catch {
    return null;
  }
}

async function sendQuestion(interaction, type, categorySlug) {
  const { onCooldown, remaining } = isOnCooldown(interaction.user.id);
  if (onCooldown && interaction.isChatInputCommand?.()) {
    return interaction.reply({
      embeds: [errorEmbed(`Slow down! Wait **${remaining}s** before the next question.`)],
      ephemeral: true,
    });
  }

  const guildId = interaction.guildId;
  const channelId = interaction.channelId;
  const options = { categorySlug: categorySlug || 'any', guildId, channelId };

  let item = pickRandom(type, options);
  if (!item) item = await maybeAiFallback(type);

  if (!item) {
    const msg = {
      embeds: [errorEmbed('No questions found for that filter. Try another category or reload data.')],
      ephemeral: true,
    };
    if (interaction.replied || interaction.deferred) return interaction.followUp(msg);
    return interaction.reply(msg);
  }

  if (interaction.isChatInputCommand?.()) {
    setCooldown(interaction.user.id);
  }

  const party = getParty(guildId);
  let requester = `<@${interaction.user.id}>`;
  if (party?.active) {
    const current = getCurrentPlayer(guildId);
    if (current) requester = `<@${current.id}> (party turn)`;
  }

  const payload = {
    question: item.question,
    category: item.category,
    rating: item.rating,
    requester,
    timerSeconds: type === 'dare' ? config.dareTimerSeconds : 0,
  };

  const embed =
    type === 'truth'
      ? truthEmbed(payload)
      : dareEmbed(payload);

  if (item.aiGenerated) embed.setFooter({ text: '✨ AI fallback question' });

  const components = buildQuestionButtons({
    type,
    categorySlug: categorySlug || 'any',
    guildId,
    userId: interaction.user.id,
  });

  const replyOptions = { embeds: [embed], components };

  if (interaction.replied && !interaction.deferred) {
    await interaction.followUp(replyOptions);
  } else if (interaction.deferred || (interaction.replied && interaction.deferred)) {
    await interaction.editReply(replyOptions);
  } else if (interaction.isButton?.() || interaction.isMessageComponent?.()) {
    await interaction.update(replyOptions);
  } else {
    await interaction.reply(replyOptions);
  }

  if (type === 'dare' && config.dareTimerSeconds > 0) {
    setTimeout(async () => {
      try {
        const channel = interaction.channel;
        if (channel) {
          await channel.send({
            embeds: [
              dareEmbed({
                ...payload,
                footer: `⏱️ Time's up! Did <@${interaction.user.id}> complete the dare?`,
              }),
            ],
          });
        }
      } catch {
        /* channel may be gone */
      }
    }, config.dareTimerSeconds * 1000);
  }
}

async function sendRandom(interaction, categorySlug) {
  const type = Math.random() < 0.5 ? 'truth' : 'dare';
  await sendQuestion(interaction, type, categorySlug);
}

module.exports = { sendQuestion, sendRandom };
