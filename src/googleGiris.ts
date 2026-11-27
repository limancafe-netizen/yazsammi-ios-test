// Uygulama içi (yerel) Google girişi. Sitede kullanılmaz: site Google Identity Services düğmesini çizer (Pencereler.tsx).
// Uygulamadaki karşılığı googleGiris.native.ts.
export const GOOGLE_YEREL = false;
export type GoogleSonuc = { idToken: string } | { iptal: true } | { hata: string };
export async function googleYerelGiris(): Promise<GoogleSonuc> {
  return { hata: 'Google girişi burada yok.' };
}
export async function googleYerelCikis() {}
