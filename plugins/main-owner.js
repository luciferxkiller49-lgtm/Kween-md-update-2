const { cmd } = require('../command');
const config = require('../config');

const FOOTER = `> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ϙᴜᴇᴇɴ-ᴍᴅ ⚡*`;

cmd({
  pattern: "owner",
  alias: ["creator", "developer"],
  desc: "Get owner contact card",
  category: "main",
  react: "👑",
  filename: __filename
}, async (conn, mek, m, { from, userConfig }) => {
  try {
    const OWNER_NUMBER = userConfig?.OWNER_NUMBER || config.OWNER_NUMBER || "923147609290";
    const OWNER_NAME = userConfig?.OWNER_NAME || config.OWNER_NAME || "QUEEN";
    const TEAM_NAME = "QUEEN-MD TEAM";

    await conn.sendPresenceUpdate("composing", from);

    const vcard =
      'BEGIN:VCARD\n' +
      'VERSION:3.0\n' +
      `FN:${OWNER_NAME}\n` +
      `ORG:${TEAM_NAME};\n` +
      `TEL;type=CELL;type=VOICE;waid=${OWNER_NUMBER}:${'+' + OWNER_NUMBER}\n` +
      `NOTE:👤 *Owner Info*\n\n*Name:* ${OWNER_NAME}\n*Number:* +${OWNER_NUMBER}\n\n${FOOTER}\n` +
      'END:VCARD';

    try {
      await conn.sendMessage(from, {
        image: { url: require('../lib/botimage').defaultImage() },
        caption: `👑 *${OWNER_NAME}*\n+${OWNER_NUMBER}\n\n${FOOTER}`
      }, { quoted: mek });
    } catch (_) { /* photo is optional; the contact card below still goes out */ }

    await conn.sendMessage(from, {
      contacts: {
        displayName: OWNER_NAME,
        contacts: [{ vcard }]
      }
    }, { quoted: mek });

    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (e) {
    console.error("Error sending contact:", e);
    await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
  }
});
