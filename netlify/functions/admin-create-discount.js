import { supabase, json, readBody, requirePost, requireAdmin } from './_lib/supabase.js';

export async function handler(event) {
  const methodError = requirePost(event);
  if (methodError) return methodError;

  const { password, pct, start, end, reason } = await readBody(event);
  const adminCheck = requireAdmin(password);
  if (!adminCheck.ok) return json(401, { error: adminCheck.error });

  const percent = Number(pct);
  if (!Number.isInteger(percent) || percent < 1 || percent > 99) {
    return json(400, { error: 'نسبة الخصم يجب أن تكون بين 1 و 99.' });
  }
  if (!start || !end) return json(400, { error: 'بداية ونهاية الخصم مطلوبة.' });
  if (new Date(end) <= new Date(start)) return json(400, { error: 'نهاية الخصم يجب أن تكون بعد البداية.' });

  const { error } = await supabase.from('discounts').insert({
    pct: percent,
    starts_at: new Date(start).toISOString(),
    ends_at: new Date(end).toISOString(),
    reason: reason?.trim() || null
  });

  if (error) return json(500, { error: error.message });
  return json(200, { ok: true });
}
