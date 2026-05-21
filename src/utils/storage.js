const fs = require('fs');
const path = require('path');
const { logger } = require('./logger');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getFilePath(filename) {
  ensureDataDir();
  return path.join(DATA_DIR, filename);
}

function readJson(filename, defaultValue = {}) {
  const filePath = getFilePath(filename);
  try {
    if (!fs.existsSync(filePath)) {
      writeJson(filename, defaultValue);
      return structuredClone(defaultValue);
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    logger.error(`Failed to read ${filename}:`, err.message);
    return structuredClone(defaultValue);
  }
}

function writeJson(filename, data) {
  const filePath = getFilePath(filename);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    logger.error(`Failed to write ${filename}:`, err.message);
    return false;
  }
}

function updateJson(filename, defaultValue, updater) {
  const current = readJson(filename, defaultValue);
  const next = updater(current);
  writeJson(filename, next);
  return next;
}

module.exports = { DATA_DIR, readJson, writeJson, updateJson, getFilePath, ensureDataDir };
