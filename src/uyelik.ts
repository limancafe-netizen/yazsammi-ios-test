// Üyelik yardımcıları (08.11, Onur 07.11 kararı): (1) e-posta girişi bekleme kaydı, (2) "ilk sonuç serbest, ikincisinde üyelik" sayacı (Tribün).
// Depo anahtarları statik bölüm sayfalarıyla (site/uyelik/uyelik.js) aynıdır: web'de bir yerde başlayan bekleyiş her yerde sürer.
import { depoOku, depoYaz } from '@/depo';
import { kayitliUye, oturumVar } from '@/canli';

// --- e-posta girişi bekleme kaydı ---
const BEKLEME = 'yazsammi_uyelik_bekleme_v1';
export const BEKLEME_OMRU = 15 * 60000;
export type BeklemeKaydi = { sk: string; e: string; t: number; kod?: string }; // site/uyelik/uyelik.js ile aynı biçim ve anahtar (kod: eşleştirme kodu)
export function beklemeKaydi(): BeklemeKaydi | null {
  try {
    const k = JSON.parse(depoOku(BEKLEME) || 'null');
    return k && typeof k.sk === 'string' && typeof k.e === 'string' && typeof k.t === 'number' && (k.kod === undefined || typeof k.kod === 'string') && Date.now() - k.t < BEKLEME_OMRU ? k : null;
  } catch {
    return null;
  }
}
export const beklemeYaz = (sk: string, e: string, kod = '') => depoYaz(BEKLEME, JSON.stringify({ sk, e, t: Date.now(), kod }));
export const beklemeSil = () => depoYaz(BEKLEME, '');

// --- ilk sonuç serbest, ikincisinde üyelik ---
// Tribün: girişsiz kişi ilk maç odasını serbestçe görür (cihazda sayaç); İKİNCİ farklı maç odasında giriş istenir. Giriş açıksa hiç etkilenmez.
export const TRIBUN_ANAHTAR = 'yazsammi.uyelik.tribun';
export const TRIBUN_NEDEN = 'İlk maç yorumu benden hediye. Devamı için bir e-posta yeter.';
export function tamUye(): boolean {
  const u = kayitliUye();
  return oturumVar() && !!u && !!u.ad && !u.yeni && !u.sozGerekli;
}
function tribunGorulen(): string[] {
  try {
    const d = JSON.parse(depoOku(TRIBUN_ANAHTAR) || '[]');
    return Array.isArray(d) ? d.filter((x) => typeof x === 'string').slice(-20) : [];
  } catch {
    return [];
  }
}
/** Bu maç odası açılabilir mi? İlk oda (ya da zaten görülen oda) serbest; yeni bir oda girişsize kapalı. Açılabiliyorsa görülenlere yazar. */
export function tribunMacIzni(id: string): boolean {
  if (tamUye()) return true;
  const gorulen = tribunGorulen();
  if (gorulen.includes(id)) return true;
  if (gorulen.length >= 1) return false;
  depoYaz(TRIBUN_ANAHTAR, JSON.stringify([...gorulen, id]));
  return true;
}
