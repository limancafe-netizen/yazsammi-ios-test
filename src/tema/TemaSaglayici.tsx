import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform, useColorScheme } from 'react-native';
import { renkler, uygulamaRenkleri, type Renkler } from './tema';
import { depoOku, depoYaz } from '@/depo';

type Secim = 'otomatik' | 'gunduz' | 'gece';
type Deger = { r: Renkler; gece: boolean; secim: Secim; secimDegistir: (s: Secim) => void };

const TemaBaglami = createContext<Deger | null>(null);

export function TemaSaglayici({ children }: { children: ReactNode }) {
  const sistem = useColorScheme();
  const [secim, secimAyarla] = useState<Secim>(() => {
    const s = depoOku('yazsammi.tema');
    return s === 'gece' || s === 'gunduz' ? s : 'otomatik';
  });
  const secimDegistir = (s: Secim) => { secimAyarla(s); depoYaz('yazsammi.tema', s); };
  // Açılış (kod/site/acilis, 22.10): figür seçilince/değişince tema gelir (Fener → gece, Bukalemun → gündüz).
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const al = (e: Event) => { const t = (e as CustomEvent).detail; if (t === 'gece' || t === 'gunduz') secimAyarla(t); };
    window.addEventListener('yazsammi:tema', al);
    return () => window.removeEventListener('yazsammi:tema', al);
  }, []);
  const gece = secim === 'gece' || (secim === 'otomatik' && sistem === 'dark');
  // Uygulamada ayrı palet (site ile aynı görünmesin); uygulama varsayılan olarak gece temasıyla açılır.
  // Deneme kopyasındaki /uygulama-onizleme sayfası uygulama paletiyle görünür (öykünücü olmadan denetim için).
  const uyg = Platform.OS !== 'web' || (typeof window !== 'undefined' && window.location?.host?.includes('-test-') && window.location.pathname.startsWith('/uygulama-onizleme'));
  const palet = uyg ? uygulamaRenkleri : renkler;
  const geceMi = uyg ? secim !== 'gunduz' : gece;
  const deger = useMemo(() => ({ r: geceMi ? palet.gece : palet.gunduz, gece: geceMi, secim, secimDegistir }), [geceMi, secim, palet]);
  return <TemaBaglami.Provider value={deger}>{children}</TemaBaglami.Provider>;
}

export function useTema(): Deger {
  const d = useContext(TemaBaglami);
  if (!d) throw new Error('useTema, TemaSaglayici içinde kullanılmalı');
  return d;
}
