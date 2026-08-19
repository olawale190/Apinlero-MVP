/**
 * Supabase keep-alive heartbeat.
 *
 * WHY THIS EXISTS
 * ---------------
 * Supabase free-tier projects pause after 7 days with no DATABASE activity —
 * dashboard visits and cached API calls do not count, only real queries. On
 * 2026-08-08 the project paused mid-afternoon and took the storefront, the
 * dashboard and this bot down with it for ~40 minutes.
 *
 * The risk is worst in the window before a shop has customers: exactly when
 * the vendor is handing out their WhatsApp link. A customer who messages a
 * paused shop gets silence and does not come back to try again.
 *
 * This runs a trivial query on a schedule so the 7-day timer never expires.
 * It must be a real SELECT against a real table — pinging the API gateway is
 * not enough, because that can be answered without waking the database.
 *
 * This is a BRIDGE, not a fix. It does nothing about the free tier having no
 * backups and no point-in-time recovery, which is the reason to move to Pro
 * before real money and real customer data are involved.
 *
 * Disable with SUPABASE_KEEPALIVE_HOURS=0.
 */

import { supabase } from './supabase-client.js';

const DEFAULT_INTERVAL_HOURS = 12;

let timer = null;
let consecutiveFailures = 0;

async function beat() {
  const startedAt = Date.now();
  try {
    // Cheapest possible real query: one indexed column, one row, no joins.
    const { error } = await supabase
      .from('businesses')
      .select('id')
      .limit(1);

    if (error) throw new Error(error.message);

    if (consecutiveFailures > 0) {
      console.log(
        `💓 [keepalive] Supabase reachable again after ${consecutiveFailures} failed attempt(s)`,
      );
    }
    consecutiveFailures = 0;
    console.log(`💓 [keepalive] Supabase ok (${Date.now() - startedAt}ms)`);
  } catch (err) {
    consecutiveFailures++;
    // Loud, because this is the early warning that the shop is about to look
    // broken to customers. Never rethrow — a failed heartbeat must not take
    // the bot down with it.
    console.error(
      `⚠️ [keepalive] Supabase unreachable (attempt ${consecutiveFailures}): ${err.message}`,
    );
    if (consecutiveFailures >= 3) {
      console.error(
        '🚨 [keepalive] Supabase has failed 3+ heartbeats in a row. The ' +
          'storefront, dashboard and this bot are probably all down. Check ' +
          'whether the project is paused: supabase.com/dashboard',
      );
    }
  }
}

/**
 * Start the heartbeat. Safe to call more than once; later calls are ignored.
 * @returns {boolean} whether the heartbeat is now running
 */
export function startKeepalive() {
  if (timer) return true;

  const hours = Number(
    process.env.SUPABASE_KEEPALIVE_HOURS ?? DEFAULT_INTERVAL_HOURS,
  );

  if (!Number.isFinite(hours) || hours <= 0) {
    console.log('💤 [keepalive] disabled (SUPABASE_KEEPALIVE_HOURS=0)');
    return false;
  }

  const intervalMs = hours * 60 * 60 * 1000;

  // Beat once on boot: a deploy after a quiet spell is exactly when the
  // project may already be close to the 7-day line.
  beat();

  timer = setInterval(beat, intervalMs);
  // Don't hold the event loop open on shutdown.
  if (typeof timer.unref === 'function') timer.unref();

  console.log(
    `💓 [keepalive] Supabase heartbeat every ${hours}h ` +
      '(free-tier projects pause after 7 days idle)',
  );
  return true;
}

/** Stop the heartbeat — used by tests. */
export function stopKeepalive() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
