const config = require('../config');
const { cmd, commands } = require('../command');
const fs = require('fs');
const os = require('os');
const path = require('path');
const channel = require('../lib/channel');
const botImage = require('../lib/botimage');

const MENU_VOICE = path.join(__dirname, '..', 'assets', 'menu-voice.ogg');

// Letters in mathematical bold (same look as the old bot's headers)
const toBold = (str) => Array.from(String(str)).map((ch) => {
    const c = ch.codePointAt(0);
    if (c >= 65 && c <= 90) return String.fromCodePoint(0x1d400 + (c - 65));
    if (c >= 97 && c <= 122) return String.fromCodePoint(0x1d41a + (c - 97));
    return ch;
}).join('');

// Everything after this invisible text is hidden behind "Read more" in WhatsApp
const READ_MORE = '\u200e'.repeat(4001);

const pad = (n) => String(n).padStart(2, '0');
const runText = () => {
    const t = Math.floor(process.uptime());
    return `${pad(Math.floor(t / 3600))}h ${pad(Math.floor((t % 3600) / 60))}m ${pad(t % 60)}s`;
};
const ramText = () => {
    const gb = (b) => (b / 1024 ** 3).toFixed(2);
    let limit = 0;
    for (const p of ['/sys/fs/cgroup/memory.max', '/sys/fs/cgroup/memory/memory.limit_in_bytes']) {
        try {
            const v = Number(fs.readFileSync(p, 'utf-8').trim());
            if (Number.isFinite(v) && v > 0 && v < 1024 ** 4) { limit = v; break; }
        } catch (_) {}
    }
    if (!limit) limit = os.totalmem();
    return `${gb(process.memoryUsage().rss)} / ${gb(limit)} GB`;
};
const timeText = () => {
    try { return new Date().toLocaleTimeString('en-US', { timeZone: process.env.BOT_TIMEZONE || 'Asia/Karachi' }); }
    catch (_) { return new Date().toLocaleTimeString('en-US'); }
};

const ORDER = ['main', 'islamic', 'download', 'group', 'owner', 'moderation', 'settings', 'ai', 'search', 'utility', 'fun', 'media', 'audio'];

// Groups every registered command by category (aliases are not listed, only the main name)
function groupCommands() {
    const groups = new Map();
    for (const c of commands) {
        const name = c.pattern && String(c.pattern).trim();
        if (!name || c.dontAddCommandList) continue;
        const cat = String(c.category || 'misc').toLowerCase();
        if (!groups.has(cat)) groups.set(cat, []);
        if (!groups.get(cat).includes(name)) groups.get(cat).push(name);
    }
    const rank = (k) => (ORDER.includes(k) ? ORDER.indexOf(k) : ORDER.length);
    return [...groups.entries()].sort((a, b) => rank(a[0]) - rank(b[0]) || a[0].localeCompare(b[0]));
}

function buildMenu({ botName, ownerName, prefix, mode, userName, total, filter }) {
    const sections = groupCommands().filter(([cat]) => !filter || cat === filter);
    if (!sections.length) return null;
    const modeLabel = String(mode).charAt(0).toUpperCase() + String(mode).slice(1);

    let text = `بِسْمِ اللّٰہِ الرَّحْمٰنِ الرَّحِیمِ\n\n`;
    text += `˹♡ ${toBold(String(botName).toUpperCase())} ⤸⟵\n`;
    text += `│ Oᴡɴᴇʀ   : ${ownerName}\n`;
    text += `│ Rᴜɴ      : ${runText()}\n`;
    text += `│ Mᴏᴅᴇ    : ${modeLabel}\n`;
    text += `│ Pʀᴇғɪx  : ${prefix}\n`;
    text += `│ Rᴀᴍ     : ${ramText()}\n`;
    text += `│ Tɪᴍᴇ    : ${timeText()}\n`;
    text += `│ Uѕᴇʀ    : ${userName || 'User'}\n`;
    text += `│ Cᴍᴅѕ    : ${total}\n`;
    text += READ_MORE + '\n';

    let list = '';
    for (const [cat, names] of sections) {
        list += `╭───〔 ${cat.toUpperCase()} MENU 〕───\n│\n`;
        for (const n of names) list += `│ ⚡︎ ${prefix}${n}\n`;
        list += `╰───────────────────────\n\n`;
    }
    text += list.trimEnd().split('\n').map((line) => `┃  ${line}`).join('\n');
    text += `\n\n> ✨ Powered by ${ownerName} ✨`;
    return text;
}

cmd({
    pattern: 'menu',
    alias: ['m', 'help', 'allmenu', 'fullmenu'],
    use: '.menu [category]',
    desc: 'Show all bot commands',
    category: 'main',
    react: '🎀',
    filename: __filename
}, async (conn, mek, m, { from, args, reply, userConfig, pushname }) => {
    try {
        const filter = String(args[0] || '').toLowerCase().trim();
        const text = buildMenu({
            botName: userConfig?.BOT_NAME || config.BOT_NAME || 'BOT',
            ownerName: userConfig?.OWNER_NAME || config.OWNER_NAME || 'Owner',
            prefix: userConfig?.PREFIX || config.PREFIX || '.',
            mode: userConfig?.MODE || config.MODE || 'public',
            userName: pushname,
            total: commands.filter((c) => c.pattern && !c.dontAddCommandList).length,
            filter: filter && filter !== 'all' ? filter : '',
        });
        if (!text) return reply(`❌ No commands found in category *${filter}*`);

        // picture: the bundled one, or a link the user chose with .botimage
        const img = botImage.pick(userConfig?.BOT_IMAGE);
        let base = { text };
        try { base = botImage.isHttp(img) ? { image: { url: img }, caption: text } : { image: fs.readFileSync(img), caption: text }; } catch (_) {}

        let sent = false;
        // 1) forwarded from the channel (shows "View channel" under the menu)
        const ch = await channel.resolve(conn);
        if (ch) {
            try {
                await conn.sendMessage(from, {
                    ...base,
                    contextInfo: { isForwarded: true, forwardingScore: 1, forwardedNewsletterMessageInfo: channel.info() },
                });
                sent = true;
            } catch (e) { console.log('Menu with channel card failed:', e.message); }
        }
        // 2) plain picture + text
        if (!sent) {
            try { await conn.sendMessage(from, base); sent = true; }
            catch (e) { console.log('Menu picture failed:', e.message); }
        }
        // 3) text only
        if (!sent) await conn.sendMessage(from, { text });

        // voice note that goes with the menu
        try {
            if (fs.existsSync(MENU_VOICE)) {
                await conn.sendMessage(from, { audio: fs.readFileSync(MENU_VOICE), mimetype: 'audio/ogg; codecs=opus', ptt: true });
            }
        } catch (e) { console.log('Menu voice failed:', e.message); }
    } catch (e) {
        console.log(e);
        reply(`Error: ${e}`);
    }
});

module.exports = { buildMenu, toBold };
