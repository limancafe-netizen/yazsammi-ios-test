// "Yazsam mı?’da" bölümleri (09.10, plan/24 + plan/27): Tribün + Oyun + Ekonomi (27.10) + Astroloji (03.11) yayında; Tarot Kart Analizi (04.11) uygulamada
// yayında, web'de yalnız EXPO_PUBLIC_KAHIN=1 ile (aksi hâlde "Yakında").
// Telefondaki "Diğer bölümler" penceresi, bilgisayar sol rıhtımındaki liste ve sağ paneldeki Tribün kutusu aynı parçaları kullanır.
// Eski bölümler (Ölç, Günün Cümlesi, Balon Avı, eski Gündem, Eğlence) yeni arayüzde görünmez; adresle açılırsa Yenileniyor sayfası çıkar.
import { useEffect, useState } from 'react';
import { Linking, Platform, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path } from 'react-native-svg';
import { yazi } from '@/tema/tema';
import { DONEM } from '@/tema/donem';
import * as C from '@/canli';
import type { TribunDurum, TribunMac } from '@/canli';
import { GENIS_SINIR } from '@/bilesenler/Genis';
import { Bas, CanliNokta, Ikon, KAHIN_ACIK, TRIBUN_ACIK, useRenk } from './ortak';
import { useCanli, type Ekran } from './baglam';
import { gunBasligi, saatYaz } from './tribunOrtak';

export type BolumAd = 'tribun' | 'dizi' | 'oyna' | 'gundem' | 'stil' | 'ekonomi' | 'astroloji' | 'tarot';

// Yakında bölümleri: söz ya da tarih yok, yalnız ne olacağı.
export const YAKINDA: { ad: Exclude<BolumAd, 'tribun'>; baslik: string; alt: string }[] = [
  // 23.10 (Onur: site turunda "Yakında: Ekonomi, Astroloji, Tarot"): liste turdaki söze uyar. Dizi · Gündem · Stil planı bekliyor (ikonları duruyor).
  // 03.11: Astroloji yayında (Onur taslak 3'ü onayladı) → listeden çıktı; Ekonomi'nin yanında kendi kartı var.
  ...(KAHIN_ACIK ? [] : [{ ad: 'tarot' as const, baslik: 'Tarot Kart Analizi', alt: 'Sorunu yaz, kartlarını kendin seç' }]),
];

// Oyun (22.10): /oyun sayfası (Birlikte Uç, Taş Ustası, Tavla) uygulamanın dışında, sitenin kendi sayfası; aynı sekmede açılır.
// 06.11: telefon uygulamasında Oyun da uygulamanın içinde (WebView, SiteBolumu.native.tsx); eskiden Chrome'a atıyordu.
export function oyunAc(git?: (e: Ekran) => void) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') { window.location.href = '/oyun/'; return; }
  if (git) { git({ tur: 'oyun' }); return; }
  Linking.openURL('https://yazsammi.com/oyun/').catch(() => {});
}

// Ekonomi (27.10, Onur "canlıya alabiliriz"): /ekonomi sayfası (piyasalar, takvim, bilanço, portföy).
// Bilgisayarda (geniş düzen, git verilmişse) Canlı'nın içinde, sol rıhtım ve sağ panelle birlikte açılır; telefonda Oyun gibi
// sitenin kendi sayfası olarak aynı sekmede açılır.
export function ekonomiAc(git?: (e: Ekran) => void) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    if (git && window.innerWidth >= GENIS_SINIR) git({ tur: 'ekonomi' });
    else window.location.href = '/ekonomi/';
    return;
  }
  // 06.11: telefon uygulamasında uygulamanın içinde (WebView, Astroloji/Tarot gibi); eskiden Chrome'a atıyordu.
  if (git) { git({ tur: 'ekonomi' }); return; }
  Linking.openURL('https://yazsammi.com/ekonomi/').catch(() => {});
}

// Astroloji (03.11, Onur taslak 3 onayı): /astroloji sayfası (gerçek yıldız verili 3B gökyüzü, burçlar, yıldız haritası, aşk uyumu).
// Ekonomi ile aynı yol: bilgisayarda (geniş düzen, git verilmişse) Canlı'nın içinde iframe; telefonda (web) sitenin kendi sayfası aynı sekmede.
// 04.11: telefon uygulamasında uygulamanın içinde gerçek ekran (SiteBolumu.native.tsx, WebView); yol verilirse (#/harita, #/ask, #/burc/<0-11>) o bölüme gider.
export function astrolojiAc(git?: (e: Ekran) => void, yol = '') {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    if (git && !yol && window.innerWidth >= GENIS_SINIR) git({ tur: 'astroloji' });
    else window.location.href = `/astroloji/${yol}`;
    return;
  }
  if (git) { git({ tur: 'astroloji', ...(yol ? { yol } : {}) }); return; }
  Linking.openURL(`https://yazsammi.com/astroloji/${yol}`).catch(() => {});
}

// Tarot Kart Analizi (04.11): /tarot sayfası (KAHİN baykuş, kural tabanlı okuma; site/tarot). Astroloji ile aynı yol: telefon uygulamasında
// WebView ekranı ({ tur: 'kahin' }), bilgisayarda Canlı'nın içinde iframe, telefon boyu tarayıcıda sitenin kendi sayfası.
// Web'de giriş yalnız KAHIN_ACIK (EXPO_PUBLIC_KAHIN=1) iken görünür; çağıran bunu denetler.
export function tarotAc(git: (e: Ekran) => void) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    if (window.innerWidth >= GENIS_SINIR) git({ tur: 'kahin' });
    else window.location.href = '/tarot/';
    return;
  }
  git({ tur: 'kahin' });
}

// Aynı çizgi dili (24 ızgara, yuvarlak uç) — rıhtım simgeleriyle uyumlu.
const YOLLAR: Record<BolumAd, string[]> = {
  tribun: ['M12 8.2l3.4 2.5-1.3 4h-4.2l-1.3-4Z', 'M12 8.2V3.2', 'M15.4 10.7l4.9-1.7', 'M14.1 14.7l3 4.2', 'M9.9 14.7l-3 4.2', 'M8.6 10.7L3.7 9'],
  dizi: ['M4 11h16v7.5a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 18.5Z', 'M3.4 7.4 19.9 3.6l.7 3.2L4.1 10.6Z', 'M8.2 4.6l1.3 3.3', 'M13.1 3.6l1.3 3.2'],
  oyna: ['M7.5 7h9a5.2 5.2 0 0 1 5 6.6l-.9 3.2a2.4 2.4 0 0 1-4 1L14.4 15.4H9.6L7.4 17.8a2.4 2.4 0 0 1-4-1l-.9-3.2A5.2 5.2 0 0 1 7.5 7Z', 'M8 9.8v3.2', 'M6.4 11.4h3.2'],
  gundem: ['M3 12.5h4l2.6-6.8 4.2 12.6 2.6-5.8H21'],
  stil: ['M9.6 6.3a2.5 2.5 0 1 1 3.9 2.1c-.9.6-1.5 1-1.5 2', 'M12 10.4 3.5 15.7a1.4 1.4 0 0 0 .8 2.6h15.4a1.4 1.4 0 0 0 .8-2.6Z'],
  ekonomi: ['M4 20h16', 'M6.5 20v-6', 'M12 20V9', 'M17.5 20V5'],
  astroloji: ['M20 14.2A8.2 8.2 0 1 1 9.8 4a6.6 6.6 0 0 0 10.2 10.2Z', 'M17.6 3.6v3.2', 'M16 5.2h3.2'],
  tarot: ['M7.2 3.5h9.6A1.5 1.5 0 0 1 18.3 5v14a1.5 1.5 0 0 1-1.5 1.5H7.2A1.5 1.5 0 0 1 5.7 19V5a1.5 1.5 0 0 1 1.5-1.5Z', 'M12 8.3l1.1 2.4 2.5.3-1.9 1.7.5 2.5L12 13.9l-2.2 1.3.5-2.5-1.9-1.7 2.5-.3Z'],
};
export function BolumIkon({ ad, boyut = 22, renk, kalinlik = 1.75 }: { ad: BolumAd; boyut?: number; renk: string; kalinlik?: number }) {
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24" fill="none">
      {ad === 'tribun' && <Circle cx={12} cy={12} r={9.2} stroke={renk} strokeWidth={kalinlik} />}
      {ad === 'oyna' && <Circle cx={16.1} cy={11} r={0.9} fill={renk} stroke="none" />}
      {YOLLAR[ad].map((d, i) => (
        <Path key={i} d={d} stroke={renk} strokeWidth={kalinlik} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      ))}
    </Svg>
  );
}

// Tribün durumu (canlı maç, yaklaşan maç). Tek yoklama her kullanan için ayrı; 15 sn'de bir. Sunucuda kapalıysa null kalır.
export function useTribunDurum(): TribunDurum | null {
  const c = useCanli();
  const [d, dAyarla] = useState<TribunDurum | null>(null);
  useEffect(() => {
    if (C.ORNEK || !TRIBUN_ACIK) return; // iOS'ta Tribün yok: yoklama da yok
    let iptal = false;
    let kapali = false;
    const bak = () => {
      if (kapali) return;
      C.tribunDurum().then((x) => {
        if (iptal) return;
        if (x === 'kapali') { kapali = true; dAyarla(null); } else dAyarla(x);
      });
    };
    bak();
    const t = setInterval(bak, 15000);
    return () => { iptal = true; clearInterval(t); };
  }, [c.uye?.uid]);
  return d;
}

// Tribün'ün tek satır durumu: canlıysa skor, yaklaşıyorsa saat, yoksa tanıtım.
export function tribunOzet(d: TribunDurum | null): { canli: TribunMac | null; yaklasan: TribunMac | null; yazi: string } {
  const m = d?.canli[0] ?? null;
  const y = !m ? d?.yaklasan ?? null : null;
  if (m) return { canli: m, yaklasan: null, yazi: `${m.ev.kisa} ${m.skor.ev}–${m.skor.dep} ${m.dep.kisa} · ${m.durum === 'devre' ? 'devre arası' : `${m.dk}’`}` };
  if (y && d) return { canli: null, yaklasan: y, yazi: `${gunBasligi(y.baslangic, d.simdi).split(' · ')[0]} ${saatYaz(y.baslangic)} · ${y.ev.kisa}–${y.dep.kisa}` };
  return { canli: null, yaklasan: null, yazi: 'Maç odası: gol, kart ve karar anları canlı.' };
}

// Telefon penceresinin üstündeki büyük Tribün kartı: dönem kapağının koyu degradesi, beyaz yazı (gece ve gündüzde aynı).
export function TribunKapisi({ ac }: { ac: () => void }) {
  const R = useRenk();
  const d = useTribunDurum();
  const o = tribunOzet(d);
  const renk = DONEM.tespit[0];
  return (
    <Bas onPress={ac} rol="link" etiket={o.canli ? 'Tribün, maç canlı' : 'Tribün'} style={s.kapiKap}>
      <LinearGradient colors={renk} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.kapi}>
        <View style={s.kapiIsik} />
        <View style={s.kapiUst}>
          <View style={s.kapiIkon}>
            <BolumIkon ad="tribun" boyut={26} renk="#fff" kalinlik={1.8} />
          </View>
          {o.canli ? (
            <View style={s.canliHap}>
              <CanliNokta renk="#fff" boyut={5} />
              <Text style={s.canliYazi}>CANLI</Text>
            </View>
          ) : (
            <View style={[s.canliHap, { backgroundColor: 'rgba(255,255,255,0.14)' }]}>
              <Text style={s.canliYazi}>YAYINDA</Text>
            </View>
          )}
        </View>
        <Text style={s.kapiAd}>Tribün</Text>
        <Text style={s.kapiAlt} numberOfLines={2}>{o.yazi}</Text>
        <View style={s.kapiDugme}>
          <Text style={[s.kapiDugmeYazi, { color: renk[0] }]}>{o.canli ? 'Tribüne gir' : 'Tribüne bak'}</Text>
          <Ikon ad="ok" boyut={15} renk={renk[0]} kalinlik={2.6} />
        </View>
      </LinearGradient>
    </Bas>
  );
}

export function YakindaHap({ kucuk }: { kucuk?: boolean }) {
  const R = useRenk();
  return (
    <View style={[s.hap, { backgroundColor: R.vurguYumusak }, kucuk && { paddingHorizontal: 7, height: 18 }]}>
      <Text style={[s.hapYazi, { color: R.vurgu }, kucuk && { fontSize: 10 }]}>Yakında</Text>
    </View>
  );
}

// "Yakında" kartı: tıklanmaz (gidecek yeri yok), sakin ve şık; söz ya da tarih yok.
export function YakindaKarti({ b }: { b: (typeof YAKINDA)[number] }) {
  const R = useRenk();
  return (
    <View style={[s.yk, { backgroundColor: R.ust, borderColor: R.ince }]} accessible accessibilityLabel={`${b.baslik}, yakında`}>
      <LinearGradient colors={['rgba(255,255,255,0)', R.vurguYumusak]} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
      <View style={s.ykUst}>
        <View style={[s.ykIkon, { backgroundColor: R.vurguYumusak }]}>
          <BolumIkon ad={b.ad} boyut={22} renk={R.vurgu} />
        </View>
        <YakindaHap />
      </View>
      <Text style={[s.ykAd, { color: R.murekkep }]}>{b.baslik}</Text>
      <Text style={[s.ykAlt, { color: R.soluk }]} numberOfLines={2}>{b.alt}</Text>
    </View>
  );
}

// Tarot Kart Analizi (04.11; 29.10'daki KAHİN kartının yeri): ilk tam okuma ücretsiz, sonrası uygulamada Google Play ile.
export function KahinKarti() {
  const R = useRenk();
  const c = useCanli();
  return (
    <Bas onPress={() => tarotAc(c.git)} rol="link" etiket="Tarot Kart Analizi: sorunu yaz, kartlarını kendin seç" style={[s.oyun, { backgroundColor: R.ust, borderColor: R.ince }]} hoverRenk={R.ince}>
      <LinearGradient colors={['rgba(255,255,255,0)', R.vurguYumusak]} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
      <View style={[s.oyunIkon, { backgroundColor: R.vurguYumusak }]}>
        <BolumIkon ad="tarot" boyut={26} renk={R.vurgu} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[s.ykAd, { color: R.murekkep, fontSize: 19 }]}>Tarot Kart Analizi</Text>
        <Text style={[s.ykAlt, { color: R.soluk, fontSize: 13.5 }]} numberOfLines={1}>Sorunu yaz · Kartlarını kendin seç</Text>
      </View>
      <View style={[s.oyunDugme, { backgroundColor: R.vurgu }]}>
        <Text style={s.oyunDugmeYazi}>Aç</Text>
      </View>
    </Bas>
  );
}

// Oyun kartı: Tribün kapısının altında, tıklanır (oyunlar sayfasına gider).
export function OyunKarti() {
  const R = useRenk();
  const c = useCanli();
  return (
    <Bas onPress={() => oyunAc(c.git)} rol="link" etiket="Oyun: Birlikte Uç, Taş Ustası ve Tavla" style={[s.oyun, { backgroundColor: R.ust, borderColor: R.ince }]} hoverRenk={R.ince}>
      <LinearGradient colors={['rgba(255,255,255,0)', R.vurguYumusak]} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
      <View style={[s.oyunIkon, { backgroundColor: R.vurguYumusak }]}>
        <BolumIkon ad="oyna" boyut={26} renk={R.vurgu} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[s.ykAd, { color: R.murekkep, fontSize: 19 }]}>Oyun</Text>
        <Text style={[s.ykAlt, { color: R.soluk, fontSize: 13 }]} numberOfLines={1}>Birlikte Uç · Taş Ustası · Tavla</Text>
      </View>
      <View style={[s.oyunDugme, { backgroundColor: R.vurgu }]}>
        <Text style={s.oyunDugmeYazi}>Oyna</Text>
      </View>
    </Bas>
  );
}

// Ekonomi kartı: Oyun kartının altında, tıklanır (ekonomi sayfasına gider).
export function EkonomiKarti() {
  const R = useRenk();
  const c = useCanli();
  return (
    <Bas onPress={() => ekonomiAc(c.git)} rol="link" etiket="Ekonomi: piyasalar, takvim, bilanço, portföy" style={[s.oyun, { backgroundColor: R.ust, borderColor: R.ince }]} hoverRenk={R.ince}>
      <LinearGradient colors={['rgba(255,255,255,0)', R.vurguYumusak]} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
      <View style={[s.oyunIkon, { backgroundColor: R.vurguYumusak }]}>
        <BolumIkon ad="ekonomi" boyut={26} renk={R.vurgu} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[s.ykAd, { color: R.murekkep, fontSize: 19 }]}>Ekonomi</Text>
        <Text style={[s.ykAlt, { color: R.soluk, fontSize: 13.5 }]} numberOfLines={1}>Piyasalar · Takvim · Portföy</Text>
      </View>
      <View style={[s.oyunDugme, { backgroundColor: R.vurgu }]}>
        <Text style={s.oyunDugmeYazi}>Aç</Text>
      </View>
    </Bas>
  );
}

// Astroloji kartı: Ekonomi kartının altında, tıklanır (astroloji sayfasına gider).
export function AstrolojiKarti() {
  const R = useRenk();
  const c = useCanli();
  return (
    <Bas onPress={() => astrolojiAc(c.git)} rol="link" etiket="Astroloji: gökyüzü, burçlar, yıldız haritası, aşk uyumu" style={[s.oyun, { backgroundColor: R.ust, borderColor: R.ince }]} hoverRenk={R.ince}>
      <LinearGradient colors={['rgba(255,255,255,0)', R.vurguYumusak]} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
      <View style={[s.oyunIkon, { backgroundColor: R.vurguYumusak }]}>
        <BolumIkon ad="astroloji" boyut={26} renk={R.vurgu} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[s.ykAd, { color: R.murekkep, fontSize: 19 }]}>Astroloji</Text>
        <Text style={[s.ykAlt, { color: R.soluk, fontSize: 13.5 }]} numberOfLines={1}>Gökyüzü · Burçlar · Haritam · Uyum</Text>
      </View>
      <View style={[s.oyunDugme, { backgroundColor: R.vurgu }]}>
        <Text style={s.oyunDugmeYazi}>Aç</Text>
      </View>
    </Bas>
  );
}

// Telefondaki pencerenin içi.
export function BolumKartlari({ tribunAc }: { tribunAc: () => void }) {
  return (
    <View style={s.liste}>
      {TRIBUN_ACIK && <TribunKapisi ac={tribunAc} />}
      <OyunKarti />
      <EkonomiKarti />
      <AstrolojiKarti />
      {KAHIN_ACIK && <KahinKarti />}
      <View style={s.izgara}>
        {YAKINDA.map((b) => (
          <View key={b.ad} style={s.ykYer}>
            <YakindaKarti b={b} />
          </View>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  liste: { padding: 16, gap: 12 },
  kapiKap: { borderRadius: 24 },
  kapi: { borderRadius: 24, padding: 18, gap: 4, overflow: 'hidden' },
  kapiIsik: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: '#fff', opacity: 0.07, right: -70, top: -100 },
  kapiUst: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  kapiIkon: { width: 46, height: 46, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  canliHap: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 24, borderRadius: 999, paddingHorizontal: 10, backgroundColor: 'rgba(255,255,255,0.22)' },
  canliYazi: { fontFamily: yazi.kalin, fontSize: 10.5, letterSpacing: 0.9, color: '#fff' },
  kapiAd: { fontFamily: yazi.kalin, fontSize: 28, lineHeight: 32, letterSpacing: -0.8, color: '#fff' },
  kapiAlt: { fontFamily: yazi.normal, fontSize: 14.5, lineHeight: 20, color: 'rgba(255,255,255,0.86)' },
  kapiDugme: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderRadius: 999, paddingVertical: 8, paddingHorizontal: 16, marginTop: 10, backgroundColor: '#fff' },
  kapiDugmeYazi: { fontFamily: yazi.kalin, fontSize: 14 },
  izgara: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  ykYer: { width: '48.3%', flexGrow: 1 },
  oyun: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 20, borderWidth: 1, padding: 14, overflow: 'hidden' },
  oyunIkon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  oyunDugme: { borderRadius: 999, paddingVertical: 9, paddingHorizontal: 18 },
  oyunDugmeYazi: { fontFamily: yazi.kalin, fontSize: 14.5, color: '#fff' },
  yk: { borderRadius: 20, borderWidth: 1, padding: 14, gap: 4, overflow: 'hidden', minHeight: 138 },
  ykUst: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  ykIkon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  ykAd: { fontFamily: yazi.kalin, fontSize: 17, letterSpacing: -0.3 },
  ykAlt: { fontFamily: yazi.normal, fontSize: 12.5, lineHeight: 17 },
  hap: { height: 22, borderRadius: 999, paddingHorizontal: 9, alignItems: 'center', justifyContent: 'center' },
  hapYazi: { fontFamily: yazi.kalin, fontSize: 11, letterSpacing: 0.2 },
});
