const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { logger } = require('./logger');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');

const DEFAULT_DAILY_CHALLENGES = [
  'Answer two truths and complete one dare before midnight.',
  'Compliment three people in the server today.',
  'Win one game with a friend from this server.',
  'Share your funniest meme of the day.',
  'Do a 30-second voice impression in VC.',
  'Post a throwback photo or story.',
  'Try a dare from the Extreme category.',
  'Start a mini party with /party start.',
  'Submit a question for the group with /submit.',
  'Spin the punishment wheel once.',
];

let pool = null;

function useSsl(connectionString) {
  if (!connectionString) return false;
  return !/localhost|127\.0\.0\.1/i.test(connectionString);
}

function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set — add your Supabase PostgreSQL connection string to .env');
  }
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: useSsl(process.env.DATABASE_URL) ? { rejectUnauthorized: false } : false,
    });
    pool.on('error', (err) => {
      logger.error('PostgreSQL pool error:', err.message);
    });
  }
  return pool;
}

async function query(text, params) {
  return getPool().query(text, params);
}

async function initSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS leaderboard_entries (
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      points INTEGER NOT NULL DEFAULT 0,
      completed INTEGER NOT NULL DEFAULT 0,
      skipped INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (guild_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      type TEXT NOT NULL,
      question TEXT NOT NULL,
      category TEXT NOT NULL,
      rating TEXT NOT NULL DEFAULT 'PG13',
      status TEXT NOT NULL DEFAULT 'pending',
      votes_up INTEGER NOT NULL DEFAULT 0,
      votes_down INTEGER NOT NULL DEFAULT 0,
      created_at BIGINT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS submissions_guild_status_idx
      ON submissions (guild_id, status);

    CREATE TABLE IF NOT EXISTS party_sessions (
      guild_id TEXT PRIMARY KEY,
      party JSONB NOT NULL,
      active BOOLEAN NOT NULL DEFAULT false,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS daily_challenges (
      position INTEGER PRIMARY KEY,
      challenge TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS guild_settings (
      guild_id TEXT PRIMARY KEY,
      nsfw_enabled BOOLEAN NOT NULL DEFAULT false,
      nsfw_channels JSONB NOT NULL DEFAULT '[]'::jsonb,
      party_max_players INTEGER
    );

    CREATE TABLE IF NOT EXISTS recent_questions (
      guild_id TEXT PRIMARY KEY,
      truth_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
      dare_ids JSONB NOT NULL DEFAULT '[]'::jsonb
    );
  `);
}

function readJsonFile(filename, defaultValue) {
  const filePath = path.join(DATA_DIR, filename);
  try {
    if (!fs.existsSync(filePath)) return defaultValue;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return defaultValue;
  }
}

async function seedDailyChallenges() {
  const { rows } = await query('SELECT COUNT(*)::int AS count FROM daily_challenges');
  if (rows[0].count > 0) return;

  let challenges = DEFAULT_DAILY_CHALLENGES;
  const fromFile = readJsonFile('daily-challenges.json', { challenges: [] }).challenges;
  if (fromFile?.length) challenges = fromFile;

  for (let i = 0; i < challenges.length; i++) {
    await query(
      'INSERT INTO daily_challenges (position, challenge) VALUES ($1, $2) ON CONFLICT (position) DO NOTHING',
      [i, challenges[i]]
    );
  }
  logger.info(`Seeded ${challenges.length} daily challenge(s)`);
}

async function migrateJsonRuntimeData() {
  const leaderboard = readJsonFile('leaderboard.json', {});
  for (const [guildId, users] of Object.entries(leaderboard)) {
    for (const [userId, stats] of Object.entries(users || {})) {
      await query(
        `INSERT INTO leaderboard_entries (guild_id, user_id, points, completed, skipped)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (guild_id, user_id) DO NOTHING`,
        [guildId, userId, stats.points || 0, stats.completed || 0, stats.skipped || 0]
      );
    }
  }

  const submissions = readJsonFile('submissions.json', { pending: [], approved: [], rejected: [] });
  for (const status of ['pending', 'approved', 'rejected']) {
    for (const sub of submissions[status] || []) {
      await query(
        `INSERT INTO submissions (
          id, user_id, guild_id, type, question, category, rating, status,
          votes_up, votes_down, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO NOTHING`,
        [
          sub.id,
          sub.userId,
          sub.guildId,
          sub.type,
          sub.question,
          sub.category,
          sub.rating || 'PG13',
          sub.status || status,
          sub.votes?.up || 0,
          sub.votes?.down || 0,
          sub.createdAt || Date.now(),
        ]
      );
    }
  }

  const parties = readJsonFile('party-sessions.json', {});
  for (const [guildId, party] of Object.entries(parties)) {
    await query(
      `INSERT INTO party_sessions (guild_id, party, active)
       VALUES ($1, $2::jsonb, $3)
       ON CONFLICT (guild_id) DO NOTHING`,
      [guildId, JSON.stringify(party), !!party.active]
    );
  }

  const settings = readJsonFile('settings.json', {});
  for (const [guildId, guild] of Object.entries(settings)) {
    await query(
      `INSERT INTO guild_settings (guild_id, nsfw_enabled, nsfw_channels, party_max_players)
       VALUES ($1, $2, $3::jsonb, $4)
       ON CONFLICT (guild_id) DO NOTHING`,
      [
        guildId,
        !!guild.nsfwEnabled,
        JSON.stringify(guild.nsfwChannels || []),
        guild.partyMaxPlayers ?? null,
      ]
    );
  }

  const recent = readJsonFile('recent-questions.json', {});
  for (const [guildId, lists] of Object.entries(recent)) {
    await query(
      `INSERT INTO recent_questions (guild_id, truth_ids, dare_ids)
       VALUES ($1, $2::jsonb, $3::jsonb)
       ON CONFLICT (guild_id) DO NOTHING`,
      [guildId, JSON.stringify(lists.truth || []), JSON.stringify(lists.dare || [])]
    );
  }
}

async function initDatabase() {
  getPool();
  await initSchema();
  await seedDailyChallenges();
  await migrateJsonRuntimeData();
  logger.success('PostgreSQL ready');
}

module.exports = { getPool, query, initDatabase };
