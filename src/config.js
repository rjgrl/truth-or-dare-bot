require('dotenv').config();

const config = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID || null,
  adminUserIds: (process.env.ADMIN_USER_IDS || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean),
  cooldownSeconds: Number(process.env.COOLDOWN_SECONDS) || 8,
  recentQuestionPool: Number(process.env.RECENT_QUESTION_POOL) || 50,
  dareTimerSeconds: Number(process.env.DARE_TIMER_SECONDS) || 60,
  allowNsfwDefault: process.env.ALLOW_NSFW_DEFAULT === 'true',
  enableAiFallback: process.env.ENABLE_AI_FALLBACK === 'true',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  embedColor: parseInt(process.env.EMBED_COLOR || '5865F2', 16),
  partyMaxPlayers: Number(process.env.PARTY_MAX_PLAYERS) || 25,
};

const CATEGORIES = [
  { slug: 'funny', name: 'Funny', emoji: '😂' },
  { slug: 'spicy', name: 'Spicy', emoji: '🌶️' },
  { slug: 'relationship', name: 'Relationship', emoji: '💕' },
  { slug: 'gaming', name: 'Gaming', emoji: '🎮' },
  { slug: 'embarrassing', name: 'Embarrassing', emoji: '😳' },
  { slug: 'school', name: 'School', emoji: '📚' },
  { slug: 'dark-humor', name: 'Dark Humor', emoji: '💀' },
  { slug: 'couple', name: 'Couple', emoji: '💑' },
  { slug: 'party', name: 'Party', emoji: '🎉' },
  { slug: 'extreme', name: 'Extreme', emoji: '🔥' },
];

const RATINGS = ['PG', 'PG13', 'R', 'NSFW'];

function getCategoryBySlug(slug) {
  return CATEGORIES.find((c) => c.slug === slug || c.name.toLowerCase().replace(/\s+/g, '-') === slug);
}

function getCategoryByName(name) {
  return CATEGORIES.find((c) => c.name.toLowerCase() === name?.toLowerCase());
}

module.exports = { config, CATEGORIES, RATINGS, getCategoryBySlug, getCategoryByName };
