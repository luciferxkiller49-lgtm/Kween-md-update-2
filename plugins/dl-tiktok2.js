const axios = require('axios');
const { cmd } = require("../command");

cmd({
  pattern: "tiktok2",
  alias: ["tt2", "ttdl2"],
  desc: "Direct TikTok Video Downloader",
  react: "📥",
  category: "download",
  use: ".tt2 <TikTok link>",
  filename: __filename
}, async (conn, mek, m, { from, q, args, reply }) => {
  try {
    const url = q || args[0];

    if (!url) {
      return reply("⚠️ Please provide a TikTok link.\nExample: .tiktok2 https://vt.tiktok.com/xxx/");
    }

    const isTikTok = /(https?:\/\/)?(www\.|vt\.|vm\.)?(tiktok\.com)\//i.test(url);
    if (!isTikTok) {
      return reply("⚠️ Please provide a valid TikTok link.");
    }

    await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

    const api = `https://adeel-xtech-api.vercel.app/api/tiktok-v2?url=${encodeURIComponent(url)}`;

    const res = await axios.get(api, {
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json"
      }
    });

    const data = res.data;

    if (!data || !data.status || !data.result || !data.result.video_download) {
      await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
      return reply("❌ Could not fetch the video. Please try again.");
    }

    const r = data.result;
    const stats = r.stats || {};
    const author = r.author || {};

    const videoUrl = r.video_download;
    const title = r.title || 'No Title';
    const authorName = author.nickname || author.fullname || 'Unknown';
    const duration = r.duration || 'N/A';

    // Stats details
    const views = stats.views || '0';
    const likes = stats.likes || '0';
    const comments = stats.comment || '0';
    const shares = stats.share || '0';
    const saves = stats.save || '0';
    const downloads = stats.download || '0';

    const captionText = 
`╭━━━⪨ 🎀 𝐓𝐈𝐊𝐓𝐎𝐊 🎀 ⪩━━━╮
  
  📌 ‣ 𝐓𝐢𝐭𝐥𝐞    : ${title}
  👤 ‣ 𝐀𝐮𝐭𝐡𝐨𝐫   : ${authorName}
  ⏳ ‣ 𝐃𝐮𝐫𝐚𝐭𝐢𝐨𝐧 : ${duration}

╰━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━⪨ 💕 𝐒𝐓𝐀𝐓𝐒 💕 ⪩━━━╮

  👁️ ‣ 𝐕𝐢𝐞𝐰𝐬      : ${views}
  ❤️ ‣ 𝐋𝐢𝐤𝐞𝐬      : ${likes}
  💬 ‣ 𝐂𝐨𝐦𝐦𝐞𝐧𝐭𝐬  : ${comments}
  🔗 ‣ 𝐒𝐡𝐚𝐫𝐞𝐬     : ${shares}
  📁 ‣ 𝐒𝐚𝐯𝐞𝐬      : ${saves}
  📥 ‣ 𝐃𝐨𝐰𝐧𝐥𝐨𝐚𝐝𝐬  : ${downloads}

╰━━━━━━━━━━━━━━━━━━━━━━╯

> 🎀 *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ϙᴜᴇᴇɴ-ᴍᴅ* 👑`;

    await conn.sendMessage(from, {
      video: { url: videoUrl },
      caption: captionText,
      mimetype: "video/mp4",
      fileName: "tiktok.mp4"
    }, { quoted: mek });

    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (error) {
    console.error("TikTok Error:", error.message);
    reply(`❌ Error: ${error.message}`);
    try { 
      await conn.sendMessage(from, { react: { text: "❌", key: mek.key } }); 
    } catch {}
  }
});
