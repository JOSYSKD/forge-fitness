// Darstellung: Grundthema, Akzentfarbe, Hintergrundbild (lokal + im Konto gespeichert)
export const THEMES = [
  ['anthrazit', 'Anthrazit', '#0b0c0e', '#15171c'],
  ['oled', 'OLED Schwarz', '#000000', '#0c0c0e'],
  ['midnight', 'Midnight', '#070b14', '#0f1626'],
  ['graphite', 'Graphit', '#100f0e', '#1a1816'],
  ['forest', 'Forest', '#06100c', '#0e1a15'],
  ['wine', 'Bordeaux', '#100709', '#1c0f13'],
  ['steel', 'Stahl', '#0d1114', '#171d22']
];
export const ACCENTS = [
  ['green', 'Grün', '#34d399'], ['violet', 'Violett', '#a78bfa'], ['blue', 'Blau', '#60a5fa'], ['cyan', 'Cyan', '#22d3ee'],
  ['orange', 'Orange', '#fb923c'], ['red', 'Rot', '#f87171'], ['pink', 'Pink', '#f472b6'], ['gold', 'Gold', '#facc15'], ['lime', 'Lime', '#a3e635']
];
export const BACKGROUNDS = Array.from({ length: 12 }, (_, i) => `gym${String(i + 1).padStart(2, '0')}`);
export const DEFAULT_LOOK = { theme: 'anthrazit', accent: 'green', bg: '', dim: 60, blur: false };

export function getLook() {
  try { return { ...DEFAULT_LOOK, ...JSON.parse(localStorage.getItem('forge_look') || '{}') }; } catch { return { ...DEFAULT_LOOK }; }
}
export function applyLook(look) {
  const l = { ...DEFAULT_LOOK, ...look };
  const h = document.documentElement;
  h.dataset.theme = l.theme; h.dataset.accent = l.accent;
  if (l.bg && BACKGROUNDS.includes(l.bg)) {
    h.dataset.bg = '1';
    h.style.setProperty('--bg-img', `url("assets/bg/${l.bg}.webp")`);
    h.style.setProperty('--bg-dim', String(Math.min(95, Math.max(40, l.dim)) / 100));
    h.style.setProperty('--bg-blur', l.blur ? '6px' : '0px');
  } else { delete h.dataset.bg; h.style.removeProperty('--bg-img'); }
  try { localStorage.setItem('forge_look', JSON.stringify(l)); } catch {}
  return l;
}
