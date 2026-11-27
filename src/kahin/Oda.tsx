// KULLANILMIYOR (04.11.2026): eski KAHİN astroloji/tarot ekranı. Astroloji ve Tarot Kart Analizi artık sitenin /astroloji/ ve /tarot/ sayfaları,
// uygulamada WebView ile (bilesenler/canli/SiteBolumu.native.tsx); hiçbir ekran bu dosyayı içe aktarmıyor. Kod başvuru için duruyor, silinmedi.
// KAHİN ODASI — yeni tarot deneyimi (30.10 gece, Onur'un tasarımı): tüm okuma KAHİN'in odasında tam ekran dikey GERÇEK VİDEO içinde geçer.
// Akış: açılım+soru → güzel yelpaze deste (kartları KULLANICI seçer) → KAHİN büyüyle kartları dizer (kartlar DÜZ ve DİK, ekranın alt yarısında, yüzü kullanıcıya dönük)
// → adım adım okuma: her kart sesli, duygusal kart yorumu; karta göre kısa soru (2–3 dokunmalık cevap + isteğe bağlı yazı) → yorum cevabı hesaba katar → kapanış.
// Videolar klipSistemi.ts durum makinesinden gelir (K0 kuzgun yok · K1 masada · K2 tünekte); dudak eşleme YOK: konuşurken ruh haline uyan klip döner, soruda dinleyen klip.
// Kuzgun: kartlar seçilince gelir (K0→K1), okuma boyunca masada bekler; sunucunun kuzgun işaretlerinde kendi klibini oynar (çığlık SESLİ); ara sıra tünekte bekler. Kartlar masadaki kuzgunu örter → kuzgun klibinde kartlar kısa süre silikleşir.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as C from '@/canli';
import { yazi } from '@/tema/tema';
import { useCanli } from '@/bilesenler/canli/baglam';
import { KART_ARKA3, KART_YUZU } from './kartYuzleri';
import { BEKLEME, yuzKlipId } from './klipSistemi';
import { ALTIN, bekle, Dugme, SatinKutusu, SOLUK, YAZI, ZEMIN } from './ortak';
import { Sahne, type SahneTutamak } from './Sahne';
import { useSatin } from './satin';
import { iyiAnBildir } from '@/bildirim/iyiAn';
import { YASAL_IBARE } from '@/kahin/yasal';

type Acilim = 'tek' | 'uc' | 'iliski' | 'kelt';
type Faz = 'giris' | 'deste' | 'dizilim' | 'okuma' | 'bitti';
type Segman = { tur: 'giris' | 'kart' | 'kapanis'; kart: number | null; metin: string; ruh: string; kuzgun: string | null; ses: string | null; sure: number | null; soru?: { secenekler: string[] } };
type Adim = { oturum: string; adim: number; toplam_adim: number; segmanlar: Segman[]; bekleyen_soru: boolean; bitti: boolean; ozet?: string; kartlar?: C.KahinKart[]; kriz?: boolean; metin?: string };
const KART_SAYI: Record<Acilim, number> = { tek: 1, uc: 3, iliski: 5, kelt: 10 };
const ACILIM_AD: Record<Acilim, string> = { tek: 'Tek kart · günün kartı', uc: 'Geçmiş · Şimdi · Önündeki dönem', iliski: 'İlişki açılımı', kelt: 'Kelt Haçı · derin okuma' };
const ACILIM_ALT: Record<Acilim, string> = { tek: '1 kart · kısa', uc: '3 kart · 3 dk', iliski: '5 kart · 4 dk', kelt: '10 kart · derin' };
const ORAN = 1.68; // kart yüksekliği / genişliği (yüzlerle aynı)
const DESTE_N = 17;
const CIGILIK_SES = require('../../assets/kahin/ses/kuzgun_cigilik.m4a'); // kuzgun_cigilik klibinin sesi (kamu malı Common Raven kaydı, klibin gaga hareketine hizalı)
const SITE = 'https://yazsammi.com';

type Poz = { cx: number; cy: number; rot: number; s: number };
const poz0: Poz = { cx: 0, cy: 0, rot: 0, s: 1 };

/** yelpaze (deste) konumu: yatay yay, kartlar birbirine biner */
function fanPoz(i: number, W: number, H: number): Poz {
  const a = (-30 + (60 * i) / (DESTE_N - 1)) * (Math.PI / 180);
  const R = H * 0.40, px = W / 2, py = H * 1.13;
  return { cx: px + R * Math.sin(a), cy: py - R * Math.cos(a), rot: (a * 180) / Math.PI, s: 1 };
}
/** kart dizilim yuvaları (alt ~%40; yüzü kullanıcıya dönük, DÜZ, DİK) */
export function yuvalar(acilim: Acilim, W: number, H: number): { cx: number; cy: number; w: number; h: number }[] {
  const y0 = H * 0.475, y1 = H * 0.865, bandH = y1 - y0, yo = (y0 + y1) / 2;
  const satir = (sayi: number, w: number, cy: number, bosluk: number) => Array.from({ length: sayi }, (_, i) => ({ cx: W / 2 + (i - (sayi - 1) / 2) * (w + bosluk), cy, w, h: w * ORAN }));
  if (acilim === 'tek') { const w = Math.min(W * 0.4, bandH / ORAN * 0.96); return satir(1, w, yo, 0); }
  if (acilim === 'uc') { const w = Math.min((W - 28 - 20) / 3, bandH / ORAN * 0.96); return satir(3, w, yo, 10); }
  if (acilim === 'iliski') { // sıra: Ben, O, Bağ, Besleyen, Yoran → üst sıra [Ben, Bağ, O], alt sıra [Besleyen, Yoran]
    const w = Math.min(((bandH - 10) / 2) / ORAN, (W - 28 - 16) / 3), h = w * ORAN, c1 = y0 + h / 2, c2 = y0 + h * 1.5 + 10;
    const u = satir(3, w, c1, 8), a = satir(2, w, c2, 8);
    return [u[0], u[2], u[1], a[0], a[1]];
  }
  const w = Math.min((W - 20 - 4 * 6) / 5, ((bandH - 8) / 2) / ORAN), h = w * ORAN; // kelt: 2 sıra × 5
  const u = satir(5, w, y0 + h / 2, 6), a = satir(5, w, y0 + h * 1.5 + 8, 6);
  return [...u, ...a];
}

type KartAnim = { x: Animated.Value; y: Animated.Value; r: Animated.Value; s: Animated.Value; op: Animated.Value; ac: Animated.Value; par: Animated.Value };
const yeniKart = (p: Poz): KartAnim => ({ x: new Animated.Value(p.cx), y: new Animated.Value(p.cy), r: new Animated.Value(p.rot), s: new Animated.Value(p.s), op: new Animated.Value(1), ac: new Animated.Value(0), par: new Animated.Value(0) });
const git = (k: KartAnim, p: Poz, ms: number, bekleme = 0, ease = Easing.out(Easing.cubic)) => Animated.parallel([
  Animated.timing(k.x, { toValue: p.cx, duration: ms, delay: bekleme, easing: ease, useNativeDriver: true }),
  Animated.timing(k.y, { toValue: p.cy, duration: ms, delay: bekleme, easing: ease, useNativeDriver: true }),
  Animated.timing(k.r, { toValue: p.rot, duration: ms, delay: bekleme, easing: ease, useNativeDriver: true }),
  Animated.timing(k.s, { toValue: p.s, duration: ms, delay: bekleme, easing: ease, useNativeDriver: true }),
]);

export function OdaTarot({ geri, onSoru = '', astroProfil = false }: { geri: () => void; onSoru?: string; astroProfil?: boolean }) {
  const c = useCanli();
  const { width: W, height: H } = useWindowDimensions();
  const ek = useSafeAreaInsets();
  const ust = Math.max(ek.top, Platform.OS === 'android' ? 24 : 12), alt = Math.max(ek.bottom, 10);
  const girisli = !!c.uye && !c.uye.yeni && !c.uye.sozGerekli; // 1.7.1 (S-3 E1)
  const sahne = useRef<SahneTutamak>(null);
  const [faz, fazAyarla] = useState<Faz>('giris');
  const fazRef = useRef<Faz>('giris');
  fazRef.current = faz;
  const [secim, secimAyarla] = useState<Acilim>('uc');
  const [soru, soruAyarla] = useState(onSoru);
  const [astroKat, astroKatAyarla] = useState(astroProfil);
  const [durum, durumAyarla] = useState<C.KahinDurum | null>(null);
  const [hata, hataAyarla] = useState('');
  const [secilenler, secilenlerAyarla] = useState<number[]>([]);
  const [kartlar, kartlarAyarla] = useState<C.KahinKart[]>([]);
  const [acik, acikAyarla] = useState<number[]>([]);
  const [aktifKart, aktifKartAyarla] = useState<number | null>(null);
  const [yaziMetin, yaziMetinAyarla] = useState('');
  const [ilerleme, ilerlemeAyarla] = useState(0);
  const [soruPanel, soruPanelAyarla] = useState<{ metin: string; secenekler: string[] } | null>(null);
  const [serbest, serbestAyarla] = useState('');
  const [zoom, zoomAyarla] = useState<number | null>(null);
  const [bilgi, bilgiAyarla] = useState('');
  const [ozet, ozetAyarla] = useState('');
  const [duraklat, duraklatAyarla] = useState(false);
  const [yaziAcik, yaziAcikAyarla] = useState(true);
  const [kriz, krizAyarla] = useState('');
  const kartKat = useRef(new Animated.Value(1)).current; // kart katmanı opaklığı (soru panelinde ve kuzgun klibinde silikleşir)
  const bay = useRef({ canli: true, duraklat: false, atla: false, tur: 0, cevap: null as null | ((s: string) => void) });
  const oynatici = useRef<AudioPlayer | null>(null);
  const animler = useRef<KartAnim[]>([]);
  const secRef = useRef<number[]>([]); // seçilen deste sıraları (kapanış sorunu olmasın diye ref)
  const yaziKap = useRef<ScrollView>(null);
  const yaziBoy = useRef({ icerik: 0, gorunen: 0 });
  bay.current.duraklat = duraklat;

  const satin = useSatin(girisli, () => { durumYukle(); }, c.tost);
  const durumYukle = useCallback(async () => { const r = await C.kahinDurum(); if (r.ok) durumAyarla(r.veri); }, []);
  useEffect(() => { durumYukle(); }, [durumYukle, girisli]);
  useEffect(() => { setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'duckOthers', shouldPlayInBackground: false }).catch(() => {}); bay.current.canli = true; return () => { if (fazRef.current === 'bitti') iyiAnBildir(); bay.current.canli = false; bay.current.tur++; try { oynatici.current?.remove(); } catch {} }; }, []);
  const hakTamam = !durum || durum.ucretsiz_var !== false || (durum.hak ?? 0) > 0;

  // ---- sahne klibi: giriş/deste/dizilim ----
  const bekleme = () => sahne.current?.oynat(BEKLEME[sahne.current.durum()], { dongu: true });
  const kartSoluk = (v: number, ms = 320) => Animated.timing(kartKat, { toValue: v, duration: ms, useNativeDriver: true }).start();
  useEffect(() => { if (faz === 'giris' || faz === 'deste') bekleme(); }, [faz]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const z = setTimeout(() => bekleme(), 150); return () => clearTimeout(z); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { kartSoluk(soruPanel ? 0.3 : 1); }, [soruPanel]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- yazı kaydırma (ses ilerledikçe) ----
  useEffect(() => { const { icerik, gorunen } = yaziBoy.current; if (icerik > gorunen) yaziKap.current?.scrollTo({ y: Math.max(0, (ilerleme - 0.1) * 1.1 * (icerik - gorunen)), animated: true }); }, [ilerleme]);
  useEffect(() => { yaziKap.current?.scrollTo({ y: 0, animated: false }); }, [yaziMetin]);

  const yuva = useMemo(() => yuvalar(secim, W, H), [secim, W, H]);
  const n = KART_SAYI[secim];
  const fanW = Math.min(W * 0.30, 128), fanH = fanW * ORAN;

  // ---- deste: kart oluşturma ----
  const desteKur = () => {
    animler.current = Array.from({ length: DESTE_N }, (_, i) => yeniKart(fanPoz(i, W, H)));
    secilenlerAyarla([]); acikAyarla([]); aktifKartAyarla(null); kartlarAyarla([]); yaziMetinAyarla(''); ozetAyarla(''); krizAyarla('');
  };
  const desteyiAc = () => {
    if (!girisli) { c.girisIste('KAHİN ile okuma için giriş yap', () => {}); return; }
    if (!hakTamam) return;
    hataAyarla(''); desteKur(); fazAyarla('deste');
    // karıştırma: yelpaze hafifçe dalgalanır
    animler.current.forEach((k, i) => { k.s.setValue(0.7); k.op.setValue(0); Animated.parallel([Animated.timing(k.s, { toValue: 1, duration: 520, delay: i * 28, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true }), Animated.timing(k.op, { toValue: 1, duration: 320, delay: i * 28, useNativeDriver: true })]).start(); });
  };
  const slotPoz = (k: number): Poz => { const sw = Math.min(46, (W - 32) / n - 6), s = sw / fanW; const cy = H * 0.565; return { cx: W / 2 + (k - (n - 1) / 2) * (sw + 6), cy, rot: 0, s }; };
  const yuvaPoz = (k: number): Poz => ({ cx: yuva[k].cx, cy: yuva[k].cy, rot: 0, s: yuva[k].w / fanW });
  const sec = (i: number) => {
    if (faz !== 'deste' || secilenler.includes(i) || secilenler.length >= n) return;
    const k = secilenler.length, yeni = [...secilenler, i];
    secilenlerAyarla(yeni);
    git(animler.current[i], slotPoz(k), 520, 0, Easing.out(Easing.cubic)).start();
    if (yeni.length === n) setTimeout(() => dizilimBaslat(yeni), 650);
  };

  // ---- oturum başlat + büyü dizilimi ----
  async function dizilimBaslat(yeni: number[]) {
    fazAyarla('dizilim'); bilgiAyarla(''); secRef.current = yeni;
    const tur = ++bay.current.tur; const canli = () => bay.current.canli && tur === bay.current.tur;
    animler.current.forEach((k, i) => { if (!yeni.includes(i)) Animated.timing(k.op, { toValue: 0, duration: 450, useNativeDriver: true }).start(); });
    const istek = C.kahinOturumBaslat(secim, soru.trim(), yeni, astroProfil && astroKat);
    if (sahne.current?.durum() === 'K0') await sahne.current.oynat('kuzgun_gelis'); // kartlar seçildi: kuzgun odaya gelir (K0→K1)
    if (!canli()) return;
    const buyu = sahne.current?.oynat('buyu_dizim') ?? Promise.resolve();
    await bekle(500);
    yeni.forEach((i, k) => git(animler.current[i], yuvaPoz(k), 820, k * 160, Easing.inOut(Easing.cubic)).start());
    await Promise.all([buyu, bekle(820 + n * 160)]);
    if (!canli()) return;
    bilgiAyarla('KAHİN kartlarına bakıyor…');
    sahne.current?.oynat(yuzKlipId('gizem', 'K2'), { dongu: true }); // kartlar masayı örttü: kuzgun tünekte
    const r = await istek;
    if (!canli()) return;
    if (!r.ok) {
      desteGeri();
      if (r.durum === 402) { durumAyarla((d) => (d ? { ...d, hak: 0, ucretsiz_var: false } : d)); hataAyarla('Okuma hakkın bitti.'); }
      else if (r.durum === 422) hataAyarla('Bu soruyu kartlara soramam; başka türlü yazar mısın?');
      else if (r.durum === 429) hataAyarla('Bugünlük okuma sınırına geldin; yarın yine bekliyorum.');
      else if (r.durum === 503) hataAyarla('KAHİN şu an çok yoğun, hakkın korundu. Birazdan tekrar dene.');
      else hataAyarla('Kartlar şu an açılamadı. Bağlantını kontrol edip tekrar dene.');
      return;
    }
    const v = r.veri as any;
    if (v.kriz) { krizAyarla(v.metin); desteGeri(); return; }
    kartlarAyarla(v.kartlar); durumAyarla((d) => (d ? { ...d, hak: v.hak, ucretsiz_var: v.ucretsiz_var } : d));
    bilgiAyarla(''); fazAyarla('okuma');
    okumayiYurut(v as Adim, tur);
  }
  function desteGeri() { bekleme(); animler.current = []; secilenlerAyarla([]); bilgiAyarla(''); fazAyarla('giris'); durumYukle(); }

  // ---- ses ----
  const sesHazirla = (url: string | null): AudioPlayer | null => { if (!url) return null; try { return createAudioPlayer({ uri: C.kahinSesAdres(url) }); } catch { return null; } };
  const sesOynat = async (p: AudioPlayer | null, sure: number | null, metinUzun: number, tur: number, url: string | null) => {
    const aktif = () => bay.current.canli && tur === bay.current.tur;
    let bitti = false;
    const tahmin = Math.max(4000, (sure ?? metinUzun / 15) * 1000 + 2500);
    if (p) { oynatici.current = p; (p as any).addListener('playbackStatusUpdate', (s: any) => { if (s.didJustFinish) bitti = true; }); p.play(); console.log(`KAHIN_SES_BASLA ${Date.now()} ${url ?? '-'}`); }
    let gecen = 0, pause = false;
    while (!bitti && !bay.current.atla && aktif()) {
      await bekle(120);
      if (bay.current.duraklat !== pause) { pause = bay.current.duraklat; try { pause ? p?.pause() : p?.play(); } catch {} }
      if (!pause) gecen += 120;
      if (gecen % 480 === 0) ilerlemeAyarla(Math.min(1, gecen / Math.max(1500, (sure ?? tahmin / 1000) * 1000)));
      if (gecen > tahmin + 30000 || (!p && gecen >= tahmin)) break;
    }
    bay.current.atla = false;
    try { p?.pause(); p?.remove(); } catch {}
    if (oynatici.current === p) oynatici.current = null;
  };

  // ---- okuma akışı: adım adım, ön üretimli ----
  async function devamIste(oturum: string, cevap: string | undefined, tur: number): Promise<Adim | null> {
    for (let d = 0; d < 4; d++) {
      if (!(bay.current.canli && tur === bay.current.tur)) return null;
      const r = await C.kahinOturumDevam(oturum, cevap);
      if (r.ok) return r.veri as any;
      if (r.durum === 404 || r.durum === 422) return null;
      await bekle(1800 * (d + 1));
    }
    return null;
  }
  async function segmanOynat(s: Segman, tur: number, hazirSes: AudioPlayer | null) {
    const aktif = () => bay.current.canli && tur === bay.current.tur;
    yaziMetinAyarla(s.metin); ilerlemeAyarla(0); soruPanelAyarla(null);
    if (s.kart != null) { aktifKartAyarla(s.kart); acikAyarla((l) => (l.includes(s.kart!) ? l : [...l, s.kart!])); const k = animler.current[secRef.current[s.kart!]]; if (k) Animated.sequence([Animated.timing(k.ac, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.cubic), useNativeDriver: true })]).start(); }
    else aktifKartAyarla(null);
    const ses = sesOynat(hazirSes, s.sure, s.metin.length, tur, s.ses);
    await Promise.all([ses, segmanVideo(s, tur).catch(() => {})]);
  }
  const cigilikCal = () => { try { const p = createAudioPlayer(CIGILIK_SES); p.volume = 0.45; p.play(); console.log(`KAHIN_KUZGUN_SES ${Date.now()}`); setTimeout(() => { try { p.remove(); } catch {} }, 7000); } catch {} };
  /** konuşurken video: ruh haline uyan yüz klibi (kuzgun tünekte, kartlar HİÇ solmaz); sunucu 'cigilik' derse kuzgun çığlığı (ses) çalar */
  async function segmanVideo(s: Segman, tur: number) {
    const aktif = () => bay.current.canli && tur === bay.current.tur;
    const sh = sahne.current; if (!sh) return;
    sh.oynat(yuzKlipId(s.ruh, sh.durum()), { dongu: true });
    if (s.kuzgun === 'cigilik') { await bekle(1500); if (aktif()) cigilikCal(); }
  }
  async function okumayiYurut(ilk: Adim, tur: number) {
    const aktif = () => bay.current.canli && tur === bay.current.tur;
    let yanit: Adim | null = ilk;
    while (yanit && aktif()) {
      const seslerP = yanit.segmanlar.map((s) => sesHazirla(s.ses));
      const soruluSeg = yanit.segmanlar.find((s) => s.soru);
      // ön üretim: soru yoksa sıradaki adım ses sürerken hazırlanır
      let sonraki: Promise<Adim | null> | null = null;
      if (!yanit.bitti && !soruluSeg) sonraki = devamIste(yanit.oturum, undefined, tur);
      for (let i = 0; i < yanit.segmanlar.length && aktif(); i++) await segmanOynat(yanit.segmanlar[i], tur, seslerP[i]);
      if (!aktif()) break;
      if (yanit.bitti) { ozetAyarla(yanit.ozet || ''); break; }
      if (soruluSeg?.soru) {
        const cevap = await soruSor(soruluSeg, tur);
        if (!aktif()) break;
        bilgiAyarla('KAHİN düşünüyor…'); sahne.current?.oynat(yuzKlipId('dusunceli', 'K2'), { dongu: true });
        sonraki = devamIste(yanit.oturum, cevap, tur);
      }
      if (!soruluSeg && !sonraki) break;
      const gelen = await sonraki!;
      bilgiAyarla('');
      if (!gelen) { if (aktif()) { bilgiAyarla('Bağlantı koptu; okuma burada kaldı.'); fazAyarla('bitti'); } return; }
      if (gelen.kriz) { krizAyarla(gelen.metin || ''); fazAyarla('bitti'); return; }
      yanit = gelen;
    }
    if (aktif()) { aktifKartAyarla(null); yaziMetinAyarla(''); bekleme(); fazAyarla('bitti'); }
  }
  async function soruSor(s: Segman, tur: number): Promise<string> {
    sahne.current?.oynat(yuzKlipId('soru', 'K2'), { dongu: true });
    soruPanelAyarla({ metin: s.metin.split(/(?<=[.!?…])\s+/).filter(Boolean).slice(-1)[0] || '', secenekler: s.soru!.secenekler }); serbestAyarla('');
    return new Promise<string>((coz) => { bay.current.cevap = (x) => { bay.current.cevap = null; soruPanelAyarla(null); coz(x); }; });
  }
  const cevapVer = (x: string) => bay.current.cevap?.(x.trim());

  const cik = () => { bay.current.tur++; try { oynatici.current?.remove(); } catch {} geri(); };
  const yeniOkuma = () => { bay.current.tur++; try { oynatici.current?.remove(); } catch {} animler.current = []; acikAyarla([]); kartlarAyarla([]); secilenlerAyarla([]); soruAyarla(''); ozetAyarla(''); yaziMetinAyarla(''); krizAyarla(''); fazAyarla('giris'); durumYukle(); bekleme(); };

  // ---------- görünüm ----------
  const kartAlt = H * 0.865;
  const okuyor = faz === 'okuma';
  const etiketSayisi = secim === 'kelt' ? 0 : n;
  return (
    <View style={[s.kok, { backgroundColor: ZEMIN }]}>
      <Sahne ref={sahne} />
      <LinearGradient pointerEvents="none" colors={['rgba(11,6,20,0.55)', 'rgba(11,6,20,0)', 'rgba(11,6,20,0)', 'rgba(11,6,20,0.55)', 'rgba(11,6,20,0.88)']} locations={[0, 0.14, 0.45, 0.8, 1]} style={StyleSheet.absoluteFill} />

      {/* üst çubuk */}
      <View style={[s.ustBar, { paddingTop: ust + 4 }]} pointerEvents="box-none">
        <Pressable onPress={faz === 'deste' ? desteGeri : cik} accessibilityLabel="Geri" style={s.yuvarlak}><Text style={s.yuvarlakYazi}>{faz === 'giris' ? '‹' : '✕'}</Text></Pressable>
        <View style={{ flex: 1 }} />
        {okuyor && <Pressable onPress={() => duraklatAyarla((d) => !d)} accessibilityLabel={duraklat ? 'Devam' : 'Duraklat'} style={s.yuvarlak}><Text style={s.yuvarlakYazi}>{duraklat ? '▶' : '❚❚'}</Text></Pressable>}
        {okuyor && <Pressable onPress={() => { bay.current.atla = true; }} accessibilityLabel="İleri" style={[s.yuvarlak, { marginLeft: 8 }]}><Text style={s.yuvarlakYazi}>▸▸</Text></Pressable>}
        {(okuyor || faz === 'bitti') && <Pressable onPress={() => yaziAcikAyarla((y) => !y)} accessibilityLabel="Yazı" style={[s.yuvarlak, { marginLeft: 8 }]}><Text style={[s.yuvarlakYazi, { fontSize: 14 }]}>Aa</Text></Pressable>}
      </View>

      {/* GİRİŞ: açılım + soru */}
      {faz === 'giris' && (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[s.altSayfa, { paddingBottom: alt + 12 }]}>
          <Text style={s.baslik}>KAHİN</Text>
          <Text style={s.altBaslik}>Kartlarını sen seç</Text>
          <View style={s.acilimIzgara}>
            {(['tek', 'uc', 'iliski', 'kelt'] as Acilim[]).map((a) => (
              <Pressable key={a} onPress={() => secimAyarla(a)} accessibilityRole="button" accessibilityState={{ selected: secim === a }} style={[s.acilim, secim === a && s.acilimSecili]}>
                <Text style={s.acilimAd} numberOfLines={1}>{ACILIM_AD[a]}</Text><Text style={s.acilimAlt}>{ACILIM_ALT[a]}</Text>
              </Pressable>
            ))}
          </View>
          <TextInput value={soru} onChangeText={soruAyarla} placeholder="Kartlara ne sormak istersin? (isteğe bağlı)" placeholderTextColor="rgba(237,233,246,0.45)" multiline maxLength={400} style={s.girdi} accessibilityLabel="Sorun" />
          {astroProfil && (
            <Pressable onPress={() => astroKatAyarla((a) => !a)} accessibilityRole="checkbox" accessibilityState={{ checked: astroKat }} style={s.astroSatir}>
              <View style={[s.kutucuk, astroKat && { backgroundColor: ALTIN, borderColor: ALTIN }]}>{astroKat && <Text style={{ color: '#1A1030', fontSize: 13, lineHeight: 15, fontFamily: yazi.kalin }}>✓</Text>}</View>
              <Text style={s.astroYazi}>Burcumu ve bugünkü gökyüzünü yoruma kat</Text>
            </Pressable>
          )}
          {!!kriz && <Text style={s.kriz}>{kriz}</Text>}
          {!!hata && <Text style={s.hata}>{hata}</Text>}
          <HakBandi durum={durum} girisli={girisli} />
          {hakTamam ? <Dugme yazi={girisli ? 'Desteyi aç' : 'Giriş yap ve desteyi aç'} onPress={desteyiAc} birincil buyuk /> : <SatinKutusu baslik="Okuma hakkın bitti" liste={[{ id: 'kahin_okuma_1', ad: '1 okuma', birincil: true }]} urunler={satin.urunler} neden={satin.neden} yuk={satin.yuk} satin={satin.satinAlTikla} webAc={() => {}} />}
          {!!satin.hata && <Text style={s.hata}>{satin.hata}</Text>}
        </KeyboardAvoidingView>
      )}

      {/* DESTE / DİZİLİM / OKUMA: kartlar (hepsi aynı katmanda; konumları animasyonla değişir) */}
      {faz !== 'giris' && (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: kartKat }]} pointerEvents="box-none">
          {faz === 'deste' && (
            <View style={[s.destePanel, { top: H * 0.455 }]} pointerEvents="none">
              <Text style={s.desteBaslik}>{secilenler.length < n ? `Kalbinin çektiği ${n === 1 ? 'kartı' : 'kartları'} seç` : 'Kartların seçildi'}</Text>
              <Text style={s.desteAlt}>{secilenler.length} / {n}</Text>
            </View>
          )}
          {animler.current.map((k, i) => {
            const sirasi = secilenler.indexOf(i), secili = sirasi >= 0;
            const ok = faz === 'dizilim' || faz === 'okuma' || faz === 'bitti';
            const kartVeri = secili ? kartlar[sirasi] : undefined;
            const acildi = secili && acik.includes(sirasi);
            const flipX = k.ac.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.02, 1] });
            const arkaOp = k.ac.interpolate({ inputRange: [0, 0.499, 0.5, 1], outputRange: [1, 1, 0, 0] });
            const yuzOp = k.ac.interpolate({ inputRange: [0, 0.499, 0.5, 1], outputRange: [0, 0, 1, 1] });
            const rotStr = k.r.interpolate({ inputRange: [-360, 360], outputRange: ['-360deg', '360deg'] });
            const yuvaH = secili && ok ? yuva[sirasi] : null;
                        return (
              <Animated.View key={i} pointerEvents={faz === 'deste' && !secili ? 'auto' : acildi ? 'auto' : 'none'}
                style={{ position: 'absolute', left: -fanW / 2, top: -fanH / 2, width: fanW, height: fanH, zIndex: secili ? 100 + sirasi : i, opacity: k.op, transform: [{ translateX: k.x }, { translateY: k.y }, { rotate: rotStr }, { scale: k.s }] }}>
                <Pressable onPress={() => (faz === 'deste' ? sec(i) : acildi ? zoomAyarla(sirasi) : undefined)} style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel={acildi ? `${kartVeri?.pozisyon}: ${kartVeri?.ad}` : 'Kart'}>
                  <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scaleX: flipX }] }]}>
                    <Image source={KART_ARKA3} contentFit="fill" style={[s.kartYuz, { opacity: 1 }]} />
                    {kartVeri && <Animated.View style={[StyleSheet.absoluteFill, { opacity: yuzOp }]}><Image source={KART_YUZU[kartVeri.id]} contentFit="fill" style={[s.kartYuz, { transform: [{ rotate: kartVeri.ters ? '180deg' : '0deg' }] }]} /></Animated.View>}
                  </Animated.View>
                  {secili && aktifKart === sirasi && <View pointerEvents="none" style={s.parilti} />}
                </Pressable>
              </Animated.View>
            );
          })}
          {/* pozisyon etiketleri (dizilimde, kelt hariç) */}
          {(faz === 'okuma' || faz === 'bitti') && etiketSayisi > 0 && kartlar.map((kv, k) => (
            <Text key={`e${k}`} pointerEvents="none" style={[s.etiket, { left: yuva[k].cx - yuva[k].w / 2 - 6, width: yuva[k].w + 12, top: yuva[k].cy + yuva[k].h / 2 + 3 }]} numberOfLines={1}>{kv.pozisyon}</Text>
          ))}
        </Animated.View>
      )}

      {/* durum bilgisi (dizilim beklerken) */}
      {!!bilgi && <View style={[s.bilgi, { top: H * 0.455 }]} pointerEvents="none"><ActivityIndicator color={ALTIN} /><Text style={s.bilgiYazi}>{bilgi}</Text></View>}

      {/* yazı (altyazı) */}
      {okuyor && yaziAcik && !soruPanel && !!yaziMetin && (
        <View style={[s.yazi, { height: Math.max(86, H - kartAlt - alt - 6), bottom: alt }]} pointerEvents="none">
          <ScrollView ref={yaziKap} scrollEnabled={false} showsVerticalScrollIndicator={false} onContentSizeChange={(_, h) => { yaziBoy.current.icerik = h; }} onLayout={(e) => { yaziBoy.current.gorunen = e.nativeEvent.layout.height; }}>
            <Text style={s.yaziMetin}>{yaziMetin}</Text>
          </ScrollView>
        </View>
      )}

      {/* SORU paneli: 2–3 dokunmalık cevap + isteğe bağlı kendi sözlerin */}
      {soruPanel && (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[s.soruSayfa, { paddingBottom: alt + 10 }]}>
          <Text style={s.soruMetin}>{soruPanel.metin}</Text>
          {soruPanel.secenekler.map((x) => <Pressable key={x} onPress={() => cevapVer(x)} accessibilityRole="button" style={s.cevap}><Text style={s.cevapYazi}>{x}</Text></Pressable>)}
          <View style={s.serbestSatir}>
            <TextInput value={serbest} onChangeText={serbestAyarla} placeholder="Ya da kendi sözlerinle yaz…" placeholderTextColor="rgba(237,233,246,0.45)" maxLength={240} style={s.serbest} onSubmitEditing={() => serbest.trim() && cevapVer(serbest)} returnKeyType="send" accessibilityLabel="Kendi cevabın" />
            <Pressable onPress={() => serbest.trim() && cevapVer(serbest)} disabled={!serbest.trim()} accessibilityRole="button" accessibilityLabel="Gönder" style={[s.gonder, !serbest.trim() && { opacity: 0.4 }]}><Text style={{ color: '#1A1030', fontFamily: yazi.kalin, fontSize: 15 }}>Gönder</Text></Pressable>
          </View>
          <Pressable onPress={() => cevapVer('')} style={{ alignSelf: 'center', padding: 6 }}><Text style={s.atla}>Cevap vermeden devam</Text></Pressable>
        </KeyboardAvoidingView>
      )}

      {/* BİTİŞ */}
      {faz === 'bitti' && (
        <View style={[s.bitis, { paddingBottom: alt + 6 }]}>
          {!!kriz ? <Text style={s.kriz}>{kriz}</Text> : !!ozet && <Text style={s.ozet} numberOfLines={3}>{ozet}</Text>}
          <Text style={s.not}>Kartlara dokun, büyüsün.</Text>
          <Text style={s.not}>{YASAL_IBARE}</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Dugme yazi="Yeni okuma" onPress={yeniOkuma} birincil esit />
            <Dugme yazi="Kapat" onPress={cik} esit />
          </View>
        </View>
      )}

      {/* büyük kart (dokun-büyüt) */}
      {zoom != null && kartlar[zoom] && (
        <Pressable style={[StyleSheet.absoluteFill, s.zoomZemin]} onPress={() => zoomAyarla(null)} accessibilityLabel="Kapat">
          <Image source={KART_YUZU[kartlar[zoom].id]} contentFit="contain" style={{ height: Math.min(H * 0.64, 520), aspectRatio: 1 / ORAN, transform: [{ rotate: kartlar[zoom].ters ? '180deg' : '0deg' }] }} />
          <Text style={s.zoomBaslik}>{kartlar[zoom].pozisyon} · {kartlar[zoom].ad}{kartlar[zoom].ters ? ' (ters)' : ''}</Text>
          <Text style={s.zoomAlt}>{kartlar[zoom].anahtar.join(' · ')}</Text>
        </Pressable>
      )}
    </View>
  );
}

function HakBandi({ durum, girisli }: { durum: C.KahinDurum | null; girisli: boolean }) {
  if (!girisli) return <Text style={s.hak}>Giriş yapınca ilk okuman ücretsiz.</Text>;
  if (!durum) return null;
  if (durum.ucretsiz_var !== false) return <Text style={s.hak}>İlk okuman bizden: ücretsiz.</Text>;
  return <Text style={s.hak}>Kalan okuma hakkın: {durum.hak ?? 0}</Text>;
}

const s = StyleSheet.create({
  kok: { flex: 1 },
  ustBar: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, zIndex: 300 },
  yuvarlak: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(11,6,20,0.55)', borderWidth: 1, borderColor: 'rgba(237,233,246,0.22)', alignItems: 'center', justifyContent: 'center' },
  yuvarlakYazi: { color: YAZI, fontSize: 16, fontFamily: yazi.kalin },
  altSayfa: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 18, paddingTop: 18, backgroundColor: 'rgba(11,6,20,0.80)', borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1, borderColor: 'rgba(242,193,78,0.3)', zIndex: 200 },
  baslik: { fontFamily: yazi.marka, fontSize: 24, color: ALTIN, letterSpacing: 4, textAlign: 'center' },
  altBaslik: { fontFamily: yazi.kalem, fontSize: 22, color: YAZI, textAlign: 'center', marginBottom: 10 },
  acilimIzgara: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  acilim: { width: '48.5%', backgroundColor: 'rgba(30,20,52,0.85)', borderColor: 'rgba(237,233,246,0.14)', borderWidth: 1, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12 },
  acilimSecili: { borderColor: ALTIN, backgroundColor: 'rgba(60,40,96,0.92)' },
  acilimAd: { fontFamily: yazi.kalin, fontSize: 13.5, color: YAZI },
  acilimAlt: { fontFamily: yazi.normal, fontSize: 12, color: SOLUK, marginTop: 1 },
  girdi: { minHeight: 56, maxHeight: 90, marginTop: 10, backgroundColor: 'rgba(30,20,52,0.9)', borderColor: 'rgba(237,233,246,0.18)', borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, color: YAZI, fontFamily: yazi.normal, fontSize: 15, textAlignVertical: 'top' },
  astroSatir: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  kutucuk: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: 'rgba(237,233,246,0.5)', alignItems: 'center', justifyContent: 'center' },
  astroYazi: { fontFamily: yazi.orta, fontSize: 13.5, color: YAZI, flex: 1 },
  hak: { fontFamily: yazi.orta, fontSize: 13.5, color: ALTIN, textAlign: 'center', marginVertical: 8 },
  hata: { fontFamily: yazi.orta, fontSize: 13.5, color: '#FF8FA8', marginTop: 6, textAlign: 'center' },
  kriz: { fontFamily: yazi.normal, fontSize: 14.5, lineHeight: 21, color: YAZI, backgroundColor: 'rgba(143,114,255,0.22)', borderRadius: 14, padding: 12, marginTop: 8 },
  destePanel: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 150 },
  desteBaslik: { fontFamily: yazi.kalem, fontSize: 26, color: YAZI, textShadowColor: '#000', textShadowRadius: 10 },
  desteAlt: { fontFamily: yazi.kalin, fontSize: 16, color: ALTIN, textShadowColor: '#000', textShadowRadius: 8 },
  kartYuz: { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', borderRadius: 7 },
  parilti: { position: 'absolute', left: -3, top: -3, right: -3, bottom: -3, borderRadius: 10, borderWidth: 2.5, borderColor: ALTIN, shadowColor: ALTIN, shadowOpacity: 0.9, shadowRadius: 12, shadowOffset: { width: 0, height: 0 }, elevation: 8 },
  etiket: { position: 'absolute', fontFamily: yazi.orta, fontSize: 11.5, color: 'rgba(237,233,246,0.85)', textAlign: 'center', textShadowColor: '#000', textShadowRadius: 5, zIndex: 20 },
  bilgi: { position: 'absolute', left: 30, right: 30, flexDirection: 'row', gap: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(11,6,20,0.7)', borderRadius: 18, padding: 14, zIndex: 250 },
  bilgiYazi: { fontFamily: yazi.orta, fontSize: 15, color: YAZI },
  yazi: { position: 'absolute', left: 16, right: 16, backgroundColor: 'rgba(11,6,20,0.62)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, overflow: 'hidden', zIndex: 120 },
  yaziMetin: { fontFamily: yazi.normal, fontSize: 14.5, lineHeight: 20, color: YAZI },
  soruSayfa: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 18, paddingTop: 16, backgroundColor: 'rgba(11,6,20,0.9)', borderTopLeftRadius: 26, borderTopRightRadius: 26, borderTopWidth: 1, borderColor: 'rgba(242,193,78,0.4)', zIndex: 260 },
  soruMetin: { fontFamily: yazi.kalem, fontSize: 24, lineHeight: 28, color: ALTIN, marginBottom: 10 },
  cevap: { backgroundColor: 'rgba(60,40,96,0.95)', borderColor: 'rgba(242,193,78,0.5)', borderWidth: 1, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 16, marginBottom: 8 },
  cevapYazi: { fontFamily: yazi.kalin, fontSize: 15.5, color: YAZI },
  serbestSatir: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 2 },
  serbest: { flex: 1, height: 44, backgroundColor: 'rgba(30,20,52,0.95)', borderColor: 'rgba(237,233,246,0.2)', borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, color: YAZI, fontFamily: yazi.normal, fontSize: 14.5 },
  gonder: { height: 44, borderRadius: 14, backgroundColor: ALTIN, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  atla: { fontFamily: yazi.normal, fontSize: 12.5, color: SOLUK, textDecorationLine: 'underline' },
  bitis: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 6, backgroundColor: 'rgba(11,6,20,0.78)', zIndex: 200 },
  ozet: { fontFamily: yazi.kalem, fontSize: 19, lineHeight: 21, color: ALTIN, textAlign: 'center', marginBottom: 3 },
  not: { fontFamily: yazi.normal, fontSize: 10.5, color: SOLUK, textAlign: 'center', marginBottom: 5 },
  zoomZemin: { backgroundColor: 'rgba(5,3,10,0.93)', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 400 },
  zoomBaslik: { fontFamily: yazi.kalin, fontSize: 18, color: ALTIN, marginTop: 14, textAlign: 'center' },
  zoomAlt: { fontFamily: yazi.normal, fontSize: 13.5, color: SOLUK, marginTop: 5, textAlign: 'center' },
});
