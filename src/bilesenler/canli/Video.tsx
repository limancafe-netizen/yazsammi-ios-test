// Marka videosu (web): sessiz, döngülü, ekrana girince kendiliğinden oynar; dokununca ses açılır/kapanır.
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { yazi } from '@/tema/tema';
import { Ikon } from './ortak';

let sesliOlan: HTMLVideoElement | null = null;

export function Video({ kaynak, kapak, genislik = 250 }: { kaynak: string; kapak?: string; genislik?: number }) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [sessiz, sessizAyarla] = useState(true);
  const [ilerleme, ilerlemeAyarla] = useState(0);
  useEffect(() => {
    const v = ref.current;
    if (!v || typeof IntersectionObserver === 'undefined') return;
    const g = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && e.intersectionRatio >= 0.6) v.play().catch(() => {});
        else {
          v.pause();
          if (!v.muted) {
            v.muted = true;
            sessizAyarla(true);
          }
        }
      },
      { threshold: [0, 0.6, 1] },
    );
    g.observe(v);
    const zaman = () => v.duration && ilerlemeAyarla(v.currentTime / v.duration);
    v.addEventListener('timeupdate', zaman);
    const sesDegisti = () => sessizAyarla(v.muted);
    v.addEventListener('volumechange', sesDegisti);
    return () => {
      g.disconnect();
      v.removeEventListener('timeupdate', zaman);
      v.removeEventListener('volumechange', sesDegisti);
    };
  }, []);
  const sesDegistir = () => {
    const v = ref.current;
    if (!v) return;
    if (v.muted) {
      if (sesliOlan && sesliOlan !== v) sesliOlan.muted = true;
      sesliOlan = v;
      v.muted = false;
      v.play().catch(() => {});
    } else v.muted = true;
  };
  return (
    <Pressable onPress={sesDegistir} accessibilityRole="button" accessibilityLabel={sessiz ? 'Sesi aç' : 'Sesi kapat'} style={[s.kap, { width: genislik, maxWidth: '100%' }]}>
      <video ref={ref} src={kaynak} poster={kapak} muted loop playsInline preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', backgroundColor: '#120E1E' }} />
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
