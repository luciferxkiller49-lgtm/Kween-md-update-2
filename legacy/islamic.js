// Islamic Menu — sab canned/static text hain, koi external API nahi chahiye

const duaForgiveness = 'اللّٰهُمَّ اغْفِرْ لِي ذَنْبِي كُلَّهُ دِقَّهُ وَجِلَّهُ\n"Ya Allah, meri poori khata maaf farma — chhoti bhi, badi bhi."';
const duaRizq = 'اللَّهُمَّ اكْفِنِي بِحَلَالِكَ عَنْ حَرَامِكَ وَأَغْنِنِي بِفَضْلِكَ عَمَّنْ سِوَاكَ\n"Ya Allah, apna halal rizq itna ata farma ke haram ki zaroorat na rahe."';
const duaGuidance = 'اللَّهُمَّ اهْدِنِي وَسَدِّدْنِي\n"Ya Allah, mujhe hidayat de aur seedhe raste par qaim rakh."';
const duaHealth = 'اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي\n"Ya Allah, mera badan, meri sunne aur dekhne ki taqat theek rakh."';

module.exports = [
  { name: 'duaforgiveness', description: 'Maghfirat ki dua', execute: async ({ sock, from }) => sock.sendMessage(from, { text: `🤲 *Dua for Forgiveness*\n\n${duaForgiveness}` }) },
  { name: 'duarizq', description: 'Rizq ki dua', execute: async ({ sock, from }) => sock.sendMessage(from, { text: `🤲 *Dua for Rizq*\n\n${duaRizq}` }) },
  { name: 'duaguidance', description: 'Hidayat ki dua', execute: async ({ sock, from }) => sock.sendMessage(from, { text: `🤲 *Dua for Guidance*\n\n${duaGuidance}` }) },
  { name: 'duahealth', description: 'Sehat ki dua', execute: async ({ sock, from }) => sock.sendMessage(from, { text: `🤲 *Dua for Health*\n\n${duaHealth}` }) },
  { name: 'zikrastaghfirullah', description: 'Astaghfirullah zikr', execute: async ({ sock, from }) => sock.sendMessage(from, { text: '📿 *أَسْتَغْفِرُ اللّٰهَ*\n"Main Allah se maghfirat maangta hoon."' }) },
  { name: 'zikralhamdulillah', description: 'Alhamdulillah zikr', execute: async ({ sock, from }) => sock.sendMessage(from, { text: '📿 *الْحَمْدُ لِلّٰهِ*\n"Har tarah ki tareef Allah ke liye hai."' }) },
  { name: 'zikrsubhanallah', description: 'Subhanallah zikr', execute: async ({ sock, from }) => sock.sendMessage(from, { text: '📿 *سُبْحَانَ اللّٰهِ*\n"Allah paak hai har aib se."' }) },
  { name: 'zikrallahuakbar', description: 'Allahu Akbar zikr', execute: async ({ sock, from }) => sock.sendMessage(from, { text: '📿 *اللّٰهُ أَكْبَرُ*\n"Allah sab se bara hai."' }) },
  { name: 'zikrlailahaillallah', description: 'Kalima tawheed zikr', execute: async ({ sock, from }) => sock.sendMessage(from, { text: '📿 *لَا إِلَٰهَ إِلَّا اللّٰهُ*\n"Allah ke siwa koi ibadat ke laiq nahi."' }) },
  { name: 'zikrlahawla', description: 'La hawla zikr', execute: async ({ sock, from }) => sock.sendMessage(from, { text: '📿 *لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللّٰهِ*\n"Koi taqat aur qudrat nahi magar Allah ki taraf se."' }) },
  { name: 'hadithgoodmorals', description: 'Achay akhlaq wali hadith', execute: async ({ sock, from }) => sock.sendMessage(from, { text: '📖 *Hadith — Good Morals*\n"Sab se kamil momin wo hai jiska akhlaq sab se acha ho." (Tirmidhi)' }) },
  { name: 'hadithcleanliness', description: 'Safai wali hadith', execute: async ({ sock, from }) => sock.sendMessage(from, { text: '📖 *Hadith — Cleanliness*\n"Safai nisf iman hai." (Sahih Muslim)' }) },
  { name: 'hadithtruth', description: 'Sachai wali hadith', execute: async ({ sock, from }) => sock.sendMessage(from, { text: '📖 *Hadith — Truth*\n"Sachai neki ki taraf le jaati hai, aur neki jannat ki taraf." (Sahih Bukhari)' }) },
  { name: 'hadithpatience', description: 'Sabr wali hadith', execute: async ({ sock, from }) => sock.sendMessage(from, { text: '📖 *Hadith — Patience*\n"Sabr roshni hai." (Sahih Muslim)' }) },
  { name: 'daroodsharif', description: 'Darood Sharif', execute: async ({ sock, from }) => sock.sendMessage(from, { text: '🕌 *Darood Sharif*\n\nاللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ وَعَلَىٰ آلِ مُحَمَّدٍ' }) },
  { name: 'kalimatayyiba', description: 'Kalima Tayyiba', execute: async ({ sock, from }) => sock.sendMessage(from, { text: '🕌 *Kalima Tayyiba*\n\nلَا إِلَٰهَ إِلَّا اللّٰهُ مُحَمَّدٌ رَسُولُ اللّٰهِ' }) },
  {
    name: 'islamfact',
    description: 'Random Islamic fact',
    execute: async ({ sock, from }) => {
      const facts = [
        'Makkah duniya ki sabse purani aabaad shehron mein se ek hai.',
        'Quran Pak 23 saal ke arse mein nazil hua.',
        'Namaz din mein 5 dafa farz hai — Fajr, Zuhr, Asr, Maghrib, Isha.',
        'Zakat Islam ke 5 arkaan mein se ek hai.',
        'Ramzan mein Quran ki pehli ayat nazil hui thi.',
      ];
      await sock.sendMessage(from, { text: `☪️ *Islam Fact*\n\n${facts[Math.floor(Math.random() * facts.length)]}` });
    },
  },
  {
    name: 'quranreminder',
    description: 'Quran se reminder',
    execute: async ({ sock, from }) => {
      const reminders = [
        '"Beshak mushkil ke sath aasani hai." (Surah Ash-Sharh 94:6)',
        '"Allah kisi jaan par uski taqat se zyada bojh nahi daalta." (Surah Al-Baqarah 2:286)',
        '"Aur Allah sabr karne walon ke sath hai." (Surah Al-Baqarah 2:153)',
      ];
      await sock.sendMessage(from, { text: `📖 *Quran Reminder*\n\n${reminders[Math.floor(Math.random() * reminders.length)]}` });
    },
  },
  { name: 'naat', description: 'Naat ka link/reference', execute: async ({ sock, from }) => sock.sendMessage(from, { text: '🎙️ Naat feature abhi audio library ke bina available nahi — is par kaam ho raha hai.' }) },
];
