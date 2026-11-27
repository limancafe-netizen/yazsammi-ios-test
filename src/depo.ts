// Cihaz hafızası (web): tarayıcı hafızası. Uygulamada depo.native.ts kullanılır.
export function depoOku(anahtar: string): string | null {
  try {
    return localStorage.getItem(anahtar);
  } catch {
    return null;
  }
}

export function depoYaz(anahtar: string, deger: string) {
  try {
    localStorage.setItem(anahtar, deger);
  } catch {}
}
