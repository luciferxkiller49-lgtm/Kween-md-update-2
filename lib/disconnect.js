'use strict';
// What to do when a WhatsApp connection closes.
//   401 = logged out          -> remove the saved session (the device was unlinked)
//   440 = connection replaced -> the SAME session was opened somewhere else. Reconnecting here would kick the other copy,
//                                which would reconnect and kick this one, forever, until WhatsApp logs the device out.
//                                So stop here and keep the saved session untouched.
//   anything else             -> try again with a growing delay, up to maxRetries
function decideAfterClose(code, retries, maxRetries) {
    if (code === 401) return { action: 'logout' };
    if (code === 440) return { action: 'conflict' };
    const next = (retries || 0) + 1;
    if (next > maxRetries) return { action: 'giveup', retries: next };
    return { action: 'retry', retries: next, delayMs: Math.min(3000 * next, 30000) };
}
module.exports = { decideAfterClose };
