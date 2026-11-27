// Okur rozeti için okunan balon SAYAÇI (plan/29_ROZETLER §6; Onur 08.10). Kural: ekranda ≥2 sn kalan ya da açılan balon "okundu" sayılır;
// cihazda sayılır, ~5 dakikada bir tek istekle (/c/okundu {n}) toplu yollanır. Sunucuya HANGİ balonun okunduğu GİTMEZ, yalnız sayı.
// Aynı balon bir daha sayılmasın diye cihazda (yalnız bu cihazda, kimlik özeti olarak) son 2000 okunan hatırlanır. Günde 300'ü sunucu sayar.
import { useEffect, type RefObject } from 'react';
import { Dimensions, Platform, type View } from 'react-native';
import * as C from '@/canli';
import { depoOku, depoYaz } from '@/depo';

const ANAHTAR = 'yazsammi.canli.okunan';
const SINIR = 2000;
let okunan: Set<string> | null = null;
let bekleyen = 0;
let sonYollama = Date.now();
const izlenen = new Map<string, { ref: RefObject<View | null>; seri: number }>();
let sayac: ReturnType<typeof setInterval> | null = null;
const yukseklik = () => (Platform.OS === 'web' && typeof window !== 'undefined' ? window.innerHeight : Dimensions.get('window').height);

const yukle = () => {
  if (okunan) return okunan;
  try {
    const d = depoOku(ANAHTAR);
    okunan = new Set(d ? (JSON.parse(d) as string[]) : []);
  } catch {
    okunan = new Set();
  }
  return okunan;
};
const kaydet = () => {
  const l = [...yukle()].slice(-SINIR);
  okunan = new Set(l);
  depoYaz(ANAHTAR, JSON.stringify(l));
};

/** Bir balonu okundu say (tekrarlar sayılmaz). Dönen: yeni sayıldı mı. */
export function okunduSay(id: string) {
  const k = yukle();
  if (k.has(id)) return false;
  k.add(id);
  bekleyen++;
  kaydet();
  if (bekleyen >= 40) yolla();
  return true;
}
export async function yolla() {
  if (!bekleyen || !C.oturumVar()) return;
  const n = bekleyen;
  bekleyen = 0;
  sonYollama = Date.now();
  const r = await C.okunduYolla(n);
  if (!r.ok && r.durum !== 429 && r.durum !== 403) bekleyen += n; // bağlantı yoksa sonra yeniden
}

function tara() {
  if (Platform.OS === 'web' && typeof document !== 'undefined' && document.hidden) {
    for (const v of izlenen.values()) v.seri = 0;
    return;
  }
  const H = yukseklik();
  for (const [id, v] of izlenen) {
    const e: any = v.ref.current;
    if (!e || typeof e.measureInWindow !== 'function') continue;
    e.measureInWindow((_x: number, y: number, _w: number, h: number) => {
      const orta = y + h / 2;
      const gorunur = h > 40 && orta > 70 && orta < H - 70; // kartın ortası üst çubuk ile alt rıhtım arasında
      const o = izlenen.get(id);
      if (!o) return;
      o.seri = gorunur ? o.seri + 1 : 0;
      if (o.seri >= 2) okunduSay(id);
    });
  }
  if (Date.now() - sonYollama > 5 * 60000) yolla();
}

/** Akıştaki bir kartı izler: ekranda ≥2 sn kalırsa okundu sayılır. */
export function useOkuma(ref: RefObject<View | null>, id: string, aktif = true) {
  useEffect(() => {
    if (!aktif) return;
    izlenen.set(id, { ref, seri: 0 });
    if (!sayac) {
      sayac = setInterval(tara, 1000);
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', () => { if (document.hidden) yolla(); });
      }
    }
    return () => {
      izlenen.delete(id);
      if (!izlenen.size && sayac) {
        clearInterval(sayac);
        sayac = null;
        yolla();
      }
    };
  }, [id, aktif]);
}
