// Satın alma bağdaştırıcısı — WEB (satın alma YOK, değişmez): hiçbir şey yapmaz. Gerçek kod: iap.ios.ts (StoreKit 2), iap.android.ts (Google Play; bayrak androidAyar.ts).
// Android'in ESKİ Kahin yolu src/kahin/odeme.native.ts'te kalır (bayrak kapalıyken); bu dosya ona dokunmaz.
export const MAGAZA_VAR = false;
export type MagazaUrun = { id: string; baslik: string; aciklama: string; fiyat: string };
export type Alinan = { anahtar: string; jws: string; urun: string; nesne: unknown };
export async function baglan(): Promise<boolean> { return false; }
export async function urunleriSorgula(_abonelikler: string[], _tuketilebilirler: string[]): Promise<MagazaUrun[]> { return []; }
export async function satinAlBaslat(_id: string, _abonelik: boolean): Promise<{ ok: boolean; kod?: string }> { return { ok: false, kod: 'platform' }; }
export function dinle(_alindi: (a: Alinan) => void, _hata: (kod: string, mesaj: string) => void): () => void { return () => {}; }
export async function mevcutlariGetir(): Promise<Alinan[]> { return []; }
export async function geriYukle(): Promise<Alinan[]> { return []; }
export async function bitir(_nesne: unknown, _tuketilebilir: boolean): Promise<void> {}
export async function abonelikleriYonet(): Promise<void> {}
