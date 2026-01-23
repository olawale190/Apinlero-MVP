/**
 * Àpínlẹ̀rọ Supabase Client v2.0.0
 *
 * Database operations for the WhatsApp bot
 * Includes session persistence, customer tracking, and message logging
 * Now supports multi-tenant operations with business context
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://***REMOVED***.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

if (!SUPABASE_KEY) {
  console.warn('⚠️ SUPABASE_SERVICE_KEY not set - database features will be limited');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY || 'placeholder');

// Session timeout (30 minutes for single-tenant, 24 hours for multi-tenant)
const SESSION_TIMEOUT = 30 * 60 * 1000;
const MULTI_TENANT_SESSION_TIMEOUT = 24 * 60 * 60 * 1000;

// ============================================
// SESSION PERSISTENCE
// ============================================

/**
 * Get conversation session from database
 * @param {string} phone - Customer phone number
 * @param {string|null} businessId - Business ID for multi-tenant mode
 */
export async function getSession(phone, businessId = null) {
  try {
    // For multi-tenant, use the new whatsapp_sessions table with business_id
    if (businessId) {
      const { data, error } = await supabase
        .from('whatsapp_sessions')
        .select('*')
        .eq('business_id', businessId)
        .eq('customer_phone', phone)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return null;
      }

      // Check if session expired (24h for multi-tenant)
      const lastActivity = new Date(data.last_message_at).getTime();
      if (Date.now() - lastActivity > MULTI_TENANT_SESSION_TIMEOUT) {
        await deleteSession(phone, businessId);
        return null;
      }

      return {
        phone: data.customer_phone,
        businessId: data.business_id,
        state: data.current_state,
        pendingOrder: data.context?.pendingOrder || null,
        lastActivity: lastActivity,
        context: data.context || {},
        customerId: data.customer_id,
        cart: data.cart || []
      };
    }

    // Legacy single-tenant mode (uses old table structure)
    const { data, error } = await supabase
      .from('whatsapp_sessions')
      .select('*')
      .eq('phone', phone)
      .single();

    if (error || !data) {
      return null;
    }

    // Check if session expired
    const lastActivity = new Date(data.last_activity || data.last_message_at).getTime();
    if (Date.now() - lastActivity > SESSION_TIMEOUT) {
      await deleteSession(phone);
      return null;
    }

    return {
      phone: data.phone || data.customer_phone,
      state: data.state || data.current_state,
      pendingOrder: data.pending_order || data.context?.pendingOrder,
      lastActivity: lastActivity,
      context: data.context || {},
      customerId: data.customer_id
    };
  } catch (error) {
    console.error('Failed to get session:', error);
    return null;
  }
}

/**
 * Save conversation session to database
 * @param {string} phone - Customer phone number
 * @param {Object} sessionData - Session data to save
 * @param {string|null} businessId - Business ID for multi-tenant mode
 */
export async function saveSession(phone, sessionData, businessId = null) {
  try {
    // For multi-tenant, use the new whatsapp_sessions table structure
    if (businessId) {
      const { error } = await supabase
        .from('whatsapp_sessions')
        .upsert({
          business_id: businessId,
          customer_phone: phone,
          current_state: sessionData.state,
          context: {
            ...sessionData.context,
            pendingOrder: sessionData.pendingOrder
          },
          cart: sessionData.cart || [],
          customer_id: sessionData.customerId,
          customer_name: sessionData.customerName,
          is_active: true,
          last_message_at: new Date().toISOString()
        }, {
          onConflict: 'business_id,customer_phone'
        });

      if (error) {
        console.error('Failed to save multi-tenant session:', error);
      }
      return;
    }

    // Legacy single-tenant mode
    const { error } = await supabase
      .from('whatsapp_sessions')
      .upsert({
        phone,
        state: sessionData.state,
        pending_order: sessionData.pendingOrder,
        context: sessionData.context || {},
        customer_id: sessionData.customerId,
        last_activity: new Date().toISOString()
      }, {
        onConflict: 'phone'
      });

    if (error) {
      console.error('Failed to save session:', error);
    }
  } catch (error) {
    console.error('Failed to save session:', error);
  }
}

/**
 * Delete conversation session
 * @param {string} phone - Customer phone number
 * @param {string|null} businessId - Business ID for multi-tenant mode
 */
export async function deleteSession(phone, businessId = null) {
  try {
    if (businessId) {
      // Multi-tenant: mark as inactive rather than delete
      await supabase
        .from('whatsapp_sessions')
        .update({
          is_active: false,
          current_state: 'idle',
          context: {},
          cart: []
        })
        .eq('business_id', businessId)
        .eq('customer_phone', phone);
    } else {
      // Legacy: delete the session
      await supabase
        .from('whatsapp_sessions')
        .delete()
        .eq('phone', phone);
    }
  } catch (error) {
    console.error('Failed to delete session:', error);
  }
}

// ============================================
// PRODUCTS
// ============================================

/**
 * Get all active products
 */
export async function getProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Failed to fetch products:', error);
    return [];
  }

  return data || [];
}

/**
 * Get a single product by ID
 */
export async function getProductById(id) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Failed to fetch product:', error);
    return null;
  }

  return data;
}

/**
 * Get product by name (fuzzy match)
 */
export async function getProductByName(name) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .ilike('name', `%${name}%`)
    .limit(1)
    .single();

  if (error) {
    return null;
  }

  return data;
}

// ============================================
// ORDERS
// ============================================

/**
 * Create a new order
 */
export async function createOrder(orderData) {
  const { data, error } = await supabase
    .from('orders')
    .insert({
      customer_name: orderData.customer_name,
      phone_number: orderData.phone_number,
      email: orderData.email || null,
      items: orderData.items,
      subtotal: orderData.subtotal,
      delivery_fee: orderData.delivery_fee,
      total: orderData.total,
      delivery_address: orderData.delivery_address,
      delivery_method: orderData.delivery_method || 'delivery',
      channel: orderData.channel || 'WhatsApp',
      status: orderData.status || 'Pending',
      payment_method: orderData.payment_method || 'pending',
      notes: orderData.notes || null
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create order:', error);
    throw error;
  }

  // Update stock quantities (ignore errors for now)
  for (const item of orderData.items) {
    if (item.product_id) {
      try {
        await supabase.rpc('decrement_stock', {
          product_id: item.product_id,
          quantity: item.quantity
        });
      } catch (stockError) {
        console.warn('Stock update failed:', stockError);
      }
    }
  }

  // Update customer stats
  if (orderData.customer_id) {
    try {
      await supabase.rpc('increment_customer_stats', {
        p_customer_id: orderData.customer_id,
        p_order_total: orderData.total
      });
    } catch (statsError) {
      console.warn('Customer stats update failed:', statsError);
    }
  }

  return data;
}

/**
 * Get orders by phone number
 */
export async function getOrderByPhone(phone) {
  // Normalize phone number
  const normalizedPhone = phone.replace(/\D/g, '');

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .or(`phone_number.eq.${phone},phone_number.eq.${normalizedPhone},phone_number.eq.+${normalizedPhone}`)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Failed to fetch orders:', error);
    return [];
  }

  return data || [];
}

/**
 * Update order status
 */
export async function updateOrderStatus(orderId, status) {
  const { data, error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    console.error('Failed to update order status:', error);
    throw error;
  }

  return data;
}

/**
 * Update order payment method
 */
export async function updateOrderPayment(orderId, paymentMethod, paymentStatus = 'pending') {
  const { data, error } = await supabase
    .from('orders')
    .update({
      payment_method: paymentMethod,
      payment_status: paymentStatus,
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    console.error('Failed to update payment:', error);
    throw error;
  }

  return data;
}

// ============================================
// CUSTOMERS
// ============================================

/**
 * Get or create customer by phone
 * @param {string} phone - Customer phone number
 * @param {string} name - Customer name
 * @param {string|null} businessId - Business ID for multi-tenant mode
 */
export async function getOrCreateCustomer(phone, name, businessId = null) {
  // Normalize phone number
  const normalizedPhone = phone.replace(/\D/g, '');

  // For multi-tenant, scope customers to business
  // Note: The existing customers table might need a business_id column
  // For now, we'll use the existing structure for backward compatibility

  // Try to find existing customer
  const { data: existing } = await supabase
    .from('customers')
    .select('*')
    .or(`phone.eq.${phone},phone.eq.${normalizedPhone},phone.eq.+${normalizedPhone}`)
    .single();

  if (existing) {
    // Update name if provided and different
    if (name && name !== 'Customer' && existing.name !== name) {
      await supabase
        .from('customers')
        .update({ name, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      existing.name = name;
    }
    return existing;
  }

  // Create new customer
  const { data: newCustomer, error } = await supabase
    .from('customers')
    .insert({
      phone: normalizedPhone,
      name: name || 'WhatsApp Customer',
      channel: 'WhatsApp',
      total_orders: 0,
      total_spent: 0
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create customer:', error);
    return null;
  }

  console.log(`✅ New customer created: ${newCustomer.name} (${phone})${businessId ? ` [Business: ${businessId.substring(0, 8)}]` : ''}`);
  return newCustomer;
}

/**
 * Get customer by phone
 */
export async function getCustomerByPhone(phone) {
  const normalizedPhone = phone.replace(/\D/g, '');

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .or(`phone.eq.${phone},phone.eq.${normalizedPhone},phone.eq.+${normalizedPhone}`)
    .single();

  if (error) {
    return null;
  }

  return data;
}

/**
 * Update customer's default address
 */
export async function updateCustomerAddress(phone, address, postcode) {
  const normalizedPhone = phone.replace(/\D/g, '');

  const { data, error } = await supabase
    .from('customers')
    .update({
      default_address: address,
      default_postcode: postcode,
      updated_at: new Date().toISOString()
    })
    .or(`phone.eq.${phone},phone.eq.${normalizedPhone},phone.eq.+${normalizedPhone}`)
    .select()
    .single();

  if (error) {
    console.error('Failed to update customer address:', error);
    return null;
  }

  console.log(`📍 Saved address for ${phone}: ${address}`);
  return data;
}

/**
 * Get customer's last order
 */
export async function getLastOrder(phone) {
  const normalizedPhone = phone.replace(/\D/g, '');

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .or(`phone_number.eq.${phone},phone_number.eq.${normalizedPhone},phone_number.eq.+${normalizedPhone}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('Failed to get last order:', error);
    return null;
  }

  return data;
}

// ============================================
// MESSAGE LOGGING
// ============================================

/**
 * Log WhatsApp message (inbound or outbound)
 * @param {string} phone - Customer phone number
 * @param {string} direction - 'inbound' or 'outbound'
 * @param {string} text - Message text
 * @param {string|null} intent - Detected intent
 * @param {string|null} orderId - Related order ID
 * @param {string|null} businessId - Business ID for multi-tenant mode
 */
export async function logMessage(phone, direction, text, intent = null, orderId = null, businessId = null) {
  try {
    // For multi-tenant, use the whatsapp_message_logs table
    if (businessId) {
      const { error } = await supabase
        .from('whatsapp_message_logs')
        .insert({
          business_id: businessId,
          direction,
          customer_phone: phone,
          message_type: 'text',
          content: text?.substring(0, 5000),
          intent_detected: intent,
          provider: 'meta',
          status: direction === 'outbound' ? 'sent' : 'received'
        });

      if (error) {
        console.warn('Multi-tenant message logging failed:', error.message);
      }
      return;
    }

    // Legacy single-tenant mode
    const { error } = await supabase
      .from('whatsapp_messages')
      .insert({
        phone_number: phone,
        direction,
        message_text: text?.substring(0, 5000), // Limit text length
        intent,
        order_id: orderId,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.warn('Message logging failed:', error.message);
    }
  } catch (error) {
    // Don't fail on logging errors
    console.warn('Failed to log message:', error.message);
  }
}

/**
 * Get message history for a phone number
 */
export async function getMessageHistory(phone, limit = 20) {
  const normalizedPhone = phone.replace(/\D/g, '');

  const { data, error } = await supabase
    .from('whatsapp_messages')
    .select('*')
    .or(`phone_number.eq.${phone},phone_number.eq.${normalizedPhone}`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to get message history:', error);
    return [];
  }

  return data || [];
}

// ============================================
// MEDIA STORAGE
// ============================================

/**
 * Upload media file to Supabase Storage
 * @param {Buffer} fileBuffer - The file binary data
 * @param {string} fileName - The file name
 * @param {string} mimeType - The MIME type (e.g., 'image/jpeg')
 * @param {string} customerPhone - Customer phone number for folder organization
 * @returns {Promise<{success: boolean, url?: string, path?: string, error?: string}>}
 */
export async function uploadMedia(fileBuffer, fileName, mimeType, customerPhone) {
  try {
    const bucket = 'apinlero-media';
    const timestamp = Date.now();
    const sanitizedPhone = customerPhone.replace(/\D/g, '');
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `whatsapp/${sanitizedPhone}/${timestamp}_${sanitizedName}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileBuffer, {
        contentType: mimeType,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('❌ Media upload error:', error);
      return { success: false, error: error.message };
    }

    // Get signed URL (private bucket)
    const { data: signedData } = await supabase.storage
      .from(bucket)
      .createSignedUrl(data.path, 7 * 24 * 60 * 60); // 7 days

    console.log(`✅ Media uploaded: ${filePath}`);
    return {
      success: true,
      path: data.path,
      url: signedData?.signedUrl || null
    };
  } catch (error) {
    console.error('❌ Media upload exception:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Log media file to database for tracking
 * @param {Object} mediaInfo - Media information
 * @param {string} mediaInfo.filePath - Storage path
 * @param {string} mediaInfo.fileName - Original file name
 * @param {string} mediaInfo.mimeType - MIME type
 * @param {number} mediaInfo.fileSize - File size in bytes
 * @param {string} mediaInfo.customerPhone - Customer phone number
 * @param {string|null} mediaInfo.orderId - Related order ID
 * @param {string|null} mediaInfo.businessId - Business ID for multi-tenant
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export async function logMediaFile(mediaInfo) {
  try {
    const { data, error } = await supabase
      .from('media_files')
      .insert({
        file_path: mediaInfo.filePath,
        file_name: mediaInfo.fileName,
        bucket_name: 'apinlero-media',
        file_type: mediaInfo.mimeType?.split('/')[0] || 'unknown',
        mime_type: mediaInfo.mimeType,
        file_size_bytes: mediaInfo.fileSize || 0,
        source: 'whatsapp',
        customer_phone: mediaInfo.customerPhone,
        order_id: mediaInfo.orderId || null,
        is_public: false,
        metadata: {
          businessId: mediaInfo.businessId || null,
          uploadedAt: new Date().toISOString()
        }
      })
      .select('id')
      .single();

    if (error) {
      console.error('❌ Media log error:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Media logged to database: ${data.id}`);
    return { success: true, id: data.id };
  } catch (error) {
    console.error('❌ Media log exception:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get media files for a customer
 * @param {string} customerPhone - Customer phone number
 * @returns {Promise<Array>}
 */
export async function getCustomerMedia(customerPhone) {
  const normalizedPhone = customerPhone.replace(/\D/g, '');

  const { data, error } = await supabase
    .from('media_files')
    .select('*')
    .eq('customer_phone', normalizedPhone)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to get customer media:', error);
    return [];
  }

  return data || [];
}
