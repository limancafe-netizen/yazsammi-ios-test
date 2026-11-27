// KULLANILMIYOR (04.11.2026): eski KAHİN astroloji/tarot ekranı. Astroloji ve Tarot Kart Analizi artık sitenin /astroloji/ ve /tarot/ sayfaları,
// uygulamada WebView ile (bilesenler/canli/SiteBolumu.native.tsx); hiçbir ekran bu dosyayı içe aktarmıyor. Kod başvuru için duruyor, silinmedi.
// KAHİN odası SAHNESİ: tam ekran dikey video; iki oynatıcı + çapraz geçiş (siyah kare YOK: yeni klip ilk kareyi çizmeden eskisi kalkmaz, altta kuzgun durumuna uyan poster).
// oynat(klipId): klibin başlangıç durumu şimdiki kuzgun durumuyla (K0/K1/K2) uyuşmuyorsa aradaki geçiş klibini (gelis/tunege/tunekten) kendisi önce oynatır → kuzgun asla zıplamaz.
// Döngü klipleri hemen döner, tek seferlik klipler bitince çözülür (son karede donar).
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { BEKLEME, klipTanim, yolBul, type KDurum, type Tanim } from './klipSistemi';

const POSTER: Record<KDurum, number> = {
  K0: require('../../assets/kahin/poster/k0.jpg'),
  K1: require('../../assets/kahin/poster/k1.jpg'),
  K2: require('../../assets/kahin/poster/k2.jpg'),
};
export type OynatSecenek = {
  dongu?: boolean;
  /** klip görünmeye başladığı an çağrılır (ses vb. aynı anda başlasın) */
  basladi?: () => void;
  /** durum uyuşmuyorsa köprü kurma: kuzgun neredeyse orada kal (o yerin bekleme klibi) */
  koru?: boolean;
};
export type SahneTutamak = {
  /** klibi oynatır; döngü klipleri hemen, tek seferlik klipler BİTİNCE çözülür */
  oynat: (id: string, o?: OynatSecenek) => Promise<void>;
  /** kuzgunun şimdiki yeri (K0 yok · K1 masada · K2 tünekte) */
  durum: () => KDurum;
  aktif: () => string;
};

export const Sahne = forwardRef<SahneTutamak, { stil?: any }>(function Sahne({ stil }, ref) {
  const pA = useVideoPlayer(null, (o) => { o.muted = true; o.loop = false; });
  const pB = useVideoPlayer(null, (o) => { o.muted = true; o.loop = false; });
  const oyn = [pA, pB];
  const [zon, zAyarla] = useState(0);
  const [pd, pdAyarla] = useState<KDurum>('K0');
  const [olcu, olcuAyarla] = useState({ w: 0, h: 0 }); // yüzey ilk ölçüden önce çizilirse kare kaymış görünür: ilk ölçü gelince görünümler bir kez yeniden kurulur (sonraki yükseklik değişimleri = klavye: yeniden kurulmaz)
  const opak = useRef([new Animated.Value(0), new Animated.Value(0)]).current;
  const b = useRef({ on: -1, durum: 'K0' as KDurum, id: '', dongu: false, istek: 0, ilkKare: [null, null] as (null | (() => void))[], bitis: [null, null] as (null | (() => void))[], yuklu: ['', ''] });

  useEffect(() => {
    const abonelikler = oyn.map((p, i) => p.addListener('playToEnd', () => {
      if (b.current.on === i && !b.current.dongu) { const c = b.current.bitis[i]; b.current.bitis[i] = null; c?.(); }
    }));
    return () => abonelikler.forEach((a) => a.remove());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /** tek klip: gizli oynatıcıya yükle → ilk gerçek kare gelince yumuşakça aç → (tek seferlikse) bitene kadar bekle */
  async function tek(t: Tanim, dongu: boolean, istek: number, basladi?: () => void) {
    const st = b.current;
    const hedef = st.on === 0 ? 1 : 0, p = oyn[hedef];
    if (st.yuklu[hedef] !== t.id) { try { await p.replaceAsync(t.kaynak); } catch { return; } st.yuklu[hedef] = t.id; }
    if (istek !== st.istek) return; // araya yeni istek girdi
    p.loop = dongu; p.muted = true; p.currentTime = 0;
    const ilk = new Promise<void>((coz) => { st.ilkKare[hedef] = coz; setTimeout(coz, 1100); });
    p.play();
    await ilk;
    st.ilkKare[hedef] = null;
    for (let w = 0; w < 14 && p.currentTime < 0.12 && istek === st.istek; w++) await new Promise((r) => setTimeout(r, 60)); // eski yüzey karesi değil, gerçekten oynayan kare gelsin
    if (istek !== st.istek) return;
    const eski = st.on;
    if (eski < 0) { await new Promise((r) => setTimeout(r, 450)); if (istek !== st.istek) return; } // ilk açılışta yüzey birkaç yüz ms yanlış kırpık kare çiziyor: bu sürede poster (aynı kare) görünür kalır
    st.on = hedef; st.id = t.id; st.dongu = dongu; st.durum = t.bitis; pdAyarla(t.basla);
    opak[hedef].setValue(0); zAyarla(hedef);
    basladi?.();
    console.log(`KAHIN_KLIP ${Date.now()} ${t.id} ${t.basla}>${t.bitis}`); // deneme izi: demo kare denetimi hangi klip ne zaman görünür bilsin
    if (eski < 0) opak[hedef].setValue(1); else await new Promise<void>((coz) => Animated.timing(opak[hedef], { toValue: 1, duration: 260, useNativeDriver: true }).start(() => coz()));
    // yalnız hâlâ en yeni istekse eskiyi gizle: araya girmiş yeni istek o oynatıcıyı yüklüyor olabilir (siyah kare)
    if (eski >= 0 && eski !== hedef && istek === st.istek) { try { oyn[eski].pause(); } catch {} opak[eski].setValue(0); st.yuklu[eski] = ''; }
    if (dongu) return;
    // tek seferlik klip: doğal bitişte yüzey siyaha dönüyor → bitmeden hemen önce son karede dondur (sahne siyaha düşmesin)
    await new Promise<void>((coz) => {
      st.bitis[hedef] = coz;
      const izle = setInterval(() => {
        try {
          const d = p.duration;
          if ((d > 0 && p.currentTime >= d - 0.14) || istek !== st.istek) { clearInterval(izle); if (istek === st.istek) { p.pause(); pdAyarla(t.bitis); } st.bitis[hedef] = null; coz(); }
        } catch { clearInterval(izle); coz(); }
      }, 40);
    });
  }

  useImperativeHandle(ref, () => ({
    durum: () => b.current.durum,
    aktif: () => b.current.id,
    oynat: async (id, opt) => {
      const st = b.current;
      let t = klipTanim(id);
      if (!t || (opt?.koru && t.basla !== st.durum)) t = klipTanim(BEKLEME[st.durum]);
      if (!t) return;
      const dongu = opt?.dongu ?? t.dongu;
      if (st.on >= 0 && st.id === t.id && st.dongu && dongu) return; // aynı döngü klip zaten oynuyor
      const istek = ++st.istek;
      for (const ara of yolBul(st.durum, t.basla)) { await tek(ara, false, istek); if (istek !== st.istek) return; }
      await tek(t, dongu, istek, opt?.basladi);
    },
  }), []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0B0614' }, stil]} pointerEvents="none" onLayout={(e) => { const { width, height } = e.nativeEvent.layout; if (olcu.w === 0 || Math.abs(width - olcu.w) > 1) olcuAyarla({ w: width, h: height }); /* yalnız ilk ölçüde/genişlik değişince yeniden kur: klavye yüksekliği değiştirince görünümü yeniden kurmak yüzeyi siyah bırakıyordu */ }}>
      <Image source={POSTER[pd]} contentFit="cover" contentPosition="center" transition={0} style={StyleSheet.absoluteFill} />
      {[0, 1].map((i) => (
        <Animated.View key={i} style={[StyleSheet.absoluteFill, { opacity: opak[i], zIndex: zon === i ? 2 : 1 }]}>
          <VideoView key={`${i}-${Math.round(olcu.w)}x${Math.round(olcu.h)}`} player={oyn[i]} style={StyleSheet.absoluteFill} contentFit="cover" surfaceType="textureView" nativeControls={false} allowsPictureInPicture={false} onFirstFrameRender={() => { const c = b.current.ilkKare[i]; b.current.ilkKare[i] = null; c?.(); }} />
        </Animated.View>
      ))}
    </View>
  );
});
