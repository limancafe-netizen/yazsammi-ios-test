// Kasma ölçer (Onur 18.11): elimizde telefon olmadan uygulamanın akıcılığını görmek için.
// Uygulama öndeyken her 100 ms'de bir zamanlayıcı çalışır; gecikirse uygulama o an takılmış demektir (250 ms üstü = takılma).
// 2 dakikada bir tek adsız sayaç gider: 'akici' | 'kasma_hafif' | 'kasma_agir' (analiz.ts olay(): yalnız ölçüm izni verenlerde, kim olduğu gitmez).
// Oturum başına en çok 15 gönderim. Sitede çalışmaz.
import { AppState, Platform } from 'react-native';
import { olay } from '@/analiz';

const ADIM = 100;
const PENCERE = 120000;
let kurulu = false;

export function kasmaOlcerKur() {
  if (kurulu || Platform.OS === 'web') return;
  kurulu = true;
  let son = Date.now(), bas = son, enUzun = 0, takilma = 0, gonderilen = 0;
  setInterval(() => {
    const t = Date.now();
    const gecikme = t - son - ADIM;
    son = t;
    // Arka plan / ekran kilidi sayılmaz: pencere baştan başlar.
    if (AppState.currentState !== 'active' || gecikme > 5000) { bas = t; enUzun = 0; takilma = 0; return; }
    if (gecikme > 250) { takilma++; if (gecikme > enUzun) enUzun = gecikme; }
    if (t - bas < PENCERE) return;
    if (gonderilen < 15) { gonderilen++; olay(enUzun > 700 || takilma >= 6 ? 'kasma_agir' : takilma > 0 ? 'kasma_hafif' : 'akici'); }
    bas = t; enUzun = 0; takilma = 0;
  }, ADIM);
}
