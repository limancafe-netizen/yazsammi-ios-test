// Web (06.11 hız işi): Canlı'nın ikincil ekranları (Tribün, Mesajlar, Profil, Ayarlar, Detay, Zil, pencereler ≈ 280 KB) ilk programda DEĞİL, ayrı parçalar olarak iner.
// Böylece açılışta program daha küçük/hızlı çalışır; ekran ilk açıldığında parça yoksa kısa süre boş görünür (Suspense). Açılıştan birkaç sn sonra parçalar boşta önceden indirilir,
// çoğu kişi ilk dokunuşta beklemez. Uygulamada tembel.tsx aynı adları doğrudan verir (davranış aynı).
import { lazy, Suspense, type ComponentType } from 'react';

function tembel<P extends object>(yukle: () => Promise<ComponentType<P>>) {
  const Yuk = lazy(() => yukle().then((C) => ({ default: C })));
  return function Tembel(p: P) {
    return (
      <Suspense fallback={null}>
        <Yuk {...(p as any)} />
      </Suspense>
    );
  };
}

export const Detay = tembel(() => import('./Detay').then((m) => m.Detay));
export const Zil = tembel(() => import('./Zil').then((m) => m.Zil));
export const Profil = tembel(() => import('./Profil').then((m) => m.Profil));
export const Ayarlar = tembel(() => import('./Ayarlar').then((m) => m.Ayarlar));
export const Pencereler = tembel(() => import('./Pencereler').then((m) => m.Pencereler));
export const Mesajlar = tembel(() => import('./Mesajlar').then((m) => m.Mesajlar));
export const Sohbet = tembel(() => import('./Mesajlar').then((m) => m.Sohbet));
export const MesajPencereleri = tembel(() => import('./Mesajlar').then((m) => m.MesajPencereleri));
export const TribunTakvim = tembel(() => import('./Tribun').then((m) => m.TribunTakvim));
export const TribunOdaEkrani = tembel(() => import('./Tribun').then((m) => m.TribunOdaEkrani));
export const TribunPortal = tembel(() => import('./TribunPortal').then((m) => m.TribunPortal));
export const TribunMacDetay = tembel(() => import('./TribunMacDetay').then((m) => m.TribunMacDetay));
export const TribunKoseYazisi = tembel(() => import('./TribunKose').then((m) => m.TribunKoseYazisi));

// Açılıştan sonra boşta (yavaş hat / veri tasarrufunda yok): parçalar TEK TEK (aralıklı) önceden iner → ekran açılınca hazır; hepsi aynı anda çalışıp ana iş parçacığını tutmasın.
// Canlı sahnesi çizilince çağrılır (canli.tsx); Canlı dışındaki sayfalarda (ör. "sayfa bulunamadı") hiçbir şey inmez.
const PARCALAR: Array<() => Promise<unknown>> = [
  () => import('./Profil'),
  () => import('./Detay'),
  () => import('./Tribun'),
  () => import('./TribunPortal'),
  () => import('./TribunMacDetay'),
  () => import('./TribunKose'),
  () => import('./Ayarlar'),
  () => import('./Zil'),
];
let basladi = false;
export function ikincilleriOnYukle() {
  if (basladi || typeof window === 'undefined') return;
  basladi = true;
  const bag = (navigator as any).connection || {};
  if (bag.saveData || (bag.effectiveType && bag.effectiveType !== '4g')) return;
  const bekle = (ms: number) => new Promise((r) => setTimeout(r, ms));
  (async () => {
    await bekle(5000);
    for (const y of PARCALAR) {
      try { await y(); } catch { /* parça inemedi: ekran açılırken yine denenir */ }
      await bekle(600);
    }
  })();
}
