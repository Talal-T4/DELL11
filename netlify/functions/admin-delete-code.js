import { supabase, json, readBody, requirePost, requireAdmin } from './_lib/supabase.js';
import { normalizeCode } from './_lib/access-code.js';

export async function handler(event) {
  const methodError = requirePost(event);
  if (methodError) return methodError;

  const { password, code } = await readBody(event);
  const adminCheck = requireAdmin(password);
  if (!adminCheck.ok) return json(401, { error: adminCheck.error });

  const normalizedCode = normalizeCode(code);
  if (!normalizedCode) return json(400, { error: 'اكتب الكود المطلوب حذفه.' });

  const { data, error } = await supabase
    .from('access_codes')
    .delete()
    .eq('code', normalizedCode)
    .select('id, code')
    .maybeSingle();

  if (error) return json(500, { error: error.message });
  if (!data) return json(404, { error: 'الكود غير موجود.' });

  return json(200, { ok: true });
}
