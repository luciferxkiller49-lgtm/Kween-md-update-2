'use strict';
// The Signal encryption library prints whole session records to the console ("Closing session: SessionEntry {...}").
// Those records contain private keys, and they flood the logs. Drop just those lines.
const NOISE = /^(Closing session|Opening session|Removing old closed session|Migrating session|Session already (closed|open)|Closing open session)/;

function silenceSignalLogs(target = console) {
    for (const m of ['log', 'info', 'warn', 'debug']) {
        const original = target[m] && target[m].bind(target);
        if (!original) continue;
        target[m] = (...args) => {
            if (typeof args[0] === 'string' && NOISE.test(args[0])) return;
            original(...args);
        };
    }
    return target;
}
module.exports = { silenceSignalLogs, NOISE };
