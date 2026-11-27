// 1.9.0: Android Google Play satın alma — TEK BAYRAK.
// false (bugünkü): Android eski yoldan (src/kahin/odeme.native.ts → /c/kahin/satin) aynen çalışır; yeni mağaza akışı kapalı.
// true: Android da iOS ile aynı akışı kullanır (src/magaza/: Plus, 4 tek ürün, geri yükleme, haklar) ve işlemleri POST /c/magaza/google/islem'e gönderir.
// DİKKAT: true yapmadan önce sunucuda bu uç ve ürün tablosunda google kimlikleri OLMALI (kod/GUNCELLEME_190_sunucu/YAMA_ANDROID_PLAY.md).
// Bugün canlı sunucuda (magaza.mjs) yalnız apple/islem var ve ürünlerin google alanı null → varsayılan false.
export const ANDROID_SATIN_ALMA = false;
export const GOOGLE_ISLEM_YOLU = '/c/magaza/google/islem';
