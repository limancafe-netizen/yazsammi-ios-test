// Marka videosu (uygulama, expo-video): sitedeki gibi sessiz + döngülü; ekranda en az %60 görünürken kendiliğinden oynar,
// görünmeyince durur. Dokununca ses açılır/kapanır (aynı anda tek sesli video). Uygulama arka plana geçince durur.
import { useEffect, useRef, useState } from 'react';
import { AppState, Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent } from 'expo';
import { SITE } from '@/analiz';
import { yazi } from '@/tema/tema';
import { Ikon } from './ortak';

type Oynatici = ReturnType<typeof useVideoPlayer>;
let sesliOlan: Oynatici | null = null;
const tam = (u: string) => (u.startsWith('http') ? u : `${SITE}${u.startsWith('/') ? '' : '/'}${u}`);

export function Video({ kaynak, kapak, genislik = 250 }: { kaynak: string; kapak?: string; genislik?: number }) {
  const kutu = useRef<View>(null);
  const { height: ekranBoy } = useWindowDimensions();
  const [ilkKare, ilkKareAyarla] = useState(false);
  const [ilerleme, ilerlemeAyarla] = useState(0);
  const oynatici = useVideoPlayer(tam(kaynak), (p) => {
    p.loop = true;
    p.muted = true;
    p.timeUpdateEventInterval = 0.25;
  });
  const { muted: sessiz } = useEvent(oynatici, 'mutedChange', { muted: oynatici.muted });

  useEffect(() => {
    const z = oynatici.addListener('timeUpdate', ({ currentTime }) => {
      const d = oynatici.duration;
      if (d > 0) ilerlemeAyarla(currentTime / d);
    });
    return () => z.remove();
  }, [oynatici]);

  // Görünürlük: yarım saniyede bir kutunun ekrandaki yeri ölçülür (akış ScrollView, satır bazlı görünürlük bilgisi yok).
  useEffect(() => {
    let oynuyor = false;
    let onPlanda = AppState.currentState === 'active';
    const durdur = () => {
      if (!oynuyor) return;
      oynuyor = false;
      try {
        oynatici.pause();
        if (!oynatici.muted) oynatici.muted = true;
      } catch {}
    };
    const bak = () => {
      const v = kutu.current;
      if (!v || !onPlanda) return durdur();
      v.measureInWindow((_x, y, _w, h) => {
        if (!h) return durdur();
        const gorunen = Math.max(0, Math.min(y + h, ekranBoy) - Math.max(y, 0));
        if (gorunen / h >= 0.6) {
          if (!oynuyor) {
            oynuyor = true;
            try {
              oynatici.play();
            } catch {}
          }
        } else durdur();
      });
    };
    const t = setInterval(bak, 500);
    const a = AppState.addEventListener('change', (d) => {
      onPlanda = d === 'active';
      if (!onPlanda) durdur();
    });
    bak();
    return () => {
      clearInterval(t);
      a.remove();
      if (sesliOlan === oynatici) sesliOlan = null;
    };
  }, [oynatici, ekranBoy]);

  const sesDegistir = () => {
    try {
      if (oynatici.muted) {
        if (sesliOlan && sesliOlan !== oynatici) {
          try {
            sesliOlan.muted = true;
          } catch {}
        }
        sesliOlan = oynatici;
        oynatici.muted = false;
        oynatici.play();
      } else oynatici.muted = true;
    } catch {}
  };

  return (
    <Pressable ref={kutu} onPress={sesDegistir} accessibilityRole="button" accessibilityLabel={sessiz ? 'Sesi aç' : 'Sesi kapat'} style={[s.kap, { width: genislik, maxWidth: '100%' }]}>
      <VideoView player={oynatici} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} surfaceType="textureView" onFirstFrameRender={() => ilkKareAyarla(true)} />
      {!!kapak && !ilkKare && <Image source={{ uri: tam(kapak) }} style={StyleSheet.absoluteFill} resizeMode="cover" />}
      <View style={s.sesKutu} pointerEvents="none">
        <Ikon ad={sessiz ? 'sesKapali' : 'sesAcik'} boyut={16} renk="#fff" kalinlik={2.2} />
      </View>
      {sessiz && (
        <View style={s.ipucu} pointerEvents="none">
          <Text style={s.ipucuYazi}>Ses için dokun</Text>
        </View>
      )}
      <View style={s.cubukZemin} pointerEvents="none">
        <View style={[s.cubuk, { width: `${Math.round(ilerleme * 100)}%` }]} />
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  kap: { aspectRatio: 9 / 16, borderRadius: 20, overflow: 'hidden', backgroundColor: '#120E1E' },
  sesKutu: { position: 'absolute', right: 10, bottom: 14, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(10,6,20,0.55)', alignItems: 'center', justifyContent: 'center' },
  ipucu: { position: 'absolute', left: 10, bottom: 16, borderRadius: 999, backgroundColor: 'rgba(10,6,20,0.55)', paddingHorizontal: 10, paddingVertical: 5 },
  ipucuYazi: { color: '#fff', fontFamily: yazi.orta, fontSize: 12 },
  cubukZemin: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, backgroundColor: 'rgba(255,255,255,0.18)' },
  cubuk: { height: 3, backgroundColor: '#fff' },
});
