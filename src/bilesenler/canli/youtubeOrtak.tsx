// YouTube video kartının ortak parçaları (web: YouTube.tsx, uygulama: YouTube.native.tsx): çerçeve, küçük resim + oynat düğmesi, alt bilgi.
// Görsel dil HABER kutusuyla (Kart.tsx) aynı: ince çizgi, dönem vurgusu, koyu/açık tema. Küçük resim yalnız YouTube'un kendi
// adresinden (i.ytimg.com) gelir; sayfa açılırken YouTube oynatıcısı (iframe) YÜKLENMEZ, dokununca yüklenir (hız + gizlilik).
import { useState, type ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { yazi } from '@/tema/tema';
import { karistir } from '@/tema/donem';
import { type Renk } from './ortak';

export const kapakAdresi = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
export const izleAdresi = (id: string) => `https://www.youtube.com/watch?v=${id}`;

// Çerçeve: 16:9 ortam alanı (küçük resim ya da oynatıcı) + altında "VİDEO" etiketi, kanal adı, video başlığı (en çok 2 satır) ve isteğe bağlı alt satır.
export function YouTubeCerceve({ R, kanal, baslik, children, alt }: { R: Renk; kanal?: string; baslik?: string; children: ReactNode; alt?: ReactNode }) {
  const zemin = karistir(R.vurgu, R.panel, R.gece ? 0.08 : 0.045);
  return (
    <View style={[s.cerceve, { backgroundColor: zemin, borderColor: R.cizgi }]}>
      <View style={s.ortam}>{children}</View>
      <View style={s.bilgi}>
        <View style={s.ust}>
          <Text style={[s.etiket, { color: R.vurgu, backgroundColor: R.vurguYumusak }]}>VİDEO</Text>
          <Text numberOfLines={1} style={[s.kanal, { color: R.soluk }]}>{kanal ? `${kanal} · YouTube` : 'YouTube'}</Text>
        </View>
        {!!baslik && <Text numberOfLines={2} style={[s.baslik, { color: R.murekkep }]}>{baslik}</Text>}
        {alt}
      </View>
    </View>
  );
}

// Küçük resim (hqdefault: 4:3 kutuda siyah şeritli; 16:9 alana "cover" ile oturunca şeritler kırpılır) + ortada oynat düğmesi.
// Resim yüklenemezse (video kaldırılmış olabilir) koyu zemin kalır, düğme yine görünür.
export function YouTubeKapak({ id, baslik, etiket, onPress }: { id: string; baslik?: string; etiket: string; onPress: () => void }) {
  const [hata, hataAyarla] = useState(false);
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${etiket}${baslik ? ': ' + baslik : ''}`} style={({ pressed }: { pressed: boolean }) => [s.kapak, pressed && { opacity: 0.9 }]}>
      {!hata && <Image source={{ uri: kapakAdresi(id) }} resizeMode="cover" onError={() => hataAyarla(true)} accessibilityIgnoresInvertColors style={s.resim} />}
      <View style={s.golge} pointerEvents="none" />
      <View style={s.dugme} pointerEvents="none">
        <Svg width={26} height={26} viewBox="0 0 24 24">
          <Path d="M8 5.2v13.6a1 1 0 0 0 1.52.85l11-6.8a1 1 0 0 0 0-1.7l-11-6.8A1 1 0 0 0 8 5.2Z" fill="#fff" />
        </Svg>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  cerceve: { borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  ortam: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#120E1E' },
  bilgi: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 11, gap: 6 },
  ust: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  etiket: { fontFamily: yazi.kalin, fontSize: 10.5, letterSpacing: 0.9, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, overflow: 'hidden' },
  kanal: { fontFamily: yazi.orta, fontSize: 12.5, flexShrink: 1 },
  baslik: { fontFamily: yazi.kalin, fontSize: 15.5, lineHeight: 21, letterSpacing: -0.25 },
  kapak: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#120E1E' },
  resim: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 },
  golge: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10,6,20,0.18)' },
  dugme: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(10,6,20,0.66)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.55)', alignItems: 'center', justifyContent: 'center', paddingLeft: 3 },
});
