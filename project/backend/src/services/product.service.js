/**
 * Product Service
 *
 * Lightweight product lookup and batch image update operations
 * for the bulk image upload flow.
 */

/**
 * Get lightweight product stubs for matching (id, name, image_url only).
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} businessId
 * @returns {Promise<Array<{ id: string, name: string, image_url: string | null }>>}
 */
export async function getAllProductStubs(supabase, businessId) {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, image_url')
    .eq('business_id', businessId)
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) throw new Error(`Failed to fetch products: ${error.message}`);
  return data || [];
}

/**
 * Batch update product image URLs.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {Array<{ productId: string, imageUrl: string }>} assignments
 * @param {string} businessId
 * @returns {Promise<{ updated: number, failed: Array<{ productId: string, error: string }> }>}
 */
export async function bulkUpdateImages(supabase, assignments, businessId) {
  let updated = 0;
  const failed = [];

  for (const { productId, imageUrl } of assignments) {
    const { error } = await supabase
      .from('products')
      .update({ image_url: imageUrl })
      .eq('id', productId)
      .eq('business_id', businessId);

    if (error) {
      failed.push({ productId, error: error.message });
    } else {
      updated++;
    }
  }

  return { updated, failed };
}
