const { cmd } = require('../command');
const { generateMessageID } = require('@whiskeysockets/baileys');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

const COLORS = {
  red: 'FF0000', blue: '1DA1F2', green: '25D366', yellow: 'FFD700',
  black: '000000', white: 'FFFFFF', purple: '7B2CBF', pink: 'FFC0CB',
  orange: 'FFA500', cyan: '00FFFF', gray: '808080', navy: '001F5B'
};

const RANDOM_BG = [
  0xFF7B2CBF, 0xFF1D3557, 0xFF2B2D42, 0xFFD90429, 0xFF0077B6,
  0xFF007F5F, 0xFF5A189A, 0xFFE76F51, 0xFF2A9D8F, 0xFF1A1A1D
];

function getRandomBg() {
  return RANDOM_BG[Math.floor(Math.random() * RANDOM_BG.length)];
}

function resolveColor(val) {
  if (!val) return null;
  val = String(val).trim().replace(/^#/, '');
  if (COLORS[val.toLowerCase()]) return COLORS[val.toLowerCase()];
  if (/^[0-9A-Fa-f]{6}$/.test(val)) return val.toUpperCase();
  return null;
}

function parseFlags(text) {
  const result = { textColor: null, bgColor: null, remaining: '' };
  if (!text) return result;

  let cleaned = text
    .replace(/[-–—]?\s*color\s*[:\-]?\s*/gi, ' -color ')
    .replace(/[-–—]?\s*bg\s*[:\-]?\s*/gi, ' -bg ')
    .replace(/\s+/g, ' ')
    .trim();

  const tokens = cleaned.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
  const leftover = [];

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i].replace(/^"|"$/g, '');
    const lower = tok.toLowerCase();

    if ((lower === '-color' || lower === 'color') && tokens[i + 1]) {
      const c = resolveColor(tokens[++i].replace(/^"|"$/g, ''));
      if (c) result.textColor = c;
      continue;
    }
    if ((lower === '-bg' || lower === 'bg') && tokens[i + 1]) {
      const c = resolveColor(tokens[++i].replace(/^"|"$/g, ''));
      if (c) result.bgColor = c;
      continue;
    }
    leftover.push(tok);
  }

  result.remaining = leftover.join(' ').trim();
  return result;
}

function buildColoredTextMessage(caption, textColor, bgColor, mentionedJid) {
  let textHex = textColor ? String(textColor).replace('#', '') : 'FFFFFF';
  if (textHex.length === 6) textHex = 'FF' + textHex;

  let bgArgb;
  if (bgColor) {
    let bgHex = String(bgColor).replace('#', '');
    if (bgHex.length === 6) bgHex = 'FF' + bgHex;
    bgArgb = parseInt(bgHex, 16);
  } else {
    bgArgb = getRandomBg();
  }

  return {
    extendedTextMessage: {
      text: caption,
      textArgb: parseInt(textHex, 16),
      backgroundArgb: bgArgb,
      font: 1,
      contextInfo: {
        isGroupStatus: true,
        mentionedJid
      }
    }
  };
}

async function convertToWhatsAppPTT(buffer) {
  const id = Date.now();
  const inputPath = path.join(os.tmpdir(), 'gstatus_in_' + id + '.bin');
  const outputPath = path.join(os.tmpdir(), 'gstatus_out_' + id + '.ogg');

  fs.writeFileSync(inputPath, buffer);

  try {
    const cmdLine = '"' + ffmpegPath + '" -y -i "' + inputPath + '" -vn -ac 1 -ar 48000 -c:a libopus -b:a 64k "' + outputPath + '"';
    await execAsync(cmdLine);

    if (!fs.existsSync(outputPath)) {
      throw new Error('Converted file not created');
    }

    const out = fs.readFileSync(outputPath);
    if (!out || out.length < 100) {
      throw new Error('Converted file empty');
    }
    return out;
  } finally {
    try { fs.unlinkSync(inputPath); } catch (e) {}
    try { fs.unlinkSync(outputPath); } catch (e) {}
  }
}

function _unwrapQuotedMessage(raw) {
  if (!raw) return raw;
  let node = raw;
  const keys = ['ephemeralMessage', 'viewOnceMessage', 'viewOnceMessageV2', 'viewOnceMessageV2Extension'];
  for (const k of keys) {
    if (node?.[k]?.message) node = node[k].message;
  }
  return node;
}

cmd({
  pattern: 'gstatus',
  alias: [
    'group-status',
    'groupstatus',
    'gcstatus',
    'gc-status',
    'gcs',
    'g-status',
    'statusgc'
  ],
  desc: 'Send group status in current group only',
  category: 'group',
  react: '📢',
  filename: __filename
}, async (conn, mek, m, { from, text, reply, prefix, isCreator }) => {
  try {
    if (!isCreator) {
      return reply('❌ Only bot owner can use this command.');
    }

    if (!from.endsWith('@g.us')) {
      return reply('⚠️ Group only!');
    }

    const flags = parseFlags(text || '');
    let caption = flags.remaining;

    const quotedMsg = m.quoted;
    const unwrappedMsg = quotedMsg ? _unwrapQuotedMessage(quotedMsg.message) : null;
    const mimeType = quotedMsg
      ? (quotedMsg.msg || quotedMsg).mimetype || ''
      : '';

    if (!quotedMsg && !caption) {
      const p = prefix || '.';
      const helpText =
        '╭━━〔 📢 *GROUP STATUS* 〕━━⬣\n' +
        '┃\n' +
        '┃ ✦ Sends status in *this\n' +
        '┃   group only*\n' +
        '┃\n' +
        '┃ 📝 *USAGE*\n' +
        '┃ ➜ ' + p + 'gstatus Hello\n' +
        '┃ ➜ ' + p + 'gstatus Hello -color\n' +
        '┃   red -bg black\n' +
        '┃ ➜ ' + p + 'gstatus (reply to\n' +
        '┃   image/video/voice)\n' +
        '┃ ➜ ' + p + 'gstatus My title\n' +
        '┃   (reply + caption)\n' +
        '┃\n' +
        '┃ ⚙️ *FLAGS*\n' +
        '┃ ➜ -color   text color\n' +
        '┃ ➜ -bg      background\n' +
        '┃\n' +
        '╰━━━━━━━━━━━━━━⬣\n' +
        '> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ϙᴜᴇᴇɴ-ᴍᴅ*';

      return reply(helpText);
    }

    await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

    let mentionedJid = [];
    try {
      const meta = await conn.groupMetadata(from);
      mentionedJid = (meta.participants || []).map(p => p.id);
    } catch (e) {}

    if (quotedMsg) {
      const mediaBuffer = await quotedMsg.download();
      if (!mediaBuffer) {
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        return reply('❌ Failed to download media. Try again.');
      }

      const getMsgType = () => {
        if (mimeType.startsWith('image/')) return 'image';
        if (mimeType.startsWith('video/')) return 'video';
        if (mimeType.startsWith('audio/')) return 'audio';
        const msgType = Object.keys(unwrappedMsg || quotedMsg?.message || {})[0] || '';
        if (msgType === 'imageMessage') return 'image';
        if (msgType === 'videoMessage') return 'video';
        if (msgType === 'audioMessage' || msgType === 'pttMessage') return 'audio';
        if (quotedMsg.mtype === 'imageMessage') return 'image';
        if (quotedMsg.mtype === 'videoMessage') return 'video';
        if (quotedMsg.mtype === 'audioMessage') return 'audio';
        return null;
      };

      const msgType = getMsgType();

      if (!caption) {
        caption =
          quotedMsg.caption ||
          quotedMsg.text ||
          (quotedMsg.msg && quotedMsg.msg.caption) ||
          '';
      }

      const contextInfo = {
        isGroupStatus: true,
        mentionedJid
      };

      let messageContent = {};

      if (msgType === 'image') {
        messageContent = {
          image: mediaBuffer,
          caption: caption || '',
          mimetype: mimeType || 'image/jpeg',
          contextInfo
        };
      } else if (msgType === 'video') {
        messageContent = {
          video: mediaBuffer,
          caption: caption || '',
          mimetype: mimeType || 'video/mp4',
          contextInfo
        };
      } else if (msgType === 'audio') {
        let audioBuffer;
        try {
          audioBuffer = await convertToWhatsAppPTT(mediaBuffer);
        } catch (e) {
          console.log('Convert error:', e.message);
          await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
          return reply('❌ Voice convert fail: ' + e.message);
        }

        let seconds =
          quotedMsg?.message?.audioMessage?.seconds ||
          quotedMsg?.seconds ||
          quotedMsg?.msg?.seconds ||
          undefined;

        messageContent = {
          audio: audioBuffer,
          mimetype: 'audio/ogg; codecs=opus',
          ptt: true,
          seconds: seconds,
          contextInfo
        };
      } else {
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        return reply('❌ Only image / video / audio supported.');
      }

      await conn.sendMessage(from, messageContent);
    } else {
      const coloredMsg = buildColoredTextMessage(caption, flags.textColor, flags.bgColor, mentionedJid);
      await conn.relayMessage(from, coloredMsg, {
        messageId: generateMessageID()
      });
    }

    await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

  } catch (error) {
    console.error('GStatus Error:', error);
    try {
      await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
    } catch (e) {}
    reply('❌ ' + error.message);
  }
});
