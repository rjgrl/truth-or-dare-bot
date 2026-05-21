const fs = require('fs');
const path = require('path');
const { config, getCategoryBySlug, RATINGS } = require('../config');
const { query } = require('./db');
const { logger } = require('./logger');

const TRUTHS_DIR = path.join(__dirname, '..', '..', 'data', 'truths');
const DARES_DIR = path.join(__dirname, '..', '..', 'data', 'dares');

let truthsCache = [];
let daresCache = [];
let nhieCache = [];

function loadJsonDir(dir) {
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  const items = [];
  for (const file of files) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
      const list = Array.isArray(data) ? data : data.questions || [];
      items.push(...list);
    } catch (err) {
      logger.warn(`Skipping invalid file ${file}:`, err.message);
    }
  }
  return items;
}

function reloadQuestions() {
  truthsCache = loadJsonDir(TRUTHS_DIR).filter((q) => q.enabled !== false);
  daresCache = loadJsonDir(DARES_DIR).filter((q) => q.enabled !== false);
  const nhiePath = path.join(__dirname, '..', '..', 'data', 'nhie.json');
  if (fs.existsSync(nhiePath)) {
    nhieCache = JSON.parse(fs.readFileSync(nhiePath, 'utf8')).filter((q) => q.enabled !== false);
  }
  logger.success(`Loaded ${truthsCache.length} truths, ${daresCache.length} dares, ${nhieCache.length} NHIE`);
  return { truths: truthsCache.length, dares: daresCache.length };
}

async function getRecent(guildId) {
  const { rows } = await query(
    'SELECT truth_ids, dare_ids FROM recent_questions WHERE guild_id = $1',
    [guildId]
  );
  if (!rows[0]) return { truth: [], dare: [] };
  return { truth: rows[0].truth_ids || [], dare: rows[0].dare_ids || [] };
}

async function pushRecent(guildId, type, questionId) {
  const recent = await getRecent(guildId);
  const pool = config.recentQuestionPool;
  const list = [...(recent[type] || []), questionId];
  const trimmed = list.length > pool ? list.slice(-pool) : list;
  const truthIds = type === 'truth' ? trimmed : recent.truth;
  const dareIds = type === 'dare' ? trimmed : recent.dare;
  await query(
    `INSERT INTO recent_questions (guild_id, truth_ids, dare_ids)
     VALUES ($1, $2::jsonb, $3::jsonb)
     ON CONFLICT (guild_id) DO UPDATE SET
       truth_ids = EXCLUDED.truth_ids,
       dare_ids = EXCLUDED.dare_ids`,
    [guildId, JSON.stringify(truthIds), JSON.stringify(dareIds)]
  );
}

const { getGuildSettings } = require('./settings');

async function filterByRating(questions, guildId, channelId) {
  const settings = await getGuildSettings(guildId);
  const channelNsfw = settings.nsfwChannels?.includes(channelId);
  const allowNsfw = settings.nsfwEnabled && channelNsfw;
  return questions.filter((q) => {
    if (q.rating === 'NSFW') return allowNsfw;
    if (q.rating === 'R') return allowNsfw || settings.allowR !== false;
    return true;
  });
}

async function filterPool(type, { categorySlug, guildId, channelId }) {
  const pool = type === 'truth' ? truthsCache : daresCache;
  let filtered = [...pool];
  if (categorySlug && categorySlug !== 'any') {
    const cat = getCategoryBySlug(categorySlug);
    if (cat) {
      filtered = filtered.filter((q) => q.category?.toLowerCase() === cat.name.toLowerCase());
    }
  }
  filtered = await filterByRating(filtered, guildId, channelId);
  const recent = (await getRecent(guildId))[type] || [];
  const fresh = filtered.filter((q) => !recent.includes(q.id));
  return fresh.length > 0 ? fresh : filtered;
}

async function pickRandom(type, options) {
  const pool = await filterPool(type, options);
  if (pool.length === 0) return null;
  const item = pool[Math.floor(Math.random() * pool.length)];
  await pushRecent(options.guildId, type, item.id);
  return item;
}

async function getNhie(options) {
  const pool = await filterByRating([...nhieCache], options.guildId, options.channelId);
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

async function getDailyChallenge() {
  const { rows } = await query('SELECT challenge FROM daily_challenges ORDER BY position ASC');
  if (!rows.length) return null;
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000
  );
  return { challenge: rows[dayOfYear % rows.length].challenge, day: dayOfYear };
}

function getWheelPunishments() {
  const punishmentsPath = path.join(__dirname, '..', '..', 'data', 'punishments.json');
  try {
    if (!fs.existsSync(punishmentsPath)) return [];
    const data = JSON.parse(fs.readFileSync(punishmentsPath, 'utf8'));
    return data.punishments || [];
  } catch {
    return [];
  }
}

function addQuestion(type, entry) {
  const dir = type === 'truth' ? TRUTHS_DIR : DARES_DIR;
  const slug = entry.category.toLowerCase().replace(/\s+/g, '-');
  const filePath = path.join(dir, `${slug}.json`);
  let list = [];
  if (fs.existsSync(filePath)) {
    list = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!Array.isArray(list)) list = list.questions || [];
  }
  const maxId = [...truthsCache, ...daresCache].reduce((m, q) => Math.max(m, q.id || 0), 0);
  const newEntry = {
    id: maxId + 1,
    question: entry.question,
    category: entry.category,
    rating: entry.rating || 'PG13',
    enabled: true,
  };
  list.push(newEntry);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(list, null, 2));
  reloadQuestions();
  return newEntry;
}

function removeQuestion(id) {
  for (const dir of [TRUTHS_DIR, DARES_DIR]) {
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
      const filePath = path.join(dir, file);
      let list = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (!Array.isArray(list)) list = list.questions || [];
      const idx = list.findIndex((q) => q.id === id);
      if (idx !== -1) {
        list.splice(idx, 1);
        fs.writeFileSync(filePath, JSON.stringify(list, null, 2));
        reloadQuestions();
        return true;
      }
    }
  }
  return false;
}

function getStats() {
  return {
    truths: truthsCache.length,
    dares: daresCache.length,
    categories: [...new Set([...truthsCache, ...daresCache].map((q) => q.category))],
  };
}

module.exports = {
  reloadQuestions,
  pickRandom,
  getNhie,
  getDailyChallenge,
  getWheelPunishments,
  addQuestion,
  removeQuestion,
  getStats,
  filterPool,
};
