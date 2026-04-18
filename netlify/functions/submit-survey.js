import { supabase, json, readBody, requirePost } from './_lib/supabase.js';
import { normalizeCode, validateAccessCodeState } from './_lib/access-code.js';

export async function handler(event) {
  const methodError = requirePost(event);
  if (methodError) return methodError;

  const {
    code,
    course_date,
    course_time,
    course_name,
    course_about,
    course_details,
    organizers
  } = await readBody(event);

  if (!course_date || !course_time || !course_name || !course_about || !course_details) {
    return json(400, { error: 'يرجى تعبئة جميع الحقول المطلوبة.' });
  }
  if (!Array.isArray(organizers) || organizers.length < 2 || organizers.length > 4) {
    return json(400, { error: 'عدد المنظمين يجب أن يكون بين 2 و 4.' });
  }

  const normalizedCode = normalizeCode(code);
  if (!normalizedCode) return json(400, { error: 'الرمز غير صالح.' });

  const { data: accessCode, error: codeError } = await supabase
    .from('access_codes')
    .select('id, starts_at, ends_at, is_active, is_temporary, expires_at, used_at')
    .eq('code', normalizedCode)
    .eq('is_active', true)
    .maybeSingle();

  if (codeError) return json(500, { error: codeError.message });

  const stateError = validateAccessCodeState(accessCode);
  if (stateError && !String(stateError).includes('تم استخدام الكود المؤقت')) {
    return json(400, { error: stateError });
  }
  if (!accessCode) return json(404, { error: 'الرمز غير صالح.' });

  const selectedDate = new Date(`${course_date}T00:00:00`);
  const startsAt = new Date(`${accessCode.starts_at}T00:00:00`);
  const endsAt = new Date(`${accessCode.ends_at}T23:59:59`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((selectedDate - today) / 86400000);
  if (diffDays < 3) {
    return json(400, { error: 'يجب تسليم الاستبيان قبل الدورة بثلاثة أيام على الأقل.' });
  }
  if (selectedDate < startsAt || selectedDate > endsAt) {
    return json(400, { error: 'يوم الدورة يجب أن يكون داخل فترة الحسبة.' });
  }

  const cleanOrganizers = organizers
    .map((item) => ({
      name: String(item?.name || '').trim(),
      rank: String(item?.rank || '').trim()
    }))
    .filter((item) => item.name);

  if (cleanOrganizers.length < 2) {
    return json(400, { error: 'يجب إدخال منظمين على الأقل.' });
  }

  const { error } = await supabase.from('submissions').insert({
    access_code_id: accessCode.id,
    course_date,
    course_time,
    course_name: course_name.trim(),
    course_about: course_about.trim(),
    course_details: course_details.trim(),
    organizers: cleanOrganizers
  });

  if (error) return json(500, { error: error.message });

  return json(200, { ok: true, message: 'تم تسليم الاستبيان بنجاح.' });
}
