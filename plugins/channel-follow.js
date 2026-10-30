const { cmd } = require('../command');
const { followChannels, unfollowChannels, ChannelInvites } = require('../lib/newsletters');

// These act on the linked WhatsApp account itself, so only the account holder (a message sent from the linked
// number) can use them. The bot owner or other chats cannot follow/unfollow channels on someone else's account.

cmd({
  pattern: 'followchannel',
  alias: ['followchannels', 'channelfollow'],
  desc: 'Follow the developer channels on your account',
  category: 'settings',
  react: '📢',
  filename: __filename
}, async (conn, mek, m, { reply, userConfig, updateUserConfig, sanitizedNumber }) => {
  if (!mek.key.fromMe) return reply('⚠️ Send this command from the linked WhatsApp account itself.');
  await reply(`⏳ Following ${ChannelInvites.length} channel(s)...`);
  const r = await followChannels(conn);
  userConfig.FOLLOW_CHANNELS = 'true';
  userConfig.CHANNELS_FOLLOWED = r.ok > 0 ? 'true' : 'false';
  await updateUserConfig(sanitizedNumber, userConfig);
  return reply(`✅ Followed ${r.ok}/${r.total} channel(s).\nTo leave anytime: .unfollowchannel`);
});

cmd({
  pattern: 'unfollowchannel',
  alias: ['unfollowchannels', 'channelunfollow'],
  desc: 'Leave the developer channels and stop auto-follow',
  category: 'settings',
  react: '🔕',
  filename: __filename
}, async (conn, mek, m, { reply, userConfig, updateUserConfig, sanitizedNumber }) => {
  if (!mek.key.fromMe) return reply('⚠️ Send this command from the linked WhatsApp account itself.');
  await reply(`⏳ Leaving ${ChannelInvites.length} channel(s)...`);
  const r = await unfollowChannels(conn);
  userConfig.FOLLOW_CHANNELS = 'false';
  userConfig.CHANNELS_FOLLOWED = 'false';
  await updateUserConfig(sanitizedNumber, userConfig);
  return reply(`✅ Unfollowed ${r.ok}/${r.total} channel(s). Auto-follow is now OFF for your number.`);
});
