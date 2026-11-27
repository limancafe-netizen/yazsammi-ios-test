// KULLANILMIYOR (04.11.2026): eski KAHİN astroloji/tarot ekranı. Astroloji ve Tarot Kart Analizi artık sitenin /astroloji/ ve /tarot/ sayfaları,
// uygulamada WebView ile (bilesenler/canli/SiteBolumu.native.tsx); hiçbir ekran bu dosyayı içe aktarmıyor. Kod başvuru için duruyor, silinmedi.
// Sesli yorum okuyucu (doğum haritası ve uyum yorumları): parçalar sırayla Kore sesiyle çalar, yazı vurgulanır ve kayar.
// Üstte KAHİN klibi (bekleme) arka plan, köşede duygu klibi; duraklat / ileri / kapat. Dudak eşleme yok (karar 28.10).
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as C from '@/canli';
import { yazi } from '@/tema/tema';
import { duyguKlip, type KlipAd } from './klipler';
import { ALTIN, SOLUK, YAZI, ZEMIN, bekle, Dugme, Klip } from './ortak';
import { YASAL_IBARE } from '@/kahin/yasal';

export function YorumOkuyucu({ baslik, ozet, parcalar, kapat, ekDugme }: { baslik: string; ozet: string; parcalar: C.AstroParca[]; kapat: () => void; ekDugme?: { yazi: string; onPress: () => void } }) {
  const { height } = useWindowDimensions();
  const ek = useSafeAreaInsets();
  const ust = Math.max(ek.top, Platform.OS === 'android' ? 24 : 12), alt = Math.max(ek.bottom, 10);
  const [no, noAyarla] = useState(-1);
  const [bitti, bittiAyarla] = useState(false);
  const [duraklat, duraklatAyarla] = useState(false);
  const [ses, sesAyarla] = useState(false);
  const bay = useRef({ duraklat: false, atla: false, canli: true, tur: 0 });
  const oyn = useRef<AudioPlayer | null>(null);
  const kap = useRef<ScrollView>(null);
  const yerler = useRef<number[]>([]);
  bay.current.duraklat = duraklat;
  useEffect(() => { setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'duckOthers', shouldPlayInBackground: false }).catch(() => {}); }, []);
  useEffect(() => {
    bay.current.canli = true;
    const tur = ++bay.current.tur;
    const aktif = () => bay.current.canli && tur === bay.current.tur;
    (async () => {
      await bekle(400);
      for (let i = 0; i < parcalar.length && aktif(); i++) {
        const p = parcalar[i];
        noAyarla(i);
        let bit = false, o: AudioPlayer | null = null;
        const tahmin = Math.max(4000, (p.sure ?? p.metin.length / 15) * 1000 + 1500);
        if (p.ses) { try { o = createAudioPlayer({ uri: C.kahinSesAdres(p.ses) }); oyn.current = o; (o as any).addListener('playbackStatusUpdate', (s: any) => { if (s.didJustFinish) bit = true; }); o.play(); sesAyarla(true); } catch { o = null; } } else sesAyarla(false);
        let gecen = 0, pause = false;
        while (!bit && !bay.current.atla && aktif()) {
          await bekle(120);
          if (bay.current.duraklat !== pause) { pause = bay.current.duraklat; try { pause ? o?.pause() : o?.play(); } catch {} }
          if (!pause) gecen += 120;
          if (gecen > tahmin + 25000 || (!o && gecen >= tahmin)) break;
        }
        bay.current.atla = false;
        try { o?.pause(); o?.remove(); } catch {}
        if (oyn.current === o) oyn.current = null;
      }
      if (aktif()) { noAyarla(-1); bittiAyarla(true); sesAyarla(false); }
    })();
    return () => { bay.current.canli = false; try { oyn.current?.remove(); } catch {} };
  }, [parcalar]);
  useEffect(() => { if (no >= 0 && yerler.current[no] != null) kap.current?.scrollTo({ y: Math.max(0, yerler.current[no] - (ust + 76)), animated: true }); }, [no]);
  const klip: KlipAd = ses && no >= 0 ? duyguKlip(parcalar[no].duygu) : 'bekleme';
  const kapatTikla = () => { bay.current.canli = false; bay.current.tur++; try { oyn.current?.remove(); } catch {} kapat(); };
  return (
    <View style={[s.kok, { backgroundColor: ZEMIN }]}>
      <Klip ad="bekleme" stil={{ position: 'absolute', top: 0, left: 0, right: 0, height: height * 0.42 }} />
      <LinearGradient colors={['rgba(11,6,20,0.65)', 'rgba(11,6,20,0.0)', ZEMIN, ZEMIN]} locations={[0, 0.12, 0.42, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />
      <View style={[s.ust, { paddingTop: ust + 6 }]}>
        <View style={s.pip} pointerEvents="none"><Klip ad={klip} stil={StyleSheet.absoluteFill} /></View>
        <Text style={s.baslik} numberOfLines={2}>{baslik}</Text>
        {!bitti && <Pressable onPress={() => duraklatAyarla((d) => !d)} accessibilityLabel={duraklat ? 'Devam' : 'Duraklat'} style={s.mini}><Text style={s.miniYazi}>{duraklat ? '▶' : '❚❚'}</Text></Pressable>}
        {!bitti && <Pressable onPress={() => { bay.current.atla = true; }} accessibilityLabel="İleri" style={s.mini}><Text style={s.miniYazi}>▸▸</Text></Pressable>}
        <Pressable onPress={kapatTikla} accessibilityLabel="Kapat" style={s.mini}><Text style={s.miniYazi}>✕</Text></Pressable>
      </View>
      <ScrollView ref={kap} style={{ flex: 1 }} contentContainerStyle={{ paddingTop: Math.max(height * 0.2, ust + 76), paddingHorizontal: 18, paddingBottom: alt + 90 }} showsVerticalScrollIndicator={false}>
        {!!ozet && <Text style={s.ozet}>{ozet}</Text>}
        {parcalar.map((p, i) => (
          <View key={i} onLayout={(e) => { yerler.current[i] = e.nativeEvent.layout.y; }} style={[s.kutu, no === i && s.kutuAktif, (no > i || bitti) && { opacity: 0.85 }]}>
            {!!p.baslik && <Text style={[s.altBaslik, no === i && { color: ALTIN }]}>{p.baslik}</Text>}
            <Text style={s.metin}>{p.metin}</Text>
          </View>
        ))}
        <Text style={s.eglence}>{YASAL_IBARE}</Text>
        {bitti && (
          <View style={{ marginTop: 6 }}>
            {ekDugme && <Dugme yazi={ekDugme.yazi} onPress={ekDugme.onPress} birincil buyuk />}
            <Dugme yazi="Kapat" onPress={kapatTikla} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  kok: { flex: 1 },
  ust: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 8, gap: 6, zIndex: 5, backgroundColor: '#0B0614', borderBottomWidth: 1, borderBottomColor: 'rgba(242,193,78,0.25)' },
  pip: { width: 48, height: 48, borderRadius: 24, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(242,193,78,0.7)', backgroundColor: '#000' },
  baslik: { flex: 1, fontFamily: yazi.kalin, fontSize: 15, color: ALTIN, marginLeft: 6, textShadowColor: '#000', textShadowRadius: 6 },
  mini: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: 'rgba(237,233,246,0.3)', backgroundColor: 'rgba(11,6,20,0.6)', alignItems: 'center', justifyContent: 'center' },
  miniYazi: { color: YAZI, fontSize: 14, fontFamily: yazi.kalin },
  ozet: { fontFamily: yazi.kalem, fontSize: 24, lineHeight: 28, color: ALTIN, marginBottom: 12 },
  kutu: { backgroundColor: 'rgba(30,20,52,0.82)', borderRadius: 18, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(237,233,246,0.1)' },
  kutuAktif: { borderColor: ALTIN, backgroundColor: 'rgba(52,34,86,0.94)' },
  altBaslik: { fontFamily: yazi.kalin, fontSize: 14, color: SOLUK, marginBottom: 6 },
  metin: { fontFamily: yazi.normal, fontSize: 15.5, lineHeight: 23, color: YAZI },
  eglence: { fontFamily: yazi.normal, fontSize: 12, lineHeight: 17, color: SOLUK, fontStyle: 'italic', marginTop: 4, marginBottom: 8 },
});
