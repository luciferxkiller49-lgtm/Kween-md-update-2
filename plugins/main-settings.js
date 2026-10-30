
const { cmd } = require('../command');
const config = require('../config');
const fs = require('fs');
const path = require('path');
const os = require('os');
const FormData = require('form-data');
const axios = require('axios');
const { lidToPhone, cleanPN } = require('../lib/functions');    

async function getTargetJid(conn, target) { 
    if (!target) return null;
    
    if (target.includes('@s.whatsapp.net')) return target;
    
    if (target.includes('@lid')) {
        const phoneNumber = await lidToPhone(conn, target);
        return phoneNumber + '@s.whatsapp.net';
    }
    
    return target.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
}

function extractNumber(jid) { 
    if (!jid) return '';
    return jid.split('@')[0];
}

function isValidNumber(target) { 
    if (!target) return false;
    const number = target.replace('@s.whatsapp.net', '').replace(/[^0-9]/g, '');
    return number.length >= 10;
}

cmd({
    pattern: "welcome",
    alias: ["welcome"],
    desc: "Toggle welcome messages",
    category: "settings",
    react: "🎉",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        return reply(`📌 *Usᴀɢᴇ:* welcome on/off\n*Cᴜʀʀᴇɴᴛ:* ${userConfig.WELCOME}`);
    }

    const value = args[0].toLowerCase();
    if (value !== 'on' && value !== 'off') {
        return reply('❌ *Pʟᴇᴀsᴇ ᴜsᴇ:* on ᴏʀ off');
    }

    const newValue = value === 'on' ? 'true' : 'false';
    userConfig.WELCOME = newValue;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Wᴇʟᴄᴏᴍᴇ sᴇᴛ ᴛᴏ:* ${newValue}`);
});

cmd({
    pattern: "goodbye",
    alias: ["goodbye"],
    desc: "Toggle goodbye messages",
    category: "settings",
    react: "👋",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        return reply(`📌 *Usᴀɢᴇ:* goodbye on/off\n*Cᴜʀʀᴇɴᴛ:* ${userConfig.GOODBYE}`);
    }

    const value = args[0].toLowerCase();
    if (value !== 'on' && value !== 'off') {
        return reply('❌ *Pʟᴇᴀsᴇ ᴜsᴇ:* on ᴏʀ off');
    }

    const newValue = value === 'on' ? 'true' : 'false';
    userConfig.GOODBYE = newValue;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Goodbye sᴇᴛ ᴛᴏ:* ${newValue}`);
});

cmd({ 
    pattern: "setwelcome",
    alias: ["setwelcome"],
    desc: "Set custom welcome message\n\n*Placeholders:*\n• @user - Mention new member\n• @group - Group name\n• @desc - Group description\n• @count - Total members\n• @bot - Bot name\n• @time - Current time",
    category: "settings",
    react: "✏️",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        return reply(`📌 *Cᴜʀʀᴇɴᴛ ᴡᴇʟᴄᴏᴍᴇ ᴍᴇssᴀɢᴇ:*\n\n${userConfig.WELCOME_MESSAGE || 'Not set'}\n\n*Usᴀɢᴇ:*.setwelcome <message>\n\n*Placeholders:*\n• @user - Mention new member\n• @group - Group name\n• @desc - Group description\n• @count - Total members\n• @bot - Bot name\n• @time - Current time`);
    }

    const welcomeMessage = args.join(' ');
    userConfig.WELCOME_MESSAGE = welcomeMessage;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Wᴇʟᴄᴏᴍᴇ ᴍᴇssᴀɢᴇ sᴇᴛ ᴛᴏ:*\n\n${welcomeMessage}`);
});

cmd({
    pattern: "setgoodbye",
    alias: ["setgoodbye"],
    desc: "Set custom goodbye message\n\n*Placeholders:*\n• @user - Mention leaving member\n• @group - Group name\n• @desc - Group description\n• @count - Total members\n• @bot - Bot name\n• @time - Current time",
    category: "settings",
    react: "✏️",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) { 
        return reply(`📌 *Cᴜʀʀᴇɴᴛ ɢᴏᴏᴅʙʏᴇ ᴍᴇssᴀɢᴇ:*\n\n${userConfig.GOODBYE_MESSAGE || 'Not set'}\n\n*Usᴀɢᴇ:*.setgoodbye <message>\n\n*Placeholders:*\n• @user - Mention leaving member\n• @group - Group name\n• @desc - Group description\n• @count - Total members\n• @bot - Bot name\n• @time - Current time`);
    }

    const goodbyeMessage = args.join(' ');
    userConfig.GOODBYE_MESSAGE = goodbyeMessage;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Goodbye ᴍᴇssᴀɢᴇ sᴇᴛ ᴛᴏ:*\n\n${goodbyeMessage}`);
});

cmd({
    pattern: "ban",
    alias: ["ban"],
    desc: "Ban a user from using the bot",
    category: "moderation",
    react: "🔨",
    filename: __filename
},
async (conn, mek, m, { from, reply, botNumber2, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    let target = m.mentionedJid?.[0] || (m.quoted?.sender ?? null);

    if (!target && args[0]) {
        const cleanedNumber = args[0].replace(/[^0-9]/g, '');
        if (cleanedNumber && cleanedNumber.length >= 10) {
            target = cleanedNumber + "@s.whatsapp.net";
        }
    }

    if (!target || !isValidNumber(target)) {
        return reply("⚠️ Please provide a target to ban!\n\n*Usage:* .ban @user or .ban 92342758**** or reply to a message");
    }

    target = await getTargetJid(conn, target);
    if (!target) return reply("❌ Invalid target format.");

    if (target === conn.user.id.split(':')[0] + '@s.whatsapp.net' || target === botNumber2) 
        return reply("🤖 I can't ban myself!");
    
    if (target.includes(extractNumber(config.OWNER_NUMBER))) {
        return reply("👑 Cannot ban the owner!");
    }

    let bannedList = Array.isArray(userConfig.BANNED) ? [...userConfig.BANNED] : [];

    if (bannedList.includes(target)) {
        return reply("❌ This user is already banned!");
    }

    bannedList.push(target);
    userConfig.BANNED = bannedList;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *User banned successfully!*\n\nUser: ${target}`);
});

cmd({
    pattern: "unban",
    alias: ["unban"],
    desc: "Unban a user from using the bot",
    category: "moderation",
    react: "🔓",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => { 
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    let target = m.mentionedJid?.[0] || (m.quoted?.sender ?? null);

    if (!target && args[0]) {
        const cleanedNumber = args[0].replace(/[^0-9]/g, '');
        if (cleanedNumber && cleanedNumber.length >= 10) {
            target = cleanedNumber + "@s.whatsapp.net";
        }
    }

    if (!target || !isValidNumber(target)) {
        return reply("⚠️ Please provide a target to unban!\n\n*Usage:* .unban @user or .unban 92342758**** or reply to a message");
    }

    target = await getTargetJid(conn, target);
    if (!target) return reply("❌ Invalid target format.");

    let bannedList = Array.isArray(userConfig.BANNED) ? [...userConfig.BANNED] : [];

    if (!bannedList.includes(target)) {
        return reply("❌ This user is not banned!");
    }

    bannedList = bannedList.filter(jid => jid !== target);
    userConfig.BANNED = bannedList;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *User unbanned successfully!*\n\nUser: ${target}`);
});

cmd({
    pattern: "banlist",
    alias: ["banlist", "banned"],
    desc: "Show list of banned users",
    category: "moderation",
    react: "📋",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    let bannedList = Array.isArray(userConfig.BANNED) ? userConfig.BANNED : [];

    if (bannedList.length === 0) { 
        return reply("📋 *No banned users found.*");
    }

    let listText = "*📋 Banned Users List:*\n\n";
    for (let i = 0; i < bannedList.length; i++) {
        const user = bannedList[i];
        const userNumber = extractNumber(user);
        listText += `${i + 1}. ${userNumber}\n`;
    }

    await reply(listText);
});

cmd({
    pattern: "sudo",
    alias: ["sudo"],
    desc: "Add a user to sudo list",
    category: "moderation",
    react: "👑",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, botNumber2, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    let target = m.mentionedJid?.[0] || (m.quoted?.sender ?? null);

    if (!target && args[0]) {
        const cleanedNumber = args[0].replace(/[^0-9]/g, '');
        if (cleanedNumber && cleanedNumber.length >= 10) {
            target = cleanedNumber + "@s.whatsapp.net";
        }
    }

    if (!target || !isValidNumber(target)) {
        return reply("⚠️ Please provide a target to add to sudo!\n\n*Usage:* .sudo @user or .sudo 92342758**** or reply to a message");
    }

    target = await getTargetJid(conn, target);
    if (!target) return reply("❌ Invalid target format.");

    if (target === conn.user.id.split(':')[0] + '@s.whatsapp.net' || target === botNumber2) 
        return reply("🤖 I can't sudo myself!");
    
    let sudoList = Array.isArray(userConfig.SUDO) ? [...userConfig.SUDO] : [];

    if (sudoList.includes(target)) {
        return reply("❌ This user is already in sudo list!");
    }

    sudoList.push(target);
    userConfig.SUDO = sudoList;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *User added to sudo list successfully!*\n\nUser: ${target}`);
});

cmd({
    pattern: "delsudo",
    alias: ["delsudo", "removesudo"],
    desc: "Remove a user from sudo list",
    category: "moderation",
    react: "👑",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) { 
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    let target = m.mentionedJid?.[0] || (m.quoted?.sender ?? null);

    if (!target && args[0]) {
        const cleanedNumber = args[0].replace(/[^0-9]/g, '');
        if (cleanedNumber && cleanedNumber.length >= 10) {
            target = cleanedNumber + "@s.whatsapp.net";
        }
    }

    if (!target || !isValidNumber(target)) {
        return reply("⚠️ Please provide a target to remove from sudo!\n\n*Usage:* .delsudo @user or .delsudo 92342758**** or reply to a message");
    }

    target = await getTargetJid(conn, target);
    if (!target) return reply("❌ Invalid target format.");

    let sudoList = Array.isArray(userConfig.SUDO) ? [...userConfig.SUDO] : [];

    if (!sudoList.includes(target)) {
        return reply("❌ This user is not in sudo list!");
    }

    sudoList = sudoList.filter(jid => jid !== target);
    userConfig.SUDO = sudoList;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *User removed from sudo list successfully!*\n\nUser: ${target}`);
});

cmd({
    pattern: "listsudo",
    alias: ["listsudo", "sudoers"],
    desc: "Show list of sudo users",
    category: "moderation",
    react: "📋",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    let sudoList = Array.isArray(userConfig.SUDO) ? userConfig.SUDO : [];

    if (sudoList.length === 0) { 
        return reply("📋 *No sudo users found.*");
    }

    let listText = "*📋 Sudo Users List:*\n\n";
    for (let i = 0; i < sudoList.length; i++) {
        const user = sudoList[i];
        const userNumber = extractNumber(user);
        listText += `${i + 1}. ${userNumber}\n`;
    }

    await reply(listText);
});

cmd({
    pattern: "antiedit",
    alias: ["antiedit"],
    desc: "Toggle anti-edit feature (detects and shows edited messages)",
    category: "settings",
    react: "✏️",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        return reply(`📌 *Usᴀɢᴇ:* antiedit on/off\n*Cᴜʀʀᴇɴᴛ:* ${userConfig.ANTI_EDIT}\n\n*Eᴅɪᴛ Pᴀᴛʜ:* ${userConfig.ANTIEDIT_PATH || 'inbox'}\n\n*Tᴏ ᴄʜᴀɴɢᴇ ᴇᴅɪᴛ ᴘᴀᴛʜ ᴜsᴇ:*.editpath <inbox/same>`);
    }

    const value = args[0].toLowerCase();
    if (value !== 'on' && value !== 'off') {
        return reply('❌ *Pʟᴇᴀsᴇ ᴜsᴇ:* on ᴏʀ off');
    }

    const newValue = value === 'on' ? 'true' : 'false';
    userConfig.ANTI_EDIT = newValue;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Aɴᴛɪ-ᴇᴅɪᴛ sᴇᴛ ᴛᴏ:* ${newValue}\n*Eᴅɪᴛ ᴘᴀᴛʜ:* ${userConfig.ANTIEDIT_PATH || 'inbox'}`);
});

cmd({
    pattern: "editpath",
    alias: ["editpath"],
    desc: "Set where to show edited messages\n\n*Options:*\n• inbox - Send in inbox (default)\n• same - Send in the same chat where message was edited",
    category: "settings",
    react: "📍",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        return reply(`📌 *Usᴀɢᴇ:* editpath inbox/same\n*Cᴜʀʀᴇɴᴛ ᴘᴀᴛʜ:* ${userConfig.ANTIEDIT_PATH || 'inbox'}\n\n*Oᴘᴛɪᴏɴs:*\n• inbox - Send edited message notification in inbox\n• same - Send edited message notification in the same chat`);
    }

    const value = args[0].toLowerCase();
    if (value !== 'inbox' && value !== 'same') {
        return reply('❌ *Pʟᴇᴀsᴇ ᴜsᴇ:* inbox ᴏʀ same');
    }

    userConfig.ANTIEDIT_PATH = value;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Eᴅɪᴛ ᴘᴀᴛʜ sᴇᴛ ᴛᴏ:* ${value}\n*Aɴᴛɪ-ᴇᴅɪᴛ sᴛᴀᴛᴜs:* ${userConfig.ANTI_EDIT || 'false'}`);
});

cmd({
    pattern: "autoread",
    alias: ["autoread", "readmsg", "autoreadmsg"],
    desc: "Toggle auto-read messages feature",
    category: "settings",
    react: "👁️",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        return reply(`📌 *Usᴀɢᴇ:* autoread on/off\n*Cᴜʀʀᴇɴᴛ:* ${userConfig.READ_MESSAGE || 'false'}\n\n*Wʜᴇɴ ᴇɴᴀʙʟᴇᴅ, ᴛʜᴇ ʙᴏᴛ ᴡɪʟʟ ᴀᴜᴛᴏᴍᴀᴛɪᴄᴀʟʟʏ ᴍᴀʀᴋ ᴍᴇssᴀɢᴇs ᴀs ʀᴇᴀᴅ.*`);
    }

    const value = args[0].toLowerCase();
    if (value !== 'on' && value !== 'off') {
        return reply('❌ *Pʟᴇᴀsᴇ ᴜsᴇ:* on ᴏʀ off');
    }

    const newValue = value === 'on' ? 'true' : 'false';
    userConfig.READ_MESSAGE = newValue;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Aᴜᴛᴏ-ʀᴇᴀᴅ sᴇᴛ ᴛᴏ:* ${newValue}\n\n${newValue === 'true' ? '🔵 Bot will now automatically mark messages as read.' : '⚪ Bot will not automatically mark messages as read.'}`);
});

cmd({
    pattern: "antilink",
    alias: ["linkblock"],
    desc: "Toggle anti-link protection (on/off)",
    category: "settings",
    react: "🚫",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        return reply(`📌 *Usᴀɢᴇ:* antilink on/off\n*Cᴜʀʀᴇɴᴛ:* ${userConfig.ANTI_LINK || 'false'}\n\n*Aᴄᴛɪᴏɴ:* ${userConfig.ANTI_LINK_ACTION || 'warn'}\n*Tᴏ ᴄʜᴀɴɢᴇ ᴀᴄᴛɪᴏɴ ᴜsᴇ:*.antilinkaction delete/warn/kick`);
    }

    const value = args[0].toLowerCase();
    if (value !== 'on' && value !== 'off') {
        return reply("❌ Please use: on or off");
    }

    const newValue = value === 'on' ? 'true' : 'false';
    userConfig.ANTI_LINK = newValue;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Aɴᴛɪ-ʟɪɴᴋ sᴇᴛ ᴛᴏ:* ${newValue}\n*Cᴜʀʀᴇɴᴛ Aᴄᴛɪᴏɴ:* ${userConfig.ANTI_LINK_ACTION || 'warn'}`);
});

cmd({
    pattern: "antilinkaction",
    alias: ["linkaction", "setlinkaction"],
    desc: "Set action for anti-link violation (delete/warn/kick)",
    category: "settings",
    react: "⚡",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        return reply(`📌 *Usᴀɢᴇ:* antilinkaction delete/warn/kick\n*Cᴜʀʀᴇɴᴛ:* ${userConfig.ANTI_LINK_ACTION || 'warn'}`);
    }

    const value = args[0].toLowerCase();
    if (value !== 'delete' && value !== 'warn' && value !== 'kick') {
        return reply('❌ *Pʟᴇᴀsᴇ ᴜsᴇ:* delete, warn, ᴏʀ kick');
    }

    userConfig.ANTI_LINK_ACTION = value;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Aɴᴛɪ-Lɪɴᴋ Aᴄᴛɪᴏɴ sᴇᴛ ᴛᴏ:* ${value}`);
});

cmd({
    pattern: "antidelete",
    alias: ["antidel", "delblock"],
    desc: "Toggle anti-delete message protection",
    category: "settings",
    react: "🗑️",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        return reply(`📌 *Usᴀɢᴇ:* antidelete on/off\n*Cᴜʀʀᴇɴᴛ:* ${userConfig.ANTI_DELETE || 'false'}`);
    }

    const value = args[0].toLowerCase();
    if (value !== 'on' && value !== 'off') {
        return reply('❌ *Pʟᴇᴀsᴇ ᴜsᴇ:* on ᴏʀ off');
    }

    const newValue = value === 'on' ? 'true' : 'false';
    userConfig.ANTI_DELETE = newValue;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Aɴᴛɪ Dᴇʟᴇᴛᴇ sᴇᴛ ᴛᴏ:* ${newValue}\n\nWhen ON: Bot will detect and notify when messages are deleted.`);
});

cmd({
    pattern: "recording",
    alias: ["autorecording"],
    desc: "Toggle auto recording presence",
    category: "settings",
    react: "🎙️",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴ ANᴅ.*");
    }

    if (!args[0]) {
        return reply(`📌 *Usᴀɢᴇ:* autorecord on/off\n*Cᴜʀʀᴇɴᴛ:* ${userConfig.AUTO_RECORDING}`);
    }

    const value = args[0].toLowerCase();
    if (value !== 'on' && value !== 'off') {
        return reply('❌ *Pʟᴇᴀsᴇ ᴜsᴇ:* on ᴏʀ off');
    }

    const newValue = value === 'on' ? 'true' : 'false';
    userConfig.AUTO_RECORDING = newValue;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Aᴜᴛᴏ Rᴇᴄᴏʀᴅɪɴɢ sᴇᴛ ᴛᴏ:* ${newValue}`);
});

cmd({
    pattern: "statusview",
    alias: ["autoview"],
    desc: "Toggle auto view status",
    category: "settings",
    react: "👁️",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        return reply(`📌 *Usᴀɢᴇ:* autoview on/off\n*Cᴜʀʀᴇɴᴛ:* ${userConfig.AUTO_STATUS_SEEN}`);
    }

    const value = args[0].toLowerCase();
    if (value !== 'on' && value !== 'off') {
        return reply('❌ *Pʟᴇᴀsᴇ ᴜsᴇ:* on ᴏʀ off');
    }

    const newValue = value === 'on' ? 'true' : 'false';
    userConfig.AUTO_STATUS_SEEN = newValue;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Aᴜᴛᴏ Vɪᴇᴡ Sᴛᴀᴛᴜs sᴇᴛ ᴛᴏ:* ${newValue}`);
});

cmd({
    pattern: "autoreact",
    alias: ["autoreaction", "reactauto"],
    desc: "Toggle auto react to messages",
    category: "settings",
    react: "🤖",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        return reply(`📌 *Usᴀɢᴇ:* autoreact on/off\n*Cᴜʀʀᴇɴᴛ:* ${userConfig.AUTO_REACT}`);
    }

    const value = args[0].toLowerCase();
    if (value !== 'on' && value !== 'off') {
        return reply('❌ *Pʟᴇᴀsᴇ ᴜsᴇ:* on ᴏʀ off');
    }

    const newValue = value === 'on' ? 'true' : 'false';
    userConfig.AUTO_REACT = newValue;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Aᴜᴛᴏ Rᴇᴀᴄᴛ sᴇᴛ ᴛᴏ:* ${newValue}\n\nBot will ${newValue === 'true' ? 'now' : 'no longer'} automatically react to messages.`);
});

cmd({
    pattern: "anticall",
    alias: ["antcall", "callblock"],
    desc: "Toggle anti-call protection",
    category: "settings",
    react: "📵",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        return reply(`📌 *Usᴀɢᴇ:* anticall on/off\n*Cᴜʀʀᴇɴᴛ:* ${userConfig.ANTI_CALL || 'false'}`);
    }

    const value = args[0].toLowerCase();
    if (value !== 'on' && value !== 'off') {
        return reply('❌ *Pʟᴇᴀsᴇ ᴜsᴇ:* on ᴏʀ off');
    }

    const newValue = value === 'on' ? 'true' : 'false';
    userConfig.ANTI_CALL = newValue;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Aɴᴛɪ-Cᴀʟʟ sᴇᴛ ᴛᴏ:* ${newValue}\n\nWhen ON: Bot will automatically reject incoming calls and send a rejection message.`);
});

cmd({
    pattern: "anticallmsg",
    alias: ["callmsg", "rejectmsg"],
    desc: "Set custom anti-call rejection message",
    category: "settings",
    react: "📝",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        const currentMsg = userConfig.REJECT_MSG || config.REJECT_MSG || "*📞 ᴄαℓℓ ɴσт αℓℓσωє∂ ιɴ тнιѕ ɴᴜмвєʀ уσυ ∂σɴт нανє ᴘєʀмιѕѕισɴ 📵*";
        return reply(`📌 *Cᴜʀʀᴇɴᴛ Rᴇᴊᴇᴄᴛ Mᴇssᴀɢᴇ:*\n${currentMsg}\n\n*Usᴀɢᴇ:* anticallmsg <your message>\n\nExᴀᴍᴘʟᴇ: anticallmsg Calls are not allowed on this number`);
    }

    const newMsg = args.join(' ');
    
    userConfig.REJECT_MSG = newMsg;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Aɴᴛɪ-Cᴀʟʟ Rᴇᴊᴇᴄᴛ Mᴇssᴀɢᴇ sᴇᴛ ᴛᴏ:*\n${newMsg}`);
});

cmd({
    pattern: "adminaction",
    alias: ["adminnotify"],
    desc: "Toggle admin action notifications",
    category: "settings",
    react: "👑",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        return reply(`📌 *Usᴀɢᴇ:* adminaction on/off\n*Cᴜʀʀᴇɴᴛ:* ${userConfig.ADMIN_ACTION}`);
    }

    const value = args[0].toLowerCase();
    if (value !== 'on' && value !== 'off') {
        return reply('❌ *Pʟᴇᴀsᴇ ᴜsᴇ:* on ᴏʀ off');
    }

    const newValue = value === 'on' ? 'true' : 'false';
    userConfig.ADMIN_ACTION = newValue;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Aᴅᴍɪɴ Aᴄᴛɪᴏɴ Nᴏᴛɪғɪᴄᴀᴛɪᴏɴs sᴇᴛ ᴛᴏ:* ${newValue}`);
});

cmd({
    pattern: "autotyping",
    alias: ["typing"],
    desc: "Toggle auto typing in chats",
    category: "settings",
    react: "⌨️",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        return reply(`📌 *Usᴀɢᴇ:* autotyping on/off\n*Cᴜʀʀᴇɴᴛ:* ${userConfig.AUTO_TYPING || 'false'}`);
    }

    const value = args[0].toLowerCase();
    if (value !== 'on' && value !== 'off') {
        return reply('❌ *Pʟᴇᴀsᴇ ᴜsᴇ:* on ᴏʀ off');
    }

    const newValue = value === 'on' ? 'true' : 'false';
    userConfig.AUTO_TYPING = newValue;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Aᴜᴛᴏ Tʏᴘɪɴɢ sᴇᴛ ᴛᴏ:* ${newValue}\n\nWhen ON: Bot will show typing indicator in chats.`);
});

cmd({
    pattern: "online",
    alias: ["alwaysonline", "alwayson"],
    desc: "Toggle always online status",
    category: "settings",
    react: "💚",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        return reply(`📌 *Usᴀɢᴇ:* online on/off\n*Cᴜʀʀᴇɴᴛ:* ${userConfig.ALWAYS_ONLINE || 'false'}`);
    }

    const value = args[0].toLowerCase();
    if (value !== 'on' && value !== 'off') {
        return reply('❌ *Pʟᴇᴀsᴇ ᴜsᴇ:* on ᴏʀ off');
    }

    const newValue = value === 'on' ? 'true' : 'false';
    userConfig.ALWAYS_ONLINE = newValue;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Aʟᴡᴀʏs Oɴʟɪɴᴇ sᴇᴛ ᴛᴏ:* ${newValue}\n\nWhen ON: Bot will always show online status.`);
});

cmd({
    pattern: "mode",
    alias: ["mod"],
    desc: "Change bot mode (public/private/inbox)",
    category: "settings",
    react: "🌐",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        return reply(`📌 *Usᴀɢᴇ:* mode public/private/inbox\n*Cᴜʀʀᴇɴᴛ:* ${userConfig.MODE}`);
    }

    const mode = args[0].toLowerCase();
    if (!['public', 'private', 'inbox'].includes(mode)) {
        return reply('❌ *Aᴠᴀɪʟᴀʙʟᴇ ᴍᴏᴅᴇs:* public, private, inbox');
    }

    userConfig.MODE = mode;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    const modeDescriptions = { 
        public: 'Cᴏᴍᴍᴀɴᴅs ᴡᴏʀᴋ ᴇᴠᴇʀʏᴡʜᴇʀᴇ',
        private: 'Oɴʟʏ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅs ᴡᴏʀᴋ',
        inbox: 'Cᴏᴍᴍᴀɴᴅs ᴡᴏʀᴋ ᴏɴʟʏ ɪɴ ᴘʀɪᴠᴀᴛᴇ ᴄʜᴀᴛs'
    };
    
    await reply(`✅ *Bᴏᴛ ᴍᴏᴅᴇ sᴇᴛ ᴛᴏ:* ${mode}\n📝 *Dᴇsᴄʀɪᴘᴛɪᴏɴ:* ${modeDescriptions[mode]}`);
});

cmd({
    pattern: "prefix",
    desc: "Change command prefix",
    category: "settings",
    react: "🪟",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        return reply(`📌 *Usᴀɢᴇ:* prefix <new_prefix>\n*Cᴜʀʀᴇɴᴛ:* ${userConfig.PREFIX}`);
    }

    const newPrefix = args[0];
    if (newPrefix.length > 2) {
        return reply('❌ *Pʀᴇғɪx ᴍᴜsᴛ ʙᴇ 1-2 ᴄʜᴀʀᴀᴄᴛᴇʀs ᴍᴀx*');
    }

    userConfig.PREFIX = newPrefix;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Pʀᴇғɪx ᴄʜᴀɴɢᴇᴅ ᴛᴏ:* ${newPrefix}\n\n*Exᴀᴍᴘʟᴇ:* ${newPrefix}menu`);
});

cmd({
    pattern: "botname",
    alias: ["name"],
    desc: "Change bot name",
    category: "settings",
    react: "🤖",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        return reply(`📌 *Usᴀɢᴇ:* botname <new_name>\n*Cᴜʀʀᴇɴᴛ:* ${config.BOT_NAME}`);
    }

    const newName = args.join(' ');
    if (newName.length > 30) { 
        return reply('❌ *Bᴏᴛ ɴᴀᴍᴇ ᴍᴜsᴛ ʙᴇ ᴜɴᴅᴇʀ 30 ᴄʜᴀʀᴀᴄᴛᴇʀs*');
    }

    userConfig.BOT_NAME = newName;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Bᴏᴛ ɴᴀᴍᴇ sᴇᴛ ᴛᴏ:* ${newName}`);
});

cmd({
    pattern: "ownername",
    alias: ["owner"],
    desc: "Change owner name",
    category: "settings",
    react: "👑",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        return reply(`📌 *Usᴀɢᴇ:* ownername <new_name>\n*Cᴜʀʀᴇɴᴛ:* ${userConfig.OWNER_NAME || config.OWNER_NAME}`);
    }

    const newName = args.join(' ');
    if (newName.length > 30) {
        return reply('❌ *Oᴡɴᴇʀ ɴᴀᴍᴇ ᴍᴜsᴛ ʙᴇ ᴜɴᴅᴇʀ 30 ᴄʜᴀʀᴀᴄᴛᴇʀs*');
    }

    userConfig.OWNER_NAME = newName;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Oᴡɴᴇʀ ɴᴀᴍᴇ sᴇᴛ ᴛᴏ:* ${newName}`);
});

cmd({
    pattern: "ownernumber",
    alias: ["ownernum", "ownerphone"],
    desc: "Change owner number",
    category: "settings",
    react: "📞",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        return reply(`📌 *Usᴀɢᴇ:* ownernumber <new_number>\n*Cᴜʀʀᴇɴᴛ:* ${userConfig.OWNER_NUMBER || config.OWNER_NUMBER}`);
    }

    const newNumber = args[0];
    if (!newNumber.match(/^\d{10,15}$/)) {
        return reply('❌ *Pʟᴇᴀsᴇ ᴇɴᴛᴇʀ ᴀ ᴠᴀʟɪᴅ ᴘʜᴏɴᴇ ɴᴜᴍʙᴇʀ (10-15 ᴅɪɢɪᴛs)*');
    }

    userConfig.OWNER_NUMBER = newNumber;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Oᴡɴᴇʀ ɴᴜᴍʙᴇʀ sᴇᴛ ᴛᴏ:* ${newNumber}`);
});

cmd({
    pattern: "description",
    alias: ["desc", "about"],
    desc: "Change bot description",
    category: "settings",
    react: "📝",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        return reply(`📌 *Usᴀɢᴇ:* description <new_description>\n*Cᴜʀʀᴇɴᴛ:* ${userConfig.DESCRIPTION || config.DESCRIPTION}`);
    }

    const newDesc = args.join(' ');
    if (newDesc.length > 200) {
        return reply('❌ *Dᴇsᴄʀɪᴘᴛɪᴏɴ ᴍᴜsᴛ ʙᴇ ᴜɴᴅᴇʀ 200 ᴄʜᴀʀᴀᴄᴛᴇʀs*');
    }

    userConfig.DESCRIPTION = newDesc;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Bᴏᴛ ᴅᴇsᴄʀɪᴘᴛɪᴏʀ sᴇᴛ ᴛᴏ:* ${newDesc}`);
});

cmd({
    pattern: "botdp",
    alias: ["botimage", "botpic", "botphoto"],
    desc: "Set bot display picture",
    category: "settings",
    react: "🖼️",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    let imageUrl = args[0];

    if (!imageUrl && m.quoted) {
        const quotedMsg = m.quoted;
        const mimeType = (quotedMsg.msg || quotedMsg).mimetype || '';
        if (!mimeType.startsWith("image")) return reply("❌ Please reply to an image.");

        const mediaBuffer = await quotedMsg.download();
        const extension = mimeType.includes("jpeg") ? ".jpg" : ".png";
        const tempFilePath = path.join(os.tmpdir(), `botimg_${Date.now()}${extension}`);
        fs.writeFileSync(tempFilePath, mediaBuffer);

        const form = new FormData();
        form.append("fileToUpload", fs.createReadStream(tempFilePath), `botimage${extension}`);
        form.append("reqtype", "fileupload");

        const response = await axios.post("https://catbox.moe/user/api.php", form, { 
            headers: form.getHeaders()
        });

        fs.unlinkSync(tempFilePath);

        if (typeof response.data !== 'string' || !response.data.startsWith('https://')) {
            throw new Error(`Catbox upload failed: ${response.data}`);
        }

        imageUrl = response.data;
    }

    if (!imageUrl || !imageUrl.startsWith("http")) {
        return reply("❌ Provide a valid image URL or reply to an image.");
    }

    userConfig.BOT_IMAGE = imageUrl;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await conn.sendMessage(from, { 
        image: { url: imageUrl },
        caption: `✅ *Bᴏᴛ Dɪsᴘʟᴀʏ Pɪᴄᴛᴜʀᴇ ᴜᴘᴅᴀᴛᴇᴅ!*\n\n📁 *Image URL:* ${imageUrl}\n\nImage will be used as bot's profile picture.`
    }, { quoted: mek });
});

cmd({
    pattern: "stickername",
    alias: ["stickertext", "stname"],
    desc: "Set sticker pack name",
    category: "settings",
    react: "🖼️",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        const currentName = userConfig.STICKER_NAME || 'Sticker Pack';
        return reply(`📌 *Usᴀɢᴇ:*.stickername Your Pack Name\n*Cᴜʀʀᴇɴᴛ:* ${currentName}`);
    }

    const stickerName = args.join(' ');
    
    userConfig.STICKER_NAME = stickerName;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Sᴛɪᴄᴋᴇʀ ᴘᴀᴄᴋ ɴᴀᴍᴇ sᴇᴛ ᴛᴏ:* ${stickerName}`);
});

cmd({
    pattern: "delpath",
    alias: ["deletepath", "antideletepath"],
    desc: "Set anti-delete path (same/inbox)",
    category: "settings",
    react: "🗑️",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        return reply(`📌 *Usᴀɢᴇ:*.delpath same/inbox\n*Cᴜʀʀᴇɴᴛ:* ${userConfig.ANTI_DELETE_PATH || 'inbox'}`);
    }

    const value = args[0].toLowerCase();
    if (value !== 'same' && value !== 'inbox') {
        return reply('❌ *Pʟᴇᴀsᴇ ᴜsᴇ:* same ᴏʀ inbox\n- *same*: Delete from same chat\n- *inbox*: Delete only from inbox');
    }

    userConfig.ANTI_DELETE_PATH = value;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Aɴᴛɪ-ᴅᴇʟᴇᴛᴇ ᴘᴀᴛʜ sᴇᴛ ᴛᴏ:* ${value}`);
});

cmd({
    pattern: "reactemojis",
    alias: ["reacts", "reactset"],
    desc: "Set auto react emojis",
    category: "settings",
    react: "😂",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        const currentEmojis = userConfig.REACT_EMOJIS || ['😂', '❤️', '🔥', '👏', '😮', '😢', '🤣', '👍', '🎉', '🤔', '🙏', '😍', '😊', '🥰', '💕', '🤩', '✨', '😎', '🥳', '🙌'];
        return reply(`📌 *Usᴀɢᴇ:*.reactemojis 😂,❤️,🔥,👏,😮\n*Cᴜʀʀᴇɴᴛ:* ${currentEmojis.join(', ')}`);
    }

    const input = args.join(' ');
    
    const consecutiveEmojisRegex = /[\p{Emoji}\u200d]+(?![,])[\p{Emoji}\u200d]+/gu;
    
    if (consecutiveEmojisRegex.test(input)) {
        return reply('❌ *Iɴᴠᴀʟɪᴅ ғᴏʀᴍᴀᴛ! Pʟᴇᴀsᴇ sᴇᴘᴀʀᴀᴛᴇ ᴀʟʟ ᴇᴍᴏᴊɪs ᴡɪᴛʜ ᴄᴏᴍᴍᴀs*\n*Exᴀᴍᴘʟᴇ:*.reactemojis 😂,❤️,🔥,👏,😮');
    }
    
    const emojis = input.split(',').map(e => e.trim()).filter(e => e);
    
    const invalidEntries = emojis.filter(emoji => {
        const hasMultipleEmojis = Array.from(emoji).some((c, i, arr) => {
            if (i === 0) return false;
            const prev = arr[i-1];
            const regex = /\p{Emoji}/u;
            return regex.test(c) && regex.test(prev) && c !== '\u200d' && prev !== '\u200d';
        });
        
        return hasMultipleEmojis;
    });
    
    if (invalidEntries.length > 0) {
        return reply('❌ *Iɴᴠᴀʟɪᴅ ғᴏʀᴍᴀᴛ! Dᴏɴ\'ᴛ ᴜsᴇ ᴍᴜʟᴛɪᴘʟᴇ ᴇᴍᴏᴊɪs ᴡɪᴛʜᴏᴜᴛ ᴄᴏᴍᴍᴀs*\n*Exᴀᴍᴘʟᴇ:*.reactemojis 😂,❤️,🔥,👏,😮');
    }
    
    if (emojis.length === 0) {
        return reply('❌ *Pʟᴇᴀsᴇ ᴘʀᴏᴠɪᴅᴇ ᴠᴀʟɪᴅ ᴇᴍᴏᴊɪs*');
    }

    userConfig.REACT_EMOJIS = emojis;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Aᴜᴛᴏ ʀᴇᴀᴄᴛ ᴇᴍᴏᴊɪs sᴇᴛ:*\n${emojis.join(', ')}`);
});

cmd({
    pattern: "owneremojis",
    alias: ["owneremojiset", "ownerreacts"],
    desc: "Set owner emojis for reactions",
    category: "settings",
    react: "👑",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        const currentEmojis = userConfig.OWNER_EMOJIS || ['👑', '⭐', '💎', '🌟', '✨', '⚡', '🔥', '❤️', '💕', '🎯'];
        return reply(`📌 *Usᴀɢᴇ:*.owneremojis 👑,⭐,💎,🌟,✨\n*Cᴜʀʀᴇɴᴛ:* ${currentEmojis.join(', ')}`);
    }

    const input = args.join(' ');
    
    const consecutiveEmojisRegex = /[\p{Emoji}\u200d]+(?![,])[\p{Emoji}\u200d]+/gu;
    
    if (consecutiveEmojisRegex.test(input)) {
        return reply('❌ *Iɴᴠᴀʟɪᴅ ғᴏʀᴍᴀᴛ! Pʟᴇᴀsᴇ sᴇᴘᴀʀᴀᴛᴇ ᴀʟʟ ᴇᴍᴏᴊɪs ᴡɪᴛʜ ᴄᴏᴍᴍᴀs*\n*Exᴀᴍᴘʟᴇ:*.owneremojis 👑,⭐,💎,🌟,✨');
    }
    
    const emojis = input.split(',').map(e => e.trim()).filter(e => e);
    
    const invalidEntries = emojis.filter(emoji => {
        const hasMultipleEmojis = Array.from(emoji).some((c, i, arr) => {
            if (i === 0) return false;
            const prev = arr[i-1];
            const regex = /\p{Emoji}/u;
            return regex.test(c) && regex.test(prev) && c !== '\u200d' && prev !== '\u200d';
        });
        
        return hasMultipleEmojis;
    });
    
    if (invalidEntries.length > 0) {
        return reply('❌ *Iɴᴠᴀʟɪᴅ ғᴏʀᴍᴀᴛ! Dᴏɴ\'ᴛ ᴜsᴇ ᴍᴜʟᴛɪᴘʟᴇ ᴇᴍᴏᴊɪs ᴡɪᴛʜᴏᴜᴛ ᴄᴏᴍᴍᴀs*\n*Exᴀᴍᴘʟᴇ:*.owneremojis 👑,⭐,💎,🌟,✨');
    }
    
    if (emojis.length === 0) {
        return reply('❌ *Pʟᴇᴀsᴇ ᴘʀᴏᴠɪᴅᴇ ᴠᴀʟɪᴅ ᴇᴍᴏᴊɪs*');
    }

    userConfig.OWNER_EMOJIS = emojis;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Oᴡɴᴇʀ ᴇᴍᴏᴊɪs sᴇᴛ:*\n${emojis.join(', ')}`);
});

cmd({
    pattern: "heartreact",
    alias: ["heartreaction"],
    desc: "Toggle heart reactions on owner messages",
    category: "settings",
    react: "❤️",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        return reply(`📌 *Usᴀɢᴇ:* heartreact on/off\n*Cᴜʀʀᴇɴᴛ:* ${userConfig.HEART_REACT || 'false'}`);
    }

    const value = args[0].toLowerCase();
    if (value !== 'on' && value !== 'off') {
        return reply('❌ *Pʟᴇᴀsᴇ ᴜsᴇ:* on ᴏʀ off');
    }

    const newValue = value === 'on' ? 'true' : 'false';
    userConfig.HEART_REACT = newValue;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Hᴇᴀʀᴛ Rᴇᴀᴄᴛ sᴇᴛ ᴛᴏ:* ${newValue}`);
});

cmd({
    pattern: "customreact",
    alias: ["customreaction"],
    desc: "Toggle custom emojis reaction",
    category: "settings",
    react: "⚙️",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        return reply(`📌 *Usᴀɢᴇ:* customreact on/off\n*Cᴜʀʀᴇɴᴛ:* ${userConfig.CUSTOM_REACT || 'false'}`);
    }

    const value = args[0].toLowerCase();
    if (value !== 'on' && value !== 'off') {
        return reply('❌ *Pʟᴇᴀsᴇ ᴜsᴇ:* on ᴏʀ off');
    }

    const newValue = value === 'on' ? 'true' : 'false';
    userConfig.CUSTOM_REACT = newValue;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Cᴜsᴛᴏᴍ Rᴇᴀᴄᴛ sᴇᴛ ᴛᴏ:* ${newValue}`);
});

cmd({
    pattern: "customemojis",
    alias: ["customemoji", "emojiscustom"],
    desc: "Set custom emojis for reactions",
    category: "settings",
    react: "✨",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        const currentEmojis = userConfig.CUSTOM_EMOJIS || ['😊', '👍', '🚀', '💻', '🎉', '🔥'];
        return reply(`📌 *Usᴀɢᴇ:*.customemojis 😊,👍,🚀,💻,🎉,🔥\n*Cᴜʀʀᴇɴᴛ:* ${currentEmojis.join(', ')}`);
    }

    const input = args.join(' ');
    
    const consecutiveEmojisRegex = /[\p{Emoji}\u200d]+(?![,])[\p{Emoji}\u200d]+/gu;
    
    if (consecutiveEmojisRegex.test(input)) {
        return reply('❌ *Iɴᴠᴀʟɪᴅ ғᴏʀᴍᴀᴛ! Pʟᴇᴀsᴇ sᴇᴘᴀʀᴀᴛᴇ ᴀʟʟ ᴇᴍᴏᴊɪs ᴡɪᴛʜ ᴄᴏᴍᴍᴀs*\n*Exᴀᴍᴘʟᴇ:*.customemojis 😊,👍,🚀,💻,🎉,🔥');
    }
    
    const emojis = input.split(',').map(e => e.trim()).filter(e => e);
    
    const invalidEntries = emojis.filter(emoji => {
        const hasMultipleEmojis = Array.from(emoji).some((c, i, arr) => {
            if (i === 0) return false;
            const prev = arr[i-1];
            const regex = /\p{Emoji}/u;
            return regex.test(c) && regex.test(prev) && c !== '\u200d' && prev !== '\u200d';
        });
        
        return hasMultipleEmojis;
    });
    
    if (invalidEntries.length > 0) {
        return reply('❌ *Iɴᴠᴀʟɪᴅ ғᴏʀ`ᴍᴀᴛ! Dᴏɴ\'ᴛ ᴜsᴇ ᴍᴜʟᴛɪᴘʟᴇ ᴇᴍᴏᴊɪs ᴡɪᴛʜᴏᴜᴛ ᴄᴏᴍᴍᴀs*\n*Exᴀᴍᴘʟᴇ:*.customemojis 😊,👍,🚀,💻,🎉,🔥');
    }
    
    if (emojis.length === 0) {
        return reply('❌ *Pʟᴇᴀsᴇ ᴘʀᴏᴠɪᴅᴇ ᴠᴀʟɪᴅ ᴇᴍᴏᴊɪs*');
    }

    userConfig.CUSTOM_EMOJIS = emojis;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Cᴜsᴛᴏᴍ ᴇᴍᴏᴊɪs sᴇᴛ:*\n${emojis.join(', ')}`);
});

cmd({
    pattern: "statusreact",
    alias: ["autostatusreact"],
    desc: "Toggle automatic reaction to statuses",
    category: "settings",
    react: "💚",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        return reply(`📌 *Usᴀɢᴇ:* statusreact on/off\n*Cᴜʀʀᴇɴᴛ:* ${userConfig.AUTO_STATUS_REACT || 'false'}`);
    }

    const value = args[0].toLowerCase();
    if (value !== 'on' && value !== 'off') {
        return reply('❌ *Pʟᴇᴀsᴇ ᴜsᴇ:* on ᴏʀ off');
    }

    const newValue = value === 'on' ? 'true' : 'false';
    userConfig.AUTO_STATUS_REACT = newValue;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Aᴜᴛᴏ Sᴛᴀᴛᴜs Rᴇᴀᴄᴛ sᴇᴛ ᴛᴏ:* ${newValue}`);
});

cmd({
    pattern: "statusreply",
    alias: ["autostatusreply"],
    desc: "Toggle automatic reply to statuses",
    category: "settings",
    react: "💬",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        return reply(`📌 *Usᴀɢᴇ:* statusreply on/off\n*Cᴜʀʀᴇɴᴛ:* ${userConfig.AUTO_STATUS_REPLY || 'false'}`);
    }

    const value = args[0].toLowerCase();
    if (value !== 'on' && value !== 'off') {
        return reply('❌ *Pʟᴇᴀsᴇ ᴜsᴇ:* on ᴏʀ off');
    }

    const newValue = value === 'on' ? 'true' : 'false';
    userConfig.AUTO_STATUS_REPLY = newValue;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Aᴜᴛᴏ Sᴛᴀᴛᴜs Rᴇᴘʟʏ sᴇᴛ ᴛᴏ:* ${newValue}`);
});

cmd({
    pattern: "statusreplymsg",
    alias: ["statusreplymessage", "statmsg"],
    desc: "Set custom status reply message",
    category: "settings",
    react: "📝",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        const currentMsg = userConfig.STATUS_REPLY_MSG || config.STATUS_REPLY_MSG || "*_Your status viewed successfully by NAVEED-MD MINI 🤖_*";
        return reply(`📌 *Cᴜʀʀᴇɴᴛ Sᴛᴀᴛᴜs Rᴇᴘʟʏ Mᴇssᴀɢᴇ:*\n${currentMsg}\n\n*Usᴀɢᴇ:* statusreplymsg <your message>`);
    }

    const newMsg = args.join(' ');
    userConfig.STATUS_REPLY_MSG = newMsg;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *Sᴛᴀᴛᴜs Rᴇᴘʟʏ Mᴇssᴀɢᴇ sᴇᴛ ᴛᴏ:*\n${newMsg}`);
});

const normalizeId = (id) => {
    if (!id) return '';
    return id
        .replace(/:[0-9]+/g, '')
        .replace(/@(lid|s.whatsapp.net|c.us|g.us)/g, '')
        .replace(/[^\d]/g, '');
};

cmd({
    pattern: "chatbot",
    desc: "Toggle chatbot ON/OFF (self=global, chat/group=only there)",
    category: "settings",
    react: "🤖",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }

    if (!args[0]) {
        const g = userConfig.CHATBOT || 'false';
        const map = userConfig.CHATBOT_CHATS || {};
        const local = map[from];
        return reply(
            `📌 *Usᴀɢᴇ:* chatbot on/off\n` +
            `*Global:* ${g}\n` +
            `*This chat:* ${local === undefined ? 'follow global' : local}`
        );
    }

    const value = args[0].toLowerCase();
    if (value !== 'on' && value !== 'off') {
        return reply('❌ *Pʟᴇᴀsᴇ ᴜsᴇ:* on ᴏʀ off');
    }

    const newValue = value === 'on' ? 'true' : 'false';

    const isGroup = typeof from === 'string' && from.endsWith('@g.us');
    const chatId = normalizeId(from);
    const myIds = [
        normalizeId(sanitizedNumber),
        normalizeId(conn.user?.id),
        normalizeId(conn.user?.lid)
    ].filter(Boolean);

    const isSelf = !isGroup && chatId !== '' && myIds.includes(chatId);

    if (isSelf) {
        userConfig.CHATBOT = newValue;
        userConfig.CHATBOT_CHATS = {};
        await updateUserConfig(sanitizedNumber, userConfig);
        return reply(`✅ *Chatbot GLOBAL:* ${newValue}\n(All chats/groups)`);
    }

    if (!userConfig.CHATBOT_CHATS || typeof userConfig.CHATBOT_CHATS !== 'object') {
        userConfig.CHATBOT_CHATS = {};
    }
    userConfig.CHATBOT_CHATS[from] = newValue;
    await updateUserConfig(sanitizedNumber, userConfig);

    const where = isGroup ? 'this group' : 'this chat';
    return reply(`✅ *Chatbot ${where}:* ${newValue}`);
});

cmd({
    pattern: "settings",
    alias: ["setting", "env", "config"],
    desc: "Bot settings management - View all available setting commands",
    category: "settings",
    react: "⚙️",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, prefix, userConfig }) => {
    if (!isCreator) {
        return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");
    }
    
    const settingsText = `
┌─⧽ *${config.BOT_NAME} Sᴇᴛᴛɪɴɢs Mᴇɴᴜ* ⚙️
│
│ 📁 *General Settings*
│ •welcome on/off
│ •goodbye on/off
│ •setwelcome <message>
│ •setgoodbye <message>
│
│ 📁 *Anti Features*
│ •antiedit on/off
│ •editpath inbox/same
│ •antilink on/off
│ •antilinkaction delete/warn/kick
│ •antidelete on/off
│ •anticall on/off
│ •anticallmsg <message>
│
│ 📁 *Auto & Status Features*
│ •autoread on/off
│ •recording on/off
│ •statusview on/off
│ •statusreact on/off
│ •statusreply on/off
│ •statusreplymsg <message>
│ •autoreact on/off
│ •autotyping on/off
│ •online on/off
│
│ 📁 *Reaction Settings*
│ •heartreact on/off
│ •customreact on/off
│ •reactemojis 😂,❤️,🔥
│ •owneremojis 👑,⭐,💎
│ •customemojis 😊,👍,🚀
│
│ 📁 *Moderation*
│ •ban @user
│ •unban @user
│ •banlist
│ •sudo @user
│ •delsudo @user
│ •listsudo
│
│ 📁 *Bot Settings*
│ •chatbot on/off
│ •mode public/private/inbox
│ •prefix <new_prefix>
│ •botname <name>
│ •ownername <name>
│ •ownernumber <number>
│ •description <text>
│ •botdp <url> or reply to image
│ •stickername <name>
│ •delpath same/inbox
│
│ 📁 *Current Status*
│ • Welcome: ${userConfig.WELCOME || 'false'}
│ • Goodbye: ${userConfig.GOODBYE || 'false'}
│ • Anti-Edit: ${userConfig.ANTI_EDIT || 'false'}
│ • Anti-Link: ${userConfig.ANTI_LINK || 'false'}
│ • Anti-Link Action: ${userConfig.ANTI_LINK_ACTION || 'warn'}
│ • Anti-Delete: ${userConfig.ANTI_DELETE || 'false'}
│ • Anti-Call: ${userConfig.ANTI_CALL || 'false'}
│ • Auto-Read: ${userConfig.READ_MESSAGE || 'false'}
│ • Auto-React: ${userConfig.AUTO_REACT || 'false'}
│ • Auto-Typing: ${userConfig.AUTO_TYPING || 'false'}
│ • Always Online: ${userConfig.ALWAYS_ONLINE || 'false'}
│ • Chatbot: ${userConfig.CHATBOT || 'false'}
│ • Heart React: ${userConfig.HEART_REACT || 'false'}
│ • Custom React: ${userConfig.CUSTOM_REACT || 'false'}
│ • Status React: ${userConfig.AUTO_STATUS_REACT || 'false'}
│ • Status Reply: ${userConfig.AUTO_STATUS_REPLY || 'false'}
│ • Mode: ${userConfig.MODE || 'public'}
│ • Prefix: ${userConfig.PREFIX || prefix}
│
│ 📌 *Tip:* Use .help <command> for more details
└──────────────────────────
    `;
    
    await reply(settingsText);
});
