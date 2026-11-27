// KULLANILMIYOR (04.11.2026): eski KAHİN astroloji/tarot ekranı. Astroloji ve Tarot Kart Analizi artık sitenin /astroloji/ ve /tarot/ sayfaları,
// uygulamada WebView ile (bilesenler/canli/SiteBolumu.native.tsx); hiçbir ekran bu dosyayı içe aktarmıyor. Kod başvuru için duruyor, silinmedi.
// KAHİN bölümü (29.10): TAROT + ASTROLOJİ tek bölüm, birbirine bağlı. Merkez ekran → Tarot okuması · Doğum haritam · Burçlar · Uyum.
// Bağlantılar: tarot, doğum bilgisi varsa burcunu ve bugünkü gökyüzünü yoruma katar.
// 03.11 (Onur, astroloji taslak 3 onayı): Doğum haritam · Burçlar · Uyum artık eski yerel ekranlarda (BurclarEkrani/HaritaEkrani/UyumEkrani) açılmaz;
// sitenin /astroloji/ bölümüne gider (uygulamada WebView yok → tarayıcıda; webde aynı sekmede). Doğum bilgisi o sayfada yalnız cihazda kalır.
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as C from '@/canli';
import { useCanli } from '@/bilesenler/canli/baglam';
import { yazi } from '@/tema/tema';
import { astrolojiAc } from '@/bilesenler/canli/bolumler';
import { OdaTarot } from './Oda';
import { Sahne, type SahneTutamak } from './Sahne';
import { ALTIN, SOLUK, YAZI, ZEMIN } from './ortak';
import { YASAL_IBARE } from '@/kahin/yasal';

type Ek = 'merkez' | 'tarot' | 'harita' | 'burc' | 'uyum';
const BURC_AD = ['Koç', 'Boğa', 'İkizler', 'Yengeç', 'Aslan', 'Başak', 'Terazi', 'Akrep', 'Yay', 'Oğlak', 'Kova', 'Balık'];
export function Kahin({ geri }: { geri: () => void }) {
  const c = useCanli();
  const { width, height } = useWindowDimensions();
  const ek = useSafeAreaInsets();
  const ust = Math.max(ek.top, Platform.OS === 'android' ? 24 : 12), alt = Math.max(ek.bottom, 10);
  const girisli = !!c.uye && !c.uye.yeni;
  const [ekran, ekranAyarla] = useState<Ek>('merkez');
  const sahne = useRef<SahneTutamak>(null);
  useEffect(() => { if (ekran === 'merkez') { const z = setTimeout(() => sahne.current?.oynat('bekleme', { dongu: true }), 200); return () => clearTimeout(z); } }, [ekran]);
  const [tarotSoru, tarotSoruAyarla] = useState('');
  const [durum, durumAyarla] = useState<C.AstroDurum | null>(null);
  const [ozet, ozetAyarla] = useState<C.AstroHarita['ozet'] | null>(null);
  useEffect(() => {
    if (ekran !== 'merkez') return;
    C.astroDurum().then(async (d) => {
      if (!d.ok) return;
      durumAyarla(d.veri);
      if (d.veri.profil) { const h = await C.astroHaritaGetir(); ozetAyarla(h.ok ? h.veri.ozet : null); } else ozetAyarla(null);
    });
  }, [ekran, girisli]);
  const merkeze = () => { tarotSoruAyarla(''); ekranAyarla('merkez'); };
  // Astroloji kartları yeni bölümün ilgili yerine gider (#/harita · #/burc/<0-11> · #/ask); tarot bu ekranda kalır.
  const ac = (k: Ek) => {
    if (k === 'tarot') return ekranAyarla('tarot');
    const no = ozet ? BURC_AD.indexOf(ozet.gunes) : -1;
    astrolojiAc(undefined, k === 'harita' ? '#/harita' : k === 'uyum' ? '#/ask' : no >= 0 ? `#/burc/${no}` : '');
  };

  if (ekran === 'tarot') return <OdaTarot key={tarotSoru} geri={merkeze} onSoru={tarotSoru} astroProfil={!!durum?.profil} />;

  const kartlar: { ad: Ek; baslik: string; alt: string; sembol: string }[] = [
    { ad: 'tarot', baslik: 'Tarot okuması', alt: 'Kartlar masada, KAHİN sesiyle yorumlar', sembol: '🂡' },
    { ad: 'harita', baslik: 'Doğum haritam', alt: ozet ? `Güneş ${ozet.gunes} · Ay ${ozet.ay}${ozet.yukselen ? ` · Yükselen ${ozet.yukselen}` : ''}` : 'Doğum bilgini gir, haritanı çıkaralım', sembol: '☉' },
    { ad: 'burc', baslik: 'Burçlar', alt: ozet ? `Bugün için ${ozet.gunes}` : 'Günlük ve haftalık yorum', sembol: '♈︎' },
    { ad: 'uyum', baslik: 'Uyum', alt: 'İki kişinin haritası: aşk, iletişim, çekim', sembol: '♀' },
  ];
  return (
    <View style={{ flex: 1, backgroundColor: ZEMIN }}>
      <Sahne ref={sahne} stil={{ bottom: height * 0.5 }} />
      <LinearGradient colors={['rgba(11,6,20,0.7)', 'rgba(11,6,20,0.05)', 'rgba(11,6,20,0)', ZEMIN, ZEMIN]} locations={[0, 0.12, 0.25, 0.52, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />
      <Pressable onPress={geri} accessibilityLabel="Geri" style={[s.geri, { top: ust + 6 }]}><Text style={{ color: YAZI, fontSize: 24, lineHeight: 28 }}>‹</Text></Pressable>
      <View style={[s.baslikKap, { top: ust + 4 }]} pointerEvents="none"><Text style={s.baslik}>KAHİN</Text><Text style={s.altBaslik}>Tarot & Astroloji</Text></View>
      <ScrollView style={StyleSheet.absoluteFill} contentContainerStyle={{ paddingTop: height * 0.38, paddingHorizontal: 18, paddingBottom: alt + 20 }} showsVerticalScrollIndicator={false}>
        {kartlar.map((k) => (
          <Pressable key={k.ad} onPress={() => ac(k.ad)} accessibilityRole="button" accessibilityLabel={k.baslik} style={({ pressed }) => [s.kart, pressed && { opacity: 0.8 }]}>
            <View style={s.sembolKap}><Text style={s.sembol}>{k.sembol}</Text></View>
            <View style={{ flex: 1 }}><Text style={s.kBaslik}>{k.baslik}</Text><Text style={s.kAlt} numberOfLines={2}>{k.alt}</Text></View>
            <Text style={s.ok}>›</Text>
          </Pressable>
        ))}
        {girisli && durum && !durum.profil && <Text style={s.ipucu}>İpucu: doğum bilgini girersen tarot yorumları burcunu ve bugünkü gökyüzünü de hesaba katar.</Text>}
        <Text style={s.alt}>{YASAL_IBARE} Yapay zekâ karakteri KAHİN yorum yapar.</Text>
      </ScrollView>
    </View>
  );
}
const s = StyleSheet.create({
  geri: { position: 'absolute', left: 10, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(11,6,20,0.55)', alignItems: 'center', justifyContent: 'center', zIndex: 5 },
  baslikKap: { position: 'absolute', left: 60, right: 60, alignItems: 'center' },
  baslik: { fontFamily: yazi.marka, fontSize: 28, color: ALTIN, letterSpacing: 4, textShadowColor: '#000', textShadowRadius: 8 },
  altBaslik: { fontFamily: yazi.kalem, fontSize: 22, color: YAZI, textShadowColor: '#000', textShadowRadius: 8 },
  kart: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: 'rgba(30,20,52,0.9)', borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(242,193,78,0.28)' },
  sembolKap: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(242,193,78,0.14)', alignItems: 'center', justifyContent: 'center' },
  sembol: { fontSize: 26, color: ALTIN, fontFamily: yazi.kalin },
  kBaslik: { fontFamily: yazi.kalin, fontSize: 18, color: YAZI },
  kAlt: { fontFamily: yazi.normal, fontSize: 13.5, lineHeight: 19, color: SOLUK, marginTop: 2 },
  ok: { color: ALTIN, fontSize: 28, lineHeight: 30 },
  ipucu: { fontFamily: yazi.orta, fontSize: 13.5, lineHeight: 19, color: ALTIN, textAlign: 'center', marginTop: 6 },
  alt: { fontFamily: yazi.normal, fontSize: 11.5, lineHeight: 16, color: 'rgba(237,233,246,0.45)', textAlign: 'center', marginTop: 14 },
});
