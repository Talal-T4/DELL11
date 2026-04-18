import { supabase, json, readBody, requirePost, requireAdmin } from './_lib/supabase.js';

export async function handler(event) {
  const methodError = requirePost(event);
  if (methodError) return methodError;

  const { password, text } = await readBody(event);
  const adminCheck = requireAdmin(password);
  if (!adminCheck.ok) return json(401, { error: adminCheck.error });

  if (!text || !String(text).trim()) return json(400, { error: 'نص الملاحظة مطلوب.' });

  const { error } = await supabase.from('notes').insert({ text: String(text).trim() });
  if (error) return json(500, { error: error.message });

  return json(200, { ok: true });
}
