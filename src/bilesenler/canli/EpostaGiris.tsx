// E-posta ile giriş (08.11, Onur 07.11 kararı): giriş penceresinde Google/Apple düğmelerinin altındaki "E-postayla gir" yolu + "E-postana bak" bekleme ekranı.
// Akış: adres yazılır → C.epostaIste (gizli bekleme anahtarıyla) → adrese bağlantı gider; bağlantı site/giris/ sayfasını açar ve orada onaylanır
// → bu cihaz 3 sn'de bir C.epostaBekle ile sorar, oturum gelince girilmiş olur (bağlantı başka tarayıcıda/cihazda açılsa bile).
// Mantığın web karşılığı: site/uyelik/uyelik.js (adimEposta / adimBekle).
import { useEffect, useRef, useState } from 'react';
import { Animated, AppState, Easing, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { yazi } from '@/tema/tema';
import * as C from '@/canli';
import type { Uye } from '@/canli';
import { BEKLEME_OMRU, beklemeSil, beklemeYaz } from '@/uyelik';
import { Bas, Dugme, useRenk, YEREL_SURUCU } from './ortak';
import { YuzBalon } from './balon';

const EPOSTA_KALIP = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SORU_ARALIGI = 3000;
const YENIDEN_BEKLEME = 60; // sn

// Zarf: hafif eğik, mühürlü. Renkler temadan.
const zarfSvg = (cizgi: string, zemin: string, muhur: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 86 70"><rect x="5" y="18" width="76" height="48" rx="10" fill="${zemin}" stroke="${cizgi}" stroke-width="3"/><path d="M10 25 L43 49 L76 25" fill="none" stroke="${cizgi}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="68" cy="13" r="8" fill="${muhur}"/></svg>`;

/** Giriş penceresinde Google/Apple'ın altında: önce küçük bir "E-postayla gir" düğmesi, dokununca adres alanı. */
export function EpostaYolu({ varsayilan = '', gonderildi, acikBasla = false }: { varsayilan?: string; gonderildi: (e: string, sk: string, kod: string) => void; acikBasla?: boolean }) {
  const R = useRenk();
  const [acik, acikAyarla] = useState(acikBasla || !!varsayilan);
  const [e, eAyarla] = useState(varsayilan);
  const [hata, hataAyarla] = useState('');
  const [gidiyor, gidiyorAyarla] = useState(false);
  const kilit = useRef(false);
  const adresTamam = EPOSTA_KALIP.test(e.trim());
  const yolla = async () => {
    if (kilit.current) return;
    const adres = e.trim();
    if (!EPOSTA_KALIP.test(adres)) return hataAyarla(C.hataYazisi('eposta_gecersiz'));
    kilit.current = true;
    gidiyorAyarla(true);
    hataAyarla('');
    const sk = C.beklemeAnahtari();
    const r = await C.epostaIste(adres, sk);
    kilit.current = false;
    gidiyorAyarla(false);
    if (!r.ok) return hataAyarla(C.hataYazisi(r.hata, r.durum));
    if (r.veri?.yogun) return hataAyarla(C.YOGUN_YAZI); // günlük gönderim tavanı doldu: bağlantı gitmedi, bekleme ekranına geçme
    const kod = r.veri?.eslesme ?? '';
    beklemeYaz(sk, adres, kod);
    gonderildi(adres, sk, kod);
  };
  if (!acik)
    return (
      <Bas onPress={() => acikAyarla(true)} etiket="E-postayla gir" style={[s.yolDugme, { borderColor: R.cizgi }]} hoverRenk={R.hover}>
        <SvgXml xml={zarfSvg(R.murekkep, 'none', R.vurgu)} width={22} height={18} />
        <Text style={[s.yolYazi, { color: R.murekkep }]}>E-postayla gir</Text>
      </Bas>
    );
  return (
    <View style={s.form}>
      <TextInput
        value={e}
        onChangeText={(t) => {
          eAyarla(t.replace(/\s/g, '').slice(0, 254));
          if (hata) hataAyarla('');
        }}
        placeholder="ornek@eposta.com"
        placeholderTextColor={R.soluk}
        keyboardType="email-address"
        inputMode="email"
        autoComplete="email"
        textContentType="emailAddress"
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        autoFocus
        returnKeyType="send"
        onSubmitEditing={yolla}
        accessibilityLabel="E-posta adresin"
        style={[s.alan, { color: R.murekkep, borderColor: hata ? R.kalem : R.cizgi, backgroundColor: R.ust }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
      />
      {!!hata && <Text style={[s.hata, { color: R.kalem }]}>{hata}</Text>}
      <Dugme yazi={gidiyor ? 'Gönderiyorum…' : 'Bağlantıyı gönder'} tur="acik" devre={!adresTamam || gidiyor} onPress={yolla} />
      <Text style={[s.not, { color: R.soluk }]}>Şifre yok. Adresine bir giriş bağlantısı gönderiyoruz; adresin yalnız bunun için saklanır.</Text>
    </View>
  );
}

export function Nabiz() {
  const R = useRenk();
  const a = useRef([new Animated.Value(0.25), new Animated.Value(0.25), new Animated.Value(0.25)]).current;
  useEffect(() => {
    const d = Animated.loop(
      Animated.stagger(
        170,
        a.map((v) => Animated.sequence([Animated.timing(v, { toValue: 1, duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: YEREL_SURUCU }), Animated.timing(v, { toValue: 0.25, duration: 520, useNativeDriver: YEREL_SURUCU })])),
      ),
    );
    d.start();
    return () => d.stop();
  }, []);
  return (
    <View style={s.nabiz} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {a.map((v, i) => (
        <Animated.View key={i} style={[s.nabizNokta, { backgroundColor: R.vurgu, opacity: v, transform: [{ scale: v.interpolate({ inputRange: [0.25, 1], outputRange: [0.8, 1.15] }) }] }]} />
      ))}
    </View>
  );
}

/** "E-postana bak" ekranı: bağlantıya dokunulana kadar 3 sn'de bir sorar. */
export function EpostaBekle({ e, sk: ilkSk, t, kod: ilkKod = '', yeniGonderildi, bitti, degistir }: { e: string; sk: string; t: number; kod?: string; yeniGonderildi: boolean; bitti: (u: Uye) => void; degistir: () => void }) {
  const R = useRenk();
  const [sayac, sayacAyarla] = useState(yeniGonderildi ? YENIDEN_BEKLEME : 0);
  const [hata, hataAyarla] = useState('');
  const [bitisSuresi, bitisAyarla] = useState(false); // 15 dk doldu ya da sunucu isteği unuttu
  const [tekrarGidiyor, tekrarGidiyorAyarla] = useState(false);
  const [kod, kodAyarla] = useState(ilkKod);
  const sk = useRef(ilkSk);
  const baslangic = useRef(t);
  const soruyor = useRef(false);
  const canli = useRef(true);
  const bittiRef = useRef(bitti);
  bittiRef.current = bitti;

  const sor = async () => {
    if (!canli.current || soruyor.current || bitisSuresi) return;
    if (Date.now() - baslangic.current > BEKLEME_OMRU) return bitisAyarla(true);
    // Web: başka sekme ya da bağlantı sayfası girişi aynı depoya yazmış olabilir.
    if (Platform.OS === 'web') {
      const u = C.oturumTazele();
      if (u && u.ad) {
        beklemeSil();
        return bittiRef.current(u);
      }
    }
    soruyor.current = true;
    const r = await C.epostaBekle(sk.current);
    soruyor.current = false;
    if (!canli.current || !r.ok) return;
    if ('uye' in r.veri) {
      beklemeSil();
      bittiRef.current(r.veri.uye);
    } else if (!r.veri.bekliyor) bitisAyarla(true);
  };

  useEffect(() => {
    canli.current = true;
    sor();
    const aralik = setInterval(sor, SORU_ARALIGI);
    // Mail uygulamasından / tarayıcıdan dönünce hemen sor (arka planda sayaçlar durur).
    const durum = AppState.addEventListener('change', (d) => d === 'active' && sor());
    const odak = () => sor();
    const depoOlay = (o: StorageEvent) => (!o.key || o.key.startsWith('yazsammi.canli.')) && sor();
    if (Platform.OS === 'web') {
      window.addEventListener('focus', odak);
      window.addEventListener('storage', depoOlay);
    }
    return () => {
      canli.current = false;
      clearInterval(aralik);
      durum.remove();
      if (Platform.OS === 'web') {
        window.removeEventListener('focus', odak);
        window.removeEventListener('storage', depoOlay);
      }
    };
  }, [bitisSuresi]);

  useEffect(() => {
    if (sayac <= 0) return;
    const z = setTimeout(() => sayacAyarla((x) => x - 1), 1000);
    return () => clearTimeout(z);
  }, [sayac]);

  const tekrar = async () => {
    if (sayac > 0 || tekrarGidiyor) return;
    tekrarGidiyorAyarla(true);
    hataAyarla('');
    const yeni = C.beklemeAnahtari();
    const r = await C.epostaIste(e, yeni);
    tekrarGidiyorAyarla(false);
    if (!r.ok) return hataAyarla(C.hataYazisi(r.hata, r.durum));
    if (r.veri?.yogun) return hataAyarla(C.YOGUN_YAZI);
    sk.current = yeni;
    baslangic.current = Date.now();
    const yeniKod = r.veri?.eslesme ?? '';
    kodAyarla(yeniKod);
    beklemeYaz(yeni, e, yeniKod);
    bitisAyarla(false);
    sayacAyarla(YENIDEN_BEKLEME);
  };

  const sallan = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const d = Animated.loop(Animated.sequence([Animated.timing(sallan, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: YEREL_SURUCU }), Animated.timing(sallan, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: YEREL_SURUCU })]));
    d.start();
    return () => d.stop();
  }, []);

  return (
    <View style={s.bekle}>
      <View style={s.bekleFigur}>
        <YuzBalon ad="goz" boyut={64} />
        <Animated.View style={{ marginLeft: -6, marginBottom: 2, transform: [{ rotate: sallan.interpolate({ inputRange: [0, 1], outputRange: ['-7deg', '6deg'] }) }, { translateY: sallan.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) }] }}>
          <SvgXml xml={zarfSvg(R.murekkep, R.gece ? '#2A2342' : '#fff', R.vurgu)} width={62} height={51} />
        </Animated.View>
      </View>
      <Text style={[s.bekleBaslik, { color: R.murekkep }]}>{bitisSuresi ? 'Bağlantının süresi doldu.' : 'E-postana bak.'}</Text>
      <View style={[s.adres, { backgroundColor: R.ust, borderColor: R.ince }]}>
        <Text style={[s.adresYazi, { color: R.murekkep }]} numberOfLines={1}>{e}</Text>
      </View>
      <Text style={[s.bekleAlt, { color: R.soluk }]}>
        {bitisSuresi ? 'Yeni bir bağlantı iste, gelince dokun.' : 'Bir bağlantı gönderdik. Dokununca bu pencere kendiliğinden devam eder; bağlantıyı başka bir tarayıcıda açsan da olur.'}
      </Text>
      {!!kod && !bitisSuresi && (
        <View style={[s.kodKutu, { borderColor: R.vurgu, backgroundColor: R.vurguYumusak }]} accessibilityLabel={`Eşleştirme kodun ${kod.split('').join(' ')}`}>
          <Text style={[s.kodEtiket, { color: R.soluk }]}>Eşleştirme kodun</Text>
          <Text style={[s.kodSayi, { color: R.murekkep }]}>{kod}</Text>
          <Text style={[s.kodNot, { color: R.soluk }]}>Bağlantıyı başka bir telefonda ya da tarayıcıda açarsan sana bu kod sorulur.</Text>
        </View>
      )}
      {!bitisSuresi && <Nabiz />}
      {!!hata && <Text style={[s.hata, { color: R.kalem }]}>{hata}</Text>}
      <Dugme yazi={tekrarGidiyor ? 'Gönderiyorum…' : sayac > 0 ? `Yeniden gönder (${sayac})` : 'Yeniden gönder'} tur={bitisSuresi ? 'acik' : 'cizgi'} kucuk={!bitisSuresi} devre={sayac > 0 || tekrarGidiyor} onPress={tekrar} />
      {!bitisSuresi && <Text style={[s.not, { color: R.soluk }]}>Gelmediyse gereksiz (spam) klasörüne de bak.</Text>}
      <Bas onPress={degistir} etiket="E-postayı değiştir" style={s.degistir}>
        <Text style={[s.degistirYazi, { color: R.soluk }]}>E-postayı değiştir</Text>
      </Bas>
    </View>
  );
}

const s = StyleSheet.create({
  yolDugme: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, minWidth: 300, maxWidth: '100%', borderWidth: 1.5, borderRadius: 999, paddingVertical: 11, paddingHorizontal: 20 },
  yolYazi: { fontFamily: yazi.orta, fontSize: 15.5 },
  form: { alignSelf: 'stretch', gap: 10, paddingHorizontal: 6 },
  alan: { borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 12, fontFamily: yazi.orta, fontSize: 16.5 },
  hata: { fontFamily: yazi.orta, fontSize: 14, textAlign: 'center' },
  not: { fontFamily: yazi.normal, fontSize: 12.5, lineHeight: 18, textAlign: 'center' },
  bekle: { alignSelf: 'stretch', alignItems: 'center', gap: 10, paddingTop: 4 },
  bekleFigur: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 2 },
  bekleBaslik: { fontFamily: yazi.kalin, fontSize: 23, letterSpacing: -0.5, textAlign: 'center' },
  adres: { maxWidth: '100%', borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 6 },
  adresYazi: { fontFamily: yazi.orta, fontSize: 15 },
  bekleAlt: { fontFamily: yazi.normal, fontSize: 14.5, lineHeight: 21, textAlign: 'center', paddingHorizontal: 6 },
  kodKutu: { alignSelf: 'stretch', alignItems: 'center', borderWidth: 1.5, borderRadius: 20, paddingVertical: 10, paddingHorizontal: 14, gap: 2, marginTop: 2 },
  kodEtiket: { fontFamily: yazi.orta, fontSize: 12.5, letterSpacing: 0.8, textTransform: 'uppercase' },
  kodSayi: { fontFamily: yazi.kalin, fontSize: 44, letterSpacing: 10, lineHeight: 52, paddingLeft: 10 },
  kodNot: { fontFamily: yazi.normal, fontSize: 12.5, lineHeight: 18, textAlign: 'center' },
  silKutu: { marginHorizontal: 16, marginTop: 6, borderWidth: 1.5, borderRadius: 16, padding: 14, gap: 8 },
  silBaslik: { fontFamily: yazi.orta, fontSize: 15.5 },
  silAlt: { fontFamily: yazi.normal, fontSize: 13.5, lineHeight: 19 },
  nabiz: { flexDirection: 'row', gap: 7, height: 18, alignItems: 'center', marginVertical: 2 },
  nabizNokta: { width: 9, height: 9, borderRadius: 5 },
  degistir: { paddingVertical: 8, paddingHorizontal: 14 },
  degistirYazi: { fontFamily: yazi.orta, fontSize: 14.5, textDecorationLine: 'underline' },
});

/** Hesap silmeden önce yeniden doğrulama (e-posta üyesi): hesabın kendi adresine bağlantı gider; bağlantıya dokunulunca (son 10 dk) `bitti` çağrılır. */
export function SilDogrulama({ bitti, vazgec }: { bitti: () => void; vazgec: () => void }) {
  const R = useRenk();
  const [hata, hataAyarla] = useState('');
  const [sayac, sayacAyarla] = useState(YENIDEN_BEKLEME);
  const [gidiyor, gidiyorAyarla] = useState(true);
  const [bitisSuresi, bitisAyarla] = useState(false);
  const canli = useRef(true);
  const soruyor = useRef(false);
  const baslangic = useRef(Date.now());
  const bittiRef = useRef(bitti);
  bittiRef.current = bitti;

  const yolla = async () => {
    gidiyorAyarla(true);
    hataAyarla('');
    const r = await C.epostaSilDogrulamaIste();
    if (!canli.current) return;
    gidiyorAyarla(false);
    if (!r.ok) return hataAyarla(C.hataYazisi(r.hata, r.durum));
    if (r.veri?.yogun) return hataAyarla(C.YOGUN_YAZI);
    baslangic.current = Date.now();
    bitisAyarla(false);
    sayacAyarla(YENIDEN_BEKLEME);
  };
  const sor = async () => {
    if (!canli.current || soruyor.current || bitisSuresi) return;
    if (Date.now() - baslangic.current > 10 * 60000) return bitisAyarla(true);
    soruyor.current = true;
    const r = await C.hesapDogrulama();
    soruyor.current = false;
    if (canli.current && r.ok && r.veri.tamam) bittiRef.current();
  };
  useEffect(() => {
    canli.current = true;
    yolla();
    return () => {
      canli.current = false;
    };
  }, []);
  useEffect(() => {
    const aralik = setInterval(sor, SORU_ARALIGI);
    const durum = AppState.addEventListener('change', (d) => d === 'active' && sor());
    const odak = () => sor();
    if (Platform.OS === 'web') window.addEventListener('focus', odak);
    return () => {
      clearInterval(aralik);
      durum.remove();
      if (Platform.OS === 'web') window.removeEventListener('focus', odak);
    };
  }, [bitisSuresi]);
  useEffect(() => {
    if (sayac <= 0) return;
    const z = setTimeout(() => sayacAyarla((x) => x - 1), 1000);
    return () => clearTimeout(z);
  }, [sayac]);
  return (
    <View style={[s.silKutu, { borderColor: R.kalem }]}>
      <Text style={[s.silBaslik, { color: R.murekkep }]}>{bitisSuresi ? 'Doğrulama süresi doldu.' : 'Önce e-postanı doğrula.'}</Text>
      <Text style={[s.silAlt, { color: R.soluk }]}>
        {bitisSuresi ? 'Yeni bir bağlantı iste, gelince dokun.' : 'E-postana doğrulama bağlantısı gönderdik; bağlantıya dokun, sonra buraya dön. Hesabı sen sildiğinden emin olmak için soruyoruz.'}
      </Text>
      {!bitisSuresi && !hata && <Nabiz />}
      {!!hata && <Text style={[s.silAlt, { color: R.kalem }]}>{hata}</Text>}
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
        <Dugme yazi={gidiyor ? 'Gönderiyorum…' : sayac > 0 && !hata ? `Yeniden gönder (${sayac})` : 'Yeniden gönder'} kucuk tur={bitisSuresi || !!hata ? 'acik' : 'cizgi'} devre={gidiyor || (sayac > 0 && !hata)} onPress={yolla} />
        <Dugme yazi="Vazgeç" kucuk tur="cizgi" onPress={vazgec} />
      </View>
    </View>
  );
}
