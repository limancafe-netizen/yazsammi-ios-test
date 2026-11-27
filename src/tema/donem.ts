// Markanın GÜNCEL DÖNEM paleti (Onur 07.10: marka/uygulama rengi dönemlik; her görsel güncel dönemi okur, "mavi/mor" varsayılmaz).
// Veri tek yerde: ./donemler.json (site ve sosyal medya üretimi de onu okur). Dönem, Türkiye saatine göre aydan kendiliğinden seçilir;
// dönem değişince marka avatarı, rozet, vurgu rengi, kapaklar ve kurucu amblemi kendiliğinden değişir.
// Deneme için webde ?donem=mavi (yalnız o sayfa açılışında).
import { Platform } from 'react-native';
import veri from './donemler.json';

export type DonemAd = 'gece' | 'mor' | 'fusya' | 'lavanta' | 'mavi';
export type Donem = {
  ad: DonemAd;
  isim: string;
  aylar: number[];
  simge: { zemin: string; yazi: string; mi: string }; // logonun 3 rengi (kod/site/marka/simge-<ad>.svg)
  vurgu: { gunduz: string; gece: string }; // arayüz vurgusu (sekme çizgisi, + düğmesi, kendi balonun, onaylı rozet)
  kapak: [string, string]; // marka profil kapağı / marka kapıları
  tespit: [string, string, string][]; // marka "tespit" kartlarının dönem degradeleri
};

export const DONEMLER = veri.donemler as unknown as Record<DonemAd, Omit<Donem, 'ad'>>;
export const KURUCU_ALTIN = veri.kurucuAltin as [string, string, string, string];

/** Türkiye saatine (UTC+3) göre verilen anın dönemi. */
export function donemAdi(an: Date = new Date()): DonemAd {
  const ay = new Date(an.getTime() + 3 * 3600000).getUTCMonth() + 1;
  const bul = (Object.keys(DONEMLER) as DonemAd[]).find((k) => DONEMLER[k].aylar.includes(ay));
  return bul ?? 'gece';
}

function zorla(): DonemAd | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  try {
    const d = new URLSearchParams(window.location.search).get('donem');
    return d && d in DONEMLER ? (d as DonemAd) : null;
  } catch {
    return null;
  }
}

export function donem(an?: Date): Donem {
  const ad = (!an && zorla()) || donemAdi(an);
  return { ad, ...DONEMLER[ad] };
}

/** Uygulama açıkken geçerli dönem (açılışta bir kez hesaplanır; dönem ayın 1'inde değişir). */
export const DONEM: Donem = donem();

/** #RRGGBB → rgba(…, a) */
export function saydam(hex: string, a: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/** İki #RRGGBB rengini karıştırır (t: a'nın payı) → #RRGGBB. Saydam yerine düz renk gereken yerler için. */
export function karistir(a: string, b: string, t: number): string {
  const x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16);
  const k = (s: number) => Math.round(((x >> s) & 255) * t + ((y >> s) & 255) * (1 - t));
  return '#' + ((k(16) << 16) | (k(8) << 8) | k(0)).toString(16).padStart(6, '0').toUpperCase();
}
