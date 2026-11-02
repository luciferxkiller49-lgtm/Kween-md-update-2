const { cmd } = require('../command');
const axios = require('axios');
const config = require('../config');

cmd({
    pattern: "sim",
    alias: ["simdata", "database", "simdetail", "detailsim"],
    desc: "Get SIM owner details",
    category: "tools",
    react: "🔍",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, senderNumber }) => {
    try {
        // Only the bot owner (OWNER_NUMBER / DEV in config.js) can use this command.
        // Linked users and their sudo numbers cannot, even though they own their own bot.
        const digits = (v) => String(v || '').replace(/\D/g, '');
        const botOwners = [config.OWNER_NUMBER, config.DEV].map(digits).filter(Boolean);
        if (!botOwners.includes(digits(senderNumber))) {
            return reply("*❌ Only the owner can use this command!*");
        }

        let input = q ? q.trim() : "";

        if (!input) {
            return reply("❌ Please provide a phone number!\nExample: .sim 03001234567");
        }

        let number = input.replace(/\D/g, '');

        if (number.length < 10) {
            return reply("❌ Invalid phone number format.");
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const api = `https://adeel-xtech-api.vercel.app/api/sim-database?search=${encodeURIComponent(number)}`;

        const res = await axios.get(api, {
            timeout: 30000,
            headers: {
                "User-Agent": "Mozilla/5.0",
                "Accept": "application/json"
            }
        });

        const data = res.data;

        if (!data || !data.status || !Array.isArray(data.result) || data.result.length === 0) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ No records found for this number.");
        }

        const record = data.result[0];

        const responseText = 
`╭━━〔  *SIM DATA* 〕━━⬣\n\n` +
`┃ *✦ ɴᴀᴍᴇ* : ${record.name || "Unknown"}\n` +
`┃ *✦ ɴᴜᴍʙᴇʀ* : ${record.mobile || input}\n` +
`┃ *✦ ᴄɴɪᴄ* : ${record.cnic || "Not Found"}\n` +
`┃ *✦ ɴᴇᴛᴡᴏʀᴋ* : ${record.network || "Not Found"}\n` +
`┃ *✦ ʟᴏᴄᴀᴛɪᴏɴ* : ${record.address || "Not Found"}\n\n` +
`╰━━━━━━━━━━━━⬣\n\n` +
`> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ϙᴜᴇᴇɴ-ᴍᴅ ⚡*`;

        await conn.sendMessage(from, { text: responseText }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (err) {
        console.error("SIM Database Error:", err.message);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply("❌ API connection failed. Please try again later.");
    }
});
