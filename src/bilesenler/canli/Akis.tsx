// Akış listesi: sonsuz kaydırma, 15 sn'de bir /c/yeni yoklaması ve "↑ N yeni" hapı, aşağı çekip yenileme.
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, startTransition } from 'react';
import { ActivityIndicator, Animated, Easing, FlatList, Platform, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { yazi } from '@/tema/tema';
import * as C from '@/canli';
import { Bas, Dugme, Ikon, YEREL_SURUCU, useRenk } from './ortak';
import { useCanli } from './baglam';
import { Iskelet, Kart } from './Kart';
import { AkisSekmeleri } from './Duzen';
import { YuzBalon } from './balon';
import { acikYoklamaKur } from './yoklama';

export type AkisTutamak = { basaDon: () => void };
const YOKLAMA = 15000;
const ON = '__on'; // FlatList verisinin ilk öğesi: kartlardan önceki parça (çekme göstergesi, kapı şeridi, iskelet / hata / boş durum)
const anahtarCikar = (x: string) => x;

// sutun > 1 (bilgisayar, 08.10): akış ekrana yayılır; kartlar ayrı kutular hâlinde en kısa sütuna yerleşir (okuma sırası korunur).
export const Akis = forwardRef<AkisTutamak, { ust?: React.ReactNode; once?: React.ReactNode; anketBul?: (g: C.Gonderi | null) => void; sutun?: number }>(function Akis({ ust, once, anketBul, sutun = 1 }, ref) {
  const R = useRenk();
  const c = useCanli();
  const [tur, turAyarla] = useState<'hepsi' | 'takip'>('hepsi');
  const [idler, idlerAyarla] = useState<string[]>([]);
  const [imlec, imlecAyarla] = useState<string | null>(null);
  const [durum, durumAyarla] = useState<'yukleniyor' | 'hazir' | 'hata'>('yukleniyor');
  const [dahaYukleniyor, dahaAyarla] = useState(false);
  const [yenileniyor, yenileniyorAyarla] = useState(false);
  const [yeniSayi, yeniSayiAyarla] = useState(0);
  const [yeniIdler, yeniIdlerAyarla] = useState<Set<string>>(new Set());
  const liste = useRef<any>(null); // tek sütun: FlatList, kolonlu: ScrollView
  const basaKaydir = () => (liste.current?.scrollToOffset ? liste.current.scrollToOffset({ offset: 0, animated: true }) : liste.current?.scrollTo({ y: 0, animated: true }));
  const enYeni = useRef(0);
  const kaydirma = useRef(0);
  const dahaKilit = useRef(false);

  const yukle = useCallback(
    async (t: 'hepsi' | 'takip', yenile = false) => {
      const r = await C.akisGetir(t);
      if (!r.ok) {
        if (!yenile) durumAyarla('hata');
        else c.tost(C.hataYazisi(r.hata, r.durum));
        return;
      }
      c.koy(r.veri.gonderiler);
      const yeniListe = [...new Set(r.veri.gonderiler.map((g) => g.id))]; // kimliğe göre tekil
      idlerAyarla((eski) => {
        if (yenile && eski.length) {
          const eskiSet = new Set(eski);
          yeniIdlerAyarla(new Set(yeniListe.filter((x) => !eskiSet.has(x))));
        }
        return yeniListe;
      });
      imlecAyarla(r.veri.imlec);
      enYeni.current = Math.max(0, ...r.veri.gonderiler.filter((g) => !g.inceleniyor).map((g) => g.zaman));
      yeniSayiAyarla(0);
      c.akisYeniAyarla(0);
      durumAyarla('hazir');
      if (t === 'hepsi') anketBul?.(r.veri.gonderiler.find((g) => g.tur === 'anket' && g.yazar.marka && !!g.dizi) ?? r.veri.gonderiler.find((g) => g.tur === 'anket' && g.yazar.marka) ?? null);
    },
    [c.koy],
  );

  useEffect(() => {
    durumAyarla('yukleniyor');
    yukle(tur);
  }, [tur]);

  // Yeni gönderi yoklaması.
  useEffect(() => {
    const yokla = async () => {
      if (Platform.OS === 'web' && typeof document !== 'undefined' && document.hidden) return;
      if (!enYeni.current) return;
      const r = await C.yeniSay(enYeni.current);
      if (!r) return;
      yeniSayiAyarla(r.sayi);
      c.akisYeniAyarla(r.sayi);
      c.buradaAyarla(r.burada);
      if (r.zil != null) c.zilSayiAyarla(r.zil);
      if (r.mesaj != null) c.mesajSayiAyarla(r.mesaj);
      if (r.rozet != null && r.rozet > 0) c.rozetYeniAyarla(r.rozet);
    };
    const durdur = acikYoklamaKur(yokla, YOKLAMA); // arka planda / gizli sekmede durur, öne gelince hemen yoklar
    const ilk = setTimeout(yokla, 1500);
    return () => {
      durdur();
      clearTimeout(ilk);
    };
  }, []);

  // Kullanıcının kendi yeni gönderisi en üste.
  useEffect(() => {
    const g = c.yeniGonderi;
    if (!g) return;
    c.koy([g]);
    idlerAyarla((l) => [g.id, ...l.filter((x) => x !== g.id)]);
    yeniIdlerAyarla(new Set([g.id]));
    enYeni.current = Math.max(enYeni.current, Date.now());
    yeniSayiAyarla(0);
    basaKaydir();
    c.yeniGonderiAyarla(null);
  }, [c.yeniGonderi]);

  const yenile = async () => {
    yenileniyorAyarla(true);
    await yukle(tur, true);
    yenileniyorAyarla(false);
  };
  const basaDon = () => {
    basaKaydir();
    if (yeniSayi > 0 || kaydirma.current < 40) yenile();
  };
  useImperativeHandle(ref, () => ({ basaDon }));

  const daha = async () => {
    if (!imlec || dahaKilit.current || durum !== 'hazir') return;
    dahaKilit.current = true;
    dahaAyarla(true);
    const r = await C.akisGetir(tur, imlec);
    dahaKilit.current = false;
    dahaAyarla(false);
    if (!r.ok) return;
    c.koy(r.veri.gonderiler);
    // Sonraki sayfa: zaten listede olanlar (araya giren "öne çıkan"lar dahil) bir daha eklenmez; kimliğe göre tekil.
    idlerAyarla((l) => {
      const var_ = new Set(l);
      const ek = r.veri.gonderiler.map((g) => g.id).filter((x) => !var_.has(x) && (var_.add(x), true));
      return ek.length ? [...l, ...ek] : l;
    });
    imlecAyarla(r.veri.imlec);
  };

  const turSec = (t: 'hepsi' | 'takip') => {
    if (t === 'takip' && !c.girisIste('Takip ettiklerin için giriş yap', () => turAyarla('takip'))) return;
    if (t === tur) basaDon();
    else turAyarla(t);
  };

  const tumGorunen = [...new Set(idler)].filter((x) => c.harita[x] && !c.gizli.has(x)); // aynı gönderi iki kez görünmesin
  // 06.11 hız işi (web): gelen TÜM gönderiler ilk çizimde basılıyordu (yüzlerce düğüm + SVG yüz; yavaş telefonda ~1 sn donma). İlk çizimde yalnız ekranı dolduracak kadarı,
  // geri kalanı hemen ardından (0,6 sn) bölünebilir bir geçişle eklenir. Uygulamada (Android/iOS) sınır yok.
  const [sinir, sinirAyarla] = useState(Platform.OS === 'web' ? 4 * Math.max(1, sutun) : Infinity);
  useEffect(() => {
    if (sinir >= tumGorunen.length) return;
    const z = setTimeout(() => startTransition(() => sinirAyarla(Infinity)), 600);
    return () => clearTimeout(z);
  }, [sinir, tumGorunen.length]);
  const gorunen = sinir >= tumGorunen.length ? tumGorunen : tumGorunen.slice(0, sinir);
  const cekme = useCekmeYenile(yenile, () => kaydirma.current);
  const masa = sutun > 1;
  // Çok sütun: ölçülen kart yükseklikleri (ölçülmeyen ~260) ile her kart sırayla en kısa sütuna.
  const boylar = useRef<Record<string, number>>({});
  const [, olcumTur] = useState(0);
  const bekleyenOlcum = useRef(false);
  const olc = (id: string, h: number) => {
    if (Math.abs((boylar.current[id] ?? 0) - h) < 2) return;
    boylar.current[id] = h;
    if (bekleyenOlcum.current) return;
    bekleyenOlcum.current = true;
    requestAnimationFrame(() => {
      bekleyenOlcum.current = false;
      olcumTur((n) => n + 1);
    });
  };
  const kolonlar = (() => {
    if (!masa) return [];
    const k: string[][] = Array.from({ length: sutun }, () => []);
    const h = Array(sutun).fill(0);
    for (const x of gorunen) {
      let i = 0;
      for (let j = 1; j < sutun; j++) if (h[j] < h[i] - 1) i = j;
      k[i].push(x);
      h[i] += (boylar.current[x] ?? 260) + 16;
    }
    return k;
  })();

  const ustKutu = (
    <View style={[{ backgroundColor: R.panel, zIndex: 5 }, masa && { backgroundColor: R.sis, paddingTop: 18, paddingBottom: 14 }]}>
      {ust}
      {masa ? (
        <View style={s.masaBas}>
          <AkisSekmeleri tur={tur} sec={turSec} hap />
          {yeniSayi > 0 && (
            <Bas onPress={basaDon} style={[s.masaYeni, { backgroundColor: R.vurgu }]} etiket={`${yeniSayi} yeni balon`}>
              <Ikon ad="yukari" boyut={15} renk="#fff" kalinlik={2.6} />
              <Text style={s.masaYeniYazi}>{yeniSayi > 9 ? '9+' : yeniSayi} yeni balon</Text>
            </Bas>
          )}
        </View>
      ) : (
        <AkisSekmeleri tur={tur} sec={turSec} />
      )}
    </View>
  );
  const kartlarVar = durum === 'hazir' && gorunen.length > 0;
  const veri = useMemo(() => (kartlarVar ? [ON, ...gorunen] : [ON]), [kartlarVar, gorunen]);
  // Kartlardan önceki parça: aşağı çekme göstergesi, yenileniyor, kapı şeridi, iskelet / hata / boş durum.
  const onGovde = (
    <>
      <Animated.View style={{ height: cekme.yukseklik, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <Animated.View style={{ transform: [{ rotate: cekme.donus }] }}>
          <YuzBalon ad="kikir" boyut={28} />
        </Animated.View>
      </Animated.View>
      {yenileniyor && Platform.OS === 'web' && <ActivityIndicator style={{ paddingVertical: 12 }} color={R.vurgu} />}
      {tur === 'hepsi' && once /* kartlardan önce, yapışkan değil (uygulamada kapı şeridi) */}
      {durum === 'yukleniyor' ? (
        <Iskelet />
      ) : durum === 'hata' ? (
        <BosDurum yuz="uzgun" baslik="Akış şu an açılmadı." alt="Bağlantını kontrol et." dugme="Tekrar dene" onPress={() => { durumAyarla('yukleniyor'); yukle(tur); }} />
      ) : gorunen.length === 0 ? (
        tur === 'takip' ? (
          <BosDurum yuz="utangac" baslik="Burası henüz sessiz." alt="Birini takip et, gönderileri burada." dugme="Herkese dön" onPress={() => turAyarla('hepsi')} />
        ) : (
          <BosDurum yuz="kikir" baslik="Henüz kimse yazmadı." alt="İlk sen yaz." dugme="Paylaş" onPress={c.yaziciAc} />
        )
      ) : null}
    </>
  );
  const altBilgi = imlec ? (
    <ActivityIndicator style={{ paddingVertical: 28 }} color={R.vurgu} />
  ) : (
    <View style={s.son}>
      <YuzBalon ad="emin" boyut={36} />
      <Text style={[s.sonYazi, { color: R.soluk }]}>Hepsi bu kadar. Biraz sonra yine gel.</Text>
    </View>
  );
  const kaydirOlayi = (e: any) => {
    const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
    kaydirma.current = contentOffset.y;
    if (contentOffset.y + layoutMeasurement.height > contentSize.height - 900) daha();
  };
  const yenileKontrolu = Platform.OS !== 'web' ? <RefreshControl refreshing={yenileniyor} onRefresh={yenile} tintColor={R.vurgu} /> : undefined;

  return (
    <View style={{ flex: 1 }} {...cekme.olaylar}>
      {masa ? (
        <ScrollView
          ref={liste}
          onScroll={kaydirOlayi}
          scrollEventThrottle={48}
          stickyHeaderIndices={[0]}
          refreshControl={yenileKontrolu}
          contentContainerStyle={[{ paddingBottom: 30 }, { paddingHorizontal: 22, paddingBottom: 40 }]}
          showsVerticalScrollIndicator={Platform.OS === 'web'}
        >
          {ustKutu}
          <View>
            {onGovde}
            {kartlarVar && (
              <>
                <View style={s.kolonlar}>
                  {kolonlar.map((k, i) => (
                    <View key={i} style={s.kolon}>
                      {k.map((x) => (
                        <View key={x} onLayout={(e) => olc(x, e.nativeEvent.layout.height)}>
                          <Kart g={c.harita[x]} yeni={yeniIdler.has(x)} kutu />
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
                {altBilgi}
              </>
            )}
          </View>
        </ScrollView>
      ) : (
        // KASMA (18.11): tek sütunlu akış (telefon) sanallaştırılmış: yalnız ekrana yakın kartlar çizilir; uzaklaşanlar bellekten atılır.
        // Veri: [ON(kartlardan önceki parça), ...kart kimlikleri]; yapışkan üst bölüm ListHeaderComponent (indeks 0).
        <FlatList
          ref={liste}
          data={veri}
          keyExtractor={anahtarCikar}
          renderItem={({ item }) => (item === ON ? onGovde : c.harita[item] ? <Kart g={c.harita[item]} yeni={yeniIdler.has(item)} /> : null)}
          ListHeaderComponent={ustKutu}
          ListFooterComponent={kartlarVar ? altBilgi : null}
          stickyHeaderIndices={[0]}
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          updateCellsBatchingPeriod={40}
          windowSize={7}
          removeClippedSubviews={false}
          onScroll={kaydirOlayi}
          scrollEventThrottle={48}
          refreshControl={yenileKontrolu}
          contentContainerStyle={{ paddingBottom: 30 }}
          showsVerticalScrollIndicator={Platform.OS === 'web'}
        />
      )}
      {!masa && <YeniHap sayi={yeniSayi} onPress={basaDon} ustBosluk={ust ? 112 : 58} />}
    </View>
  );
});

function YeniHap({ sayi, onPress, ustBosluk }: { sayi: number; onPress: () => void; ustBosluk: number }) {
  const R = useRenk();
  const a = useRef(new Animated.Value(0)).current;
  const [gorunur, gorunurAyarla] = useState(false);
  useEffect(() => {
    if (sayi > 0) gorunurAyarla(true);
    Animated.timing(a, { toValue: sayi > 0 ? 1 : 0, duration: 320, easing: Easing.out(Easing.back(1.3)), useNativeDriver: YEREL_SURUCU }).start(() => sayi === 0 && gorunurAyarla(false));
  }, [sayi > 0]);
  if (!gorunur) return null;
  return (
    <Animated.View style={[s.hapKap, { top: ustBosluk, opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) }] }]}>
      <Bas onPress={onPress} style={[s.hap, { backgroundColor: R.vurgu }, Platform.OS === 'web' && ({ boxShadow: '0 8px 24px rgba(91,46,255,0.35)' } as any)]} etiket={`${sayi} yeni gönderi`}>
        <Ikon ad="yukari" boyut={15} renk="#fff" kalinlik={2.8} />
        <View style={s.hapYuzler}>
          {['kikir', 'goz', 'emin'].slice(0, Math.min(3, sayi)).map((y, i) => (
            <View key={y} style={[s.hapYuz, { marginLeft: i ? -9 : 0 }]}>
              <YuzBalon ad={y} boyut={24} />
            </View>
          ))}
        </View>
        <Text style={s.hapYazi}>{sayi > 9 ? '9+' : sayi} yeni</Text>
      </Bas>
    </Animated.View>
  );
}

function BosDurum({ yuz, baslik, alt, dugme, onPress }: { yuz: string; baslik: string; alt: string; dugme: string; onPress: () => void }) {
  const R = useRenk();
  return (
    <View style={s.bos}>
      <YuzBalon ad={yuz} boyut={72} />
      <Text style={[s.bosBaslik, { color: R.murekkep }]}>{baslik}</Text>
      <Text style={[s.bosAlt, { color: R.soluk }]}>{alt}</Text>
      <Dugme yazi={dugme} onPress={onPress} kucuk style={{ marginTop: 6 }} />
    </View>
  );
}

// Web'de telefonla aşağı çekip yenileme (RefreshControl web'de yok).
function useCekmeYenile(yenile: () => void, ofset: () => number) {
  const y = useRef(new Animated.Value(0)).current;
  const bas = useRef<number | null>(null);
  const mesafe = useRef(0);
  const ESIK = 70;
  if (Platform.OS !== 'web') return { olaylar: {}, yukseklik: 0 as any, donus: '0deg' as any };
  const olaylar = {
    onTouchStart: (e: any) => {
      bas.current = ofset() <= 0 ? e.nativeEvent.touches?.[0]?.pageY ?? null : null;
      mesafe.current = 0;
    },
    onTouchMove: (e: any) => {
      if (bas.current == null) return;
      const d = (e.nativeEvent.touches?.[0]?.pageY ?? 0) - bas.current;
      if (d <= 0 || ofset() > 0) return;
      mesafe.current = Math.min(110, d * 0.5);
      y.setValue(mesafe.current);
    },
    onTouchEnd: () => {
      if (bas.current == null) return;
      bas.current = null;
      if (mesafe.current >= ESIK * 0.8) yenile();
      Animated.timing(y, { toValue: 0, duration: 260, useNativeDriver: false }).start();
      mesafe.current = 0;
    },
  };
  return { olaylar, yukseklik: y, donus: y.interpolate({ inputRange: [0, 110], outputRange: ['0deg', '320deg'] }) };
}

const s = StyleSheet.create({
  masaBas: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  masaYeni: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 34, paddingHorizontal: 14, borderRadius: 999 },
  masaYeniYazi: { color: '#fff', fontFamily: yazi.kalin, fontSize: 13.5 },
  kolonlar: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  kolon: { flex: 1, minWidth: 0, gap: 16 },
  hapKap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 20 },
  hap: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 999, paddingVertical: 7, paddingLeft: 12, paddingRight: 15 },
  hapYuzler: { flexDirection: 'row' },
  hapYuz: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  hapYazi: { color: '#fff', fontFamily: yazi.kalin, fontSize: 14.5 },
  son: { alignItems: 'center', gap: 8, paddingVertical: 34 },
  sonYazi: { fontFamily: yazi.orta, fontSize: 14 },
  bos: { alignItems: 'center', gap: 6, paddingVertical: 56, paddingHorizontal: 30 },
  bosBaslik: { fontFamily: yazi.kalin, fontSize: 20, marginTop: 8, textAlign: 'center' },
  bosAlt: { fontFamily: yazi.normal, fontSize: 15, textAlign: 'center' },
});
