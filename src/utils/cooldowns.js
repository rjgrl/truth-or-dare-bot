const { config } = require('../config');

/** @type {Map<string, number>} */
const cooldowns = new Map();

function getCooldownKey(userId, command = 'question') {
  return `${userId}:${command}`;
}

function isOnCooldown(userId, command = 'question') {
  const key = getCooldownKey(userId, command);
  const expires = cooldowns.get(key);
  if (!expires) return { onCooldown: false, remaining: 0 };
  const remaining = Math.ceil((expires - Date.now()) / 1000);
  if (remaining <= 0) {
    cooldowns.delete(key);
    return { onCooldown: false, remaining: 0 };
  }
  return { onCooldown: true, remaining };
}

function setCooldown(userId, command = 'question', seconds = config.cooldownSeconds) {
  const key = getCooldownKey(userId, command);
  cooldowns.set(key, Date.now() + seconds * 1000);
}

module.exports = { isOnCooldown, setCooldown };
