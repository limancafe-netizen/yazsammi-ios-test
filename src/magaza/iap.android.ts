// Android satın alma bağdaştırıcısı (1.9.0; expo-iap 6.2.0, Google Play Billing). Yalnız Android paketine girer (Metro .android.ts).
// Bayrak: androidAyar.ts ANDROID_SATIN_ALMA (kapalıyken MAGAZA_VAR false: yönetici hiçbir şey çağırmaz, eski Kahin yolu çalışır).
// Ürün kimlikleri iOS ile AYNI (Play'de 6 ürün: plus_aylik/plus_yillik abonelik temel planları, 4 tek ürün). Fiyat/ad Play'den (displayPrice).
// İşlem imzası: purchase.purchaseToken (sunucu Google Play Developer API ile doğrular). Sunucu "bitir:true" demeden tüketilmez/onaylanmaz.
import { Linking } from 'react-native';
import * as IAP from 'expo-iap';
import { ANDROID_SATIN_ALMA } from './androidAyar';

export const MAGAZA_VAR = ANDROID_SATIN_ALMA;
export type MagazaUrun = { id: string; baslik: string; aciklama: string; fiyat: string };
export type Alinan = { anahtar: string; jws: string; urun: string; nesne: unknown };

// Bekleyen (onaylanmamış) ödeme purchaseState 'pending' gelir: hak verilmez, ödeme onaylanınca yeniden gelir.
const cevir = (p: any): Alinan | null => {
  const token = typeof p?.purchaseToken === 'string' ? p.purchaseToken : '';
  const urun = String(p?.productId ?? '');
  if (!token || !urun || p?.purchaseState === 'pending') return null;
  return { anahtar: token, jws: token, urun, nesne: p }; // anahtar: Play satın alma jetonu (her satın alma için tek)
};
const hataKodu = (e: any) => String(e?.code ?? e?.message ?? 'hata');

let bagli = false;
const teklifJetonu = new Map<string, string>(); // abonelik kimliği → Play teklif jetonu (temel plan)
export async function baglan(): Promise<boolean> {
  if (bagli) return true;
  try {
    bagli = !!(await IAP.initConnection());
  } catch {
    bagli = false;
  }
  return bagli;
}
export async function urunleriSorgula(abonelikler: string[], tuketilebilirler: string[]): Promise<MagazaUrun[]> {
  const cikti: MagazaUrun[] = [];
  const al = async (skus: string[], type: 'subs' | 'in-app') => {
    if (!skus.length) return;
    try {
      const l = (await IAP.fetchProducts({ skus, type })) as any[] | null;
      for (const p of l ?? []) {
        if (type === 'subs') {
          const t: any[] = Array.isArray(p.subscriptionOffers) ? p.subscriptionOffers.filter((o: any) => typeof o?.offerTokenAndroid === 'string' && o.offerTokenAndroid) : [];
          const secili = t.find((o) => !o.id) ?? t[0]; // önce temel plan (teklif kimliği yok), yoksa ilk teklif
          if (secili) teklifJetonu.set(String(p.id), secili.offerTokenAndroid);
        }
        cikti.push({ id: String(p.id), baslik: String(p.displayName ?? p.title ?? ''), aciklama: String(p.description ?? ''), fiyat: String(p.displayPrice ?? '') });
      }
    } catch {
      /* bu tür alınamadı: o ürünler "şu an alınamıyor" görünür */
    }
  };
  await al(abonelikler, 'subs');
  await al(tuketilebilirler, 'in-app');
  return cikti;
}
// Sonuç purchaseUpdatedListener'dan gelir.
export async function satinAlBaslat(id: string, abonelik: boolean): Promise<{ ok: boolean; kod?: string }> {
  try {
    if (abonelik) {
      const offerToken = teklifJetonu.get(id);
      if (!offerToken) return { ok: false, kod: 'teklif-yok' };
      await IAP.requestPurchase({ request: { google: { skus: [id], subscriptionOffers: [{ sku: id, offerToken }] } }, type: 'subs' });
    } else await IAP.requestPurchase({ request: { google: { skus: [id] } }, type: 'in-app' });
    return { ok: true };
  } catch (e: any) {
    return { ok: false, kod: hataKodu(e) };
  }
}
export function dinle(alindi: (a: Alinan) => void, hata: (kod: string, mesaj: string) => void): () => void {
  const a = IAP.purchaseUpdatedListener((p: any) => { const x = cevir(p); if (x) alindi(x); });
  const b = IAP.purchaseErrorListener((e: any) => hata(hataKodu(e), String(e?.message ?? '')));
  return () => { a.remove(); b.remove(); };
}
// Tüketilmemiş / onaylanmamış / etkin abonelik işlemleri: açılışta ve girişten sonra yeniden gönderilir (sunucu aynı jetonu iki kez işlemez).
export async function mevcutlariGetir(): Promise<Alinan[]> {
  try {
    return ((await IAP.getAvailablePurchases()) as any[]).map(cevir).filter((x): x is Alinan => !!x);
  } catch {
    return [];
  }
}
// "Satın alımlarımı geri yükle": Play'in eldeki listesi (Android'de ayrı eşitleme adımı yok).
export async function geriYukle(): Promise<Alinan[]> {
  return mevcutlariGetir();
}
// Sunucu doğruladıktan sonra: tüketilebilir → tüket (tekrar alınabilir), abonelik → onayla (3 gün içinde onaylanmazsa Play iade eder).
export async function bitir(nesne: unknown, tuketilebilir: boolean): Promise<void> {
  await IAP.finishTransaction({ purchase: nesne as any, isConsumable: tuketilebilir });
}
export async function abonelikleriYonet(): Promise<void> {
  await Linking.openURL('https://play.google.com/store/account/subscriptions').catch(() => {});
}
