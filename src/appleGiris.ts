// Sign in with Apple yalnız iOS'ta (appleGiris.ios.ts). Android ve sitede boş: Apple düğmesi çizilmez, Apple kodu pakete girmez.
export const APPLE_YEREL = false;
export type AppleSonuc = { kimlik: string; kod?: string } | { iptal: true } | { hata: string };
export async function appleKullanilabilir(): Promise<boolean> {
  return false;
}
export async function appleYerelGiris(): Promise<AppleSonuc> {
  return { hata: 'Apple girişi burada yok.' };
}
export async function appleSilmeKodu(): Promise<string | undefined> {
  return undefined;
}
