const axios = require("axios");
const FormData = require("form-data");
const { cmd } = require("../command");

const API_URL = "https://adeel-xtech-api.vercel.app/api/removebg";

function resolveImageMessage(raw) {
    if (!raw) return null;
    let node = raw;
    const unwrapKeys = ["ephemeralMessage", "viewOnceMessage", "viewOnceMessageV2", "viewOnceMessageV2Extension"];
    for (const k of unwrapKeys) {
        if (node?.[k]?.message) node = node[k].message;
    }
    return node?.imageMessage || null;
}

cmd({
    pattern: "rmbg",
    alias: ["removebg", "rbg"],
    react: "📸",
    desc: "Remove background from image",
    category: "editing",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {

    try {
        let target = null;

        if (m.mtype === "imageMessage") {
            target = m;
        } else if (m.quoted) {
            const resolvedImg = resolveImageMessage(m.quoted.message);
            if (resolvedImg) {
                target = {
                    download: () => conn.downloadMediaMessage({ message: { imageMessage: resolvedImg }, mtype: "imageMessage" })
                };
            } else {
                const qType = m.quoted.mtype || "";
                const qMime = m.quoted.mimetype || m.quoted.msg?.mimetype || "";
                if (qType === "imageMessage" || qMime.startsWith("image/")) {
                    target = m.quoted;
                }
            }
        }

        if (!target) {
            return reply("❌ Reply to an image, or send an image with caption `.rmbg`");
        }

        await conn.sendMessage(from, {
            react: { text: "⏳", key: mek.key }
        });

        const buffer = await target.download();
        if (!buffer || !buffer.length) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Failed to remove background, please try again.");
        }

        const form = new FormData();
        form.append("image", buffer, {
            filename: "image.jpg",
            contentType: "image/jpeg"
        });

        let response;
        try {
            response = await axios.post(API_URL, form, {
                headers: form.getHeaders(),
                timeout: 60000,
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });
        } catch (apiErr) {
            console.error("RemoveBG API error:", apiErr.message);
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Failed to remove background, please try again.");
        }

        const data = response.data;
        if (!data?.status || !data?.result?.image_url) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Failed to remove background, please try again.");
        }

        let result;
        try {
            result = await axios.get(data.result.image_url, {
                responseType: "arraybuffer",
                timeout: 60000
            });
        } catch (dlErr) {
            console.error("RemoveBG result download error:", dlErr.message);
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Failed to remove background, please try again.");
        }

        const resultBuffer = Buffer.from(result.data);
        const size = data.result.size || `${(resultBuffer.length / 1024).toFixed(2)} KB`;

        await conn.sendMessage(from, {
            react: { text: "✅", key: mek.key }
        });

        await conn.sendMessage(
            from,
            {
                image: resultBuffer,
                caption:
`\`REMOVE BACKGROUND\`

📦 SIZE: ${size}

> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ϙᴜᴇᴇɴ-ᴍᴅ 🍸*`
            },
            { quoted: mek }
        );

    } catch (err) {
        console.error("rmbg error:", err.message);
        try {
            await conn.sendMessage(from, {
                react: { text: "❌", key: mek.key }
            });
        } catch (_) {}
        reply("❌ Failed to remove background, please try again.");
    }
});
