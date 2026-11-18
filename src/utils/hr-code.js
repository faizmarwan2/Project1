const db = require('../db');

module.exports = function nextHrCode() {
  const { seq } = db.prepare('UPDATE hr_code_sequence SET seq = seq + 1 WHERE id = 1 RETURNING seq').get();
  return `HR${String(seq).padStart(2, '0')}`;
};
