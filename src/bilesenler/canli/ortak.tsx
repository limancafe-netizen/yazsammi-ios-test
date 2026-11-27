// Canlı akışın ortak parçaları: renk eki, simgeler, avatar, marka rozeti, basılabilir kutu, açılır pencere.
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTema } from '@/tema/TemaSaglayici';
import { yazi } from '@/tema/tema';
import { SvgXml } from 'react-native-svg';
import { Yuz } from '@/bilesenler/Marka';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { kisaSayi, yuzSec, type Yazar } from '@/canli';
import { DONEM, KURUCU_ALTIN, saydam } from '@/tema/donem';
import { kurucuAmblemSvg, markaAvatarSvg } from '@/marka/avatarlar';
import { useGorunenAlan } from './klavye';
import { BalonAvatar, balonBul, onaySvg } from './balon';
import { AdRozeti } from './rozetGorsel';

// Marka hesabının avatarı ve kurucu amblemi GÜNCEL DÖNEM paletinden (tema/donemler.json); dönem değişince kendiliğinden değişir.
const MARKA_AVATAR = markaAvatarSvg(DONEM.simge);

export const YEREL_SURUCU = Platform.OS !== 'web';
// KAHİN (Tarot) 03.11: web'e açılması onaylanmadı → web'de yalnız EXPO_PUBLIC_KAHIN=1 ile derlenirse görünür; telefon uygulamasında her zaman açık.
// Kapalıyken web'de Tarot, canlıdaki gibi "Yakında" satırı olarak kalır.
// Tribün: iOS'ta yok (Build 4, Onur 18.11; sunucu iOS'a 404 dönüyor). Android ve web'de aynen.
export const TRIBUN_ACIK = Platform.OS !== 'ios';
export const KAHIN_ACIK = true; // 04.11 Onur: Tarot web menüsünde de açık (ücretli kısım web'de "Uygulamada aç")

// Site paletinin üstüne akışa özel tonlar. Vurgu ve onaylı rozet GÜNCEL DÖNEM renginden (tema/donem.ts), sabit mavi/mor yok.
// 23.10 (Onur ACİL): dış bağlantı (haber, hava kaynağı). Telefonda/tabletde AYNI sekmede açılır: yeni sekmede tarayıcının "geri"si
// o sekmeyi kapatıp siteye değil Google'a ya da önceki uygulamaya dönüyordu. Bilgisayarda (fare) yeni sekme; site sekmesi yerinde kalır.
export function disariAc(url: string) {
  if (!/^https:\/\/[^\s]+$/i.test(url)) return;
  if (Platform.OS !== 'web' || typeof window === 'undefined') { Linking.openURL(url).catch(() => {}); return; }
  // 04.11 (E-12): "Habere git" telefonda dış siteyi aynı sekmede açıyordu (yazsammi.com kapanıyor, geri dönüş kayboluyordu). Artık her
  // cihazda yeni sekme. 'noopener' özelliği window.open'ın null dönmesine yol açtığı için açılan pencerenin opener'ı elle kesilir;
  // açılamazsa (açılır pencere engeli, uygulama içi tarayıcı) eskisi gibi aynı sekmede gidilir.
  let w: Window | null = null;
  try { w = window.open(url, '_blank'); } catch {}
  if (w) { try { w.opener = null; } catch {} }
  else window.location.assign(url);
}

export function useRenk() {
  const { r, gece } = useTema();
  const v = gece ? DONEM.vurgu.gece : DONEM.vurgu.gunduz;
  const donemEk = { vurgu: v, vurguYumusak: saydam(v, gece ? 0.16 : 0.09), rozet: v };
  const ek = gece
    ? { panel: '#18132A', yukselt: '#221C37', ust: '#2A2342', hover: 'rgba(255,255,255,0.035)', ince: 'rgba(237,233,246,0.09)', vurgu: '#8F72FF', vurguYumusak: 'rgba(143,114,255,0.16)', kalp: '#FF4D7D', rozet: '#8AA2FF', yesil: '#3DDC97', golge: 'rgba(0,0,0,0.5)', altin: '#F2C14E', altinYumusak: 'rgba(242,193,78,0.16)', altinYazi: '#F5CF6E' }
    : { panel: '#FCFBFE', yukselt: '#FFFFFF', ust: '#F2EEF8', hover: 'rgba(29,24,48,0.03)', ince: 'rgba(29,24,48,0.08)', vurgu: '#5B2EFF', vurguYumusak: 'rgba(91,46,255,0.09)', kalp: '#E8336A', rozet: '#3B5BDB', yesil: '#14A86B', golge: 'rgba(29,24,48,0.18)', altin: '#D99A0B', altinYumusak: 'rgba(217,154,11,0.12)', altinYazi: '#A86F00' };
  return { ...r, ...ek, ...donemEk, gece };
}
export type Renk = ReturnType<typeof useRenk>;

// --- simgeler (çizgi) ---
export type IkonAd = 'kalp' | 'sol' | 'yorum' | 'paylas' | 'nokta' | 'zil' | 'ev' | 'arti' | 'kisi' | 'geri' | 'kapat' | 'sesKapali' | 'sesAcik' | 'bayrak' | 'yukari' | 'saat' | 'tik' | 'kalem' | 'ok' | 'cikis' | 'telefon' | 'kamera' | 'mikrofon' | 'yildiz' | 'resim' | 'mesaj' | 'ayar' | 'engel' | 'cop' | 'ciftTik' | 'menu' | 'kosem' | 'gunes' | 'ay' | 'duvar' | 'yeniden';
const YOL: Record<IkonAd, string[]> = {
  kalp: ['M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z'],
  yorum: ['M7.9 20A9 9 0 1 0 4 16.1L2 22Z'],
  paylas: ['m22 2-7 20-4-9-9-4Z', 'M22 2 11 13'],
  yeniden: ['M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8', 'M21 3v5h-5'], // yeniden paylaş (#5): tek dönen ok
  nokta: [],
  zil: ['M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9', 'M10.3 21a1.94 1.94 0 0 0 3.4 0'],
  ev: ['M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z'],
  arti: ['M12 5v14', 'M5 12h14'],
  kisi: ['M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2'],
  geri: ['m12 19-7-7 7-7', 'M19 12H5'],
  sol: ['m15 18-6-6 6-6'],
  kapat: ['M18 6 6 18', 'm6 6 12 12'],
  sesKapali: ['M11 5 6 9H2v6h4l5 4V5Z', 'm23 9-6 6', 'm17 9 6 6'],
  sesAcik: ['M11 5 6 9H2v6h4l5 4V5Z', 'M15.54 8.46a5 5 0 0 1 0 7.07', 'M19.07 4.93a10 10 0 0 1 0 14.14'],
  bayrak: ['M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z', 'M4 22v-7'],
  yukari: ['M12 19V5', 'm5 12 7-7 7 7'],
  saat: ['M12 6v6l4 2'],
  tik: ['M20 6 9 17l-5-5'],
  kalem: ['M12 20h9', 'M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z'],
  ok: ['M5 12h14', 'm12 5 7 7-7 7'],
  cikis: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'm16 17 5-5-5-5', 'M21 12H9'],
  telefon: ['M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z'],
  kamera: ['m16 13 5.22 3.48a.5.5 0 0 0 .78-.42V7.87a.5.5 0 0 0-.75-.43L16 10.5', 'M4 6h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z'],
  mikrofon: ['M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z', 'M19 10v2a7 7 0 0 1-14 0v-2', 'M12 19v3'],
  yildiz: ['M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7Z'],
  resim: ['M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z', 'm21 15-5-5L5 21', 'M9 7a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z'],
  mesaj: ['M21 11.5a8.4 8.4 0 0 1-9 8.4 9.8 9.8 0 0 1-3.6-.7L3 21l1.8-4.8A8 8 0 0 1 3 11.5 8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5Z', 'M8 10h8', 'M8 14h5'],
  ayar: ['M4 21v-7', 'M4 10V3', 'M12 21v-9', 'M12 8V3', 'M20 21v-5', 'M20 12V3', 'M1 14h6', 'M9 8h6', 'M17 16h6'],
  engel: ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z', 'm4.9 4.9 14.2 14.2'],
  cop: ['M3 6h18', 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6', 'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2'],
  menu: ['M4 7h16', 'M4 12h16', 'M4 17h16'],
  ciftTik: ['M18 6 7 17l-5-5', 'm22 10-7.5 7.5L13 16'],
  // 08.10 Balon Rıhtımı taslağı (ortak.js): dört köşe (diğer bölümler), güneş/ay (tema), duvar.
  kosem: ['M6.3 4h2.4A2.3 2.3 0 0 1 11 6.3v2.4A2.3 2.3 0 0 1 8.7 11H6.3A2.3 2.3 0 0 1 4 8.7V6.3A2.3 2.3 0 0 1 6.3 4Z', 'M15.3 4h2.4A2.3 2.3 0 0 1 20 6.3v2.4a2.3 2.3 0 0 1-2.3 2.3h-2.4A2.3 2.3 0 0 1 13 8.7V6.3A2.3 2.3 0 0 1 15.3 4Z', 'M6.3 13h2.4a2.3 2.3 0 0 1 2.3 2.3v2.4A2.3 2.3 0 0 1 8.7 20H6.3A2.3 2.3 0 0 1 4 17.7v-2.4A2.3 2.3 0 0 1 6.3 13Z', 'M16.5 13a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Z'],
  gunes: ['M12 3V4.6M12 19.4V21M3 12H4.6M19.4 12H21M5.6 5.6L6.8 6.8M17.2 17.2L18.4 18.4M5.6 18.4L6.8 17.2M17.2 6.8L18.4 5.6'],
  ay: ['M19.6 14.6A7.9 7.9 0 1 1 9.4 4.4A6.4 6.4 0 0 0 19.6 14.6Z'],
  duvar: ['M7 4.4h10a3.6 3.6 0 0 1 3.6 3.6v8a3.6 3.6 0 0 1-3.6 3.6H7A3.6 3.6 0 0 1 3.4 16V8A3.6 3.6 0 0 1 7 4.4Z', 'M3.6 14.6L8.4 10.4L12.4 14L15.2 11.6L20.4 16'],
};
export function Ikon({ ad, boyut = 22, renk, dolu, kalinlik = 2 }: { ad: IkonAd; boyut?: number; renk: string; dolu?: boolean; kalinlik?: number }) {
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24" fill="none">
      {ad === 'nokta' && [5, 12, 19].map((x) => <Circle key={x} cx={x} cy={12} r={1.7} fill={renk} />)}
      {ad === 'kisi' && <Circle cx={12} cy={7} r={4} stroke={renk} strokeWidth={kalinlik} />}
      {ad === 'saat' && <Circle cx={12} cy={12} r={10} stroke={renk} strokeWidth={kalinlik} />}
      {ad === 'gunes' && <Circle cx={12} cy={12} r={3.8} stroke={renk} strokeWidth={kalinlik} />}
      {YOL[ad].map((d, i) => (
        <Path key={i} d={d} stroke={renk} strokeWidth={kalinlik} strokeLinecap="round" strokeLinejoin="round" fill={dolu && i === 0 ? renk : 'none'} />
      ))}
    </Svg>
  );
}

// Onaylı marka rozeti (08.10 Balon Kimliği): X'in tırtıklı rozetine benzemesin diye marka balonu içinde tik, dönem renginde.
export function Rozet({ boyut = 16 }: { boyut?: number }) {
  const R = useRenk();
  const xml = useMemo(() => onaySvg(R.rozet), [R.rozet]);
  return (
    <View accessible accessibilityLabel="Onaylı hesap" style={{ width: boyut, height: boyut }}>
      <SvgXml xml={xml} width={boyut} height={boyut} />
    </View>
  );
}
// Kurucu rozeti: altın yuvarlak + beyaz tik (markanın dalgalı mavi rozetinden ayrı dursun) ve küçük "kurucu" etiketi.
export function KurucuRozet({ boyut = 16 }: { boyut?: number }) {
  const R = useRenk();
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24" accessibilityLabel="Kurucu">
      <Circle cx={12} cy={12} r={10.6} fill={R.altin} />
      <Circle cx={12} cy={12} r={10.6} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1.2} />
      <Path d="M7.4 12.3l3.1 3.1 6.1-6.5" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}
export function KurucuEtiketi({ kucuk }: { kucuk?: boolean }) {
  const R = useRenk();
  return (
    <View style={[s.yz, { backgroundColor: R.altinYumusak, borderWidth: 1, borderColor: R.gece ? 'rgba(242,193,78,0.35)' : 'rgba(217,154,11,0.3)' }, kucuk && { paddingHorizontal: 5, paddingVertical: 0 }]}>
      <Text style={[s.yzYazi, { color: R.altinYazi, fontFamily: yazi.kalin }, kucuk && { fontSize: 10 }]}>kurucu</Text>
    </View>
  );
}
// Kurucu Dost (Kurucu'dan ayrı, yönetim yetkisi yok): marka renginde küçük etiket + profil resmi çevresinde altın çerçeve.
export function KurucuDostEtiketi({ kucuk }: { kucuk?: boolean }) {
  const R = useRenk();
  return (
    <View accessible accessibilityLabel="Kurucu Dost" style={[s.yz, { backgroundColor: R.vurguYumusak, borderWidth: 1, borderColor: R.altin }, kucuk && { paddingHorizontal: 5, paddingVertical: 0 }]}>
      <Text style={[s.yzYazi, { color: R.vurgu, fontFamily: yazi.kalin }, kucuk && { fontSize: 10 }]}>kurucu dost</Text>
    </View>
  );
}
export function DostCerceve({ boyut, dost, children }: { boyut: number; dost?: boolean; children: ReactNode }) {
  const R = useRenk();
  if (!dost) return <>{children}</>;
  const d = boyut + 8; // yerleşimi bozmaz: negatif kenar boşluğu
  return (
    <View style={{ width: d, height: d, margin: -4, borderRadius: d / 2, borderWidth: 2, borderColor: R.altin, alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </View>
  );
}
export function YzEtiketi({ kucuk }: { kucuk?: boolean }) {
  const R = useRenk();
  return (
    <View style={[s.yz, { backgroundColor: R.vurguYumusak }, kucuk && { paddingHorizontal: 5, paddingVertical: 0 }]}>
      <Text style={[s.yzYazi, { color: R.vurgu }, kucuk && { fontSize: 10 }]}>yapay zekâ</Text>
    </View>
  );
}

// Avatar: üyede kendi BALONU (08.10 Balon Kimliği: şekil + renk + bugünkü yüz; yuvarlak kırpma yok). Marka: dönem avatarı.
// Kurucu: altın "O" amblemi (kurucu-<dönem>.svg ile aynı; kurucu kimliği korunur).
export function Avatar({ yazar, boyut = 40, halka }: { yazar: Pick<Yazar, 'uid' | 'ad' | 'marka' | 'yuz' | 'kurucu' | 'kurucuDost' | 'balon'>; boyut?: number; halka?: string }) {
  const ek = useId();
  const kurucu = !yazar.marka && !!yazar.kurucu;
  const amblem = useMemo(() => (kurucu ? kurucuAmblemSvg(DONEM.simge, KURUCU_ALTIN, ek) : null), [kurucu, ek]);
  const xml = yazar.marka ? MARKA_AVATAR : amblem;
  if (!xml) return <DostCerceve boyut={boyut} dost={!!yazar.kurucuDost}><BalonAvatar kimlik={balonBul(yazar)} boyut={boyut} /></DostCerceve>;
  return (
    <View style={{ width: boyut, height: boyut, borderRadius: boyut / 2, overflow: 'hidden', borderWidth: halka ? 2 : 0, borderColor: halka }}>
      <View style={{ margin: halka ? -2 : 0 }}>
        {xml ? <SvgXml xml={xml} width={boyut} height={boyut} /> : <Yuz ad={yuzSec(yazar)} boyut={boyut} />}
      </View>
    </View>
  );
}

export function Ad({ yazar, boyut = 15.5, onPress }: { yazar: Yazar; boyut?: number; onPress?: () => void }) {
  const R = useRenk();
  const dar = useWindowDimensions().width < 360; // 320'lik telefonda ad + rozet + zaman tek satıra sığsın
  return (
    <Pressable onPress={onPress} hitSlop={4} style={s.adSatir} accessibilityRole="link">
      {({ hovered }: { hovered?: boolean; pressed: boolean }) => (
        <>
          <Text numberOfLines={1} style={[{ fontFamily: yazi.kalin, fontSize: boyut, color: R.murekkep, letterSpacing: -0.2 }, hovered && { textDecorationLine: 'underline' }]}>{yazar.marka ? 'Yazsam mı?' : yazar.ad}</Text>
          {yazar.marka && <Rozet boyut={boyut + 1} />}
          {yazar.marka && <YzEtiketi kucuk={dar} />}
          {!yazar.marka && yazar.kurucu && <KurucuRozet boyut={boyut} />}
          {!yazar.marka && yazar.kurucu && <KurucuEtiketi kucuk={dar} />}
          {!yazar.marka && !yazar.kurucu && !!yazar.kurucuDost && <KurucuDostEtiketi kucuk={dar} />}
          {!yazar.marka && !!yazar.vitrin && <AdRozeti v={yazar.vitrin} />}
        </>
      )}
    </Pressable>
  );
}

// Basılabilir kutu: fare üstündeyken hafif zemin, basınca hafif küçülür.
// 03.11 (denetim: telefonda dokunma alanları 44 px'ten küçük): react-native-web Pressable'da hitSlop'u uygulamıyor (yalnız eski Touchable'da var) → web'de
// görünmez, taşan bir alan eklenir (görünüm aynı; olaylar Pressable'a yükselir). Telefon uygulamasında hitSlop olduğu gibi çalışır.
type Pay = { top?: number; bottom?: number; left?: number; right?: number };
const payAc = (h?: number | Pay) => (h == null ? null : typeof h === 'number' ? { top: h, bottom: h, left: h, right: h } : { top: h.top ?? 0, bottom: h.bottom ?? 0, left: h.left ?? 0, right: h.right ?? 0 });
export function Bas({ onPress, style, hoverRenk, children, etiket, devre, rol = 'button', hitSlop, secili }: { onPress?: () => void; style?: StyleProp<ViewStyle>; hoverRenk?: string; children: ReactNode; etiket?: string; devre?: boolean; rol?: 'button' | 'link' | 'tab'; hitSlop?: number | Pay; secili?: boolean }) {
  const kaydir = Platform.OS === 'web' ? payAc(hitSlop) : null;
  return (
    <Pressable
      onPress={onPress}
      disabled={devre}
      accessibilityRole={rol}
      accessibilityLabel={etiket}
      accessibilityState={secili === undefined ? undefined : { selected: secili }} // sekme / seçici düğmeler seçili durumu okuyucuya bildirir
      hitSlop={hitSlop}
      style={({ hovered, pressed }: { hovered?: boolean; pressed: boolean }) => [style, hovered && hoverRenk ? { backgroundColor: hoverRenk } : null, pressed && { opacity: 0.75, transform: [{ scale: 0.98 }] }, devre && { opacity: 0.45 }]}
    >
      {kaydir && <View pointerEvents="auto" style={{ position: 'absolute', top: -kaydir.top, bottom: -kaydir.bottom, left: -kaydir.left, right: -kaydir.right }} />}
      {children}
    </Pressable>
  );
}

export function Dugme({ yazi: y, onPress, tur = 'dolu', devre, kucuk, ikon, style }: { yazi: string; onPress?: () => void; tur?: 'dolu' | 'cizgi' | 'acik'; devre?: boolean; kucuk?: boolean; ikon?: IkonAd; style?: StyleProp<ViewStyle> }) {
  const R = useRenk();
  const zemin = tur === 'dolu' ? R.murekkep : tur === 'acik' ? R.vurgu : 'transparent';
  const renk = tur === 'cizgi' ? R.murekkep : tur === 'acik' ? '#fff' : R.sis;
  return (
    <Bas onPress={onPress} devre={devre} style={[s.dugme, { backgroundColor: zemin, borderColor: tur === 'cizgi' ? R.cizgi : zemin }, kucuk && { paddingVertical: 7, paddingHorizontal: 14 }, style]}>
      {ikon && <Ikon ad={ikon} boyut={kucuk ? 15 : 17} renk={renk} kalinlik={2.4} />}
      <Text style={[s.dugmeYazi, { color: renk }, kucuk && { fontSize: 14 }]}>{y}</Text>
    </Bas>
  );
}

// Yeni öğe girişi: aşağıdan hafif kayarak belirir.
export function Belir({ children, gecikme = 0, aktif = true, style }: { children: ReactNode; gecikme?: number; aktif?: boolean; style?: StyleProp<ViewStyle> }) {
  const a = useRef(new Animated.Value(aktif ? 0 : 1)).current;
  useEffect(() => {
    if (aktif) Animated.timing(a, { toValue: 1, duration: 420, delay: gecikme, easing: Easing.out(Easing.cubic), useNativeDriver: YEREL_SURUCU }).start();
  }, []);
  return <Animated.View style={[style, { opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }]}>{children}</Animated.View>;
}

// Açılır pencere: telefonda alttan çıkan sayfa, bilgisayarda ortada kutu.
export function Pencere({ acik, kapat, children, genislik = 460, tamEkran, baslik }: { acik: boolean; kapat: () => void; children: ReactNode; genislik?: number; tamEkran?: boolean; baslik?: string }) {
  const R = useRenk();
  const { width } = useWindowDimensions();
  // Sitede görünen alan: klavye açıkken pencere klavyenin üstüne sığar (Android sayfayı küçültür, iPhone'da 'ortu' kadar yukarı alınır).
  const alan = useGorunenAlan();
  const height = alan.h;
  const masa = Platform.OS === 'web' && width >= 760;
  const guvenli = useSafeAreaInsets(); // telefonda alt pencere iPhone ev çizgisinin altında kalmasın
  const [gorunur, gorunurAyarla] = useState(acik);
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (acik) {
      gorunurAyarla(true);
      Animated.timing(a, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: YEREL_SURUCU }).start();
    } else if (gorunur) {
      Animated.timing(a, { toValue: 0, duration: 180, easing: Easing.in(Easing.quad), useNativeDriver: YEREL_SURUCU }).start(() => gorunurAyarla(false));
    }
  }, [acik]);
  if (!gorunur) return null;
  const kutu: ViewStyle = masa
    ? { width: Math.min(genislik, width - 32), maxHeight: height - 64, borderRadius: 26, alignSelf: 'center' }
    : tamEkran
      ? { width: '100%', height: '100%', borderRadius: 0, paddingTop: guvenli.top, paddingBottom: guvenli.bottom }
      : { width: '100%', maxHeight: height - 40 - guvenli.top, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingBottom: guvenli.bottom };
  const hareket = masa
    ? [{ scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }, { translateY: a.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }]
    : [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [tamEkran ? 40 : 360, 0] }) }];
  return (
    <Modal transparent visible animationType="none" onRequestClose={kapat} statusBarTranslucent>
      {/* Uygulamada iki platformda da 'padding' (Android uçtan uca ekranda pencere kendiliğinden küçülmez; örtüşme yoksa 0 ekler). */}
      <KeyboardAvoidingView behavior={Platform.OS === 'web' ? undefined : 'padding'} style={{ flex: 1, justifyContent: masa ? 'center' : 'flex-end', paddingBottom: Platform.OS === 'web' ? alan.ortu : 0 }}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: R.gece ? 'rgba(6,4,12,0.72)' : 'rgba(29,24,48,0.42)', opacity: a }]}>
          <Pressable style={{ flex: 1 }} onPress={kapat} accessibilityLabel="Kapat" />
        </Animated.View>
        <Animated.View style={[kutu, { backgroundColor: R.panel, opacity: a, transform: hareket, overflow: 'hidden', borderWidth: masa ? 1 : 0, borderColor: R.ince }, Platform.OS === 'web' ? ({ boxShadow: `0 24px 80px ${R.golge}` } as any) : null]}>
          {!masa && !tamEkran && <View style={[s.tutamac, { backgroundColor: R.cizgi }]} />}
          {baslik && (
            <View style={[s.pencereUst, { borderBottomColor: R.ince }]}>
              <Text style={[s.pencereBaslik, { color: R.murekkep }]}>{baslik}</Text>
              <Bas onPress={kapat} etiket="Kapat" style={s.kapat} hoverRenk={R.hover}>
                <Ikon ad="kapat" boyut={20} renk={R.soluk} />
              </Bas>
            </View>
          )}
          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// Canlı nokta (yanıp sönen).
// Sitede CSS animasyonu (07.10 denetim: JS döngüsü saniyede yüzlerce sayfa güncellemesi yapıp telefon pilini yiyordu).
const NABIZ_CSS = [{ '0%': { opacity: 0.35, transform: 'scale(0.6)' }, '50%': { opacity: 0, transform: 'scale(1.25)' }, '100%': { opacity: 0.35, transform: 'scale(0.6)' } }];
export function CanliNokta({ renk, boyut = 8 }: { renk: string; boyut?: number }) {
  if (Platform.OS === 'web') {
    return (
      <View style={{ width: boyut * 2, height: boyut * 2, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ position: 'absolute', width: boyut * 2, height: boyut * 2, borderRadius: boyut, backgroundColor: renk, animationKeyframes: NABIZ_CSS, animationDuration: '1800ms', animationIterationCount: 'infinite', animationTimingFunction: 'ease-in-out' } as any} />
        <View style={{ width: boyut, height: boyut, borderRadius: boyut / 2, backgroundColor: renk }} />
      </View>
    );
  }
  return <CanliNoktaYerel renk={renk} boyut={boyut} />;
}
function CanliNoktaYerel({ renk, boyut }: { renk: string; boyut: number }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const d = Animated.loop(Animated.sequence([Animated.timing(a, { toValue: 1, duration: 900, useNativeDriver: YEREL_SURUCU }), Animated.timing(a, { toValue: 0, duration: 900, useNativeDriver: YEREL_SURUCU })]));
    d.start();
    return () => d.stop();
  }, []);
  return (
    <View style={{ width: boyut * 2, height: boyut * 2, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ position: 'absolute', width: boyut * 2, height: boyut * 2, borderRadius: boyut, backgroundColor: renk, opacity: a.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] }), transform: [{ scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.25] }) }] }} />
      <View style={{ width: boyut, height: boyut, borderRadius: boyut / 2, backgroundColor: renk }} />
    </View>
  );
}

export function Rakam({ n, renk, boyut = 14 }: { n: number; renk: string; boyut?: number }) {
  return <Text style={{ fontFamily: yazi.orta, fontSize: boyut, color: renk, fontVariant: ['tabular-nums'], minWidth: 10 }}>{n > 0 ? kisaSayi(n) : ''}</Text>;
}

export function Rozetli({ sayi, children }: { sayi: number; children: ReactNode }) {
  const R = useRenk();
  return (
    <View>
      {children}
      {sayi > 0 && (
        <View style={[s.sayiRozet, { backgroundColor: R.kalem, borderColor: R.panel }]}>
          <Text style={s.sayiRozetYazi}>{sayi > 9 ? '9+' : sayi}</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  yz: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1, marginLeft: 2 },
  yzYazi: { fontFamily: yazi.orta, fontSize: 11, letterSpacing: 0.1 },
  adSatir: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
  dugme: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 999, paddingVertical: 11, paddingHorizontal: 20, borderWidth: 1.5 },
  dugmeYazi: { fontFamily: yazi.kalin, fontSize: 15.5 },
  tutamac: { width: 40, height: 5, borderRadius: 3, alignSelf: 'center', marginTop: 8, marginBottom: 2 },
  pencereUst: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 22, paddingRight: 12, paddingVertical: 10, borderBottomWidth: 1 },
  pencereBaslik: { fontFamily: yazi.kalin, fontSize: 17 },
  kapat: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  sayiRozet: { position: 'absolute', top: -5, right: -8, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  sayiRozetYazi: { color: '#fff', fontFamily: yazi.kalin, fontSize: 10.5 },
});
