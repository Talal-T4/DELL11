import { supabase, json, readBody, requirePost, requireAdmin } from './_lib/supabase.js';
import { normalizeCode } from './_lib/access-code.js';

export async function handler(event) {
  const methodError = requirePost(event);
  if (methodError) return methodError;

  const { password, code, start, end, isTemporary, expiresAt } = await readBody(event);
  const adminCheck = requireAdmin(password);
  if (!adminCheck.ok) return json(401, { error: adminCheck.error });

  const normalizedCode = normalizeCode(code);
  if (!normalizedCode || !start || !end) return json(400, { error: 'الرمز وبداية ونهاية الحسبة مطلوبة.' });
  if (new Date(end) < new Date(start)) return json(400, { error: 'نهاية الحسبة يجب أن تكون بعد البداية.' });

  const temporary = Boolean(isTemporary);
  let expiresAtIso = null;

  if (temporary) {
    if (!expiresAt) return json(400, { error: 'حدد وقت انتهاء الكود المؤقت.' });
    expiresAtIso = new Date(expiresAt).toISOString();
    if (Number.isNaN(new Date(expiresAtIso).getTime())) return json(400, { error: 'وقت انتهاء الكود المؤقت غير صحيح.' });
  }

  const { error } = await supabase.from('access_codes').insert({
    code: normalizedCode,
    starts_at: start,
    ends_at: end,
    is_active: true,
    is_temporary: temporary,
    expires_at: expiresAtIso,
    used_at: null
  });

  if (error) return json(500, { error: error.message });
  return json(200, { ok: true });
}
