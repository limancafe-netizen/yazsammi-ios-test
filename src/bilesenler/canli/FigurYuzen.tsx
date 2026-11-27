// 1.7.3 (Onur 11.11): uygulamada canlı asistan figürü. Sitedeki gibi: GECE = Fener, GÜNDÜZ = Bukalemun (uygulamanın gece/gündüz temasını izler).
//  - YuzenFigur: Canlı akışta sağ altta yüzen figür + konuşma balonu. Sürüklenir, dokununca konuşur, × ile kapatılır (kapatınca o gün çıkmaz).
//  - FigurKose: Tribün / Ekonomi / Astroloji / Tarot başlığının köşesinde küçük, dokunulmaz figür (Tribün, Astroloji ve Tarot hep gece: Fener).
// Figür hep içeriğe bakar: sağ yarıdayken Fener aynalanır (bakışı sola, ekranın içine döner). İlk sürümde yalnız duran poster; video yok.
// Posterler: assets/figur (sitenin acilis/klip/<figür>/poster.webp dosyaları). Fener'in ağzına ve Bukalemun'un gözüne DOKUNULMAZ (yalnız aynalama).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image as AnimResim } from 'expo-image';
import { Animated, Image, PanResponder, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { depoOku, depoYaz } from '@/depo';
import { yazi } from '@/tema/tema';
import { useTema } from '@/tema/TemaSaglayici';
import { klipSec, klipSure, type Klip } from './figurKlip';
import { KLIP_DOSYALARI } from './figurKlipDosya';

type Figur = 'fener' | 'bukalemun';
const RESIM: Record<Figur, number> = {
  fener: require('../../../assets/figur/fener.webp'),
  bukalemun: require('../../../assets/figur/bukalemun.webp'),
};
// 1.9.0: ek hareket yuvası. klip null (dosya yok / kural yasaklıyor) → bugünkü durağan poster AYNEN; klip varsa animasyonlu WebP (expo-image) oynar.
function FigurResim({ ad, klip, style }: { ad: Figur; klip: Klip | null; style: any }) {
  const dosya = klip ? KLIP_DOSYALARI[ad][klip] : undefined;
  if (dosya == null) return <Image source={RESIM[ad]} resizeMode="contain" accessibilityIgnoresInvertColors style={style} />;
  return <AnimResim source={dosya} contentFit="contain" accessibilityIgnoresInvertColors style={style} />;
}
const KAPALI = 'yazsammi_figur_kapali'; // son kapatılan gün (yyyy-aa-gg)
const YER = 'yazsammi_figur_yer'; // sürüklenen konum {x,y}: varsayılan köşeye göre kayma
const BOY = 96;

const bugun = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
const selam = () => { const s = new Date().getHours(); return s >= 5 && s < 11 ? 'Günaydın!' : s >= 11 && s < 18 ? 'İyi günler!' : s >= 18 && s < 23 ? 'İyi akşamlar!' : 'İyi geceler!'; };
const SOZ: Record<Figur, string[]> = {
  fener: ['Işığım hazır. Bugün ne yazsak?', 'Akışta yeni şeyler var, bir göz at.', 'Tribün, Ekonomi, Oyun… yukarıdan seç.', 'Bir şey yazmak istersen ortadaki Yaz\'a dokun.'],
  bukalemun: ['Renklerim yerinde. Bugün ne yazsak?', 'Akışta yeni şeyler var, bir göz at.', 'Tribün, Ekonomi, Oyun… yukarıdan seç.', 'Bir şey yazmak istersen ortadaki Yaz\'a dokun.'],
};
let oturumdaKonustu = false; // açılışta balon oturum başına bir kez kendiliğinden çıkar

function figurAd(gece: boolean, hepGece = false): Figur {
  return hepGece || gece ? 'fener' : 'bukalemun';
}

// İçeriğe bakış: Fener'in bakışı poster'da sağa, Bukalemun'unki sola; sağ yarıdaki figür içeri (sola) bakmalı.
function aynala(ad: Figur, sagYarida: boolean) {
  return ad === 'fener' ? sagYarida : !sagYarida;
}

export function YuzenFigur() {
  const { gece } = useTema();
  const ek = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const ad = figurAd(gece);
  const [kapali, kapaliAyarla] = useState(() => depoOku(KAPALI) === bugun());
  const [balon, balonAyarla] = useState<string | null>(null);
  const [klip, klipAyarla] = useState<Klip | null>(null);
  const sira = useRef(0);
  const zaman = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [sag, sagAyarla] = useState(true);
  const konum = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const son = useRef({ x: 0, y: 0 });
  const sinir = useMemo(() => ({ xMin: -(width - BOY - 24), yMin: -(height - ek.top - ek.bottom - 260) }), [width, height, ek.top, ek.bottom]);

  useEffect(() => {
    try {
      const k = JSON.parse(depoOku(YER) || 'null');
      if (k && typeof k.x === 'number' && typeof k.y === 'number') {
        const x = Math.max(sinir.xMin, Math.min(0, k.x)), y = Math.max(sinir.yMin, Math.min(0, k.y));
        son.current = { x, y }; konum.setValue({ x, y }); sagAyarla(x > sinir.xMin / 2);
      }
    } catch {}
  }, []);

  const sustur = () => { if (zaman.current) clearTimeout(zaman.current); zaman.current = null; };
  const soyle = useCallback((ilk: boolean) => {
    const l = SOZ[ad];
    const m = ilk ? `${selam()} ${l[0]}` : l[sira.current % l.length];
    sira.current += 1; balonAyarla(m); sustur();
    const k = klipSec(ad, ilk ? ['selam', 'konus', 'sevinc'] : ['dokun_tepki', 'konus', 'sevinc', 'merakli'], KLIP_DOSYALARI);
    klipAyarla(k);
    zaman.current = setTimeout(() => { balonAyarla(null); klipAyarla(null); }, k ? Math.max(6500, klipSure(k)) : 6500);
  }, [ad]);
  useEffect(() => {
    if (kapali || oturumdaKonustu) return;
    const t = setTimeout(() => { oturumdaKonustu = true; soyle(true); }, 1600);
    return () => clearTimeout(t);
  }, [kapali, soyle]);
  useEffect(() => sustur, []);

  const kaydir = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) + Math.abs(g.dy) > 8,
    onPanResponderGrant: () => { konum.setOffset({ x: son.current.x, y: son.current.y }); konum.setValue({ x: 0, y: 0 }); },
    onPanResponderMove: (_, g) => {
      const x = Math.max(sinir.xMin - son.current.x, Math.min(-son.current.x, g.dx));
      const y = Math.max(sinir.yMin - son.current.y, Math.min(-son.current.y, g.dy));
      konum.setValue({ x, y });
    },
    onPanResponderRelease: (_, g) => {
      const x = Math.max(sinir.xMin, Math.min(0, son.current.x + g.dx)), y = Math.max(sinir.yMin, Math.min(0, son.current.y + g.dy));
      konum.flattenOffset(); konum.setValue({ x, y }); son.current = { x, y }; sagAyarla(x > sinir.xMin / 2);
      depoYaz(YER, JSON.stringify({ x, y }));
    },
  }), [sinir]);

  if (kapali) return null;
  const kapat = () => { depoYaz(KAPALI, bugun()); sustur(); kaydet(); };
  const kaydet = () => kapaliAyarla(true);
  return (
    <Animated.View style={[s.yuzen, { right: 12, bottom: 14, transform: konum.getTranslateTransform() }]} pointerEvents="box-none" {...kaydir.panHandlers}>
      {!!balon && (
        <Pressable onPress={() => balonAyarla(null)} accessibilityRole="button" accessibilityLabel="Konuşmayı kapat" style={[s.balon, gece ? s.balonGece : s.balonGunduz, sag ? { right: 4 } : { left: 4 }]}>
          <Text style={[s.balonYazi, { color: gece ? '#F4EEFF' : '#2A1B3D' }]}>{balon}</Text>
        </Pressable>
      )}
      <Pressable onPress={() => soyle(false)} accessibilityRole="button" accessibilityLabel={ad === 'fener' ? 'Fener, asistan. Dokun, konuşsun' : 'Bukalemun, asistan. Dokun, konuşsun'} style={s.figurKap}>
        <FigurResim ad={ad} klip={klip} style={[s.resim, aynala(ad, sag) && { transform: [{ scaleX: -1 }] }]} />
      </Pressable>
      <Pressable onPress={kapat} hitSlop={10} accessibilityRole="button" accessibilityLabel="Figürü bugün gizle" style={[s.kapat, sag ? { left: 6 } : { right: 6 }, { backgroundColor: gece ? 'rgba(20,16,36,0.88)' : 'rgba(255,255,255,0.92)', borderColor: gece ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)' }]}>
        <Text style={[s.kapatX, { color: gece ? '#D9D2EE' : '#3B2F52' }]}>×</Text>
      </Pressable>
    </Animated.View>
  );
}

// Başlık köşesi: Tribün, Ekonomi (arama düğmesinin solu), Astroloji, Tarot (sağ üst).
export function FigurKose({ ekran }: { ekran: string }) {
  const { gece } = useTema();
  const ek = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const hepGece = ekran === 'astroloji' || ekran === 'kahin' || ekran === 'tribun'; // bu üç bölüm her zaman koyu (koyu ekran = Fener)
  const ad = figurAd(gece, hepGece);
  if (ekran === 'tribun' && width < 400) return null; // dar telefonda başlıkta yer yok
  const solaYakin = ekran === 'tribun' || ekran === 'ekonomi';
  const boy = ekran === 'tribun' ? 36 : 46;
  const sag = solaYakin ? (ekran === 'tribun' ? 60 : 62) : 14; // arama düğmesinin solunda
  const ust = ek.top + (ekran === 'tribun' ? 20 : ekran === 'ekonomi' ? 10 : 8);
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: ust, right: sag, width: boy, height: boy }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Image source={RESIM[ad]} resizeMode="contain" accessibilityIgnoresInvertColors style={[{ width: boy, height: boy }, aynala(ad, true) && { transform: [{ scaleX: -1 }] }]} />
    </View>
  );
}

const s = StyleSheet.create({
  yuzen: { position: 'absolute', alignItems: 'flex-end', width: BOY + 4 },
  figurKap: { width: BOY, height: BOY },
  resim: { width: BOY, height: BOY },
  balon: { position: 'absolute', bottom: BOY - 6, width: 196, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 18, borderBottomRightRadius: 6, zIndex: 3, elevation: 6 },
  balonGece: { backgroundColor: '#2A2340' },
  balonGunduz: { backgroundColor: '#FFF6E3', borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' },
  balonYazi: { fontSize: 14, lineHeight: 19, fontFamily: yazi.orta },
  kapat: { position: 'absolute', top: 0, width: 22, height: 22, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center', zIndex: 4 },
  kapatX: { fontSize: 15, lineHeight: 17, fontFamily: yazi.kalin },
});
