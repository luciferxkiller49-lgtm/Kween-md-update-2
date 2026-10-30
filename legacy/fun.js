const axios = require('axios');

// waifu.pics ek free, no-API-key wali service hai jo anime reaction GIFs deti hai
async function sendReaction(sock, from, msg, action, verb) {
  try {
    const res = await axios.get(`https://api.waifu.pics/sfw/${action}`, { timeout: 8000 });
    const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    const caption = mentioned ? `${verb} @${mentioned.split('@')[0]}!` : `${verb}!`;
    await sock.sendMessage(from, {
      image: { url: res.data.url },
      caption,
      mentions: mentioned ? [mentioned] : [],
    });
  } catch (err) {
    await sock.sendMessage(from, { text: `❌ ${verb} GIF nahi mil saka, dobara try karein.` });
  }
}

function reactionCommand(name, action, verb) {
  return {
    name,
    description: `${verb} reaction GIF bhejta hai`,
    execute: async ({ sock, from, msg }) => sendReaction(sock, from, msg, action, verb),
  };
}

const eightBallAnswers = [
  'Haan, bilkul.', 'Nahi, bilkul nahi.', 'Shayad.', 'Poochna mat, jawab pareshan karega.',
  'Filhal kuch keh nahi sakta.', 'Yaqeenan haan!', 'Umeed kam hai.', 'Dobara poochna.',
];

const roasts = [
  'Tum itne special ho ke Wi-Fi bhi tumhare paas aakar disconnect ho jata hai.',
  'Tumhari soch itni deep hai ke usme swimming pool ban sakta hai — bilkul khaali wala.',
  'Google bhi tumhe search karke confuse ho jata hai.',
];

const compliments = [
  'Tumhari smile kisi ka bhi din bana sakti hai.',
  'Tum jitne mehnati ho, kaam tumse darta hoga.',
  'Tumhari company mein waqt pata hi nahi chalta.',
];

const jokes = [
  'Teacher: Beta, "I am sorry" ka Urdu tarjuma karo.\nStudent: Sir, maaf kijiye.',
  'Ek banda doctor ke paas gaya: "Doctor sahab, mujhe bhoolne ki bimari hai."\nDoctor: "Kab se hai?"\nBanda: "Kya kab se hai?"',
];

const riddles = [
  { q: 'Wo kya cheez hai jo jitni katti jaye utni badhti hai?', a: 'Gaddha (hole)' },
  { q: 'Aisi kaun si cheez hai jo aap dekh nahi sakte lekin har roz istemal karte hain?', a: 'Hawa' },
];

const quotes = [
  '"Mushkil raste aksar khoobsurat manzilon tak le jate hain."',
  '"Waqt sabse bada ustaad hai, lekin bad-qismati se apne shagirdon ko qatal kar deta hai."',
  '"Jo darr gaya, wo mar gaya."',
];

const motivations = [
  'Aaj ki mehnat, kal ki kamiyabi hai — chalte raho.',
  'Har badi kamiyabi ek chhoti si koshish se shuru hoti hai.',
  'Ruko mat, thak jao to saans lo, phir chalo.',
];

module.exports = [
  reactionCommand('hug', 'hug', 'Hug'),
  reactionCommand('kiss', 'kiss', 'Kiss'),
  reactionCommand('slap', 'slap', 'Slap'),
  reactionCommand('pat', 'pat', 'Pat'),
  reactionCommand('cuddle', 'cuddle', 'Cuddle'),
  reactionCommand('kill', 'kill', 'Kill'),
  reactionCommand('bite', 'bite', 'Bite'),
  reactionCommand('poke', 'poke', 'Poke'),
  reactionCommand('wave', 'wave', 'Wave'),
  reactionCommand('dance', 'dance', 'Dance'),
  reactionCommand('cry', 'cry', 'Cry'),
  reactionCommand('blush', 'blush', 'Blush'),
  reactionCommand('smile', 'smile', 'Smile'),
  reactionCommand('wink', 'wink', 'Wink'),
  reactionCommand('highfive', 'highfive', 'High-five'),
  reactionCommand('bonk', 'bonk', 'Bonk'),
  reactionCommand('yeet', 'yeet', 'Yeet'),
  reactionCommand('kick', 'kick', 'Kick'),
  reactionCommand('happy', 'happy', 'Happy'),
  reactionCommand('feed', 'nom', 'Feed'),
  reactionCommand('handhold', 'handhold', 'Handhold'),
  reactionCommand('smug', 'smug', 'Smug'),
  {
    name: '8ball',
    description: 'Magic 8-ball se jawab lo',
    execute: async ({ sock, from }) => sock.sendMessage(from, { text: `🎱 ${eightBallAnswers[Math.floor(Math.random() * eightBallAnswers.length)]}` }),
  },
  {
    name: 'roast',
    description: 'Kisi ko halka phulka roast karo',
    execute: async ({ sock, from, msg }) => {
      const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      const text = roasts[Math.floor(Math.random() * roasts.length)];
      await sock.sendMessage(from, { text: mentioned ? `@${mentioned.split('@')[0]} ${text}` : text, mentions: mentioned ? [mentioned] : [] });
    },
  },
  {
    name: 'compliment',
    description: 'Kisi ki tareef karo',
    execute: async ({ sock, from, msg }) => {
      const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      const text = compliments[Math.floor(Math.random() * compliments.length)];
      await sock.sendMessage(from, { text: mentioned ? `@${mentioned.split('@')[0]} ${text}` : text, mentions: mentioned ? [mentioned] : [] });
    },
  },
  { name: 'joke', description: 'Random joke', execute: async ({ sock, from }) => sock.sendMessage(from, { text: `😂 ${jokes[Math.floor(Math.random() * jokes.length)]}` }) },
  {
    name: 'riddle',
    description: 'Random paheli',
    execute: async ({ sock, from }) => {
      const r = riddles[Math.floor(Math.random() * riddles.length)];
      await sock.sendMessage(from, { text: `🧩 *Paheli:* ${r.q}\n\n_Jawab ke liye 10 second baad dobara .riddle bhejo_` });
      setTimeout(() => sock.sendMessage(from, { text: `💡 Jawab: ${r.a}` }), 10000);
    },
  },
  { name: 'quote', description: 'Random quote', execute: async ({ sock, from }) => sock.sendMessage(from, { text: `💬 ${quotes[Math.floor(Math.random() * quotes.length)]}` }) },
  { name: 'motivate', description: 'Motivational line', execute: async ({ sock, from }) => sock.sendMessage(from, { text: `🔥 ${motivations[Math.floor(Math.random() * motivations.length)]}` }) },
  {
    name: 'dare',
    description: 'Random dare',
    execute: async ({ sock, from }) => {
      const dares = ['30 second tak bina rukey gaana gao.', 'Apni last selfie sabko bhejo.', 'Apne crush ka naam batao.'];
      await sock.sendMessage(from, { text: `😈 Dare: ${dares[Math.floor(Math.random() * dares.length)]}` });
    },
  },
  {
    name: 'truth',
    description: 'Random truth question',
    execute: async ({ sock, from }) => {
      const truths = ['Aapki sabse badi kamzori kya hai?', 'Kabhi kisi se jhoot bola? Kis baat pe?', 'Aapka sabse embarrassing moment kya tha?'];
      await sock.sendMessage(from, { text: `🤫 Truth: ${truths[Math.floor(Math.random() * truths.length)]}` });
    },
  },
  {
    name: 'rate',
    description: 'Kisi cheez ko 0-100 rate karo (just for fun)',
    execute: async ({ sock, from, args }) => {
      const thing = args.join(' ') || 'ye';
      await sock.sendMessage(from, { text: `⭐ "${thing}" ko main ${Math.floor(Math.random() * 101)}/100 deta hoon.` });
    },
  },
  {
    name: 'mood',
    description: 'Bot ka random mood',
    execute: async ({ sock, from }) => {
      const moods = ['😎 Chill', '😴 Sleepy', '🔥 Energetic', '🤔 Thoughtful', '😂 Playful'];
      await sock.sendMessage(from, { text: `Mood: ${moods[Math.floor(Math.random() * moods.length)]}` });
    },
  },
  {
    name: 'fortune',
    description: 'Aaj ki fortune',
    execute: async ({ sock, from }) => {
      const fortunes = ['Aaj kuch acha hone wala hai.', 'Sabr ka phal meetha hoga.', 'Ek purani baat wapas surface ho sakti hai.'];
      await sock.sendMessage(from, { text: `🔮 ${fortunes[Math.floor(Math.random() * fortunes.length)]}` });
    },
  },
  {
    name: 'ship',
    description: 'Do logon ko ship karo (% match)',
    execute: async ({ sock, from, msg, args }) => {
      const mentions = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
      const names = mentions.length >= 2 ? mentions.map((m) => `@${m.split('@')[0]}`) : args.slice(0, 2);
      if (names.length < 2) return sock.sendMessage(from, { text: 'Mention two people: .ship @a @b' });
      const pct = Math.floor(Math.random() * 101);
      await sock.sendMessage(from, { text: `💘 ${names[0]} + ${names[1]} = ${pct}% match!`, mentions });
    },
  },
  {
    name: 'compatibility',
    aliases: ['muth'],
    description: 'ship jaisa hi — compatibility % nikalta hai',
    execute: async ({ sock, from, args }) => {
      const pct = Math.floor(Math.random() * 101);
      await sock.sendMessage(from, { text: `💞 Compatibility: ${pct}% (${args.join(' ') || 'random'})` });
    },
  },
];
