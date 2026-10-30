'use strict';
// The channel shown as "View channel" on the menu, ping and other cards.
// Its real ID and name are read from WhatsApp using the invite link (once, then cached), so only the link is needed here.
const LINK = 'https://whatsapp.com/channel/0029Vb8uBP0HFxOyA9xGXC2S';
const FALLBACK_NAME = '༄ᶦᶰᵈ᭄✿ 🅝🅐🅔🅔🅜 - 🅜🅓  ࿐';
const CODE = LINK.split('/channel/')[1].split(/[?/]/)[0];

let cache = null;     // { jid, name } once a lookup has worked
let inflight = null;

async function resolve(conn) {
    if (cache) return cache;
    if (inflight) return inflight;
    inflight = (async () => {
        try {
            const meta = await conn.newsletterMetadata('invite', CODE);
            if (!meta?.id) throw new Error('channel id not found');
            cache = { jid: meta.id, name: meta.name || meta.thread_metadata?.name?.text || FALLBACK_NAME };
            return cache;
        } catch (e) {
            console.log('Channel lookup failed:', e.message);
            return null;
        } finally { inflight = null; }
    })();
    return inflight;
}

// Value for contextInfo.forwardedNewsletterMessageInfo (undefined until the channel has been looked up)
const info = () => (cache ? { newsletterJid: cache.jid, newsletterName: cache.name, serverMessageId: 100 } : undefined);

module.exports = { LINK, resolve, info };
