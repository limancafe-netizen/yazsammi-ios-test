// Yazsam mı? tasarım sistemi: renkler, yazılar, aralıklar. Tüm ekranlar buradan beslenir.
export type His = 'merak' | 'baski' | 'sicaklik' | 'notr';

export const renkler = {
  gunduz: {
    sis: '#ECE8F3', // zemin
    yuzey: '#F8F6FB',
    murekkep: '#1D1830', // metin
    soluk: '#6B6480',
    merak: '#3B5BDB',
    sicaklik: '#D2477A',
    baski: '#B8702A',
    kalem: '#D7263D',
    cizgi: 'rgba(29,24,48,0.14)',
  },
  gece: {
    sis: '#15111F',
    yuzey: '#1E1930',
    murekkep: '#EDE9F6',
    soluk: '#A69FBC',
    merak: '#7C93F0',
    sicaklik: '#EE7CA5',
    baski: '#E0A15E',
    kalem: '#FF5C6C',
    cizgi: 'rgba(237,233,246,0.16)',
  },
} as const;

export type Renkler = { [K in keyof (typeof renkler)['gunduz']]: string };

// Uygulama (Android/iOS) paleti — Onur 05.10: "renkler ve tonlar sitedekinden farklı, deneyim aynı olmasın".
// Site mor-lavanta; uygulama koyu petrol + krem, mercan/nane/limon vurgular. Anahtarlar aynı: bütün ekranlar kendiliğinden geçer.
export const uygulamaRenkleri: { gunduz: Renkler; gece: Renkler } = {
  gunduz: {
    sis: '#FFF6EC',
    yuzey: '#FFFFFF',
    murekkep: '#14232B',
    soluk: '#5E7178',
    merak: '#1F7AE0',
    sicaklik: '#E2456E',
    baski: '#D9770F',
    kalem: '#E0443A',
    cizgi: 'rgba(20,35,43,0.12)',
  },
  gece: {
    sis: '#0B1A22',
    yuzey: '#13262F',
    murekkep: '#FFF4E6',
    soluk: '#9FB3B8',
    merak: '#5BB4FF',
    sicaklik: '#FF6F91',
    baski: '#FFA63D',
    kalem: '#FF5A4E',
    cizgi: 'rgba(255,244,230,0.14)',
  },
};
// Uygulamaya özel vurgu renkleri (sekmeler, kartlar).
export const vurgu = { mercan: '#FF5A4E', nane: '#2EC4A0', limon: '#FFD23F', mor: '#7B5CFF', gok: '#5BB4FF', petrol: '#0B1A22', krem: '#FFF4E6' } as const;

export const yazi = {
  normal: 'BricolageGrotesque_400Regular',
  orta: 'BricolageGrotesque_500Medium',
  kalin: 'BricolageGrotesque_700Bold',
  kalem: 'Caveat_700Bold', // el yazısı: kırmızı kalem notları ve marka yazısındaki "mı?"
  marka: 'Unbounded_800ExtraBold',
  dar: 'BarlowCondensed_700Bold', // Tribün portalı: başlık, skor ve rakamlar için dar, kalın yazı
  darKalin: 'BarlowCondensed_800ExtraBold',
} as const;

export const aralik = { xs: 6, s: 12, m: 18, l: 28, xl: 40 } as const;
export const kose = { kart: 22, dugme: 18 } as const;

export function hisRengi(r: Renkler, his: His): string {
  if (his === 'notr') return r.cizgi;
  return r[his];
}

export const hisAdi: Record<Exclude<His, 'notr'>, string> = {
  merak: 'Merak',
  sicaklik: 'Sıcaklık',
  baski: 'Baskı',
};
