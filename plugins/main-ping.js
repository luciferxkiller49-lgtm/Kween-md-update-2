const { cmd } = require('../command');

const FOOTER = `> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ϙᴜᴇᴇɴ-ᴍᴅ ⚡*`;

const textEmojis = ['💎', '🏆', '⚡️', '🚀', '🎶', '🌠', '🌀', '🔱', '🛡️', '✨'];

const contextInfo = {
  forwardingScore: 999,
  isForwarded: true,
  get forwardedNewsletterMessageInfo() { return require('../lib/channel').info(); }
};

const getNumber = (conn, mek, sender) => {
  const list = [
    sender,
    mek?.key?.participant,
    mek?.key?.participantAlt,
    mek?.key?.participantPn,
    mek?.key?.fromMe ? conn?.user?.id : null,
    mek?.key?.remoteJidAlt,
    mek?.key?.remoteJid
  ];
  const jid = list.find(j => typeof j === 'string' && j.endsWith('@s.whatsapp.net'));
  return (jid || sender || '').split('@')[0].split(':')[0];
};

async function measureMs(conn, from, mek) {
  const emoji = textEmojis[Math.floor(Math.random() * textEmojis.length)];
  const start = Date.now();
  await conn.sendMessage(from, {
    react: { text: emoji, key: mek.key }
  });
  return Date.now() - start;
}

const channel = require('../lib/channel');
const config = require('../config');

const toBold = (str) => Array.from(String(str)).map((ch) => {
    const c = ch.codePointAt(0);
    if (c >= 65 && c <= 90) return String.fromCodePoint(0x1d400 + (c - 65));
    if (c >= 97 && c <= 122) return String.fromCodePoint(0x1d41a + (c - 97));
    return ch;
}).join('');

const sendCard = async (conn, from, mek, sender, text) => {
    await channel.resolve(conn).catch(() => {});
    await conn.sendMessage(from, {
        text,
        contextInfo: { ...contextInfo, mentionedJid: sender ? [sender] : undefined }
    });
};

cmd({
    pattern: "ping",
    alias: ["speed", "pong"],
    desc: "Check bot's response time",
    category: "main",
    filename: __filename
},
async (conn, mek, m, { from, sender, reply }) => {
    try {
        const ms = await measureMs(conn, from, mek);
        await sendCard(conn, from, mek, sender, `˹♡ 𝚸❍𝐍𝐆 : ${ms} 𝐌𝐒 ⤸⟵`);
    } catch (e) {
        console.error("Error in ping command:", e);
        reply(`An error occurred: ${e.message}`);
    }
});

cmd({
    pattern: "ping2",
    desc: "Check bot's response time (detailed)",
    category: "main",
    filename: __filename
},
async (conn, mek, m, { from, sender, reply, userConfig }) => {
    try {
        const ms = await measureMs(conn, from, mek);
        const owner = userConfig?.OWNER_NAME || config.OWNER_NAME || 'Owner';
        const speed = ms < 100 ? 'Bʟᴀᴢɪɴɢ Fᴀsᴛ' : ms < 500 ? 'Fᴀsᴛ' : 'Sʟᴏᴡ';
        const text = `˹♡ 𝐋𝐀𝐓𝐄𝐍𝐂𝐘 : ${ms} 𝐌𝐒 ⤸⟵\n│ Sᴛᴀᴛᴜѕ : ${speed}\n│ Mᴏᴅᴇ   : Aᴄᴛɪᴠᴇ\n\n> ✨ Powered by ${owner} ✨`;
        await sendCard(conn, from, mek, sender, text);
    } catch (e) {
        console.error("Error in ping2 command:", e);
        reply(`⚠️ Error: ${e.message}`);
    }
});
