// 1.9.0: kök hata sınırı. JS hatasında beyaz ekran yerine sakin "Bir sorun oldu" ekranı + "Yeniden dene".
// HİÇBİR veri toplanmaz/gönderilmez (ölçüm kararı bekliyor; dış izleme aracı yok). Hata yalnız konsola yazılır.
import { Component, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { yazi } from '@/tema/tema';
import { Dugme, useRenk } from './canli/ortak';

function Sakin({ yeniden }: { yeniden: () => void }) {
  const R = useRenk();
  return (
    <View style={[s.kap, { backgroundColor: R.sis }]} accessibilityRole="alert">
      <Text style={[s.baslik, { color: R.murekkep }]}>Bir sorun oldu</Text>
      <Text style={[s.alt, { color: R.soluk }]}>Beklenmedik bir şey oldu. Yeniden deneyince çoğu zaman düzelir.</Text>
      <Dugme yazi="Yeniden dene" onPress={yeniden} />
    </View>
  );
}

export class HataSiniri extends Component<{ children: ReactNode }, { hata: boolean }> {
  state = { hata: false };
  static getDerivedStateFromError() {
    return { hata: true };
  }
  componentDidCatch(e: unknown) {
    console.warn('HataSiniri:', e instanceof Error ? e.message : String(e));
  }
  render() {
    return this.state.hata ? <Sakin yeniden={() => this.setState({ hata: false })} /> : this.props.children;
  }
}

const s = StyleSheet.create({
  kap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 14 },
  baslik: { fontSize: 22, fontFamily: yazi.kalin, textAlign: 'center' },
  alt: { fontSize: 15, lineHeight: 21, fontFamily: yazi.orta, textAlign: 'center', maxWidth: 320, marginBottom: 6 },
});
