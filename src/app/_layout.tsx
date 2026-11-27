import { Stack, usePathname } from 'expo-router';
import { View } from 'react-native';
import { useGenis } from '@/bilesenler/Genis';
import { BagimsizAltMenu } from '@/bilesenler/canli/Duzen';
import { useKlavye } from '@/bilesenler/canli/klavye';
import { UygulamaKapisi } from '@/bilesenler/canli/UygulamaKapisi';
import { SurumDenetimi } from '@/bilesenler/SurumDenetimi';
import { OlcumBandi } from '@/bilesenler/OlcumBandi';
import { HataSiniri } from '@/bilesenler/HataSiniri';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { YAZI_BEKLE, YAZI_TIPLERI } from '@/tema/yaziTipleri';
import { TemaSaglayici, useTema } from '@/tema/TemaSaglayici';

// 08.10 (Onur): telefonda alt menü (Balon Rıhtımı) HER ekranda; 09.10: eski bölüm adreslerinde açılan "Bu bölüm yenileniyor" ekranında da altta durur. Klavye açıkken gizlenir.
const RIHTIMLI = ['/olc', '/gunun', '/balonlar', '/gundem', '/eglence', '/sor', '/araclar'];
function Icerik() {
  const { r, gece } = useTema();
  const yol = usePathname();
  const genis = useGenis();
  const klavye = useKlavye();
  const rihtim = !genis && RIHTIMLI.some((y) => yol === y || yol.startsWith(y + '/'));
  return (
    <View style={{ flex: 1, backgroundColor: r.sis }}>
      <StatusBar style={gece ? 'light' : 'dark'} />
      {/* 18.11 (Onur): uygulamada (iOS/Android) üye girişi olmadan içerik ağacı hiç bağlanmaz; site aynen */}
      <UygulamaKapisi>
        <View style={{ flex: 1 }}>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: r.sis } }} />
        </View>
        {rihtim && !klavye && <BagimsizAltMenu />}
      </UygulamaKapisi>
      <SurumDenetimi />
      <OlcumBandi />
    </View>
  );
}

export default function Kok() {
  const [yuklendi] = useFonts(YAZI_TIPLERI);
  if (YAZI_BEKLE && !yuklendi) return null;
  return (
    <TemaSaglayici>
      <HataSiniri>
        <Icerik />
      </HataSiniri>
    </TemaSaglayici>
  );
}
