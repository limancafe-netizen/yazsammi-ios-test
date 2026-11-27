// Web: yazı tipleri 560 KB'lık TTF olarak JS'ten SONRA isteniyor ve uygulamanın çizilmesini bekletiyordu (06.11 hız denetimi: LCP 5-8 sn).
// Artık sunucu her sayfaya kod/site/yazi/yazi.css (aynı adlı @font-face, woff2 ~180 KB) gömer ve önyükler; burada yüklenecek bir şey yok, çizim beklemez.
// Aynı adlar (BricolageGrotesque_400Regular …) olduğu için stillerde değişiklik gerekmez.
export const YAZI_TIPLERI = {};
export const YAZI_BEKLE = false;
