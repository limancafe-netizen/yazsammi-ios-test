// KAHİN satın alma — Android (Google Play Faturalandırma, expo-iap 6.x). Ürünler TÜKETİLEBİLİR: kahin_okuma_1, kahin_okuma_5.
// Akış: satinAl → Play ödeme sayfası → purchaseUpdatedListener (token) → SUNUCU doğrular ve hak yazar (/c/kahin/satin) → bitir() ile Play'e "tüketildi" denir.
// Sunucu doğrulamadan önce tüketilmez; doğrulama yapılamazsa Play 3 gün içinde iade eder, uygulama bekleyenleri açılışta tekrar dener (bekleyenleriGetir).
import { Platform } from 'react-native';
import * as IAP from 'expo-iap';

export const ODEME_VAR = Platform.OS === 'android' || Platform.OS === 'ios'; // iOS'ta satın alma bu dosyadan değil src/magaza/'dan yürür; bayrak yalnız arayüzü açar
export type UrunBilgi = { id: string; baslik: string; fiyat: string };
export type SatinSonuc = { urun: string; token: string; bitir: () => Promise<void> };

let hazir = false;
export async function odemeHazirla(): Promise<{ ok: boolean; neden?: string }> {
  if (!ODEME_VAR) return { ok: false, neden: 'platform' };
  if (hazir) return { ok: true };
  try {
    const bagli = await IAP.initConnection();
    hazir = !!bagli;
    return bagli ? { ok: true } : { ok: false, neden: 'play_yok' };
  } catch (e: any) {
    return { ok: false, neden: String(e?.code || e?.message || 'play_yok') };
  }
}
export async function urunleriGetir(ids: string[]): Promise<UrunBilgi[]> {
  try {
    const l = (await IAP.fetchProducts({ skus: ids, type: 'in-app' })) as any[] | null;
    return (l ?? []).map((p) => ({ id: String(p.id), baslik: String(p.title ?? p.id), fiyat: String(p.displayPrice ?? '') }));
  } catch {
    return [];
  }
}
export async function satinAl(id: string): Promise<{ ok: boolean; neden?: string }> {
  try {
    await IAP.requestPurchase({ request: { google: { skus: [id] } }, type: 'in-app' });
    return { ok: true }; // sonuç purchaseUpdatedListener'dan gelir
  } catch (e: any) {
    return { ok: false, neden: String(e?.code || e?.message || 'hata') };
  }
}
const sonucYap = (p: any): SatinSonuc | null => {
  const token = typeof p?.purchaseToken === 'string' ? p.purchaseToken : '';
  const urun = String(p?.productId ?? p?.id ?? '');
  if (!token || !urun) return null;
  return { urun, token, bitir: async () => { await IAP.finishTransaction({ purchase: p, isConsumable: true }); } };
};
export function satinDinle(tamam: (s: SatinSonuc) => void, hata: (kod: string, mesaj: string) => void): () => void {
  const a = IAP.purchaseUpdatedListener((p: any) => { const s = sonucYap(p); if (s) tamam(s); });
  const b = IAP.purchaseErrorListener((e: any) => hata(String(e?.code ?? 'hata'), String(e?.message ?? '')));
  return () => { a.remove(); b.remove(); };
}
// Daha önce ödenmiş ama hak yazılmamış (uygulama kapandı, ağ koptu) satın almalar.
export async function bekleyenleriGetir(): Promise<SatinSonuc[]> {
  try {
    const l = (await IAP.getAvailablePurchases()) as any[];
    return (l ?? []).map(sonucYap).filter((x): x is SatinSonuc => !!x);
  } catch {
    return [];
  }
}
