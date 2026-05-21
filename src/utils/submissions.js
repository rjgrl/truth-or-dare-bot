const { query } = require('./db');

function generateId() {
  return `sub_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function rowToSubmission(row) {
  return {
    id: row.id,
    userId: row.user_id,
    guildId: row.guild_id,
    type: row.type,
    question: row.question,
    category: row.category,
    rating: row.rating,
    status: row.status,
    votes: { up: row.votes_up, down: row.votes_down },
    createdAt: Number(row.created_at),
  };
}

async function addSubmission({ userId, guildId, type, question, category, rating }) {
  const entry = {
    id: generateId(),
    userId,
    guildId,
    type,
    question,
    category,
    rating: rating || 'PG13',
    status: 'pending',
    votes: { up: 0, down: 0 },
    createdAt: Date.now(),
  };
  await query(
    `INSERT INTO submissions (
      id, user_id, guild_id, type, question, category, rating, status,
      votes_up, votes_down, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', 0, 0, $8)`,
    [
      entry.id,
      entry.userId,
      entry.guildId,
      entry.type,
      entry.question,
      entry.category,
      entry.rating,
      entry.createdAt,
    ]
  );
  return entry;
}

async function getPending(guildId) {
  const { rows } = await query(
    `SELECT * FROM submissions WHERE guild_id = $1 AND status = 'pending' ORDER BY created_at ASC`,
    [guildId]
  );
  return rows.map(rowToSubmission);
}

async function vote(submissionId, voteType) {
  const sql =
    voteType === 'up'
      ? `UPDATE submissions SET votes_up = votes_up + 1
         WHERE id = $1 AND status = 'pending' RETURNING *`
      : `UPDATE submissions SET votes_down = votes_down + 1
         WHERE id = $1 AND status = 'pending' RETURNING *`;
  const { rows } = await query(sql, [submissionId]);
  return rows[0] ? rowToSubmission(rows[0]) : null;
}

async function approveSubmission(submissionId) {
  const { rows } = await query(
    `UPDATE submissions SET status = 'approved'
     WHERE id = $1 AND status = 'pending'
     RETURNING *`,
    [submissionId]
  );
  return rows[0] ? rowToSubmission(rows[0]) : null;
}

async function rejectSubmission(submissionId) {
  await query(
    `UPDATE submissions SET status = 'rejected'
     WHERE id = $1 AND status = 'pending'`,
    [submissionId]
  );
}

module.exports = { addSubmission, getPending, vote, approveSubmission, rejectSubmission };
