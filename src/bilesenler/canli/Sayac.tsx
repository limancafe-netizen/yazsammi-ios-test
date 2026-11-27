// Karakter halkası (Onur 08.10: "mesaj karakter limitini gösteren imleç eklensin"). Eski Yazıcı'daki halkanın dili korunur
// (fc61ecb öncesi: 26 px halka, ince iz, dönem renginde dolum, son harflerde içinde kalan sayı). Yeni gönderi, yorum,
// sohbet mesajı ve mesaj isteği aynı bileşeni kendi sınırlarıyla kullanır.
// Son `esik` harfte halka turuncuya döner ve kalan sayı görünür; sınır aşılınca kırmızı + eksi sayı (düğmeyi çağıran pasifleştirir).
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { yazi } from '@/tema/tema';
import { useRenk } from './ortak';

// Sunucu da harfi kod noktasıyla sayar ([...metin].length): emoji tek harf.
export const harfSay = (metin: string) => [...metin].length;

// Türkçe iyelik eki: "45'i", "20'si", "3'ü", "100'ü" (sayının okunuşundaki son sözcüğe göre).
const SON_EK: Record<number, string> = { 0: "'ı", 1: "'i", 2: "'si", 3: "'ü", 4: "'ü", 5: "'i", 6: "'sı", 7: "'si", 8: "'i", 9: "'u" };
const ONLUK_EK: Record<number, string> = { 1: "'u", 2: "'si", 3: "'u", 4: "'ı", 5: "'si", 6: "'ı", 7: "'i", 8: "'i", 9: "'ı" };
export function iyelik(n: number) {
  const a = Math.abs(n);
  if (a === 0) return "0'ı";
  if (a % 10) return `${n}${SON_EK[a % 10]}`;
  if (a % 100) return `${n}${ONLUK_EK[(a % 100) / 10]}`;
  if (a % 1000) return `${n}'ü`; // yüz
  return `${n}'i`; // bin
}

export function sayacEtiketi(sinir: number, uzunluk: number) {
  const kalan = sinir - uzunluk;
  return kalan >= 0 ? `${sinir} karakterden ${iyelik(kalan)} kaldı` : `${sinir} karakter sınırı ${-kalan} karakter aşıldı`;
}

const BOY = 26;
const YARICAP = 10;
const CEVRE = 2 * Math.PI * YARICAP;

export function KarakterHalkasi({ uzunluk, sinir, esik = 20 }: { uzunluk: number; sinir: number; esik?: number }) {
  const R = useRenk();
  const kalan = sinir - uzunluk;
  const asti = kalan < 0;
  const uyari = !asti && kalan <= esik;
  const turuncu = R.gece ? '#FF9F43' : '#C45A00';
  const renk = asti ? R.kalem : uyari ? turuncu : R.vurgu;
  const oran = Math.min(1, Math.max(0, uzunluk / sinir));
  const etiket = sayacEtiketi(sinir, uzunluk);
  return (
    <View
      style={s.kutu}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={etiket}
      accessibilityValue={{ min: 0, max: sinir, now: Math.min(uzunluk, sinir), text: etiket }}
      // Her harfte okunmasın: yalnız son harflerde ve aşınca kibarca duyurulur.
      accessibilityLiveRegion={uyari || asti ? 'polite' : 'none'}
      aria-live={uyari || asti ? 'polite' : 'off'}
    >
      <Svg width={BOY} height={BOY} viewBox={`0 0 ${BOY} ${BOY}`} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={BOY / 2} cy={BOY / 2} r={YARICAP} stroke={asti ? R.kalem : R.cizgi} strokeOpacity={asti ? 0.35 : 1} strokeWidth={2.5} fill="none" />
        {oran > 0 && (
          <Circle cx={BOY / 2} cy={BOY / 2} r={YARICAP} stroke={renk} strokeWidth={2.5} fill="none" strokeDasharray={`${CEVRE * oran} ${CEVRE}`} strokeLinecap="round" />
        )}
      </Svg>
      {(uyari || asti) && (
        <Text aria-hidden style={[s.sayi, { color: renk }, String(kalan).length > 2 && { fontSize: 8.5 }]} numberOfLines={1}>
          {kalan}
        </Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  kutu: { width: BOY, height: BOY, alignItems: 'center', justifyContent: 'center' },
  sayi: { position: 'absolute', fontFamily: yazi.kalin, fontSize: 10, fontVariant: ['tabular-nums'], letterSpacing: -0.3 },
});
