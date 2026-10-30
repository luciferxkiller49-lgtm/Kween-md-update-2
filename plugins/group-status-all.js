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

async function getGroupMentions(conn, groupJid) {
  try {
    const meta = await conn.groupMetadata(groupJid);
    return (meta.participants || []).map(p => p.id).filter(Boolean);
  } catch (e) {
    return [];
  }
}

cmd({
  pattern: 'groupstatusall',
  alias: [
    'gstall',
    'gcall',
    'statusall',
    'swgcall',
    'allgst',
    'gst-all',
    'gstatusall'
  ],
  desc: 'Send group status to ALL groups (from any chat)',
  category: 'group',
  react: '🌍',
  filename: __filename
}, async (conn, mek, m, { from, text, reply, isCreator }) => {
  try {
    if (!isCreator) {
      return reply('❌ Only bot owner can use this command.');
    }

    const flags = parseFlags(text || '');
    let caption = flags.remaining;

    const quotedMsg = m.quoted;
    const mimeType = quotedMsg
      ? (quotedMsg.msg || quotedMsg).mimetype || ''
      : '';

    if (!quotedMsg && !caption) {
      return reply(
        '*GROUP STATUS ALL*\n\n' +
        'Text: `.groupstatusall Hello`\n' +
        'Color: `.groupstatusall Hello -color red -bg black`\n' +
        'Reply media: `.groupstatusall`\n' +
        'Reply + title: `.groupstatusall My title`\n' +
        'Reply voice/audio: `.groupstatusall`\n\n' +
        '_Works from group / chat / You ID_\n' +
        '_Sends status to every group bot is in_'
      );
    }

    await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

    let targetJids = [];
    try {
      const groups = await conn.groupFetchAllParticipating();
      targetJids = Object.keys(groups || {});
    } catch (e) {
      return reply('❌ Failed to fetch groups: ' + e.message);
    }

    if (!targetJids.length) {
      return reply('❌ Bot is not in any groups!');
    }

    let mediaBuffer = null;
    let msgType = null;
    let audioSeconds = undefined;

    if (quotedMsg) {
      mediaBuffer = await quotedMsg.download();
      if (!mediaBuffer) {
        return reply('❌ Failed to download media. Try again.');
      }

      if (mimeType.startsWith('image/') || quotedMsg.mtype === 'imageMessage') {
        msgType = 'image';
      } else if (mimeType.startsWith('video/') || quotedMsg.mtype === 'videoMessage') {
        msgType = 'video';
      } else if (
        mimeType.startsWith('audio/') ||
        quotedMsg.mtype === 'audioMessage' ||
        quotedMsg.mtype === 'pttMessage'
      ) {
        msgType = 'audio';
      } else {
        const key = Object.keys(quotedMsg?.message || {})[0] || '';
        if (key === 'imageMessage') msgType = 'image';
        else if (key === 'videoMessage') msgType = 'video';
        else if (key === 'audioMessage' || key === 'pttMessage') msgType = 'audio';
      }

      if (!msgType) {
        return reply('❌ Only image / video / audio supported.');
      }

      if (!caption) {
        caption =
          quotedMsg.caption ||
          quotedMsg.text ||
          (quotedMsg.msg && quotedMsg.msg.caption) ||
          '';
      }

      if (msgType === 'audio') {
        try {
          mediaBuffer = await convertToWhatsAppPTT(mediaBuffer);
        } catch (e) {
          return reply('❌ Voice convert fail: ' + e.message);
        }
        audioSeconds =
          quotedMsg?.message?.audioMessage?.seconds ||
          quotedMsg?.seconds ||
          quotedMsg?.msg?.seconds ||
          undefined;
      }
    }

    let totalSent = 0;
    let failed = 0;

    for (const groupJid of targetJids) {
      try {
        const mentionedJid = await getGroupMentions(conn, groupJid);
        const contextInfo = {
          isGroupStatus: true,
          mentionedJid
        };

        if (msgType === 'image') {
          await conn.sendMessage(groupJid, {
            image: mediaBuffer,
            caption: caption || '',
            mimetype: mimeType || 'image/jpeg',
            contextInfo
          });
        } else if (msgType === 'video') {
          await conn.sendMessage(groupJid, {
            video: mediaBuffer,
            caption: caption || '',
            mimetype: mimeType || 'video/mp4',
            contextInfo
          });
        } else if (msgType === 'audio') {
          await conn.sendMessage(groupJid, {
            audio: mediaBuffer,
            mimetype: 'audio/ogg; codecs=opus',
            ptt: true,
            seconds: audioSeconds,
            contextInfo
          });
        } else {
          const coloredMsg = buildColoredTextMessage(
            caption,
            flags.textColor,
            flags.bgColor,
            mentionedJid
          );
          await conn.relayMessage(groupJid, coloredMsg, {
            messageId: generateMessageID()
          });
        }

        totalSent++;
      } catch (err) {
        failed++;
        console.error('[GROUP STATUS ALL]', groupJid, err.message);
      }

      if (targetJids.length > 1) {
        await new Promise(r => setTimeout(r, 1200));
      }
    }

    await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    let summary = '✅ *Sent to ' + totalSent + '/' + targetJids.length + ' group(s)*';
    if (failed > 0) summary += '\n⚠️ Failed: ' + failed;
    await reply(summary);

  } catch (error) {
    console.error('GroupStatusAll Error:', error);
    try {
      await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
    } catch (e) {}
    reply('❌ ' + error.message);
  }
});
