// Sign in with Apple (YALNIZ iOS; App Store 4.8). Android ve sitedeki karşılığı appleGiris.ts (boş): Metro .ios dosyasını yalnız iOS paketine koyar.
// Ad ve e-posta İSTENMEZ (requestedScopes boş): sunucu yalnız Apple "sub" değerinin özetini hesap kimliği yapar (sunucu/apple_giris.mjs).
import * as AppleAuthentication from 'expo-apple-authentication';

export const APPLE_YEREL = true;
export type AppleSonuc = { kimlik: string; kod?: string } | { iptal: true } | { hata: string };

// iOS 13+ ve cihazda Apple Kimliği açıkken true.
export async function appleKullanilabilir(): Promise<boolean> {
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function appleYerelGiris(): Promise<AppleSonuc> {
  try {
    // E-posta yalnız eski üyeyi tanımak için istenir (Onur 18.11): sunucu doğrulanmış e-postayı e-postayla açılmış eski hesapla eşleştirir, saklamaz.
    const r = await AppleAuthentication.signInAsync({ requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL] });
    if (!r.identityToken) return { hata: 'Apple girişi olmadı. Tekrar dene.' };
    return { kimlik: r.identityToken, ...(r.authorizationCode ? { kod: r.authorizationCode } : {}) };
  } catch (e) {
    if ((e as { code?: string })?.code === 'ERR_REQUEST_CANCELED') return { iptal: true };
    return { hata: 'Apple girişi olmadı. Tekrar dene.' };
  }
}

// Hesap silmede: Apple'dan yeni, tek kullanımlık yetki kodu alınır; sunucu bununla Apple'daki girişi iptal eder (jeton saklanmaz).
// Kullanıcı vazgeçerse kod gönderilmez, silme yine yapılır.
export async function appleSilmeKodu(): Promise<string | undefined> {
  const r = await appleYerelGiris();
  return 'kod' in r ? r.kod : undefined;
}
