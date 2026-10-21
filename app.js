import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { logVisit, openUnlock, renderAdminExtras, fmtPrice } from './access.js';

const $ = (selector) => document.querySelector(selector);
const grid = $('#project-grid');
const emptyState = $('#empty-state');
const authDialog = $('#auth-dialog');
const adminDialog = $('#admin-dialog');
let supabase = null;
let allPosts = [];
let currentUser = null;
let isAdmin = false;
let toastTimer;

$('#year').textContent = new Date().getFullYear();

function showToast(message, type = 'info') {
  const toast = $('#toast');
  toast.textContent = message;
  toast.dataset.type = type;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
}
function setMessage(selector, message, type = '') {
  const el = $(selector); el.textContent = message; el.className = `form-message ${type}`.trim();
}
function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}
function safeUrl(value) {
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : null; }
  catch { return null; }
}
function formatDate(value) {
  try { return new Intl.DateTimeFormat(undefined, {year:'numeric', month:'short', day:'numeric'}).format(new Date(value)); }
  catch { return 'Recently'; }
}
function initials(title = '') { return title.trim().split(/\s+/).slice(0,2).map(word => word[0] || '').join('').toUpperCase() || 'TX'; }
function categoryClass(category = 'Other') { return category.toLowerCase().replace(/[^a-z0-9]+/g, '-'); }
function postMatches(post, term, category) {
  const searchable = [post.title, post.description, post.category, ...(post.tags || [])].join(' ').toLowerCase();
  return (!term || searchable.includes(term)) && (category === 'all' || post.category === category);
}

function renderPosts() {
  const term = $('#search-input').value.trim().toLowerCase();
  const category = $('#category-filter').value;
  const posts = allPosts.filter(post => postMatches(post, term, category));
  $('#project-count').textContent = `${posts.length} ${posts.length === 1 ? 'PROJECT' : 'PROJECTS'}`;
  grid.innerHTML = '';
  if (!posts.length) { grid.classList.add('hidden'); emptyState.classList.remove('hidden'); return; }
  grid.classList.remove('hidden'); emptyState.classList.add('hidden');
  for (const post of posts) {
    const url = safeUrl(post.project_url);
    const paid = post.access_type === 'paid';
    const tags = (paid ? `<span class="tag paid-tag">PAID · ${escapeHtml(fmtPrice(post.price_text))}</span>` : '') + (post.tags || []).slice(0, 5).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('');
    const card = document.createElement('article');
    card.className = 'project-card';
    card.innerHTML = `<div class="card-top"><div class="project-avatar">${escapeHtml(initials(post.title))}</div><span class="category-pill cat-${categoryClass(post.category)}">${escapeHtml(post.category)}</span></div>
      <h3>${escapeHtml(post.title)}</h3><p class="project-description">${escapeHtml(post.description)}</p>
      ${tags ? `<div class="tag-list">${tags}</div>` : '<div class="tag-list tag-list-empty"></div>'}
      <div class="card-bottom"><span class="date-label"><span class="tiny-square"></span>${formatDate(post.created_at)}</span>${paid ? `<button class="project-link unlock-btn" type="button" data-unlock="${post.id}">Unlock 🔒</button>` : url ? `<a class="project-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">View project <span>↗</span></a>` : '<span class="muted">Invalid URL</span>'}</div>`;
    grid.append(card);
  }
}

grid.addEventListener('click', (e) => { const b = e.target.closest('[data-unlock]'); if (b) openUnlock(allPosts.find(p => p.id === b.dataset.unlock), supabase); });

function renderAdminPosts() {
  const list = $('#admin-post-list');
  $('#admin-post-count').textContent = `${allPosts.length} ${allPosts.length === 1 ? 'POST' : 'POSTS'}`;
  if (!allPosts.length) { list.innerHTML = '<p class="muted">No published posts yet. Use the form above to publish the first one.</p>'; return; }
  list.innerHTML = '';
  for (const post of allPosts) {
    const item = document.createElement('div'); item.className = 'admin-post-item';
    item.innerHTML = `<div class="admin-post-info"><strong>${escapeHtml(post.title)}</strong><span>${escapeHtml(post.category)} · ${formatDate(post.created_at)}</span></div><div class="admin-post-actions"><button class="mini-button" type="button" data-edit="${post.id}">Edit</button><button class="mini-button mini-danger" type="button" data-delete="${post.id}">Delete</button></div>`;
    list.append(item);
  }
}

async function loadPosts() {
  if (!supabase) return;
  const { data, error } = await supabase.from('posts').select('id,title,description,project_url,category,tags,created_at,updated_at,access_type,price_text').order('created_at', {ascending:false});
  if (error) { grid.innerHTML = `<div class="error-card"><strong>Could not load projects.</strong><p>${escapeHtml(error.message)}</p><p>Check config.js and run schema.sql in Supabase.</p></div>`; $('#connection-label').textContent = 'Database connection error'; $('#connection-label').parentElement.classList.add('offline'); return; }
  allPosts = data || []; renderPosts();
  if (isAdmin && adminDialog.open) renderAdminPosts();
}

async function checkAdmin(user) {
  if (!user || !supabase) return false;
  const { data, error } = await supabase.rpc('is_admin');
  if (error) { console.error('Admin check failed:', error.message); return false; }
  return data === true;
}
function resetPostForm() {
  $('#post-form').reset(); $('#post-id').value = ''; $('#publish-button').innerHTML = 'Publish project <span>↗</span>';
  $('#cancel-edit').classList.add('hidden'); setMessage('#post-message', '');
}
function openAdmin() { resetPostForm(); renderAdminPosts(); renderAdminExtras({ db: supabase, getPosts: () => allPosts, showToast }); if (!adminDialog.open) adminDialog.showModal(); }

$('#search-input').addEventListener('input', renderPosts);
$('#category-filter').addEventListener('change', renderPosts);
$('#admin-open').addEventListener('click', async () => {
  if (!supabase) return showToast('Set up config.js first. See README.md.', 'error');
  if (!currentUser) { setMessage('#auth-message', ''); authDialog.showModal(); return; }
  isAdmin = await checkAdmin(currentUser);
  if (!isAdmin) { showToast('This account is not on the admin allowlist.', 'error'); return; }
  openAdmin();
});

document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => document.getElementById(button.dataset.close).close()));
for (const dialog of [authDialog, adminDialog]) dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });

$('#auth-form').addEventListener('submit', async (event) => {
  event.preventDefault(); if (!supabase) return;
  const email = $('#auth-email').value.trim(); const password = $('#auth-password').value;
  const button = event.submitter; button.disabled = true; setMessage('#auth-message', 'Signing in…');
  const { data, error } = await supabase.auth.signInWithPassword({email, password});
  button.disabled = false;
  if (error) { setMessage('#auth-message', error.message, 'error-text'); return; }
  currentUser = data.user; isAdmin = await checkAdmin(currentUser);
  if (!isAdmin) { await supabase.auth.signOut(); currentUser = null; setMessage('#auth-message', 'Signed in, but this account is not an admin. Add its user UUID to public.admin_users in Supabase.', 'error-text'); return; }
  authDialog.close(); $('#auth-form').reset(); showToast('Welcome, admin.', 'success'); openAdmin();
});

$('#sign-out').addEventListener('click', async () => { if (supabase) await supabase.auth.signOut(); currentUser = null; isAdmin = false; adminDialog.close(); showToast('Signed out.'); });

$('#post-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!supabase || !currentUser || !isAdmin) return setMessage('#post-message', 'Admin sign-in required.', 'error-text');
  const title = $('#post-title').value.trim(); const description = $('#post-description').value.trim(); const project_url = safeUrl($('#post-url').value.trim());
  if (!title || !description || !project_url) return setMessage('#post-message', 'Enter a title, description, and valid http(s) project URL.', 'error-text');
  const tags = [...new Set($('#post-tags').value.split(',').map(tag => tag.trim()).filter(Boolean))].slice(0,10);
  const paid = $('#post-access').value === 'paid';
  const payload = {title, description, project_url: paid ? null : project_url, category: $('#post-category').value, tags, access_type: paid ? 'paid' : 'free', price_text: paid ? ($('#post-price').value.trim() || null) : null};
  const id = $('#post-id').value; const button = $('#publish-button'); button.disabled = true; setMessage('#post-message', id ? 'Saving changes…' : 'Publishing…');
  const result = id ? await supabase.from('posts').update(payload).eq('id', id).select().single() : await supabase.from('posts').insert(payload).select().single();
  button.disabled = false;
  if (!result.error) { const pid = result.data.id; const pr = paid ? await supabase.from('project_private').upsert({project_id: pid, secret_url: project_url}) : await supabase.from('project_private').delete().eq('project_id', pid); if (pr.error) result.error = pr.error; }
  if (result.error) { setMessage('#post-message', result.error.message, 'error-text'); return; }
  resetPostForm(); setMessage('#post-message', id ? 'Project updated successfully.' : 'Project published successfully.', 'success-text');
  await loadPosts(); renderAdminPosts(); showToast(id ? 'Project updated.' : 'Project published.', 'success');
});

$('#cancel-edit').addEventListener('click', resetPostForm);
$('#admin-post-list').addEventListener('click', async (event) => {
  const editButton = event.target.closest('[data-edit]'); const deleteButton = event.target.closest('[data-delete]');
  if (editButton) {
    const post = allPosts.find(item => item.id === editButton.dataset.edit); if (!post) return;
    $('#post-id').value = post.id; $('#post-title').value = post.title; $('#post-description').value = post.description; $('#post-access').value = post.access_type || 'free'; $('#post-price').value = post.price_text || ''; $('#post-url').value = post.project_url || ''; if (post.access_type === 'paid') supabase.from('project_private').select('secret_url').eq('project_id', post.id).maybeSingle().then(({data}) => { if (data) $('#post-url').value = data.secret_url; }); $('#post-category').value = post.category; $('#post-tags').value = (post.tags || []).join(', ');
    $('#publish-button').innerHTML = 'Save changes <span>↗</span>'; $('#cancel-edit').classList.remove('hidden'); $('#post-title').focus(); $('.admin-card').scrollTo({top:0, behavior:'smooth'}); return;
  }
  if (deleteButton) {
    const post = allPosts.find(item => item.id === deleteButton.dataset.delete); if (!post) return;
    if (!confirm(`Delete “${post.title}”? This cannot be undone.`)) return;
    const {error} = await supabase.from('posts').delete().eq('id', post.id);
    if (error) { showToast(`Delete failed: ${error.message}`, 'error'); return; }
    if ($('#post-id').value === post.id) resetPostForm(); await loadPosts(); renderAdminPosts(); showToast('Project deleted.', 'success');
  }
});

async function boot() {
  const looksConfigured = SUPABASE_URL.startsWith('https://') && !SUPABASE_URL.includes('YOUR-PROJECT-REF') && SUPABASE_ANON_KEY.length > 30 && !SUPABASE_ANON_KEY.includes('YOUR_SUPABASE');
  if (!looksConfigured) {
    $('#connection-label').textContent = 'Setup required';
    grid.innerHTML = '<div class="setup-card"><div class="setup-icon">⌘</div><h3>Connect your Supabase database</h3><p>Open <code>config.js</code>, add your Supabase Project URL and publishable/anon key, then reload this page.</p><a href="README.md" class="text-link">Read setup instructions ↗</a></div>';
    return;
  }
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {auth:{persistSession:true, autoRefreshToken:true, detectSessionInUrl:true}});
    logVisit(supabase); const {data: {session}} = await supabase.auth.getSession(); currentUser = session?.user || null;
    await loadPosts();
    const channel = supabase.channel('public-posts-live').on('postgres_changes', {event:'*', schema:'public', table:'posts'}, async () => { await loadPosts(); if (isAdmin && adminDialog.open) renderAdminPosts(); }).subscribe((status) => {
      const label = $('#connection-label');
      if (status === 'SUBSCRIBED') { label.textContent = 'Live updates connected'; label.parentElement.classList.remove('offline'); }
      else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') { label.textContent = 'Live reconnecting'; label.parentElement.classList.add('offline'); }
    });
    window.addEventListener('beforeunload', () => { if (channel) supabase.removeChannel(channel); });
    supabase.auth.onAuthStateChange((_event, sessionNow) => { currentUser = sessionNow?.user || null; if (!currentUser && adminDialog.open) adminDialog.close(); });
  } catch (error) {
    console.error(error); $('#connection-label').textContent = 'Connection error'; grid.innerHTML = `<div class="error-card"><strong>Could not connect.</strong><p>${escapeHtml(error.message || 'Unknown error')}</p></div>`;
  }
}
$('#copy-wallet')?.addEventListener('click', async () => {
  const address = $('#wallet-address').textContent.trim();
  try { await navigator.clipboard.writeText(address); showToast('Wallet address copied.', 'success'); }
  catch { const r = document.createRange(); r.selectNodeContents($('#wallet-address')); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); showToast('Press Ctrl+C to copy.', 'info'); }
});
boot();
