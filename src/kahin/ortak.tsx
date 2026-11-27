// KULLANILMIYOR (04.11.2026): eski KAHİN astroloji/tarot ekranı. Astroloji ve Tarot Kart Analizi artık sitenin /astroloji/ ve /tarot/ sayfaları,
// uygulamada WebView ile (bilesenler/canli/SiteBolumu.native.tsx); hiçbir ekran bu dosyayı içe aktarmıyor. Kod başvuru için duruyor, silinmedi.
// KAHİN bölümü ortak parçalar (tarot + astroloji): renkler, döngü klibi, düğme, satın alma kutusu.
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Image } from 'expo-image';
import { yazi } from '@/tema/tema';
import { KLIP, type KlipAd } from './klipler';
import { ODEME_VAR, type UrunBilgi } from './odeme';
import { MagazaYonlendir } from '@/bilesenler/canli/UygulamaIndir';

export const ALTIN = '#F2C14E', MOR = '#8F72FF', YAZI = '#EDE9F6', SOLUK = 'rgba(237,233,246,0.62)', ZEMIN = '#0B0614';
export const bekle = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
// Tek oynatıcılı döngü klibi (sessiz). Siyah kare YOK: altta oturus_temiz posteri durur (klip başlangıç/bitiş karesi aynı), video ilk kareyi çizince üstte açılır;
// klip değişince önceki kare kalır (yüzey sökülüp takılmaz), yeni klibin ilk karesi gelene dek poster/önceki kare görünür.
const POSTER = require('../../assets/kahin/oturus.jpg');
export function Klip({ ad, stil }: { ad: KlipAd; stil: any }) {
  const p = useVideoPlayer(KLIP[ad], (o) => { o.loop = true; o.muted = true; o.play(); });
  const onceki = useRef(ad);
  const [hazir, hazirAyarla] = useState(false);
  useEffect(() => {
    if (onceki.current === ad) return;
    onceki.current = ad;
    p.replaceAsync(KLIP[ad]).then(() => { p.loop = true; p.muted = true; p.play(); }).catch(() => {});
  }, [ad, p]);
  return (
    <View style={[stil, { overflow: 'hidden', backgroundColor: ZEMIN }]}>
      <Image source={POSTER} contentFit="cover" transition={0} style={StyleSheet.absoluteFill} />
      <VideoView player={p} style={[StyleSheet.absoluteFill, { opacity: hazir ? 1 : 0 }]} contentFit="cover" surfaceType="surfaceView" nativeControls={false} allowsPictureInPicture={false} onFirstFrameRender={() => hazirAyarla(true)} />
    </View>
  );
}

export function Dugme({ yazi: y, onPress, birincil, buyuk, devre, esit }: { yazi: string; onPress: () => void; birincil?: boolean; buyuk?: boolean; devre?: boolean; esit?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={devre} accessibilityRole="button" accessibilityLabel={y} style={({ pressed }) => [s.dugme, birincil && s.dugmeBirincil, buyuk && { height: 52 }, esit && { flex: 1, marginTop: 0 }, pressed && { opacity: 0.8 }, devre && { opacity: 0.5 }]}>
      <Text style={[s.dugmeYazi, birincil && { color: '#1A1030' }]}>{y}</Text>
    </Pressable>
  );
}

// Satın alma kutusu (astroloji ekranları): yalnız uygulamada düğme; web'de "Uygulamada aç" (Onur: ödeme yalnız mobil uygulamada).
export function SatinKutusu({ baslik, liste, urunler, neden, yuk, satin, webAc }: { baslik: string; liste: { id: string; ad: string; birincil?: boolean }[]; urunler: UrunBilgi[]; neden: string; yuk: boolean; satin: (id: string) => void; webAc: () => void }) {
  return (
    <View style={s.satinKutu}>
      <Text style={s.satinBaslik}>{baslik}</Text>
      {!ODEME_VAR && Platform.OS === 'ios' ? (
        // 13.11 (App Store 3.1.1/3.1.3): iPhone uygulamasında ödeme kapalı; başka yere satın alma yönlendirmesi yok
        <Text style={s.satinYazi}>Bu yorumun devamı bu cihazda henüz açık değil.</Text>
      ) : !ODEME_VAR ? (
        <>
          <Text style={s.satinYazi}>Bu yorum yalnız Yazsam mı? uygulamasından satın alınır.</Text>
          <MagazaYonlendir />
        </>
      ) : neden || urunler.length === 0 ? (
        <Text style={s.satinYazi}>Satın alma bu cihazda şu an kullanılamıyor (Google Play gerekli).</Text>
      ) : (
        liste.map((u) => <Dugme key={u.id} yazi={`${u.ad}${urunler.find((x) => x.id === u.id)?.fiyat ? ` · ${urunler.find((x) => x.id === u.id)!.fiyat}` : ''}`} onPress={() => satin(u.id)} birincil={u.birincil} devre={yuk} />)
      )}
    </View>
  );
}

/** Alt ekran çerçevesi: koyu zemin, geri düğmesi + başlık, kaydırılır içerik (KAHİN bölümü) */
export function Cerceve({ baslik, alt, geri, children }: { baslik: string; alt?: string; geri: () => void; children: React.ReactNode }) {
  const ek = useSafeAreaInsets();
  const ust = Math.max(ek.top, Platform.OS === 'android' ? 24 : 12), altPay = Math.max(ek.bottom, 10);
  return (
    <View style={{ flex: 1, backgroundColor: ZEMIN }}>
      <LinearGradient colors={['#1A0F30', ZEMIN]} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 320 }} pointerEvents="none" />
      <View style={{ paddingTop: ust + 6, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Pressable onPress={geri} accessibilityLabel="Geri" accessibilityRole="button" style={s.geriDugme}><Text style={{ color: YAZI, fontSize: 24, lineHeight: 28 }}>‹</Text></Pressable>
        <View style={{ flex: 1 }}>
          <Text style={s.cBaslik} numberOfLines={1}>{baslik}</Text>
          {!!alt && <Text style={s.cAlt} numberOfLines={1}>{alt}</Text>}
        </View>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: altPay + 24 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>{children}</ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  geriDugme: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(237,233,246,0.1)', alignItems: 'center', justifyContent: 'center' },
  cBaslik: { fontFamily: yazi.marka, fontSize: 20, color: ALTIN, letterSpacing: 1 },
  cAlt: { fontFamily: yazi.kalem, fontSize: 19, color: YAZI, marginTop: -2 },
  dugme: { height: 46, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(237,233,246,0.28)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, marginTop: 8 },
  dugmeBirincil: { backgroundColor: ALTIN, borderColor: ALTIN },
  dugmeYazi: { fontFamily: yazi.kalin, fontSize: 15.5, color: YAZI },
  satinKutu: { backgroundColor: 'rgba(30,20,52,0.9)', borderRadius: 18, padding: 16, borderColor: 'rgba(242,193,78,0.35)', borderWidth: 1, marginTop: 8 },
  satinBaslik: { fontFamily: yazi.kalin, fontSize: 17, color: ALTIN, marginBottom: 6 },
  satinYazi: { fontFamily: yazi.normal, fontSize: 14.5, lineHeight: 21, color: YAZI, marginBottom: 6 },
});
