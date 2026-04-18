import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.warn('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables.');
}

export const supabase = createClient(url || 'https://example.supabase.co', serviceRoleKey || 'missing-key', {
  auth: { persistSession: false, autoRefreshToken: false }
});

export function json(statusCode, payload) {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json; charset=utf-8'
    },
    body: JSON.stringify(payload)
  };
}

export async function readBody(event) {
  try {
    return JSON.parse(event.body || '{}');
  } catch {
    return {};
  }
}

export function requirePost(event) {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed. Use POST.' });
  }
  return null;
}

export function requireAdmin(password) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return { ok: false, error: 'ADMIN_PASSWORD is not configured on Netlify.' };
  }
  if (password !== adminPassword) {
    return { ok: false, error: 'كلمة مرور الإدارة غير صحيحة.' };
  }
  return { ok: true };
}
