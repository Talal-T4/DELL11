const state = {
  code: sessionStorage.getItem('user_code') || null,
  adminPassword: sessionStorage.getItem('admin_password') || null,
  codeData: null,
  discount: null,
  requirements: [],
  progress: {},
  notes: []
};

const REQUIREMENT_LABELS = {
  hours: 'الساعات',
  shifts: 'المناوبات',
  interviews: 'المقابلات',
  tables: 'الجداول',
  course: 'الدورة العسكرية',
  clean: 'عدم وجود محاسبة',
  field: 'الميدان + ترشيح'
};

const $ = (id) => document.getElementById(id);

async function api(path, payload) {
  const res = await fetch(`/api/${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload || {})
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'حدث خطأ غير متوقع');
  return data;
}

function toast(message, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  $('toastBox').appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function fmtDate(value) {
  if (!value) return '--';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '--';
  return new Intl.DateTimeFormat('ar', { year: 'numeric', month: 'numeric', day: 'numeric' }).format(date);
}

function fmtDateTime(value) {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return new Intl.DateTimeFormat('ar', {
    year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
  }).format(date);
}

function calcPeriod(start, end) {
  if (!start || !end) return '--';
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  const days = Math.ceil((endDate - startDate) / 86400000);
  if (Number.isNaN(days)) return '--';
  if (days >= 30) {
    const months = Math.floor(days / 30);
    const rest = days % 30;
    return rest ? `${months} شهر و ${rest} يوم` : `${months} شهر`;
  }
  return `${days} يوم`;
}

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let value = 'MIL-';
  for (let i = 0; i < 6; i += 1) value += chars[Math.floor(Math.random() * chars.length)];
  return value;
}

function toggleView(view) {
  $('loginView').classList.toggle('hidden', view !== 'login');
  $('userView').classList.toggle('hidden', view !== 'user');
  $('adminView').classList.toggle('hidden', view !== 'admin');
}

function renderUser() {
  $('startDate').textContent = fmtDate(state.codeData?.starts_at);
  $('endDate').textContent = fmtDate(state.codeData?.ends_at);
  $('periodText').textContent = calcPeriod(state.codeData?.starts_at, state.codeData?.ends_at);

  $('courseDate').min = state.codeData?.starts_at || '';
  $('courseDate').max = state.codeData?.ends_at || '';

  if (state.discount) {
    $('discountBanner').classList.remove('hidden');
    $('discountBanner').innerHTML = `<i class="fas fa-tags"></i> خصم فعّال الآن: <strong>${state.discount.pct}%</strong>${state.discount.reason ? ` — ${escapeHtml(state.discount.reason)}` : ''}`;
  } else {
    $('discountBanner').classList.add('hidden');
    $('discountBanner').textContent = '';
  }

  renderRequirements();
  renderNotes();
  buildOrganizers();
}

function renderRequirements() {
  const box = $('requirementsBox');
  box.innerHTML = '';

  state.requirements.forEach((req) => {
    const active = Boolean(state.progress?.[req.id]);
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `requirement ${active ? 'active' : ''}`;
    card.innerHTML = `
      <div class="icon"><i class="fas ${req.icon}"></i></div>
      <div>
        <div class="title">${escapeHtml(req.title)}</div>
        <div class="desc">${escapeHtml(req.desc)}</div>
      </div>
      <div class="value">
        ${req.discPct ? `<span class="discount-chip">-${req.discPct}%</span>` : ''}
        ${req.val} ${escapeHtml(req.unit)}
        ${req.origVal ? `<span class="old">${req.origVal} ${escapeHtml(req.unit)}</span>` : ''}
      </div>
    `;
    card.addEventListener('click', async () => {
      state.progress[req.id] = !state.progress[req.id];
      renderRequirements();
      try {
        await api('save-progress', { code: state.code, reqsDone: state.progress });
      } catch (error) {
        state.progress[req.id] = !state.progress[req.id];
        renderRequirements();
        toast(error.message, 'error');
      }
    });
    box.appendChild(card);
  });

  const done = state.requirements.filter((req) => state.progress?.[req.id]).length;
  const total = state.requirements.length || 1;
  const percent = Math.round((done / total) * 100);
  $('progressText').textContent = `${percent}%`;
  $('progressFill').style.width = `${percent}%`;
}

function buildOrganizers() {
  const box = $('organizersBox');
  box.innerHTML = '';
  for (let i = 0; i < 4; i += 1) {
    const row = document.createElement('div');
    row.className = 'organizer-row';
    row.innerHTML = `
      <input class="input org-name" type="text" placeholder="اسم المنظم ${i + 1}">
      <input class="input org-rank" type="text" placeholder="الرتبة">
    `;
    box.appendChild(row);
  }
}

function renderNotes() {
  const list = $('notesList');
  list.innerHTML = '';
  if (!state.notes.length) {
    $('notesSection').classList.add('hidden');
    return;
  }
  $('notesSection').classList.remove('hidden');
  state.notes.forEach((note, index) => {
    const item = document.createElement('div');
    item.className = 'note';
    item.innerHTML = `<div class="note-index">${index + 1}</div><div>${escapeHtml(note.text)}</div>`;
    list.appendChild(item);
  });
}

async function handleUserLogin() {
  const code = $('userCode').value.trim().toUpperCase();
  if (!code) return toast('اكتب الرمز أولاً', 'error');

  try {
    const data = await api('login', { code });
    state.code = code;
    state.codeData = data.codeData;
    state.discount = data.discount;
    state.requirements = data.requirements;
    state.progress = data.progress || {};
    state.notes = data.notes || [];
    sessionStorage.setItem('user_code', code);
    toggleView('user');
    renderUser();
    toast('تم تسجيل الدخول بنجاح');
  } catch (error) {
    toast(error.message, 'error');
  }
}

function handleLogout() {
  sessionStorage.removeItem('user_code');
  state.code = null;
  state.codeData = null;
  state.discount = null;
  state.requirements = [];
  state.progress = {};
  state.notes = [];
  $('userCode').value = '';
  toggleView('login');
}

async function handleSubmitSurvey() {
  const organizers = Array.from(document.querySelectorAll('.organizer-row')).map((row) => ({
    name: row.querySelector('.org-name').value.trim(),
    rank: row.querySelector('.org-rank').value.trim()
  })).filter((item) => item.name);

  try {
    const data = await api('submit-survey', {
      code: state.code,
      course_date: $('courseDate').value,
      course_time: $('courseTime').value,
      course_name: $('courseName').value.trim(),
      course_about: $('courseAbout').value.trim(),
      course_details: $('courseDetails').value.trim(),
      organizers
    });
    toast(data.message || 'تم التسليم');
    $('courseTime').value = '';
    $('courseName').value = '';
    $('courseAbout').value = '';
    $('courseDetails').value = '';
    buildOrganizers();
  } catch (error) {
    toast(error.message, 'error');
  }
}

async function handleAdminLogin() {
  const password = $('adminPassword').value;
  try {
    await api('admin-login', { password });
    state.adminPassword = password;
    sessionStorage.setItem('admin_password', password);
    $('adminLoginCard').classList.add('hidden');
    $('adminPanel').classList.remove('hidden');
    await loadAdminDashboard();
    toast('تم دخول الإدارة بنجاح');
  } catch (error) {
    toast(error.message, 'error');
  }
}

async function loadAdminDashboard() {
  try {
    const data = await api('admin-dashboard', { password: state.adminPassword });
    renderAdminDashboard(data);
  } catch (error) {
    toast(error.message, 'error');
  }
}

function renderList(containerId, items, renderer, emptyMessage) {
  const container = $(containerId);
  if (!items.length) {
    container.innerHTML = `<div class="list-card">${emptyMessage}</div>`;
    return;
  }
  container.innerHTML = items.map((item) => `<div class="list-card">${renderer(item)}</div>`).join('');
}

function bindAdminListActions() {
  document.querySelectorAll('[data-delete-code]').forEach((button) => {
    button.addEventListener('click', async () => {
      const code = button.getAttribute('data-delete-code');
      await handleDeleteCode(code);
    });
  });

  document.querySelectorAll('[data-delete-note]').forEach((button) => {
    button.addEventListener('click', async () => {
      const noteId = button.getAttribute('data-delete-note');
      await handleDeleteNote(noteId);
    });
  });

  document.querySelectorAll('[data-delete-discount]').forEach((button) => {
    button.addEventListener('click', async () => {
      const discountId = button.getAttribute('data-delete-discount');
      await handleDeleteDiscount(discountId);
    });
  });

  document.querySelectorAll('[data-delete-submission]').forEach((button) => {
    button.addEventListener('click', async () => {
      const submissionId = button.getAttribute('data-delete-submission');
      await handleDeleteSubmission(submissionId);
    });
  });
}

function renderAdminDashboard(data) {
  const stats = [
    ['الأكواد', data.codes.length],
    ['الخصومات', data.discounts.length],
    ['الملاحظات', data.notes.length],
    ['الاستبيانات', data.submissions.length]
  ];
  $('summaryStats').innerHTML = stats.map(([label, value]) => `<div class="stat-card"><strong>${value}</strong><span>${label}</span></div>`).join('');

  renderList('codesList', data.codes, (row) => {
    const tempBadge = row.is_temporary ? `<span class="pill">مؤقت</span>` : '';
    const statusBadge = row.is_temporary
      ? (row.used_at ? `<span class="pill danger">تم استخدامه</span>` : `<span class="pill success">جاهز</span>`)
      : `<span class="pill success">عادي</span>`;
    const expiry = row.expires_at ? `<div class="list-body">ينتهي: ${fmtDateTime(row.expires_at)}</div>` : '';

    return `
      <div class="list-head">
        <div>
          <div class="list-title">${escapeHtml(row.code)}</div>
          <div class="list-meta">${fmtDate(row.starts_at)} ← ${fmtDate(row.ends_at)}</div>
        </div>
        <div class="list-actions">
          ${tempBadge}
          ${statusBadge}
          <button class="btn btn-danger btn-sm" data-delete-code="${escapeHtml(row.code)}"><i class="fas fa-trash"></i> حذف</button>
        </div>
      </div>
      ${expiry}
    `;
  }, 'لا توجد أكواد');

  renderList('discountsList', data.discounts, (row) => `
    <div class="list-head">
      <div>
        <div class="list-title">خصم ${row.pct}%</div>
        <div class="list-meta">${fmtDateTime(row.starts_at)} ← ${fmtDateTime(row.ends_at)}</div>
      </div>
      <div class="list-actions">
        <button class="btn btn-danger btn-sm" data-delete-discount="${row.id}"><i class="fas fa-trash"></i> حذف</button>
      </div>
    </div>
    <div class="list-body">${escapeHtml(row.reason || 'بدون سبب')}</div>
  `, 'لا توجد خصومات');

  renderList('adminNotesList', data.notes, (row) => `
    <div class="list-head">
      <div>
        <div class="list-title">ملاحظة</div>
        <div class="list-meta">${fmtDateTime(row.created_at)}</div>
      </div>
      <div class="list-actions">
        <button class="btn btn-danger btn-sm" data-delete-note="${row.id}"><i class="fas fa-trash"></i> إزالة</button>
      </div>
    </div>
    <div class="list-body">${escapeHtml(row.text)}</div>
  `, 'لا توجد ملاحظات');

  renderList('progressList', data.progress, (row) => {
    const done = Object.keys(row.reqs_done || {}).filter((key) => row.reqs_done[key]);
    return `
      <div class="list-title">${escapeHtml(row.access_codes?.code || 'بدون كود')}</div>
      <div class="list-meta">آخر تحديث: ${fmtDateTime(row.updated_at)}</div>
      <div class="list-body">${done.length ? done.map((key) => REQUIREMENT_LABELS[key] || key).join('، ') : 'لا يوجد تقدم محفوظ بعد'}</div>
    `;
  }, 'لا يوجد تقدم محفوظ');

  renderList('submissionsList', data.submissions, (row) => `
    <div class="list-head">
      <div>
        <div class="list-title">${escapeHtml(row.course_name)}</div>
        <div class="list-meta">الكود: ${escapeHtml(row.access_codes?.code || '—')} — ${fmtDate(row.course_date)} ${escapeHtml(row.course_time || '')}</div>
      </div>
      <div class="list-actions">
        <button class="btn btn-danger btn-sm" data-delete-submission="${row.id}"><i class="fas fa-trash"></i> حذف الاستبيان</button>
      </div>
    </div>
    <div class="list-body">${escapeHtml(row.course_about)}<br>${escapeHtml(row.course_details)}<br>المنظمون: ${escapeHtml((row.organizers || []).map((item) => `${item.name}${item.rank ? ` (${item.rank})` : ''}`).join('، '))}</div>
  `, 'لم يتم تسليم أي استبيان');

  bindAdminListActions();
}

async function handleCreateCode() {
  try {
    await api('admin-create-code', {
      password: state.adminPassword,
      code: $('newCode').value.trim().toUpperCase(),
      start: $('newCodeStart').value,
      end: $('newCodeEnd').value,
      isTemporary: $('isTemporaryCode').checked,
      expiresAt: $('temporaryExpiresAt').value
    });
    toast('تم إنشاء الكود');
    $('newCode').value = '';
    $('newCodeStart').value = '';
    $('newCodeEnd').value = '';
    $('isTemporaryCode').checked = false;
    $('temporaryExpiresAt').value = '';
    toggleTemporaryFields();
    await loadAdminDashboard();
  } catch (error) {
    toast(error.message, 'error');
  }
}

async function handleDeleteCode(codeFromButton = '') {
  const code = (codeFromButton || $('newCode').value).trim().toUpperCase();
  if (!code) return toast('اكتب الكود أولاً', 'error');
  if (!window.confirm(`تأكيد حذف الكود ${code}؟`)) return;

  try {
    await api('admin-delete-code', {
      password: state.adminPassword,
      code
    });
    toast('تم حذف الكود');
    $('newCode').value = '';
    await loadAdminDashboard();
  } catch (error) {
    toast(error.message, 'error');
  }
}

async function handleCreateDiscount() {
  try {
    await api('admin-create-discount', {
      password: state.adminPassword,
      pct: $('discountPct').value,
      start: $('discountStart').value,
      end: $('discountEnd').value,
      reason: $('discountReason').value.trim()
    });
    toast('تم حفظ الخصم');
    $('discountPct').value = '';
    $('discountStart').value = '';
    $('discountEnd').value = '';
    $('discountReason').value = '';
    await loadAdminDashboard();
  } catch (error) {
    toast(error.message, 'error');
  }
}

async function handleAddNote() {
  try {
    await api('admin-add-note', {
      password: state.adminPassword,
      text: $('adminNoteText').value.trim()
    });
    toast('تمت إضافة الملاحظة');
    $('adminNoteText').value = '';
    await loadAdminDashboard();
  } catch (error) {
    toast(error.message, 'error');
  }
}

async function handleDeleteDiscount(discountId) {
  if (!discountId) return;
  if (!window.confirm('تأكيد حذف الخصم؟')) return;
  try {
    await api('admin-delete-discount', {
      password: state.adminPassword,
      discountId
    });
    toast('تم حذف الخصم');
    await loadAdminDashboard();
  } catch (error) {
    toast(error.message, 'error');
  }
}

async function handleDeleteSubmission(submissionId) {
  if (!submissionId) return;
  if (!window.confirm('تأكيد حذف الاستبيان المُسلّم؟')) return;
  try {
    await api('admin-delete-submission', {
      password: state.adminPassword,
      submissionId
    });
    toast('تم حذف الاستبيان');
    await loadAdminDashboard();
  } catch (error) {
    toast(error.message, 'error');
  }
}

async function handleDeleteNote(noteId) {
  if (!noteId) return;
  if (!window.confirm('تأكيد إزالة الملاحظة؟')) return;
  try {
    await api('admin-delete-note', {
      password: state.adminPassword,
      noteId
    });
    toast('تمت إزالة الملاحظة');
    await loadAdminDashboard();
  } catch (error) {
    toast(error.message, 'error');
  }
}

function toggleTemporaryFields() {
  $('temporaryWrap').classList.toggle('hidden', !$('isTemporaryCode').checked);
}

function initEvents() {
  $('userLoginBtn').addEventListener('click', handleUserLogin);
  $('userCode').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleUserLogin();
  });
  $('logoutBtn').addEventListener('click', handleLogout);
  $('submitSurveyBtn').addEventListener('click', handleSubmitSurvey);

  $('adminOpenBtn').addEventListener('click', () => toggleView('admin'));
  $('adminBackBtn').addEventListener('click', () => {
    $('adminLoginCard').classList.remove('hidden');
    $('adminPanel').classList.add('hidden');
    toggleView('login');
  });
  $('adminLoginBtn').addEventListener('click', handleAdminLogin);
  $('generateCodeBtn').addEventListener('click', () => { $('newCode').value = generateCode(); });
  $('createCodeBtn').addEventListener('click', handleCreateCode);
  $('deleteCodeBtn').addEventListener('click', () => handleDeleteCode(''));
  $('createDiscountBtn').addEventListener('click', handleCreateDiscount);
  $('addNoteBtn').addEventListener('click', handleAddNote);
  $('isTemporaryCode').addEventListener('change', toggleTemporaryFields);
}

async function bootstrap() {
  initEvents();
  toggleTemporaryFields();

  if (state.code) {
    $('userCode').value = state.code;
    await handleUserLogin();
    return;
  }

  if (state.adminPassword) {
    toggleView('admin');
    $('adminLoginCard').classList.add('hidden');
    $('adminPanel').classList.remove('hidden');
    await loadAdminDashboard();
    return;
  }

  toggleView('login');
}

bootstrap();
