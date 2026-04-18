import { supabase, json, readBody, requirePost } from './_lib/supabase.js';
import { computeRequirements } from './_lib/requirements.js';
import { normalizeCode, validateAccessCodeState } from './_lib/access-code.js';

export async function handler(event) {
  const methodError = requirePost(event);
  if (methodError) return methodError;

  const { code } = await readBody(event);
  const normalizedCode = normalizeCode(code);
  if (!normalizedCode) {
    return json(400, { error: 'الرمز مطلوب.' });
  }

  const { data: accessCode, error: codeError } = await supabase
    .from('access_codes')
    .select('id, code, starts_at, ends_at, is_active, is_temporary, expires_at, used_at')
    .eq('code', normalizedCode)
    .eq('is_active', true)
    .maybeSingle();

  if (codeError) return json(500, { error: codeError.message });

  const stateError = validateAccessCodeState(accessCode);
  if (stateError) return json(400, { error: stateError });

  if (accessCode.is_temporary) {
    const { error: updateError } = await supabase
      .from('access_codes')
      .update({ used_at: new Date().toISOString() })
      .eq('id', accessCode.id)
      .is('used_at', null);

    if (updateError) return json(500, { error: updateError.message });
    accessCode.used_at = new Date().toISOString();
  }

  const nowIso = new Date().toISOString();

  const [{ data: discount }, { data: notes }, { data: progressRow, error: progressError }] = await Promise.all([
    supabase
      .from('discounts')
      .select('id, pct, starts_at, ends_at, reason')
      .lte('starts_at', nowIso)
      .gte('ends_at', nowIso)
      .order('pct', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from('notes').select('id, text, created_at').order('created_at', { ascending: false }),
    supabase.from('progress').select('reqs_done').eq('access_code_id', accessCode.id).maybeSingle()
  ]);

  if (progressError && progressError.code !== 'PGRST116') {
    return json(500, { error: progressError.message });
  }

  return json(200, {
    codeData: accessCode,
    discount: discount || null,
    notes: notes || [],
    requirements: computeRequirements(discount || null),
    progress: progressRow?.reqs_done || {}
  });
}
