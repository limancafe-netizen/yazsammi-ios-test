// Canlı akışın çerçevesi — "Balon Rıhtımı" (Onur 08.10 onayı; plan/23_MENU_PROFIL_TASARIM/menu_a*.html, plan/25_YAZ_DUGMESI/birlesik.html):
// - Telefon: üst çubuk (logo · CANLI · Tribün · Oyun · Ekonomi · Astroloji · tema) + HER ekranda altta yüzen rıhtım: Canlı (çay bardağı) · Sohbet · [Yaz = logo]
//   · Yankı (bildirimler) · Ben. Klavye açıkken rıhtım gizlenir.
// - Bilgisayar: solda yüzen dikey rıhtım (logo, Yaz düğmesi, sekmeler, "Yazsam mı?’da" bölümleri, Ben kutusu), ortada ekrana yayılan
//   akış, sağda canlı panel (22.10 taslak: figür köşesi + şu an burada, günün görevi, yakında, Tribün).
// 09.10 (Onur: eski stilde kalan her şey yeni dile döner): "Yazsam mı?’da" = Tribün (yayında) + Dizi · Oyna · Gündem · Stil (Yakında);
// eski bölümlere (Ölç, Günün Cümlesi, Balon Avı, Gündem, Eğlence) hiçbir yerden bağlantı yok (bilesenler/canli/bolumler.tsx).
import { useRef, useState, type ReactNode } from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { APPSTORE, INSTAGRAM } from '@/analiz';
import { useGenis } from '@/bilesenler/Genis';
import { MarkaYazisi, MarkaYazisiIki } from '@/bilesenler/Marka';
import { useTema } from '@/tema/TemaSaglayici';
import { yazi } from '@/tema/tema';
import { kayitliUye, type Gonderi } from '@/canli';
import { Avatar, Bas, CanliNokta, Dugme, Ikon, KAHIN_ACIK, Pencere, TRIBUN_ACIK, useRenk } from './ortak';
import { useCanli } from './baglam';
import { FigurKosesi, GununGorevi, Yakinda, useGunlukGorev } from './SagKose';
import { UygulamaIndir, indirGoster } from './UygulamaIndir';
import { TakimRozeti, gunBasligi, saatYaz } from './tribunOrtak';
import { BolumIkon, BolumKartlari, YAKINDA, YakindaHap, astrolojiAc, ekonomiAc, oyunAc, tarotAc, tribunOzet, useTribunDurum, type BolumAd } from './bolumler';
import { MenuIkon, VurguBalonu, type MenuIkonAd } from './menuIkon';
import { YazDugmesi, type YazDugmesiTutamak } from './YazDugmesi';

export function CanliEtiketi({ kucuk = false }: { kucuk?: boolean }) {
  const R = useRenk();
  return (
    <View style={[s.canli, { backgroundColor: R.vurguYumusak }, kucuk && { paddingRight: 5 }]}>
      <CanliNokta renk={R.vurgu} boyut={kucuk ? 5 : 6} />
      <Text style={[s.canliYazi, { color: R.vurgu }, kucuk && { fontSize: 9, letterSpacing: 0.4 }]}>CANLI</Text>
    </View>
  );
}

// Alt ekranların başlığı (geri oku + başlık).
export function UstBaslik({ baslik, geri, sag }: { baslik: string; geri?: () => void; sag?: ReactNode }) {
  const R = useRenk();
  // Telefon (Android 15 kenardan kenara): başlık durum çubuğunun altına girmesin. Sitede (web) değişmez.
  const ust = useSafeAreaInsets().top;
  const pay = Platform.OS === 'web' ? 0 : ust;
  return (
    <View style={[s.ustBaslik, { borderBottomColor: R.ince, backgroundColor: R.panel }, pay > 0 && { paddingTop: pay, height: 54 + pay }]}>
      {geri && (
        <Bas onPress={geri} etiket="Geri" style={s.geri} hoverRenk={R.hover}>
          <Ikon ad="geri" boyut={21} renk={R.murekkep} />
        </Bas>
      )}
      <Text style={[s.ustBaslikYazi, { color: R.murekkep }, !geri && { marginLeft: 8 }]} numberOfLines={1}>{baslik}</Text>
      <View style={{ flex: 1 }} />
      {sag}
    </View>
  );
}

// Herkes / Okuduklarım (takip ettiklerin). Telefonda alt çizgili sekme, bilgisayarda hap.
export function AkisSekmeleri({ tur, sec, hap }: { tur: 'hepsi' | 'takip'; sec: (t: 'hepsi' | 'takip') => void; hap?: boolean }) {
  const R = useRenk();
  const liste = [
    ['hepsi', 'Herkes'],
    ['takip', 'Okuduklarım'],
  ] as const;
  if (hap)
    return (
      <View style={[s.hap, { backgroundColor: R.panel, borderColor: R.ince }]}>
        {liste.map(([k, ad]) => (
          <Pressable key={k} onPress={() => sec(k)} accessibilityRole="tab" accessibilityState={{ selected: tur === k }} style={({ hovered }: { hovered?: boolean; pressed: boolean }) => [s.hapOge, tur === k ? { backgroundColor: R.vurguYumusak } : hovered && { backgroundColor: R.hover }]}>
            <Text style={[s.hapYazi, { color: tur === k ? R.vurgu : R.soluk }]}>{ad}</Text>
          </Pressable>
        ))}
      </View>
    );
  return (
    <View style={[s.sekmeler, { borderBottomColor: R.ince }]}>
      {liste.map(([k, ad]) => (
        <Pressable key={k} onPress={() => sec(k)} accessibilityRole="tab" accessibilityState={{ selected: tur === k }} style={({ hovered }: { hovered?: boolean; pressed: boolean }) => [s.sekme, hovered && { backgroundColor: R.hover }]}>
          <Text style={[s.sekmeYazi, { color: tur === k ? R.murekkep : R.soluk }, tur === k && { fontFamily: yazi.kalin }]}>{ad}</Text>
          {tur === k && <View style={[s.sekmeCizgi, { backgroundColor: R.vurgu }]} />}
        </Pressable>
      ))}
    </View>
  );
}

// Gece/gündüz: taslaktaki çizgi güneş/ay düğmesi.
// yukari: telefon üst çubuğunda etiketli simgelerle aynı hizada (simge üstten 6 px) durmak için.
export function TemaIkonu({ boyut = 40, ikon = 22, yukari = false }: { boyut?: number; ikon?: number; yukari?: boolean }) {
  const R = useRenk();
  const { gece, secimDegistir } = useTema();
  return (
    <Bas onPress={() => secimDegistir(gece ? 'gunduz' : 'gece')} etiket={gece ? 'Gündüz görünümüne geç' : 'Gece görünümüne geç'} style={[s.ikDug, { width: boyut, height: boyut }, yukari && s.yukariIkon]} hoverRenk={R.ince}>
      <Ikon ad={gece ? 'gunes' : 'ay'} boyut={ikon} renk={R.murekkep} kalinlik={1.75} />
    </Bas>
  );
}

// Telefon üst çubuğu: logo (iki satır) · CANLI · sağda bölüm simgeleri + gece/gündüz.
// 27.10 (Onur): "Diğer bölümler" düğmesi ve açılır pencere bu çubuktan kalktı; sağdaki simgeler `bolumler` dizisinden üretilir.
// Astroloji / Tarot ileride eklenince bu diziye bir satır eklemek yeterli (sıra soldan sağa; BolumAd tipinde ad zaten var).
export function TelefonUst({ akisaDon }: { akisaDon: () => void }) {
  const R = useRenk();
  const ust = useSafeAreaInsets();
  const c = useCanli();
  const { width } = useWindowDimensions();
  const tribun = tribunOzet(useTribunDurum());
  // 28.10 (Onur, iPhone: sağdaki gece/gündüz simgesi ekran dışında): çubuk tek satır kalır ama sığmazsa kendini sıkıştırır.
  // Aradaki boşluk (esneyen View) 0'a inerse bir kademe sıkılaşır: 0 normal · 1 boşluksuz, dar öğeler · 2 küçük CANLI + küçük logo · 3 en dar.
  // Genişlik değişince (döndürme, yazı boyutu) kademe baştan hesaplanır.
  const [kademe, kademeAyarla] = useState(0);
  const sonGenislik = useRef(width);
  if (sonGenislik.current !== width) {
    sonGenislik.current = width;
    if (kademe !== 0) kademeAyarla(0);
  }
  const bolumler: { ad: BolumAd; etiket: string; goster: string; ac: () => void; canli?: boolean }[] = [
    ...(!TRIBUN_ACIK ? [] : [{ ad: 'tribun' as const, etiket: tribun.canli ? 'Tribün, maç canlı' : 'Tribün', goster: 'Tribün', ac: () => c.git({ tur: 'tribun' }), canli: !!tribun.canli }]),
    { ad: 'oyna', etiket: 'Oyun', goster: 'Oyun', ac: () => oyunAc(Platform.OS === 'web' ? undefined : c.git) },
    { ad: 'ekonomi', etiket: 'Ekonomi', goster: 'Ekonomi', ac: () => ekonomiAc(Platform.OS === 'web' ? undefined : c.git) },
    { ad: 'astroloji', etiket: 'Astroloji', goster: 'Astroloji', ac: () => astrolojiAc(Platform.OS === 'web' ? undefined : c.git) },
    // 04.11: simgenin altında yer dar, kısa ad; ekran okuyucu tam adı okur
    ...(KAHIN_ACIK ? [{ ad: 'tarot' as const, etiket: 'Tarot Kart Analizi', goster: 'Tarot', ac: () => tarotAc(c.git) }] : []),
  ];
  const dar = width < 360 || kademe >= 1;
  const dokunma = kademe >= 3 ? 38 : kademe >= 1 ? 40 : 44; // dokunma alanı; kademe 3'te bile 38 px
  const ikonBoy = kademe >= 2 ? 20 : dar ? 21 : 22;
  const yaziBoy = kademe >= 2 ? 9 : dar ? 9 : 10;
  return (
    <View style={[s.telUst, { paddingTop: ust.top + 8, backgroundColor: R.panel, borderBottomColor: R.ince }, kademe >= 1 && { gap: 6, paddingHorizontal: 12 }]}>
      <Pressable onPress={akisaDon} accessibilityRole="link" accessibilityLabel="Yazsam mı? ana sayfa" style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <MarkaYazisiIki boyut={kademe >= 2 ? 13 : dar ? 14 : 16} />
      </Pressable>
      <View style={{ marginLeft: kademe >= 1 ? 0 : 4, flexShrink: 0 }}>
        <CanliEtiketi kucuk={kademe >= 2} />
      </View>
      <View key={kademe} style={{ flex: 1, minWidth: 0 }} onLayout={(ev) => { if (ev.nativeEvent.layout.width < 2 && kademe < 3) kademeAyarla(kademe + 1); }} />
      <View style={[s.telSag, { gap: dar ? 0 : 4, flexShrink: 0 }]}>
        {bolumler.map((b) => (
          <Bas key={b.ad} onPress={b.ac} rol="link" etiket={b.etiket} style={[s.telOge, { minWidth: dokunma, height: dokunma }]} hoverRenk={R.ince}>
            <BolumIkon ad={b.ad} boyut={ikonBoy} renk={R.murekkep} kalinlik={1.8} />
            <Text style={[s.telYazi, { color: R.soluk, fontSize: yaziBoy }]} numberOfLines={1}>{b.goster}</Text>
            {!!b.canli && <View style={[s.telNokta, { backgroundColor: R.vurgu, borderColor: R.panel }]} />}
          </Bas>
        ))}
        <TemaIkonu boyut={dokunma} ikon={ikonBoy} yukari />
      </View>
    </View>
  );
}

// Sitenin diğer bölümleri: artık telefon üst çubuğunda açılmıyor (kod duruyor; bilgisayarda sol rıhtımdaki liste ayrı).
export function BolumMenusu({ acik, kapat }: { acik: boolean; kapat: () => void }) {
  const R = useRenk();
  const c = useCanli();
  return (
    <Pencere acik={acik} kapat={kapat} baslik="Yazsam mı?’da" genislik={440}>
      <BolumKartlari tribunAc={() => { kapat(); c.git({ tur: 'tribun' }); }} />
      <View style={s.bolumBag}>
        {(
          [
            ['Gizlilik', '/gizlilik/'],
            ['Şartlar', '/sartlar/'],
          ] as const
        ).map(([ad, yol]) => (
          <Text key={ad} accessibilityRole="link" onPress={() => (Platform.OS === 'web' ? (window.location.href = yol) : Linking.openURL(`https://yazsammi.com${yol}`))} style={[s.altBagYazi, { color: R.soluk }]}>{ad}</Text>
        ))}
      </View>
    </Pencere>
  );
}

// ---------- Balon Rıhtımı (telefon alt menüsü) ----------
export type RihtimSekme = 'canli' | 'sohbet' | 'yanki' | 'ben';
const SEKMELER: { id: RihtimSekme; ad: string; ikon: MenuIkonAd }[] = [
  { id: 'canli', ad: 'Canlı', ikon: 'canli' },
  { id: 'sohbet', ad: 'Sohbet', ikon: 'sohbet' },
  { id: 'yanki', ad: 'Yankı', ikon: 'yanki' },
  { id: 'ben', ad: 'Ben', ikon: 'ben' },
];
const GIRIS_SERIT = 44; // girişsiz ziyaretçi şeridi yüksekliği (alt menünün üstünde)
const cayRengi = (gece: boolean) => (gece ? '#E0502F' : '#C63A22');

// Bilgisayar sol rıhtımı yoğunluğu (pencere yüksekliğine göre): 0 = rahat (>=760), 1 = sıkı (<760), 2 = çok sıkı (<640).
// 09.10 (Onur: "menü aşağı kaymıyor"): menü pencere yüksekliğine sabit; ortası kendi içinde kayar, logo + Yaz üstte, profil satırı altta sabit.
export type Yog = 0 | 1 | 2;
export function useYog(): Yog {
  const { height } = useWindowDimensions();
  return height < 640 ? 2 : height < 760 ? 1 : 0;
}
const DOGE = { h: [50, 42, 36], ikG: [50, 46, 42], ikY: [34, 30, 28], ikBoy: [24, 22, 21], yazi: [16.5, 15.5, 15], balon: [58, 52, 47] } as const;

function RihtimOge({ s: sk, aktif, sayi, yeni, onPress, masa, yog = 0 }: { s: (typeof SEKMELER)[number]; aktif: boolean; sayi?: number; yeni?: boolean; onPress: () => void; masa?: boolean; yog?: Yog }) {
  const R = useRenk();
  const renk = aktif ? R.vurgu : masa ? R.murekkep : R.soluk;
  const ikon = (
    <View style={[s.rIk, masa && { width: DOGE.ikG[yog], height: DOGE.ikY[yog] }]}>
      {aktif && (
        <View style={s.rVurgu} pointerEvents="none">
          <VurguBalonu renk={R.vurguYumusak} genislik={masa ? DOGE.balon[yog] : 58} />
        </View>
      )}
      <View style={{ top: -1 }}>
        <MenuIkon ad={sk.ikon} boyut={masa ? DOGE.ikBoy[yog] : 25} renk={renk} dolu={aktif} ic={R.yukselt} cay={cayRengi(R.gece)} />
        {!!sayi && sayi > 0 && (
          <View style={[s.rSayi, { backgroundColor: R.vurgu, borderColor: masa ? R.panel : R.yukselt }]}>
            <Text style={s.rSayiYazi}>{sayi > 9 ? '9+' : sayi}</Text>
          </View>
        )}
        {yeni && !aktif && <View style={[s.rYeni, { backgroundColor: R.vurgu, borderColor: masa ? R.panel : R.yukselt }]} />}
      </View>
    </View>
  );
  if (masa)
    return (
      <Bas onPress={onPress} etiket={sk.ad + (sayi ? `, ${sayi} yeni` : '')} rol="link" style={[s.dOge, { height: DOGE.h[yog] }]} hoverRenk={R.ince}>
        {ikon}
        <Text style={[s.dOgeYazi, { color: R.murekkep, fontSize: DOGE.yazi[yog] }, aktif && { fontFamily: yazi.kalin }]}>{sk.ad}</Text>
      </Bas>
    );
  return (
    <Pressable onPress={onPress} accessibilityRole="tab" accessibilityState={{ selected: aktif }} accessibilityLabel={sk.ad + (sayi ? `, ${sayi} yeni` : '')} style={({ pressed }) => [s.rOge, pressed && { opacity: 0.7 }]}>
      {ikon}
      <Text style={[s.rAd, { color: renk }, aktif && { fontFamily: yazi.kalin }]}>{sk.ad}</Text>
    </Pressable>
  );
}

// 08.10 (Onur: telefonda yorum yazma alanının alt kenarı rıhtımın altında kalıyor): ortadaki Yaz düğmesi (halkası ve parıltısıyla)
// rıhtım alanının üst kenarından ~20 px yukarı taşar. Rıhtımın hemen üstünde duran yazma çubukları (gönderi detayı, sohbet) bu payı
// altlarında bırakır; klavye açıkken rıhtım gizlendiği için pay 0 (alan klavyenin hemen üstünde), bilgisayarda rıhtım yok.
export const RIHTIM_TASMA = 18;
export function useYazmaAltPayi(klavye: boolean) {
  const genis = useGenis();
  const guvenli = useSafeAreaInsets();
  if (klavye) return 0;
  return genis ? guvenli.bottom : RIHTIM_TASMA;
}

export function RihtimMenu({ aktif, sayilar, canliYeni, sec, yaz, giris }: { aktif: RihtimSekme | null; sayilar: { sohbet: number; yanki: number }; canliYeni?: boolean; sec: (s: RihtimSekme) => void; yaz: () => void; giris?: ((mod: 'giris' | 'uye') => void) | null }) {
  const R = useRenk();
  const alt = useSafeAreaInsets();
  const dugme = useRef<YazDugmesiTutamak>(null);
  const bosluk = Math.max(alt.bottom, 10);
  const oge = (i: number) => {
    const sk = SEKMELER[i];
    return <RihtimOge key={sk.id} s={sk} aktif={aktif === sk.id} sayi={sk.id === 'sohbet' ? sayilar.sohbet : sk.id === 'yanki' ? sayilar.yanki : 0} yeni={sk.id === 'canli' && canliYeni} onPress={() => sec(sk.id)} />;
  };
  return (
    <View style={[s.rYer, { height: 68 + bosluk + 14 + (giris ? GIRIS_SERIT : 0), backgroundColor: R.panel }]}>
      {/* 19.11 (Onur): girişsiz ziyaretçiye alt menünün hemen üstünde ince şerit: solda "Giriş yap" (dolu), sağda "Üye ol" (çerçeveli). Ortadaki yükseltilmiş "Yaz" düğmesine yer bırakılır. */}
      {!!giris && (
        <View style={s.girisSerit} nativeID="giris-serit">
          <Dugme yazi="Giriş yap" tur="acik" kucuk onPress={() => giris('giris')} style={s.girisSeritDugme} />
          <View style={{ width: 92 }} pointerEvents="none" />
          <Dugme yazi="Üye ol" tur="cizgi" kucuk onPress={() => giris('uye')} style={s.girisSeritDugme} />
        </View>
      )}
      <View style={[s.rihtim, { bottom: bosluk, backgroundColor: R.gece ? 'rgba(30,24,50,0.86)' : 'rgba(255,255,255,0.9)', borderColor: R.cizgi }, Platform.OS === 'web' ? ({ backdropFilter: 'blur(18px) saturate(1.4)', boxShadow: R.gece ? '0 14px 34px -10px rgba(0,0,0,0.55)' : '0 14px 34px -12px rgba(29,24,48,0.3)' } as any) : { elevation: 10, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } }]}>
        {oge(0)}
        {oge(1)}
        <Pressable onPress={() => dugme.current?.bas()} accessible={false} style={s.rOrta}>
          <View style={s.rYaz}>
            <YazDugmesi ref={dugme} boyut={64} halka={R.gece ? '#1E1832' : '#FFFFFF'} ac={yaz} />
          </View>
          <Text style={[s.rAd, { color: R.vurgu, fontFamily: yazi.kalin }]}>Yaz</Text>
        </Pressable>
        {oge(2)}
        {oge(3)}
      </View>
    </View>
  );
}

// Canlı içinde: sağlayıcıdaki ekranla eşleşir.
export function AltSekmeler({ akisaDon }: { akisaDon: () => void }) {
  const c = useCanli();
  const e = c.ekran;
  const ben = c.uye && !c.uye.yeni ? c.uye : null;
  const aktif: RihtimSekme | null = e.tur === 'akis' || e.tur === 'gonderi' ? 'canli' : e.tur === 'mesajlar' || e.tur === 'sohbet' ? 'sohbet' : e.tur === 'zil' ? 'yanki' : (e.tur === 'profil' && e.ad === ben?.ad) || e.tur === 'ayarlar' ? 'ben' : null;
  const sec = (k: RihtimSekme) => {
    if (k === 'canli') return akisaDon();
    if (k === 'sohbet') return c.git({ tur: 'mesajlar' });
    if (k === 'yanki') return c.git({ tur: 'zil' });
    if (ben) c.git({ tur: 'profil', ad: ben.ad });
    else c.girisIste('Balonunu görmek için giriş yap', () => {});
  };
  return <RihtimMenu aktif={aktif} sayilar={{ sohbet: c.mesajSayi, yanki: c.zilSayi }} canliYeni={c.akisYeni > 0 && aktif !== 'canli'} sec={sec} yaz={c.yaziciAc} giris={Platform.OS === 'web' && !ben ? c.girisAc : null} />;
}

// Eski adreslerde açılan "Bu bölüm yenileniyor" sayfasında (telefon): aynı rıhtım; dokununca Canlı'nın ilgili ekranı açılır.
export function BagimsizAltMenu() {
  const git = (yol: string) => {
    if (Platform.OS === 'web') window.location.href = yol;
    else router.replace(yol as never);
  };
  const sec = (k: RihtimSekme) => {
    if (k === 'canli') return git('/canli');
    if (k === 'sohbet') return git('/canli?mesajlar=1');
    if (k === 'yanki') return git('/canli?zil=1');
    const u = kayitliUye();
    git(u && !u.yeni ? `/canli?profil=${encodeURIComponent(u.ad)}` : '/canli?ben=1');
  };
  return <RihtimMenu aktif={null} sayilar={{ sohbet: 0, yanki: 0 }} sec={sec} yaz={() => git('/canli?yaz=1')} />;
}

// ---------- Bilgisayar: sol rıhtım ----------
// Pencere yüksekliğine sabit kutu: ÜSTTE logo + Yaz (sabit), ORTADA sekmeler + "Yazsam mı?’da" (kendi içinde kayar, ince çubuk),
// ALTTA profil satırı (sabit, her zaman görünür). Pencere kısaldıkça aralıklar ve boyutlar sıkılaşır (Yog 0/1/2).
const SOL = {
  kenar: [18, 14, 10], ustBosluk: [20, 16, 12], altBosluk: [14, 12, 10], aralik: [14, 10, 8], orta: [6, 4, 2],
  yazMin: [68, 58, 50], yazDugme: [48, 42, 38], yazIk: [52, 46, 42],
  bolumH: [38, 33, 29], bolumYuz: [28, 25, 22], bolumIkon: [18, 16, 15], bolumYazi: [14, 13.5, 13],
  benPad: [8, 7, 6], benAv: [38, 34, 32], marka: [22, 21, 19],
} as const;
export const SOL_KENAR = SOL.kenar;

export function SolMenu({ akisaDon }: { akisaDon: () => void }) {
  const R = useRenk();
  const c = useCanli();
  const e = c.ekran;
  const ben = c.uye && !c.uye.yeni ? c.uye : null;
  const { width } = useWindowDimensions();
  const yog = useYog();
  const dugme = useRef<YazDugmesiTutamak>(null);
  const tribun = tribunOzet(useTribunDurum());
  // Ortadaki kayan bölümün üstünde/altında içerik kaldıysa ince çizgi (kaydırılabildiğini gösterir).
  const olc = useRef({ ch: 0, sh: 0, y: 0 });
  const [kay, kayAyarla] = useState({ ust: false, alt: false });
  const kayGuncelle = () => {
    const { ch, sh, y } = olc.current;
    const u = y > 2, a = sh - ch - y > 2;
    kayAyarla((p) => (p.ust === u && p.alt === a ? p : { ust: u, alt: a }));
  };
  const aktif: RihtimSekme | null = e.tur === 'akis' || e.tur === 'gonderi' ? 'canli' : e.tur === 'mesajlar' || e.tur === 'sohbet' ? 'sohbet' : e.tur === 'zil' ? 'yanki' : (e.tur === 'profil' && e.ad === ben?.ad) || e.tur === 'ayarlar' ? 'ben' : null;
  const sec = (k: RihtimSekme) => {
    if (k === 'canli') return akisaDon();
    if (k === 'sohbet') return c.git({ tur: 'mesajlar' });
    if (k === 'yanki') return c.git({ tur: 'zil' });
    if (ben) c.git({ tur: 'profil', ad: ben.ad });
    else c.girisIste('Balonunu görmek için giriş yap', () => {});
  };
  const genislik = Math.max(232, Math.min(276, width * 0.155));
  const yanPay = 14;
  const kaydirma = Platform.OS === 'web' ? ({ scrollbarWidth: 'thin', scrollbarColor: `${R.cizgi} transparent`, overscrollBehavior: 'contain' } as any) : null;
  return (
    <View testID="sol-dok" style={[s.dok, { width: genislik, backgroundColor: R.panel, borderColor: R.ince, marginTop: SOL.kenar[yog], marginBottom: SOL.kenar[yog] }, Platform.OS === 'web' && ({ boxShadow: `0 20px 50px -30px ${R.golge}` } as any)]}>
      {/* üst: logo + Yaz (sabit) */}
      <View style={{ paddingHorizontal: yanPay, paddingTop: SOL.ustBosluk[yog], paddingBottom: SOL.aralik[yog], gap: SOL.aralik[yog] }}>
        <Pressable onPress={akisaDon} accessibilityRole="link" accessibilityLabel="Yazsam mı? Canlı" style={[s.dMarka, yog === 2 && { flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
          <MarkaYazisi boyut={SOL.marka[yog]} />
          <CanliEtiketi />
        </Pressable>
        <Pressable onPress={() => dugme.current?.bas()} accessibilityRole="button" accessibilityLabel="Yaz: yeni paylaşım" style={({ hovered }: { hovered?: boolean; pressed: boolean }) => [s.dYaz, { minHeight: SOL.yazMin[yog], backgroundColor: R.vurguYumusak, borderColor: R.vurgu + '42' }, hovered && Platform.OS === 'web' && ({ transform: [{ translateY: -1 }], boxShadow: `0 10px 24px -12px ${R.vurgu}99` } as any)]}>
          <View style={{ width: SOL.yazIk[yog], height: SOL.yazIk[yog], alignItems: 'center', justifyContent: 'center' }}>
            <YazDugmesi ref={dugme} boyut={SOL.yazDugme[yog]} halka={R.panel} ac={c.yaziciAc} basilabilir={false} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            {yog < 2 && <Text style={[s.dYazUst, { color: R.soluk }]}>Yaz</Text>}
            <Text style={[s.dYazAd, { color: R.murekkep }]}>Yazsam mı? Yaz!</Text>
          </View>
        </Pressable>
      </View>
      {/* orta: kayar bölüm */}
      <View style={{ flex: 1, minHeight: 0, borderTopWidth: 1, borderBottomWidth: 1, borderTopColor: kay.ust ? R.ince : 'transparent', borderBottomColor: kay.alt ? R.ince : 'transparent' }}>
        <ScrollView
          testID="sol-kaydir"
          style={[{ flex: 1, minHeight: 0 }, kaydirma]}
          contentContainerStyle={{ paddingHorizontal: yanPay - 2, paddingVertical: 4, gap: SOL.aralik[yog] }}
          showsVerticalScrollIndicator
          scrollEventThrottle={16}
          onLayout={(ev) => { olc.current.ch = ev.nativeEvent.layout.height; kayGuncelle(); }}
          onContentSizeChange={(_w, h) => { olc.current.sh = h; kayGuncelle(); }}
          onScroll={(ev) => { olc.current.y = ev.nativeEvent.contentOffset.y; kayGuncelle(); }}
        >
          <View style={{ gap: 2, marginTop: SOL.orta[yog] }}>
            {SEKMELER.map((sk) => (
              <RihtimOge key={sk.id} s={sk} aktif={aktif === sk.id} masa yog={yog} sayi={sk.id === 'sohbet' ? c.mesajSayi : sk.id === 'yanki' ? c.zilSayi : 0} yeni={sk.id === 'canli' && c.akisYeni > 0} onPress={() => sec(sk.id)} />
            ))}
          </View>
          <View style={[s.dAyrac, { backgroundColor: R.ince }]} />
          <Text style={[s.dAltBaslik, { color: R.soluk }]}>Yazsam mı?’da</Text>
          <View style={{ marginTop: -6 }}>
            {TRIBUN_ACIK && <Bas onPress={() => c.git({ tur: 'tribun' })} rol="link" etiket={tribun.canli ? 'Tribün, maç canlı' : 'Tribün'} style={[s.dBolum, { height: SOL.bolumH[yog] }, (e.tur === 'tribun' || e.tur === 'tribunMac' || e.tur === 'tribunDetay') && { backgroundColor: R.vurguYumusak }]} hoverRenk={R.ince}>
              <View style={[s.dBolumYuz, { width: SOL.bolumYuz[yog], height: SOL.bolumYuz[yog], backgroundColor: R.vurguYumusak }]}>
                <BolumIkon ad="tribun" boyut={SOL.bolumIkon[yog]} renk={R.vurgu} />
              </View>
              <Text style={[s.dBolumYazi, { color: R.murekkep, fontFamily: yazi.kalin, flex: 1, fontSize: SOL.bolumYazi[yog] }]}>Tribün</Text>
              {!!tribun.canli && (
                <View style={[s.dCanli, { backgroundColor: R.vurguYumusak }]}>
                  <CanliNokta renk={R.vurgu} boyut={5} />
                  <Text style={[s.dCanliYazi, { color: R.vurgu }]}>CANLI</Text>
                </View>
              )}
            </Bas>}
            <Bas onPress={() => oyunAc()} rol="link" etiket="Oyun" style={[s.dBolum, { height: SOL.bolumH[yog] }]} hoverRenk={R.ince}>
              <View style={[s.dBolumYuz, { width: SOL.bolumYuz[yog], height: SOL.bolumYuz[yog], backgroundColor: R.vurguYumusak }]}>
                <BolumIkon ad="oyna" boyut={SOL.bolumIkon[yog]} renk={R.vurgu} />
              </View>
              <Text style={[s.dBolumYazi, { color: R.murekkep, fontFamily: yazi.kalin, flex: 1, fontSize: SOL.bolumYazi[yog] }]}>Oyun</Text>
            </Bas>
            <Bas onPress={() => c.git({ tur: 'ekonomi' })} rol="link" etiket="Ekonomi" style={[s.dBolum, { height: SOL.bolumH[yog] }, e.tur === 'ekonomi' && { backgroundColor: R.vurguYumusak }]} hoverRenk={R.ince}>
              <View style={[s.dBolumYuz, { width: SOL.bolumYuz[yog], height: SOL.bolumYuz[yog], backgroundColor: R.vurguYumusak }]}>
                <BolumIkon ad="ekonomi" boyut={SOL.bolumIkon[yog]} renk={R.vurgu} />
              </View>
              <Text style={[s.dBolumYazi, { color: R.murekkep, fontFamily: yazi.kalin, flex: 1, fontSize: SOL.bolumYazi[yog] }]}>Ekonomi</Text>
            </Bas>
            <Bas onPress={() => c.git({ tur: 'astroloji' })} rol="link" etiket="Astroloji" style={[s.dBolum, { height: SOL.bolumH[yog] }, e.tur === 'astroloji' && { backgroundColor: R.vurguYumusak }]} hoverRenk={R.ince}>
              <View style={[s.dBolumYuz, { width: SOL.bolumYuz[yog], height: SOL.bolumYuz[yog], backgroundColor: R.vurguYumusak }]}>
                <BolumIkon ad="astroloji" boyut={SOL.bolumIkon[yog]} renk={R.vurgu} />
              </View>
              <Text style={[s.dBolumYazi, { color: R.murekkep, fontFamily: yazi.kalin, flex: 1, fontSize: SOL.bolumYazi[yog] }]}>Astroloji</Text>
            </Bas>
            {KAHIN_ACIK && (
              <Bas onPress={() => c.git({ tur: 'kahin' })} rol="link" etiket="Tarot Kart Analizi" style={[s.dBolum, { height: SOL.bolumH[yog] }, e.tur === 'kahin' && { backgroundColor: R.vurguYumusak }]} hoverRenk={R.ince}>
                <View style={[s.dBolumYuz, { width: SOL.bolumYuz[yog], height: SOL.bolumYuz[yog], backgroundColor: R.vurguYumusak }]}>
                  <BolumIkon ad="tarot" boyut={SOL.bolumIkon[yog]} renk={R.vurgu} />
                </View>
                <Text style={[s.dBolumYazi, { color: R.murekkep, fontFamily: yazi.kalin, flex: 1, fontSize: SOL.bolumYazi[yog] }]} numberOfLines={1}>Tarot Kart Analizi</Text>
              </Bas>
            )}
            {YAKINDA.map((b) => (
              <View key={b.ad} accessible accessibilityLabel={`${b.baslik}, yakında`} style={[s.dBolum, { height: SOL.bolumH[yog] }]}>
                <View style={[s.dBolumYuz, { width: SOL.bolumYuz[yog], height: SOL.bolumYuz[yog], backgroundColor: R.ince }]}>
                  <BolumIkon ad={b.ad} boyut={SOL.bolumIkon[yog]} renk={R.soluk} />
                </View>
                <Text style={[s.dBolumYazi, { color: R.soluk, flex: 1, fontSize: SOL.bolumYazi[yog] }]}>{b.baslik}</Text>
                <YakindaHap kucuk />
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
      {/* alt: profil satırı (sabit) */}
      <View style={{ paddingHorizontal: yanPay, paddingTop: SOL.aralik[yog], paddingBottom: SOL.altBosluk[yog] }}>
        {indirGoster() && <View style={{ marginBottom: 8 }}><UygulamaIndir /></View>}
        <View style={[s.dBen, { backgroundColor: R.ust, padding: SOL.benPad[yog] }]}>
          <Bas onPress={() => sec('ben')} etiket={ben ? 'Ben: profilim' : 'Giriş yap'} style={s.dBenSol}>
            {ben ? <Avatar yazar={{ uid: ben.uid, ad: ben.ad, marka: false, yuz: ben.yuz, kurucu: ben.kurucu, balon: ben.balon }} boyut={SOL.benAv[yog]} /> : <View style={[s.bosAvatar, { width: SOL.benAv[yog], height: SOL.benAv[yog], borderRadius: SOL.benAv[yog] / 2, backgroundColor: R.panel }]}><MenuIkon ad="ben" boyut={20} renk={R.soluk} ic={R.panel} cay="" /></View>}
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={[s.dBenAd, { color: R.murekkep }]}>{ben ? ben.ad : 'Giriş yap'}</Text>
              <Text numberOfLines={1} style={[s.dBenAlt, { color: R.soluk }]}>{ben ? 'Ben' : 'Beğen, yaz, takip et'}</Text>
            </View>
          </Bas>
          <TemaIkonu boyut={SOL.benAv[yog]} />
        </View>
        {Platform.OS === 'web' && (
          <Text accessibilityRole="link" {...({ href: APPSTORE, hrefAttrs: { target: '_blank', rel: 'noopener' } } as any)} style={[s.altBagYazi, { color: R.soluk, textAlign: 'center', marginTop: 8 }]}>App Store'dan indir</Text>
        )}
      </View>
    </View>
  );
}

// ---------- Bilgisayar: sağdaki canlı panel ----------
// 22.10 taslak (Onur: anket ve kısa yollar kalkar): üstte FİGÜR KÖŞESİ (sabit; "şu an X kişi burada" onun başlığında),
// altında kayan: GÜNÜN GÖREVİ · YAKINDA · Tribün (tek satır, kısa ekranda yok) · alt bağlantılar. Parçalar: ./SagKose.tsx
function TribunKutusu() {
  const R = useRenk();
  const c = useCanli();
  const d = useTribunDurum();
  if (!d) return null;
  const o = tribunOzet(d);
  const m = o.canli ?? o.yaklasan;
  return (
    <Bas onPress={() => (m ? c.git({ tur: 'tribunMac', id: m.id }) : c.git({ tur: 'tribun' }))} rol="link" etiket="Tribün" style={[s.kutu, s.tribunKucuk, { backgroundColor: R.panel, borderColor: R.ince }]} hoverRenk={R.hover}>
      <View style={[s.tribunIk, { backgroundColor: R.ust }]}>
        <BolumIkon ad="tribun" boyut={20} renk={R.murekkep} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[s.kutuBaslik, { color: R.soluk }]}>TRİBÜN</Text>
        {m ? (
          <View style={s.tribunMac}>
            <TakimRozeti t={m.ev} boyut={18} />
            <Text style={[s.tribunSkor, { color: R.murekkep }]}>{o.canli ? `${m.skor.ev}–${m.skor.dep}` : saatYaz(m.baslangic)}</Text>
            <TakimRozeti t={m.dep} boyut={18} />
            <Text style={[s.tribunAlt, { color: R.soluk }]} numberOfLines={1}>{o.canli ? (m.durum === 'devre' ? 'Devre arası' : `${m.dk}’`) : gunBasligi(m.baslangic, d.simdi).split(' · ')[0]}</Text>
          </View>
        ) : (
          <Text style={[s.tribunAlt, { color: R.soluk }]}>Maç odaları ve takvim</Text>
        )}
      </View>
      {o.canli ? (
        <View style={[s.suAn, { backgroundColor: R.vurguYumusak }]}>
          <CanliNokta renk={R.vurgu} boyut={5} />
          <Text style={[s.suAnYazi, { color: R.vurgu }]}>CANLI</Text>
        </View>
      ) : (
        <Ikon ad="ok" boyut={16} renk={R.soluk} kalinlik={2.2} />
      )}
    </Bas>
  );
}

export function SagSutun({ kisa, genislik = 338, akisaDon }: { anket?: Gonderi | null; kisa: boolean; genislik?: number; akisaDon: () => void }) {
  const R = useRenk();
  const yog = useYog();
  const kenar = SOL_KENAR[yog];
  const gorev = useGunlukGorev(akisaDon);
  return (
    <View style={[s.sagSutun, { width: genislik, paddingTop: kenar, paddingBottom: 0 }, (kisa || yog > 0) && { gap: 10 }]}>
      <FigurKosesi gorev={gorev} />
      <ScrollView testID="sag-kaydir" style={[{ flex: 1, minHeight: 0 }, Platform.OS === 'web' && ({ scrollbarWidth: 'none', overscrollBehavior: 'contain' } as any)]} contentContainerStyle={[{ gap: kisa || yog > 0 ? 10 : 12, paddingBottom: kenar }]} showsVerticalScrollIndicator={false}>
        <GununGorevi gorev={gorev} sik={kisa} />
        <Yakinda sik={kisa} />
        {!kisa && TRIBUN_ACIK && <TribunKutusu />}
        <View style={s.altBag}>
          {(
            [
              ['Gizlilik', '/gizlilik/'],
              ['Şartlar', '/sartlar/'],
              ['Instagram', INSTAGRAM],
            ] as const
          ).map(([ad, yol]) => (
            <Text key={ad} accessibilityRole="link" onPress={() => (Platform.OS === 'web' && yol.startsWith('/') ? (window.location.href = yol) : Linking.openURL(yol))} style={[s.altBagYazi, { color: R.soluk }]}>{ad}</Text>
          ))}
          <Text style={[s.altBagYazi, { color: R.soluk }]}>© 2026</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  canli: { flexDirection: 'row', alignItems: 'center', gap: 2, borderRadius: 999, paddingLeft: 3, paddingRight: 8, paddingVertical: 1 },
  canliYazi: { fontFamily: yazi.kalin, fontSize: 10.5, letterSpacing: 0.8 },
  ustBaslik: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, height: 54, borderBottomWidth: 1 },
  geri: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  ustBaslikYazi: { fontFamily: yazi.kalin, fontSize: 18, marginLeft: 4 },
  sekmeler: { flexDirection: 'row', borderBottomWidth: 1 },
  sekme: { flex: 1, alignItems: 'center', justifyContent: 'center', height: 48 },
  sekmeYazi: { fontFamily: yazi.orta, fontSize: 15 },
  sekmeCizgi: { position: 'absolute', bottom: -1, height: 3, width: 52, borderRadius: 2 },
  hap: { flexDirection: 'row', borderWidth: 1, borderRadius: 16, padding: 4, alignSelf: 'flex-start' },
  hapOge: { height: 36, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  hapYazi: { fontFamily: yazi.kalin, fontSize: 14.5 },
  ikDug: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  telUst: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 8 },
  telSag: { flexDirection: 'row', alignItems: 'center' },
  // telefon üst çubuğu: simge üstte, altında etiket (simge 22 px, etiket 10 px; toplam 44 px içinde)
  telOge: { alignItems: 'center', justifyContent: 'flex-start', paddingTop: 6, paddingHorizontal: 2, gap: 2, borderRadius: 14 },
  telYazi: { fontFamily: yazi.orta, lineHeight: 12 },
  telNokta: { position: 'absolute', top: 2, right: 6, width: 8, height: 8, borderRadius: 4, borderWidth: 1.5 },
  yukariIkon: { justifyContent: 'flex-start', paddingTop: 6 },
  // rıhtım (taslak menu_a.css .mA)
  rYer: { position: 'relative', zIndex: 6 },
  girisSerit: { position: 'absolute', top: 4, left: 12, right: 12, height: GIRIS_SERIT - 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  girisSeritDugme: { flex: 1, paddingVertical: 6, paddingHorizontal: 8 },
  rihtim: { position: 'absolute', left: 12, right: 12, height: 68, borderRadius: 26, borderWidth: 1, flexDirection: 'row', alignItems: 'stretch', paddingHorizontal: 4 },
  rOge: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, minWidth: 0 },
  rIk: { width: 54, height: 34, alignItems: 'center', justifyContent: 'center' },
  rVurgu: { position: 'absolute', left: -2, top: -3 },
  rAd: { fontFamily: yazi.orta, fontSize: 11, letterSpacing: 0.1 },
  rSayi: { position: 'absolute', top: -5, right: -10, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  rSayiYazi: { color: '#fff', fontFamily: yazi.kalin, fontSize: 10.5 },
  rYeni: { position: 'absolute', top: -2, right: -4, width: 10, height: 10, borderRadius: 5, borderWidth: 2 },
  rOrta: { flex: 1.12, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 7 },
  rYaz: { position: 'absolute', top: -27, alignSelf: 'center' },
  // bilgisayar sol rıhtım (taslak .dokA)
  dok: { marginLeft: 18, borderRadius: 30, borderWidth: 1 },
  dMarka: { alignItems: 'flex-start', gap: 9, paddingHorizontal: 8 },
  dYaz: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 68, paddingVertical: 8, paddingLeft: 8, paddingRight: 12, borderRadius: 24, borderWidth: 1 },
  dYazUst: { fontFamily: yazi.orta, fontSize: 11.5, marginBottom: 1 },
  dYazAd: { fontFamily: yazi.kalin, fontSize: 14, letterSpacing: -0.4, lineHeight: 18 },
  dOge: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 50, paddingHorizontal: 6, borderRadius: 18 },
  dOgeYazi: { fontFamily: yazi.orta, fontSize: 16.5 },
  dAyrac: { height: 1, marginHorizontal: 6, marginVertical: 2 },
  dAltBaslik: { fontFamily: yazi.kalin, fontSize: 11.5, letterSpacing: 1.1, textTransform: 'uppercase', paddingHorizontal: 10 },
  dBolum: { flexDirection: 'row', alignItems: 'center', gap: 11, height: 38, paddingHorizontal: 8, borderRadius: 12 },
  dBolumYuz: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  dBolumYazi: { fontFamily: yazi.orta, fontSize: 14 },
  dBen: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8, borderRadius: 20 },
  dBenSol: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 0 },
  dBenAd: { fontFamily: yazi.kalin, fontSize: 14.5 },
  dBenAlt: { fontFamily: yazi.normal, fontSize: 12 },
  bosAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  // sağ panel
  sagSutun: { width: 338, paddingTop: 18, paddingBottom: 18, paddingRight: 18, gap: 14 },
  kutu: { borderRadius: 24, borderWidth: 1, padding: 18, gap: 12 },
  kutuUst: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kutuBaslik: { fontFamily: yazi.kalin, fontSize: 11.5, letterSpacing: 1.1 },
  suAn: { flexDirection: 'row', alignItems: 'center', gap: 2, borderRadius: 999, paddingLeft: 3, paddingRight: 8, paddingVertical: 1 },
  suAnYazi: { fontFamily: yazi.kalin, fontSize: 10.5, letterSpacing: 0.8 },
  burada: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: -4 },
  buradaSayi: { fontFamily: yazi.marka, fontSize: 30, letterSpacing: -1 },
  buradaYazi: { fontFamily: yazi.orta, fontSize: 15 },
  sagMetin: { fontFamily: yazi.normal, fontSize: 14 },
  kisayollar: { flexDirection: 'row', gap: 2, marginHorizontal: -6 },
  kisayol: { flex: 1, minWidth: 0, alignItems: 'center', gap: 7, paddingVertical: 6, borderRadius: 14 },
  kisayolIk: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  kisayolNokta: { position: 'absolute', top: -2, right: -2, width: 11, height: 11, borderRadius: 6, borderWidth: 2 },
  kisayolYazi: { fontFamily: yazi.kalin, fontSize: 11.5, textAlign: 'center' },
  tribunMac: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  tribunSkor: { fontFamily: yazi.marka, fontSize: 14, letterSpacing: -0.4, fontVariant: ['tabular-nums'] },
  tribunAlt: { fontFamily: yazi.orta, fontSize: 12.5, marginLeft: 2, flexShrink: 1 },
  tribunGit: { fontFamily: yazi.kalin, fontSize: 13.5 },
  tribunKucuk: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14 },
  tribunIk: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  dCanli: { flexDirection: 'row', alignItems: 'center', gap: 2, borderRadius: 999, paddingLeft: 3, paddingRight: 7, height: 18 },
  dCanliYazi: { fontFamily: yazi.kalin, fontSize: 10, letterSpacing: 0.7 },
  altBag: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 4 },
  altBagYazi: { fontFamily: yazi.normal, fontSize: 12.5 },
  bolumBag: { flexDirection: 'row', gap: 16, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 10 },
});
