// 1.9.0: "Uygulamaya puan ver" SAF mantığı (node ile sınanır: test/puan_test.mjs). Yalnız SİSTEM kartı (expo-store-review) kullanılır:
// ön soru/süzme yok, ödül yok, kendi kartımız yok. Kayıt cihazda (depo); sunucuya HİÇBİR ŞEY gitmez.
// Sıklık kuralları (plan 2b) yalnız KENDİLİĞİNDEN açılacak istekler içindir: ilk açılıştan ≥7 gün, en çok 3 kez, en az 120 gün ara; tur/hata/giriş sırasında asla.
// Ayarlar'daki satıra kullanıcı kendisi dokunur: kural beklemez, yalnız sayılır.
export const GUN_MS = 86400000;
export const ILK_BEKLEME_GUN = 7;
export const EN_COK = 3;
export const ARA_GUN = 120;

export type PuanKayit = { ilk: number; sayi: number; son: number };
export const BOS_KAYIT: PuanKayit = { ilk: 0, sayi: 0, son: 0 };

/** Depodan okunan ham metni güvenli kayda çevirir; bozuksa boş kayıt. */
export function kayitCoz(ham: unknown): PuanKayit {
  try {
    const k: any = typeof ham === 'string' ? JSON.parse(ham) : ham;
    const n = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) && x >= 0 ? x : 0);
    return k && typeof k === 'object' ? { ilk: n(k.ilk), sayi: Math.floor(n(k.sayi)), son: n(k.son) } : BOS_KAYIT;
  } catch {
    return BOS_KAYIT;
  }
}
/** İlk açılış damgası: yoksa şimdi yazılır. */
export const ilkAcilisYaz = (k: PuanKayit, simdi: number): PuanKayit => (k.ilk > 0 ? k : { ...k, ilk: simdi });
/** Bir kart isteği yapıldı: sayaç ve son zaman. */
export const istekKaydet = (k: PuanKayit, simdi: number): PuanKayit => ({ ...ilkAcilisYaz(k, simdi), sayi: k.sayi + 1, son: simdi });

/** Kendiliğinden hatırlatma uygun mu. engel: tur / hata ekranı / giriş akışı sürüyor. */
export function otomatikUygun(k: PuanKayit, simdi: number, engel = false): boolean {
  if (engel || k.ilk <= 0) return false;
  if (simdi - k.ilk < ILK_BEKLEME_GUN * GUN_MS) return false;
  if (k.sayi >= EN_COK) return false;
  if (k.son > 0 && simdi - k.son < ARA_GUN * GUN_MS) return false;
  return true;
}
