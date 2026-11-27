// 21.11: iOS uygulaması App Store'da. Ana sayfada (telefon + bilgisayar) görünür "uygulamayı indir" alanı.
// Yalnız sitede (web); Android ziyaretçiye gösterilmez (Play henüz yok); uygulama içi web görünümünde (YAZSAMMI_UYGULAMA) ve gömülü sayfada gösterilmez.
// Rozet: Apple'ın resmî Türkçe "App Store'dan İndirin" SVG'si (değiştirilmeden, /marka/app-store-tr.svg; 151x40).
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { APPSTORE } from '@/analiz';
import { cihazAl } from '@/cihaz';
import { yazi } from '@/tema/tema';
import { useRenk } from './ortak';

export function indirGoster(): boolean {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined' || typeof window === 'undefined') return false;
  if (/Android/i.test(navigator.userAgent)) return false;
  if ((window as any).YAZSAMMI_UYGULAMA) return false;
  if (/[?&]gomulu=1/.test(window.location.search)) return false;
  return true;
}

// 22.11: ücret duvarı (web): iPhone/iPad → App Store rozeti; Android → bağlantısız "Google Play'de çok yakında"; masaüstü → ikisi. Uygulama içinde hiçbir şey çizmez.
export function MagazaYonlendir() {
  const R = useRenk();
  const c = cihazAl(Platform.OS);
  if (c === 'uygulama') return null;
  const rozet = (
    <Pressable accessibilityRole="link" accessibilityLabel="App Store'dan İndirin" {...({ href: APPSTORE, hrefAttrs: { target: '_blank', rel: 'noopener' } } as any)} testID="appstore-rozet-duvar" style={{ alignSelf: 'flex-start' }}>
      <Image source={{ uri: '/marka/app-store-tr.svg' }} accessibilityLabel="App Store'dan İndirin" style={{ width: 151.29, height: 40 }} resizeMode="contain" />
    </Pressable>
  );
  const yakinda = (
    <View testID="play-yakinda" accessibilityLabel="Android: Google Play'de çok yakında" style={[s.yakinda, { backgroundColor: R.yukselt, borderColor: R.ince }]}>
      <Text style={[s.ad, { color: R.murekkep }]}>Android: Google Play'de çok yakında</Text>
    </View>
  );
  return (
    <View testID="magaza-yonlendir" style={{ gap: 10, alignItems: 'flex-start', maxWidth: '100%' }}>
      {c !== 'android' && rozet}
      {c !== 'ios' && yakinda}
    </View>
  );
}

export function UygulamaIndir({ sik }: { sik?: boolean }) {
  const R = useRenk();
  if (!indirGoster()) return null;
  const rozet = (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel="App Store'dan İndirin"
      {...({ href: APPSTORE, hrefAttrs: { target: '_blank', rel: 'noopener' } } as any)}
      testID="appstore-rozet"
      style={{ alignSelf: 'flex-start' }}
    >
      <Image source={{ uri: '/marka/app-store-tr.svg' }} accessibilityLabel="App Store'dan İndirin" style={{ width: 151.29, height: 40 }} resizeMode="contain" />
    </Pressable>
  );
  return (
    <View testID="uygulama-indir" style={[s.kutu, { backgroundColor: R.yukselt, borderColor: R.ince }, sik && s.sik]}>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text style={[s.baslik, { color: R.soluk }]}>UYGULAMAYI İNDİR</Text>
        <Text style={[s.ad, { color: R.murekkep }]}>Yazsam mı? artık iPhone’da</Text>
      </View>
      {rozet}
    </View>
  );
}

const s = StyleSheet.create({
  kutu: { borderRadius: 24, borderWidth: 1, padding: 18, gap: 12 },
  sik: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 12, marginTop: 6, marginBottom: 4, borderRadius: 22, paddingVertical: 10, paddingHorizontal: 14 },
  yakinda: { borderRadius: 14, borderWidth: 1, paddingVertical: 10, paddingHorizontal: 14, maxWidth: '100%' },
  baslik: { fontFamily: yazi.kalin, fontSize: 11.5, letterSpacing: 1.1 },
  ad: { fontFamily: yazi.kalin, fontSize: 14.5 },
});
