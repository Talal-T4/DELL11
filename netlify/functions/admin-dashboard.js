import { supabase, json, readBody, requirePost, requireAdmin } from './_lib/supabase.js';

export async function handler(event) {
  const methodError = requirePost(event);
  if (methodError) return methodError;

  const { password } = await readBody(event);
  const adminCheck = requireAdmin(password);
  if (!adminCheck.ok) return json(401, { error: adminCheck.error });

  const [codesRes, discountsRes, notesRes, subsRes, progressRes] = await Promise.all([
    supabase.from('access_codes').select('*').order('created_at', { ascending: false }),
    supabase.from('discounts').select('*').order('starts_at', { ascending: false }),
    supabase.from('notes').select('*').order('created_at', { ascending: false }),
    supabase.from('submissions').select('*, access_codes(code)').order('submitted_at', { ascending: false }),
    supabase.from('progress').select('*, access_codes(code)').order('updated_at', { ascending: false })
  ]);

  const firstError = [codesRes, discountsRes, notesRes, subsRes, progressRes].find((r) => r.error)?.error;
  if (firstError) return json(500, { error: firstError.message });

  return json(200, {
    codes: codesRes.data || [],
    discounts: discountsRes.data || [],
    notes: notesRes.data || [],
    submissions: subsRes.data || [],
    progress: progressRes.data || []
  });
}
