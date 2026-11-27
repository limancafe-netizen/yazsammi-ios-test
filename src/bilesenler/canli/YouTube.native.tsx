// YouTube video kartı (uygulama): küçük resim + "YouTube'da izle ↗"; dokununca YouTube uygulaması/tarayıcısı açılır (yeni bağımlılık yok, gömülü oynatıcı yok).
import { Linking, StyleSheet, Text, View } from 'react-native';
import { yazi } from '@/tema/tema';
import { useRenk } from './ortak';
import { YouTubeCerceve, YouTubeKapak, izleAdresi } from './youtubeOrtak';

const KIMLIK = /^[A-Za-z0-9_-]{11}$/;

export function YouTube({ id, baslik, kanal }: { id: string; baslik?: string; kanal?: string }) {
  const R = useRenk();
  if (!KIMLIK.test(id)) return null;
  const ac = () => {
    Linking.openURL(izleAdresi(id)).catch(() => {});
  };
  return (
    <YouTubeCerceve
      R={R}
      kanal={kanal}
      baslik={baslik}
      alt={
        <View style={s.alt}>
          <Text onPress={ac} accessibilityRole="link" style={[s.git, { color: R.vurgu }]}>YouTube'da izle ↗</Text>
        </View>
      }
    >
      <YouTubeKapak id={id} baslik={baslik} etiket="YouTube'da izle" onPress={ac} />
    </YouTubeCerceve>
  );
}

const s = StyleSheet.create({
  alt: { flexDirection: 'row', justifyContent: 'flex-end' },
  git: { fontFamily: yazi.kalin, fontSize: 13.5 },
});
