// KULLANILMIYOR (04.11.2026): eski KAHİN astroloji/tarot ekranı. Astroloji ve Tarot Kart Analizi artık sitenin /astroloji/ ve /tarot/ sayfaları,
// uygulamada WebView ile (bilesenler/canli/SiteBolumu.native.tsx); hiçbir ekran bu dosyayı içe aktarmıyor. Kod başvuru için duruyor, silinmedi.
// KAHİN — ücretli tarot ekranı (29.10; sunucu: kahin.mjs). Uygulama içinde (Android/iOS) çalışır, aynı kod web'i de üretir.
// Akış: bekleme klibi (döngü) → açılım seç → soru yaz → "kartları aç" (sunucu çeker, yorumlar, seslendirir) → kartlar masaya iner, sırayla açılır,
// Kore sesi çalar (expo-audio), yazı altta, KAHİN klibi (sıcak/soğuk/şaşırma) köşede → bitiş. İlk okuma ücretsiz; sonra hak (Google Play, yalnız uygulamada).
// Dudak eşleme YOK (karar 28.10): okuma sırasında kamera kartlarda, KAHİN sesi dış ses; köşe klibi yalnız tepki.
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as C from '@/canli';
import { yazi } from '@/tema/tema';
import { useCanli } from '@/bilesenler/canli/baglam';
import { MagazaYonlendir } from '@/bilesenler/canli/UygulamaIndir';
import { KART_YUZU } from './kartYuzleri';
import { duyguKlip, type KlipAd } from './klipler';
import { KART_OFSET, KUS_GETIRME_MS, KUS_INIS, KuzgunMasa, KuzgunTunekte } from './Kuzgun';
import { YERLESIM } from './yerlesim';
import { ALTIN, YAZI, SOLUK, ZEMIN, bekle, Klip, Dugme } from './ortak';
import { Masa, type AcilimId, type MasaTutamak } from './Masa';
import { MAGAZA_VAR } from '@/magaza/iap';
import { ODEME_VAR, bekleyenleriGetir, odemeHazirla, satinAl, satinDinle, urunleriGetir, type SatinSonuc, type UrunBilgi } from './odeme';
import { YASAL_IBARE } from '@/kahin/yasal';

type OkumaTamam = Extract<C.KahinOkuma, { parcalar: C.KahinParca[] }>;
type Asama = 'giris' | 'soru' | 'hazirlik' | 'okuma' | 'bitti';
const SITE = 'https://yazsammi.com';
const kartBaslik = (k: C.KahinKart) => `${k.pozisyon} · ${k.ad}${k.ters ? ' (ters)' : ''}`;

export function Tarot({ geri, onSoru = '', astroProfil = false }: { geri: () => void; onSoru?: string; astroProfil?: boolean }) {
  const c = useCanli();
  const { width, height } = useWindowDimensions();
  const ek = useSafeAreaInsets();
  const girisli = !!c.uye && !c.uye.yeni && !c.uye.sozGerekli; // 1.7.1 (S-3 E1)
  const [asama, asamaAyarla] = useState<Asama>('giris');
  const [durum, durumAyarla] = useState<C.KahinDurum | null>(null);
  const [yuk, yukAyarla] = useState<'yok' | 'okuma' | 'satin'>('yok');
  const [secim, secimAyarla] = useState<AcilimId>('uc');
  const [soru, soruAyarla] = useState(onSoru);
  const [astroKat, astroKatAyarla] = useState(astroProfil);
  const [hata, hataAyarla] = useState('');
  const [okuma, okumaAyarla] = useState<OkumaTamam | null>(null);
  const [kriz, krizAyarla] = useState('');
  const [acilan, acilanAyarla] = useState<number[]>([]);
  const [aktifKart, aktifKartAyarla] = useState<number | null>(null);
  const [parcaNo, parcaNoAyarla] = useState(-1);
  const [duraklat, duraklatAyarla] = useState(false);
  const [buyuk, buyukAyarla] = useState<number | null>(null);
  const [panelAcik, panelAcikAyarla] = useState(false);
  const [gagaSay, gagaSayAyarla] = useState(0);
  useEffect(() => { if (aktifKart != null) gagaSayAyarla((n) => n + 1); }, [aktifKart]);
  const [urunler, urunlerAyarla] = useState<UrunBilgi[]>([]);
  const [odemeNeden, odemeNedenAyarla] = useState('');
  const [sesVar, sesVarAyarla] = useState(false);
  const masa = useRef<MasaTutamak>(null);
  const oturumNo = useRef(0);
  const bayrak = useRef({ duraklat: false, atla: false, canli: true });
  const oynatici = useRef<AudioPlayer | null>(null);
  const yaziKap = useRef<ScrollView>(null);
  const yaziBoy = useRef({ icerik: 0, gorunen: 0 });
  const [ilerleme, ilerlemeAyarla] = useState(0);
  bayrak.current.duraklat = duraklat;

  useEffect(() => { bayrak.current.canli = true; return () => { bayrak.current.canli = false; oturumNo.current++; try { oynatici.current?.remove(); } catch {} }; }, []);
  useEffect(() => { setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'duckOthers', shouldPlayInBackground: false }).catch(() => {}); }, []);

  const durumYukle = useCallback(async () => {
    const r = await C.kahinDurum();
    if (r.ok) durumAyarla(r.veri);
    return r.ok ? r.veri : null;
  }, []);
  useEffect(() => { durumYukle(); }, [durumYukle, girisli]);

  // ---- satın alma (yalnız uygulama) ----
  const satinIsle = useCallback(async (s: SatinSonuc) => {
    const r = await C.kahinSatinDogrula(s.urun, s.token);
    if (r.ok) {
      await s.bitir().catch(() => {});
      durumAyarla((d) => (d ? { ...d, hak: r.veri.hak, ucretsiz_var: r.veri.ucretsiz_var } : d));
      c.tost('Okuma hakkın eklendi');
    } else if (r.durum !== 402) {
      hataAyarla('Satın alma şu an doğrulanamadı; ödemen güvende, birazdan yeniden denenecek.');
    } else hataAyarla('Satın alma doğrulanamadı.');
    yukAyarla('yok');
  }, [c]);
  useEffect(() => {
    if (!ODEME_VAR || !girisli || (Platform.OS === 'android' && MAGAZA_VAR)) return; // Android bayrak açıkken satın alma src/magaza/'dan
    let son = () => {};
    let iptal = false;
    (async () => {
      const h = await odemeHazirla();
      if (iptal) return;
      if (!h.ok) { odemeNedenAyarla(h.neden || 'play_yok'); return; }
      odemeNedenAyarla('');
      urunlerAyarla(await urunleriGetir(['kahin_okuma_1']));
      son = satinDinle((s) => { satinIsle(s); }, (kod) => { yukAyarla('yok'); if (kod !== 'user-cancelled') hataAyarla('Satın alma tamamlanamadı.'); });
      for (const b of await bekleyenleriGetir()) await satinIsle(b);
    })();
    return () => { iptal = true; son(); };
  }, [girisli, satinIsle]);
  const satinAlTikla = async (id: string) => {
    hataAyarla('');
    yukAyarla('satin');
    const r = await satinAl(id);
    if (!r.ok) { yukAyarla('yok'); if (r.neden !== 'user-cancelled') hataAyarla('Satın alma başlatılamadı.'); }
  };

  // ---- okuma ----
  const hakTamam = !durum || durum.ucretsiz_var !== false || (durum.hak ?? 0) > 0;
  async function okumaBaslat() {
    if (!girisli) { c.girisIste('KAHİN ile okuma için giriş yap', () => {}); return; }
    hataAyarla(''); krizAyarla('');
    yukAyarla('okuma'); asamaAyarla('hazirlik');
    const r = await C.kahinOkuma(secim, soru.trim(), astroProfil && astroKat);
    yukAyarla('yok');
    if (!bayrak.current.canli) return;
    if (!r.ok) {
      asamaAyarla('soru');
      if (r.durum === 402) { durumAyarla((d) => (d ? { ...d, hak: 0, ucretsiz_var: false } : d)); hataAyarla('Okuma hakkın bitti.'); }
      else if (r.durum === 422) hataAyarla('Bu soruyu kartlara soramam; başka türlü yazar mısın?');
      else if (r.durum === 429) hataAyarla('Bugünlük okuma sınırına geldin; yarın yine bekliyorum.');
      else if (r.durum === 503) hataAyarla('KAHİN şu an çok yoğun, hakkın korundu. Birazdan tekrar dene.');
      else if (r.durum === 401) c.girisIste('KAHİN ile okuma için giriş yap', () => {});
      else hataAyarla('Kartlar şu an açılamadı. Bağlantını kontrol edip tekrar dene.');
      return;
    }
    if ('kriz' in r.veri && r.veri.kriz) { krizAyarla(r.veri.metin); asamaAyarla('soru'); return; }
    const o = r.veri as OkumaTamam;
    durumAyarla((d) => (d ? { ...d, hak: o.hak, ucretsiz_var: o.ucretsiz_var } : d));
    okumaAyarla(o); acilanAyarla([]); aktifKartAyarla(null); parcaNoAyarla(-1); buyukAyarla(null); panelAcikAyarla(false);
    asamaAyarla('okuma');
  }

  // Parçayı oynat: ses çalar, süre bitince/atlanınca döner. Duraklat/atla bayrakları denetlenir.
  const parcaOynat = useCallback(async (p: C.KahinParca, no: number, sonraki?: C.KahinParca) => {
    let bitti = false;
    let oyn: AudioPlayer | null = null;
    const tahmin = Math.max(4000, (p.sure ?? p.metin.length / 15) * 1000 + 1500);
    if (p.ses) {
      try {
        oyn = createAudioPlayer({ uri: C.kahinSesAdres(p.ses) });
        oynatici.current = oyn;
        (oyn as any).addListener('playbackStatusUpdate', (s: any) => { if (s.didJustFinish) bitti = true; });
        oyn.play();
        sesVarAyarla(true);
      } catch { oyn = null; }
    } else sesVarAyarla(false);
    let gecen = 0, pause = false, sonYaz = 0;
    ilerlemeAyarla(0);
    while (!bitti && !bayrak.current.atla && bayrak.current.canli && no === oturumNo.current) {
      await bekle(120);
      if (bayrak.current.duraklat !== pause) { pause = bayrak.current.duraklat; try { pause ? oyn?.pause() : oyn?.play(); } catch {} }
      if (!pause) gecen += 120;
      if (gecen - sonYaz >= 600) { sonYaz = gecen; ilerlemeAyarla(Math.min(1, gecen / Math.max(1000, (p.sure ?? tahmin / 1000) * 1000))); }
      if (gecen > tahmin + 25000 || (!oyn && gecen >= tahmin)) break;
    }
    bayrak.current.atla = false;
    try { oyn?.pause(); oyn?.remove(); } catch {}
    if (oynatici.current === oyn) oynatici.current = null;
    if (sonraki?.ses) { try { await fetch(C.kahinSesAdres(sonraki.ses), { method: 'GET' }).then((r) => r.arrayBuffer()).catch(() => {}); } catch {} } // sıradaki parçayı önden indir (önbelleğe)
  }, []);

  useEffect(() => {
    if (asama !== 'okuma' || !okuma) return;
    const no = ++oturumNo.current;
    const aktif = () => bayrak.current.canli && no === oturumNo.current;
    (async () => {
      const n = okuma.kartlar.length;
      // ilk kartı KUZGUN getirir: konduğu anda kartı masaya bırakır; kalan kartlar KAHİN'in destesinden sırayla iner
      const dagit = (async () => { await bekle(KUS_GETIRME_MS - 120); for (let i = 0; i < n && aktif(); i++) { masa.current?.dagit(i); await bekle(n > 5 ? 220 : 320); } })();
      const ps = okuma.parcalar;
      parcaNoAyarla(0);
      await Promise.all([dagit, parcaOynat(ps[0], no, ps[1])]);
      for (let k = 1; k < ps.length && aktif(); k++) {
        const p = ps[k];
        parcaNoAyarla(k);
        if (p.tur === 'kart' && p.kart != null) {
          aktifKartAyarla(p.kart);
          const idx = p.kart;
          const acilis = masa.current ? masa.current.ac(idx) : Promise.resolve();
          setTimeout(() => acilanAyarla((l) => (l.includes(idx) ? l : [...l, idx])), 520); // yüz, dönüşün ortasında görünür olur; dokunma yalnız o zaman açılır
          await Promise.all([acilis, parcaOynat(p, no, ps[k + 1])]);
        } else {
          aktifKartAyarla(null);
          await parcaOynat(p, no, ps[k + 1]);
        }
      }
      if (aktif()) { aktifKartAyarla(null); asamaAyarla('bitti'); }
    })();
  }, [asama, okuma, parcaOynat]);

  useEffect(() => {
    const { icerik, gorunen } = yaziBoy.current;
    if (asama === 'okuma' && icerik > gorunen) yaziKap.current?.scrollTo({ y: Math.max(0, (ilerleme - 0.15) * 1.15 * (icerik - gorunen)), animated: true });
  }, [ilerleme, asama]);
  useEffect(() => { yaziKap.current?.scrollTo({ y: 0, animated: false }); }, [parcaNo]);

  function yeniOkuma() {
    oturumNo.current++;
    try { oynatici.current?.remove(); } catch {}
    okumaAyarla(null); acilanAyarla([]); aktifKartAyarla(null); parcaNoAyarla(-1); buyukAyarla(null); duraklatAyarla(false); bayrak.current.duraklat = false;
    soruAyarla(''); hataAyarla(''); asamaAyarla('giris'); durumYukle();
  }
  function cik() { oturumNo.current++; try { oynatici.current?.remove(); } catch {} geri(); }

  const parca = okuma && parcaNo >= 0 ? okuma.parcalar[parcaNo] : null;
  // duygu → klip; kart açılışı (dönerken) → büyü klibi; ses yoksa bekleme
  const [kartAciliyor, kartAciliyorAyarla] = useState(false);
  useEffect(() => { if (aktifKart == null) return; kartAciliyorAyarla(true); const z = setTimeout(() => kartAciliyorAyarla(false), 2300); return () => clearTimeout(z); }, [aktifKart]);
  const klipAd: KlipAd = asama === 'okuma' && parca && sesVar ? (kartAciliyor ? 'buyu' : duyguKlip(parca.duygu)) : 'bekleme';
  const ust = Math.max(ek.top, Platform.OS === 'android' ? 24 : 12);
  const alt = Math.max(ek.bottom, 10);
  const kelt = okuma?.acilim === 'kelt';

  // ---------- görünümler ----------
  if (asama === 'okuma' || asama === 'bitti') {
    const o = okuma!;
    const kucukH = Math.max(168, Math.round(height * 0.27 - ust - 2));
    const panelH = asama === 'bitti' ? (panelAcik ? kucukH : Math.round(height * 0.62)) : panelAcik ? Math.round(height * 0.62) : kucukH;
    const yaziParca = asama === 'bitti' ? null : parca;
    const kartAd = yaziParca?.tur === 'kart' && yaziParca.kart != null ? o.kartlar[yaziParca.kart] : null;
    const buyukKart = buyuk != null ? o.kartlar[buyuk] : null;
    const kL = YERLESIM.acilimlar[o.acilim as AcilimId], kF = Math.min(width / YERLESIM.vw, height / YERLESIM.vh) * kL.c;
    const kartBoy = { w: YERLESIM.cw * YERLESIM.plaka.A * kF * 0.5, h: YERLESIM.ch * YERLESIM.plaka.B * kF * 0.5 };
    const kusOfs = KART_OFSET(width, height), kusIn = KUS_INIS(width, height);
    const kusKaynak = { x: kusIn.x + kusOfs.dx, y: kusIn.y + kusOfs.dy };
    return (
      <View style={[s.kok, { backgroundColor: ZEMIN }]}>
        <View style={StyleSheet.absoluteFill} onLayout={undefined}>
          <Masa ref={masa} kaynak0={kusKaynak} acilim={o.acilim as AcilimId} kartlar={o.kartlar} acilan={acilan} aktif={aktifKart} boyut={{ w: width, h: height }} onKart={(i) => buyukAyarla(i)} />
        </View>
        {/* üst yazı paneli: kartlar masanın orta-alt kısmında, üst ~%27 yalnız eller (hiçbir açılımda kart yok) */}
        <View style={[s.panel, { top: ust + 2, height: panelH }]}>
          <View style={s.panelBas}>
            <View style={s.pip} pointerEvents="none"><Klip ad={klipAd} stil={StyleSheet.absoluteFill} /></View>
            <Pressable onPress={() => panelAcikAyarla((a) => !a)} style={{ flex: 1, paddingHorizontal: 10 }} accessibilityLabel="Yazıyı genişlet">
              <Text style={s.panelBaslik} numberOfLines={1}>
                {asama === 'bitti' ? `KAHİN · ${o.acilim_ad}` : kartAd ? `${kartAd.pozisyon} · ${kartAd.ad}${kartAd.ters ? ' (ters)' : ''}` : yaziParca?.tur === 'kapanis' ? 'KAHİN · Kapanış' : 'KAHİN'}
              </Text>
              <Text style={s.panelIpucu}>{(asama === 'bitti') !== panelAcik ? 'küçült ▴ · kartlara dokun' : 'yazıyı büyüt ▾'}</Text>
            </Pressable>
            {asama === 'okuma' && (
              <>
                <Pressable onPress={() => { duraklatAyarla((d) => { bayrak.current.duraklat = !d; return !d; }); }} accessibilityLabel={duraklat ? 'Devam' : 'Duraklat'} style={s.mini}><Text style={s.miniYazi}>{duraklat ? '▶' : '❚❚'}</Text></Pressable>
                <Pressable onPress={() => { bayrak.current.atla = true; }} accessibilityLabel="İleri" style={s.mini}><Text style={s.miniYazi}>▸▸</Text></Pressable>
              </>
            )}
            <Pressable onPress={cik} accessibilityLabel="Kapat" style={s.mini}><Text style={s.miniYazi}>✕</Text></Pressable>
          </View>
          {asama === 'bitti' && panelH === kucukH ? (
            <View style={{ flex: 1, justifyContent: 'center' }}><Text style={s.ozetKucuk} numberOfLines={2}>{o.ozet}</Text></View>
          ) : (
          <ScrollView ref={yaziKap} style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 8 }} showsVerticalScrollIndicator={false} onContentSizeChange={(_, h) => { yaziBoy.current.icerik = h; }} onLayout={(e) => { yaziBoy.current.gorunen = e.nativeEvent.layout.height; }}>
            {asama === 'bitti' ? (
              <>
                <Text style={s.ozet}>{o.ozet}</Text>
                {o.parcalar.map((p, i) => (
                  <Text key={i} style={s.metin}>{p.tur === 'kart' && p.kart != null ? kartBaslik(o.kartlar[p.kart]) + '\n' : ''}{p.metin + '\n'}</Text>
                ))}
                <Text style={s.eglence}>{YASAL_IBARE}</Text>
              </>
            ) : (
              <Text style={s.metin}>{yaziParca?.metin ?? '…'}</Text>
            )}
          </ScrollView>
          )}
          {asama === 'bitti' && (
            <View style={s.satir}>
              <Dugme yazi="Yeni okuma" onPress={yeniOkuma} birincil esit />
              <Dugme yazi="Kapat" onPress={cik} esit />
            </View>
          )}
        </View>
        {/* kuzgun yazı panelinin ÜSTÜNDE uçar (panel altında kalmasın) */}
        <KuzgunMasa kartW={kartBoy.w} kartH={kartBoy.h} w={width} h={height} acik={asama === 'okuma' || asama === 'bitti'} gagaTetik={gagaSay} cik={asama === 'bitti'} />
        {/* kartı büyüt (dokun-büyüt: masa_dik kararı) */}
        {buyukKart && (
          <Pressable style={[StyleSheet.absoluteFill, s.buyukZemin]} onPress={() => buyukAyarla(null)} accessibilityLabel="Büyük kartı kapat">
            <Animated.Image source={KART_YUZU[buyukKart.id]} resizeMode="contain" style={{ height: Math.min(height * 0.62, 460), aspectRatio: 0.595, transform: [{ rotate: buyukKart.ters ? '180deg' : '0deg' }] }} />
            <Text style={s.buyukBaslik}>{buyukKart.pozisyon} · {buyukKart.ad}{buyukKart.ters ? ' (ters)' : ''}</Text>
            <Text style={s.buyukAlt}>{buyukKart.anahtar.join(' · ')}</Text>
          </Pressable>
        )}
      </View>
    );
  }

  // giriş / soru / hazırlık: tam ekran bekleme klibi
  return (
    <View style={[s.kok, { backgroundColor: ZEMIN }]}>
      <Klip ad={asama === 'hazirlik' ? 'buyu' : 'bekleme'} stil={{ position: 'absolute', top: 0, left: 0, right: 0, height: height * 0.6 }} />
      <LinearGradient colors={['rgba(11,6,20,0.7)', 'rgba(11,6,20,0.05)', 'rgba(11,6,20,0.0)', ZEMIN, ZEMIN]} locations={[0, 0.14, 0.3, 0.6, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />
      <KuzgunTunekte w={width} h={height * 0.6} />
      <Pressable onPress={asama === 'soru' ? () => asamaAyarla('giris') : cik} accessibilityLabel="Geri" style={[s.geri, { top: ust + 6 }]}><Text style={s.kapatYazi}>‹</Text></Pressable>
      <View style={[s.ustBaslik, { top: ust + 4 }]} pointerEvents="none">
        <Text style={s.baslik}>KAHİN</Text>
        <Text style={s.altBaslik}>Kartların fısıltısını dinle</Text>
      </View>
      <ScrollView style={StyleSheet.absoluteFill} contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end', paddingTop: height * 0.4, paddingBottom: alt + 16, paddingHorizontal: 20 }} keyboardShouldPersistTaps="handled">
        {asama === 'hazirlik' && (
          <View style={s.hazirlik}>
            <ActivityIndicator color={ALTIN} />
            <Text style={s.hazirlikYazi}>KAHİN kartları karıştırıyor…{'\n'}<Text style={{ color: SOLUK, fontSize: 13 }}>{secim === 'kelt' ? 'Kelt Haçı biraz uzun sürer, sabret.' : 'Birkaç saniye.'}</Text></Text>
          </View>
        )}

        {asama === 'giris' && (
          <>
            <Text style={s.etiket}>Hangi açılım?</Text>
            {(durum?.acilimlar ?? FALLBACK_ACILIM).map((a) => (
              <Pressable key={a.id} onPress={() => secimAyarla(a.id as AcilimId)} accessibilityRole="button" accessibilityState={{ selected: secim === a.id }} style={[s.secenek, secim === a.id && s.secenekSecili]}>
                <View style={{ flex: 1 }}>
                  <Text style={s.secenekAd}>{ACILIM_AD[a.id as AcilimId] ?? a.ad}</Text>
                  <Text style={s.secenekAlt}>{a.kart} kart · {a.sure}</Text>
                </View>
                <Text style={[s.secenekIsaret, secim === a.id && { color: ALTIN }]}>{secim === a.id ? '●' : '○'}</Text>
              </Pressable>
            ))}
            <HakBandi durum={durum} girisli={girisli} />
            <Dugme yazi="Devam" onPress={() => asamaAyarla('soru')} birincil buyuk />
          </>
        )}

        {asama === 'soru' && (
          <>
            <Text style={s.etiket}>Kartlara ne sormak istersin?</Text>
            <TextInput value={soru} onChangeText={soruAyarla} placeholder="İstersen yaz; yazmazsan genel rehberlik açarım" placeholderTextColor="rgba(237,233,246,0.4)" multiline maxLength={400} style={s.girdi} accessibilityLabel="Kartlara sorun" />
            <Text style={s.sayac}>{soru.length}/400</Text>
            {astroProfil && (
              <Pressable onPress={() => astroKatAyarla((a) => !a)} accessibilityRole="checkbox" accessibilityState={{ checked: astroKat }} style={s.astroSatir}>
                <View style={[s.astroKutu, astroKat && { backgroundColor: ALTIN, borderColor: ALTIN }]}>{astroKat && <Text style={{ color: '#1A1030', fontSize: 14, lineHeight: 16, fontFamily: yazi.kalin }}>✓</Text>}</View>
                <Text style={s.astroYazi}>Burcumu ve bugünkü gökyüzünü yoruma kat</Text>
              </Pressable>
            )}
            {!!kriz && <Text style={s.kriz}>{kriz}</Text>}
            {!!hata && <Text style={s.hata}>{hata}</Text>}
            <HakBandi durum={durum} girisli={girisli} />
            {hakTamam ? (
              <Dugme yazi={girisli ? 'Kartları aç' : 'Giriş yap ve kartları aç'} onPress={okumaBaslat} birincil buyuk devre={yuk !== 'yok'} />
            ) : (
              <SatinPanel urunler={urunler} yuk={yuk} neden={odemeNeden} satin={satinAlTikla} />
            )}
          </>
        )}
        <Text style={s.alt}>{YASAL_IBARE} Yapay zekâ karakteri KAHİN yorum yapar.</Text>
      </ScrollView>
    </View>
  );
}

const FALLBACK_ACILIM: C.KahinAcilim[] = [
  { id: 'tek', ad: 'Tek kart', kart: 1, sure: '1 dk' },
  { id: 'uc', ad: 'Geçmiş · Şimdi · Önündeki dönem', kart: 3, sure: '3 dk' },
  { id: 'iliski', ad: 'İlişki', kart: 5, sure: '4 dk' },
  { id: 'kelt', ad: 'Kelt Haçı', kart: 10, sure: '8 dk' },
];
const ACILIM_AD: Record<AcilimId, string> = { tek: 'Tek kart · günün kartı', uc: 'Geçmiş · Şimdi · Önündeki dönem', iliski: 'İlişki açılımı', kelt: 'Kelt Haçı · derin okuma' };

function HakBandi({ durum, girisli }: { durum: C.KahinDurum | null; girisli: boolean }) {
  if (!girisli) return <Text style={s.hak}>Giriş yapınca ilk okuman ücretsiz.</Text>;
  if (!durum) return null;
  if (durum.ucretsiz_var !== false) return <Text style={s.hak}>İlk okuman bizden: ücretsiz.</Text>;
  return <Text style={s.hak}>Kalan okuma hakkın: {durum.hak ?? 0}</Text>;
}

// Satın alma paneli: yalnız uygulamada düğme; web'de "Uygulamada aç".
function SatinPanel({ urunler, yuk, neden, satin }: { urunler: UrunBilgi[]; yuk: string; neden: string; satin: (id: string) => void }) {
  const liste = [{ id: 'kahin_okuma_1', ad: '1 okuma', hak: 1 }]; // 1.7.1 (S-3 E2): 5'li paket yok
  return (
    <View style={s.satinKutu}>
      <Text style={s.satinBaslik}>Okuma hakkın bitti</Text>
      {!ODEME_VAR && Platform.OS === 'ios' ? (
        // 13.11 (App Store 3.1.1/3.1.3): iPhone uygulamasında ödeme kapalı; başka yere satın alma yönlendirmesi yok
        <Text style={s.satinYazi}>Okumanın devamı bu cihazda henüz açık değil.</Text>
      ) : !ODEME_VAR ? (
        <>
          <Text style={s.satinYazi}>Yeni okuma hakkı yalnız Yazsam mı? uygulamasından alınır.</Text>
          <MagazaYonlendir />
        </>
      ) : neden || urunler.length === 0 ? (
        <Text style={s.satinYazi}>Satın alma bu cihazda şu an kullanılamıyor (Google Play gerekli).</Text>
      ) : (
        liste.map((u) => {
          const b = urunler.find((x) => x.id === u.id);
          return <Dugme key={u.id} yazi={`${u.ad}${b?.fiyat ? ` · ${b.fiyat}` : ''}`} onPress={() => satin(u.id)} birincil={u.hak === 5} devre={yuk !== 'yok'} />;
        })
      )}
    </View>
  );
}

const s = StyleSheet.create({
  astroSatir: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8, paddingVertical: 4 },
  astroKutu: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: 'rgba(237,233,246,0.5)', alignItems: 'center', justifyContent: 'center' },
  astroYazi: { fontFamily: yazi.orta, fontSize: 14, color: YAZI, flex: 1 },
  kok: { flex: 1 },
  ustBaslik: { position: 'absolute', left: 60, right: 60, alignItems: 'center' },
  baslik: { fontFamily: yazi.marka, fontSize: 28, color: ALTIN, letterSpacing: 4, textAlign: 'center', textShadowColor: '#000', textShadowRadius: 8 },
  altBaslik: { fontFamily: yazi.kalem, fontSize: 21, color: YAZI, textAlign: 'center', marginTop: 0, textShadowColor: '#000', textShadowRadius: 8 },
  etiket: { fontFamily: yazi.kalin, fontSize: 15, color: SOLUK, marginBottom: 8, marginTop: 4 },
  secenek: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(30,20,52,0.82)', borderColor: 'rgba(237,233,246,0.12)', borderWidth: 1, borderRadius: 16, paddingVertical: 13, paddingHorizontal: 16, marginBottom: 9 },
  secenekSecili: { borderColor: ALTIN, backgroundColor: 'rgba(60,40,96,0.9)' },
  secenekAd: { fontFamily: yazi.kalin, fontSize: 16.5, color: YAZI },
  secenekAlt: { fontFamily: yazi.normal, fontSize: 13, color: SOLUK, marginTop: 2 },
  secenekIsaret: { fontSize: 18, color: SOLUK },
  hak: { fontFamily: yazi.orta, fontSize: 14, color: ALTIN, textAlign: 'center', marginVertical: 12 },
  girdi: { minHeight: 96, maxHeight: 160, backgroundColor: 'rgba(30,20,52,0.9)', borderColor: 'rgba(237,233,246,0.18)', borderWidth: 1, borderRadius: 16, padding: 14, color: YAZI, fontFamily: yazi.normal, fontSize: 16, textAlignVertical: 'top' },
  sayac: { fontFamily: yazi.normal, fontSize: 12, color: SOLUK, textAlign: 'right', marginTop: 4 },
  kriz: { fontFamily: yazi.normal, fontSize: 15, lineHeight: 22, color: YAZI, backgroundColor: 'rgba(143,114,255,0.2)', borderRadius: 14, padding: 14, marginTop: 8 },
  hata: { fontFamily: yazi.orta, fontSize: 14, color: '#FF8FA8', marginTop: 8 },
  alt: { fontFamily: yazi.normal, fontSize: 11.5, lineHeight: 16, color: 'rgba(237,233,246,0.45)', textAlign: 'center', marginTop: 16 },
  hazirlik: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: 'rgba(30,20,52,0.85)', borderRadius: 18, padding: 18, marginBottom: 12 },
  hazirlikYazi: { fontFamily: yazi.orta, fontSize: 16, color: YAZI, flex: 1, lineHeight: 22 },
  geri: { position: 'absolute', left: 10, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(11,6,20,0.55)', alignItems: 'center', justifyContent: 'center' },
  kapat: { position: 'absolute', right: 12, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(11,6,20,0.6)', alignItems: 'center', justifyContent: 'center' },
  kapatYazi: { color: YAZI, fontSize: 22, lineHeight: 26 },
  pip: { width: 52, height: 52, borderRadius: 26, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(242,193,78,0.7)', backgroundColor: '#000' },
  panel: { position: 'absolute', left: 8, right: 8, backgroundColor: 'rgba(11,6,20,0.9)', borderRadius: 20, paddingHorizontal: 14, paddingTop: 8, paddingBottom: 8, borderWidth: 1, borderColor: 'rgba(242,193,78,0.35)' },
  mini: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: 'rgba(237,233,246,0.3)', alignItems: 'center', justifyContent: 'center', marginLeft: 6 },
  miniYazi: { color: YAZI, fontSize: 14, fontFamily: yazi.kalin },
  panelBas: { flexDirection: 'row', alignItems: 'center', paddingBottom: 6 },
  panelBaslik: { fontFamily: yazi.kalin, fontSize: 14.5, color: ALTIN, flex: 1 },
  panelIpucu: { color: SOLUK, fontSize: 11 },
  metin: { fontFamily: yazi.normal, fontSize: 15, lineHeight: 21, color: YAZI, marginTop: 2 },
  ozetKucuk: { fontFamily: yazi.kalem, fontSize: 21, lineHeight: 24, color: ALTIN },
  ozet: { fontFamily: yazi.kalem, fontSize: 24, lineHeight: 28, color: ALTIN, marginTop: 6, marginBottom: 6 },
  eglence: { fontFamily: yazi.normal, fontSize: 12, lineHeight: 17, color: SOLUK, marginTop: 8, fontStyle: 'italic' },
  satir: { flexDirection: 'row', gap: 10, paddingTop: 2 },
  buyukZemin: { backgroundColor: 'rgba(5,3,10,0.9)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  buyukBaslik: { fontFamily: yazi.kalin, fontSize: 18, color: ALTIN, marginTop: 14, textAlign: 'center' },
  buyukAlt: { fontFamily: yazi.normal, fontSize: 13.5, lineHeight: 19, color: SOLUK, marginTop: 5, textAlign: 'center' },
  satinKutu: { backgroundColor: 'rgba(30,20,52,0.9)', borderRadius: 18, padding: 16, borderColor: 'rgba(242,193,78,0.35)', borderWidth: 1, marginTop: 4 },
  satinBaslik: { fontFamily: yazi.kalin, fontSize: 17, color: ALTIN, marginBottom: 6 },
  satinYazi: { fontFamily: yazi.normal, fontSize: 14.5, lineHeight: 21, color: YAZI, marginBottom: 6 },
});
