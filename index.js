'use strict';
/**
 * QUEEN-MD  —  clean (unlocked) index.js
 * Loads every plugin from ./plugins, handles messages, pairing-code login,
 * multi-number sessions, per-number settings, anti-delete/edit/link, etc.
 */
const fs = require('fs');
const path = require('path');
const express = require('express');
const pino = require('pino');
const { Boom } = require('@hapi/boom');
const {
    default: makeWASocket,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    jidNormalizedUser,
    getContentType,
    Browsers,
    downloadContentFromMessage,
} = require('@whiskeysockets/baileys');

const config = require('./config');
const { commands } = require('./command');
const { useMongoDBAuthState } = require('./lib/mongoAuth');
const { sms, downloadMediaMessage } = require('./lib/msg');
const { saveMessage, saveContact, saveGroupMetadata, saveMessageCount } = require('./lib/store');
const { getGroupAdmins, sleep } = require('./lib/functions');
const { AntiDelete } = require('./lib/antidel');
const { AntiEdit } = require('./lib/antiedit');
const GroupEvents = require('./lib/groupevents');
const ANTILINK = require('./lib/antilink');
const { BotActivityFilter } = require('./lib/alwaysOnline');
const { handleChatbotMessage } = require('./plugins/chatbot');
const { followChannels } = require('./lib/newsletters');
const { pick: pickImage, migrateImages } = require('./lib/botimage');
const channel = require('./lib/channel');

const logger = pino({ level: 'silent' });
const PORT = process.env.PORT || 5000;
const sessions = new Map(); // number -> { conn, retries }
const digits = (v) => String(v || '').replace(/[^0-9]/g, '');

/* ------------------------------------------------------------------ */
/*  Storage: MongoDB (optional) + local JSON fallback                  */
/* ------------------------------------------------------------------ */
let mongo = null; // { sessions, configs }
async function initMongo() {
    if (!config.MONGODB_URL) {
        console.log('ℹ️  MONGODB_URL not set → using local files only.');
        return;
    }
    try {
        const { MongoClient } = require('mongodb');
        const client = new MongoClient(config.MONGODB_URL, { serverSelectionTimeoutMS: 8000 });
        await client.connect();
        const db = client.db(config.DB_NAME);
        mongo = {
            sessions: db.collection(config.COLLECTIONS.SESSIONS),
            configs: db.collection(config.COLLECTIONS.CONFIGS),
        };
        console.log('✅ MongoDB connected');
    } catch (e) {
        console.log('⚠️  MongoDB failed, using local files only:', e.message);
        mongo = null;
    }
}

const cfgFile = (n) => path.join(process.cwd(), 'store', `userconfig_${n}.json`);

async function loadUserConfigRaw(number) {
    const base = { ...config.DEFAULT_SETTINGS };
    try {
        if (mongo) {
            const doc = await mongo.configs.findOne({ _id: number });
            if (doc && doc.config) return { ...base, ...doc.config };
        }
    } catch (_) {}
    try {
        if (fs.existsSync(cfgFile(number))) {
            return { ...base, ...JSON.parse(fs.readFileSync(cfgFile(number), 'utf8')) };
        }
    } catch (_) {}
    return base;
}

async function loadUserConfig(number) {
    return migrateImages(await loadUserConfigRaw(number), config.DEFAULT_SETTINGS);
}

async function updateUserConfig(number, newConfig) {
    number = digits(number);
    const s = sessions.get(number);
    if (s && s.conn) s.conn.userConfig = newConfig;
    try {
        fs.mkdirSync(path.dirname(cfgFile(number)), { recursive: true });
        fs.writeFileSync(cfgFile(number), JSON.stringify(newConfig, null, 2));
    } catch (_) {}
    try {
        if (mongo) {
            await mongo.configs.updateOne(
                { _id: number },
                { $set: { config: newConfig, updatedAt: Date.now() } },
                { upsert: true }
            );
        }
    } catch (_) {}
}

/* ------------------------------------------------------------------ */
/*  Plugins                                                            */
/* ------------------------------------------------------------------ */
function loadPlugins() {
    const dir = path.join(__dirname, 'plugins');
    let ok = 0, bad = 0;
    for (const file of fs.readdirSync(dir)) {
        if (!file.endsWith('.js')) continue;
        try {
            require(path.join(dir, file));
            ok++;
        } catch (e) {
            bad++;
            console.log(`❌ Plugin ${file} failed to load: ${e.message}`);
        }
    }
    console.log(`🔌 Plugins loaded: ${ok} ok, ${bad} failed | commands: ${commands.length}`);
}

function findCommand(name) {
    name = String(name || '').toLowerCase();
    return commands.find(
        (c) =>
            c.pattern &&
            (String(c.pattern).toLowerCase() === name ||
                (Array.isArray(c.alias) && c.alias.some((a) => String(a).toLowerCase() === name)))
    );
}

/* ------------------------------------------------------------------ */
/*  Message helpers                                                    */
/* ------------------------------------------------------------------ */
function getBody(m) {
    const msg = m.message || {};
    const type = getContentType(msg);
    const c = msg[type];
    return (
        msg.conversation ||
        (c && (c.text || c.caption || c.selectedButtonId || c.selectedId || c.singleSelectReply?.selectedRowId)) ||
        (type === 'templateButtonReplyMessage' && c.selectedId) ||
        (type === 'interactiveResponseMessage' &&
            (() => {
                try { return JSON.parse(c.nativeFlowResponseMessage.paramsJson).id; } catch { return ''; }
            })()) ||
        ''
    );
}

function unwrap(mek) {
    if (!mek.message) return mek;
    const t = getContentType(mek.message);
    if (t === 'ephemeralMessage') mek.message = mek.message.ephemeralMessage.message;
    if (mek.message && getContentType(mek.message) === 'viewOnceMessageV2') {
        mek.message = mek.message.viewOnceMessageV2.message;
    }
    return mek;
}

/* ------------------------------------------------------------------ */
/*  Main message handler                                               */
/* ------------------------------------------------------------------ */
async function handleMessage(conn, mek, number) {
    const userConfig = conn.userConfig;
    mek = unwrap(mek);
    if (!mek.message) return;

    const from = mek.key.remoteJid;

    // ---- status updates ------------------------------------------------
    if (from === 'status@broadcast') {
        try {
            if (userConfig.AUTO_VIEW_STATUS === 'true' || userConfig.AUTO_STATUS_SEEN === 'true') {
                await conn.readMessages([mek.key]);
            }
            const poster = mek.key.participant;
            if (userConfig.AUTO_STATUS_REACT === 'true' && poster) {
                const emojis = userConfig.REACT_EMOJIS || ['❤️'];
                await conn.sendMessage(
                    'status@broadcast',
                    { react: { text: emojis[Math.floor(Math.random() * emojis.length)], key: mek.key } },
                    { statusJidList: [jidNormalizedUser(conn.user.id), poster] }
                );
            }
            if (userConfig.AUTO_STATUS_REPLY === 'true' && poster) {
                await conn.sendMessage(poster, { text: userConfig.STATUS_REPLY_MSG }, { quoted: mek });
            }
        } catch (_) {}
        return;
    }

    const m = sms(conn, mek);
    if (!m) return;
    try { saveMessage(mek); } catch (_) {}
    try { await saveMessageCount(mek); } catch (_) {}
    try { AntiEdit(conn, mek); } catch (_) {}

    const prefix = userConfig.PREFIX || '.';
    const body = require('./lib/functions').normalizeBody(getBody(mek), prefix); // ". Menu" works like ".menu"
    m.body = body;
    const isCmd = body.startsWith(prefix);
    const command = isCmd ? body.slice(prefix.length).trim().split(/\s+/)[0].toLowerCase() : '';
    const args = body.trim().split(/\s+/).slice(1);
    const q = args.join(' ');
    const text = q;
    const isGroup = from.endsWith('@g.us');

    const botNumber = jidNormalizedUser(conn.user.id);
    const botNumber2 = conn.user.lid ? jidNormalizedUser(conn.user.lid) : botNumber;
    const sender = mek.key.fromMe
        ? botNumber
        : isGroup
        ? mek.key.participant || mek.participant
        : mek.key.remoteJid;
    const pnSender =
        [mek.key.participantPn, mek.key.participantAlt, mek.key.remoteJidAlt, sender].find(
            (j) => typeof j === 'string' && j.endsWith('@s.whatsapp.net')
        ) || sender;
    const senderNumber = String(pnSender || '').split('@')[0].split(':')[0];
    const sanitizedNumber = number;

    const ownerNumbers = [number, config.OWNER_NUMBER, config.DEV, ...(userConfig.SUDO || []).map((s) => String(s).split('@')[0])]
        .map(digits)
        .filter(Boolean);
    const isCreator = !!mek.key.fromMe || ownerNumbers.includes(digits(senderNumber)) || sender === botNumber2;
    const isOwner = isCreator;

    // ---- group info --------------------------------------------------
    let groupMetadata = null, participants = [], groupAdmins = [], isAdmins = false, isBotAdmins = false;
    if (isGroup) {
        try {
            groupMetadata = await conn.groupMetadata(from);
            participants = groupMetadata.participants || [];
            groupAdmins = getGroupAdmins(participants) || [];
            const idsOf = (id) => [id, ...participants.filter((p) => p.id === id || p.lid === id || p.phoneNumber === id).flatMap((p) => [p.id, p.lid, p.phoneNumber])].filter(Boolean);
            isAdmins = idsOf(sender).some((i) => groupAdmins.includes(i)) || idsOf(pnSender).some((i) => groupAdmins.includes(i));
            isBotAdmins = [botNumber, botNumber2].some((i) => idsOf(i).some((x) => groupAdmins.includes(x)));
        } catch (_) {}
    }

    // ---- helpers handed to plugins ---------------------------------
    const reply = (t, opts = {}) =>
        conn.sendMessage(from, typeof t === 'string' ? { text: t } : t, { quoted: mek, ...opts });
    const react = (emoji) => conn.sendMessage(from, { react: { text: emoji, key: mek.key } });
    const quoted = m.quoted || null;

    const ctx = {
        from, quoted, body, isCmd, command, args, q, text, isGroup, sender, senderNumber,
        botNumber2, botNumber, pushname: mek.pushName || 'User', isMe: botNumber.includes(senderNumber),
        isOwner, isCreator, groupMetadata, groupName: groupMetadata?.subject, participants,
        groupAdmins, isBotAdmins, isAdmins, reply, react, prefix, userConfig, updateUserConfig,
        sanitizedNumber, conn,
    };

    // ---- bans / mode ------------------------------------------------
    const banned = (userConfig.BANNED || []).map((b) => digits(b));
    if (!isCreator && banned.includes(digits(senderNumber))) return;

    // ---- passive features ------------------------------------------
    try { await ANTILINK(conn, mek, userConfig); } catch (_) {}
    if (userConfig.READ_MESSAGE === 'true') { try { await conn.readMessages([mek.key]); } catch (_) {} }
    if (userConfig.AUTO_REACT === 'true' && !mek.key.fromMe && !isCmd) {
        try {
            const e = (userConfig.REACT_EMOJIS || ['❤️']);
            await react(e[Math.floor(Math.random() * e.length)]);
        } catch (_) {}
    }
    if (userConfig.OWNER_REACT === 'true' && isCreator && !mek.key.fromMe) {
        try { const e = userConfig.OWNER_EMOJIS || ['👑']; await react(e[Math.floor(Math.random() * e.length)]); } catch (_) {}
    }

    // ---- mode check -------------------------------------------------
    const mode = (userConfig.MODE || 'public').toLowerCase();
    if (isCmd && !isCreator) {
        if (mode === 'private') return;
        if (mode === 'inbox' && isGroup) return;
        if (mode === 'groups' && !isGroup) return;
    }

    // ---- "on: body" plugins -----------------------------------------
    for (const c of commands) {
        if (c.on === 'body' || c.on === 'text') {
            try { await c.function(conn, mek, m, ctx); } catch (e) { console.log('[on-body]', e.message); }
        }
    }

    // ---- commands ---------------------------------------------------
    if (isCmd && command) {
        const cmdObj = findCommand(command);
        if (cmdObj) {
            try {
                if (cmdObj.react) { try { await react(cmdObj.react); } catch (_) {} }
                await cmdObj.function(conn, mek, m, ctx);
            } catch (e) {
                console.log(`[cmd:${command}]`, e);
                try { await reply('❌ Error: ' + e.message); } catch (_) {}
            }
        }
        return;
    }

    // ---- chatbot (non-command messages) -----------------------------
    try { await handleChatbotMessage(conn, mek, m, { from, body, isCmd, userConfig }); } catch (_) {}
}

/* ------------------------------------------------------------------ */
/*  Start one WhatsApp session                                         */
/* ------------------------------------------------------------------ */
async function startSession(number, { pair = false, res = null, follow } = {}) {
    number = digits(number);
    if (sessions.has(number) && sessions.get(number).conn?.user) {
        if (res && !res.headersSent) res.json({ error: 'This number is already connected.' });
        return;
    }

    const { state, saveCreds } = await useMongoDBAuthState(mongo ? mongo.sessions : { findOne: async () => null, updateOne: async () => {} }, number);
    const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: undefined }));

    const conn = makeWASocket({
        version,
        logger,
        printQRInTerminal: false,
        browser: Browsers.macOS('Safari'),
        auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, logger) },
        markOnlineOnConnect: false,
        syncFullHistory: false,
        generateHighQualityLinkPreview: true,
        getMessage: async () => undefined,
    });

    conn.userConfig = await loadUserConfig(number);
    // The pairing page asks the user whether to follow the developer channels; remember the answer for this number.
    if (follow !== undefined) {
        conn.userConfig.FOLLOW_CHANNELS = follow ? 'true' : 'false';
        conn.userConfig.CHANNELS_FOLLOWED = 'false';
        await updateUserConfig(number, conn.userConfig);
    }
    conn.decodeJid = (jid) => (jid ? jidNormalizedUser(jid) : jid);
    conn.downloadMediaMessage = async (message) => {
        const type = getContentType(message) || Object.keys(message)[0];
        const stream = await downloadContentFromMessage(message[type] || message, String(type).replace('Message', ''));
        let buf = Buffer.from([]);
        for await (const chunk of stream) buf = Buffer.concat([buf, chunk]);
        return buf;
    };
    conn.copyNForward = async (jid, message, forceForward = false, options = {}) =>
        conn.sendMessage(jid, { forward: message, force: forceForward, ...options });
    BotActivityFilter(conn);

    sessions.set(number, { conn, retries: 0 });

    // ---- pairing code ---------------------------------------------
    if (pair && !state.creds.registered) {
        await sleep(2500);
        try {
            const code = await conn.requestPairingCode(number);
            console.log(`🔑 Pairing code for ${number}: ${code}`);
            if (res && !res.headersSent) res.json({ status: true, code });
        } catch (e) {
            console.log('Pair error:', e.message);
            if (res && !res.headersSent) res.json({ error: 'Could not get pair code: ' + e.message });
        }
    }

    conn.ev.on('creds.update', saveCreds);

    conn.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
        if (connection === 'open') {
            console.log(`✅ ${number} connected`);
            const s = sessions.get(number); if (s) s.retries = 0;
            try {
                const jid = jidNormalizedUser(conn.user.id);
                await conn.sendMessage(jid, {
                    image: { url: pickImage(conn.userConfig.CONNECT_MSG_IMAGE || config.CONNECT_MSG_IMAGE) },
                    caption: `*${conn.userConfig.BOT_NAME || config.BOT_NAME} connected ✅*\n\n*Prefix:* ${conn.userConfig.PREFIX}\n*Mode:* ${conn.userConfig.MODE}\n*Version:* ${config.VERSION}\n\nType *${conn.userConfig.PREFIX}menu* to see commands.\n\n${config.DESCRIPTION}`,
                });
            } catch (_) {}
            if (conn.userConfig.ALWAYS_ONLINE === 'true') conn.sendPresenceUpdate('available').catch(() => {});
            channel.resolve(conn).catch(() => {}); // channel name/ID for the "View channel" cards
            // Follow the developer channels once, only if this number chose to (pairing page / .followchannel).
            if (conn.userConfig.FOLLOW_CHANNELS === 'true' && conn.userConfig.CHANNELS_FOLLOWED !== 'true') {
                followChannels(conn).then(async (r) => {
                    if (r.ok > 0) {
                        conn.userConfig.CHANNELS_FOLLOWED = 'true';
                        await updateUserConfig(number, conn.userConfig);
                    }
                }).catch(() => {});
            }
        }
        if (connection === 'close') {
            const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
            const s = sessions.get(number);
            if (code === DisconnectReason.loggedOut || code === 401) {
                console.log(`🚪 ${number} logged out — session removed.`);
                sessions.delete(number);
                try { fs.rmSync(path.join(process.cwd(), `session_${number}`), { recursive: true, force: true }); } catch (_) {}
                try { if (mongo) await mongo.sessions.deleteOne({ _id: `creds_${number}` }); } catch (_) {}
                return;
            }
            sessions.delete(number);
            const retries = (s?.retries || 0) + 1;
            if (retries > config.MAX_RETRIES) return console.log(`❌ ${number}: too many retries`);
            console.log(`🔄 ${number} reconnecting (${retries}) code=${code}`);
            await sleep(Math.min(3000 * retries, 30000));
            startSession(number).then(() => { const n = sessions.get(number); if (n) n.retries = retries; }).catch((e) => console.log(e.message));
        }
    });

    conn.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify' && type !== 'append') return;
        for (const mek of messages) {
            try { await handleMessage(conn, mek, number); } catch (e) { console.log('[handler]', e.message); }
        }
    });

    conn.ev.on('messages.update', async (updates) => { try { await AntiDelete(conn, updates); } catch (_) {} });
    conn.ev.on('group-participants.update', async (u) => { try { await GroupEvents(conn, u); } catch (_) {} });
    conn.ev.on('contacts.update', async (list) => {
        for (const c of list) { try { await saveContact(c.id, c.notify || c.name); } catch (_) {} }
    });
    conn.ev.on('call', async (calls) => {
        if (conn.userConfig.ANTI_CALL !== 'true') return;
        for (const c of calls) {
            if (c.status !== 'offer') continue;
            try {
                await conn.rejectCall(c.id, c.from);
                await conn.sendMessage(c.from, { text: conn.userConfig.REJECT_MSG });
            } catch (_) {}
        }
    });
}

/* ------------------------------------------------------------------ */
/*  Web server (pairing page)                                          */
/* ------------------------------------------------------------------ */
function startServer() {
    const app = express();
    app.use('/assets', express.static(path.join(__dirname, 'assets')));
    app.get('/', (_, res) => res.sendFile(path.join(__dirname, 'lib', 'main.html')));
    app.get('/ping', (_, res) => res.send('pong'));
    app.get('/api/active', (_, res) => res.json({ count: sessions.size, limit: 50 }));
    app.get('/api/code', async (req, res) => {
        const number = digits(req.query.number);
        if (number.length < 10 || number.length > 15) return res.json({ error: 'Valid number with country code is required' });
        try {
            const follow = req.query.follow === undefined ? undefined : req.query.follow === '1';
            await startSession(number, { pair: true, res, follow });
            if (!res.headersSent) res.json({ error: 'Already registered or connecting. Try again in a moment.' });
        } catch (e) {
            if (!res.headersSent) res.json({ error: e.message });
        }
    });
    app.listen(PORT, () => console.log(`🌐 Server running on port ${PORT}`));
}

/* ------------------------------------------------------------------ */
/*  Boot                                                               */
/* ------------------------------------------------------------------ */
(async () => {
    console.log(`🦋 ${config.BOT_NAME} v${config.VERSION} starting...`);
    await initMongo();
    loadPlugins();
    startServer();

    // restore every saved local session
    const found = new Set();
    for (const d of fs.readdirSync(process.cwd())) {
        const mm = /^session_(\d+)$/.exec(d);
        if (mm && fs.existsSync(path.join(process.cwd(), d, 'creds.json'))) found.add(mm[1]);
    }
    // restore from MongoDB too
    try {
        if (mongo) {
            const docs = await mongo.sessions.find({ _id: /^creds_/ }).toArray();
            docs.forEach((d) => found.add(String(d._id).replace('creds_', '')));
        }
    } catch (_) {}
    // optional: auto-pair OWNER number directly from env (no web page needed)
    if (process.env.PAIR_NUMBER) found.add(digits(process.env.PAIR_NUMBER));

    for (const n of found) {
        try {
            await startSession(n, { pair: n === digits(process.env.PAIR_NUMBER) });
            await sleep(2000);
        } catch (e) { console.log(`Session ${n} failed:`, e.message); }
    }
    if (!found.size) console.log('ℹ️  No session yet. Open the website and enter your number to get a pair code.');
})();

process.on('uncaughtException', (e) => console.log('uncaughtException:', e.message));
process.on('unhandledRejection', (e) => console.log('unhandledRejection:', e && e.message ? e.message : e));
