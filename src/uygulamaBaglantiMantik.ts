// 1.9.0: mağaza bağlantısı SAF mantığı (React Native'e bağlı değil → node ile sınanır: test/baglanti_test.mjs).
// Tek anahtar kümesi uygulamaBaglanti.ts'te (IOS_YAYINDA, PLAY_YAYINDA); burada yalnız karar fonksiyonları.
export type Hedef = 'ios' | 'android' | 'masaustu' | 'uygulama';
export type BaglantiAyar = { appstore: string; play: string; site: string; iosYayinda: boolean; playYayinda: boolean };

/** Bir platformun mağaza sayfası açık mı (yayında bayrağı). */
export const magazaAcik = (hedef: Hedef, a: Pick<BaglantiAyar, 'iosYayinda' | 'playYayinda'>) => (hedef === 'ios' ? a.iosYayinda : hedef === 'android' ? a.playYayinda : false);

/** Uygulamayı gösteren adres: mağaza yayındaysa mağaza, değilse site. */
export const uygulamaAdresi = (hedef: Hedef, a: BaglantiAyar) => (magazaAcik(hedef, a) ? (hedef === 'ios' ? a.appstore : a.play) : a.site);

/** Native'de hedef platformun kendisi; web'de cihazAl'ın bulduğu tür. */
export const hedefBul = (os: string, webCihaz: Hedef): Hedef => (os === 'ios' ? 'ios' : os === 'android' ? 'android' : webCihaz);

/** "Uygulamaya puan ver" satırı: yalnız native ve o platformun mağazası yayındaysa (Android'de Play kapalıyken gizli). */
export const puanSatiriGorunur = (os: string, a: Pick<BaglantiAyar, 'iosYayinda' | 'playYayinda'>) => (os === 'ios' || os === 'android') && magazaAcik(os, a);
