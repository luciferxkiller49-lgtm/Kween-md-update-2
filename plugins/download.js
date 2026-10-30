const cheerio = require("cheerio");
const axios = require("axios");
const { cmd, commands } = require('../command');

cmd({
  pattern: "ig7",
  alias: ["insta8", "Instagram9"],
  desc: "To download Instagram videos.",
  react: "🎥",
  category: "download",
  filename: __filename
}, async (conn, m, store, { from, q, reply }) => {
  try {
    if (!q || !q.startsWith("http")) {
      return reply("❌ Please provide a valid Instagram link.");
    }

    await conn.sendMessage(from, {
      react: { text: "⏳", key: m.key }
    });

    const response = await axios.get(`https://insta-down.apis-bj-devs.workers.dev/?url=${q}`);
    const data = response.data;

    if (!data || data.status !== 200 || !data.downloadUrl) {
      return reply("⚠️ Failed to fetch Instagram video. Please check the link and try again.");
    }

    await conn.sendMessage(from, {
      video: { url: data.downloadUrl },
      mimetype: "video/mp4",
      caption: "📥 *Instagram Video Downloaded Successfully!*"
    }, { quoted: m });

  } catch (error) {
    console.error("Error:", error);
    reply("❌ An error occurred while processing your request. Please try again.");
  }
});


// twitter-dl

cmd({
  pattern: "twitter",
  alias: ["tweet", "twdl"],
  desc: "Download Twitter videos",
  category: "download",
  filename: __filename
}, async (conn, m, store, {
  from,
  quoted,
  q,
  reply
}) => {
  try {
    if (!q || !q.startsWith("https://")) {
      return conn.sendMessage(from, { text: "❌ Please provide a valid Twitter URL." }, { quoted: m });
    }

    await conn.sendMessage(from, {
      react: { text: '⏳', key: m.key }
    });

    const response = await axios.get(`https://www.dark-yasiya-api.site/download/twitter?url=${q}`);
    const data = response.data;

    if (!data || !data.status || !data.result) {
      return reply("⚠️ Failed to retrieve Twitter video. Please check the link and try again.");
    }

    const { desc, thumb, video_sd, video_hd } = data.result;

    const caption = `╭━━━⪨ 🎀 𝐓𝐖𝐈𝐓𝐓𝐄𝐑 🎀 ⪩━━━╮
  
  📝 ‣ 𝐃𝐞𝐬𝐜 : ${desc || "No description"}

╰━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━⪨ 💕 𝐎𝐏𝐓𝐈𝐎𝐍𝐒 💕 ⪩━━━╮

  1️⃣ ‣ 𝐒𝐃 𝐐𝐮𝐚𝐥𝐢𝐭𝐲
  2️⃣ ‣ 𝐇𝐃 𝐐𝐮𝐚𝐥𝐢𝐭𝐲
  3️⃣ ‣ 𝐀𝐮𝐝𝐢𝐨
  4️⃣ ‣ 𝐃𝐨𝐜𝐮𝐦𝐞𝐧𝐭
  5️⃣ ‣ 𝐕𝐨𝐢𝐜𝐞

╰━━━━━━━━━━━━━━━━━━━━━━╯

📌 *Reply with the number to download your choice.*

> 🎀 *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ϙᴜᴇᴇɴ-ᴍᴅ* 👑`;

    const sentMsg = await conn.sendMessage(from, {
      image: { url: thumb },
      caption: caption
    }, { quoted: m });

    const messageID = sentMsg.key.id;

    conn.ev.on("messages.upsert", async (msgData) => {
      const receivedMsg = msgData.messages[0];
      if (!receivedMsg.message) return;

      const receivedText = receivedMsg.message.conversation || receivedMsg.message.extendedTextMessage?.text;
      const senderID = receivedMsg.key.remoteJid;
      const isReplyToBot = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;

      if (isReplyToBot) {
        await conn.sendMessage(senderID, {
          react: { text: '⬇️', key: receivedMsg.key }
        });

        switch (receivedText) {
          case "1":
            await conn.sendMessage(senderID, {
              video: { url: video_sd },
              caption: "📥 *Downloaded in SD Quality*"
            }, { quoted: receivedMsg });
            break;

          case "2":
            await conn.sendMessage(senderID, {
              video: { url: video_hd },
              caption: "📥 *Downloaded in HD Quality*"
            }, { quoted: receivedMsg });
            break;

          case "3":
            await conn.sendMessage(senderID, {
              audio: { url: video_sd },
              mimetype: "audio/mpeg"
            }, { quoted: receivedMsg });
            break;

          case "4":
            await conn.sendMessage(senderID, {
              document: { url: video_sd },
              mimetype: "audio/mpeg",
              fileName: "Twitter_Audio.mp3",
              caption: "📥 *Audio Downloaded as Document*"
            }, { quoted: receivedMsg });
            break;

          case "5":
            await conn.sendMessage(senderID, {
              audio: { url: video_sd },
              mimetype: "audio/mp4",
              ptt: true
            }, { quoted: receivedMsg });
            break;

          default:
            reply("❌ Invalid option! Please reply with 1, 2, 3, 4, or 5.");
        }
      }
    });

  } catch (error) {
    console.error("Error:", error);
    reply("❌ An error occurred while processing your request. Please try again.");
  }
});

// MediaFire-dl
cmd({
  pattern: "mediafire",
  alias: ["mfire", "mf"],
  desc: "To download MediaFire files.",
  react: "📥",
  category: "download",
  filename: __filename
}, async (conn, m, store, {
  from,
  q,
  reply
}) => {
  try {
    if (!q) {
      return reply("❌ Please provide a valid MediaFire link.\n\nExample: .mediafire https://www.mediafire.com/file/...");
    }

    if (!q.includes("mediafire.com")) {
      return reply("⚠️ Invalid link! Please send a valid MediaFire URL.");
    }

    await conn.sendMessage(from, {
      react: { text: "⏳", key: m.key }
    });

    const apiUrl = `https://arslan-apis-v2.vercel.app/download/mfire?url=${encodeURIComponent(q)}`;
    const response = await axios.get(apiUrl, { timeout: 30000 });

    const data = response.data;

    if (!data || !data.status || !data.result) {
      return reply("⚠️ Failed to fetch MediaFire download link.");
    }

    const {
      fileName,
      size,
      fileType,
      date,
      dl_link
    } = data.result;

    if (!dl_link) {
      return reply("❌ Download link not found in the response.");
    }

    await conn.sendMessage(from, {
      react: { text: "⬆️", key: m.key }
    });

    const caption = 
`╭━━━⪨ 🎀 𝐌𝐄𝐃𝐈𝐀𝐅𝐈𝐑𝐄 🎀 ⪩━━━╮

  📄 ‣ 𝐍𝐚𝐦𝐞 : ${fileName || "Unknown"}
  🏋️ ‣ 𝐒𝐢𝐳𝐞 : ${size || "N/A"}
  📦 ‣ 𝐓𝐲𝐩𝐞 : ${fileType || "application/octet-stream"}
  📅 ‣ 𝐃𝐚𝐭𝐞 : ${date || "N/A"}

╰━━━━━━━━━━━━━━━━━━━━━━╯

> 🎀 *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ϙᴜᴇᴇɴ-ᴍᴅ* 👑`;

    await conn.sendMessage(from, {
      document: { url: dl_link },
      mimetype: fileType || "application/octet-stream",
      fileName: fileName || "MediaFire_Download",
      caption: caption
    }, { quoted: m });

    await conn.sendMessage(from, {
      react: { text: "✅", key: m.key }
    });

  } catch (error) {
    console.error("MediaFire Error:", error);
    reply("❌ An error occurred while processing your request. Please try again later.");
    try {
      await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
    } catch {}
  }
});

// apk-dl

cmd({
  pattern: "apk",
  desc: "Download APK from Aptoide.",
  category: "download",
  filename: __filename
}, async (conn, m, store, {
  from,
  quoted,
  q,
  reply
}) => {
  try {
    if (!q) {
      return reply("❌ Please provide an app name to search.");
    }

    await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

    const apiUrl = `http://ws75.aptoide.com/api/7/apps/search/query=${q}/limit=1`;
    const response = await axios.get(apiUrl);
    const data = response.data;

    if (!data || !data.datalist || !data.datalist.list.length) {
      return reply("⚠️ No results found for the given app name.");
    }

    const app = data.datalist.list[0];
    const appSize = (app.size / 1048576).toFixed(2);

    const caption = 
`╭━━━⪨ 🎀 𝐀𝐏𝐊 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐄𝐑 🎀 ⪩━━━╮

  📦 ‣ 𝐍𝐚𝐦𝐞      : ${app.name}
  🏋️ ‣ 𝐒𝐢𝐳𝐞      : ${appSize} MB
  📦 ‣ 𝐏𝐚𝐜𝐤𝐚𝐠𝐞   : ${app.package}
  📅 ‣ 𝐔𝐩𝐝𝐚𝐭𝐞𝐝   : ${app.updated}
  👨‍💻 ‣ 𝐃𝐞𝐯𝐞𝐥𝐨𝐩𝐞𝐫 : ${app.developer.name}

╰━━━━━━━━━━━━━━━━━━━━━━╯

> 🎀 *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ϙᴜᴇᴇɴ-ᴍᴅ* 👑`;

    await conn.sendMessage(from, { react: { text: "⬆️", key: m.key } });

    await conn.sendMessage(from, {
      document: { url: app.file.path_alt },
      fileName: `${app.name}.apk`,
      mimetype: "application/vnd.android.package-archive",
      caption: caption
    }, { quoted: m });

    await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

  } catch (error) {
    console.error("Error:", error);
    reply("❌ An error occurred while fetching the APK. Please try again.");
  }
});

// G-Drive-DL

cmd({
    pattern: "gdrive",
    desc: "Download Google Drive files",
    react: "🌐",
    category: "download",
    filename: __filename
}, async (conn, m, store, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a valid Google Drive link.");

        await conn.sendMessage(from, { react: { text: "⬇️", key: m.key } });

        const apiUrl = `https://api.princetechn.com/api/download/gdrivedl?apikey=prince&url=${encodeURIComponent(q)}`;
        const response = await axios.get(apiUrl, { timeout: 30000 });

        const result = response.data?.result;
        if (!result || !result.download_url) return reply("⚠️ No download URL found.");

        const fileName = result.name || "file";
        const downloadUrl = result.download_url;

        await conn.sendMessage(from, {
            document: { url: downloadUrl },
            fileName: fileName,
            mimetype: "application/octet-stream",
            caption: `╭━━━⪨ 🎀 𝐆𝐃𝐑𝐈𝐕𝐄 🎀 ⪩━━━╮

  📄 ‣ 𝐍𝐚𝐦𝐞 : ${fileName}

╰━━━━━━━━━━━━━━━━━━━━━━╯

> 🎀 *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ϙᴜᴇᴇɴ-ᴍᴅ* 👑`
        }, { quoted: m });

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (e) {
        console.log("GDrive Error:", e.message);
        reply("❌ Error fetching the file. Please try again.");
    }
});
