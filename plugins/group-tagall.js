const { cmd } = require('../command');

cmd({
    pattern: "tagall",
    react: "🔊",
    alias: ["gc_tagall"],
    desc: "To Tag all Members",
    category: "group",
    use: '.tagall [message]',
    filename: __filename
},
async (conn, mek, m, { from, participants, reply, isGroup, isAdmins, isBotAdmins, isCreator, command, body }) => {
    try {
        if (!isGroup) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply("❌ This command can only be used in groups.");
        }

        if (!isBotAdmins) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply("❌ Bot must be admin to use this command.");
        }

        if (!isAdmins && !isCreator) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply("❌ Only group admins or the bot owner can use this command.");
        }

        let groupInfo = await conn.groupMetadata(from).catch(() => null);
        if (!groupInfo) return reply("❌ Failed to fetch group information.");

        let groupName = groupInfo.subject || "Unknown Group";
        let totalMembers = participants ? participants.length : 0;
        if (totalMembers === 0) return reply("❌ No members found in this group.");

        let emojis = ['📢', '🔊', '🌐', '🔰', '❤‍🩹', '🤍', '🖤', '🩵', '📝', '💗', '🔖', '🪩', '📦', '🎉', '🛡️', '💸', '⏳', '🗿', '🚀', '🎧', '🪀', '⚡', '🚩', '🍁', '🗣️', '👻', '⚠️', '🔥'];
        let randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

        let message = body.slice(body.indexOf(command) + command.length).trim();
        if (!message) message = "Attention Everyone";

        let teks = '▢ Group : *' + groupName + '*\n';
        teks += '▢ Members : *' + totalMembers + '*\n';
        teks += '▢ Message: *' + message + '*\n\n';
        teks += '┌───⊷ *MENTIONS*\n';

        for (let mem of participants) {
            if (!mem.id) continue;
            teks += randomEmoji + ' @' + mem.id.split('@')[0] + '\n';
        }

        teks += '└──✪ QUEEN 🦋 MD ✪──';

        await conn.sendMessage(from, {
            text: teks,
            mentions: participants.map(a => a.id)
        }, { quoted: mek });

    } catch (e) {
        console.error("TagAll Error:", e);
        reply('❌ *Error Occurred !!*\n\n' + (e.message || e));
    }
});
