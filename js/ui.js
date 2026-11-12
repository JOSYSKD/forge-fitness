// UI-Helfer: Escaping, Toasts, Modals, Icons, Formatierung
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function toast(msg, type = 'ok') {
  const t = document.createElement('div');
  t.className = 'toast' + (type === 'err' ? ' err' : '');
  t.textContent = msg;
  document.getElementById('toasts').appendChild(t);
  setTimeout(() => { t.style.transition = 'opacity .3s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, type === 'err' ? 4500 : 2600);
}

/** Modal öffnen. body = HTML; onMount(el, close) für Logik. Gibt close() zurück. */
export function modal({ title, body, foot = '', wide = false, onMount, onClose }) {
  const bg = document.createElement('div');
  bg.className = 'modal-bg';
  bg.innerHTML = `<div class="modal${wide ? ' wide' : ''}" role="dialog" aria-modal="true">
    <div class="modal-h"><h2>${esc(title)}</h2><button class="btn ghost icon" data-x aria-label="Schließen">${icon('x')}</button></div>
    <div class="modal-b">${body}</div>${foot ? `<div class="modal-f">${foot}</div>` : ''}</div>`;
  const close = () => { if (!bg.isConnected) return; bg.remove(); document.removeEventListener('keydown', onKey); onClose && onClose(); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  bg.addEventListener('mousedown', (e) => { if (e.target === bg) close(); });
  bg.querySelector('[data-x]').onclick = close;
  document.addEventListener('keydown', onKey);
  document.body.appendChild(bg);
  onMount && onMount(bg.querySelector('.modal'), close);
  const first = bg.querySelector('input,select,textarea');
  first && setTimeout(() => first.focus(), 30);
  return close;
}

export function confirmDialog(text, okLabel = 'Löschen', danger = true) {
  return new Promise((res) => {
    let done = false;
    modal({ onClose: () => { if (!done) res(false); },
      title: 'Bist du sicher?', body: `<p class="muted">${esc(text)}</p>`,
      foot: `<button class="btn ghost" data-c>Abbrechen</button><button class="btn ${danger ? 'danger' : 'pri'}" data-ok>${esc(okLabel)}</button>`,
      onMount: (el, cl) => {
        el.querySelector('[data-c]').onclick = () => { done = true; cl(); res(false); };
        el.querySelector('[data-ok]').onclick = () => { done = true; cl(); res(true); };
      }
    });
  });
}

/** Button in Ladezustand versetzen, während fn läuft */
export async function busy(btn, fn) {
  const html = btn.innerHTML; btn.disabled = true;
  btn.innerHTML = '<span class="spinner sm"></span>';
  try { return await fn(); } finally { btn.disabled = false; btn.innerHTML = html; }
}

export const loading = (t = 'Lädt…') => `<div class="loading"><span class="spinner sm"></span>${esc(t)}</div>`;

export const fmt = (n, d = 0) => (n == null || isNaN(n)) ? '–' : Number(n).toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d });
export const fmtKg = (n) => (n == null || isNaN(n)) ? '–' : `${Number(n).toLocaleString('de-DE', { maximumFractionDigits: 2 })} kg`;
export const today = () => isoDate(new Date());
export function isoDate(d) { const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return z.toISOString().slice(0, 10); }
export function addDays(iso, n) { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return isoDate(d); }
export function fmtDate(iso, opts = { day: '2-digit', month: '2-digit', year: 'numeric' }) {
  if (!iso) return '–'; return new Date(iso + 'T12:00:00').toLocaleDateString('de-DE', opts);
}
export const num = (v) => { if (v === '' || v == null) return null; const n = Number(String(v).replace(',', '.')); return isFinite(n) ? n : NaN; };

export function avatar(pub, cls = '') {
  const name = (pub && pub.username) || '?';
  if (pub && pub.avatar) return `<span class="av ${cls}"><img src="${esc(pub.avatar)}" alt=""></span>`;
  return `<span class="av ${cls}">${esc(name.slice(0, 2).toUpperCase())}</span>`;
}
export const rankBadge = (i) => `<span class="rank${i <= 3 ? ' r' + i : ''}">${i}</span>`;

/** Fehler an einem Formularfeld anzeigen */
export function fieldErr(input, msg) {
  input.classList.toggle('bad', !!msg);
  let e = input.parentElement.querySelector('.err');
  if (!e) { e = document.createElement('div'); e.className = 'err'; input.parentElement.appendChild(e); }
  e.textContent = msg || '';
  return !msg;
}

const P = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3"/>',
  book: '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H20v16H5.5A1.5 1.5 0 0 0 4 20.5zM4 20.5A1.5 1.5 0 0 0 5.5 22H20"/>',
  apple: '<path d="M12 7c-1-2-3.5-2.5-5-1.5C4.5 7 4.5 11 6 14.5S9.5 21 12 20c2.5 1 4.5-2 6-5.5s1.5-7.5-1-9C15.5 4.5 13 5 12 7zM12 7c0-2 1-3.5 3-4"/>',
  calc: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  chevL: '<path d="m15 6-6 6 6 6"/>', chevR: '<path d="m9 6 6 6-6 6"/>',
  more: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
  logout: '<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H3"/>',
  dumbbell: '<path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12"/>',
  flame: '<path d="M12 3c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-4 2.5-5 0 2 1 3 2 3 0-3-1-5.5.5-8z"/>',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  compare: '<path d="M8 3v18M16 3v18M3 8h5M16 16h5"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  check: '<path d="m5 12 5 5 9-10"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
  bookmark: '<path d="M6 3h12v18l-6-4-6 4z"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'
};
export const icon = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ''}</svg>`;
