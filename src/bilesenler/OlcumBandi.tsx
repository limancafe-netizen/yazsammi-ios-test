// Ölçüm izni bandı (22.10, KVKK çerez rehberi): adsız ziyaret sayımı yalnız "Kabul" ile (analiz.ts, 'yazsammi.olcum').
// Yalnız web; tercih yoksa görünür. 03.11: üstte menüleri/sekmeleri örtüyordu → altta: telefonda alt menünün (rıhtım) hemen üstünde ince şerit, bilgisayarda sağ alt köşede küçük kutu. Açılış sayfası (kod/site/acilis) sürerken çıkmaz: #acilis yoksa, figür siteye indiyse
// (#figurKatman.sitede) ya da seçim ekranı kapalı ve açılış oynamıyorsa (15 sn sonra) gösterilir. Tercih /gizlilik/#cerez'den değişir.
import { useEffect, useState } from 'react';
import { Linking, Platform, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRenk } from '@/bilesenler/canli/ortak';
import { yazi } from '@/tema/tema';
import { GENIS_SINIR } from '@/bilesenler/Genis';
import { olcumAyarla, olcumTercihi } from '@/analiz';
import * as C from '@/canli';

function acilisSuruyor(t0: number) {
  const kok = document.getElementById('acilis');
  if (!kok || !kok.isConnected || document.documentElement.classList.contains('acilis-yok')) return false;
  if (document.getElementById('figurKatman')?.classList.contains('sitede')) return false;
  const secim = document.getElementById('secim') as HTMLElement | null;
  const secimAcik = !!secim && !secim.hidden;
  return secimAcik || kok.classList.contains('oynuyor') || Date.now() - t0 < 15000;
}

export function OlcumBandi() {
  const R = useRenk();
  const [goster, gosterAyarla] = useState(false);
  const { width } = useWindowDimensions();
  const alt = useSafeAreaInsets().bottom;
  // 19.11: telefonda girişsiz ziyaretçiye alt menünün üstünde "Giriş yap | Üye ol" şeridi (44 px) var; çerez bandı onun da üstünde durur
  const [serit, seritAyarla] = useState(() => !(C.oturumVar() && C.kayitliUye() && !C.kayitliUye()?.yeni));
  useEffect(() => C.oturumDinle(() => seritAyarla(!(C.oturumVar() && C.kayitliUye() && !C.kayitliUye()?.yeni))), []);

  useEffect(() => {
    // 1.9.0: uygulamada (iOS/Android) da sorulur; eskiden yalnız web'deydi → uygulamada tercih hiç yazılmıyor, sayaç hiç gitmiyordu.
    const web = Platform.OS === 'web' && typeof document !== 'undefined';
    if ((Platform.OS === 'web' && !web) || olcumTercihi()) return;
    const t0 = Date.now();
    const bak = () => {
      if (web && acilisSuruyor(t0)) return;
      gosterAyarla(true);
      clearInterval(t);
    };
    const t = setInterval(bak, 500);
    bak();
    return () => clearInterval(t);
  }, []);

  if (!goster) return null;
  const sec = (v: 'evet' | 'hayir') => {
    olcumAyarla(v);
    gosterAyarla(false);
  };
  const kutu = width >= GENIS_SINIR; // bilgisayar: sağ alt köşede küçük kutu; telefon/tablet: rıhtımın üstünde şerit (sağ köşe figüre (Fener) bırakılır)
  const dugme = (v: 'evet' | 'hayir', etiket: string) => (
    <Pressable onPress={() => sec(v)} accessibilityRole="button" accessibilityLabel={etiket} hitSlop={{ top: 4, bottom: 4, left: 2, right: 2 }} style={{ flex: 1, height: 40, borderRadius: 999, borderWidth: 1.5, borderColor: R.vurgu, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: yazi.kalin, fontSize: 14.5, color: R.murekkep }}>{etiket}</Text>
    </Pressable>
  );
  // rıhtım: yükseklik 68, alttan max(güvenli alan, 10); ortadaki Yaz düğmesi ~18 px taşar (RIHTIM_TASMA) → şerit onun da üstünde durur
  const altBosluk = kutu ? 18 : Math.max(alt, 10) + 68 + (serit ? 44 : 0) + 20 + 4;
  const sagPay = kutu ? 18 : width < 761 ? (width <= 360 ? 76 : 84) : 12; // telefonda sağ alt köşe yüzen figürün (Fener) dinlenme yeri: şerit onun üstüne binmez
  const metin = (
    <Text style={{ fontFamily: yazi.orta, fontSize: kutu ? 14 : 12.5, lineHeight: kutu ? 20 : 17, color: R.murekkep }}>
      {Platform.OS === 'web' ? 'Siteyi geliştirmek için adsız ziyaret sayımı yapalım mı?' : 'Uygulamayı geliştirmek için adsız kullanım sayımı yapalım mı? Cihazda rastgele bir numara ve ilk açılış günü tutulur; adınla ya da hesabınla bağı yoktur.'} Reklam ya da takip yok.{' '}
      <Text style={{ color: R.vurgu, textDecorationLine: 'underline' }} onPress={() => (Platform.OS === 'web' ? window.open('/gizlilik/#cerez', '_blank') : Linking.openURL('https://yazsammi.com/gizlilik/#cerez').catch(() => {}))}>{Platform.OS === 'web' ? 'Çerez bilgisi' : 'Gizlilik bilgisi'}</Text>
    </Text>
  );
  return (
    <View
      accessibilityRole="alert"
      pointerEvents="box-none"
      style={[{ position: 'absolute', left: 0, right: 0, bottom: altBosluk, zIndex: 950, alignItems: kutu ? 'flex-end' : 'flex-start', paddingLeft: kutu ? 18 : 12, paddingRight: sagPay, pointerEvents: 'box-none' as any }]}
    >
      <View style={[{ width: '100%', maxWidth: kutu ? 360 : 440, padding: kutu ? 14 : 10, borderRadius: kutu ? 20 : 18, backgroundColor: R.yukselt, borderWidth: 1, borderColor: R.cizgi, ...(Platform.OS === 'web' ? ({ boxShadow: `0 12px 30px -10px ${R.golge}` } as any) : null) }, { gap: kutu ? 10 : 8 }]}>
        {metin}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {dugme('hayir', 'Reddet')}
          {dugme('evet', 'Kabul')}
        </View>
      </View>
    </View>
  );
}
