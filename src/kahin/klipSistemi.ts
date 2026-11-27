// KULLANILMIYOR (04.11.2026): eski KAHİN astroloji/tarot ekranı. Astroloji ve Tarot Kart Analizi artık sitenin /astroloji/ ve /tarot/ sayfaları,
// uygulamada WebView ile (bilesenler/canli/SiteBolumu.native.tsx); hiçbir ekran bu dosyayı içe aktarmıyor. Kod başvuru için duruyor, silinmedi.
// KAHİN odası klip sistemi (30.10, yeni tarot): tüm okuma KAHİN'in odasında GERÇEK DİKEY VİDEO olarak geçer.
// Sahne durumları (kuzgunun yeri): K0 = kuzgun yok · K1 = kuzgun masada · K2 = kuzgun tünekte. Her klip bir durumda başlar ve bir durumda biter;
// Okuma akışı: kuzgun KAPALI odaya gelir (K0→K1 kuzgun_gelis, yüzü örten kanat kareleri atıldı), büyü sırasında masada durur, kartlar masayı örtünce
// TÜNEĞE geçer (K1→K2 yalnız çapraz geçiş: masadaki kuzgun kartların altında kaybolur, tünekteki belirir) ve okuma boyunca tünekte kalır — kartlar HİÇ solmaz, kuzgun kartların üstünde görünür.
// Tünekli ruh klipleri (*_k2) = K1 ruh klipleri + R10 tünek kuzgunu yaması − masadaki kuzgun (k2_kompozit/). 16:9 eski klipler ve yüzü örten tünege/tunekten KALDIRILDI.
// Manifest: klipler_gece.ts (plan/.../uygulama_2/klip_ekle.py üretir).
import { GECE } from './klipler_gece';

export type KDurum = 'K0' | 'K1' | 'K2';
export type Tanim = { id: string; kaynak: any; basla: KDurum; bitis: KDurum; dongu: boolean };

export const TUM: Tanim[] = GECE;

/** sunucu ruh hali → KAHİN yüz klibi (hepsi K1: kuzgun masada) */
export const RUH_KLIP: Record<string, string> = { sicak: 'sefkat', sefkat: 'sefkat', gizem: 'gizem', ciddi: 'gizem', sasirma: 'soru', neseli: 'gulme', dusunceli: 'dusunceli', soru: 'soru' };
/** sunucu kuzgun işareti → kuzgun klibi (K1→K1) */
export const KUZGUN_KLIP: Record<string, string> = { cigilik: 'kuzgun_cigilik', kullaniciya_bak: 'kuzgun_kullaniciya_bak', kahine_bak: 'kuzgun_kahine_bak', yuruyus: 'kuzgun_yuruyus', silkinme: 'kuzgun_silkinme' };
/** kuzgunun yerine göre sakin bekleme klibi */
export const BEKLEME: Record<KDurum, string> = { K0: 'oda_bekleme', K1: 'kuzgun_bekleme', K2: 'kuzgun_tunek_bekleme' };
const GECIS: Record<string, string> = { K0K1: 'kuzgun_gelis' }; // K1↔K2 geçişinde ara klip yok (tünege uçuş yüzü örtüyordu): çapraz geçiş

const bul = (id: string) => TUM.find((t) => t.id === id) ?? null;
/** sunucu ruh hali → şimdiki kuzgun durumuna uygun yüz klibi (K2: tünekli kompozit) */
export const yuzKlipId = (ruh: string, durum: KDurum) => { const t = RUH_KLIP[ruh] ?? 'sefkat'; return durum === 'K2' && klipVar(t + '_k2') ? t + '_k2' : durum === 'K2' ? BEKLEME.K2 : t; };
export const klipVar = (id: string) => !!bul(id);
export const kuzgunVar = () => klipVar('kuzgun_gelis');

/** klibi çöz; ruh klipleri yoksa bekleme klibine düşer */
export function klipTanim(id: string): Tanim | null { return bul(id) ?? null; }
/** `kimden` durumundan `basla` durumuna götüren ara klipler (sırayla) */
export function yolBul(kimden: KDurum, basla: KDurum): Tanim[] {
  if (kimden === basla) return [];
  const adim = (a: KDurum, b: KDurum) => { const t = bul(GECIS[a + b]); return t ? [t] : []; };
  if (kimden === 'K0' && basla === 'K2') return [...adim('K0', 'K1'), ...adim('K1', 'K2')];
  return adim(kimden, basla);
}
export const kuzgunKlipSec = (isaret: string) => (KUZGUN_KLIP[isaret] && klipVar(KUZGUN_KLIP[isaret]) ? KUZGUN_KLIP[isaret] : null);
