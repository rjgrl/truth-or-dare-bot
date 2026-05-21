const { updateJson, readJson } = require('./storage');
const { config } = require('../config');

function getGuildSettings(guildId) {
  const all = readJson('settings.json', {});
  return all[guildId] || { nsfwChannels: [], nsfwEnabled: config.allowNsfwDefault };
}

function toggleNsfwChannel(guildId, channelId, enabled) {
  return updateJson('settings.json', {}, (data) => {
    if (!data[guildId]) data[guildId] = { nsfwChannels: [], nsfwEnabled: config.allowNsfwDefault };
    const channels = new Set(data[guildId].nsfwChannels || []);
    if (enabled) channels.add(channelId);
    else channels.delete(channelId);
    data[guildId].nsfwChannels = [...channels];
    return data;
  })[guildId];
}

function setNsfwEnabled(guildId, enabled) {
  return updateJson('settings.json', {}, (data) => {
    if (!data[guildId]) data[guildId] = { nsfwChannels: [], nsfwEnabled: config.allowNsfwDefault };
    data[guildId].nsfwEnabled = enabled;
    return data;
  })[guildId];
}

module.exports = { getGuildSettings, toggleNsfwChannel, setNsfwEnabled };
