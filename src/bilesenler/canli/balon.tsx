// Balon kimliği (Onur 08.10 onayı, plan/23_MENU_PROFIL_TASARIM/profil_a.html + profil.js + ortak.js): yuvarlak fotoğraf yerine
// herkesin kendi balonu (şekil + renk + bugünkü yüz), dönem paletinden hazır duvar desenleri, onay rozeti (marka balonu içinde tik;
// X'in tırtıklı rozetine benzemesin) ve rozet rafı çizimi. Çizimler taslaktaki SVG'lerin birebir aktarımı.
import { useId, useMemo } from 'react';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import type { BalonKimlik, Yazar } from '@/canli';
import { DONEM, karistir, type Donem } from '@/tema/donem';

export const SEKIL_ADLARI: Record<string, string> = { klasik: 'Klasik', yuvarlak: 'Yuvarlak', kutu: 'Kutu', bulut: 'Bulut' };
export const YUZ_ADLARI: Record<string, string> = { mutlu: 'Mutlu', utangac: 'Utangaç', kahkaha: 'Kahkaha', emin: 'Emin', goz: 'Göz kırp', gergin: 'Gergin', uzgun: 'Üzgün', panik: 'Panik', devir: 'Göz devir', gece: 'Uykusuz' };
export const RENKLER: Record<string, [string, string]> = { beyaz: ['#FFFFFF', 'Bulut beyazı'], mercan: ['#FFB8C1', 'Mercan'], lavanta: ['#C9B8FF', 'Lavanta'], nane: ['#9FEBCF', 'Nane'], limon: ['#FFE08A', 'Limon'], gok: ['#A9D8FF', 'Gök'], seftali: ['#FFC59E', 'Şeftali'], inci: ['#EFE8FF', 'İnci'] };
// Öncülere özel (ilk 100 üye): İnci balon rengi + İlk Işık duvarı. Seçicilerde yalnız Öncüye gösterilir; sunucu da denetler.
export const ONCU_RENK = ['inci'];
export const ONCU_DUVAR = ['ilkisik'];
export const DUVARLAR: Record<string, string> = { gece: 'Dönem degradesi', yagmur: 'Balon yağmuru', dalga: 'Dalga', konfeti: 'Konfeti', yazi: 'El yazısı', yildiz: 'Yıldızlı gece', ilkisik: 'İlk Işık' };

// Sunucudaki türetmenin aynısı (topluluk.mjs ESKI_YUZ): kaydı olmayan yazarda eski yüz avatarından.
const ESKI_YUZ: Record<string, [string, string]> = { kikir: ['mutlu', 'gok'], emin: ['emin', 'nane'], goz: ['goz', 'mercan'], kahkaha: ['kahkaha', 'nane'], panik: ['panik', 'mercan'], utangac: ['utangac', 'seftali'], devir: ['devir', 'lavanta'], gergin: ['gergin', 'lavanta'], uzgun: ['uzgun', 'gok'], gece: ['devir', 'lavanta'] };
const ESKI_SIRA = ['gergin', 'utangac', 'uzgun', 'emin', 'panik', 'kahkaha', 'goz', 'devir', 'kikir'];
export function balonBul(y: Pick<Yazar, 'uid' | 'ad' | 'yuz' | 'balon'>): BalonKimlik {
  const b = y.balon;
  if (b && SEKIL_ADLARI[b.s] && RENKLER[b.r] && YUZ_ADLARI[b.y]) return b;
  let eski = y.yuz && ESKI_YUZ[y.yuz] ? y.yuz : '';
  if (!eski) {
    let h = 0;
    for (const c of y.ad || y.uid) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    eski = ESKI_SIRA[h % ESKI_SIRA.length];
  }
  const [yz, r] = ESKI_YUZ[eski];
  return { s: 'klasik', r, y: yz };
}

// ---------- balon gövdeleri (512 ızgara) ve yüzler (kod/site/marka/yuz-*.svg çizgileri) ----------
const SEKIL: Record<string, string> = {
  klasik: '<path d="M256 104 C376 104 430 166 430 248 C430 330 368 384 268 386 L226 386 C204 406 170 424 128 428 C150 408 160 388 162 370 C110 344 82 302 82 248 C82 166 136 104 256 104 Z"/>',
  yuvarlak: '<path d="M256 88C368 88 438 160 438 252C438 344 368 414 256 414C222 414 191 407 164 394L100 422C93 425 87 418 91 412L118 364C93 334 74 296 74 252C74 160 144 88 256 88Z"/>',
  kutu: '<path d="M150 104H362C406 104 432 130 432 174V318C432 362 406 388 362 388H238L156 442C149 446 141 440 144 432L160 388H150C106 388 80 362 80 318V174C80 130 106 104 150 104Z"/>',
  bulut: '<circle cx="168" cy="272" r="80"/><circle cx="230" cy="198" r="86"/><circle cx="326" cy="194" r="82"/><circle cx="394" cy="262" r="66"/><circle cx="330" cy="320" r="70"/><circle cx="220" cy="326" r="64"/><circle cx="270" cy="262" r="112"/><circle cx="108" cy="414" r="26"/><circle cx="66" cy="458" r="14"/>',
};
const YUZ_KAYMA: Record<string, string> = { klasik: '', yuvarlak: 'translate(0 6)', kutu: 'translate(10.2 4) scale(0.96)', bulut: 'translate(20.5 6) scale(0.92)' };
const K = '#1A1033', YN = '#FF7AA8';
const YUZ: Record<string, string> = {
  mutlu: `<path d="M190 234 q24 24 48 0 M274 234 q24 24 48 0" fill="none" stroke="${K}" stroke-width="11" stroke-linecap="round"/><ellipse cx="168" cy="288" rx="30" ry="16" fill="${YN}" opacity=".9"/><ellipse cx="344" cy="288" rx="30" ry="16" fill="${YN}" opacity=".9"/><path d="M232 296 q12 14 24 0 q12 14 24 0" fill="none" stroke="${K}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>`,
  utangac: `<path d="M188 250 q26 -30 52 0 M272 250 q26 -30 52 0" fill="none" stroke="${K}" stroke-width="11" stroke-linecap="round"/><ellipse cx="166" cy="290" rx="32" ry="17" fill="${YN}"/><ellipse cx="346" cy="290" rx="32" ry="17" fill="${YN}"/><path d="M226 292 q30 30 60 0" fill="none" stroke="${K}" stroke-width="10" stroke-linecap="round"/>`,
  kahkaha: `<path d="M192 222 L232 240 L192 258 M320 222 L280 240 L320 258" stroke="${K}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round" fill="none"/><ellipse cx="170" cy="300" rx="24" ry="13" fill="${YN}" opacity=".9"/><ellipse cx="342" cy="300" rx="24" ry="13" fill="${YN}" opacity=".9"/><path d="M206 280 H306 Q304 356 256 356 Q208 356 206 280 Z" fill="${K}"/><path d="M226 334 Q256 312 286 334 Q276 352 256 352 Q236 352 226 334 Z" fill="#FF6F91"/>`,
  emin: `<path d="M190 198 Q212 184 236 194 M278 186 L324 200" stroke="${K}" stroke-width="10" stroke-linecap="round" fill="none"/><ellipse cx="216" cy="244" rx="18" ry="22" fill="${K}"/><ellipse cx="300" cy="244" rx="18" ry="22" fill="${K}"/><circle cx="224" cy="236" r="6" fill="#fff"/><circle cx="308" cy="236" r="6" fill="#fff"/><ellipse cx="170" cy="294" rx="26" ry="14" fill="${YN}" opacity=".9"/><ellipse cx="342" cy="294" rx="26" ry="14" fill="${YN}" opacity=".9"/><path d="M232 300 Q262 318 292 290" fill="none" stroke="${K}" stroke-width="9" stroke-linecap="round"/>`,
  goz: `<path d="M190 246 q24 -22 48 0" fill="none" stroke="${K}" stroke-width="11" stroke-linecap="round"/><ellipse cx="298" cy="236" rx="18" ry="28" fill="${K}"/><circle cx="304" cy="224" r="6" fill="#fff"/><ellipse cx="170" cy="294" rx="26" ry="14" fill="${YN}" opacity=".9"/><ellipse cx="342" cy="294" rx="26" ry="14" fill="${YN}" opacity=".9"/><path d="M222 286 H292 Q290 330 257 330 Q224 330 222 286 Z" fill="${K}"/><path d="M240 314 Q257 300 274 314 Q270 328 257 328 Q244 328 240 314 Z" fill="#FF6F91"/>`,
  gergin: `<path d="M190 200 L234 186 M278 186 L322 200" stroke="${K}" stroke-width="10" stroke-linecap="round"/><ellipse cx="214" cy="240" rx="17" ry="27" fill="${K}"/><ellipse cx="298" cy="240" rx="17" ry="27" fill="${K}"/><circle cx="220" cy="228" r="6" fill="#fff"/><circle cx="304" cy="228" r="6" fill="#fff"/><ellipse cx="170" cy="294" rx="26" ry="14" fill="${YN}" opacity=".9"/><ellipse cx="342" cy="294" rx="26" ry="14" fill="${YN}" opacity=".9"/><path d="M232 306 q10 -11 20 0 t20 0 t20 0" fill="none" stroke="${K}" stroke-width="8" stroke-linecap="round"/><path transform="translate(372 196) scale(.8)" d="M0 -48 C12 -28 22 -14 22 0 A22 22 0 1 1 -22 0 C-22 -14 -12 -28 0 -48 Z" fill="#64D2FF"/>`,
  uzgun: `<path d="M188 208 Q212 200 234 186 M278 186 Q300 200 324 208" stroke="${K}" stroke-width="10" stroke-linecap="round" fill="none"/><ellipse cx="214" cy="250" rx="17" ry="23" fill="${K}"/><ellipse cx="298" cy="250" rx="17" ry="23" fill="${K}"/><circle cx="219" cy="243" r="6" fill="#fff"/><circle cx="303" cy="243" r="6" fill="#fff"/><ellipse cx="170" cy="298" rx="26" ry="14" fill="${YN}" opacity=".75"/><ellipse cx="342" cy="298" rx="26" ry="14" fill="${YN}" opacity=".75"/><path d="M230 324 Q256 300 282 324" fill="none" stroke="${K}" stroke-width="9" stroke-linecap="round"/><path transform="translate(196 300) scale(0.55)" d="M0 -48 C12 -28 22 -14 22 0 A22 22 0 1 1 -22 0 C-22 -14 -12 -28 0 -48 Z" fill="#64D2FF"/>`,
  panik: `<path d="M186 190 Q210 168 236 180 M276 180 Q302 168 326 190" stroke="${K}" stroke-width="10" stroke-linecap="round" fill="none"/><circle cx="214" cy="240" r="25" fill="${K}"/><circle cx="298" cy="240" r="25" fill="${K}"/><circle cx="222" cy="230" r="8" fill="#fff"/><circle cx="306" cy="230" r="8" fill="#fff"/><ellipse cx="170" cy="298" rx="22" ry="12" fill="${YN}" opacity=".8"/><ellipse cx="342" cy="298" rx="22" ry="12" fill="${YN}" opacity=".8"/><ellipse cx="256" cy="318" rx="17" ry="23" fill="${K}"/>`,
  devir: `<path d="M190 188 H236 M276 188 H322" stroke="${K}" stroke-width="10" stroke-linecap="round"/><circle cx="214" cy="240" r="25" fill="#fff" stroke="${K}" stroke-width="8"/><circle cx="298" cy="240" r="25" fill="#fff" stroke="${K}" stroke-width="8"/><circle cx="220" cy="226" r="10" fill="${K}"/><circle cx="304" cy="226" r="10" fill="${K}"/><ellipse cx="170" cy="296" rx="22" ry="12" fill="${YN}" opacity=".6"/><ellipse cx="342" cy="296" rx="22" ry="12" fill="${YN}" opacity=".6"/><path d="M234 314 L288 302" stroke="${K}" stroke-width="9" stroke-linecap="round"/>`,
  gece: `<path d="M192 196 L236 192 M278 186 L322 198" stroke="${K}" stroke-width="10" stroke-linecap="round"/><ellipse cx="214" cy="240" rx="18" ry="26" fill="${K}"/><ellipse cx="298" cy="240" rx="18" ry="26" fill="${K}"/><circle cx="222" cy="226" r="7" fill="#fff"/><circle cx="306" cy="226" r="7" fill="#fff"/><ellipse cx="170" cy="294" rx="26" ry="14" fill="${YN}" opacity=".9"/><ellipse cx="342" cy="294" rx="26" ry="14" fill="${YN}" opacity=".9"/><path d="M244 304 H286" stroke="${K}" stroke-width="9" stroke-linecap="round"/>`,
};

/** Kişinin balonu (SVG metni). id: aynı sayfadaki her çizime ayrı kimlik (gizli ekrandaki eş kimlik degradeyi boş çizdiriyordu). */
export function balonSvg(k: BalonKimlik, id: string, golge = true) {
  const renk = (RENKLER[k.r] ?? RENKLER.mercan)[0];
  const sekil = SEKIL[k.s] ?? SEKIL.klasik;
  // Balon zemine otursun diye çok hafif gölge (taslakta CSS drop-shadow): gövdenin 6 birim aşağı kaymış koyu kopyası.
  const g = golge ? `<g transform="translate(0 7)" fill="#0A0619" fill-opacity=".16">${sekil}</g>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><clipPath id="${id}">${sekil}</clipPath><linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#1A1033" stop-opacity=".13"/></linearGradient></defs>${g}<g clip-path="url(#${id})"><rect width="512" height="512" fill="${renk}"/><rect width="512" height="512" fill="url(#${id}g)"/></g><g transform="${YUZ_KAYMA[k.s] ?? ''}">${YUZ[k.y] ?? YUZ.mutlu}</g></svg>`;
}

const kimlikEki = (s: string) => 'b' + s.replace(/[^A-Za-z0-9_-]/g, '');
export function BalonAvatar({ kimlik, boyut = 40 }: { kimlik: BalonKimlik; boyut?: number }) {
  const ek = kimlikEki(useId());
  const xml = useMemo(() => balonSvg(kimlik, ek), [kimlik.s, kimlik.r, kimlik.y, ek]);
  return (
    <View style={{ width: boyut, height: boyut }}>
      <SvgXml xml={xml} width={boyut} height={boyut} />
    </View>
  );
}

// ---------- onay rozeti: marka balonu içinde tik (dönem renginde) ----------
const BALON24 = 'M12 3.5C18.2 3.5 21 6.7 21 10.95C21 15.2 17.8 18 12.6 18.1L10.45 18.1C9.3 19.1 7.55 20.05 5.4 20.25C6.5 19.2 7 18.2 7.15 17.25C4.45 15.9 3 13.75 3 10.95C3 6.7 5.8 3.5 12 3.5Z';
export const onaySvg = (renk: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="${BALON24}" fill="${renk}" stroke="${renk}" stroke-width="1.2" stroke-linejoin="round"/><path d="M8.5 10.9L10.9 13.2L15.5 8.6" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

// ---------- duvar desenleri (dönem paletinden; taslak profil.js Y.duvar) ----------
const yildizYol = (x: number, y: number, r: number) => `M${x} ${y - r}Q${x + r * 0.16} ${y - r * 0.16} ${x + r} ${y}Q${x + r * 0.16} ${y + r * 0.16} ${x} ${y + r}Q${x - r * 0.16} ${y + r * 0.16} ${x - r} ${y}Q${x - r * 0.16} ${y - r * 0.16} ${x} ${y - r}Z`;
const donustur = (d: string, sx: number, sy: number, tx: number, ty: number) => {
  let i = 0;
  return d.replace(/-?\d*\.?\d+/g, (n) => {
    const v = parseFloat(n);
    const r = i++ % 2 === 0 ? v * sx + tx : v * sy + ty;
    return String(+r.toFixed(2));
  });
};
const balonYol = (s: number, tx: number, ty: number) => donustur(BALON24, s, s, tx, ty);
// Açık logo zeminli dönemde (Fuşya, Lavanta) duvarlar koyu kalır: zemin yerine gece koyusu.
const koyuZemin = (d: Donem) => {
  const n = parseInt(d.simge.zemin.slice(1), 16);
  const l = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return l > 0.45 ? '#16112A' : d.simge.zemin;
};
export function duvarSvg(ad: string, id: string, d: Donem = DONEM, w = 600, h = 200) {
  const t1 = d.tespit[0], t2 = d.tespit[1] ?? d.tespit[0], v = d.vurgu.gece, z = koyuZemin(d);
  const kap = (ic: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice">${ic}</svg>`;
  const R = `width="${w}" height="${h}"`;
  switch (ad) {
    case 'yagmur':
      return kap(`<defs><radialGradient id="${id}r" cx=".86" cy=".08" r=".9"><stop offset="0" stop-color="${v}" stop-opacity=".55"/><stop offset="1" stop-color="${v}" stop-opacity="0"/></radialGradient><pattern id="${id}p" width="74" height="66" patternUnits="userSpaceOnUse" patternTransform="rotate(-10)"><path d="${balonYol(1.25, 4, 3)}" fill="none" stroke="${v}" stroke-opacity=".6" stroke-width="1.8"/><path d="${balonYol(0.62, 44, 32)}" fill="#fff" fill-opacity=".13"/></pattern></defs><rect ${R} fill="${z}"/><rect ${R} fill="url(#${id}r)"/><rect ${R} fill="url(#${id}p)"/>`);
    case 'dalga':
      return kap(`<defs><linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t2[0]}"/><stop offset=".55" stop-color="${t2[1]}"/><stop offset="1" stop-color="${t2[2]}"/></linearGradient><pattern id="${id}p" width="160" height="30" patternUnits="userSpaceOnUse"><path d="M0 15C20 4 60 4 80 15S140 26 160 15" fill="none" stroke="#fff" stroke-opacity=".24" stroke-width="2.4"/></pattern></defs><rect ${R} fill="url(#${id}g)"/><rect ${R} fill="url(#${id}p)"/>`);
    case 'konfeti':
      return kap(`<defs><linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2A1B45"/><stop offset="1" stop-color="${z}"/></linearGradient><pattern id="${id}p" width="58" height="58" patternUnits="userSpaceOnUse"><circle cx="8" cy="10" r="3.2" fill="${v}"/><circle cx="31" cy="22" r="2.4" fill="#FFE08A"/><circle cx="48" cy="7" r="2" fill="#9FEBCF"/><circle cx="17" cy="41" r="2.6" fill="#C9B8FF"/><rect x="38" y="38" width="9" height="3.4" rx="1.7" fill="#A9D8FF" transform="rotate(32 42 40)"/><rect x="2" y="26" width="8" height="3" rx="1.5" fill="${v}" opacity=".7" transform="rotate(-24 6 27)"/></pattern></defs><rect ${R} fill="url(#${id}g)"/><rect ${R} fill="url(#${id}p)"/>`);
    case 'yazi': {
      // El yazısı deseni (taslaktaki Caveat "yazsam mı?" satırları, iki katman).
      const satir = (dx: number, dy: number, renk: string, op: number) =>
        Array.from({ length: Math.ceil(h / 52) + 2 }, (_, r) => Array.from({ length: Math.ceil(w / 190) + 2 }, (_, c) => `<text x="${c * 190 + dx - 40 + (r % 2) * 40}" y="${r * 52 + dy}" font-family="Caveat_700Bold, Caveat, cursive" font-weight="700" font-size="30" fill="${renk}" fill-opacity="${op}" transform="rotate(-9 ${c * 190} ${r * 52})">yazsam mı?</text>`).join('')).join('');
      return kap(`<defs><linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${t1[1]}"/><stop offset="1" stop-color="${t1[0]}"/></linearGradient></defs><rect ${R} fill="url(#${id}g)"/>${satir(6, 36, '#fff', 0.17)}${satir(101, 62, v, 0.35)}`);
    }
    case 'ilkisik': {
      // İlk Işık (Öncülere özel): gün doğarken ilk ışık — koyu zeminde köşeden yayılan sıcak ışık, ince ışın demeti ve markanın yıldızları.
      const isik = d.tespit[0][2], sicak = karistir('#FFE9B8', isik, 0.55);
      const isinlar = Array.from({ length: 7 }, (_, i) => { const a = (-8 + i * 13) * Math.PI / 180, x2 = w * 0.06 + Math.cos(a) * w * 1.3, y2 = h * 1.05 - Math.sin(a) * w * 1.3, ort = a + 0.035, x3 = w * 0.06 + Math.cos(ort) * w * 1.3, y3 = h * 1.05 - Math.sin(ort) * w * 1.3; return `<path d="M${w * 0.06} ${h * 1.05}L${x2.toFixed(1)} ${y2.toFixed(1)}L${x3.toFixed(1)} ${y3.toFixed(1)}Z" fill="#FFE9B8" fill-opacity="${i % 2 ? 0.07 : 0.11}"/>`; }).join('');
      return kap(`<defs><linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0E0A1C"/><stop offset=".62" stop-color="${z}"/><stop offset="1" stop-color="${isik}" stop-opacity=".55"/></linearGradient><radialGradient id="${id}r" cx=".06" cy="1.05" r=".95"><stop offset="0" stop-color="${sicak}" stop-opacity=".95"/><stop offset=".35" stop-color="${isik}" stop-opacity=".45"/><stop offset="1" stop-color="${isik}" stop-opacity="0"/></radialGradient></defs><rect ${R} fill="url(#${id}g)"/>${isinlar}<rect ${R} fill="url(#${id}r)"/><path d="${yildizYol(w * 0.74, h * 0.2, 5.5)}" fill="#FFF1CC" opacity=".9"/><path d="${yildizYol(w * 0.9, h * 0.46, 3)}" fill="#fff" opacity=".7"/><path d="${yildizYol(w * 0.5, h * 0.14, 2.6)}" fill="#fff" opacity=".6"/><circle cx="${w * 0.62}" cy="${h * 0.42}" r="1.3" fill="#fff" opacity=".6"/><circle cx="${w * 0.84}" cy="${h * 0.12}" r="1.2" fill="#FFF1CC" opacity=".7"/>`);
    }
    case 'yildiz':
      return kap(`<defs><radialGradient id="${id}g" cx=".25" cy=".1" r="1"><stop offset="0" stop-color="#3A3160"/><stop offset=".6" stop-color="${z}"/><stop offset="1" stop-color="#0B0816"/></radialGradient><pattern id="${id}p" width="96" height="84" patternUnits="userSpaceOnUse"><path d="${yildizYol(18, 20, 4.5)}" fill="#FFE9A8" opacity=".8"/><circle cx="62" cy="14" r="1.3" fill="#fff" opacity=".7"/><circle cx="40" cy="58" r="1" fill="#fff" opacity=".6"/><path d="${yildizYol(76, 62, 2.6)}" fill="#fff" opacity=".6"/><circle cx="8" cy="70" r="1.4" fill="#FFE9A8" opacity=".55"/></pattern><mask id="${id}m"><circle cx="${w * 0.8 + 24}" cy="${h * 0.14 + 24}" r="22" fill="#fff"/><circle cx="${w * 0.8 + 34}" cy="${h * 0.14 + 16}" r="19" fill="#000"/></mask></defs><rect ${R} fill="url(#${id}g)"/><rect ${R} fill="url(#${id}p)"/><circle cx="${w * 0.8 + 24}" cy="${h * 0.14 + 24}" r="22" fill="#FFE9A8" mask="url(#${id}m)"/>`);
    default: {
      return kap(`<defs><linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${t1[0]}"/><stop offset=".58" stop-color="${t1[1]}"/><stop offset="1" stop-color="${t1[2]}"/></linearGradient><radialGradient id="${id}r" cx=".9" cy=".95" r=".7"><stop offset="0" stop-color="${t1[2]}" stop-opacity=".7"/><stop offset="1" stop-color="${t1[2]}" stop-opacity="0"/></radialGradient><pattern id="${id}p" width="120" height="84" patternUnits="userSpaceOnUse"><path d="${yildizYol(22, 20, 5)}" fill="#fff" opacity=".55"/><circle cx="74" cy="52" r="1.4" fill="#fff" opacity=".55"/><path d="${yildizYol(98, 16, 3)}" fill="#fff" opacity=".35"/><circle cx="46" cy="72" r="1" fill="#fff" opacity=".45"/></pattern></defs><rect ${R} fill="url(#${id}g)"/><rect ${R} fill="url(#${id}r)"/><rect ${R} fill="url(#${id}p)"/>`);
    }
  }
}

export function Duvar({ ad, genislik, yukseklik }: { ad: string; genislik: number; yukseklik: number }) {
  const ek = kimlikEki(useId());
  const xml = useMemo(() => duvarSvg(ad, 'd' + ek, DONEM, Math.max(1, Math.round(genislik)), Math.max(1, Math.round(yukseklik))), [ad, ek, genislik, yukseklik]);
  return <SvgXml xml={xml} width={genislik} height={yukseklik} />;
}

// ---------- rozet rafı rozetleri (taslak profil.js Y.rozetSvg) ----------
export type RafRozet = { ad: string; alt: string; ikon?: 'yildiz' | 'kalem' | 'yz'; renk?: [string, string, string]; kilit?: boolean };
const RB = balonYol(2.4, 3.2, 2.2); // 64'lük kutuda marka balonu
const ROZET_IK: Record<string, string> = {
  yildiz: '<path d="M12 3.2C12.6 8.4 15.6 11.4 20.8 12C15.6 12.6 12.6 15.6 12 20.8C11.4 15.6 8.4 12.6 3.2 12C8.4 11.4 11.4 8.4 12 3.2Z"/>',
  kalem: '<path d="M4.6 19.4L5.5 15.3L15.4 5.4C16.2 4.6 17.5 4.6 18.3 5.4L18.6 5.7C19.4 6.5 19.4 7.8 18.6 8.6L8.7 18.5L4.6 19.4Z"/>',
  yz: '<path d="M12 3.6L13.7 8.6L18.8 10.3L13.7 12L12 17L10.3 12L5.2 10.3L10.3 8.6Z"/><circle cx="18" cy="17.6" r="1.8"/><circle cx="6.2" cy="17.8" r="1.2"/>',
  kilit: '<rect x="5" y="10.4" width="14" height="10" rx="3"/><path d="M8.5 10.4V8.2C8.5 6.2 10.1 4.6 12 4.6C13.9 4.6 15.5 6.2 15.5 8.2V10.4"/>',
};
export function rozetSvg(r: RafRozet, id: string, kilitRenk: string) {
  if (r.kilit || !r.renk) return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 60"><path d="${RB}" fill="none" stroke="${kilitRenk}" stroke-opacity=".35" stroke-width="1.6" stroke-dasharray="4 4"/><svg x="23" y="17" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${kilitRenk}" stroke-opacity=".55" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ROZET_IK.kilit}</svg></svg>`;
  const c = r.renk;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 60"><defs><linearGradient id="${id}" x1=".15" y1="0" x2=".85" y2="1"><stop offset="0" stop-color="${c[0]}"/><stop offset=".5" stop-color="${c[1]}"/><stop offset="1" stop-color="${c[2]}"/></linearGradient><linearGradient id="${id}p" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><path d="${RB}" fill="url(#${id})"/><path d="${RB}" fill="url(#${id}p)" opacity=".7"/><path d="${RB}" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1.4"/><svg x="20" y="14" width="24" height="24" viewBox="0 0 24 24" fill="#fff" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ROZET_IK[r.ikon ?? 'yildiz']}</svg></svg>`;
}
export function RozetCizim({ r, boyut = 52, kilitRenk }: { r: RafRozet; boyut?: number; kilitRenk: string }) {
  const ek = kimlikEki(useId());
  const xml = useMemo(() => rozetSvg(r, 'r' + ek, kilitRenk), [r.ad, r.kilit, ek, kilitRenk]);
  return <SvgXml xml={xml} width={boyut} height={(boyut * 60) / 64} />;
}

// ---------- küçük balon simgesi (taslaktaki "profil" simgesi: dolu balon + yüz; "Balonunu düzenle" düğmesinde) ----------
export const balonIkonSvg = (renk: string, ic: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="${BALON24}" fill="${renk}"/><circle cx="9.4" cy="10.2" r="1.15" fill="${ic}"/><circle cx="14.6" cy="10.2" r="1.15" fill="${ic}"/><path d="M9.7 12.9Q12 14.8 14.3 12.9" fill="none" stroke="${ic}" stroke-width="1.5" stroke-linecap="round"/></svg>`;
export function BalonIkon({ renk, ic, boyut = 18 }: { renk: string; ic: string; boyut?: number }) {
  const xml = useMemo(() => balonIkonSvg(renk, ic), [renk, ic]);
  return <SvgXml xml={xml} width={boyut} height={boyut} />;
}

// 09.10: eski renkli kare "yüz" simgelerinin (Yuz) yerini alır: boş durumlar, giriş penceresi, akış sonu, yeni gönderi hapı.
// Aynı balon çizimi (Balon Kimliği), yüze göre pastel renk; kare zemin ve kırpma yok.
const YUZ_BALON: Record<string, [string, string]> = { kikir: ['mutlu', 'mercan'], utangac: ['utangac', 'mercan'], uzgun: ['uzgun', 'lavanta'], emin: ['emin', 'nane'], goz: ['goz', 'lavanta'], kahkaha: ['kahkaha', 'limon'], panik: ['panik', 'mercan'], gergin: ['gergin', 'mercan'], devir: ['devir', 'lavanta'] };
export function YuzBalon({ ad, boyut = 56 }: { ad: string; boyut?: number }) {
  const [y, r] = YUZ_BALON[ad] ?? ['mutlu', 'mercan'];
  return <BalonAvatar kimlik={{ s: 'klasik', r, y }} boyut={boyut} />;
}
