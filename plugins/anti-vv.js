const { cmd } = require("../command");
const { getContentType } = require("@whiskeysockets/baileys");

const FOOTER = `> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝙌𝙐𝙀𝙀𝙉🦋-MD ⚡*`;

const contextInfo = {
  forwardingScore: 999,
  isForwarded: true,
  get forwardedNewsletterMessageInfo() { return require('../lib/channel').info(); }
};

const VV_TRIGGERS = ["vv", "viewonce", "retrive", "retrieve"];

function unwrapMessage(msg) {
  if (!msg) return null;
  return (
    msg.ephemeralMessage?.message ||
    msg.viewOnceMessage?.message ||
    msg.viewOnceMessageV2?.message ||
    msg.viewOnceMessageV2Extension?.message ||
    msg.documentWithCaptionMessage?.message ||
    msg
  );
}

async function getQuoted(conn, mek, m) {
  let quoted = m.quoted || null;

  if (!quoted) {
    const ctx =
      mek.message?.extendedTextMessage?.contextInfo ||
      mek.message?.imageMessage?.contextInfo ||
      mek.message?.videoMessage?.contextInfo ||
      {};
    if (ctx.quotedMessage) {
      const qMsg = ctx.quotedMessage;
      const inner = unwrapMessage(qMsg) || qMsg;
      const qType = getContentType(inner);
      quoted = {
        message: inner,
        mtype: qType,
        mimetype: inner?.[qType]?.mimetype,
        caption: inner?.[qType]?.caption || "",
        text: inner?.conversation || inner?.extendedTextMessage?.text || "",
        ptt: inner?.audioMessage?.ptt || false,
        download: async () => {
          return await conn.downloadMediaMessage({
            message: inner,
            mtype: qType
          });
        }
      };
    }
  }

  if (!quoted) return null;

  let rawMsg = quoted.message || null;
  let mtype = quoted.mtype || (rawMsg ? getContentType(rawMsg) : null);

  if (rawMsg) {
    const unwrapped = unwrapMessage(rawMsg);
    if (unwrapped && unwrapped !== rawMsg) {
      rawMsg = unwrapped;
      mtype = getContentType(unwrapped);
      quoted = {
        ...quoted,
        message: unwrapped,
        mtype,
        mimetype: unwrapped?.[mtype]?.mimetype || quoted.mimetype,
        caption: unwrapped?.[mtype]?.caption || quoted.caption || "",
        ptt: unwrapped?.audioMessage?.ptt || quoted.ptt || false,
        download: async () => {
          return await conn.downloadMediaMessage({
            message: unwrapped,
            mtype
          });
        }
      };
    }
  }

  return quoted;
}

async function sendRetrieved(conn, mek, from, quoted) {
  const mtype = quoted.mtype;

  if (!mtype || !["imageMessage", "videoMessage", "audioMessage"].includes(mtype)) {
    return false;
  }

  const buffer = await quoted.download();
  if (!buffer || !buffer.length) {
    throw new Error("Failed to download media (maybe already opened / expired).");
  }

  const text = (
    quoted.caption ||
    quoted.text ||
    quoted.msg?.caption ||
    ""
  ).trim();

  const caption = text ? `${text}\n\n${FOOTER}` : FOOTER;
  const options = { quoted: mek };

  let messageContent = {};

  if (mtype === "imageMessage") {
    messageContent = {
      image: buffer,
      caption,
      mimetype: quoted.mimetype || "image/jpeg",
      contextInfo
    };
  } else if (mtype === "videoMessage") {
    messageContent = {
      video: buffer,
      caption,
      mimetype: quoted.mimetype || "video/mp4",
      contextInfo
    };
  } else if (mtype === "audioMessage") {
    messageContent = {
      audio: buffer,
      mimetype: quoted.mimetype || "audio/mp4",
      ptt: quoted.ptt || false,
      contextInfo
    };
  }

  await conn.sendMessage(from, messageContent, options);
  return true;
}

cmd({
  on: "body"
}, async (conn, mek, m, { from, isCreator }) => {
  try {
    if (!isCreator) return;

    const bodyText = (m.body || "").trim().toLowerCase();
    if (!VV_TRIGGERS.includes(bodyText)) return;

    const quoted = await getQuoted(conn, mek, m);
    if (!quoted) return;

    await sendRetrieved(conn, mek, from, quoted);
  } catch (error) {
    console.error("vv Body Listener Error:", error);
  }
});

cmd({
  pattern: "vv",
  alias: ["viewonce", "retrive", "retrieve"],
  react: "🐳",
  desc: "Retrieve view once / quoted media (everyone can use it)",
  category: "tools",
  filename: __filename
}, async (conn, mek, m, { from, isCreator, reply, sender }) => {
  try {
    const quoted = await getQuoted(conn, mek, m);
    if (!quoted) {
      return reply("*🍁 Please reply to a view once / image / video / audio message!*");
    }

    // The owner gets it in the same chat, as before. Everyone else gets it in their own DM,
    // so a view-once picture is not re-posted to a whole group.
    const target = isCreator ? from : (sender || from);
    const ok = await sendRetrieved(conn, mek, target, quoted);
    if (!ok) {
      return reply("❌ Only image, video, and audio messages are supported");
    }
    if (target !== from) await reply("📩 Sent to your DM.");
  } catch (error) {
    console.error("vv Error:", error);
    reply("❌ Error fetching vv message:\n" + error.message);
  }
});
