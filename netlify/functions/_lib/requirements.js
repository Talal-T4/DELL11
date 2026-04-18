export const BASE_REQS = [
  { id: 'hours', title: 'الساعات', desc: 'عدد الساعات المطلوبة خلال فترة الحسبة', val: 170, unit: 'ساعة', icon: 'fa-clock' },
  { id: 'shifts', title: 'المناوبات', desc: 'عدد المناوبات المطلوبة', val: 20, unit: 'مناوبة', icon: 'fa-calendar-days' },
  { id: 'interviews', title: 'المقابلات', desc: 'عدد المقابلات المطلوبة', val: 25, unit: 'مقابلة', icon: 'fa-comments' },
  { id: 'tables', title: 'المشاركة في جداول الأقسام', desc: 'عدد الجداول في جدول الأقسام', val: 60, unit: 'جدول', icon: 'fa-table-columns' },
  { id: 'course', title: 'دورة عسكرية', desc: 'تنظيم دورة عسكرية خلال فترة الحسبة', val: 1, unit: 'دورة', icon: 'fa-graduation-cap' },
  { id: 'clean', title: 'ماعليك محاسبة', desc: 'يجب ألا تكون عليك أي محاسبة', val: 1, unit: 'شرط', icon: 'fa-check-double' },
  { id: 'field', title: 'شغلك بالميدان + ترشيح', desc: 'العمل الميداني مع الترشيح', val: 1, unit: 'مطلوب', icon: 'fa-location-dot' }
];

export function computeRequirements(discount) {
  return BASE_REQS.map((item) => {
    const row = { ...item };
    if (discount && row.val > 1) {
      row.origVal = row.val;
      row.val = Math.ceil(row.val * (1 - discount.pct / 100));
      row.discPct = discount.pct;
    }
    return row;
  });
}
