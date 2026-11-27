// "Bu bölüm yenileniyor" (09.10; bulunamayan adreslerde de aynı ekran, başlık değişir): eski bölümlerin (Yazsam mı? ölç, Günün Cümlesi, Balon Avı, eski Gündem, Eğlence, Arkadaşına sor)
// adresleri bozulmasın, ama eski görünüm de çıkmasın diye hepsi bu tek ekrana yönlenir. Yeni arayüz dilinde: balon + iki düğme.
// Telefonda altta rıhtım (_layout.tsx RIHTIMLI), bilgisayarda ortada kart.
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGenis } from '@/bilesenler/Genis';
import { MarkaYazisi } from '@/bilesenler/Marka';
import { yazi } from '@/tema/tema';
import { Dugme, useRenk } from './ortak';
import { BalonAvatar } from './balon';
import { TemaIkonu } from './Duzen';

const git = (yol: string) => (Platform.OS === 'web' ? (window.location.href = yol) : router.replace(yol as never));

export default function Yenileniyor({ baslik = 'Bu bölüm yenileniyor', alt = 'Yazsam mı? yeni yüzüne geçti. Akış, Tribün ve sohbetler Canlı’da seni bekliyor.' }: { baslik?: string; alt?: string } = {}) {
  const R = useRenk();
  const genis = useGenis();
  const ust = useSafeAreaInsets();
  const kart = (
    <View style={[s.kart, genis && { backgroundColor: R.panel, borderColor: R.ince, borderWidth: 1, borderRadius: 32, padding: 44 }]}>
      <View style={s.balon}>
        <View style={[s.hale, { backgroundColor: R.vurguYumusak }]} />
        <BalonAvatar kimlik={{ s: 'klasik', r: 'mercan', y: 'emin' }} boyut={124} />
      </View>
      <Text style={[s.baslik, { color: R.murekkep }]}>{baslik}</Text>
      <Text style={[s.alt, { color: R.soluk }]}>{alt}</Text>
      <View style={s.dugmeler}>
        <Dugme yazi="Canlı’ya dön" ikon="ok" onPress={() => git('/canli')} />
        <Dugme yazi="Tribün" tur="cizgi" onPress={() => git('/canli?tribun=1')} />
      </View>
    </View>
  );
  return (
    <View style={{ flex: 1, backgroundColor: R.sis }}>
      <View style={[s.ust, { paddingTop: ust.top + 12 }]}>
        <MarkaYazisi boyut={genis ? 22 : 19} />
        <TemaIkonu />
      </View>
      <ScrollView contentContainerStyle={[s.ic, !genis && { paddingBottom: 140 }]} showsVerticalScrollIndicator={false}>
        {kart}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  ust: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 8 },
  ic: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },
  kart: { width: '100%', maxWidth: 520, alignItems: 'center', gap: 14 },
  balon: { width: 170, height: 150, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  hale: { position: 'absolute', width: 150, height: 150, borderRadius: 75, opacity: 0.9 },
  baslik: { fontFamily: yazi.kalin, fontSize: 30, lineHeight: 34, letterSpacing: -1, textAlign: 'center' },
  alt: { fontFamily: yazi.normal, fontSize: 16.5, lineHeight: 24, textAlign: 'center', maxWidth: 400 },
  dugmeler: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 14 },
});
