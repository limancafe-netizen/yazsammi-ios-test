// 1.9.0: figürlere EK HAREKET yuvası — SAF mantık (RN'ye bağlı değil → node ile sınanır: test/figur_klip_test.mjs).
// Klip yoksa (dosya haritasında kayıt yok) her zaman null döner → arayüz bugünkü durağan posteri aynen gösterir.
// Klip dosyaları: assets/figur/<figür>/<klip>.webp (animasyonlu WebP); haritaya figurKlipDosya.ts'te eklenir. Klip listesi TEK TABLO: KLIPLER.
// Kurallar (klip SEÇİMİNDE): Fener'in AĞZINA dokunulmaz (ağız hareketli klip Fener'de seçilmez); Bukalemun GÖZ KIRPMAZ (göz kırpan klip Bukalemun'da seçilmez).
export type Figur = 'fener' | 'bukalemun';
export const KLIP_ADLARI = ['bekle', 'konus', 'sevinc', 'saskin', 'selam', 'merakli', 'dusunceli', 'uzgun', 'goz_kirp', 'dokun_tepki', 'surukle', 'kutlama', 'veda', 'guc_renk', 'guc_renk_3', 'guc_isik', 'isik_yak'] as const;
export type Klip = (typeof KLIP_ADLARI)[number];
// agiz: ağız hareketi var · goz: göz kırpma/göz hareketi var · sure: varsayılan oynatma süresi (ms; stüdyo manifestiyle güncellenir)
export type KlipBilgi = { agiz: boolean; goz: boolean; sure: number };
export const KLIPLER: Record<Klip, KlipBilgi> = {
  bekle: { agiz: false, goz: false, sure: 3000 },
  konus: { agiz: true, goz: false, sure: 3000 },
  sevinc: { agiz: false, goz: false, sure: 2500 },
  saskin: { agiz: false, goz: false, sure: 2500 },
  selam: { agiz: false, goz: false, sure: 2500 },
  merakli: { agiz: false, goz: false, sure: 2500 },
  dusunceli: { agiz: false, goz: false, sure: 2500 },
  uzgun: { agiz: false, goz: false, sure: 2500 },
  goz_kirp: { agiz: false, goz: true, sure: 1200 },
  dokun_tepki: { agiz: false, goz: false, sure: 2500 },
  surukle: { agiz: false, goz: false, sure: 2500 },
  kutlama: { agiz: false, goz: false, sure: 3000 },
  veda: { agiz: false, goz: false, sure: 3000 },
  guc_renk: { agiz: false, goz: false, sure: 2500 },
  guc_renk_3: { agiz: false, goz: false, sure: 2500 },
  guc_isik: { agiz: false, goz: false, sure: 2500 },
  isik_yak: { agiz: false, goz: false, sure: 2500 },
};
export type KlipDosyalari = Record<Figur, Partial<Record<Klip, number>>>;

/** Figür kuralları bu klibi yasaklıyor mu. */
export function klipYasak(figur: Figur, klip: Klip): boolean {
  const b = KLIPLER[klip];
  if (!b) return true;
  if (figur === 'fener' && b.agiz) return true;
  if (figur === 'bukalemun' && b.goz) return true;
  return false;
}
/** Tercih sırasındaki ilk uygun klip (dosyası var, kural yasaklamıyor); yoksa null → durağan poster. */
export function klipSec(figur: Figur, tercih: readonly Klip[], dosyalar: KlipDosyalari): Klip | null {
  for (const k of tercih) if (dosyalar[figur]?.[k] != null && !klipYasak(figur, k)) return k;
  return null;
}
export const klipSure = (klip: Klip) => KLIPLER[klip]?.sure ?? 3000;
