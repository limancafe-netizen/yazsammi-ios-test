// iOS (18.11, 1.8.0) ve Android (1.9.0, bayrak) satın alma yöneticisi: mağaza bağlantısı, ürünler, satın alma, bekleyen işlemler, geri yükleme, haklar, pencere durumu.
// MAGAZA_VAR false iken (web; Android bayrak kapalıyken) hiçbir şey yapmaz. Karar mantığı mantik.ts'te (node ile sınanır); burası yalnız yapıştırıcı.
// Akış: satın al → işlem JWS'i POST /c/magaza/apple/islem → sunucu "bitir:true" derse finishTransaction → haklar yenilenir.
// Bekleyen/yarım işlemler uygulama açılışında ve girişten sonra yeniden gönderilir (sunucu aynı işlemi iki kez işlemez).
import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';
import * as C from '@/canli';
import * as IAP from './iap';
import { IslemMotoru, aboneMi, googleGovdesi, hataMesaji, urunListesiCoz, YEDEK_AD, YEDEK_URUNLER, type Haklarim, type IslemGirdi, type Onay, type Teklif, type UrunTanim } from './mantik';

export const MAGAZA_VAR = IAP.MAGAZA_VAR;
export type UrunGorunum = UrunTanim & { baslik: string; aciklama: string; fiyat: string; satilabilir: boolean };
export type Pencere = null | { tur: 'plus' } | { tur: 'teklif'; urun: string; secenekler: string[] };
export type SatinSonuc = { durum: 'tamam' | 'iptal' | 'bekliyor' | 'hata' | 'giris'; mesaj: string };
export type Durum = { hazir: boolean; urunler: UrunGorunum[]; haklar: Haklarim | null; haklarYuklendi: boolean; yuk: string; mesaj: string; pencere: Pencere };

let durum: Durum = { hazir: false, urunler: YEDEK_URUNLER.map((u) => bosGorunum(u)), haklar: null, haklarYuklendi: false, yuk: '', mesaj: '', pencere: null };
const dinleyenler = new Set<() => void>();
function bosGorunum(u: UrunTanim, m?: { baslik: string; aciklama: string; fiyat: string }): UrunGorunum {
  return { ...u, baslik: m?.baslik || YEDEK_AD[u.id] || u.id, aciklama: m?.aciklama || '', fiyat: m?.fiyat || '', satilabilir: !!m?.fiyat };
}
function ayarla(d: Partial<Durum>) {
  durum = { ...durum, ...d };
  dinleyenler.forEach((f) => f());
}
const abone = (f: () => void) => {
  dinleyenler.add(f);
  return () => {
    dinleyenler.delete(f);
  };
};
export const useMagaza = (): Durum => useSyncExternalStore(abone, () => durum, () => durum);

let tost: (m: string) => void = () => {};
export const tostAyarla = (f: (m: string) => void) => {
  tost = f;
};

// ---- işlem motoru: sunucu gönderimi + Apple'a bitirme ----
const motor = new IslemMotoru({
  gonder: async (jwsler, girdiler) => {
    // cayma onayı yalnız kullanıcının az önce başlattığı satın almanın (tek, aynı ürün) isteğine eklenir; geri yükleme ve bekleyen işlemler onay taşımaz
    const onay = jwsler.length === 1 && girdiler?.length === 1 && bekleyenSatin?.onay && bekleyenSatin.urun === girdiler[0].urun ? bekleyenSatin.onay : undefined;
    // iOS: StoreKit 2 JWS → /c/magaza/apple/islem · Android (1.9.0, bayrak androidAyar.ts): Play jetonu → /c/magaza/google/islem
    const r = Platform.OS === 'android' ? await C.magazaIslemGoogle(googleGovdesi(girdiler ?? [], onay)) : await C.magazaIslem(jwsler, onay);
    if (!r.ok) return { ok: false, durum: r.durum, hata: r.hata };
    return { ok: true, sonuclar: Array.isArray(r.veri?.sonuclar) ? r.veri.sonuclar : [] };
  },
  bitir: (nesne, tuketilebilir) => IAP.bitir(nesne, tuketilebilir),
}, Platform.OS === 'android' ? 'Google Play' : 'App Store');

export async function haklariTazele() {
  if (!MAGAZA_VAR || !C.oturumVar()) return;
  const r = await C.magazaHaklarim();
  if (r.ok) ayarla({ haklar: r.veri as Haklarim, haklarYuklendi: true });
  else ayarla({ haklarYuklendi: true });
}

// ---- satın almayı bekleyen çağıran (satinAlVeBekle) ----
let bekleyenSatin: { urun: string; coz: (s: SatinSonuc) => void; onay?: Onay } | null = null;
let zamanAsimi: ReturnType<typeof setTimeout> | null = null;
function satinBitir(s: SatinSonuc) {
  if (zamanAsimi) clearTimeout(zamanAsimi);
  zamanAsimi = null;
  const b = bekleyenSatin;
  bekleyenSatin = null;
  ayarla({ yuk: '', mesaj: s.durum === 'iptal' ? '' : s.mesaj });
  b?.coz(s);
}

async function alindi(a: IslemGirdi) {
  if (!C.oturumVar()) return; // giriş yok: işlem Apple'da açık kalır, girişten sonra yeniden gönderilir
  const s = await motor.isle(a);
  if (s.basari) {
    haklariTazele();
    if (bekleyenSatin && bekleyenSatin.urun === a.urun) return satinBitir({ durum: 'tamam', mesaj: s.mesaj || 'Tamam.' });
    if (s.durum === 'tamam' && s.sunucu !== 'zaten') tost(s.mesaj);
  } else if (bekleyenSatin && bekleyenSatin.urun === a.urun) {
    satinBitir({ durum: s.durum === 'bekliyor' ? 'bekliyor' : 'hata', mesaj: s.mesaj });
  }
}

let calisiyor = false;
export async function bekleyenleriGonder() {
  if (!MAGAZA_VAR || calisiyor || !C.oturumVar()) return;
  calisiyor = true;
  try {
    const l = await IAP.mevcutlariGetir();
    if (l.length) {
      const sonuc = await motor.topluIsle(l);
      if (sonuc.some((s) => s.basari)) await haklariTazele();
    } else await haklariTazele();
  } finally {
    calisiyor = false;
  }
}

let basladi = false;
export async function baslat() {
  if (!MAGAZA_VAR || basladi) return;
  basladi = true;
  C.hakYokDinle(hakYokIsle);
  // Dinleyici ÖNCE başlar: açılışta bekleyen işlemler bu dinleyiciye düşer.
  IAP.dinle(
    (a) => { void alindi(a); },
    (kod) => {
      const h = hataMesaji(kod);
      if (bekleyenSatin) satinBitir({ durum: h.sessiz ? 'iptal' : kod === 'pending' || kod === 'deferred-payment' ? 'bekliyor' : 'hata', mesaj: h.mesaj });
    },
  );
  C.oturumDinle(() => { if (C.oturumVar()) { void bekleyenleriGonder(); } else ayarla({ haklar: null, haklarYuklendi: false }); });
  // ürün kimlikleri sunucudan (fiyat YOK), ad/açıklama/fiyat mağazadan
  let tanim = YEDEK_URUNLER;
  const u = await C.magazaUrunler();
  if (u.ok) tanim = urunListesiCoz(u.veri);
  const bagli = await IAP.baglan();
  const m = bagli ? await IAP.urunleriSorgula(tanim.filter((x) => aboneMi(x.id)).map((x) => x.id), tanim.filter((x) => !aboneMi(x.id)).map((x) => x.id)) : [];
  ayarla({ hazir: bagli, urunler: tanim.map((x) => bosGorunum(x, m.find((y) => y.id === x.id))) });
  if (bagli) await bekleyenleriGonder();
}

// ---- satın alma ----
export async function satinAlVeBekle(id: string, onay?: Onay): Promise<SatinSonuc> {
  if (!MAGAZA_VAR) return { durum: 'hata', mesaj: 'Satın alma bu cihazda açık değil.' };
  if (!onay) return { durum: 'hata', mesaj: 'Önce onay kutusunu işaretle.' }; // cayma hakkı onayı olmadan satın alma başlamaz (Şartlar 2.3 md 9.6)
  if (!C.oturumVar()) return { durum: 'giris', mesaj: 'Satın almak için önce giriş yap.' };
  if (durum.yuk || bekleyenSatin) return { durum: 'hata', mesaj: 'Bir işlem sürüyor, bitmesini bekle.' };
  const u = durum.urunler.find((x) => x.id === id);
  if (!u || !u.satilabilir) return { durum: 'hata', mesaj: 'Bu ürün şu an mağazadan alınamıyor.' };
  ayarla({ yuk: id, mesaj: '' });
  const sonuc = new Promise<SatinSonuc>((coz) => { bekleyenSatin = { urun: id, coz, onay }; });
  const r = await IAP.satinAlBaslat(id, aboneMi(id));
  if (!r.ok) {
    const h = hataMesaji(r.kod ?? 'hata');
    satinBitir({ durum: h.sessiz ? 'iptal' : r.kod === 'pending' || r.kod === 'deferred-payment' ? 'bekliyor' : 'hata', mesaj: h.mesaj });
  } else {
    // Sonuç dinleyiciden gelir. Ask-to-buy gibi uzayan durumda ekran kilitli kalmasın: 2 dk sonra "onay bekliyor" denir; işlem yine de gelince işlenir.
    zamanAsimi = setTimeout(() => satinBitir({ durum: 'bekliyor', mesaj: 'Satın alma onay bekliyor. Onaylanınca hakkın eklenecek.' }), 120000);
  }
  return sonuc;
}

export async function geriYukle(): Promise<{ mesaj: string; basari: boolean }> {
  if (!MAGAZA_VAR) return { mesaj: '', basari: false };
  if (!C.oturumVar()) return { mesaj: 'Geri yüklemek için önce giriş yap.', basari: false };
  if (durum.yuk) return { mesaj: 'Bir işlem sürüyor, bitmesini bekle.', basari: false };
  ayarla({ yuk: 'geri', mesaj: '' });
  try {
    const l = await IAP.geriYukle();
    if (!l.length) {
      await haklariTazele();
      const m = 'Geri yüklenecek bir satın alma bulunamadı.';
      ayarla({ mesaj: m });
      return { mesaj: m, basari: false };
    }
    const s = await motor.topluIsle(l);
    await haklariTazele();
    const ok = s.some((x) => x.basari);
    const m = ok ? 'Satın alımların geri yüklendi.' : s[0]?.mesaj || 'Geri yüklenemedi. Biraz sonra yeniden dene.';
    ayarla({ mesaj: m });
    return { mesaj: m, basari: ok };
  } finally {
    ayarla({ yuk: '' });
  }
}
export const abonelikleriYonet = () => IAP.abonelikleriYonet();

// ---- pencere (Plus ekranı / tek ürün teklifi) ----
let teklifBekleyen: ((devam: boolean) => void) | null = null;
export function plusAc() {
  if (!MAGAZA_VAR) return;
  ayarla({ pencere: { tur: 'plus' }, mesaj: '' });
  void haklariTazele();
}
export function pencereKapat(devam = false) {
  const b = teklifBekleyen;
  teklifBekleyen = null;
  ayarla({ pencere: null, mesaj: '' });
  b?.(devam);
}
// hak_yok / yoğun: canli.ts istek() bunu çağırır. true dönerse istek yeniden denenir.
async function hakYokIsle(t: Teklif): Promise<boolean> {
  if (t.tur === 'yogun') {
    tost(t.mesaj);
    return false;
  }
  teklifBekleyen?.(false);
  return new Promise<boolean>((coz) => {
    teklifBekleyen = coz;
    ayarla({ pencere: { tur: 'teklif', urun: t.urun, secenekler: t.secenekler }, mesaj: '' });
    void haklariTazele();
  });
}
