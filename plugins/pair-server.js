const { cmd } = require('../command');
const axios = require('axios');
const { sendButtons } = require('gifted-btns');
const { lidToPhone } = require('../lib/functions');

// ✅ Nayi site pehle, purani fallback
const BASE_URLS = [
    "https://kweentech.vercel.app",
    "https://queenxd.vercel.app"
];

function getCountStatus(count) {
    if (count >= 50) return '🔴';
    if (count >= 40) return '🟣';
    if (count >= 30) return '🟡';
    if (count >= 20) return '🟠';
    if (count >= 10) return '🔵';
    return '🟢';
}

// ✅ Fallback ke saath servers fetch
async function getServers() {
    for (const base of BASE_URLS) {
        try {
            const res = await axios.get(base + '/api/servers', { timeout: 10000 });
            const list = res.data && res.data.servers ? res.data.servers : [];
            if (list.length) {
                console.log(`✅ Servers loaded from: ${base}`);
                return list;
            }
        } catch (err) {
            console.log(`⚠️ Failed to fetch from ${base}: ${err.message}`);
        }
    }
    return [];
}

cmd({
    pattern: "status",
    alias: ["serverstatus", "stats", "servers"],
    react: "📊",
    desc: "Check server status and active users",
    category: "owner",
    use: ".status",
    filename: __filename
}, async (conn, mek, m, { reply, react }) => {
    try {
        await react('⏳');
        const servers = await getServers();
        if (!servers.length) {
            await react('❌');
            return reply("❌ No servers found.");
        }

        const results = await Promise.all(servers.map(async (server) => {
            try {
                const { data } = await axios.get(server.url + '/api/active', { timeout: 8000 });
                if (data && !data.error) {
                    const count = data.count || 0;
                    const limit = data.limit || 50;
                    return { name: server.name, count, limit, icon: getCountStatus(count), text: 'ONLINE', online: true };
                }
                return { name: server.name, count: 0, limit: 50, icon: '🟡', text: 'NO DATA', online: false };
            } catch {
                return { name: server.name, count: 0, limit: 50, icon: '🔴', text: 'OFFLINE', online: false };
            }
        }));

        const online = results.filter(r => r.online).length;
        const totalActive = results.reduce((a, r) => a + r.count, 0);
        const totalLimit = results.filter(r => r.online).reduce((a, r) => a + r.limit, 0);

        let msg = '╭──「 *SERVER STATUS* 」\n│\n';
        msg += '│ *📊 Overview*\n';
        msg += '│ Total: ' + results.length + '\n';
        msg += '│ Online: ' + online + ' | Offline: ' + (results.length - online) + '\n';
        msg += '│ Active: ' + totalActive + '/' + totalLimit + '\n│\n│━━━━━━━━━━━━━━━━━━━━\n';
        results.forEach(r => {
            msg += '│ ' + String(r.name).padEnd(8) + ': ' + String(r.count).padStart(2) + '/' + r.limit + ' ' + r.icon + ' ' + r.text + '\n';
        });
        msg += '╰─────────────────';

        await react('✅');
        await reply(msg);
    } catch (error) {
        console.error("Status command error:", error.message);
        await react('❌');
        await reply("❌ Error checking server status.");
    }
});

cmd({
    pattern: "pair",
    alias: ["getpair", "clonebot", "getcode"],
    react: "🔑",
    desc: "Get pairing code for the bot",
    category: "all",
    use: ".pair 923306137XXX",
    filename: __filename
}, async (conn, mek, m, { from, args, sender, senderNumber, reply, react }) => {
    try {
        await react('⏳');
        let phoneNumber;

        if (args[0]) {
            phoneNumber = args[0].trim().replace(/[^0-9]/g, '');
        } else {
            if (String(sender).includes('@lid')) {
                try {
                    const converted = await lidToPhone(conn, sender);
                    phoneNumber = converted ? converted.replace(/[^0-9]/g, '') : '';
                } catch {
                    phoneNumber = '';
                }
                if (!phoneNumber) {
                    await react('❌');
                    return reply("❌ *Could not detect your number.*\n\n📌 *Use:*\n.pair 923306137XXX");
                }
            } else {
                phoneNumber = String(senderNumber || '').replace(/[^0-9]/g, '');
            }
        }

        if (!phoneNumber || phoneNumber.length < 10 || phoneNumber.length > 15) {
            await react('❌');
            return reply("❌ *Enter a valid number!*\n\n📌 *Example:*\n.pair 923306137XXX");
        }

        let servers = [];
        try {
            servers = await getServers();
        } catch {
            console.log("Servers fetch failed");
        }

        if (!servers.length) {
            await react('❌');
            return reply("❌ No servers available right now.");
        }

        const alive = (await Promise.all(servers.map(async (s) => {
            const base = String(s.url || '').replace(/\/$/, '');
            if (!base) return null;
            try {
                const { data } = await axios.get(base + '/api/active', { timeout: 8000 });
                if (data && typeof data.count === 'number' && data.count < (data.limit || 50)) return base;
            } catch {}
            return null;
        }))).filter(Boolean);

        if (!alive.length) {
            await react('❌');
            return reply("❌ All servers are full or offline. Try again later.");
        }

        for (let i = alive.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [alive[i], alive[j]] = [alive[j], alive[i]];
        }

        let response = null;
        let lastError = null;
        for (const base of alive) {
            try {
                const res = await axios.get(base + '/api/code', {
                    params: { number: phoneNumber },
                    timeout: 30000,
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });
                response = res;
                if (res.data && (res.data.code || res.data.error === 'already_connected')) break;
            } catch (err) {
                lastError = err;
            }
        }

        if (!response || !response.data) throw lastError || new Error("No response from any server");

        const codeData = response.data.code;
        if (!codeData) {
            await react('❌');
            return reply("❌ " + (response.data.message || response.data.error || "Failed to get code. Try again in 20 seconds."));
        }

        let pairingCode = codeData.toString().trim();
        const cleanCode = pairingCode.replace(/[^A-Za-z0-9]/g, '');
        if (cleanCode.length === 8) {
            pairingCode = cleanCode.substring(0, 4) + '-' + cleanCode.substring(4);
        }

        const pairMsg =
'𝗤𝗨𝗘𝗘𝗡-𝗠𝗗 𝗣𝗔𝗜𝗥𝗜𝗡𝗚\n\n' +
'🔐 *𝗖𝗢𝗗𝗘:* *' + pairingCode + '*\n\n' +
'> *1. Go to Settings > Linked Devices*\n' +
'> *2. Tap Link a Device*\n' +
'> *3. Select "Link with phone number instead"*\n' +
'> *4. Enter the code*\n\n\n' +
'⏱️ `Expires in 60 seconds`\n\n' +
'> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ϙᴜᴇᴇɴ-ᴍᴅ*';

        await react('✅');

        try {
            await sendButtons(conn, from, {
                title: '',
                text: pairMsg,
                buttons: [
                    {
                        name: 'cta_copy',
                        buttonParamsJson: JSON.stringify({
                            display_text: '📋 Copy Code',
                            copy_code: pairingCode
                        })
                    }
                ]
            }, { quoted: mek });
        } catch (e) {
            console.error('sendButtons failed:', e.message);
            await reply(pairMsg);
            await reply(pairingCode);
        }

    } catch (error) {
        console.error("Pair command error:", error.message);
        await react('❌');
        let errorMessage = "❌ " + error.message;
        if (error.response) {
            if (error.response.status === 404) errorMessage = "❌ Server endpoint not found. Try again in 1 minute.";
            else if (error.response.data && error.response.data.error) errorMessage = "❌ " + error.response.data.error;
            else errorMessage = "❌ Server error: " + error.response.status;
        } else if (error.request) {
            errorMessage = "❌ No response from server. It may be sleeping, try again in 20 seconds.";
        }
        await reply(errorMessage);
    }
});
