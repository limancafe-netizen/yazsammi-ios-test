// Astroloji ve Tarot Kart Analizi, site (web) sürümü (04.11). Telefon uygulamasında SiteBolumu.native.tsx (WebView) kullanılır.
// Bilgisayarda (geniş düzen) Canlı'nın ortasında sitenin sayfası iframe ile (?gomulu=1: sayfanın "ana sayfaya dön" oku gizlenir);
// telefon boyu tarayıcıda bu bileşen çizilmez, canli.tsx sitenin kendi sayfasına (/astroloji/, /tarot/) gider.
// Web'de satış yok: sayfalar kilitli yerde "Uygulamada aç" gösterir (site/*/js/kopru.js uygulama dışında kapalıdır).
export type SiteBolumAd = 'astroloji' | 'tarot' | 'ekonomi' | 'oyun';

export function SiteBolumu({ bolum, yol = '' }: { bolum: SiteBolumAd; yol?: string }) {
  const baslik = bolum === 'tarot' ? 'Tarot Kart Analizi' : 'Astroloji';
  return <iframe src={`/${bolum}/?gomulu=1${yol}`} title={baslik} style={{ flex: 1, minHeight: 0, width: '100%', border: 'none', borderRadius: 28, display: 'block', background: '#04050c' }} />;
}
