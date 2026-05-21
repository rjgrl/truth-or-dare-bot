const fs = require('fs');
const path = require('path');
const { config, getCategoryBySlug, RATINGS } = require('../config');
const { readJson, updateJson } = require('./storage');
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

function getRecent(guildId) {
  const data = readJson('recent-questions.json', {});
  return data[guildId] || { truth: [], dare: [] };
}

function pushRecent(guildId, type, questionId) {
  updateJson('recent-questions.json', {}, (data) => {
    if (!data[guildId]) data[guildId] = { truth: [], dare: [] };
    const pool = config.recentQuestionPool;
    const list = data[guildId][type];
    list.push(questionId);
    if (list.length > pool) {
      data[guildId][type] = list.slice(-pool);
    }
    return data;
  });
}

const { getGuildSettings } = require('./settings');

function filterByRating(questions, guildId, channelId) {
  const settings = getGuildSettings(guildId);
  const channelNsfw = settings.nsfwChannels?.includes(channelId);
  const allowNsfw = settings.nsfwEnabled && channelNsfw;
  return questions.filter((q) => {
    if (q.rating === 'NSFW') return allowNsfw;
    if (q.rating === 'R') return allowNsfw || settings.allowR !== false;
    return true;
  });
}

function filterPool(type, { categorySlug, guildId, channelId }) {
  const pool = type === 'truth' ? truthsCache : daresCache;
  let filtered = [...pool];
  if (categorySlug && categorySlug !== 'any') {
    const cat = getCategoryBySlug(categorySlug);
    if (cat) {
      filtered = filtered.filter((q) => q.category?.toLowerCase() === cat.name.toLowerCase());
    }
  }
  filtered = filterByRating(filtered, guildId, channelId);
  const recent = getRecent(guildId)[type] || [];
  const fresh = filtered.filter((q) => !recent.includes(q.id));
  return fresh.length > 0 ? fresh : filtered;
}

function pickRandom(type, options) {
  const pool = filterPool(type, options);
  if (pool.length === 0) return null;
  const item = pool[Math.floor(Math.random() * pool.length)];
  pushRecent(options.guildId, type, item.id);
  return item;
}

function getNhie(options) {
  const pool = filterByRating([...nhieCache], options.guildId, options.channelId);
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

function getDailyChallenge() {
  const challenges = readJson('daily-challenges.json', { challenges: [] }).challenges || [];
  if (!challenges.length) return null;
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000
  );
  return { challenge: challenges[dayOfYear % challenges.length], day: dayOfYear };
}

function getWheelPunishments() {
  return readJson('punishments.json', { punishments: [] }).punishments || [];
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
