const config = require('../config');
const { cmd } = require('../command');
const axios = require('axios');
const { getBuffer } = require("../lib/functions");
const { videoToWebp } = require('../lib/video-utils');
const { Sticker, StickerTypes } = require("wa-sticker-formatter");

const stickerAPI = {
    baseURL: "https://jawad-tech.vercel.app/tgsticker"
};

cmd({
    pattern: "telegramsticker",
    alias: ["tsticker", "tg", "tgs", "tgstick"],
    react: "🛡️",
    desc: "Download Telegram sticker pack",
    category: "download",
    use: ".telegramsticker <telegram_sticker_url>",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, quoted, isCreator }) => {
    try {
        if (!isCreator) {
            return await reply("📛 This is an owner command.");
        }

        if (!q) return await reply("❌ Please provide a Telegram sticker pack URL!\nExample: .telegramsticker https://t.me/addstickers/packname");

        if (!q.includes('t.me/addstickers/') && !q.includes('telegram.me/addstickers/')) {
            return await reply("❌ Please provide a valid Telegram sticker pack URL!\nIt should look like: https://t.me/addstickers/packname");
        }

        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        const apiUrl = `${stickerAPI.baseURL}?url=${encodeURIComponent(q)}`;
        
        const res = await axios.get(apiUrl, {
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'accept': '*/*'
            }
        });

        if (!res.data || !res.data.status || !res.data.result || !res.data.result.stickers) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return await reply("❌ Failed to fetch sticker pack. Invalid URL or API error.");
        }

        const stickerData = res.data.result;
        const stickers = stickerData.stickers;

        if (!stickers || stickers.length === 0) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return await reply("❌ No stickers found in this pack!");
        }

        let pack = ".  ̶͟ ̶̽ ̶͟ ̶͟ ͟𝐐𝐔𝐄𝐄𝐍🦋⸼˺┇🌸• ⑅⃝⃕͜➳ᷝ͢•ⷨ";

        for (const [index, sticker] of stickers.entries()) {
            try {
                const stickerUrl = sticker.image_url;
                const fileExtension = stickerUrl.split('.').pop().toLowerCase();
                
                if (fileExtension === 'webp') {
                    await conn.sendMessage(from, {
                        sticker: { url: stickerUrl }
                    }, { quoted: mek });
                    
                } else if (fileExtension === 'tgs' || fileExtension === 'webm') {
                    try {
                        const videoBuffer = await getBuffer(stickerUrl);
                        const webpBuffer = await videoToWebp(videoBuffer);
                        
                        let stickerObj = new Sticker(webpBuffer, {
                            pack: pack, 
                            type: StickerTypes.FULL,
                            categories: ["🤩", "🎉"], 
                            id: "12345",
                            quality: 75, 
                            background: 'transparent',
                        });
                        
                        const buffer = await stickerObj.toBuffer();
                        await conn.sendMessage(from, { 
                            sticker: buffer 
                        }, { quoted: mek });
                        
                    } catch (convertError) {
                        console.error(`[TSTICK] Conversion failed for sticker ${index + 1}:`, convertError.message);
                        await conn.sendMessage(from, {
                            document: { url: stickerUrl },
                            fileName: `sticker_${index + 1}.${fileExtension}`,
                            mimetype: 'application/octet-stream'
                        }, { quoted: mek });
                    }
                    
                } else {
                    try {
                        await conn.sendMessage(from, {
                            image: { url: stickerUrl }
                        }, { quoted: mek });
                    } catch (imageError) {
                        await conn.sendMessage(from, {
                            document: { url: stickerUrl },
                            fileName: `sticker_${index + 1}.${fileExtension}`,
                            mimetype: 'application/octet-stream'
                        }, { quoted: mek });
                    }
                }
                
                await new Promise(resolve => setTimeout(resolve, 1500));
                
            } catch (stickerError) {
                console.error(`[TSTICK] Error sending sticker ${index + 1}:`, stickerError.message);
            }
        }

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (error) {
        console.error('[TSTICK] Command Error:', error?.message || error);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        await reply("❌ Download failed: " + (error?.message || 'Unknown error'));
    }
});
