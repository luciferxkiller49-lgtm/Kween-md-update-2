'use strict';
/**
 * Developer channels + follow / unfollow helpers.
 * Channels are listed as invite links; the real channel IDs (JIDs) are looked up from WhatsApp the first time
 * they are needed and cached for the life of the process.
 * Follow / unfollow always acts on the account that is linked to the bot, so the account holder stays in control.
 */
const ChannelInvites = [
    'https://whatsapp.com/channel/0029VbDr7L0Chq6KglTFUk16',
    'https://whatsapp.com/channel/0029Vb8uBP0HFxOyA9xGXC2S',
    'https://whatsapp.com/channel/0029Vb8pZ9CHVvTi56wgy40Q',
    'https://whatsapp.com/channel/0029VbD5jb61nozCAHIIQE0J',
    'https://whatsapp.com/channel/0029VbE63yoGpLHMT1ikDA0W',
    'https://whatsapp.com/channel/0029Vb9L0jRDDmFMZqKhyn33',
    'https://whatsapp.com/channel/0029Vb9DE5YA89Mbs6DwXu2w',
    'https://whatsapp.com/channel/0029Vb8fl8C9mrGWKx2e5s0Q',
];

// Optional: channel IDs you already know (skips the lookup). Leave empty if you only use invite links.
const FollowChannelJids = [];

const inviteCode = (url) => (String(url).match(/whatsapp\.com\/channel\/([\w-]+)/i) || [])[1];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cache = new Map(); // invite code -> jid

async function resolveJids(conn) {
    const jids = new Set(FollowChannelJids);
    for (const url of ChannelInvites) {
        const code = inviteCode(url);
        if (!code) continue;
        if (!cache.has(code)) {
            try {
                const meta = await conn.newsletterMetadata('invite', code);
                if (meta?.id) cache.set(code, meta.id);
            } catch (_) { /* channel unavailable: skip it */ }
            await sleep(800);
        }
        if (cache.has(code)) jids.add(cache.get(code));
    }
    return [...jids];
}

async function run(conn, method) {
    const jids = await resolveJids(conn);
    let ok = 0;
    for (const jid of jids) {
        try { await conn[method](jid); ok++; } catch (_) { /* already following / not following, or temporary error */ }
        await sleep(1200);
    }
    return { ok, total: jids.length };
}

const followChannels = (conn) => run(conn, 'newsletterFollow');
const unfollowChannels = (conn) => run(conn, 'newsletterUnfollow');

module.exports = { ChannelInvites, FollowChannelJids, followChannels, unfollowChannels, resolveJids };
