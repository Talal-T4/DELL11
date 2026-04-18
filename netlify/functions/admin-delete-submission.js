import { supabase, json, readBody, requirePost, requireAdmin } from './_lib/supabase.js';

export async function handler(event) {
  const methodError = requirePost(event);
  if (methodError) return methodError;

  const { password, submissionId } = await readBody(event);
  const adminCheck = requireAdmin(password);
  if (!adminCheck.ok) return json(401, { error: adminCheck.error });
  if (!submissionId) return json(400, { error: 'معرف الاستبيان مطلوب.' });

  const { data, error } = await supabase
    .from('submissions')
    .delete()
    .eq('id', submissionId)
    .select('id')
    .maybeSingle();

  if (error) return json(500, { error: error.message });
  if (!data) return json(404, { error: 'الاستبيان غير موجود.' });

  return json(200, { ok: true });
}
