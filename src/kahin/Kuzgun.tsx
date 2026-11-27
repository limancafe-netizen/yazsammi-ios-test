// KULLANILMIYOR (04.11.2026): eski KAHİN astroloji/tarot ekranı. Astroloji ve Tarot Kart Analizi artık sitenin /astroloji/ ve /tarot/ sayfaları,
// uygulamada WebView ile (bilesenler/canli/SiteBolumu.native.tsx); hiçbir ekran bu dosyayı içe aktarmıyor. Kod başvuru için duruyor, silinmedi.
// KUZGUN (KAHİN'in kuzgunu): Blender'da şeffaf kare dizisine çevrilmiş 3B hareketler (animasyonlu WebP, toplam ≈1 MB; plan/80_YENI_BOLUMLER/kahin/kuzgun_3b/betik/uygulama_render.py + uygulama_webp.py).
// Tünekte (omuzda DEĞİL): bekler, ara sıra çığlık atar / kanat hışırdatır. Okumada masaya uçar (sağ alt), her kartta kartı gagalar, okuma bitince uçup gider.
// 3B/WebGL YOK: expo-image animasyonlu WebP + RN Animated (yalnız çeviri/ölçek, yerel sürücü) → hafif.
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { KART_ARKA } from './kartYuzleri';

const SP = {
  tunek_bekle: require('../../assets/kahin/kuzgun/tunek_bekle.webp'),
  tunek_cigilik: require('../../assets/kahin/kuzgun/tunek_cigilik.webp'),
  tunek_kanat: require('../../assets/kahin/kuzgun/tunek_kanat.webp'),
  masa_bekle: require('../../assets/kahin/kuzgun/masa_bekle.webp'),
  masa_gaga: require('../../assets/kahin/kuzgun/masa_gaga.webp'),
  ucus_kalkis: require('../../assets/kahin/kuzgun/ucus_kalkis.webp'),
  ucus_cirpma: require('../../assets/kahin/kuzgun/ucus_cirpma.webp'),
  ucus_inis: require('../../assets/kahin/kuzgun/ucus_inis.webp'),
};
// Render ortho ölçekleri (dünya birimi / kare) ve ayak noktası (karenin üstünden oran): kare boyu = ORTHO × (kuş boyu dp / 0.45)
const ORTHO = { tunek: 0.58, masa: 0.72, ucus: 1.1 };
const AYAK = { tunek: 0.93, masa: 0.84, ucus: 0.72 };
const KUS_DUNYA = 0.45;
/** masadaki iniş noktası (ayak) ve süreler: Tarot, ilk kartı kuzgun konduğu anda bu noktadan masaya bırakır */
export const KUS_INIS = (w: number, h: number) => ({ x: w * 0.8, y: h * 0.925 });
export const KUS_GETIRME_MS = 900 + 2600 + 520;
export const KART_OFSET = (w: number, h: number) => { const kusH = Math.min(h * 0.11, 96), K = kusH / 0.45; return { dx: -ORTHO.ucus * K * 0.22, dy: -ORTHO.ucus * K * 0.46 }; };
const bekle = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function Sprite({ ad, boyut, ayakOran, ayakX = 0.5, anahtar, yuklendi }: { ad: keyof typeof SP; boyut: number; ayakOran: number; ayakX?: number; anahtar?: string | number; yuklendi?: () => void }) {
  // (0,0) = ayak noktası; kare ayak noktasına göre yerleşir
  return <Image key={anahtar ?? ad} source={SP[ad]} contentFit="contain" autoplay onLoad={yuklendi} style={{ position: 'absolute', left: -boyut * ayakX, top: -boyut * ayakOran, width: boyut, height: boyut }} />;
}

/** Tünekte bekleyen kuzgun: video (bekleme klibi) w×h alanında yukarıdan hizalı, cover ile gösterildiğinde tünek tablası 1280x720 karede (845,362) noktasındadır. */
export function KuzgunTunekte({ w, h }: { w: number; h: number }) {
  const olcek = h / 720;
  const x = 845 * olcek - (1280 * olcek - w) / 2, y = 362 * olcek;
  const kusH = h * 0.12, boyut = ORTHO.tunek * (kusH / KUS_DUNYA);
  const [tek, tekAyarla] = useState<{ ad: 'tunek_cigilik' | 'tunek_kanat'; n: number } | null>(null);
  const n = useRef(0);
  useEffect(() => {
    let iptal = false;
    (async () => {
      await bekle(4000);
      while (!iptal) {
        const cig = Math.random() < 0.55;
        n.current++;
        tekAyarla({ ad: cig ? 'tunek_cigilik' : 'tunek_kanat', n: n.current });
        await bekle(cig ? 3100 : 2200);
        if (!iptal) tekAyarla(null);
        await bekle(6000 + Math.random() * 8000);
      }
    })();
    return () => { iptal = true; };
  }, []);
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: x, top: y }}>
      <TemasGolgesi en={boyut * 0.62} yukseklik={boyut * 0.02} solukluk={0.7} />
      <Sprite ad="tunek_bekle" boyut={boyut} ayakOran={AYAK.tunek} />
      {tek && <Sprite ad={tek.ad} boyut={boyut} ayakOran={AYAK.tunek} anahtar={`${tek.ad}${tek.n}`} />}
    </View>
  );
}

/** Temas gölgesi: ayakların altında yumuşak koyu elips (kuş masaya oturur; oda ışığı sol-önden → gölge sağ-arkaya hafif kayık) */
function TemasGolgesi({ en, yukseklik = 0, solukluk = 1 }: { en: number; yukseklik?: number; solukluk?: number }) {
  // ışık sol-önden (mum) → gölge sağa-arkaya uzar; iki katman: geniş yumuşak penumbra + dar koyu çekirdek (ayak altı)
  return (
    <>
      <View pointerEvents="none" style={{ position: 'absolute', left: -en * 0.30, top: -en * 0.07 + yukseklik, width: en * 1.15, height: en * 0.16, borderRadius: en, backgroundColor: 'rgba(0,0,0,0.20)', opacity: solukluk, boxShadow: `0 0 ${Math.round(en * 0.16)}px ${Math.round(en * 0.06)}px rgba(0,0,0,0.30)` as any }} />
      <View pointerEvents="none" style={{ position: 'absolute', left: -en * 0.30, top: -en * 0.035 + yukseklik, width: en * 0.62, height: en * 0.07, borderRadius: en, backgroundColor: 'rgba(0,0,0,0.42)', opacity: solukluk, boxShadow: `0 0 ${Math.round(en * 0.05)}px ${Math.round(en * 0.015)}px rgba(0,0,0,0.38)` as any }} />
    </>
  );
}

type Faz = 'yok' | 'girer' | 'iner' | 'durur' | 'kalkar' | 'ucar';
/** Masada kuzgun: `acik` iken sağ alt köşeye uçup konar; `gagaTetik` her artışında kartı gagalar; `cik` olunca kalkıp gider. */
export function KuzgunMasa({ w, h, acik, gagaTetik, cik, kartW = 0, kartH = 0 }: { w: number; h: number; acik: boolean; gagaTetik: number; cik: boolean; kartW?: number; kartH?: number }) {
  const kartOfs = KART_OFSET(w, h);
  const kusH = Math.min(h * 0.11, 96), K = kusH / KUS_DUNYA;
  const masaB = ORTHO.masa * K, ucusB = ORTHO.ucus * K;
  const inis = KUS_INIS(w, h);
  const [faz, fazAyarla] = useState<Faz>('yok');
  const [gaga, gagaAyarla] = useState(0);
  const [gagaYuklu, gagaYukluAyarla] = useState(false); // gaga kareleri çözülmeden bekleme karesi kalkmaz (titreme olmasın)
  useEffect(() => { if (gaga === 0) gagaYukluAyarla(false); }, [gaga]);
  const konum = useRef(new Animated.ValueXY({ x: w + ucusB * 0.5, y: h * 0.3 })).current;
  const olcek = useRef(new Animated.Value(0.55)).current;
  const kokFaz = useRef<Faz>('yok');
  const ayarla = (f: Faz) => { kokFaz.current = f; fazAyarla(f); };
  useEffect(() => { // giriş
    if (!acik || kokFaz.current !== 'yok') return;
    let iptal = false;
    (async () => {
      await bekle(900);
      if (iptal) return;
      konum.setValue({ x: w + ucusB * 0.45, y: h * 0.30 }); olcek.setValue(0.55);
      ayarla('girer');
      Animated.parallel([
        Animated.timing(konum.x, { toValue: inis.x, duration: 2600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(konum.y, { toValue: inis.y - ucusB * 0.02, duration: 2600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(olcek, { toValue: 1, duration: 2600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]).start(async () => {
        if (iptal) return;
        ayarla('iner'); await bekle(520); if (iptal) return; ayarla('durur');
      });
    })();
    return () => { iptal = true; };
  }, [acik]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { // gagalama
    if (gagaTetik <= 0 || kokFaz.current !== 'durur') return;
    gagaAyarla((g) => g + 1);
    const t = setTimeout(() => gagaAyarla(0), 3100);
    return () => clearTimeout(t);
  }, [gagaTetik]);
  useEffect(() => { // çıkış
    if (!cik || (kokFaz.current !== 'durur' && kokFaz.current !== 'iner')) return;
    let iptal = false;
    (async () => {
      ayarla('kalkar'); gagaAyarla(0); await bekle(560); if (iptal) return;
      ayarla('ucar');
      Animated.parallel([
        Animated.timing(konum.x, { toValue: -ucusB * 0.6, duration: 2200, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.timing(konum.y, { toValue: -h * 0.15, duration: 2200, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        Animated.timing(olcek, { toValue: 0.6, duration: 2200, useNativeDriver: true }),
      ]).start(() => { if (!iptal) ayarla('yok'); });
    })();
    return () => { iptal = true; };
  }, [cik]); // eslint-disable-line react-hooks/exhaustive-deps
  if (faz === 'yok') return null;
  const uc = faz === 'girer' || faz === 'ucar';
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View style={{ position: 'absolute', left: 0, top: 0, transform: [{ translateX: konum.x }, { translateY: konum.y }, { scale: olcek }] }}>
        {faz === 'durur' && <TemasGolgesi en={masaB * 0.62} yukseklik={masaB * 0.0} />}
        {faz === 'girer' && <Image source={KART_ARKA} contentFit="fill" style={{ position: 'absolute', left: kartOfs.dx - kartW / 2, top: kartOfs.dy - kartH / 2, width: kartW, height: kartH, borderRadius: 3, transform: [{ rotate: '-8deg' }] }} />}
        {uc && <Sprite ad="ucus_cirpma" boyut={ucusB} ayakOran={AYAK.ucus} />}
        {faz === 'iner' && <Sprite ad="ucus_inis" boyut={ucusB} ayakOran={AYAK.ucus} />}
        {faz === 'kalkar' && <Sprite ad="ucus_kalkis" boyut={ucusB} ayakOran={AYAK.ucus} />}
        {faz === 'durur' && !(gaga > 0 && gagaYuklu) && <Sprite ad="masa_bekle" boyut={masaB} ayakOran={AYAK.masa} />}
        {faz === 'durur' && gaga > 0 && <Sprite ad="masa_gaga" boyut={masaB} ayakOran={AYAK.masa} anahtar={`g${gaga}`} yuklendi={() => gagaYukluAyarla(true)} />}
      </Animated.View>
    </View>
  );
}
