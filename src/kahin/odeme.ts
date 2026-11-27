// KAHİN satın alma — web sürümü: SATIN ALMA YOK (Onur 29.10: ödeme yalnız mobil uygulamada). Web'de düğme yerine "Uygulamada aç" yazılır.
// Gerçek uygulama (Android) için bkz. odeme.native.ts (expo-iap → Google Play Faturalandırma).
export const ODEME_VAR = false;
export type UrunBilgi = { id: string; baslik: string; fiyat: string };
export type SatinSonuc = { urun: string; token: string; bitir: () => Promise<void> };
export async function odemeHazirla(): Promise<{ ok: boolean; neden?: string }> {
  return { ok: false, neden: 'web' };
}
export async function urunleriGetir(_ids: string[]): Promise<UrunBilgi[]> {
  return [];
}
export async function satinAl(_id: string): Promise<{ ok: boolean; neden?: string }> {
  return { ok: false, neden: 'web' };
}
export function satinDinle(_tamam: (s: SatinSonuc) => void, _hata: (kod: string, mesaj: string) => void): () => void {
  return () => {};
}
export async function bekleyenleriGetir(): Promise<SatinSonuc[]> {
  return [];
}
