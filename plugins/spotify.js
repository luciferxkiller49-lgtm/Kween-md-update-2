const { cmd } = require('../command');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const stream = require('stream');
const pipeline = promisify(stream.pipeline);

cmd({
    pattern: "spotify",
    alias: ["splay", "spotifydl"],
    react: "🎵",
    desc: "Direct Spotify Song Downloader",
    category: "download",
    use: ".spotify <song name or link>",
    filename: __filename
}, async (conn, mek, m, { from, reply, q, args }) => {
    let tempFile = null;
    try {
        const query = q || args[0];

        if (!query) {
            return reply("⚠️ Please provide a song name or Spotify link.\nExample: .spotify pasoori");
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const searchUrl = `https://jerrycoder.oggyapi.workers.dev/search/spotify?q=${encodeURIComponent(query)}&limit=5`;
        const searchRes = await axios.get(searchUrl, { timeout: 20000 });

        if (!searchRes.data || !searchRes.data.tracks || searchRes.data.tracks.length === 0) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ No song found!");
        }

        const bestSong = searchRes.data.tracks[0];

        const dlUrl = `https://jerrycoder.oggyapi.workers.dev/down/spotify?url=${encodeURIComponent(bestSong.spotifyUrl)}`;
        const dlRes = await axios.get(dlUrl, { timeout: 20000 });

        if (!dlRes.data || dlRes.data.status !== "success" || !dlRes.data.download_link) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Could not get download link. Please try again.");
        }

        const dlData = dlRes.data;
        const audioUrl = dlData.download_link;
        const title = dlData.title || bestSong.trackName || "Spotify Audio";
        const artist = dlData.artist || bestSong.artist || "Unknown";
        const thumbnail = dlData.thumbnail || bestSong.image;

        const tempDir = path.join(__dirname, 'temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        tempFile = path.join(tempDir, `spotify_${Date.now()}.mp3`);
        const audioResponse = await axios({
            method: 'GET',
            url: audioUrl,
            responseType: 'stream',
            timeout: 120000,
        });

        await pipeline(audioResponse.data, fs.createWriteStream(tempFile));
        const audioBuffer = fs.readFileSync(tempFile);

        const customCaption = 
`🎵 *SPOTIFY DOWNLOADER*\n\n` +
`📌 *Title:* ${title}\n` +
`👤 *Artist:* ${artist}\n` +
`💿 *Album:* ${bestSong.album || 'Single'}\n\n` +
`> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ϙᴜᴇᴇɴ-ᴍᴅ ⚡`;

        if (thumbnail) {
            await conn.sendMessage(from, {
                image: { url: thumbnail },
                caption: customCaption
            }, { quoted: mek });
        } else {
            await reply(customCaption);
        }

        await conn.sendMessage(from, {
            audio: audioBuffer,
            mimetype: 'audio/mpeg',
            fileName: `${title.replace(/[^\w\s]/gi, '')}.mp3`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("Spotify Error:", error.message);
        reply(`❌ Error: ${error.message}`);
        try { 
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } }); 
        } catch {}
    } finally {
        if (tempFile && fs.existsSync(tempFile)) {
            try { fs.unlinkSync(tempFile); } catch (e) {}
        }
    }
});
