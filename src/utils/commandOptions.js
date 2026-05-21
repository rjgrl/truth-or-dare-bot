const { CATEGORIES, RATINGS } = require('../config');

const categoryChoices = CATEGORIES.map((c) => ({ name: `${c.emoji} ${c.name}`, value: c.slug }));

const ratingChoices = RATINGS.map((r) => ({ name: r, value: r }));

module.exports = { categoryChoices, ratingChoices };
