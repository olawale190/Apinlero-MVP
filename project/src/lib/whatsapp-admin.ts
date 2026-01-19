/**
 * WhatsApp Admin Functions
 *
 * API functions for managing WhatsApp configurations in the Apinlero dashboard
 */

import { supabase } from './supabase';

// Types
export interface WhatsAppConfig {
  id: string;
  business_id: string;
  phone_number_id: string | null;
  waba_id: string | null;
  access_token: string | null;
  twilio_account_sid: string | null;
  twilio_auth_token: string | null;
  twilio_phone_number: string | null;
  webhook_verify_token: string;
  webhook_secret: string | null;
  provider: 'meta' | 'twilio';
  display_phone_number: string | null;
  business_name: string | null;
  is_verified: boolean;
  is_active: boolean;
  last_webhook_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppStats {
  totalMessages: number;
  messagesReceived: number;
  messagesSent: number;
  uniqueCustomers: number;
  conversationsToday: number;
  averageResponseTime: number | null;
}

export interface MessageLog {
  id: string;
  business_id: string;
  message_id: string | null;
  direction: 'inbound' | 'outbound';
  customer_phone: string;
  message_type: string;
  content: string | null;
  status: string;
  intent_detected: string | null;
  timestamp: string;
}

// Generate a random verify token
function generateVerifyToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Get WhatsApp configuration for a business
 */
export async function getWhatsAppConfig(businessId: string): Promise<WhatsAppConfig | null> {
  const { data, error } = await supabase
    .from('whatsapp_configs')
    .select('*')
    .eq('business_id', businessId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No config found - that's okay
      return null;
    }
    console.error('Failed to get WhatsApp config:', error);
    return null;
  }

  return data;
}

/**
 * Create or update WhatsApp configuration
 */
export async function saveWhatsAppConfig(
  businessId: string,
  config: Partial<WhatsAppConfig>
): Promise<{ success: boolean; config?: WhatsAppConfig; error?: string }> {
  try {
    // Generate verify token if not provided
    const verifyToken = config.webhook_verify_token || generateVerifyToken();

    const configData = {
      business_id: businessId,
      phone_number_id: config.phone_number_id || null,
      waba_id: config.waba_id || null,
      access_token: config.access_token || null,
      twilio_account_sid: config.twilio_account_sid || null,
      twilio_auth_token: config.twilio_auth_token || null,
      twilio_phone_number: config.twilio_phone_number || null,
      webhook_verify_token: verifyToken,
      provider: config.provider || 'meta',
      display_phone_number: config.display_phone_number || null,
      business_name: config.business_name || null,
      is_active: config.is_active ?? true,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('whatsapp_configs')
      .upsert(configData, {
        onConflict: 'business_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to save WhatsApp config:', error);
      return { success: false, error: error.message };
    }

    return { success: true, config: data };
  } catch (error) {
    console.error('Save config error:', error);
    return { success: false, error: 'Failed to save configuration' };
  }
}

/**
 * Test WhatsApp Cloud API connection
 */
export async function testMetaConnection(
  phoneNumberId: string,
  accessToken: string
): Promise<{ success: boolean; phoneNumber?: string; error?: string }> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}?access_token=${accessToken}`
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error?.message || 'Failed to connect to Meta API'
      };
    }

    return {
      success: true,
      phoneNumber: data.display_phone_number || data.verified_name
    };
  } catch (error) {
    return {
      success: false,
      error: 'Network error - could not reach Meta API'
    };
  }
}

/**
 * Get WhatsApp message statistics
 */
export async function getWhatsAppStats(
  businessId: string,
  days: number = 30
): Promise<WhatsAppStats> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get message counts
  const { data: messages, error } = await supabase
    .from('whatsapp_message_logs')
    .select('direction, customer_phone, response_time_ms, timestamp')
    .eq('business_id', businessId)
    .gte('timestamp', startDate.toISOString());

  if (error || !messages) {
    console.error('Failed to get message stats:', error);
    return {
      totalMessages: 0,
      messagesReceived: 0,
      messagesSent: 0,
      uniqueCustomers: 0,
      conversationsToday: 0,
      averageResponseTime: null
    };
  }

  const received = messages.filter(m => m.direction === 'inbound').length;
  const sent = messages.filter(m => m.direction === 'outbound').length;
  const uniquePhones = new Set(messages.map(m => m.customer_phone)).size;

  // Get today's conversations
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMessages = messages.filter(m => new Date(m.timestamp) >= today);
  const todayConversations = new Set(todayMessages.map(m => m.customer_phone)).size;

  // Calculate average response time
  const responseTimes = messages
    .filter(m => m.response_time_ms)
    .map(m => m.response_time_ms);
  const avgResponseTime = responseTimes.length > 0
    ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
    : null;

  return {
    totalMessages: messages.length,
    messagesReceived: received,
    messagesSent: sent,
    uniqueCustomers: uniquePhones,
    conversationsToday: todayConversations,
    averageResponseTime: avgResponseTime
  };
}

/**
 * Get recent message logs
 */
export async function getMessageLogs(
  businessId: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ logs: MessageLog[]; total: number }> {
  // Get total count
  const { count } = await supabase
    .from('whatsapp_message_logs')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId);

  // Get logs
  const { data, error } = await supabase
    .from('whatsapp_message_logs')
    .select('*')
    .eq('business_id', businessId)
    .order('timestamp', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Failed to get message logs:', error);
    return { logs: [], total: 0 };
  }

  return {
    logs: data || [],
    total: count || 0
  };
}

/**
 * Get daily analytics for a business
 */
export async function getDailyAnalytics(
  businessId: string,
  days: number = 7
): Promise<Array<{
  date: string;
  messagesReceived: number;
  messagesSent: number;
  uniqueCustomers: number;
  ordersCreated: number;
}>> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('whatsapp_analytics_daily')
    .select('*')
    .eq('business_id', businessId)
    .gte('date', startDate.toISOString().split('T')[0])
    .order('date', { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map(d => ({
    date: d.date,
    messagesReceived: d.messages_received || 0,
    messagesSent: d.messages_sent || 0,
    uniqueCustomers: d.unique_customers || 0,
    ordersCreated: d.orders_created || 0
  }));
}

/**
 * Regenerate webhook verify token
 */
export async function regenerateVerifyToken(
  businessId: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  const newToken = generateVerifyToken();

  const { error } = await supabase
    .from('whatsapp_configs')
    .update({
      webhook_verify_token: newToken,
      updated_at: new Date().toISOString()
    })
    .eq('business_id', businessId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, token: newToken };
}

/**
 * Toggle WhatsApp integration active status
 */
export async function toggleWhatsAppActive(
  businessId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('whatsapp_configs')
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString()
    })
    .eq('business_id', businessId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Get webhook URL for Meta configuration
 */
export function getWebhookUrl(n8nBaseUrl: string): string {
  return `${n8nBaseUrl}/webhook/whatsapp/webhook`;
}

/**
 * Delete WhatsApp configuration
 */
export async function deleteWhatsAppConfig(
  businessId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('whatsapp_configs')
    .delete()
    .eq('business_id', businessId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
