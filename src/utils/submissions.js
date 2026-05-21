const { readJson, updateJson } = require('./storage');

function generateId() {
  return `sub_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function addSubmission({ userId, guildId, type, question, category, rating }) {
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
  updateJson('submissions.json', { pending: [], approved: [], rejected: [] }, (data) => {
    data.pending.push(entry);
    return data;
  });
  return entry;
}

function getPending(guildId) {
  const data = readJson('submissions.json', { pending: [], approved: [], rejected: [] });
  return data.pending.filter((s) => s.guildId === guildId);
}

function vote(submissionId, voteType) {
  let result = null;
  updateJson('submissions.json', { pending: [], approved: [], rejected: [] }, (data) => {
    const sub = data.pending.find((s) => s.id === submissionId);
    if (!sub) return data;
    if (voteType === 'up') sub.votes.up += 1;
    else sub.votes.down += 1;
    result = sub;
    return data;
  });
  return result;
}

function approveSubmission(submissionId) {
  let approved = null;
  updateJson('submissions.json', { pending: [], approved: [], rejected: [] }, (data) => {
    const idx = data.pending.findIndex((s) => s.id === submissionId);
    if (idx === -1) return data;
    const [sub] = data.pending.splice(idx, 1);
    sub.status = 'approved';
    data.approved.push(sub);
    approved = sub;
    return data;
  });
  return approved;
}

function rejectSubmission(submissionId) {
  updateJson('submissions.json', { pending: [], approved: [], rejected: [] }, (data) => {
    const idx = data.pending.findIndex((s) => s.id === submissionId);
    if (idx === -1) return data;
    const [sub] = data.pending.splice(idx, 1);
    sub.status = 'rejected';
    data.rejected.push(sub);
    return data;
  });
}

module.exports = { addSubmission, getPending, vote, approveSubmission, rejectSubmission };
