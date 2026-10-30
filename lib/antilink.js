const { getContentType } = require('@whiskeysockets/baileys');

const normalizeId = (id) => {
    if (!id) return '';
    return id
        .replace(/:[0-9]+/g, '')
        .replace(/@(lid|s\.whatsapp\.net|c\.us|g\.us)/g, '')
        .replace(/[^\d]/g, '');
};

// no /g flag — .test() with /g breaks every second call (lastIndex bug)
const LINK_REGEX = /(https?:\/\/|www\.|wa\.me\/|chat\.whatsapp\.com\/|whatsapp\.com\/channel\/)[^\s]+/i;

function containsLink(text) {
    const cleaned = (text || '')
        .replace(/[\s\u200b-\u200d\uFEFF]/g, '')
        .toLowerCase();
    return LINK_REGEX.test(cleaned);
}

const warnStore = new Map();
const metaCache = new Map();
const META_TTL = 15000;

function addWarn(chatId, senderId) {
    if (!warnStore.has(chatId)) warnStore.set(chatId, new Map());
    const groupWarns = warnStore.get(chatId);
    const count = (groupWarns.get(senderId) || 0) + 1;
    groupWarns.set(senderId, count);
    return count;
}

function clearWarn(chatId, senderId) {
    const groupWarns = warnStore.get(chatId);
    if (groupWarns) groupWarns.delete(senderId);
}

async function getMeta(sock, chatId) {
    const hit = metaCache.get(chatId);
    if (hit && Date.now() - hit.ts < META_TTL) return hit.data;
    const data = await sock.groupMetadata(chatId);
    metaCache.set(chatId, { ts: Date.now(), data });
    return data;
}

function isAdminInMeta(meta, userId) {
    const user = normalizeId(userId);
    const participants = meta?.participants || [];
    return participants.some(p => {
        if (!(p.admin === 'admin' || p.admin === 'superadmin')) return false;
        const ids = [p.id, p.lid, p.jid, p.phoneNumber].filter(Boolean);
        return ids.some(id => normalizeId(id) === user);
    });
}

function isBotAdminInMeta(meta, sock) {
    const botId = normalizeId(sock.user?.id || '');
    const botLid = normalizeId(sock.user?.lid || '');
    const participants = meta?.participants || [];
    return participants.some(p => {
        if (!(p.admin === 'admin' || p.admin === 'superadmin')) return false;
        const ids = [p.id, p.lid, p.phoneNumber].filter(Boolean);
        return ids.some(id => {
            const n = normalizeId(id);
            return n === botId || n === botLid;
        });
    });
}

function extractBody(message) {
    const type = getContentType(message);
    if (type === 'conversation') return message.conversation || '';
    if (type === 'extendedTextMessage') return message.extendedTextMessage?.text || '';
    if (type === 'imageMessage') return message.imageMessage?.caption || '';
    if (type === 'videoMessage') return message.videoMessage?.caption || '';
    return '';
}

module.exports = async function ANTILINK(sock, msg, userConfig) {
    try {
        const from = msg.key?.remoteJid || '';
        if (!from.endsWith('@g.us')) return;
        if (msg.key.fromMe) return;
        if (userConfig.ANTI_LINK !== 'true') return;
        if (!msg.message) return;

        const body = extractBody(msg.message);
        if (!body || !containsLink(body)) return;

        const sender = msg.key.participant || msg.key.participantAlt || msg.key.remoteJid;
        if (!sender) return;

        const senderNumber = String(sender).split('@')[0].split(':')[0];

        const sudoList = Array.isArray(userConfig.SUDO) ? userConfig.SUDO : [];
        if (sudoList.includes(sender) || sudoList.includes(senderNumber)) return;

        let meta;
        try {
            meta = await getMeta(sock, from);
        } catch (_) {
            return;
        }

        if (isAdminInMeta(meta, sender)) return;
        if (!isBotAdminInMeta(meta, sock)) return;

        // delete first — do not wait for warn/kick text
        sock.sendMessage(from, { delete: msg.key }).catch(() => {});

        const action = userConfig.ANTI_LINK_ACTION || 'warn';

        if (action === 'delete') return;

        if (action === 'kick') {
            try {
                await sock.groupParticipantsUpdate(from, [sender], 'remove');
            } catch (e) {
                console.log('Antilink kick error:', e.message);
            }
            sock.sendMessage(from, {
                text: `🚫 @${senderNumber} was removed for sending a link.`,
                mentions: [sender]
            }).catch(() => {});
            return;
        }

        const limit = parseInt(userConfig.ANTI_LINK_WARN_LIMIT, 10) || 3;
        const count = addWarn(from, sender);

        if (count >= limit) {
            try {
                await sock.groupParticipantsUpdate(from, [sender], 'remove');
            } catch (e) {
                console.log('Antilink kick-after-warn error:', e.message);
            }
            clearWarn(from, sender);
            sock.sendMessage(from, {
                text: `🚫 @${senderNumber} reached ${limit} warnings for sending links and was removed.`,
                mentions: [sender]
            }).catch(() => {});
        } else {
            sock.sendMessage(from, {
                text: `⚠️ @${senderNumber} don't send links here! Warning ${count}/${limit}`,
                mentions: [sender]
            }).catch(() => {});
        }
    } catch (err) {
        console.error('Anti-link error:', err);
    }
};
