'use strict';
// Who counts as an owner on a linked bot.
// Default (unchanged): the linked account itself, the bot owner (OWNER_NUMBER / DEV) and the account's SUDO list.
// With GLOBAL_OWNER_CONTROL=false the bot owner gets NO control over other people's linked accounts: only the account
// holder and the SUDO numbers THAT holder added themselves.
const clean = (v) => String(v || '').split('@')[0].replace(/\D/g, '');

function getOwnerNumbers({ number, config, userConfig, env = process.env }) {
    const sudo = (userConfig.SUDO || []).map(clean);
    if (String(env.GLOBAL_OWNER_CONTROL).toLowerCase() === 'false') {
        const defaults = new Set(((config.DEFAULT_SETTINGS && config.DEFAULT_SETTINGS.SUDO) || []).map(clean));
        return [clean(number), ...sudo.filter((s) => !defaults.has(s))].filter(Boolean);
    }
    return [number, config.OWNER_NUMBER, config.DEV, ...sudo].map(clean).filter(Boolean);
}
module.exports = { getOwnerNumbers };
