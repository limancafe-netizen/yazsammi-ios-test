// Yazsam mı? rozet ailesi v3 — DÜZ VEKTÖR (SVG), 64 birimlik ızgara. Onur 08.10 23:50 onayı. Kaynak: plan/29_ROZETLER/v3/kaynak/rozet.mjs
// (uygulamaya taşındı; çizim aynı). Renkler GÜNCEL DÖNEMDEN (tema/donemler.json) okunur: dönem değişince rozetler kendiliğinden yeni tona döner.
// Kurallar: tek düz renk alanı + ince iç halka, beyaz ana nesne, en fazla 2 vurgu rengi, gölge yok, degrade yok. Dönem rozeti (Gece 2026) her dönemde kendi paletinde kalır.
// @ts-nocheck
import { DONEMLER, DONEM, KURUCU_ALTIN } from '@/tema/donem';
import { RAKAM } from './rozetRakam';

// ---------- renk yardımcıları ----------
const hex2rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const rgb2hex = (r) => '#' + r.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('').toUpperCase();
export function hsl2hex(h, s, l) {
  h = ((h % 360) + 360) % 360; s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => { const k = (n + h / 30) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
  return rgb2hex([f(0) * 255, f(8) * 255, f(4) * 255]);
}
export function hex2hsl(hex) {
  let [r, g, b] = hex2rgb(hex).map((v) => v / 255);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2;
  if (mx !== mn) {
    const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    if (mx === r) h = (g - b) / d + (g < b ? 6 : 0); else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4;
    h *= 60;
  }
  return [h, s * 100, l * 100];
}
export const mix = (a, b, t) => { const A = hex2rgb(a), B = hex2rgb(b); return rgb2hex(A.map((v, i) => v + (B[i] - v) * t)); };

// ---------- dönem paleti ----------
const PALET = {};
export function palet(donemAd) {
  const ad = donemAd || DONEM.ad;
  if (PALET[ad]) return PALET[ad];
  const d = DONEMLER[ad];
  const vurgu = d.vurgu.gece;
  const ink = '#16112A';
  const h0 = hex2hsl(vurgu)[0];
  const OFS = { mercan: [0, 10, 24], amber: [42, 8, 20], yesil: [146, -5, 0], petrol: [181, -4, 0], gok: [206, 0, 0], lacivert: [244, 6, 0], mor: [280, 3, 0], pembe: [326, 3, 8], arduvaz: [262, 0, -22] };
  const ton = {};
  for (const [k, [o, odl, ods]] of Object.entries(OFS)) ton[k] = (lvl = 2) => {
    const S = Math.max(8, [30, 44, 57][lvl - 1] + ods), L = [32, 40, 48][lvl - 1] + odl;
    return { f: hsl2hex(h0 + o, S, L), d: hsl2hex(h0 + o, Math.min(100, S + 5), L - 15), l: hsl2hex(h0 + o, Math.min(100, S + 10), L + 30) };
  };
  return (PALET[ad] = { ad, isim: d.isim, ink, vurgu, paper: '#FFFFFF', h0, ton, altin: KURUCU_ALTIN, tespit: d.tespit[0], zemin: d.simge.zemin });
}

// ---------- geometri yardımcıları ----------
const f2 = (n) => +n.toFixed(2);
export function sparkle(cx, cy, r, fill) {          // markanın 4 uçlu yıldızı (logodaki oran: 0,26)
  const w = r * 0.26;
  return `<path d="M${f2(cx)} ${f2(cy - r)}L${f2(cx + w)} ${f2(cy - w)}L${f2(cx + r)} ${f2(cy)}L${f2(cx + w)} ${f2(cy + w)}L${f2(cx)} ${f2(cy + r)}L${f2(cx - w)} ${f2(cy + w)}L${f2(cx - r)} ${f2(cy)}L${f2(cx - w)} ${f2(cy - w)}Z" fill="${fill}"/>`;
}
function roundedPoly(pts, r) {
  const n = pts.length; let d = '';
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i + n - 1) % n], p1 = pts[i], p2 = pts[(i + 1) % n];
    const v1 = [p0[0] - p1[0], p0[1] - p1[1]], v2 = [p2[0] - p1[0], p2[1] - p1[1]];
    const l1 = Math.hypot(...v1), l2 = Math.hypot(...v2);
    const a = [p1[0] + v1[0] / l1 * r, p1[1] + v1[1] / l1 * r], b = [p1[0] + v2[0] / l2 * r, p1[1] + v2[1] / l2 * r];
    d += (i ? 'L' : 'M') + f2(a[0]) + ' ' + f2(a[1]) + 'Q' + f2(p1[0]) + ' ' + f2(p1[1]) + ' ' + f2(b[0]) + ' ' + f2(b[1]);
  }
  return d + 'Z';
}
const hexPts = (cx, cy, R) => [0, 1, 2, 3, 4, 5].map((i) => { const a = (-90 + i * 60) * Math.PI / 180; return [cx + R * Math.cos(a), cy + R * Math.sin(a)]; });
// markanın balon silueti (avatar balonuyla aynı yol; 512 → 64 ızgara)
const BALON512 = 'M256 104 C376 104 430 166 430 248 C430 330 368 384 268 386 L226 386 C204 406 170 424 128 428 C150 408 160 388 162 370 C110 344 82 302 82 248 C82 166 136 104 256 104 Z';
const BALON_T = 'translate(32 32.5) scale(0.172) translate(-256 -266)';
const BALON_RIM_T = 'translate(32 32.5) scale(0.148) translate(-256 -266)';

// ---------- çerçeveler ----------
// her çerçeve: { alan(renk), halka(renk), cx, cy (nesne merkezi) }
let UID = 0;
const FR = {
  disk: { alan: (c) => `<circle cx="32" cy="32" r="28" fill="${c}"/>`, halka: (c) => `<circle cx="32" cy="32" r="24.5" fill="none" stroke="${c}" stroke-width="1.5"/>`, gx: 32, gy: 29 },
  balon: { alan: (c, k, mini) => `<path d="${BALON512}" transform="${BALON_T}" fill="${c}"${k ? ` stroke="${k}" stroke-width="${f2((mini ? 2.6 : 1.6) / 0.172)}" stroke-linejoin="round"` : ''}/>`, halka: (c) => `<ellipse cx="32" cy="${f2(32.5 + (245 - 266) * 0.172)}" rx="${f2(149 * 0.172)}" ry="${f2(116 * 0.172)}" fill="none" stroke="${c}" stroke-width="1.5"/>`, gx: 32, gy: 30 },
  kare: { alan: (c) => `<rect x="4" y="4" width="56" height="56" rx="17" fill="${c}"/>`, halka: (c) => `<rect x="8.5" y="8.5" width="47" height="47" rx="12.5" fill="none" stroke="${c}" stroke-width="1.5"/>`, gx: 32, gy: 32 },
  altigen: { alan: (c) => `<path d="${roundedPoly(hexPts(32, 32, 30.5), 7)}" fill="${c}"/>`, halka: (c) => `<path d="${roundedPoly(hexPts(32, 32, 26), 5)}" fill="none" stroke="${c}" stroke-width="1.5"/>`, gx: 32, gy: 32 },
};

// ---------- nesneler (yerel koordinat: merkez 0,0; yaşam alanı yaklaşık ±17) ----------
// her nesne: (c, m, id) → svg parçası. c: renkler, m: mini (28 px) hâli
const GLASS = 'M6.2 2.9H17.8C17 6.09 15.9 7.31 15.9 10.5C15.9 12.85 17.2 13.32 17.2 15.2V15.3Q17.2 18.5 14 18.5H10Q6.8 18.5 6.8 15.3V15.2C6.8 13.32 8.1 12.85 8.1 10.5C8.1 7.31 7 6.09 6.2 2.9Z';
const SAUCER = 'M2.9 19.5C6.2 21.5 17.8 21.5 21.1 19.5';

const NESNE = {
  // --- Müdavim: ince belli Türk çay bardağı (onaylı simge silueti), koyu kırmızı-amber çay, ağızda boşluk, tabak
  cay: (c, m, id) => {
    const k = m ? 2.02 : 1.78, w = m ? 1.5 : 1.15;
    return `<defs><clipPath id="${id}a"><path d="${GLASS}"/></clipPath></defs>
<g transform="scale(${k}) translate(-12 -12.75)">
<path d="${GLASS}" fill="#fff" fill-opacity=".18"/>
<g clip-path="url(#${id}a)"><rect x="0" y="7.5" width="24" height="16" fill="#B3261E"/><rect x="0" y="7.5" width="24" height="${m ? 1.7 : 1.5}" fill="#F0902A"/><path d="${GLASS}" fill="none" stroke="#fff" stroke-width="${f2(w * 2)}"/></g>
<path d="${SAUCER}" fill="none" stroke="#fff" stroke-width="${m ? 2.5 : 2.1}" stroke-linecap="round"/></g>`;
  },
  // --- Muhabbet Kuşu: sola bakan muhabbet kuşu (sarı baş, yeşil gövde, uzun kuyruk) + küçük konuşma balonu
  kus: (c, m, id) => {
    const bird = `
<path d="M3 4 L11.5 20.5 L16 18 L9.5 1Z" fill="#2A9A66" stroke="#2A9A66" stroke-width="2" stroke-linejoin="round"/>
<ellipse cx="3" cy="3.5" rx="9.2" ry="12.8" transform="rotate(-22 3 3.5)" fill="#63D08C"/>
<path d="M2 -4 Q13 -3 11 9 Q6 14 0 8 Q-1.5 1.5 2 -4Z" fill="#2A9A66"/>
<circle cx="-3" cy="-7.5" r="8.8" fill="#FFE15C"/>
<path d="M-10.6 -9.4 Q-17.4 -9.4 -16 -2.8 Q-14.6 -6.4 -10 -6Z" fill="#FF9E4A" stroke="#FF9E4A" stroke-width="1.4" stroke-linejoin="round"/>
<circle cx="-5.4" cy="-9.4" r="${m ? 2.7 : 2.4}" fill="#16112A"/>${m ? '' : '<circle cx="-4.7" cy="-10.2" r=".85" fill="#fff"/><ellipse cx="-6.8" cy="-3.6" rx="2.5" ry="1.5" fill="#7E5BFF"/>'}`;
    const bub = m ? '' : `<path d="M6 -17 H14 Q16 -17 16 -15 V-10 Q16 -8 14 -8 H11.5 L8.5 -5 V-8 Q6 -8 4.5 -10 V-15 Q4.5 -17 6 -17Z" fill="#fff"/><circle cx="8" cy="-12.5" r="1" fill="#16112A"/><circle cx="10.5" cy="-12.5" r="1" fill="#16112A"/><circle cx="13" cy="-12.5" r="1" fill="#16112A"/>`;
    return `<g transform="${m ? 'translate(2 0.5) scale(1.28)' : 'translate(-1.5 2.5) scale(.94)'}">${bird}${bub}</g>`;
  },
  // --- Okur: açık kitap (iki sayfa, kapak, satırlar, ayraç)
  kitap: (c, m) => {
    const pg = `<path d="M-1 -9 Q-8 -13.5 -17 -11.5 V11 Q-8 9 -1 13.5Z" fill="#fff" stroke="#fff" stroke-width="2" stroke-linejoin="round"/><path d="M1 -9 Q8 -13.5 17 -11.5 V11 Q8 9 1 13.5Z" fill="#fff" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>`;
    const cover = `<path d="M-19.5 -9 V14.5 Q-9 11.5 0 16.5 Q9 11.5 19.5 14.5 V-9" fill="none" stroke="${c.d}" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round"/>`;
    const lines = m ? '' : `<g stroke="${c.l}" stroke-width="2" stroke-linecap="round"><path d="M-13 -5 H-5.5M-13 -0.5 H-5.5M-13 4 H-8"/><path d="M5.5 -5 H13M5.5 -0.5 H13M5.5 4 H10"/></g>`;
    return `<g transform="${m ? 'translate(0 0.5) scale(1.3)' : ''}">${cover}${pg}${lines}</g>`;
  },
  // --- Yazar: kalem (45°, ucu sol altta), yazılmış çizgi
  kalem: (c, m) => {
    const g = `<g transform="rotate(-45)">
<rect x="-10" y="-4.5" width="22" height="9" fill="#FFD23F"/><rect x="-10" y="0" width="22" height="4.5" fill="#F0B400"/>
<path d="M-10 -4.5 L-18 0 L-10 4.5Z" fill="#FFE2B0" stroke="#FFE2B0" stroke-width="1.6" stroke-linejoin="round"/>
<path d="M-18 0 L-14.8 -1.8 V1.8Z" fill="#16112A" stroke="#16112A" stroke-width="1.6" stroke-linejoin="round"/>
<rect x="12" y="-4.5" width="4" height="9" fill="#E8EAF2"/>
<path d="M16 -4.5 H18 Q20.5 -4.5 20.5 -2 V2 Q20.5 4.5 18 4.5 H16Z" fill="#FF6F7E"/></g>`;
    const yaz = m ? '' : `<path d="M-17 15.5 q3.5 -4 7 0 t7 0" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`;
    return `<g transform="${m ? 'translate(1 -0.5) scale(1.22)' : 'translate(2 -2)'}">${g}${yaz}</g>`;
  },
  // --- Kalp Mıknatısı: küçük at nalı mıknatıs, iri kalp kolların arasına çekiliyor
  miknatis: (c, m) => {
    const heart = (x, y, s, f) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 5.2 C-6.4 0.8 -7.2 -3 -5.4 -5.2 C-3.6 -7.2 -0.6 -6.6 0 -3.8 C0.6 -6.6 3.6 -7.2 5.4 -5.2 C7.2 -3 6.4 0.8 0 5.2Z" fill="${f}" stroke="${f}" stroke-width="1.4" stroke-linejoin="round"/>`;
    const mg = `<path d="M-8 -1 V3 A8 8 0 0 0 8 3 V-1" fill="none" stroke="#fff" stroke-width="6.4"/><path d="M-11.2 -1 H-4.8 V-5 H-11.2Z M4.8 -1 H11.2 V-5 H4.8Z" fill="#FFD23F"/>`;
    const k = m ? 1.12 : 1;
    // heart: mıknatısın açık ağzının üstünde, ucu kolların arasına giriyor
    return `<g transform="translate(0 ${m ? 0 : -0.5}) scale(${k})"><g transform="translate(0 7.5) scale(.86)">${mg}</g>${heart(0, -4.6, m ? 1.55 : 1.34, '#fff')}</g>`;
  },
  // --- Bağ Kuran: iç içe geçmiş iki halka (biri beyaz, biri sarı); üstte A, altta B üstte durur (gerçek örgü)
  halka: (c, m) => {
    const r = 9.5, sw = 5, ax = -6, bx = 6, yy = Math.sqrt(r * r - 36), al = 6.2 / r;
    const yay = (cx, a, ek, ren, w) => { const a1 = a - al - ek, a2 = a + al + ek; const p = (t) => `${f2(cx + r * Math.cos(t))} ${f2(r * Math.sin(t))}`; return `<path d="M${p(a1)}A${r} ${r} 0 0 1 ${p(a2)}" fill="none" stroke="${ren}" stroke-width="${w}"/>`; };
    const aTop = Math.atan2(-yy, 0 - ax), bBot = Math.atan2(yy, 0 - bx);
    const A = `<circle cx="${ax}" cy="0" r="${r}" fill="none" stroke="#fff" stroke-width="${sw}"/>`;
    const B = `<circle cx="${bx}" cy="0" r="${r}" fill="none" stroke="#FFD23F" stroke-width="${sw}"/>`;
    return `<g transform="${m ? 'scale(1.28)' : ''}">${A}${yay(bx, bBot, 0, c.f, sw + 3.4)}${B}${yay(ax, aTop, 0, c.f, sw + 3.4)}${yay(ax, aTop, 0.16, '#fff', sw)}</g>`;
  },
  // --- Kıdemli: yaprak takvim (halkalar, başlık, gün kareleri, işaretli gün)
  takvim: (c, m) => {
    const kare = (x, y, f, w = 5) => `<rect x="${x}" y="${y}" width="${w}" height="${w}" rx="1.5" fill="${f}"/>`;
    const gov = m
      ? [-10.5, -2.8, 4.9].map((x) => kare(x, 1.2, c.l, 5.6)).join('') + [-10.5, -2.8].map((x) => kare(x, 8.6, c.l, 5.6)).join('') + kare(4.9, 8.6, c.d, 5.6)
      : [-11.5, -2.5, 6.5].map((x) => kare(x, 1, c.l)).join('') + [-11.5, -2.5].map((x) => kare(x, 9.5, c.l)).join('') + kare(6.5, 9.5, c.d);
    const g = `<rect x="-15" y="-13" width="30" height="31" rx="5" fill="#fff"/>
<path d="M-15 -8 Q-15 -13 -10 -13 H10 Q15 -13 15 -8 V-3.5 H-15Z" fill="${c.d}"/>
<rect x="-9" y="-17" width="4" height="8" rx="2" fill="#fff" stroke="${c.f}" stroke-width="1.6"/><rect x="5" y="-17" width="4" height="8" rx="2" fill="#fff" stroke="${c.f}" stroke-width="1.6"/>${gov}`;
    return `<g transform="${m ? 'translate(0 -0.5) scale(1.22)' : 'translate(0 -0.5)'}">${g}</g>`;
  },
  // --- Bumerang: markanın konuşma balonu + etrafını saran kalın dönüş oku ("geri dönen balon")
  bumerang: (c, m, id) => {
    const R = 20.5, sw = m ? 5 : 4.4, a1 = (-62) * Math.PI / 180, a2 = (196) * Math.PI / 180; // saat yönünde ~267°
    const P1 = [R * Math.cos(a1), R * Math.sin(a1)], P2 = [R * Math.cos(a2), R * Math.sin(a2)];
    const tg = [-Math.sin(a2), Math.cos(a2)];                 // yay sonunda hareket yönü (saat yönü)
    const nr = [-tg[1], tg[0]], hb = m ? 6.6 : 5.8, hl = m ? 8.4 : 7.4;
    const bas = [P2[0] - tg[0] * 0.5, P2[1] - tg[1] * 0.5];
    const ok = `<path d="M${f2(P1[0])} ${f2(P1[1])}A${R} ${R} 0 1 1 ${f2(P2[0])} ${f2(P2[1])}" fill="none" stroke="#FFD23F" stroke-width="${sw}" stroke-linecap="round"/><path d="M${f2(bas[0] + tg[0] * hl)} ${f2(bas[1] + tg[1] * hl)}L${f2(bas[0] + nr[0] * hb)} ${f2(bas[1] + nr[1] * hb)}L${f2(bas[0] - nr[0] * hb)} ${f2(bas[1] - nr[1] * hb)}Z" fill="#FFD23F" stroke="#FFD23F" stroke-width="2" stroke-linejoin="round"/>`;
    const yuz = m ? '' : `<path d="M-6.6 -2.2 q2.4 2.4 4.8 0 M1.8 -2.2 q2.4 2.4 4.8 0" fill="none" stroke="${c.d}" stroke-width="1.9" stroke-linecap="round"/><path d="M-2.6 3.2 q2.6 2.6 5.2 0" fill="none" stroke="${c.d}" stroke-width="1.9" stroke-linecap="round"/>`;
    return `<g transform="translate(0 ${m ? 0 : 0.5})">${ok}<g transform="translate(0.8 0.4) scale(${m ? .098 : .088}) translate(-256 -266)"><path d="${BALON512}" fill="#fff"/></g>${yuz}</g>`;
  },
  // --- İlk Ses: megafon + ses yayları
  megafon: (c, m) => {
    const g = `<path d="M-14 -4 H-8 L7 -11 V11 L-8 4 H-14Z" fill="#fff" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>
<rect x="7" y="-13" width="4.5" height="26" rx="2.2" fill="${c.d}"/>
<path d="M-11 5 L-8.5 14 H-3.5 L-5 5Z" fill="#fff" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>`;
    const arcs = `<path d="M15.5 -5.5 A8 8 0 0 1 15.5 5.5" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>${m ? '' : '<path d="M18 -11 A14.5 14.5 0 0 1 18 11" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>'}`;
    return `<g transform="${m ? 'translate(-1 0) scale(1.18)' : 'translate(-3 0)'}">${g}${arcs}</g>`;
  },
  // --- Öncü: dikilmiş bayrak + (tam boyda) numara
  bayrak: (c, m, id, o) => {
    if (m) return `<g transform="translate(1.5 -0.5) scale(1.42)"><path d="M-6 -14 V13" stroke="${c.ink}" stroke-width="3" stroke-linecap="round"/><path d="M-4.5 -13 L11 -7.5 L-4.5 -2Z" fill="${c.vurgu}" stroke="${c.vurgu}" stroke-width="2.6" stroke-linejoin="round"/></g>`;
    return `<g transform="translate(0 -9.5) scale(.62)"><path d="M-6 -15 V13" stroke="${c.ink}" stroke-width="3.4" stroke-linecap="round"/><path d="M-4.5 -14 L12 -8.5 L-4.5 -3Z" fill="${c.vurgu}" stroke="${c.vurgu}" stroke-width="3" stroke-linejoin="round"/></g>${sayi(o.no ?? 7, 0, 14, c.ink)}`;
  },
  // --- Kurucu: taç
  tac: (c, m) => {
    const g = `<path d="M-13 9 L-15.5 -7 L-7 1 L0 -11 L7 1 L15.5 -7 L13 9Z" fill="${c.ink}" stroke="${c.ink}" stroke-width="3" stroke-linejoin="round"/>
<rect x="-13.5" y="9.5" width="27" height="5.5" rx="2.2" fill="${c.ink}"/>
<circle cx="-15.5" cy="-9" r="2.6" fill="${c.ink}"/><circle cx="0" cy="-13.2" r="2.6" fill="${c.ink}"/><circle cx="15.5" cy="-9" r="2.6" fill="${c.ink}"/>
${m ? '' : `<circle cx="-7.5" cy="12.3" r="1.2" fill="${c.f}"/><circle cx="0" cy="12.3" r="1.2" fill="${c.f}"/><circle cx="7.5" cy="12.3" r="1.2" fill="${c.f}"/>`}`;
    return `<g transform="${m ? 'translate(0 0.5) scale(1.3)' : 'translate(0 0)'}">${g}</g>`;
  },
  // --- Gece Kuşu: önden baykuş (kulak tutamları, büyük gözler, gaga, göğüs çizgileri)
  baykus: (c, m) => {
    const g = `<path d="M-13 -13 L-6.5 -9.5 Q0 -11.5 6.5 -9.5 L13 -13 Q14.8 -5 14.4 3 Q14 15 0 16.5 Q-14 15 -14.4 3 Q-14.8 -5 -13 -13Z" fill="#E7DEFF" stroke="#E7DEFF" stroke-width="2" stroke-linejoin="round"/>
<circle cx="-6.2" cy="-2.6" r="6.4" fill="${c.d}"/><circle cx="6.2" cy="-2.6" r="6.4" fill="${c.d}"/>
<circle cx="-6.2" cy="-2.6" r="4.3" fill="#FFD23F"/><circle cx="6.2" cy="-2.6" r="4.3" fill="#FFD23F"/>
<circle cx="-6.2" cy="-2.6" r="2.1" fill="#16112A"/><circle cx="6.2" cy="-2.6" r="2.1" fill="#16112A"/>
<path d="M-2.4 2.6 H2.4 L0 6.6Z" fill="#FF9E4A" stroke="#FF9E4A" stroke-width="1.4" stroke-linejoin="round"/>
${m ? '' : `<path d="M-6 10.5 L0 13.5 L6 10.5" fill="none" stroke="#B7A3F5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`}`;
    return `<g transform="${m ? 'translate(0 0.5) scale(1.38)' : 'translate(0 1) scale(1.1)'}">${g}</g>`;
  },
  // --- Gece 2026: hilal + iki yıldız
  hilal: (c, m, id) => {
    const g = `<defs><mask id="${id}m"><rect x="-30" y="-30" width="60" height="60" fill="#fff"/><circle cx="7.5" cy="-5" r="12.4" fill="#000"/></mask></defs>
<circle cx="-1.5" cy="2.5" r="15" fill="#FFE9B8" mask="url(#${id}m)"/>
${sparkle(10.5, -8.5, m ? 6.4 : 5.6, c.vurgu)}${m ? '' : sparkle(15.5, 3.5, 2.8, '#FFE9B8')}`;
    return `<g transform="${m ? 'translate(0 0) scale(1.28)' : ''}">${g}</g>`;
  },
  // --- Gizli: soru işareti
  soru: (c, m) => {
    const g = `<path d="M-7 -8.5 Q-7 -16 0 -16 Q7.5 -16 7.5 -9.5 Q7.5 -4.5 1.5 -1.5 Q0 -0.5 0 2.5 V4" fill="none" stroke="${c.l}" stroke-width="5.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="0" cy="12.5" r="3.2" fill="${c.l}"/>`;
    return `<g transform="${m ? 'scale(1.25)' : 'translate(0 0)'}">${g}${m ? '' : sparkle(-13, 12, 3, c.l)}</g>`;
  },
};

// Öncü numarası: marka yazı tipinden (Bricolage Grotesque Bold) çıkarılmış rakam yolları (rakam_uret.py); yazı tipi gerekmez
function sayi(n, cx, baseY, renk, k = 0.86) {
  const str = String(Math.max(0, n)).padStart(3, '0'); const adv = str.split('').map((ch) => RAKAM[ch].w * k);
  const top = adv.reduce((a, b) => a + b, 0); let x = cx - top / 2; let out = '';
  for (let i = 0; i < str.length; i++) { out += `<path d="${RAKAM[str[i]].d}" transform="translate(${f2(x)} ${baseY}) scale(${k})" fill="${renk}"/>`; x += adv[i]; }
  return out;
}

// ---------- rozet tanımları ----------
// ad → { cerceve, nesne, seviyeli, ton(hue adı), ad (görünen) }
export const ROZETLER = [
  { id: 'kurucu', ad: 'Kurucu', cerceve: 'altigen', nesne: 'tac', tip: 'altin' },
  { id: 'kurucu_dost', ad: 'Kurucu Dost', cerceve: 'altigen', nesne: 'halka', tip: 'altin' },
  { id: 'oncu', ad: 'Öncü', cerceve: 'balon', nesne: 'bayrak', tip: 'inci' },
  { id: 'ilkses', ad: 'İlk Ses', cerceve: 'balon', nesne: 'megafon', tip: 'marka' },
  { id: 'mudavim', ad: 'Müdavim', cerceve: 'disk', nesne: 'cay', tip: 'seviye', ton: 'yesil', esik: ['7', '30', '100'] },
  { id: 'muhabbet', ad: 'Muhabbet Kuşu', cerceve: 'disk', nesne: 'kus', tip: 'seviye', ton: 'lacivert', esik: ['10', '50', '250'] },
  { id: 'okur', ad: 'Okur', cerceve: 'disk', nesne: 'kitap', tip: 'seviye', ton: 'amber', esik: ['100', '1000', '5000'] },
  { id: 'yazar', ad: 'Yazar', cerceve: 'disk', nesne: 'kalem', tip: 'seviye', ton: 'petrol', esik: ['5', '25', '100'] },
  { id: 'kalp', ad: 'Kalp Mıknatısı', cerceve: 'disk', nesne: 'miknatis', tip: 'seviye', ton: 'pembe', esik: ['10', '100', '500'] },
  { id: 'bag', ad: 'Bağ Kuran', cerceve: 'disk', nesne: 'halka', tip: 'seviye', ton: 'mor', esik: ['3', '10', '30'] },
  { id: 'kidemli', ad: 'Kıdemli', cerceve: 'disk', nesne: 'takvim', tip: 'seviye', ton: 'arduvaz', esik: ['30 gün', '90 gün', '365 gün'] },
  { id: 'bumerang', ad: 'Bumerang', cerceve: 'disk', nesne: 'bumerang', tip: 'ton', ton: 'gok', lvl: 2 },
  { id: 'gece', ad: 'Gece Kuşu', cerceve: 'kare', nesne: 'baykus', tip: 'gece' },
  { id: 'donem', ad: 'Gece 2026', cerceve: 'kare', nesne: 'hilal', tip: 'donem' },
  { id: 'gizli', ad: 'Gizli', cerceve: 'kare', nesne: 'soru', tip: 'gizli' },
];

function renkler(r, P, lvl, kilit, acik) {
  const ink = P.ink;
  if (kilit) return { f: acik ? '#E4DFEF' : '#2A2540', d: '#1E1A30', l: '#6B6480', rim: acik ? '#B9B2CB' : '#FFFFFF', rimA: acik ? 0.5 : 0.1, ink, vurgu: '#6B6480' };
  switch (r.tip) {
    case 'altin': return { f: P.altin[1], d: P.altin[2], l: P.altin[0], rim: P.altin[0], rimA: 0.75, ink: '#2A1B45', vurgu: P.vurgu };
    case 'inci': return { f: '#F1EBFC', d: '#CFC3EE', l: '#B7A3F5', rim: '#B7A3F5', rimA: 0.7, kenar: '#BDAFF0', ink, vurgu: P.vurgu };
    case 'marka': return { f: mix(P.vurgu, '#16112A', .06), d: mix(P.vurgu, '#16112A', .5), l: mix(P.vurgu, '#FFFFFF', .5), rim: '#FFFFFF', rimA: 0.28, ink, vurgu: P.vurgu };
    case 'gece': return { f: '#2E2366', d: '#4B3D7A', l: '#B7A3F5', rim: '#B7A3F5', rimA: 0.35, ink, vurgu: P.vurgu };
    case 'donem': return { f: P.tespit[1], d: mix(P.tespit[1], '#000000', .3), l: '#FFE9B8', rim: P.vurgu, rimA: 0.55, ink, vurgu: P.vurgu };
    case 'gizli': return { f: '#2A2540', d: '#3B3358', l: '#B7A3F5', rim: '#B7A3F5', rimA: 0.35, ink, vurgu: P.vurgu, dash: true };
    default: { const t = P.ton[r.ton](lvl || r.lvl || 2); return { ...t, rim: '#FFFFFF', rimA: 0.22, ink, vurgu: P.vurgu }; }
  }
}

// ana üretici: rozet(id, {lvl, mini, kilit, no, P})
export function rozet(id, o = {}) {
  const r = ROZETLER.find((x) => x.id === id); if (!r) throw new Error('rozet yok ' + id);
  const P = o.P || palet(r.tip === 'donem' ? 'gece' : undefined); // dönem rozeti her dönemde kendi (Gece) paletinde kalır
  const lvl = o.lvl || 1, mini = !!o.mini, kilit = !!o.kilit;
  const uid = `r${++UID}`;
  const c = renkler(r, P, lvl, kilit, o.acik);
  const fr = FR[r.cerceve];
  const seviyeli = r.tip === 'seviye';
  let out = '';
  // S2/S3: dış halka (ince, rozet renginin açığı); S3: markanın yıldızı
  if (seviyeli && lvl >= 2 && !kilit) out += `<circle cx="32" cy="32" r="30.6" fill="none" stroke="${c.l}" stroke-width="${mini ? 1.9 : 1.6}"/>`;
  out += fr.alan(c.f, c.kenar, mini);
  if (!mini) {
    out += `<g opacity="${c.rimA}">${fr.halka(c.rim).replace('fill="none"', `fill="none"${c.dash ? ' stroke-dasharray="3 3"' : ''}`)}</g>`;
  }
  // nesne
  let gy = fr.gy; if (seviyeli && !mini) gy -= 2.2;
  const ng = NESNE[r.nesne](c, mini, uid, { no: o.no });
  if (kilit) {
    const [tA, tB] = o.acik ? ['#FFFFFF', '#BDB6D0'] : ['#8E87AA', '#554F73'];
    out += `<g transform="translate(${fr.gx} ${gy})">${ng.replace(/#[0-9A-Fa-f]{3,6}/g, (mm) => (mm.toUpperCase() === c.f.toUpperCase() ? c.f : /^#f{3,6}$/i.test(mm) ? tA : tB))}</g>`;
  } else out += `<g transform="translate(${fr.gx} ${gy})">${ng}</g>`;
  // seviye noktaları (tam boyda)
  if (seviyeli && !mini) {
    for (let i = 0; i < 3; i++) out += `<circle cx="${32 + (i - 1) * 6.5}" cy="50.2" r="1.9" fill="${kilit ? (o.acik ? '#fff' : '#8E87AA') : '#fff'}" fill-opacity="${kilit ? 0.6 : (i < lvl ? 0.95 : 0.28)}"/>`;
  }
  if (seviyeli && lvl === 3 && !kilit) out += sparkle(mini ? 53 : 52, mini ? 11 : 12, mini ? 7.4 : 7, '#fff');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${out}</svg>`;
}
