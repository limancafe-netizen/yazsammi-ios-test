// 1.9.0: mağaza bağlantısı TEK ANAHTARDAN. Karar mantığı uygulamaBaglantiMantik.ts'te (test: test/baglanti_test.mjs).
// IOS_YAYINDA: iOS 1.8.0 App Store'da YAYINDA (Onur 22.11) → true. PLAY_YAYINDA: Android herkese açık Play sayfası yok → false (adres: site).
// Play sayfası açılınca yalnız PLAY_YAYINDA = true yapılır; adres, "puan ver" satırı ve diğer her yer buradan akar.
import { Platform } from 'react-native';
import { APPSTORE, SITE } from '@/analiz';
import { cihazAl } from '@/cihaz';
import { hedefBul, magazaAcik, puanSatiriGorunur as puanGorunurMu, uygulamaAdresi as adresBul, type Hedef } from './uygulamaBaglantiMantik';

export const IOS_YAYINDA = true;
export const PLAY_YAYINDA = false;
export const PLAY = 'https://play.google.com/store/apps/details?id=com.yazsammi.app';
const AYAR = { appstore: APPSTORE, play: PLAY, site: SITE, iosYayinda: IOS_YAYINDA, playYayinda: PLAY_YAYINDA };

const bu = (): Hedef => hedefBul(Platform.OS, cihazAl(Platform.OS));
/** Bu cihaz için uygulamanın adresi (hedef verilirse o platform için). */
export const uygulamaAdresi = (hedef?: Hedef) => adresBul(hedef ?? bu(), AYAR);
export const magazaBuCihazdaAcik = () => magazaAcik(bu(), AYAR);
export const puanSatiriGorunur = () => puanGorunurMu(Platform.OS, AYAR);
