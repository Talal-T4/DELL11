import { supabase, json, readBody, requirePost } from './_lib/supabase.js';
import { normalizeCode, validateAccessCodeState } from './_lib/access-code.js';

export async function handler(event) {
  const methodError = requirePost(event);
  if (methodError) return methodError;

  const { code, reqsDone } = await readBody(event);
  if (typeof reqsDone !== 'object' || Array.isArray(reqsDone) || reqsDone === null) {
    return json(400, { error: 'الرمز وبيانات التقدم مطلوبة.' });
  }

  const normalizedCode = normalizeCode(code);
  if (!normalizedCode) return json(400, { error: 'الرمز وبيانات التقدم مطلوبة.' });

  const { data: accessCode, error: codeError } = await supabase
    .from('access_codes')
    .select('id, code, is_active, is_temporary, expires_at, used_at')
    .eq('code', normalizedCode)
    .eq('is_active', true)
    .maybeSingle();

  if (codeError) return json(500, { error: codeError.message });

  const stateError = validateAccessCodeState(accessCode);
  if (stateError && !String(stateError).includes('تم استخدام الكود المؤقت')) {
    return json(400, { error: stateError });
  }
  if (!accessCode) return json(404, { error: 'الرمز غير صالح.' });

  const { error } = await supabase
    .from('progress')
    .upsert({
      access_code_id: accessCode.id,
      reqs_done: reqsDone,
      updated_at: new Date().toISOString()
    }, { onConflict: 'access_code_id' });

  if (error) return json(500, { error: error.message });
  return json(200, { ok: true });
}
