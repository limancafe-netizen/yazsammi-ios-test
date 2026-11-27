// Marka yazısı ve yüzler: emin "Yazsam" + titrek el yazısıyla "mı?"; yüzler kod/site/logo/marka.py'den gelir.
import { StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useTema } from '@/tema/TemaSaglayici';
import { yazi } from '@/tema/tema';
import { YUZ } from '@/marka/yuzler';

export function MarkaYazisi({ boyut = 20 }: { boyut?: number }) {
  const { r } = useTema();
  return (
    <View style={stil.satir} accessibilityRole="header" accessibilityLabel="Yazsam mı?">
      <Text style={{ fontFamily: yazi.marka, fontSize: boyut, letterSpacing: -boyut * 0.045, color: r.murekkep }}>Yazsam</Text>
      <Text style={{ fontFamily: yazi.kalem, fontSize: boyut * 1.55, color: r.kalem, marginLeft: boyut * 0.2, transform: [{ rotate: '-7deg' }, { translateY: boyut * 0.12 }] }}>
        mı?
      </Text>
    </View>
  );
}

// Telefon üst çubuğu: iki satır logo (kod/site/marka/simge-gece.svg dizilimi). Üstte "Yazsam", altında hafif eğik "mı?".
// SVG'de "mı?" Yazsam'ın ortasından biraz sağında başlar (x 207; Yazsam 40–468 arası, yani genişliğin ~%39'u); bu yüzden sola yaslı değil, marginLeft ile kaydırılır.
export function MarkaYazisiIki({ boyut = 18 }: { boyut?: number }) {
  const { r } = useTema();
  return (
    <View style={stil.iki} accessibilityRole="header" accessibilityLabel="Yazsam mı?">
      <Text style={{ fontFamily: yazi.marka, fontSize: boyut, lineHeight: boyut * 1.2, letterSpacing: -boyut * 0.045, color: r.murekkep }}>Yazsam</Text>
      <Text style={{ fontFamily: yazi.kalem, fontSize: boyut * 2.1, lineHeight: boyut * 1.9, marginTop: -boyut * 0.38, marginLeft: boyut * 1.45, color: r.kalem, transform: [{ rotate: '-7deg' }] }}>
        mı?
      </Text>
    </View>
  );
}

export function Yuz({ ad, boyut = 56 }: { ad: keyof typeof YUZ | string; boyut?: number }) {
  return <SvgXml xml={YUZ[ad] ?? YUZ.gece} width={boyut} height={boyut} />;
}

// Yalnız balon (renkli kare zemin olmadan): uygulamada süzülen duygu balonları.
export function Balon({ ad, boyut = 56 }: { ad: keyof typeof YUZ | string; boyut?: number }) {
  const xml = (YUZ[ad] ?? YUZ.gece).replace(/<rect width="512" height="512"[^>]*\/>/, '');
  return <SvgXml xml={xml} width={boyut} height={boyut} />;
}

const stil = StyleSheet.create({ satir: { flexDirection: 'row', alignItems: 'flex-end' }, iki: { flexDirection: 'column', alignItems: 'flex-start' } });
