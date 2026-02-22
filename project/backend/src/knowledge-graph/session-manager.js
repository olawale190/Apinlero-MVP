/**
 * Apinlero Knowledge Graph - Session Manager
 *
 * Manages conversation state for WhatsApp ordering flow.
 * Uses Supabase conversation_sessions table.
 *
 * States: IDLE, ORDERING, CONFIRMING, MODIFYING, AWAITING_CLARIFICATION
 */

import supabase from './supabase-client.js';

/**
 * Get an active session for a phone number, or create a new one.
 * Resets expired sessions automatically.
 */
export async function getOrCreateSession(phone) {
  // Look for an existing non-expired session
  const { data: existing, error: fetchErr } = await supabase
    .from('conversation_sessions')
    .select('*')
    .eq('customer_phone', phone)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchErr) {
    console.error('[session-manager] Fetch error:', fetchErr.message);
    throw fetchErr;
  }

  if (existing) {
    // Check if expired
    if (new Date(existing.expires_at) < new Date()) {
      // Delete expired session and create fresh
      await supabase
        .from('conversation_sessions')
        .delete()
        .eq('id', existing.id);
    } else {
      return existing;
    }
  }

  // Create new session
  const { data: created, error: createErr } = await supabase
    .from('conversation_sessions')
    .insert([{
      customer_phone: phone,
      state: 'IDLE',
      current_order: [],
      pending_question: null,
      context: null,
    }])
    .select()
    .single();

  if (createErr) {
    console.error('[session-manager] Create error:', createErr.message);
    throw createErr;
  }

  return created;
}

/**
 * Update a session's state, current_order, pending_question, or context.
 * Automatically bumps updated_at and extends expires_at.
 */
export async function updateSession(sessionId, updates) {
  const patch = {
    ...updates,
    updated_at: new Date().toISOString(),
    // Extend expiry on every interaction
    expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  };

  const { data, error } = await supabase
    .from('conversation_sessions')
    .update(patch)
    .eq('id', sessionId)
    .select()
    .single();

  if (error) {
    console.error('[session-manager] Update error:', error.message);
    throw error;
  }

  return data;
}

/**
 * Clear a session (delete it) and effectively return to IDLE.
 */
export async function clearSession(phone) {
  const { error } = await supabase
    .from('conversation_sessions')
    .delete()
    .eq('customer_phone', phone);

  if (error) {
    console.error('[session-manager] Clear error:', error.message);
    throw error;
  }
}
