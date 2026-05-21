const { PermissionFlagsBits } = require('discord.js');
const { config } = require('../config');

function isAdmin(member, userId) {
  if (config.adminUserIds.includes(userId)) return true;
  if (!member) return false;
  return member.permissions.has(PermissionFlagsBits.Administrator)
    || member.permissions.has(PermissionFlagsBits.ManageGuild);
}

module.exports = { isAdmin };
