// KULLANILMIYOR (04.11.2026): eski KAHİN astroloji/tarot ekranı. Astroloji ve Tarot Kart Analizi artık sitenin /astroloji/ ve /tarot/ sayfaları,
// uygulamada WebView ile (bilesenler/canli/SiteBolumu.native.tsx); hiçbir ekran bu dosyayı içe aktarmıyor. Kod başvuru için duruyor, silinmedi.
// KAHİN klipleri — ONAYLI 4 klip (plan/80_YENI_BOLUMLER/kahin/ilk_kanit/klipler_temiz; diğerleri elendi, KULLANMA). 1280x720, 7-8 sn, sessiz kullanılır.
export const KLIP = {
  bekleme: require('../../assets/kahin/klip/bekleme.mp4'),
  sicak: require('../../assets/kahin/klip/konusma_sicak.mp4'),
  soguk: require('../../assets/kahin/klip/konusma_soguk.mp4'),
  sasirma: require('../../assets/kahin/klip/sasirma.mp4'),
  // 29.10 Onur'un onayladığı 4 yeni klip (klipler_2910/onayli; Veo sesi çıkarıldı; goz_takip: klipler_2910/goz/*.goz.json)
  gulme: require('../../assets/kahin/klip/gulme.mp4'),
  kahkaha: require('../../assets/kahin/klip/kahkaha.mp4'),
  ofke: require('../../assets/kahin/klip/ofke.mp4'),
  buyu: require('../../assets/kahin/klip/buyu.mp4'),
} as const;
export type KlipAd = keyof typeof KLIP;
/** sunucudaki parça duygusu → klip (neşe→gülme, büyük sevinç/şaka→kahkaha, sert uyarı/kötü kart→öfke, şaşırma, soğuk/ciddi, sıcak) */
export const DUYGU_KLIP: Record<string, KlipAd> = { sicak: 'sicak', soguk: 'soguk', sasirma: 'sasirma', nese: 'gulme', kahkaha: 'kahkaha', ofke: 'ofke' };
export const duyguKlip = (d: string | undefined): KlipAd => DUYGU_KLIP[d ?? ''] ?? 'sicak';
