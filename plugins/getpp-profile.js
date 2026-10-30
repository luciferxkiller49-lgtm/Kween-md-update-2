const { cmd } = require('../command');

function normalizeNumber(input) {
    let n = String(input || '').replace(/\D/g, '');
    if (!n) return null;
    if (n.startsWith('00')) n = n.slice(2);
    if (/^03\d{9}$/.test(n)) return '92' + n.slice(1);
    if (/^923\d{9}$/.test(n)) return n;
    if (n.startsWith('92') && n.length >= 12) return n;
    if (n.length >= 10 && n.length <= 15) return n;
    return null;
}

cmd({
    pattern: "getpp",
    alias: ["pp", "profilepic"],
    desc: "Get profile picture of replied user or by number",
    category: "owner",
    filename: __filename
}, async (conn, mek, m, { from, reply, isCreator, args, sender }) => {
    try {
        if (!isCreator) {
            return reply("❌ Only bot owner can use this command.");
        }

        let target = null;

        if (m.quoted && m.quoted.sender) {
            target = m.quoted.sender;
        } else if (m.mentionedJid && m.mentionedJid.length > 0) {
            target = m.mentionedJid.find(j => j.endsWith('@s.whatsapp.net')) || m.mentionedJid[0];
            if (target && target.endsWith('@c.us')) {
                target = target.replace('@c.us', '@s.whatsapp.net');
            }
        } else if (args[0]) {
            const num = normalizeNumber(args[0]);
            if (!num) {
                return reply("❌ Invalid number format.\n\nExample:\n.getpp +92303xxxxxxx");
            }
            target = num + '@s.whatsapp.net';
        } else {
            return reply("❌ Reply to a user, mention someone, or give a number.\n\nExample:\n.getpp +92303xxxxxxx");
        }

        if (!target) {
            return reply("❌ Reply to a user, mention someone, or give a number.\n\nExample:\n.getpp +92303xxxxxxx");
        }

        let ppUrl;
        try {
            ppUrl = await conn.profilePictureUrl(target, 'image');
        } catch {
            return reply("❌ Couldn't fetch profile picture.\nUser may have no photo or privacy enabled.");
        }

        await conn.sendMessage(from, {
            image: { url: ppUrl },
            caption: `📸 @${target.split('@')[0]}`,
            mentions: [target]
        }, { quoted: mek });

    } catch (error) {
        console.error("[GETPP ERROR]", error);
        reply("❌ Error while fetching profile picture.");
    }
});
