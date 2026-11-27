// Rozet çizimi bileşenleri (ortak.tsx'in Ad bileşeni de kullanır; bu yüzden ortak.tsx'e bağımlı değil). Çizim marka/rozetCiz.ts (dönem paletinden).
import { memo, useId, useMemo } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import type { Vitrin } from '@/canli';
import { useTema } from '@/tema/TemaSaglayici';
import { DONEM } from '@/tema/donem';
import { rozet as rozetCiz } from '@/marka/rozetCiz';
import { BILGI, SEVIYELI, rozetAdi } from './rozetBilgi';

const ONBELLEK = new Map<string, string>();
function svgBul(r: string, s: number, mini: boolean, kilit: boolean, acik: boolean, no?: number) {
  const lvl = SEVIYELI.has(r) ? Math.max(1, Math.min(3, s || 1)) : 1;
  const k = `${DONEM.ad}|${r}|${lvl}|${mini ? 1 : 0}|${kilit ? 1 : 0}|${acik ? 1 : 0}|${r === 'oncu' ? no ?? 0 : 0}`;
  let x = ONBELLEK.get(k);
  if (!x) {
    x = rozetCiz(r, { lvl, mini, kilit, acik, no: no ?? 7 });
    ONBELLEK.set(k, x);
  }
  return x;
}
const ekYap = (s: string) => 'x' + s.replace(/[^A-Za-z0-9_-]/g, '');
/** Tek rozet çizimi. Her çizime ayrı kimlik eki (gizli ekrandaki eş kimlik maske/kırpmayı boş çizdirmesin). */
export const RozetGorsel = memo(function RozetGorsel({ r, s = 1, boyut = 56, mini = false, kilit = false, no, etiket }: { r: string; s?: number; boyut?: number; mini?: boolean; kilit?: boolean; no?: number; etiket?: string }) {
  const { gece } = useTema();
  const ek = ekYap(useId());
  const xml = useMemo(() => svgBul(r, s, mini, kilit, !gece, no).replace(/\br\d+[am]\b/g, (m) => m + ek), [r, s, mini, kilit, gece, no, ek, DONEM.ad]);
  return (
    <View accessible accessibilityLabel={etiket ?? `${rozetAdi(r)} rozeti`} style={{ width: boyut, height: boyut }}>
      <SvgXml xml={xml} width={boyut} height={boyut} />
    </View>
  );
});

// Adın yanında seçilen tek rozet. Boyut denemesi (plan/29_ROZETLER/v3/uygulama/kaynak/boyut_dene.mjs): 28 px'lik mini çizim 15,5 px'lik adın yanında
// büyük duruyor; 20 px'te (telefon, 2x-3x ekran) nesne net okunuyor, 18 px'te ince ayrıntılar (öncü bayrağı, kalp) kayboluyor, bilgisayarda
// (1x ekran) 22 px daha net. Telefon 20, bilgisayar 22.
export function AdRozeti({ v, boyut }: { v: Vitrin; boyut?: number }) {
  const { width } = useWindowDimensions();
  if (!BILGI[v.r]) return null;
  boyut = boyut ?? (width >= 900 ? 22 : 20);
  return <RozetGorsel r={v.r} s={v.s} no={v.n} mini boyut={boyut} etiket={`${rozetAdi(v.r)}${v.r === 'oncu' && v.n ? ` #${v.n}` : ''} rozeti`} />;
}

