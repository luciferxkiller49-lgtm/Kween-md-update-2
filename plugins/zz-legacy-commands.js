// Loads last (zz-) so it can see every command already registered and never override one.
const { registerLegacy } = require('../lib/legacy');

for (const [file, category] of [['islamic', 'islamic'], ['fun', 'fun'], ['utility', 'utility']]) {
  try {
    const { added, skipped } = registerLegacy(require(`../legacy/${file}`), category, __filename);
    console.log(`➕ ${file}: ${added.length} commands added${skipped.length ? `, ${skipped.length} already existed (kept yours)` : ''}`);
  } catch (e) {
    console.log(`❌ legacy/${file} failed to load: ${e.message}`);
  }
}
