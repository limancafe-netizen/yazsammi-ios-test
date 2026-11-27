// Dönem paletinden üretilen iki özel avatar (SVG metni). Uygulama ortak.tsx'te güncel dönemle çağırır;
// kod/site/logo/donem_gorsel.mjs aynı işlevlerle kod/site/marka/marka-avatar-<dönem>.svg ve kurucu-<dönem>.svg dosyalarını yazar.
// Bu dosya başka modül içe aktarmaz (Node da doğrudan okuyabilsin diye).

type Simge = { zemin: string; yazi: string; mi: string };

// Markanın konuşma balonu (yüzlerdeki balon, sol altta kuyruk).
const BALON = 'M256 104 C376 104 430 166 430 248 C430 330 368 384 268 386 L226 386 C204 406 170 424 128 428 C150 408 160 388 162 370 C110 344 82 302 82 248 C82 166 136 104 256 104 Z';
const YILDIZ = (x: number, y: number, r: number) => `M${x} ${y - r} L${x + r * 0.26} ${y - r * 0.26} L${x + r} ${y} L${x + r * 0.26} ${y + r * 0.26} L${x} ${y + r} L${x - r * 0.26} ${y + r * 0.26} L${x - r} ${y} L${x - r * 0.26} ${y - r * 0.26} Z`;

// Göreli parlaklık (0 koyu … 1 açık). 08.10: Fuşya (pembe zemin, koyu "mı?") ve Lavanta (açık zemin, koyu "Yazsam") logo dosyalarına
// göre düzeltildi; koyu/açık seçimi sabit renk yerine bu ölçüye bakar ki her dönemde yüz ve amblem okunsun.
const parlak = (h: string) => { const n = parseInt(h.slice(1, 7), 16); const c = [16, 8, 0].map((k) => { const v = ((n >> k) & 255) / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const KOYU = '#16112A';

/** "Yazsam mı?" hesabının avatarı: kıkır yüz, dönemin logo zemininde; yanaklar ve parıltı dönemin "mı?" renginde, ince dönem halkası. */
export function markaAvatarSvg(s: Simge): string {
  const k = parlak(s.yazi) < 0.3 ? '#FFFFFF' : '#1A1033'; // koyu balonda (Lavanta) yüz çizgileri açık
  const yanak = parlak(s.mi) < 0.05 ? '#FF7AA8' : s.mi; // koyu "mı?" (Fuşya) yanakta kir gibi durmasın
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">`
    + `<circle cx="256" cy="256" r="256" fill="${s.zemin}"/>`
    + `<g transform="translate(256 262) scale(0.94) translate(-256 -266)">`
    + `<path d="${BALON}" fill="${s.yazi}"/>`
    + `<path d="M190 234 q24 24 48 0 M274 234 q24 24 48 0" fill="none" stroke="${k}" stroke-width="11" stroke-linecap="round"/>`
    + `<ellipse cx="168" cy="288" rx="30" ry="16" fill="${yanak}" opacity="0.85"/><ellipse cx="344" cy="288" rx="30" ry="16" fill="${yanak}" opacity="0.85"/>`
    + `<path d="M232 296 q12 14 24 0 q12 14 24 0" fill="none" stroke="${k}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>`
    + `</g>`
    + `<path d="${YILDIZ(418, 112, 30)}" fill="${s.mi}"/>`
    + `<circle cx="256" cy="256" r="248" fill="none" stroke="${s.mi}" stroke-width="9" opacity="0.9"/>`
    + `</svg>`;
}

/** Kurucu amblemi: dönem zemininde altın "O" monogramı; O, markanın konuşma balonu biçiminde. Altın çift halka, dönem renginde parıltı. */
export function kurucuAmblemSvg(s: Simge, altin: [string, string, string, string], ek = ''): string {
  const [a0, a1, a2, a3] = altin;
  // Amblem her dönemde koyu gece zemininde kalır (kurucu kimliği); açık logo zeminli dönemde (Fuşya, Lavanta) zemin KOYU, parıltı vurgu.
  if (parlak(s.zemin) > 0.2) s = { ...s, zemin: KOYU, mi: parlak(s.mi) < 0.05 ? s.zemin : s.mi };
  // Webde aynı sayfada birden çok amblem olur; gizli (display:none) bir ekrandaki aynı kimliğe bağlanan degrade boş çizilir → her çizime ayrı ek.
  const id = 'k' + s.zemin.slice(1, 7) + s.mi.slice(1, 4) + ek.replace(/[^A-Za-z0-9_-]/g, '');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs>`
    + `<radialGradient id="${id}z" cx="50%" cy="34%" r="72%"><stop offset="0" stop-color="#3A3160"/><stop offset="0.55" stop-color="${s.zemin}"/><stop offset="1" stop-color="#0B0816"/></radialGradient>`
    + `<radialGradient id="${id}p" cx="50%" cy="100%" r="62%"><stop offset="0" stop-color="${s.mi}" stop-opacity="0.38"/><stop offset="1" stop-color="${s.mi}" stop-opacity="0"/></radialGradient>`
    + `<linearGradient id="${id}a" x1="0.1" y1="0" x2="0.9" y2="1"><stop offset="0" stop-color="${a0}"/><stop offset="0.38" stop-color="${a1}"/><stop offset="0.72" stop-color="${a2}"/><stop offset="1" stop-color="${a3}"/></linearGradient>`
    + `<linearGradient id="${id}h" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a3}"/><stop offset="0.5" stop-color="${a2}"/><stop offset="1" stop-color="${a0}"/></linearGradient>`
    + `</defs>`
    + `<circle cx="256" cy="256" r="256" fill="url(#${id}z)"/>`
    + `<circle cx="256" cy="256" r="256" fill="url(#${id}p)"/>`
    + `<circle cx="256" cy="256" r="241" fill="none" stroke="url(#${id}h)" stroke-width="18"/>`
    + `<circle cx="256" cy="256" r="241" fill="none" stroke="#FFFFFF" stroke-opacity="0.18" stroke-width="2"/>`
    + `<circle cx="256" cy="256" r="216" fill="none" stroke="url(#${id}a)" stroke-width="3" stroke-opacity="0.55"/>`
    // gölge
    + `<g transform="translate(256 278) scale(0.7) translate(-256 -266)"><path d="${BALON} M256 164 C200 164 164 200 164 248 C164 296 200 330 256 330 C312 330 348 296 348 248 C348 200 312 164 256 164 Z" fill="#000000" fill-opacity="0.38" fill-rule="evenodd"/></g>`
    // O-balon
    + `<g transform="translate(256 264) scale(0.7) translate(-256 -266)">`
    + `<path d="${BALON} M256 164 C200 164 164 200 164 248 C164 296 200 330 256 330 C312 330 348 296 348 248 C348 200 312 164 256 164 Z" fill="url(#${id}a)" fill-rule="evenodd"/>`
    + `<path d="M118 214 C134 150 186 118 256 116" fill="none" stroke="#FFFFFF" stroke-opacity="0.55" stroke-width="9" stroke-linecap="round"/>`
    + `<path d="M256 164 C200 164 164 200 164 248" fill="none" stroke="#5A3D0A" stroke-opacity="0.35" stroke-width="7" stroke-linecap="round"/>`
    + `</g>`
    + `<path d="${YILDIZ(362, 140, 26)}" fill="${s.mi}"/>`
    + `<path d="${YILDIZ(396, 186, 11)}" fill="${a0}"/>`
    + `</svg>`;
}
