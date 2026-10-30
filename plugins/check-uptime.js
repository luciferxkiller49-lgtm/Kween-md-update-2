const { cmd } = require('../command');

const FOOTER = `> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ϙᴜᴇᴇɴ-ᴍᴅ ⚡*`;

const contextInfo = {
  forwardingScore: 999,
  isForwarded: true,
  get forwardedNewsletterMessageInfo() { return require('../lib/channel').info(); }
};

const formatUptime = (seconds) => {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  let timeString = '';
  if (days > 0) timeString += `${days} day${days > 1 ? 's' : ''} `;
  if (hours > 0) timeString += `${hours} hour${hours > 1 ? 's' : ''} `;
  if (minutes > 0) timeString += `${minutes} minute${minutes > 1 ? 's' : ''} `;
  if (secs > 0 || timeString === '') timeString += `${secs} second${secs !== 1 ? 's' : ''}`;

  return timeString.trim();
};

cmd({
  pattern: "uptime",
  alias: ["runtime", "up"],
  desc: "Check bot uptime",
  category: "utility",
  react: "🕷",
  filename: __filename
},
async (conn, mek, m, { from, reply }) => {
  try {
    await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });
    await new Promise(resolve => setTimeout(resolve, 1000));

    const uptime = formatUptime(process.uptime());

    const msg =
`╭━━━⪨ 🎀 𝐐𝐔𝐄𝐄𝐍 𝐌𝐃 🎀 ⪩━━━╮
  
  👑 ‣ 𝐔𝐩𝐭𝐢𝐦𝐞  : ${uptime}
  🟢 ‣ 𝐒𝐭𝐚𝐭𝐮𝐬  : Online
  🍸 ‣ 𝐌𝐨𝐝𝐞   : Active & Stable 💕
  💖 ‣ 𝐁𝐨𝐭    : ϙᴜᴇᴇɴ-ᴍᴅ

╰━━━━━━━━━━━━━━━━━━━━━━╯

${FOOTER}`;

    await conn.sendMessage(from, {
      text: msg,
      contextInfo: {
        ...contextInfo,
        mentionedJid: [m.sender]
      }
    }, { quoted: mek });

    await new Promise(resolve => setTimeout(resolve, 800));
    await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

  } catch (e) {
    console.error("Error in uptime command:", e);
    await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    await reply(`❌ Error checking uptime: ${e.message}`);
  }
});
