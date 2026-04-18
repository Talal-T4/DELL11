import { supabase, json, readBody, requirePost, requireAdmin } from './_lib/supabase.js';

export async function handler(event) {
  const methodError = requirePost(event);
  if (methodError) return methodError;

  const { password, noteId } = await readBody(event);
  const adminCheck = requireAdmin(password);
  if (!adminCheck.ok) return json(401, { error: adminCheck.error });
  if (!noteId) return json(400, { error: 'معرف الملاحظة مطلوب.' });

  const { data, error } = await supabase
    .from('notes')
    .delete()
    .eq('id', noteId)
    .select('id')
    .maybeSingle();

  if (error) return json(500, { error: error.message });
  if (!data) return json(404, { error: 'الملاحظة غير موجودة.' });

  return json(200, { ok: true });
}
