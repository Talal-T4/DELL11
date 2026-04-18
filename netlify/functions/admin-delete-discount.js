import { supabase, json, readBody, requirePost, requireAdmin } from './_lib/supabase.js';

export async function handler(event) {
  const methodError = requirePost(event);
  if (methodError) return methodError;

  const { password, discountId } = await readBody(event);
  const adminCheck = requireAdmin(password);
  if (!adminCheck.ok) return json(401, { error: adminCheck.error });
  if (!discountId) return json(400, { error: 'معرف الخصم مطلوب.' });

  const { data, error } = await supabase
    .from('discounts')
    .delete()
    .eq('id', discountId)
    .select('id')
    .maybeSingle();

  if (error) return json(500, { error: error.message });
  if (!data) return json(404, { error: 'الخصم غير موجود.' });

  return json(200, { ok: true });
}
