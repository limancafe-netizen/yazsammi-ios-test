// Anlık bildirim (push) — saf mantık (ekran/kütüphane yok; test\bildirim_test.mjs bunu doğrudan sınar).
// Sunucu: bildirim_push.mjs (/c/bildirim/*). Burada: gelen bildirimin "dokununca nereye", izin akışı kararı, ayar biçimi.
import type { Ekran } from '@/bilesenler/canli/baglam';

export const JETON_KALIP = /^Expo(?:nent)?PushToken\[[A-Za-z0-9_-]{8,80}\]$/;
export type BildirimTur = 'cevap' | 'etiket' | 'takip' | 'mesaj' | 'begeni';
export type BildirimAyar = { acik: boolean } & Record<BildirimTur, boolean>;
export const VARSAYILAN_AYAR: BildirimAyar = { acik: true, cevap: true, etiket: true, takip: true, mesaj: true, begeni: true };
// Ayarlar ekranındaki satırlar (sıra: cevap, etiket, takip, mesaj, beğeni)
export const TUR_SATIRLARI: { tur: BildirimTur; baslik: string; alt: string }[] = [
  { tur: 'cevap', baslik: 'Cevaplar', alt: 'Gönderine ya da yorumuna cevap gelince.' },
  { tur: 'etiket', baslik: 'Etiketler', alt: 'Biri seni @ ile etiketleyince.' },
  { tur: 'takip', baslik: 'Yeni takipçi', alt: 'Biri seni takip edince.' },
  { tur: 'mesaj', baslik: 'Mesajlar', alt: 'Mesaj isteği ya da yeni mesaj gelince. İçeriği kilit ekranında görünmez.' },
  { tur: 'begeni', baslik: 'Beğeniler', alt: 'Aynı gönderi için saatte en çok bir bildirim ("3 kişi beğendi").' },
];

export function ayarCevir(d: unknown): BildirimAyar {
  const a = { ...VARSAYILAN_AYAR };
  const x = d && typeof d === 'object' ? (d as Record<string, unknown>) : {};
  for (const k of Object.keys(a) as (keyof BildirimAyar)[]) if (typeof x[k] === 'boolean') a[k] = x[k] as boolean;
  return a;
}

const KIMLIK = /^[A-Za-z0-9_-]{3,80}$/;
const AD = /^[a-zA-Z0-9_çğıöşüÇĞİÖŞÜ]{3,20}$/;
// Bildirimin veri alanı → açılacak ekran (mevcut git() biçimi). Yabancı/bozuk veri null: hiçbir yere gidilmez.
export function dokunmaEkrani(veri: unknown): Ekran | null {
  if (!veri || typeof veri !== 'object') return null;
  const v = veri as Record<string, unknown>;
  switch (v.tur) {
    case 'gonderi':
      return typeof v.id === 'string' && KIMLIK.test(v.id) ? { tur: 'gonderi', id: v.id } : null;
    case 'profil':
      return typeof v.ad === 'string' && AD.test(v.ad) ? { tur: 'profil', ad: v.ad } : null;
    case 'mesajlar':
      return { tur: 'mesajlar', sekme: v.sekme === 'istek' ? 'istek' : 'sohbet' };
    case 'tribunMac':
      return typeof v.id === 'string' && KIMLIK.test(v.id) ? { tur: 'tribunMac', id: v.id } : null;
    case 'akis':
      return { tur: 'akis' };
    default:
      return null;
  }
}

// Cihazdaki kayıt: '' (hiç sorulmadı) · 'sonra' ("Şimdi değil" denildi: kendiliğinden bir daha sorulmaz) · 'tamam' (sistem izni istendi)
export type IzinKaydi = '' | 'sonra' | 'tamam';
export type SistemIzni = 'granted' | 'denied' | 'undetermined';
export type IzinKarari = 'kaydet' | 'ac' | 'yok';
// Girişten sonra: izin verilmişse jeton sessizce kaydedilir; başka hiçbir şey kendiliğinden sorulmaz (kart yalnız "iyi an"da: kartKarari).
export function izinKarari(sistem: SistemIzni, kayit: IzinKaydi, girisli: boolean): IzinKarari {
  if (!girisli) return 'yok';
  if (sistem === 'granted') return 'kaydet';
  return 'yok';
}
// Nazik kart kaydı (yalnız bu cihazda): kaç kez gösterildi, en son ne zaman.
export type KartKaydi = { n: number; son: number };
export const KART_EN_COK = 3;
export const KART_ARA_MS = 3 * 24 * 3600 * 1000; // "Daha sonra" → 3 gün sorulmaz
export function kartKaydiCevir(s: string | null): KartKaydi {
  try {
    const v = JSON.parse(s || '');
    const n = Number(v?.n), son = Number(v?.son);
    return { n: Number.isFinite(n) && n > 0 ? Math.min(Math.floor(n), 99) : 0, son: Number.isFinite(son) && son > 0 ? son : 0 };
  } catch {
    return { n: 0, son: 0 };
  }
}
// Kart gösterilsin mi? Yalnız "iyi an"da; sistem izni hiç sorulmamışsa (verilmiş / kalıcı reddedilmiş ise asla); toplam en çok 3; arada 3 gün; oturumda 1 kez.
export function kartKarari(sistem: SistemIzni, kayit: KartKaydi, simdi: number, oturumdaGosterildi: boolean, iyiAn: boolean): boolean {
  if (!iyiAn || oturumdaGosterildi || sistem !== 'undetermined') return false;
  if (kayit.n >= KART_EN_COK) return false;
  if (kayit.n > 0 && simdi - kayit.son < KART_ARA_MS) return false;
  return true;
}
export const izinKaydiCevir = (s: string | null): IzinKaydi => (s === 'sonra' || s === 'tamam' ? s : '');
// Ana anahtarın görünen durumu: sistem izni yoksa ya da sunucuda kapalıysa kapalı görünür.
export const anaAcikMi = (sistem: SistemIzni, ayar: BildirimAyar) => sistem === 'granted' && ayar.acik;
