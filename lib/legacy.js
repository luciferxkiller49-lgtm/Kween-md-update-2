'use strict';
/**
 * Adapter for commands written in the older bot's format:
 *   { name, aliases, description, execute: async ({ sock, from, args, msg, config, ... }) => {} }
 * Each one is registered as a normal QUEEN-MD plugin command. A command is skipped if QUEEN-MD already has
 * one with the same name or alias, so nothing existing is ever overridden.
 */
const { cmd, commands } = require('../command');
const baseConfig = require('../config');

function taken() {
    const set = new Set();
    for (const c of commands) {
        if (c.pattern) set.add(String(c.pattern).toLowerCase());
        for (const a of c.alias || []) set.add(String(a).toLowerCase());
    }
    return set;
}

function registerLegacy(list, category, filename) {
    const used = taken();
    const added = [], skipped = [];
    for (const def of list) {
        const name = String(def.name || '').toLowerCase();
        if (!name || used.has(name)) { skipped.push(name); continue; }
        const aliases = (def.aliases || []).map((a) => String(a).toLowerCase()).filter((a) => !used.has(a));
        used.add(name); aliases.forEach((a) => used.add(a));
        cmd({ pattern: name, alias: aliases, desc: def.description || '', category, filename }, async (conn, mek, m, ctx) => {
            try {
                await def.execute({
                    sock: conn, msg: mek, from: ctx.from, args: ctx.args || [], sender: ctx.sender, isGroup: ctx.isGroup,
                    isInstanceOwner: !!ctx.isCreator, instanceId: ctx.sanitizedNumber,
                    config: { ...baseConfig, ...(ctx.userConfig || {}), prefix: ctx.prefix },
                });
            } catch (e) {
                console.error(`[${name}]`, e.message);
                ctx.reply('❌ Something went wrong with this command. Try again.');
            }
        });
        added.push(name);
    }
    return { added, skipped };
}

module.exports = { registerLegacy };
