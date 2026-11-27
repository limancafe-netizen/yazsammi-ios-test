// "Yaz" düğmesi = LOGONUN TAMAMI ("Yazsam" üstte, "mı?" altta; kod/site/marka/simge-<dönem>.svg ile birebir) — Onur 08.10 onayı,
// kurgu a (plan/25_YAZ_DUGMESI/logo_dugme.html "Seçilen", logo.css .ld-la):
// - Boşta: 3,6 sn'de bir %3,5 nefes, EN ÇOK 3 kez, sonra durur (hareketi azalt açıksa hiç).
// - Basınca: "mı?" dikey kapanır, el yazısıyla "Yaz!" açılır, logo bir kez parlar; ardından sade paylaşım sayfası açılır.
// - Renkler logonun KENDİ renkleri (zemin, "Yazsam", "mı?") güncel dönemden; dönem değişince eski renklerden yenisine 1,2 sn akar
//   (cihazda son görülen dönem saklanır). Altta renkli ışık yok; nötr gölge.
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { G, Path } from 'react-native-svg';
import { LOGO_MI, LOGO_YAZ, LOGO_YAZSAM } from '@/marka/logoVeri';
import { DONEM, DONEMLER, type DonemAd } from '@/tema/donem';
import { depoOku, depoYaz } from '@/depo';
import { YEREL_SURUCU } from './ortak';

type Simge = { zemin: string; yazi: string; mi: string };
export type YazDugmesiTutamak = { bas: () => void };

const ANAHTAR = 'yazsammi.yaz.donem';
// Dönem geçişi: cihazda son görülen dönem farklıysa onun renklerinden akarak gelir. Denemek için webde ?donemGecis=<eski dönem>.
function oncekiDonem(): DonemAd | null {
  let eski: string | null = null;
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      eski = new URLSearchParams(window.location.search).get('donemGecis');
    } catch {}
  }
  if (!eski) eski = depoOku(ANAHTAR);
  try {
    depoYaz(ANAHTAR, DONEM.ad);
  } catch {}
  return eski && eski !== DONEM.ad && eski in DONEMLER ? (eski as DonemAd) : null;
}

function Katman({ s, parca, boyut }: { s: Simge; parca: 'govde' | 'mi' | 'yaz'; boyut: number }) {
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 512 512" style={{ position: 'absolute', left: 0, top: 0 }}>
      {parca === 'govde' && <Path d={LOGO_YAZSAM} fill={s.yazi} />}
      {parca === 'mi' && (
        <G transform="rotate(-7 282 340)">
          <Path d={LOGO_MI} fill={s.mi} />
        </G>
      )}
      {parca === 'yaz' && (
        <G transform="rotate(-7 282 340)">
          <G transform="translate(-11 0)">
            <Path d={LOGO_YAZ} fill={s.mi} />
          </G>
        </G>
      )}
    </Svg>
  );
}

export const YazDugmesi = forwardRef<YazDugmesiTutamak, { boyut?: number; halka: string; ac: () => void; etiket?: string; basilabilir?: boolean }>(function YazDugmesi({ boyut = 66, halka, ac, etiket = 'Yaz: yeni paylaşım', basilabilir = true }, ref) {
  const s = DONEM.simge;
  const nefes = useRef(new Animated.Value(0)).current;
  const basma = useRef(new Animated.Value(0)).current; // 0 → 1: basma hareketi (1000 ms)
  const gecis = useRef(new Animated.Value(1)).current; // eski dönem katmanının görünürlüğü
  const [eski] = useState<DonemAd | null>(oncekiDonem);
  const az = useRef(false);
  const oynuyor = useRef(false);

  useEffect(() => {
    let iptal = false;
    const basla = () => {
      if (iptal) return;
      if (eski) Animated.timing(gecis, { toValue: 0, duration: az.current ? 0 : 1200, delay: 500, easing: Easing.inOut(Easing.quad), useNativeDriver: YEREL_SURUCU }).start();
      if (az.current) return;
      const bir = Animated.sequence([
        Animated.timing(nefes, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: YEREL_SURUCU }),
        Animated.timing(nefes, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: YEREL_SURUCU }),
      ]);
      Animated.sequence([Animated.delay(600), Animated.loop(bir, { iterations: 3 })]).start();
    };
    const f = AccessibilityInfo.isReduceMotionEnabled?.();
    if (f && typeof f.then === 'function') f.then((x) => { az.current = !!x; basla(); }).catch(basla);
    else basla();
    return () => {
      iptal = true;
      nefes.stopAnimation();
    };
  }, []);

  const bas = () => {
    if (oynuyor.current) return;
    if (az.current) return ac();
    oynuyor.current = true;
    nefes.stopAnimation();
    nefes.setValue(0);
    basma.setValue(0);
    Animated.timing(basma, { toValue: 1, duration: 1000, easing: Easing.linear, useNativeDriver: YEREL_SURUCU }).start(() => {
      basma.setValue(0);
      oynuyor.current = false;
    });
    setTimeout(ac, 640); // "Yaz!" yerine oturunca sayfa açılır
  };
  useImperativeHandle(ref, () => ({ bas }));

  // Zaman çizgisi (logo.css ldKapan / ldAcil / ldParla): 0–0,3 "mı?" kapanır · 0,31–0,58 "Yaz!" açılır · kutu 0,12'de .9, 0,4'te 1,06.
  const kutOlcek = Animated.add(
    nefes.interpolate({ inputRange: [0, 1], outputRange: [0, 0.035] }),
    basma.interpolate({ inputRange: [0, 0.12, 0.4, 0.6, 1], outputRange: [1, 0.9, 1.06, 1, 1] }),
  );
  const miOlcek = basma.interpolate({ inputRange: [0, 0.3, 0.31, 0.99, 1], outputRange: [1, 0.001, 0.001, 0.001, 1] });
  const miGor = basma.interpolate({ inputRange: [0, 0.3, 0.31, 0.99, 1], outputRange: [1, 1, 0, 0, 1] });
  const yazOlcek = basma.interpolate({ inputRange: [0, 0.3, 0.31, 0.5, 0.58, 0.99, 1], outputRange: [0.001, 0.001, 0.001, 1.12, 1, 1, 0.001] });
  const yazGor = basma.interpolate({ inputRange: [0, 0.3, 0.31, 0.99, 1], outputRange: [0, 0, 1, 1, 0] });
  const parilti = basma.interpolate({ inputRange: [0, 0.4, 0.6, 1], outputRange: [0, 0, 0.55, 0] });

  const r = boyut * 0.226;
  const eskiS = eski ? DONEMLER[eski].simge : null;
  const govde = (k: Simge) => (
    <>
      <View style={{ position: 'absolute', left: 0, top: 0, width: boyut, height: boyut, borderRadius: r, backgroundColor: k.zemin }} />
      <Katman s={k} parca="govde" boyut={boyut} />
    </>
  );
  // Halka (menü zemini rengi, 4 px) + nötr gölge; içte üstte ince parlama, altta ince koyuluk (logo.css .ld-kut).
  const golge = Platform.OS === 'web' ? ({ boxShadow: '0 10px 18px -8px rgba(10,6,25,0.55)' } as any) : { elevation: 8, shadowColor: '#0A0619', shadowOpacity: 0.4, shadowRadius: 9, shadowOffset: { width: 0, height: 6 } };
  const icGolge = Platform.OS === 'web' ? ({ boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.2), inset 0 -3px 0 rgba(0,0,0,0.22), inset 0 0 0 1px rgba(0,0,0,0.08)' } as any) : null;
  const ic = (
    <Animated.View style={{ width: boyut, height: boyut, transform: [{ scale: kutOlcek }] }}>
      <Animated.View style={{ position: 'absolute', left: -8, top: -8, width: boyut + 16, height: boyut + 16, borderRadius: r + 8, backgroundColor: s.zemin, opacity: parilti }} />
      <View style={[{ position: 'absolute', left: -4, top: -4, width: boyut + 8, height: boyut + 8, borderRadius: r + 4, backgroundColor: halka }, golge]} />
      <View style={{ width: boyut, height: boyut, borderRadius: r, overflow: 'hidden', backgroundColor: s.zemin }}>
        {govde(s)}
        <Animated.View style={{ position: 'absolute', left: 0, top: 0, width: boyut, height: boyut, opacity: miGor, transform: [{ scaleY: miOlcek }], transformOrigin: '59% 62.5%' } as any}>
          <Katman s={s} parca="mi" boyut={boyut} />
        </Animated.View>
        <Animated.View style={{ position: 'absolute', left: 0, top: 0, width: boyut, height: boyut, opacity: yazGor, transform: [{ scaleY: yazOlcek }], transformOrigin: '59% 63.7%' } as any}>
          <Katman s={s} parca="yaz" boyut={boyut} />
        </Animated.View>
        {eskiS && (
          <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: boyut, height: boyut, opacity: gecis }}>
            {govde(eskiS)}
            <Katman s={eskiS} parca="mi" boyut={boyut} />
          </Animated.View>
        )}
        <LinearGradient pointerEvents="none" colors={['rgba(255,255,255,0.16)', 'rgba(255,255,255,0)']} locations={[0, 0.46]} style={{ position: 'absolute', left: 0, top: 0, width: boyut, height: boyut }} />
        <View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0, width: boyut, height: boyut, borderRadius: r }, icGolge]} />
      </View>
    </Animated.View>
  );
  if (!basilabilir) return ic;
  return (
    <Pressable onPress={bas} accessibilityRole="button" accessibilityLabel={etiket} hitSlop={6} style={({ pressed }) => [{ width: boyut, height: boyut }, pressed && { transform: [{ translateY: 2 }] }]}>
      {ic}
    </Pressable>
  );
});
