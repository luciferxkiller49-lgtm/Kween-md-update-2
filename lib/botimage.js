'use strict';
// The bot's default picture (menu, connect message, pairing page, .owner) is the file assets/owner-dp.jpeg.
// A user's own custom image link (set with .botimage) still wins; the two old catbox defaults count as "not customised".
const fs = require('fs');
const path = require('path');

const LOCAL = path.join(__dirname, '..', 'assets', 'owner-dp.jpeg');
const OLD_DEFAULTS = ['https://files.catbox.moe/33a8lk.jpg', 'https://files.catbox.moe/15j4gb.jpg'];

const isHttp = (v) => typeof v === 'string' && /^https?:\/\//i.test(v.trim());
const defaultImage = () => (fs.existsSync(LOCAL) ? LOCAL : OLD_DEFAULTS[1]);
// Returns the image to send: the user's own link if they set one, otherwise the bundled picture.
const pick = (v) => (isHttp(v) && !OLD_DEFAULTS.includes(v.trim()) ? v.trim() : defaultImage());

module.exports = { LOCAL, OLD_DEFAULTS, isHttp, defaultImage, pick };

// One-time reset: numbers that saved settings earlier may still point to an old picture (or a link chosen before this
// update). Version 2 means "already on the new picture"; after that a picture chosen with .botimage is kept.
function migrateImages(cfg, defaults) {
    if (cfg.IMAGE_VERSION === '2') return cfg;
    return { ...cfg, BOT_IMAGE: defaults.BOT_IMAGE, CONNECT_MSG_IMAGE: defaults.CONNECT_MSG_IMAGE, IMAGE_VERSION: '2' };
}
module.exports.migrateImages = migrateImages;
