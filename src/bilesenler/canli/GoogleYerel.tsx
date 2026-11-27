// Uygulamadaki "Google ile devam et" düğmesi (giriş penceresi). Yalnız GOOGLE_YEREL (Android/iOS) iken çizilir;
// sitede Google Identity Services kendi düğmesini çizer.
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { googleYerelGiris } from '@/googleGiris';
import { yazi } from '@/tema/tema';
import { Bas, useRenk } from './ortak';

function GLogo({ boyut = 20 }: { boyut?: number }) {
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 48 48">
      <Path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <Path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <Path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <Path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </Svg>
  );
}

export function GoogleYerelDugme({ jeton, hata, devre }: { jeton: (idToken: string) => void; hata: (m: string) => void; devre?: boolean }) {
  const R = useRenk();
  const [aciliyor, aciliyorAyarla] = useState(false);
  const bas = async () => {
    if (aciliyor || devre) return;
    aciliyorAyarla(true);
    hata('');
    const r = await googleYerelGiris();
    aciliyorAyarla(false);
    if ('idToken' in r) jeton(r.idToken);
    else if ('hata' in r) hata(r.hata);
  };
  return (
    <Bas onPress={bas} etiket="Google ile devam et" style={[s.dugme, { backgroundColor: R.gece ? '#131314' : '#fff', borderColor: R.gece ? '#8E918F' : '#747775', opacity: aciliyor || devre ? 0.6 : 1 }]}>
      <View style={s.ic}>
        <GLogo />
        <Text style={[s.yazi, { color: R.gece ? '#E3E3E3' : '#1F1F1F' }]}>Google ile devam et</Text>
      </View>
    </Bas>
  );
}

const s = StyleSheet.create({
  dugme: { width: 300, height: 48, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  ic: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  yazi: { fontFamily: yazi.orta, fontSize: 15.5 },
});
