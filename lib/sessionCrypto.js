'use strict';
// Optional encryption for WhatsApp sessions stored in MongoDB.
// Set SESSION_ENC_KEY (any secret text of 16+ characters). Without it nothing changes (plain text, as before).
// Old plain-text sessions still load and are encrypted the next time they are saved.
const crypto = require('crypto');
const PREFIX = 'enc1:';

function keyFrom(env = process.env) {
    const k = env.SESSION_ENC_KEY;
    if (!k) return null;
    if (String(k).length < 16) { console.log('⚠️ SESSION_ENC_KEY is shorter than 16 characters and is being ignored.'); return null; }
    return crypto.createHash('sha256').update(String(k)).digest();
}

function protect(raw, number, env = process.env) {
    const key = keyFrom(env);
    if (!key) return raw;
    const iv = crypto.randomBytes(12);
    const c = crypto.createCipheriv('aes-256-gcm', key, iv);
    c.setAAD(Buffer.from(`creds:${number}`));
    const ct = Buffer.concat([c.update(String(raw), 'utf8'), c.final()]);
    return `${PREFIX}${iv.toString('base64url')}.${c.getAuthTag().toString('base64url')}.${ct.toString('base64url')}`;
}

// Returns the plain text, or null if it cannot be opened (missing/wrong key or tampered data).
function unprotect(stored, number, env = process.env) {
    if (typeof stored !== 'string') return null;
    if (!stored.startsWith(PREFIX)) return stored; // old plain-text session
    const key = keyFrom(env);
    if (!key) return null;
    try {
        const [iv, tag, ct] = stored.slice(PREFIX.length).split('.').map((p) => Buffer.from(p, 'base64url'));
        const d = crypto.createDecipheriv('aes-256-gcm', key, iv);
        d.setAAD(Buffer.from(`creds:${number}`));
        d.setAuthTag(tag);
        return Buffer.concat([d.update(ct), d.final()]).toString('utf8');
    } catch (_) { return null; }
}
module.exports = { protect, unprotect, PREFIX };
