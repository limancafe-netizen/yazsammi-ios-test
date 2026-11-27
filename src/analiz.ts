// Ortak sabitler (sunucu adresi, deneme kopyası, bağlantılar) ve ölçüm. 09.10: eski mesaj ölçme / eğlence / yazamıyorum uçları kaldırıldı.
import { Platform } from 'react-native';
import { depoOku, depoYaz } from '@/depo';

// Deneme kopyası (adresinde "-test-" geçen site) ayrı deneme sunucusuna bağlanır; canlı sunucu etkilenmez.
// Uygulama (Android) varsayılan olarak CANLI sunucuya gider. Deneme sunucusuna giden derleme için TEK anahtar:
// derleme anında EXPO_PUBLIC_SUNUCU=deneme (eas.json → "preview" profili bunu koyar; "production" koymaz).
const UYGULAMA_DENEME = Platform.OS !== 'web' && process.env.EXPO_PUBLIC_SUNUCU === 'deneme';
export const DENEME_KOPYASI = UYGULAMA_DENEME || (typeof window !== 'undefined' && typeof window.location !== 'undefined' && typeof window.location.host === 'string' && window.location.host.includes('-test-'));
// 14.11 (Y-1411-7): CANLI SİTEDE (yazsammi.com) API, Cloudflare arkasındaki api.yazsammi.com'dan gider (Bot Fight + hız kuralı + gerçek IP). Uygulama (Android/iOS), deneme kopyası ve yerel eski run.app adresinde kalır;
// uygulama yeni adrese ancak sonraki sürümde ve Cloudflare doğrulaması (okhttp/CFNetwork engellenmiyor) sonrası geçer. Eski run.app adresi kapanmaz.
const WEB_CANLI_API = Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.location !== 'undefined' && /^(www\.)?yazsammi\.com$/.test(String(window.location.hostname));
export const SUNUCU = DENEME_KOPYASI ? (process.env.EXPO_PUBLIC_TEST_SUNUCU || '') : WEB_CANLI_API ? 'https://api.yazsammi.com' : (process.env.EXPO_PUBLIC_CANLI_SUNUCU || '');
export const INSTAGRAM = 'https://www.instagram.com/yazsam.mi/';
export const TIKTOK = 'https://www.tiktok.com/@yazsam.mi';
// iOS uygulaması App Store'da (19.11, sürüm 1.7.3); siteden gösterilen bağlantı. Android/Play henüz herkese açık değil: bağlantı yok.
export const APPSTORE = 'https://apps.apple.com/tr/app/yazsam-m%C4%B1/id6834042264';
export const SITE = 'https://yazsammi.com';
// Oy yüzdeleri en az 30 oyda gösterilir (Onur 06.10): az oyda yüzde yanıltır ("%100" = 1 kişi); altında "İlk oylayanlardan ol".
export const OY_ESIGI = 30;

// Claude'un denemeleri ölçüme karışmasın: adresinde ?k=claude olan tarayıcı kalıcı olarak işaretlenir ve adım saydırmaz.
const DENEYEN = (() => {
  try {
    if (typeof window === 'undefined' || !window.location) return false;
    if (/[?&]k=claude(?![a-z])/.test(window.location.search)) localStorage.setItem('yazsammi.deneyen', '1');
    return localStorage.getItem('yazsammi.deneyen') === '1';
  } catch {
    return false;
  }
})();

// Tekil cihaz ve geri dönüş ölçümü (Onur 06.10): cihazda bir kez üretilen rastgele kimlik + ilk görüldüğü gün (Türkiye saati).
// Ad, numara, adres ya da hesapla hiçbir bağı yok; sunucu yalnız günlük toplam tutar (kaç farklı cihaz, ertesi gün/7. gün dönen).
// 22.10 (KVKK çerez rehberi): yalnız ziyaretçi izin verdiyse ('yazsammi.olcum' = 'evet'; izin bandı ya da /gizlilik/#cerez). İzin yoksa
// kimlik üretilmez, sunucuya gitmez (X-Cihaz boş); "Reddet" eski kimliği de siler.
export const OLCUM_ANAHTARI = 'yazsammi.olcum';
export const olcumTercihi = (): 'evet' | 'hayir' | null => {
  const v = depoOku(OLCUM_ANAHTARI);
  return v === 'evet' || v === 'hayir' ? v : null;
};
const trGun = () => new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 10);
let CIHAZ: { c: string; i: string; p: string } | null = null;
export function cihazBilgi() {
  if (olcumTercihi() !== 'evet') return null;
  if (CIHAZ) return CIHAZ;
  let c = depoOku('yazsammi.cihaz');
  let i = depoOku('yazsammi.ilk_gun');
  if (!c || !/^[a-z0-9]{16,32}$/.test(c)) {
    c = Array.from({ length: 24 }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]).join('');
    depoYaz('yazsammi.cihaz', c);
    i = null;
  }
  if (!i || !/^\d{4}-\d{2}-\d{2}$/.test(i)) {
    i = trGun();
    depoYaz('yazsammi.ilk_gun', i);
  }
  CIHAZ = { c, i, p: Platform.OS === 'web' ? 'site' : 'uygulama' };
  return CIHAZ;
}
export function olcumAyarla(v: 'evet' | 'hayir') {
  depoYaz(OLCUM_ANAHTARI, v);
  if (v === 'hayir') {
    CIHAZ = null;
    depoYaz('yazsammi.cihaz', '');
    depoYaz('yazsammi.ilk_gun', '');
  }
}

// Ölçüm: yalnız adım adı gider (kim, ne yazdı gitmez) + yukarıdaki adsız cihaz bilgisi. Cevabı beklenmez. İzin yoksa hiç gitmez.
export function olay(ad: string) {
  const cihaz = cihazBilgi();
  if (DENEYEN || !cihaz) return;
  fetch(`${SUNUCU}/olay`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ad, ...cihaz }), keepalive: true }).catch(() => {});
}
