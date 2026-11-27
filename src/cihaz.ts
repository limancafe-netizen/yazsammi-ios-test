// 22.11: web ziyaretçisinin cihaz türü (ücret duvarında mağaza yönlendirmesi için). Saf fonksiyon: cihazBul (test: test/cihaz_test.mjs).
// 'uygulama': native iOS/Android, uygulama içi web görünümü (YAZSAMMI_UYGULAMA) ya da ?gomulu=1 → web yönlendirmesi GÖSTERİLMEZ.
export type Cihaz = 'ios' | 'android' | 'masaustu' | 'uygulama';
export type CihazGirdi = { web: boolean; ua: string; platform?: string; dokunma?: number; uygulama?: boolean; arama?: string };

export function cihazBul(g: CihazGirdi): Cihaz {
  if (!g.web || g.uygulama || /[?&]gomulu=1/.test(g.arama || '')) return 'uygulama';
  const ua = g.ua || '';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  if (g.platform === 'MacIntel' && (g.dokunma || 0) > 1) return 'ios'; // iPadOS "masaüstü site" kipi
  return 'masaustu';
}

export function cihazAl(os: string): Cihaz {
  if (os !== 'web' || typeof navigator === 'undefined' || typeof window === 'undefined') return 'uygulama';
  return cihazBul({ web: true, ua: navigator.userAgent, platform: navigator.platform, dokunma: navigator.maxTouchPoints, uygulama: !!(window as any).YAZSAMMI_UYGULAMA, arama: window.location.search });
}
