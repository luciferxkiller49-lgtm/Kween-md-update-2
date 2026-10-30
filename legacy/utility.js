const axios = require('axios');
const { getUptimeText } = require('../lib/store');

module.exports = [
  {
    name: 'weather',
    aliases: ['mausam'],
    description: 'Kisi shehar ka mausam batata hai',
    execute: async ({ sock, from, args }) => {
      const city = args.join(' ');
      if (!city) return sock.sendMessage(from, { text: 'Shehar ka naam likhein. e.g. .weather Lahore' });

      try {
        const geo = await axios.get('https://geocoding-api.open-meteo.com/v1/search', {
          params: { name: city, count: 1 },
        });
        const place = geo.data?.results?.[0];
        if (!place) return sock.sendMessage(from, { text: 'City not found.' });

        const weather = await axios.get('https://api.open-meteo.com/v1/forecast', {
          params: { latitude: place.latitude, longitude: place.longitude, current_weather: true },
        });
        const w = weather.data.current_weather;

        await sock.sendMessage(from, {
          text: `🌤️ *${place.name}, ${place.country}*\nTemperature: ${w.temperature}°C\nHawa ki raftaar: ${w.windspeed} km/h`,
        });
      } catch (err) {
        console.error(err);
        await sock.sendMessage(from, { text: '❌ Could not get weather information.' });
      }
    },
  },
  {
    name: 'translate',
    aliases: ['tr'],
    description: 'Text translate karta hai',
    execute: async ({ sock, from, args }) => {
      const targetLang = args[0];
      const text = args.slice(1).join(' ');
      if (!targetLang || !text) {
        return sock.sendMessage(from, {
          text: 'Usage: .translate <language-code> <text>\ne.g. .translate en Assalam-o-alaikum\n(codes: en, ur, ar, fr, es, etc.)',
        });
      }

      try {
        const { data } = await axios.get('https://translate.googleapis.com/translate_a/single', {
          params: { client: 'gtx', sl: 'auto', tl: targetLang, dt: 't', q: text },
        });
        const translated = data[0].map((seg) => seg[0]).join('');
        await sock.sendMessage(from, { text: `🌐 ${translated}` });
      } catch (err) {
        console.error(err);
        await sock.sendMessage(from, { text: '❌ Translation failed.' });
      }
    },
  },
  {
    name: 'uptime',
    description: 'Bot kitni der se chal raha hai',
    execute: async ({ sock, from }) => {
      await sock.sendMessage(from, { text: `⏱️ Uptime: ${getUptimeText()}` });
    },
  },
  {
    name: 'ping2',
    description: 'Speed check (detailed)',
    execute: async ({ sock, from }) => {
      const start = Date.now();
      const sent = await sock.sendMessage(from, { text: 'Pinging...' });
      const latency = Date.now() - start;
      await sock.sendMessage(from, { text: `🏓 Pong! ${latency}ms\nUptime: ${getUptimeText()}` });
    },
  },
  {
    name: 'date',
    description: 'Aaj ki tareekh',
    execute: async ({ sock, from }) => {
      await sock.sendMessage(from, { text: `📅 ${new Date().toDateString()}` });
    },
  },
  {
    name: 'timenow',
    aliases: ['time'],
    description: 'Abhi ka waqt (server time)',
    execute: async ({ sock, from }) => {
      await sock.sendMessage(from, { text: `🕐 ${new Date().toLocaleString()}` });
    },
  },
  {
    name: 'calculate',
    aliases: ['calc'],
    description: 'Simple math expression solve karta hai',
    execute: async ({ sock, from, args }) => {
      const expr = args.join(' ');
      if (!expr) return sock.sendMessage(from, { text: 'Format: .calculate 2+2*5' });
      if (!/^[0-9+\-*/().\s]+$/.test(expr)) {
        return sock.sendMessage(from, { text: '❌ Sirf numbers aur + - * / ( ) allowed hain.' });
      }
      try {
        // eslint-disable-next-line no-new-func
        const result = Function(`"use strict"; return (${expr})`)();
        await sock.sendMessage(from, { text: `🧮 ${expr} = ${result}` });
      } catch {
        await sock.sendMessage(from, { text: '❌ Could not solve that expression.' });
      }
    },
  },
  {
    name: 'base64',
    description: 'Text ko base64 mein convert karta hai',
    execute: async ({ sock, from, args }) => {
      const text = args.join(' ');
      if (!text) return sock.sendMessage(from, { text: 'Format: .base64 <text>' });
      await sock.sendMessage(from, { text: Buffer.from(text).toString('base64') });
    },
  },
  {
    name: 'unbase64',
    aliases: ['debase64'],
    description: 'Base64 ko wapas text mein convert karta hai',
    execute: async ({ sock, from, args }) => {
      const text = args.join(' ');
      if (!text) return sock.sendMessage(from, { text: 'Format: .unbase64 <base64-text>' });
      try {
        await sock.sendMessage(from, { text: Buffer.from(text, 'base64').toString('utf-8') });
      } catch {
        await sock.sendMessage(from, { text: '❌ That is not valid base64 text.' });
      }
    },
  },
  {
    name: 'urlencode',
    description: 'Text ko URL-encode karta hai',
    execute: async ({ sock, from, args }) => {
      const text = args.join(' ');
      if (!text) return sock.sendMessage(from, { text: 'Format: .urlencode <text>' });
      await sock.sendMessage(from, { text: encodeURIComponent(text) });
    },
  },
  {
    name: 'urldecode',
    description: 'URL-encoded text ko wapas decode karta hai',
    execute: async ({ sock, from, args }) => {
      const text = args.join(' ');
      if (!text) return sock.sendMessage(from, { text: 'Format: .urldecode <encoded-text>' });
      try {
        await sock.sendMessage(from, { text: decodeURIComponent(text) });
      } catch {
        await sock.sendMessage(from, { text: '❌ Could not decode that.' });
      }
    },
  },
  {
    name: 'binary',
    description: 'Text ko binary mein convert karta hai',
    execute: async ({ sock, from, args }) => {
      const text = args.join(' ');
      if (!text) return sock.sendMessage(from, { text: 'Format: .binary <text>' });
      const bin = text
        .split('')
        .map((c) => c.charCodeAt(0).toString(2).padStart(8, '0'))
        .join(' ');
      await sock.sendMessage(from, { text: bin });
    },
  },
  {
    name: 'dbinary',
    description: 'Binary ko wapas text mein convert karta hai',
    execute: async ({ sock, from, args }) => {
      const bin = args.join('');
      if (!bin) return sock.sendMessage(from, { text: 'Format: .dbinary <binary text (bina space)>' });
      try {
        const text = bin
          .match(/.{1,8}/g)
          .map((b) => String.fromCharCode(parseInt(b, 2)))
          .join('');
        await sock.sendMessage(from, { text });
      } catch {
        await sock.sendMessage(from, { text: '❌ That is not valid binary text.' });
      }
    },
  },
  {
    name: 'id',
    aliases: ['getlid'],
    description: 'Is chat/group ki WhatsApp ID batata hai',
    execute: async ({ sock, from }) => {
      await sock.sendMessage(from, { text: `🆔 ${from}` });
    },
  },
  {
    name: 'define',
    description: 'Kisi word ki dictionary meaning',
    execute: async ({ sock, from, args }) => {
      const word = args.join(' ');
      if (!word) return sock.sendMessage(from, { text: 'Format: .define <word>' });
      try {
        const { data } = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
        const meaning = data[0]?.meanings?.[0]?.definitions?.[0]?.definition;
        await sock.sendMessage(from, { text: meaning ? `📖 *${word}*\n${meaning}` : 'Meaning not found.' });
      } catch {
        await sock.sendMessage(from, { text: '❌ Word not found in the dictionary.' });
      }
    },
  },
  {
    name: 'wikipedia',
    aliases: ['wiki'],
    description: 'Wikipedia se summary laata hai',
    execute: async ({ sock, from, args }) => {
      const query = args.join(' ');
      if (!query) return sock.sendMessage(from, { text: 'Format: .wikipedia <topic>' });
      try {
        const { data } = await axios.get(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`
        );
        await sock.sendMessage(from, { text: `📚 *${data.title}*\n${data.extract}` });
      } catch {
        await sock.sendMessage(from, { text: '❌ Topic not found on Wikipedia.' });
      }
    },
  },
  {
    name: 'lid',
    description: 'Is chat ki WhatsApp ID batata hai (id jaisa hi)',
    execute: async ({ sock, from }) => {
      await sock.sendMessage(from, { text: `🆔 ${from}` });
    },
  },
  {
    name: 'countryinfo',
    description: 'Kisi mulk ki maloomat',
    execute: async ({ sock, from, args }) => {
      const country = args.join(' ');
      if (!country) return sock.sendMessage(from, { text: 'Format: .countryinfo Pakistan' });
      try {
        const { data } = await axios.get(`https://restcountries.com/v3.1/name/${encodeURIComponent(country)}`);
        const c = data[0];
        await sock.sendMessage(from, {
          text: `🌍 *${c.name.common}*\nCapital: ${c.capital?.[0] || 'N/A'}\nPopulation: ${c.population.toLocaleString()}\nRegion: ${c.region}\nCurrency: ${Object.values(c.currencies || {})[0]?.name || 'N/A'}`,
        });
      } catch {
        await sock.sendMessage(from, { text: '❌ Country not found.' });
      }
    },
  },
  {
    name: 'praytime',
    description: 'Namaz ke auqaat batata hai (shehar ka naam dein)',
    execute: async ({ sock, from, args }) => {
      const city = args.join(' ');
      if (!city) return sock.sendMessage(from, { text: 'Format: .praytime Lahore' });
      try {
        const { data } = await axios.get(
          `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=Pakistan&method=1`
        );
        if (data.code !== 200) throw new Error('not found');
        const t = data.data.timings;
        await sock.sendMessage(from, {
          text:
            `🕌 *Namaz Timings — ${city}*\n\n` +
            `Fajr: ${t.Fajr}\nDhuhr: ${t.Dhuhr}\nAsr: ${t.Asr}\n` +
            `Maghrib: ${t.Maghrib}\nIsha: ${t.Isha}`,
        });
      } catch {
        await sock.sendMessage(from, { text: '❌ City not found. Poora naam try karein (e.g. Lahore, Karachi).' });
      }
    },
  },
  {
    name: 'rcolor',
    description: 'Random color deta hai (hex code)',
    execute: async ({ sock, from }) => {
      const hex = '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
      await sock.sendMessage(from, { text: `🎨 Random color: ${hex}` });
    },
  },
  {
    name: 'person',
    description: 'Random fake person (fun ke liye)',
    execute: async ({ sock, from }) => {
      try {
        const { data } = await axios.get('https://randomuser.me/api/');
        const p = data.results[0];
        await sock.sendMessage(from, {
          image: { url: p.picture.large },
          caption: `👤 ${p.name.first} ${p.name.last}\n📍 ${p.location.city}, ${p.location.country}\n🎂 Age: ${p.dob.age}`,
        });
      } catch {
        await sock.sendMessage(from, { text: '❌ Could not generate a person.' });
      }
    },
  },
  {
    name: 'readmore',
    description: 'Chhota text bhejta hai jo WhatsApp mein "Read more" ke peeche lamba dikhega',
    execute: async ({ sock, from, args }) => {
      const [visible, ...rest] = args.join(' ').split('|');
      const hidden = rest.join('|').trim();
      if (!hidden) return sock.sendMessage(from, { text: 'Format: .readmore Visible text | Hidden lamba text' });
      const invisibleFiller = '\u200e'.repeat(4001);
      await sock.sendMessage(from, { text: `${visible.trim()}${invisibleFiller}${hidden}` });
    },
  },
  {
    name: 'wstalk',
    description: 'Kisi number ki WhatsApp profile pic + about dikhata hai',
    execute: async ({ sock, from, args, msg }) => {
      const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      const number = mentioned || (args[0] ? `${args[0].replace(/[^0-9]/g, '')}@s.whatsapp.net` : null);
      if (!number) return sock.sendMessage(from, { text: 'Format: .wstalk 923001234567 (ya kisi ko mention karein)' });

      try {
        let pic = null;
        try {
          pic = await sock.profilePictureUrl(number, 'image');
        } catch {}
        let about = 'N/A';
        try {
          const status = await sock.fetchStatus(number);
          about = status?.status || 'N/A';
        } catch {}

        const caption = `📱 ${number.split('@')[0]}\n💬 About: ${about}`;
        if (pic) {
          await sock.sendMessage(from, { image: { url: pic }, caption });
        } else {
          await sock.sendMessage(from, { text: `${caption}\n(No profile picture)` });
        }
      } catch {
        await sock.sendMessage(from, { text: '❌ That number could not be found.' });
      }
    },
  },
  {
    name: 'convert',
    description: 'Simple unit conversion: km-mi, kg-lb, c-f',
    execute: async ({ sock, from, args }) => {
      const [amountStr, unitPair] = args;
      const amount = parseFloat(amountStr);
      if (isNaN(amount) || !unitPair) {
        return sock.sendMessage(from, { text: 'Format: .convert 10 km-mi (options: km-mi, kg-lb, c-f)' });
      }
      let result, label;
      switch (unitPair.toLowerCase()) {
        case 'km-mi': result = amount * 0.621371; label = 'miles'; break;
        case 'mi-km': result = amount / 0.621371; label = 'km'; break;
        case 'kg-lb': result = amount * 2.20462; label = 'lb'; break;
        case 'lb-kg': result = amount / 2.20462; label = 'kg'; break;
        case 'c-f': result = amount * 9 / 5 + 32; label = '°F'; break;
        case 'f-c': result = (amount - 32) * 5 / 9; label = '°C'; break;
        default: return sock.sendMessage(from, { text: 'Options: km-mi, mi-km, kg-lb, lb-kg, c-f, f-c' });
      }
      await sock.sendMessage(from, { text: `${amount} → ${result.toFixed(2)} ${label}` });
    },
  },
];
