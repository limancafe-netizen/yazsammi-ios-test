// Uygulama içi Google girişi (Android; iOS için aşağıya bak). @react-native-google-signin/google-signin, webClientId = sitenin WEB istemci kimliği:
// dönen kimlik jetonunun "aud" alanı web istemcisi olur, sunucu (topluluk.mjs, GOOGLE_ISTEMCI) değişmeden kabul eder.
// Çalışması için aynı Google Cloud projesinde bir ANDROID OAuth istemcisi gerekir: paket com.yazsammi.app + imza SHA-1
// (EAS yükleme anahtarı ve Play uygulama imzalama anahtarı için ayrı ayrı). Yoksa Google "DEVELOPER_ERROR" (kod 10) döner.
// iOS: aynı projede bir iOS OAuth istemcisi (bundle com.yazsammi.app) gerekir; kimliği derlemede EXPO_PUBLIC_GOOGLE_IOS_ISTEMCI ile verilir
// (app.config.js aynı değişkenden iosUrlScheme'i Info.plist'e ekler). Verilmezse iOS'ta Google düğmesi GİZLENİR, yalnız Apple görünür.
import { Platform } from 'react-native';
import { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } from '@react-native-google-signin/google-signin';
import { GOOGLE_ISTEMCI } from '@/canli';

const IOS_HAM = (process.env.EXPO_PUBLIC_GOOGLE_IOS_ISTEMCI ?? '').trim();
const GOOGLE_IOS_ISTEMCI = /^[\w-]+\.apps\.googleusercontent\.com$/.test(IOS_HAM) ? IOS_HAM : ''; // app.config.js ile aynı denetim
export const GOOGLE_YEREL = Platform.OS !== 'ios' || !!GOOGLE_IOS_ISTEMCI;
export type GoogleSonuc = { idToken: string } | { iptal: true } | { hata: string };

let kuruldu = false;
function kur() {
  if (kuruldu) return;
  GoogleSignin.configure({ webClientId: GOOGLE_ISTEMCI, offlineAccess: false, ...(Platform.OS === 'ios' && GOOGLE_IOS_ISTEMCI ? { iosClientId: GOOGLE_IOS_ISTEMCI } : {}) });
  kuruldu = true;
}

export async function googleYerelGiris(): Promise<GoogleSonuc> {
  try {
    kur();
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    // Her girişte hesap seçici açılsın (önceki hesap sessizce seçilmesin).
    try {
      await GoogleSignin.signOut();
    } catch {}
    const r = await GoogleSignin.signIn();
    if (!isSuccessResponse(r)) return { iptal: true };
    const idToken = r.data.idToken;
    if (!idToken) return { hata: 'Google girişi olmadı. Tekrar dene.' };
    return { idToken };
  } catch (e) {
    if (isErrorWithCode(e)) {
      if (e.code === statusCodes.SIGN_IN_CANCELLED) return { iptal: true };
      if (e.code === statusCodes.IN_PROGRESS) return { iptal: true };
      if (e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) return { hata: 'Bu cihazda Google Play hizmetleri yok.' };
      if (String(e.code) === '10' || /DEVELOPER_ERROR/i.test(String(e.message))) return { hata: 'Google girişi bu sürümde henüz açılmadı. Az sonra tekrar dene.' };
    }
    return { hata: 'Google girişi olmadı. Tekrar dene.' };
  }
}

export async function googleYerelCikis() {
  try {
    kur();
    await GoogleSignin.signOut();
  } catch {}
}
