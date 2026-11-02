'use strict';
// Optional lock for the pairing API. When PANEL_KEY is set, /api/code only answers requests that carry the same key
// in the "x-panel-key" header (the Cloudflare panel adds it). Anyone who finds the bot's own address cannot use it directly.
const { timingSafeEqual, createHash } = require('crypto');

const digest = (s) => createHash('sha256').update(String(s)).digest();
const same = (a, b) => timingSafeEqual(digest(a), digest(b));

function panelKeyOk(req, key = process.env.PANEL_KEY) {
    if (!key) return true; // no key configured = open, exactly as before
    const given = typeof req.get === 'function' ? req.get('x-panel-key') : (req.headers || {})['x-panel-key'];
    return same(given || '', key);
}

module.exports = { panelKeyOk };
