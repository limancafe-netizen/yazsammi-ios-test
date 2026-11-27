// KULLANILMIYOR (04.11.2026): eski KAHİN astroloji/tarot ekranı. Astroloji ve Tarot Kart Analizi artık sitenin /astroloji/ ve /tarot/ sayfaları,
// uygulamada WebView ile (bilesenler/canli/SiteBolumu.native.tsx); hiçbir ekran bu dosyayı içe aktarmıyor. Kod başvuru için duruyor, silinmedi.
// KAHİN masası (29.10): dikey telefon masası (plan/80_YENI_BOLUMLER/kahin/masa_dik, 62/62 yerleşim denetimli) RN bileşeni olarak.
// Three.js/WebGL YOK: masa plakası (resim) + kartlar RN Animated. Kartlar masaya yatık gerçek perspektifte (dikeyde sin-kısaltma SF), aynı dünya boyu,
// yerleşim yerlesim.ts'ten (telefon 390x844'te kartlar el/mum/küre ve birbirleriyle çakışmaz). Kart: dağıtım (üstten iner) → yüz aşağı → AÇILIŞ (kalkar, döner, iner).
import { forwardRef, memo, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { Animated, Easing, Image, Pressable, StyleSheet, View } from 'react-native';
import type { KahinKart } from '@/canli';
import { KART_ARKA, KART_YUZU } from './kartYuzleri';
import { YERLESIM } from './yerlesim';

const MASA = require('../../assets/kahin/masa.jpg');
export type AcilimId = keyof typeof YERLESIM.acilimlar;
export type MasaTutamak = { dagit: (i: number) => Promise<void>; ac: (i: number) => Promise<void> };

type Boyut = { w: number; h: number };
// Telefon tasarım penceresi (390x844) uygun ölçekle verilen alana oturur (en-boy farkı olursa plaka kadrajı genişletir).
export function sahneOlcu(b: Boyut) {
  const f = Math.min(b.w / YERLESIM.vw, b.h / YERLESIM.vh);
  return { f, x: (b.w - YERLESIM.vw * f) / 2, y: (b.h - YERLESIM.vh * f) / 2 };
}
const SF = YERLESIM.plaka.B / YERLESIM.plaka.A; // masa yatıklığı: dikeyde kısalma

type KartProps = { kaynak?: { x: number; y: number }; i: number; kart: KahinKart; acilim: AcilimId; boyut: Boyut; kayit: KartAnim; aktif: boolean; acik: boolean; onKart: (i: number) => void };
export type KartAnim = { dagit: Animated.Value; ac: Animated.Value; kalk: Animated.Value; aktif: Animated.Value };

const Kart = memo(function Kart({ kaynak, i, kart, acilim, boyut, kayit, aktif, acik, onKart }: KartProps) {
  const L = YERLESIM.acilimlar[acilim], P = YERLESIM.plaka;
  const { f, x: sx, y: sy } = sahneOlcu(boyut);
  const k = L.kartlar[i];
  const c = L.c * f;
  const [X0, Y0] = L.pencere;
  const cx = sx + (P.XC + P.A * k.u - X0) * c, cy = sy + (P.YC + P.B * k.v - Y0) * c;
  const w0 = YERLESIM.cw * P.A * c, h0 = YERLESIM.ch * P.A * c; // yüz yüze bakan boyutlar; dikey kısalma iç görünümde (SF)
  const deckX = kaynak ? kaynak.x : sx + (P.XC - X0) * c, deckY = kaynak ? kaynak.y : sy + (P.YC + P.B * -0.86 - Y0) * c;
  const ters = kart.ters;
  const flipX = kayit.ac.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.02, 1] });
  const arkaOp = kayit.ac.interpolate({ inputRange: [0, 0.499, 0.5, 1], outputRange: [1, 1, 0, 0] });
  const yuzOp = kayit.ac.interpolate({ inputRange: [0, 0.499, 0.5, 1], outputRange: [0, 0, 1, 1] });
  const kalkY = kayit.kalk.interpolate({ inputRange: [0, 1], outputRange: [0, -h0 * 0.22] });
  const kalkS = kayit.kalk.interpolate({ inputRange: [0, 1], outputRange: [1, 1.28] });
  const golgeOp = kayit.kalk.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0.3] });
  const golgeKay = kayit.kalk.interpolate({ inputRange: [0, 1], outputRange: [0, h0 * 0.16] });
  const golgeKayX = kayit.kalk.interpolate({ inputRange: [0, 1], outputRange: [0, w0 * 0.06] });
  return (
    <Animated.View
      pointerEvents={acik ? 'auto' : 'none'}
      style={{
        position: 'absolute', left: cx - w0 / 2, top: cy - h0 / 2, width: w0, height: h0,
        opacity: kayit.dagit.interpolate({ inputRange: [0, 0.12, 1], outputRange: [0, 1, 1] }),
        transform: [
          { translateX: kayit.dagit.interpolate({ inputRange: [0, 1], outputRange: [deckX - cx, 0] }) },
          { translateY: kayit.dagit.interpolate({ inputRange: [0, 1], outputRange: [deckY - cy, 0] }) },
          { scale: kayit.dagit.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) },
          { translateY: kalkY },
          { scale: kalkS },
        ],
      }}
    >
      <Pressable onPress={() => onKart(i)} style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel={acik ? `${kart.pozisyon}: ${kart.ad}${kart.ters ? ' (ters)' : ''}` : `Kart ${i + 1}, kapalı`}>
        {/* iç görünüm: masa düzleminde döndür, sonra dikeyde kısalt (SF) */}
        <View style={[StyleSheet.absoluteFill, { transform: [{ scaleY: SF }, { rotate: `${k.rot}deg` }] }]}>
          <Animated.View style={[styles.golge, { opacity: golgeOp, transform: [{ translateY: golgeKay }, { translateX: golgeKayX }] }]} />
          <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scaleX: flipX }] }]}>
            <Animated.Image source={KART_ARKA} resizeMode="stretch" style={[styles.yuz, { opacity: arkaOp }]} />
            <Animated.Image source={KART_YUZU[kart.id]} resizeMode="stretch" style={[styles.yuz, { opacity: yuzOp, transform: [{ rotate: ters ? '180deg' : '0deg' }] }]} />
          </Animated.View>
          <Animated.View pointerEvents="none" style={[styles.parilti, { opacity: kayit.aktif }]} />
        </View>
      </Pressable>
    </Animated.View>
  );
});

export const Masa = forwardRef<MasaTutamak, { kaynak0?: { x: number; y: number }; acilim: AcilimId; kartlar: KahinKart[]; acilan: number[]; aktif: number | null; boyut: Boyut; onKart: (i: number) => void }>(function Masa({ kaynak0, acilim, kartlar, acilan, aktif, boyut, onKart }, ref) {
  const anim = useRef<KartAnim[]>([]);
  if (anim.current.length < kartlar.length) {
    for (let i = anim.current.length; i < kartlar.length; i++) anim.current.push({ dagit: new Animated.Value(0), ac: new Animated.Value(0), kalk: new Animated.Value(0), aktif: new Animated.Value(0) });
  }
  const L = YERLESIM.acilimlar[acilim], P = YERLESIM.plaka;
  const { f, x: sx, y: sy } = sahneOlcu(boyut);
  const c = L.c * f;
  const [X0, Y0] = L.pencere;
  useImperativeHandle(ref, () => ({
    dagit: (i) => new Promise((coz) => Animated.timing(anim.current[i].dagit, { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(() => coz())),
    ac: (i) => new Promise((coz) => {
      const a = anim.current[i];
      Animated.sequence([
        Animated.timing(a.kalk, { toValue: 1, duration: 420, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(a.ac, { toValue: 1, duration: 760, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
        Animated.delay(180),
        Animated.timing(a.kalk, { toValue: 0, duration: 460, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]).start(() => coz());
    }),
  }), []);
  useEffect(() => {
    kartlar.forEach((_, i) => Animated.timing(anim.current[i].aktif, { toValue: aktif === i ? 1 : 0, duration: 350, useNativeDriver: true }).start());
  }, [aktif, kartlar.length]);
  const acik = useMemo(() => new Set(acilan), [acilan]);
  return (
    <View style={[StyleSheet.absoluteFill, { overflow: 'hidden', backgroundColor: '#07040C' }]}>
      <Image source={MASA} resizeMode="stretch" style={{ position: 'absolute', left: sx - X0 * c, top: sy - Y0 * c, width: P.W * c, height: P.H * c }} />
      {kartlar.map((kart, i) => (
        <Kart key={i} kaynak={i === 0 ? kaynak0 : undefined} i={i} kart={kart} acilim={acilim} boyut={boyut} kayit={anim.current[i]} aktif={aktif === i} acik={acik.has(i)} onKart={onKart} />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  yuz: { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', borderRadius: 4 },
  golge: { position: 'absolute', left: 2, top: 3, right: -2, bottom: -3, borderRadius: 5, backgroundColor: '#000' },
  parilti: { position: 'absolute', left: -3, top: -3, right: -3, bottom: -3, borderRadius: 7, borderWidth: 2.5, borderColor: '#F2C14E', shadowColor: '#F2C14E', shadowOpacity: 0.9, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 8 },
});
