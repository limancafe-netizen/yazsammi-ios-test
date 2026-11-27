// Tribün sohbet ekranı (plan/39, taslak A "Küçülen tabela"; Onur 09.10): ince üst şerit (telefonda skor + dakika + aç/kapa, bilgisayarda başlık + skor + dakika şeridi),
// hızlı tepki satırı (emoji çipleri, "Tribün nabzı · son 1 dk", uçuşan emoji, ilk kullanım ipucu) ve sohbet içindeki tepki satırı.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { yazi } from '@/tema/tema';
import type { TribunMac, TribunOlay, TribunTepkiSatiri, TribunTepkiTur } from '@/canli';
import { depoOku, depoYaz } from '@/depo';
import { Bas, CanliNokta, Ikon, YEREL_SURUCU, useRenk } from './ortak';
import { TakimRozeti, sa } from './tribunOrtak';

const ZEMIN = '#120E1F';

// ---- tepki türleri ----
export const TEPKILER: { k: TribunTepkiTur; emoji: string; ad: string; satir: string }[] = [
  { k: 'gol', emoji: '⚽', ad: 'Gooool', satir: 'Gooool!' },
  { k: 'dayan', emoji: '💪', ad: 'Dayan', satir: 'Dayan!' },
  { k: 'helal', emoji: '👏', ad: 'Helal', satir: 'Helal!' },
  { k: 'kalbim', emoji: '❤️', ad: 'Kalbim', satir: 'Kalbim!' },
];
const tepkiBul = (k: string) => TEPKILER.find((x) => x.k === k) ?? TEPKILER[0];

// ---- dakika şeridi (ince): ilerleme + (isteğe bağlı) gol/kart işaretleri ----
function IncePerde({ mac, olaylar, dkSayi, boy = 3, isaret }: { mac: TribunMac; olaylar: TribunOlay[]; dkSayi: number; boy?: number; isaret?: boolean }) {
  const son = Math.max(90, ...olaylar.map((x) => (parseInt(x.dk, 10) || 0) + (parseInt(x.dk.split('+')[1] || '0', 10) || 0)));
  const yuz = (dk: string) => { const p = dk.split('+'); return Math.min(98, Math.max(2, (((parseInt(p[0], 10) || 0) + (parseInt(p[1] || '0', 10) || 0)) / son) * 100)); };
  const ilerleme = mac.durum === 'oncesi' ? 0 : mac.durum === 'bitti' ? 100 : Math.min(100, (Math.max(1, dkSayi) / son) * 100);
  const oge = olaylar.filter((x) => x.teyit && !x.iptal && ['gol', 'sari', 'kirmizi'].includes(x.tur) && x.takim);
  return (
    <View style={{ height: isaret ? 14 : boy, justifyContent: 'flex-end' }}>
      <View style={{ height: boy, backgroundColor: 'rgba(255,255,255,0.14)' }}>
        <View style={{ width: `${ilerleme}%`, height: boy, overflow: 'hidden' }}>
          <LinearGradient colors={[mac.ev.renk, mac.dep.renk]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
        </View>
      </View>
      {isaret && oge.map((x) => {
        const t = x.takim === 'ev' ? mac.ev : mac.dep;
        return (
          <View key={x.id} style={{ position: 'absolute', left: `${yuz(x.dk)}%`, bottom: 0, marginLeft: -4 }}>
            {x.tur === 'gol' ? <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: t.renk, borderWidth: 1.5, borderColor: '#fff' }} /> : <View style={{ width: 5, height: 8, borderRadius: 1.5, backgroundColor: x.tur === 'sari' ? '#FFD23F' : '#FF3B3B', marginBottom: 1 }} />}
          </View>
        );
      })}
    </View>
  );
}

// ---- durum hapı: CANLI · 36' / DEVRE / BİTTİ / başlamasına ----
function DurumHapi({ mac, bekle }: { mac: TribunMac; bekle?: string }) {
  const canli = mac.durum === 'canli' || mac.durum === 'devre';
  const yazi_ = mac.durum === 'bitti' ? 'BİTTİ' : mac.durum === 'devre' ? 'DEVRE' : canli ? `${mac.dk}'` : bekle || '';
  return (
    <View style={[o.hap, { backgroundColor: canli ? 'rgba(255,60,90,0.22)' : 'rgba(255,255,255,0.14)' }]}>
      {canli && <CanliNokta renk="#FF4D6D" boyut={4} />}
      <Text style={[o.hapYazi, { color: canli ? '#FFD0D8' : '#fff' }]}>{yazi_}</Text>
    </View>
  );
}

// ---- üst şerit ----
// Telefon: tek satır "← GS 1–0 KAS · 36′ ⌄"; dokununca büyük tabela (altta, çağıranın verdiği `tabela`) açılır. Bilgisayar: "← Tribün … Galatasaray 1–0 Kasımpaşa … CANLI · 36′ · 842" + dakika şeridi.
export function OdaUstSerit({ mac, olaylar, dkSayi, geri, genis, acik, degistir, bekle, tabela }: { mac: TribunMac; olaylar: TribunOlay[]; dkSayi: number; geri?: () => void; genis: boolean; acik: boolean; degistir: () => void; bekle?: string; tabela?: ReactNode }) {
  const oncesi = mac.durum === 'oncesi';
  const skor = oncesi ? '– –' : `${mac.skor.ev}–${mac.skor.dep}`;
  if (genis) {
    return (
      <View style={{ backgroundColor: ZEMIN }}>
        <LinearGradient colors={[sa(mac.ev.renk, 0.5), 'rgba(0,0,0,0)', sa(mac.dep.renk, 0.5)]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
        <View style={o.masaSatir}>
          {geri && <Bas onPress={geri} etiket="Geri" style={o.geri} hoverRenk="rgba(255,255,255,0.1)"><Ikon ad="geri" boyut={21} renk="#fff" /></Bas>}
          <Text style={[o.masaBaslik, !geri && { marginLeft: 8 }]}>Tribün</Text>
          <View style={o.masaOrta}>
            <Text style={o.masaTakim} numberOfLines={1}>{mac.ev.ad}</Text>
            <TakimRozeti t={mac.ev} boyut={26} />
            <Text style={o.masaSkor}>{skor}</Text>
            <TakimRozeti t={mac.dep} boyut={26} />
            <Text style={o.masaTakim} numberOfLines={1}>{mac.dep.ad}</Text>
          </View>
          <DurumHapi mac={mac} bekle={bekle} />
          {mac.odada > 0 && <View style={o.odada}><Ikon ad="kisi" boyut={12} renk="rgba(255,255,255,0.85)" kalinlik={2.2} /><Text style={o.odadaYazi}>{mac.odada}</Text></View>}
        </View>
        <IncePerde mac={mac} olaylar={olaylar} dkSayi={dkSayi} boy={4} isaret />
      </View>
    );
  }
  return (
    <View>
      <View style={{ backgroundColor: ZEMIN }}>
        <View style={o.satir}>
          {geri && <Bas onPress={geri} etiket="Geri" style={o.geri}><Ikon ad="geri" boyut={21} renk="#fff" /></Bas>}
          <Bas onPress={degistir} etiket={acik ? 'Maç kartını küçült' : 'Maç kartını aç'} style={o.tikla}>
            <TakimRozeti t={mac.ev} boyut={22} />
            <Text style={o.kisa}>{mac.ev.kisa}</Text>
            <Text style={o.skor}>{skor}</Text>
            <Text style={o.kisa}>{mac.dep.kisa}</Text>
            <TakimRozeti t={mac.dep} boyut={22} />
            <View style={{ flex: 1 }} />
            <DurumHapi mac={mac} bekle={bekle} />
            <View style={{ transform: [{ rotate: acik ? '90deg' : '-90deg' }], marginLeft: 8 }}><Ikon ad="sol" boyut={20} renk="rgba(255,255,255,0.85)" kalinlik={2.4} /></View>
          </Bas>
        </View>
        <IncePerde mac={mac} olaylar={olaylar} dkSayi={dkSayi} />
      </View>
      {acik && <View style={{ paddingHorizontal: 12, paddingTop: 8 }}>{tabela}</View>}
    </View>
  );
}

// ---- uçan emoji ----
type Ucan = { id: number; emoji: string; x: number; kayma: number };
function UcanEmoji({ u, bitti }: { u: Ucan; bitti: (id: number) => void }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(a, { toValue: 1, duration: 1250, easing: Easing.out(Easing.cubic), useNativeDriver: YEREL_SURUCU }).start(() => bitti(u.id));
  }, []);
  return (
    <Animated.Text
      pointerEvents="none"
      style={{ position: 'absolute', left: u.x - 14, bottom: 6, fontSize: 28, opacity: a.interpolate({ inputRange: [0, 0.12, 0.7, 1], outputRange: [0, 1, 0.9, 0] }), transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [0, -120] }) }, { translateX: a.interpolate({ inputRange: [0, 1], outputRange: [0, u.kayma] }) }, { scale: a.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.7, 1.25, 1.5] }) }] }}
    >
      {u.emoji}
    </Animated.Text>
  );
}

// ---- tepki satırı: "Tribün nabzı · son 1 dk" + çipler (+ Bildir) ----
const IPUCU_ANAHTAR = 'yazsammi.tribun.tepkiIpucu';
export function TepkiSatiri({ nabiz, bas, bildir }: { nabiz?: Record<string, number>; bas: (k: TribunTepkiTur) => void; bildir?: () => void }) {
  const R = useRenk();
  const [ucanlar, ucanAyarla] = useState<Ucan[]>([]);
  const sayac = useRef(0);
  const katman = useRef<View>(null);
  const az = useRef(false); // hareket azaltma
  const [ipucu, ipucuAyarla] = useState(false);
  const son = useRef<number[]>([]);
  const [yavas, yavasAyarla] = useState(false);
  useEffect(() => {
    const f = AccessibilityInfo.isReduceMotionEnabled?.();
    if (f && typeof f.then === 'function') f.then((x) => { az.current = !!x; }).catch(() => {});
    if (depoOku(IPUCU_ANAHTAR) !== '1') ipucuAyarla(true);
  }, []);
  const ipucuKapat = () => { if (ipucu) { ipucuAyarla(false); depoYaz(IPUCU_ANAHTAR, '1'); } };
  const ucur = (emoji: string, pageX?: number) => {
    if (az.current) return;
    const kur = (x: number) => ucanAyarla((l) => [...l.slice(-7), { id: ++sayac.current, emoji, x, kayma: (Math.random() - 0.5) * 36 }]);
    if (katman.current && typeof pageX === 'number') (katman.current as any).measureInWindow?.((lx: number) => kur(Math.max(14, pageX - lx)));
    else kur(40);
  };
  const dokun = (k: TribunTepkiTur, e?: any) => {
    ipucuKapat();
    // Kişi başı 10 sn'de en çok 5 (sunucuyla aynı kural): fazlası gönderilmez, kısa uyarı
    const an = Date.now();
    son.current = son.current.filter((t) => an - t < 10000);
    if (son.current.length >= 5) { yavasAyarla(true); setTimeout(() => yavasAyarla(false), 1600); return; }
    son.current.push(an);
    ucur(tepkiBul(k).emoji, e?.nativeEvent?.pageX);
    bas(k);
  };
  return (
    <View>
      <View ref={katman} pointerEvents="none" style={o.ucusKatman}>
        {ucanlar.map((u) => <UcanEmoji key={u.id} u={u} bitti={(id) => ucanAyarla((l) => l.filter((x) => x.id !== id))} />)}
      </View>
      {ipucu && (
        <Bas onPress={ipucuKapat} etiket="İpucunu kapat" style={[o.ipucu, { backgroundColor: R.gece ? '#F2EEF8' : '#1D1830' }]}>
          <Text style={[o.ipucuBaslik, { color: R.gece ? '#1D1830' : '#fff' }]}>Bas, tribüne sesini kat</Text>
          <Text style={[o.ipucuAlt, { color: R.gece ? '#6B6480' : 'rgba(255,255,255,0.7)' }]}>Sayılar son 1 dakikada basanları gösterir</Text>
          <View style={[o.ipucuOk, { borderTopColor: R.gece ? '#F2EEF8' : '#1D1830' }]} />
        </Bas>
      )}
      {yavas && <View style={[o.yavas, { backgroundColor: R.ust, borderColor: R.cizgi }]}><Text style={[o.yavasYazi, { color: R.murekkep }]}>Biraz yavaş, tribün duysun</Text></View>}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7, paddingHorizontal: 12, alignItems: 'center' }} style={{ flexGrow: 0 }}>
        <View style={o.nabiz} accessibilityLabel="Tribün nabzı, son 1 dakika">
          <CanliNokta renk={R.kalp} boyut={5} />
          <View>
            <Text style={[o.nabizBaslik, { color: R.murekkep }]}>Tribün nabzı</Text>
            <Text style={[o.nabizAlt, { color: R.soluk }]}>son 1 dk</Text>
          </View>
        </View>
        {TEPKILER.map((t) => <TepkiCipi key={t.k} t={t} sayi={nabiz?.[t.k] ?? 0} dokun={dokun} />)}
        {bildir && (
          <Bas onPress={bildir} style={[o.cip, { borderColor: R.vurgu, backgroundColor: R.vurguYumusak }]} etiket="Veriyi şimdi kontrol ettir">
            <Ikon ad="bayrak" boyut={13} renk={R.vurgu} kalinlik={2.2} />
            <Text style={[o.cipYazi, { color: R.vurgu }]}>Bildir</Text>
          </Bas>
        )}
      </ScrollView>
    </View>
  );
}
// Çip: emoji + ad + son 1 dk'da basan kişi sayısı; basış olayı (pageX: emojinin çıkış yeri) iletilir
function TepkiCipi({ t, sayi, dokun }: { t: (typeof TEPKILER)[number]; sayi: number; dokun: (k: TribunTepkiTur, e?: any) => void }) {
  const R = useRenk();
  return (
    <Pressable
      onPress={(e) => dokun(t.k, e)}
      accessibilityRole="button"
      accessibilityLabel={`${t.ad} tepkisi${sayi ? `, son 1 dakikada ${sayi} kişi` : ''}`}
      style={({ hovered, pressed }: { hovered?: boolean; pressed: boolean }) => [o.cip, { borderColor: R.cizgi, backgroundColor: hovered ? R.vurguYumusak : R.ust }, pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] }]}
    >
      <Text style={o.cipEmoji}>{t.emoji}</Text>
      <Text style={[o.cipYazi, { color: R.murekkep }]}>{t.ad}</Text>
      {sayi > 0 && <Text style={[o.cipSayi, { color: R.soluk }]}>{sayi}</Text>}
    </Pressable>
  );
}

// ---- sohbetteki tepki satırı ----
export function TepkiSatir({ x }: { x: TribunTepkiSatiri }) {
  const R = useRenk();
  const t = tepkiBul(x.tur);
  const kimi = x.kisi > 1 ? `${x.ad} ve ${x.kisi - 1} kişi` : x.ad;
  return (
    <View style={[o.sSatir, x.ben && { alignSelf: 'flex-end' }]} accessibilityLabel={`${kimi} ${t.satir}${x.n > 1 ? ` ${x.n} kez` : ''}`}>
      <View style={[o.sHap, { backgroundColor: R.gece ? 'rgba(255,255,255,0.045)' : 'rgba(29,24,48,0.045)', borderColor: x.ben ? sa(R.vurgu, 0.55) : R.ince }]}>
        <Text style={o.sEmoji}>{t.emoji}</Text>
        <Text style={[o.sAd, { color: R.murekkep }]} numberOfLines={1}>{kimi}</Text>
        <Text style={[o.sTur, { color: R.soluk }]}>{t.satir}</Text>
        {x.n > 1 && <Text style={[o.sSayi, { color: R.kalp }]}>×{x.n}</Text>}
      </View>
    </View>
  );
}

const o = StyleSheet.create({
  satir: { height: 54, flexDirection: 'row', alignItems: 'center', paddingLeft: 8, paddingRight: 14 },
  geri: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  tikla: { flex: 1, height: 54, flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 4 },
  kisa: { fontFamily: yazi.kalin, fontSize: 14, color: '#fff', letterSpacing: 0.3 },
  skor: { fontFamily: yazi.marka, fontSize: 25, color: '#fff', letterSpacing: -1.2, marginHorizontal: 2, fontVariant: ['tabular-nums'] },
  hap: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  hapYazi: { fontFamily: yazi.kalin, fontSize: 11.5, letterSpacing: 0.4 },
  masaSatir: { height: 60, flexDirection: 'row', alignItems: 'center', paddingLeft: 12, paddingRight: 18, gap: 10 },
  masaBaslik: { fontFamily: yazi.kalin, fontSize: 18, color: '#fff', letterSpacing: -0.3 },
  masaOrta: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  masaTakim: { fontFamily: yazi.kalin, fontSize: 14.5, color: '#fff', maxWidth: 170 },
  masaSkor: { fontFamily: yazi.marka, fontSize: 26, color: '#fff', letterSpacing: -1.2, minWidth: 74, textAlign: 'center', fontVariant: ['tabular-nums'] },
  odada: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  odadaYazi: { fontFamily: yazi.kalin, fontSize: 12, color: 'rgba(255,255,255,0.85)' },
  ucusKatman: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 0, zIndex: 20, overflow: 'visible' },
  nabiz: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingRight: 2 },
  nabizBaslik: { fontFamily: yazi.kalin, fontSize: 12.5, lineHeight: 15 },
  nabizAlt: { fontFamily: yazi.normal, fontSize: 11.5, lineHeight: 13 },
  cip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, borderWidth: 1, paddingHorizontal: 13, height: 34 },
  cipYazi: { fontFamily: yazi.orta, fontSize: 13.5 },
  cipEmoji: { fontSize: 15 },
  cipSayi: { fontFamily: yazi.orta, fontSize: 12, fontVariant: ['tabular-nums'] },
  ipucu: { position: 'absolute', left: 12, bottom: 46, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, zIndex: 30, maxWidth: 300 },
  ipucuBaslik: { fontFamily: yazi.kalin, fontSize: 14.5 },
  ipucuAlt: { fontFamily: yazi.normal, fontSize: 12.5, marginTop: 1 },
  ipucuOk: { position: 'absolute', left: 38, bottom: -7, width: 0, height: 0, borderLeftWidth: 7, borderRightWidth: 7, borderTopWidth: 8, borderLeftColor: 'transparent', borderRightColor: 'transparent' },
  yavas: { position: 'absolute', left: 12, bottom: 46, borderRadius: 14, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7, zIndex: 30 },
  yavasYazi: { fontFamily: yazi.orta, fontSize: 13 },
  sSatir: { alignSelf: 'flex-start', maxWidth: '92%', marginVertical: -2 },
  sHap: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, height: 32 },
  sEmoji: { fontSize: 15 },
  sAd: { fontFamily: yazi.kalin, fontSize: 13.5, flexShrink: 1 },
  sTur: { fontFamily: yazi.normal, fontSize: 13.5 },
  sSayi: { fontFamily: yazi.kalin, fontSize: 13, fontVariant: ['tabular-nums'] },
});
