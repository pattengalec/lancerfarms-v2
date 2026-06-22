/**
 * lfg-db.js — Lancer Farms & Gardens v2
 * Single source of truth for all Supabase data access.
 */

const SUPABASE_URL = 'https://muecvqxsqnhkhjrabtxh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11ZWN2cXhzcW5oa2hqcmFidHhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExNTU4MzAsImV4cCI6MjA5NjczMTgzMH0.7vOvhNxwtZ3xy1x67Vvq1BY_MsxN9J6ErkgaWklF7l4';

const HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json'
};

// ─── HTTP helpers ─────────────────────────────────────────────

async function sbGet(table, params = '') {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}${params ? '?' + params : ''}`,
    { headers: HEADERS }
  );
  if (!res.ok) throw new Error(`GET ${table} failed: ${res.status}`);
  return res.json();
}

async function sbPost(table, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...HEADERS, Prefer: 'return=representation' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`POST ${table} failed: ${res.status}`);
  return res.json();
}

async function sbPatch(table, match, body) {
  const qs = Object.entries(match).map(([k,v]) => `${k}=eq.${encodeURIComponent(v)}`).join('&');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${qs}`, {
    method: 'PATCH',
    headers: { ...HEADERS, Prefer: 'return=representation' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`PATCH ${table} failed: ${res.status}`);
  return res.json();
}

async function sbDelete(table, match) {
  const qs = Object.entries(match).map(([k,v]) => `${k}=eq.${encodeURIComponent(v)}`).join('&');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${qs}`, {
    method: 'DELETE',
    headers: HEADERS
  });
  if (!res.ok) throw new Error(`DELETE ${table} failed: ${res.status}`);
  return true;
}

// ─── Auth ─────────────────────────────────────────────────────

const BASE_PASSWORD = 'Godisgood';

export function verifyStaffPassword(pw) {
  if (!pw || !pw.startsWith(BASE_PASSWORD)) return false;
  return /^\d{4}$/.test(pw.slice(BASE_PASSWORD.length));
}

export function getSessionName() {
  return sessionStorage.getItem('lfg_name') || 'Staff';
}

export function isStaffSession() {
  return verifyStaffPassword(sessionStorage.getItem('lfg_token') || '');
}

// ─── Config ───────────────────────────────────────────────────

let _configCache = null;

export async function getConfig() {
  if (_configCache) return _configCache;
  const rows = await sbGet('lfg_config');
  _configCache = {};
  rows.forEach(r => { _configCache[r.key] = r.value; });
  return _configCache;
}

export async function getVisitDays() {
  const cfg = await getConfig();
  try { return JSON.parse(cfg.visit_days || '["Monday","Friday"]'); }
  catch(e) { return ['Monday','Friday']; }
}

export async function getVisitOverrides() {
  return sbGet('lfg_visit_overrides', 'order=original_date.asc');
}

export async function addVisitOverride(original_date, replacement_date, reason) {
  return sbPost('lfg_visit_overrides', { original_date, replacement_date, reason });
}

// ─── Growing Areas ────────────────────────────────────────────

let _areasCache = null;
let _areasCacheTime = 0;

export async function getAreas(forceRefresh = false) {
  if (_areasCache && !forceRefresh && (Date.now() - _areasCacheTime) < 300000) return _areasCache;
  _areasCache = await sbGet('lfg_growing_areas', 'archived_at=is.null&order=zone.asc,name.asc');
  _areasCacheTime = Date.now();
  return _areasCache;
}

export async function getArea(id) {
  const rows = await sbGet('lfg_growing_areas', `id=eq.${id}&archived_at=is.null`);
  return rows[0] || null;
}

export async function createArea(fields) {
  _areasCache = null;
  return sbPost('lfg_growing_areas', fields);
}

export async function updateArea(id, fields) {
  _areasCache = null;
  return sbPatch('lfg_growing_areas', { id }, fields);
}

export async function archiveArea(id) {
  _areasCache = null;
  return sbPatch('lfg_growing_areas', { id }, { archived_at: new Date().toISOString() });
}

export function buildAreaOptions(areas, includeGeneral = true) {
  const zones = {};
  areas.forEach(a => {
    const z = a.zone || 'General';
    if (!zones[z]) zones[z] = [];
    zones[z].push(a);
  });
  let html = includeGeneral ? '<option value="">— Select area —</option>' : '';
  Object.keys(zones).sort().forEach(zone => {
    html += `<optgroup label="${esc(zone)}">`;
    zones[zone].forEach(a => {
      html += `<option value="${a.id}">${esc(a.name)}${a.area_type !== 'raised_bed' ? ' (' + a.area_type.replace('_',' ') + ')' : ''}</option>`;
    });
    html += '</optgroup>';
  });
  return html;
}

// ─── Area Events ──────────────────────────────────────────────

export async function getAreaEvents(area_id) {
  return sbGet('lfg_area_events', `area_id=eq.${area_id}&order=event_date.desc`);
}

export async function addAreaEvent(area_id, event_type, fields = {}) {
  return sbPost('lfg_area_events', {
    area_id,
    event_type,
    event_date: fields.event_date || today(),
    plant_name: fields.plant_name || null,
    quantity: fields.quantity || null,
    notes: fields.notes || null,
    performed_by: fields.performed_by || getSessionName()
  });
}

export async function getActivePlants(area_id) {
  const events = await getAreaEvents(area_id);
  const planted = events.filter(e => e.event_type === 'planted');
  const removed = events.filter(e => e.event_type === 'removed').map(e => e.plant_name);
  return planted.filter(e => !removed.includes(e.plant_name));
}

// ─── Master Plants ────────────────────────────────────────────

let _plantsCache = null;

export async function getMasterPlants() {
  if (_plantsCache) return _plantsCache;
  _plantsCache = await sbGet('lfg_master_plants', 'order=category.asc,plant_name.asc');
  return _plantsCache;
}

export async function addMasterPlant(category, plant_name) {
  _plantsCache = null;
  return sbPost('lfg_master_plants', { category, plant_name });
}

// ─── Tasks ────────────────────────────────────────────────────

export async function getTasks() {
  return sbGet('lfg_tasks', 'archived_at=is.null&order=is_core.desc,priority.asc,created_at.asc');
}

export async function getTaskCompletions(since_date) {
  return sbGet('lfg_task_completions', `visit_date=gte.${since_date}&order=completed_at.desc`);
}

export async function addTask(fields) {
  return sbPost('lfg_tasks', { ...fields, created_by: getSessionName() });
}

export async function archiveTask(id) {
  return sbPatch('lfg_tasks', { id }, { archived_at: new Date().toISOString() });
}

export async function completeTask(task_id, completed_by, notes = '') {
  return sbPost('lfg_task_completions', {
    task_id,
    completed_by,
    visit_date: today(),
    notes: notes || null
  });
}

export async function getTodaysTasks() {
  const [tasks, config] = await Promise.all([getTasks(), getConfig()]);
  const overrides = await getVisitOverrides();
  const visitDays = JSON.parse(config.visit_days || '["Monday","Friday"]');
  const todayDate = today();
  const todayName = dayName(new Date());
  const todayTs = new Date(todayDate).getTime();

  const override = overrides.find(o => o.replacement_date === todayDate);
  const cancelled = overrides.find(o => o.original_date === todayDate && !overrides.find(x => x.replacement_date === todayDate));
  const isVisitDay = override ? true : cancelled ? false : visitDays.includes(todayName);

  const completions = await getTaskCompletions(todayDate);
  const completedIds = new Set(completions.filter(c => c.visit_date === todayDate).map(c => c.task_id));

  const due = [];
  for (const task of tasks) {
    const done = completedIds.has(task.id);
    let isDue = false;
    switch (task.recurrence_type) {
      case 'visit':    isDue = isVisitDay; break;
      case 'weekly':   isDue = (task.recurrence_days || []).includes(todayName); break;
      case 'biweekly': isDue = (task.recurrence_days || []).includes(todayName); break;
      case 'interval': {
        const interval = task.recurrence_interval || 1;
        const lastComp = completions.filter(c => c.task_id === task.id)
          .sort((a,b) => new Date(b.completed_at) - new Date(a.completed_at))[0];
        isDue = !lastComp || (todayTs - new Date(lastComp.visit_date).getTime()) / 86400000 >= interval;
        break;
      }
      case 'one_time':  isDue = !done && (!task.due_date || task.due_date <= todayDate); break;
      case 'seasonal':  isDue = task.season_start <= todayDate && task.season_end >= todayDate; break;
    }
    if (isDue) {
      due.push({ ...task, _dueToday: true, _doneToday: done, _overdue: !done && task.recurrence_type !== 'one_time' });
    }
  }

  return due.sort((a,b) => {
    if (a.is_core !== b.is_core) return a.is_core ? -1 : 1;
    if (a._doneToday !== b._doneToday) return a._doneToday ? 1 : -1;
    return (a.priority || 3) - (b.priority || 3);
  });
}

// ─── Field Log ────────────────────────────────────────────────

export async function getLog(limit = 30) {
  return sbGet('lfg_log', `order=logged_at.desc&limit=${limit}`);
}

export async function addLog(area_id, location_label, note, logged_by) {
  return sbPost('lfg_log', {
    area_id: area_id || null,
    location_label: location_label || null,
    note,
    logged_by: logged_by || getSessionName()
  });
}

// ─── Photos ───────────────────────────────────────────────────

export async function getPhotos(area_id = null) {
  const params = area_id
    ? `area_id=eq.${area_id}&order=uploaded_at.desc`
    : `order=uploaded_at.desc&limit=60`;
  return sbGet('lfg_photos', params);
}

export async function addPhoto(area_id, caption, cloudinary_url, thumbnail_url, uploaded_by) {
  return sbPost('lfg_photos', {
    area_id: area_id || null,
    caption: caption || null,
    cloudinary_url,
    thumbnail_url: thumbnail_url || null,
    uploaded_by: uploaded_by || 'Guest'
  });
}

export async function updatePhoto(id, fields) {
  return sbPatch('lfg_photos', { id }, fields);
}

export async function deletePhoto(id) {
  return sbDelete('lfg_photos', { id });
}

// ─── Reports ──────────────────────────────────────────────────

export async function getReports(status = 'open') {
  return sbGet('lfg_reports', `status=eq.${status}&order=created_at.asc`);
}

export async function addReport(area_id, report_type, description, reporter_name) {
  return sbPost('lfg_reports', {
    area_id: area_id || null,
    report_type: report_type || null,
    description,
    reporter_name: reporter_name || null
  });
}

export async function resolveReport(id, resolve_note, resolved_by) {
  return sbPatch('lfg_reports', { id }, {
    status: 'resolved',
    resolve_note: resolve_note || null,
    resolved_by: resolved_by || getSessionName(),
    resolved_at: new Date().toISOString()
  });
}

// ─── Comments ─────────────────────────────────────────────────

export async function getComments(area_id = null) {
  const params = area_id
    ? `area_id=eq.${area_id}&order=submitted_at.desc`
    : `order=submitted_at.desc`;
  return sbGet('lfg_comments', params);
}

export async function addComment(area_id, commenter_name, message) {
  return sbPost('lfg_comments', { area_id: area_id || null, commenter_name, message });
}

export async function markCommentReviewed(id) {
  return sbPatch('lfg_comments', { id }, { status: 'reviewed' });
}

// ─── Requests ─────────────────────────────────────────────────

export async function getRequests(status = 'open') {
  return sbGet('lfg_requests', `status=eq.${status}&order=created_at.asc`);
}

export async function addRequest(requester_name, request_type, area_id, note, priority) {
  return sbPost('lfg_requests', {
    requester_name,
    request_type: request_type || null,
    area_id: area_id || null,
    note,
    priority: priority || 'Normal'
  });
}

export async function resolveRequest(id) {
  return sbPatch('lfg_requests', { id }, { status: 'resolved' });
}

// ─── Inventory ────────────────────────────────────────────────

export async function getInventory() {
  return sbGet('lfg_inventory', 'order=category.asc,item_name.asc');
}

export async function addInventoryItem(fields) {
  return sbPost('lfg_inventory', { ...fields, updated_at: new Date().toISOString() });
}

export async function updateInventoryItem(id, fields) {
  return sbPatch('lfg_inventory', { id }, { ...fields, updated_at: new Date().toISOString() });
}

export async function deleteInventoryItem(id) {
  return sbDelete('lfg_inventory', { id });
}

// ─── Utilities ────────────────────────────────────────────────

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function dayName(date) {
  return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][date.getDay()];
}

export function fmtDate(iso) {
  if (!iso) return '';
  try { return new Date(iso).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }); }
  catch(e) { return String(iso).slice(0,10); }
}

export function fmtTime(iso) {
  if (!iso) return '';
  try { return new Date(iso).toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit' }); }
  catch(e) { return ''; }
}

export function esc(s) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(String(s ?? '')));
  return d.innerHTML;
}

export function showToast(msg, duration = 2500) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}
