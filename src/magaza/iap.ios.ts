// iOS satın alma bağdaştırıcısı (expo-iap 6.2.0, StoreKit 2). Yalnız iOS paketine girer (Metro .ios.ts).
// Fiyat/ad/açıklama mağazadan (displayPrice, title, description). İşlem imzası: purchase.purchaseToken = JWS (sunucu doğrular).
import { Linking } from 'react-native';
import * as IAP from 'expo-iap';

export const MAGAZA_VAR = true;
export type MagazaUrun = { id: string; baslik: string; aciklama: string; fiyat: string };
export type Alinan = { anahtar: string; jws: string; urun: string; nesne: unknown };

const cevir = (p: any): Alinan | null => {
  const jws = typeof p?.purchaseToken === 'string' ? p.purchaseToken : '';
  const urun = String(p?.productId ?? '');
  const anahtar = String(p?.id ?? p?.transactionId ?? '');
  if (!jws || !urun || !anahtar) return null;
  return { anahtar, jws, urun, nesne: p };
};
const hataKodu = (e: any) => String(e?.code ?? e?.message ?? 'hata');

let bagli = false;
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
      for (const p of l ?? []) cikti.push({ id: String(p.id), baslik: String(p.displayName ?? p.title ?? ''), aciklama: String(p.description ?? ''), fiyat: String(p.displayPrice ?? '') });
    } catch {
      /* bu tür alınamadı: o ürünler "şu an alınamıyor" görünür */
    }
  };
  await al(abonelikler, 'subs');
  await al(tuketilebilirler, 'in-app');
  return cikti;
}
// Sonuç purchaseUpdatedListener'dan gelir. Ask-to-buy: Apple 'pending' döner, onaylanınca dinleyiciye düşer.
export async function satinAlBaslat(id: string, abonelik: boolean): Promise<{ ok: boolean; kod?: string }> {
  try {
    if (abonelik) await IAP.requestPurchase({ request: { apple: { sku: id } }, type: 'subs' });
    else await IAP.requestPurchase({ request: { apple: { sku: id, quantity: 1 } }, type: 'in-app' });
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
// Bitirilmemiş / etkin işlemler (uygulama kapandı, ağ koptu): açılışta ve girişten sonra yeniden gönderilir.
export async function mevcutlariGetir(): Promise<Alinan[]> {
  try {
    return ((await IAP.getAvailablePurchases()) as any[]).map(cevir).filter((x): x is Alinan => !!x);
  } catch {
    return [];
  }
}
// "Satın alımlarımı geri yükle": App Store ile eşitle, sonra listeyi oku.
export async function geriYukle(): Promise<Alinan[]> {
  try {
    await IAP.restorePurchases();
  } catch {
    /* eşitleme başarısız olsa da eldeki liste okunur */
  }
  return mevcutlariGetir();
}
export async function bitir(nesne: unknown, tuketilebilir: boolean): Promise<void> {
  await IAP.finishTransaction({ purchase: nesne as any, isConsumable: tuketilebilir });
}
export async function abonelikleriYonet(): Promise<void> {
  try {
    await IAP.showManageSubscriptionsIOS();
    return;
  } catch {
    /* sistem sayfası açılamadı */
  }
  try {
    await IAP.deepLinkToSubscriptions({});
    return;
  } catch {
    /* son çare */
  }
  await Linking.openURL('https://apps.apple.com/account/subscriptions').catch(() => {});
}
