const { cmd } = require('../command');
const axios = require('axios');
const { sendButtons } = require('gifted-btns');
const { lidToPhone } = require('../lib/functions');

// Pairing from WhatsApp (.pair) always goes to THIS bot's own server.
// The older version asked other people's websites for a list of servers and sent the user's number to them,
// so anyone who typed .pair was linked to somebody else's bot. That code is gone.
const ownBase = () => `http://127.0.0.1:${process.env.PORT || 5000}`;
const ownHeaders = () => ({ 'x-panel-key': process.env.PANEL_KEY || '', 'User-Agent': 'internal' });

function getCountStatus(count) {
    if (count >= 50) return '🔴';
    if (count >= 40) return '🟣';
    if (count >= 30) return '🟡';
    if (count >= 20) return '🟠';
    if (count >= 10) return '🔵';
    return '🟢';
}

cmd({
    pattern: "status",
    alias: ["serverstatus", "stats", "servers"],
    react: "📊",
    desc: "Check server status and active users",
    category: "owner",
    use: ".status",
    filename: __filename
}, async (conn, mek, m, { reply, react, isCreator }) => {
    try {
        if (!isCreator) return reply("*📛 This is an owner command.*");
        await react('⏳');
        let count = 0, limit = 50, online = false;
        try {
            const { data } = await axios.get(ownBase() + '/api/active', { timeout: 8000, headers: ownHeaders() });
            if (data && !data.error) { count = data.count || 0; limit = data.limit || 50; online = true; }
        } catch (_) {}
        const msg = '╭──「 *SERVER STATUS* 」\n│\n' +
            '│ Status : ' + (online ? '🟢 ONLINE' : '🔴 OFFLINE') + '\n' +
            '│ Active : ' + count + '/' + limit + ' ' + getCountStatus(count) + '\n' +
            '╰─────────────────';
        await react(online ? '✅' : '❌');
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
        } else if (String(sender).includes('@lid')) {
            try {
                const converted = await lidToPhone(conn, sender);
                phoneNumber = converted ? converted.replace(/[^0-9]/g, '') : '';
            } catch { phoneNumber = ''; }
            if (!phoneNumber) {
                await react('❌');
                return reply("❌ *Could not detect your number.*\n\n📌 *Use:*\n.pair 923306137XXX");
            }
        } else {
            phoneNumber = String(senderNumber || '').replace(/[^0-9]/g, '');
        }

        if (!phoneNumber || phoneNumber.length < 10 || phoneNumber.length > 15) {
            await react('❌');
            return reply("❌ *Enter a valid number!*\n\n📌 *Example:*\n.pair 923306137XXX");
        }

        // Is there room on this server?
        try {
            const { data } = await axios.get(ownBase() + '/api/active', { timeout: 8000, headers: ownHeaders() });
            if (data && typeof data.count === 'number' && data.count >= (data.limit || 50)) {
                await react('❌');
                return reply("❌ This server is full. Try again later.");
            }
        } catch (_) {}

        const response = await axios.get(ownBase() + '/api/code', {
            params: { number: phoneNumber }, timeout: 30000, headers: ownHeaders()
        });
        if (!response || !response.data) throw new Error("No response from the server");

        const codeData = response.data.code;
        if (!codeData) {
            await react('❌');
            return reply("❌ " + (response.data.message || response.data.error || "Failed to get code. Try again in 20 seconds."));
        }

        let pairingCode = codeData.toString().trim();
        const cleanCode = pairingCode.replace(/[^A-Za-z0-9]/g, '');
        if (cleanCode.length === 8) pairingCode = cleanCode.substring(0, 4) + '-' + cleanCode.substring(4);

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
                title: '', text: pairMsg,
                buttons: [{ name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy Code', copy_code: pairingCode }) }]
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
            if (error.response.status === 403) errorMessage = "❌ Pairing is not available from here right now.";
            else if (error.response.data && error.response.data.error) errorMessage = "❌ " + error.response.data.error;
            else errorMessage = "❌ Server error: " + error.response.status;
        } else if (error.request) {
            errorMessage = "❌ No response from server. It may be sleeping, try again in 20 seconds.";
        }
        await reply(errorMessage);
    }
});
