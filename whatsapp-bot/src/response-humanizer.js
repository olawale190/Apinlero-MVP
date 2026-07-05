/**
 * Response Humanizer
 *
 * Takes the deterministic reply produced by the order engine (templates)
 * and rewrites it with Claude so it reads like a real person on WhatsApp —
 * warm, natural, mirrors the customer's tone (English or Nigerian Pidgin).
 *
 * Safety model:
 * - The order engine remains the source of truth for ALL facts.
 * - A fact guard verifies every price, link and payment detail from the
 *   draft survives the rewrite; otherwise the original draft is sent.
 * - Any API error or timeout falls back to the original draft, so the
 *   bot never goes silent because of this layer.
 */

import Anthropic from '@anthropic-ai/sdk';
import 'dotenv/config';

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const MODEL = process.env.HUMANIZER_MODEL || 'claude-haiku-4-5';
const TIMEOUT_MS = parseInt(process.env.HUMANIZER_TIMEOUT_MS || '6000', 10);

const SYSTEM_PROMPT = `You are the WhatsApp voice of an African grocery shop in London (think of a warm, sharp Nigerian aunty who runs the shop and knows her regulars).

You receive the recent conversation, the customer's latest message, and a DRAFT reply written by the shop's ordering system. Rewrite the draft so it sounds like a real person chatting on WhatsApp — not a bot.

STRICT RULES (breaking any of these ruins the order):
1. Keep EVERY fact from the draft exactly as written: product names, quantities, prices, totals, delivery fees, addresses, order numbers, bank details (sort code, account number, reference), payment links and URLs. Never change, add or remove numbers, products or links.
2. If the draft asks the customer a question or for a decision, your rewrite MUST ask the SAME question and wait for the SAME answer. This is critical: if the draft asks "did you mean X?" or "say yes to confirm", your rewrite must also ask them to confirm (expecting a yes/no) — never assume the answer, never skip ahead to the next step, never replace a confirmation question with a different request.
3. Never invent stock, discounts, delivery times, or promises that are not in the draft. Never include a phone number, price or link that is not in the draft — if the draft says there was an error, just apologise briefly and ask them to try again; do NOT tell them to call anyone.
4. Mirror the customer's vibe: if they write Nigerian Pidgin or casual slang, reply with natural light pidgin ("no wahala", "I don add am for you", "abeg confirm make I package am"). If they write plain English, stay warm but plain. Never overdo the pidgin — a real person, not a caricature.
5. WhatsApp style: short lines, no corporate phrases ("we are pleased to inform you" is banned). Keep item lists as bullet lists. At most 1–2 emojis.
6. Keep it the same length as the draft or shorter.
7. Use the customer's name occasionally, not in every message.

Output ONLY the rewritten message text — no preamble, no quotes, no markdown fences.`;

/**
 * Extract the facts in a draft that must survive rewriting.
 */
function extractFacts(text) {
  const facts = [];
  const money = text.match(/£\d+(?:\.\d{1,2})?/g);
  if (money) facts.push(...money);
  const urls = text.match(/https?:\/\/[^\s)]+/g);
  if (urls) facts.push(...urls);
  const sortCodes = text.match(/\b\d{2}-\d{2}-\d{2}\b/g);
  if (sortCodes) facts.push(...sortCodes);
  const accountNos = text.match(/\b\d{8}\b/g);
  if (accountNos) facts.push(...accountNos);
  const orderRefs = text.match(/#:?\s*([A-Z0-9]{8})/g);
  if (orderRefs) facts.push(...orderRefs.map(r => r.replace(/#:?\s*/, '')));
  return facts;
}

function factsSurvived(draft, rewrite) {
  const facts = extractFacts(draft);
  return facts.every(f => rewrite.includes(f));
}

/**
 * Reject rewrites that INVENT facts not present in the draft:
 * new prices, links, or phone-number-like digit runs.
 */
function noInventedFacts(draft, rewrite) {
  const draftMoney = new Set(draft.match(/£\d+(?:\.\d{1,2})?/g) || []);
  for (const m of rewrite.match(/£\d+(?:\.\d{1,2})?/g) || []) {
    if (!draftMoney.has(m)) return false;
  }

  const draftUrls = new Set(draft.match(/https?:\/\/[^\s)]+/g) || []);
  for (const u of rewrite.match(/https?:\/\/[^\s)]+/g) || []) {
    if (!draftUrls.has(u)) return false;
  }

  // Phone-number-like sequences (7+ digits, allowing spaces/dashes)
  const digitRuns = (t) => (t.match(/(?:\+?\d[\d\s-]{6,}\d)/g) || []).map(s => s.replace(/\D/g, ''));
  const draftDigits = new Set(digitRuns(draft));
  for (const d of digitRuns(rewrite)) {
    if (!draftDigits.has(d)) return false;
  }

  return true;
}

function formatHistory(history) {
  if (!history || history.length === 0) return '(no earlier messages)';
  return history
    .map(m => `${m.direction === 'inbound' ? 'Customer' : 'You'}: ${(m.text || '').substring(0, 300)}`)
    .join('\n');
}

/**
 * Rewrite a draft reply in a human voice.
 *
 * @param {Object} params
 * @param {string} params.draftText - Reply produced by the order engine
 * @param {string} params.customerMessage - The customer's latest message
 * @param {string|null} params.customerName - Customer name if known
 * @param {Array<{direction: string, text: string}>} params.history - Recent messages, oldest first
 * @returns {Promise<string|null>} Humanized text, or null to use the draft as-is
 */
export async function humanizeResponse({ draftText, customerMessage, customerName, history = [] }) {
  if (!client || process.env.HUMANIZER_DISABLED === 'true') return null;
  if (!draftText || draftText.trim().length < 25) return null;

  const userPrompt = `RECENT CONVERSATION:
${formatHistory(history)}

CUSTOMER'S LATEST MESSAGE:
${customerMessage || '(button tap)'}
${customerName ? `\nCUSTOMER NAME: ${customerName}` : ''}

DRAFT REPLY FROM THE ORDERING SYSTEM:
${draftText}

Rewrite the draft reply now.`;

  try {
    const request = client.messages.create({
      model: MODEL,
      max_tokens: 700,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }]
    });

    const result = await Promise.race([
      request,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('humanizer timeout')), TIMEOUT_MS)
      )
    ]);

    const rewrite = result?.content?.[0]?.text?.trim();
    if (!rewrite) return null;

    if (!factsSurvived(draftText, rewrite) || !noInventedFacts(draftText, rewrite)) {
      console.warn('[humanizer] Fact guard tripped — sending original draft');
      return null;
    }

    return rewrite;
  } catch (err) {
    console.warn('[humanizer] Skipped (fallback to draft):', err.message);
    return null;
  }
}
