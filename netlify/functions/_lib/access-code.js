export function normalizeCode(value) {
  return String(value || '').trim().toUpperCase();
}

export function validateAccessCodeState(accessCode) {
  if (!accessCode) return 'الرمز غير موجود أو غير مفعل.';
  if (!accessCode.is_active) return 'الرمز غير موجود أو غير مفعل.';

  const now = Date.now();

  if (accessCode.is_temporary) {
    if (accessCode.expires_at && now > new Date(accessCode.expires_at).getTime()) {
      return 'انتهت صلاحية الكود المؤقت.';
    }
    if (accessCode.used_at) {
      return 'تم استخدام الكود المؤقت مسبقًا.';
    }
  }

  return null;
}
