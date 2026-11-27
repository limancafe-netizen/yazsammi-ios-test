// "Yazsam mı? Canlı" (plan/16): canlı akış. 08.10 "Balon Rıhtımı": telefonda üst çubuk + HER ekranda altta yüzen rıhtım
// (Canlı · Sohbet · Yaz · Yankı · Ben); bilgisayarda sol rıhtım, ekrana yayılan çok sütunlu akış, sağda canlı panel.
// Adres: ?yaz=1 paylaşım sayfasını, ?ben=1 kendi profilini açar (alt sayfalardaki rıhtımdan gelir).
// Geliştirme: /canli?mock=1 (sunucusuz örnek veri), ?tema=gece|gunduz.
import { kasmaOlcerKur } from '@/kasmaOlcer';
import { SiteBolumu } from '@/bilesenler/canli/SiteBolumu';
import { startTransition, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useTema } from '@/tema/TemaSaglayici';
import { olay } from '@/analiz';
import { useGenis } from '@/bilesenler/Genis';
import * as C from '@/canli';
import { CanliSaglayici, useCanli } from '@/bilesenler/canli/baglam';
import { KAHIN_ACIK, useRenk } from '@/bilesenler/canli/ortak';
import { Akis, type AkisTutamak } from '@/bilesenler/canli/Akis';
import { acikYoklamaKur } from '@/bilesenler/canli/yoklama';
import { KazanmaAni } from '@/bilesenler/canli/rozetler';
import { AltSekmeler, SagSutun, SolMenu, SOL_KENAR, TelefonUst, useYog } from '@/bilesenler/canli/Duzen';
import { TelefonAsistanYeri, TelefonGorevKarti } from '@/bilesenler/canli/SagKose';
import { UygulamaIndir } from '@/bilesenler/canli/UygulamaIndir';
import { FigurKose, YuzenFigur } from '@/bilesenler/canli/FigurYuzen';
import { Ayarlar, Detay, ikincilleriOnYukle, MesajPencereleri, Mesajlar, Pencereler, Profil, Sohbet, TribunKoseYazisi, TribunMacDetay, TribunOdaEkrani, TribunPortal, TribunTakvim, Zil } from '@/bilesenler/canli/tembel'; // web'de ayrı parçalar (tembel.web.tsx)
import { TribunSerit } from '@/bilesenler/canli/TribunSerit';
import { GeriTusu } from '@/bilesenler/canli/GeriTusu';
import { useGorunenAlan, useKlavye } from '@/bilesenler/canli/klavye';
import { eskiBildirimleriTemizle } from '@/bildirim';
import { BildirimKopru } from '@/bildirim/BildirimKopru';

export default function Canli() {
  const { secimDegistir } = useTema();
  useEffect(() => {
    if (Platform.OS !== 'web') {
      eskiBildirimleriTemizle(); // eski sürümün kurduğu "Günün Cümlesi / Balon Avı" hatırlatmaları
      kasmaOlcerKur(); // 18.11: kasma sayacı uygulamada hiç kurulmuyordu (çağrı yalnız web dalındaydı ve kasmaOlcerKur web'de çıkar)
    }
  }, []);
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    document.title = 'Yazsam mı? Canlı';
    const t = new URLSearchParams(window.location.search).get('tema');
    if (t === 'gece' || t === 'gunduz') secimDegistir(t);
    olay('canli_acilis');
  }, []);
  // 06.11 hız işi (web): sahnenin ilk çizimi tek uzun görevde yapılıyordu (yavaş telefonda 1 sn+ donma, seçim ekranı takılıyordu).
  // Sağlayıcı (veri çekme) hemen başlar; sahne ilk boyamadan sonra bir "geçiş" olarak çizilir → React işi 5 ms'lik dilimlere bölüp girdiyi bekletmez.
  // Uygulamada (Android/iOS) davranış aynı kalır: hemen çizilir.
  const [sahneHazir, setSahneHazir] = useState(Platform.OS !== 'web');
  useEffect(() => {
    if (!sahneHazir) startTransition(() => setSahneHazir(true));
    else ikincilleriOnYukle();
  }, [sahneHazir]);
  return (
    <CanliSaglayici>
      {sahneHazir && <Sahne />}
      {sahneHazir && <GeriTusu />}
      {sahneHazir && <Pencereler />}
      {sahneHazir && <KazanmaAni />}
      {sahneHazir && <MesajPencereleri />}
      {sahneHazir && <BildirimKopru />}
    </CanliSaglayici>
  );
}

function Sahne() {
  const R = useRenk();
  const c = useCanli();
  const genis = useGenis();
  const { width, height } = useWindowDimensions();
  const alan = useGorunenAlan(); // sitede klavye açıkken görünen alan (iPhone dahil)
  const klavye = useKlavye();
  // Klavye açılıp alan küçülünce odaktaki yazı alanı görünür kalsın (pencere içindeki alanlar dahil).
  useEffect(() => {
    if (Platform.OS !== 'web' || !klavye) return;
    const k = requestAnimationFrame(() => (document.activeElement as HTMLElement | null)?.scrollIntoView?.({ block: 'nearest' }));
    return () => cancelAnimationFrame(k);
  }, [alan.h, klavye]);
  const akis = useRef<AkisTutamak>(null);
  const [anketId, anketIdAyarla] = useState<string | null>(null);
  const e = c.ekran;
  // 19.11 (web): sekme başlığı ekranı izler (Yankı, Sohbet, gönderi, profil); diğer ekranlarda eski "Yazsam mı? Canlı".
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const ad = e.tur === 'zil' ? 'Yankı' : e.tur === 'mesajlar' || e.tur === 'sohbet' ? 'Sohbet' : e.tur === 'gonderi' ? 'Gönderi' : e.tur === 'profil' ? e.ad : e.tur === 'ayarlar' ? 'Ayarlar' : e.tur === 'ekonomi' ? 'Ekonomi' : e.tur === 'astroloji' ? 'Astroloji' : e.tur === 'kahin' ? 'Kahin' : e.tur.startsWith('tribun') ? 'Tribün' : '';
    document.title = ad ? `${ad} · Yazsam mı?` : 'Yazsam mı? Canlı';
  }, [e]);

  // Alt sayfalardaki rıhtımdan gelen istek: ?yaz=1 → paylaşım sayfası, ?ben=1 → kendi balonun (girişsizse giriş).
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const a = new URLSearchParams(window.location.search);
    const yaz = a.get('yaz'), ben = a.get('ben');
    if (!yaz && !ben) return;
    a.delete('yaz');
    a.delete('ben');
    window.history.replaceState(window.history.state, '', `${window.location.pathname}${a.toString() ? `?${a}` : ''}`);
    if (yaz) setTimeout(c.yaziciAc, 300);
    else if (c.uye && !c.uye.yeni) c.git({ tur: 'profil', ad: c.uye.ad });
    else c.girisIste('Balonunu görmek için giriş yap', () => {});
  }, []);

  // Telefon boyu tarayıcıda Ekonomi, Astroloji ve Tarot ekranı yok: ?ekonomi=1 / ?astroloji=1 / ?kahin=1 adresi açılırsa sitenin kendi sayfasına gider.
  // (Telefon uygulamasında Astroloji ve Tarot Kart Analizi uygulamanın içinde açılır: SiteBolumu.native.tsx.)
  useEffect(() => {
    if (!genis && e.tur === 'ekonomi' && Platform.OS === 'web') window.location.replace('/ekonomi/');
    if (!genis && e.tur === 'astroloji' && Platform.OS === 'web') window.location.replace(`/astroloji/${e.yol ?? ''}`);
    if (!genis && e.tur === 'kahin' && KAHIN_ACIK && Platform.OS === 'web') window.location.replace('/tarot/');
  }, [genis, e.tur]);

  // Okunmamış bildirim sayısı (girişliyken dakikada bir).
  const girisli = !!c.uye && !c.uye.yeni;
  // Açılışta üyelik bilgisini tazele (kurucu işareti vb.).
  // 19.11: takma adsız eski oturum da sunucuya sorulur (birleştirilmiş kabuk oturumu ASIL hesaba çözülür; yoksa değişmez).
  const yarimOturum = !!c.uye && c.uye.yeni && C.oturumVar();
  useEffect(() => {
    if (!girisli && !yarimOturum) return;
    C.benGetir().then((u) => u && !u.yeni && c.uyeAyarla(u));
  }, [girisli, yarimOturum]);
  useEffect(() => {
    if (!girisli) {
      // Çıkış / hesap silme sonrası iki rozet de sıfırlanır (07.10: Mesajlar rozeti eski sayıda kalıyordu).
      c.zilSayiAyarla(0);
      c.mesajSayiAyarla(0);
      return;
    }
    const bak = () => C.zilGetir().then((r) => r.ok && c.zilSayiAyarla(r.veri.okunmamis));
    bak();
    return acikYoklamaKur(bak, 60000); // arka planda / gizli sekmede durur, öne gelince hemen bir kez yoklar (18.11 kasma)
  }, [girisli]);

  const akisaDon = () => {
    if (e.tur !== 'akis') c.git({ tur: 'akis' });
    else akis.current?.basaDon();
  };
  // Bilgisayar ölçüleri (sol rıhtım, sağ panel, akış sütun sayısı).
  const kisa = height < 820;
  const yog = useYog();
  const kenar = SOL_KENAR[yog];
  const anket = anketId ? c.harita[anketId] ?? null : null;
  const solG = Math.max(232, Math.min(276, width * 0.155)) + 18;
  // Köşe yazısından geri: Tribün'den geldiyse tarayıcı geçmişinde bir adım geri (Tribün'ün sekmesi/kaydırması korunur); doğrudan adresle ya da uygulamada geldiyse Tribün'e gider (akışa değil).
  const koseGeri = () => {
    const web = Platform.OS === 'web' && typeof window !== 'undefined';
    if (web && !genis && Number(window.history.state?.canli) > 0) c.geri();
    else c.git({ tur: 'tribun' });
  };
  const tribunEkrani = e.tur === 'tribun' || e.tur === 'tribunTakvim' || e.tur === 'tribunMac' || e.tur === 'tribunDetay' || e.tur === 'tribunKose';
  const gomulu = e.tur === 'ekonomi' || e.tur === 'astroloji' || e.tur === 'kahin'; // bilgisayarda Canlı'nın içinde sitenin sayfası (iframe); sağ panel yok (Tribün gibi)
  // 04.11: Astroloji ve Tarot Kart Analizi: telefon uygulamasında WebView ekranı, bilgisayarda iframe (SiteBolumu). Eski KAHİN ekranı (src/kahin/Bolum.tsx) kullanılmıyor.
  const siteEkrani = Platform.OS !== 'web' || genis;
  const sagVar = width >= 1180 && e.tur !== 'profil' && !tribunEkrani && !gomulu;
  const sagG = width < 1360 ? 300 : 338; // 1280'de kartlar iki sütuna rahat sığsın
  const ortaG = width - solG - (sagVar ? sagG : 18);
  const sutun = Math.max(2, Math.min(3, Math.floor((ortaG - 44 + 16) / (300 + 16))));
  const ikinci =
    e.tur === 'gonderi' ? <Detay key={e.id} id={e.id} yaz={e.yaz} /> : e.tur === 'zil' ? <Zil geri={genis ? undefined : c.geri} /> : e.tur === 'profil' ? <Profil key={e.ad} ad={e.ad} geri={c.geri} /> : e.tur === 'mesajlar' ? <Mesajlar geri={genis ? undefined : c.geri} sekme={e.sekme} /> : e.tur === 'sohbet' ? <Sohbet key={e.id} id={e.id} geri={c.geri} /> : e.tur === 'ayarlar' ? <Ayarlar geri={c.geri} /> : e.tur === 'tribun' ? <TribunPortal /> : e.tur === 'tribunTakvim' ? <TribunTakvim geri={Platform.OS === 'web' && !genis ? c.geri : () => c.git({ tur: 'tribun' })} /> : e.tur === 'tribunMac' ? <TribunOdaEkrani key={e.id} id={e.id} geri={genis ? () => c.git({ tur: 'tribun' }) : c.geri} /> : e.tur === 'tribunDetay' ? <TribunMacDetay key={`${e.lig}:${e.id}`} lig={e.lig} id={e.id} geri={genis ? () => c.git({ tur: 'tribun' }) : c.geri} /> : e.tur === 'tribunKose' ? <TribunKoseYazisi key={e.id} id={e.id} geri={koseGeri} /> : e.tur === 'ekonomi' && Platform.OS !== 'web' ? <SiteBolumu bolum="ekonomi" /> : e.tur === 'oyun' && Platform.OS !== 'web' ? <SiteBolumu bolum="oyun" /> : e.tur === 'ekonomi' && genis ? <EkonomiGomulu /> : e.tur === 'astroloji' && siteEkrani ? <SiteBolumu key={`astroloji${e.yol ?? ''}`} bolum="astroloji" yol={e.yol} /> : e.tur === 'kahin' && KAHIN_ACIK && siteEkrani ? <SiteBolumu bolum="tarot" /> : null;
  const akisGorunumu = (
    <View style={[{ flex: 1 }, e.tur !== 'akis' && { display: 'none' }]}>
      <TribunSerit />
      {!sagVar && <TelefonAsistanYeri />}
      <Akis ref={akis} sutun={genis ? sutun : 1} anketBul={(g) => anketIdAyarla(g?.id ?? null)} once={!sagVar && Platform.OS === 'web' ? <><TelefonGorevKarti akisaDon={akisaDon} />{!genis && <UygulamaIndir sik />}</> : undefined} />
    </View>
  );

  if (!genis) {
    // 08.10 klavye: yazma alanı ve Gönder her zaman klavyenin üstünde. Sitede sahne görünen alana oturur (Android'de sayfa zaten
    // küçülür; iPhone'da görünen alan yüksekliği + tarayıcının yukarı ittiği pay kadar aşağı alınır, üst çubuk kaybolmaz).
    // Uygulamada KeyboardAvoidingView (Android uçtan uca ekranda pencere kendiliğinden küçülmez). Klavye açıkken alt sekmeler gizlenir.
    const icerik = (
      <>
        {e.tur === 'akis' && <TelefonUst akisaDon={akisaDon} />}
        <View style={{ flex: 1 }}>
          {akisGorunumu}
          {ikinci}
          {/* 1.7.3: uygulamada canlı asistan figürü (Fener gece, Bukalemun gündüz); web'de sitenin kendi asistanı var */}
          {Platform.OS !== 'web' && e.tur === 'akis' && !klavye && <YuzenFigur />}
          {Platform.OS !== 'web' && (e.tur === 'tribun' || e.tur === 'ekonomi' || e.tur === 'astroloji' || e.tur === 'kahin') && <FigurKose ekran={e.tur} />}
        </View>
        {/* Astroloji / Tarot: sayfanın kendi alt menüsü var, uygulamanın alt sekmeleri gizli (iki alt menü üst üste binmesin) */}
        {!klavye && e.tur !== 'kahin' && e.tur !== 'astroloji' && e.tur !== 'ekonomi' && e.tur !== 'oyun' && !tribunEkrani && <AltSekmeler akisaDon={akisaDon} />}
      </>
    );
    if (Platform.OS !== 'web')
      return (
        <KeyboardAvoidingView behavior="padding" style={[s.telefon, { backgroundColor: R.panel }]}>
          {icerik}
        </KeyboardAvoidingView>
      );
    return <View style={[s.telefon, { backgroundColor: R.panel, height: alan.h, transform: alan.y ? [{ translateY: alan.y }] : undefined }]}>{icerik}</View>;
  }

  // Bilgisayar (08.10): sol rıhtım + ekrana yayılan orta alan + sağ canlı panel (profilde panel yok, profil geniş düzene geçer).
  // Tribün (27.10): ana sayfa ve alt sayfalar 1240 px panel. Maç ve köşe yazısı okunabilirlik için 720 px ortalı kalır.
  const tekSutun = e.tur === 'akis' || gomulu ? null : e.tur === 'profil' ? 1180 : tribunEkrani && e.tur !== 'tribunTakvim' ? TRIBUN_GENIS : e.tur === 'tribunTakvim' ? 900 : 760;
  return (
    <View style={[s.masa, { backgroundColor: R.sis, height }, Platform.OS === 'web' && ({ height: '100dvh', overflow: 'hidden' } as any)]}>
      <SolMenu akisaDon={akisaDon} />
      <View style={[s.orta, tekSutun || gomulu ? { paddingVertical: kenar, paddingHorizontal: 18 } : null]}>
        {gomulu ? (
          <View style={s.ekonomiKap}>
            {akisGorunumu}
            {ikinci}
          </View>
        ) : tekSutun ? (
          <View style={[s.ortaKutu, { maxWidth: tekSutun, backgroundColor: R.panel, borderColor: R.ince }]}>
            {akisGorunumu}
            {ikinci}
          </View>
        ) : (
          <>
            {akisGorunumu}
            {ikinci}
          </>
        )}
      </View>
      {sagVar && <SagSutun anket={anket} kisa={kisa} genislik={sagG} akisaDon={akisaDon} />}
    </View>
  );
}

// Tribün (27.10): bilgisayarda ana sayfa ve alt sayfaların paneli (içerik yayılır; alt sayfa yazıları kendi içinde ortalı kalır).
const TRIBUN_GENIS = 1800;

// Ekonomi (27.10): bilgisayarda Canlı'nın ortasında sitenin /ekonomi/ sayfası (?gomulu=1: sayfa kendi üst geri düğmesini gizler).
// Tema: ana uygulamanın seçimi (gece | gunduz | otomatik) yüklenince ve her değişince iframe'e postMessage ile gider
// (storage olayı aynı sekmede gelmediği için).
function EkonomiGomulu() {
  const { secim } = useTema();
  const ref = useRef<HTMLIFrameElement>(null);
  const temaGonder = () => {
    ref.current?.contentWindow?.postMessage({ tur: 'tema', deger: secim }, window.location.origin);
  };
  useEffect(() => {
    if (Platform.OS === 'web') temaGonder();
  }, [secim]);
  if (Platform.OS !== 'web') return null;
  return <iframe ref={ref} src="/ekonomi/?gomulu=1" title="Ekonomi" onLoad={temaGonder} style={{ flex: 1, minHeight: 0, width: '100%', border: 'none', borderRadius: 28, display: 'block' }} />;
}

// Astroloji ve Tarot Kart Analizi: bilesenler/canli/SiteBolumu(.native).tsx. Sayfalar her zaman gece gökyüzü (koyu); tema mesajı gerekmez.
// Doğum bilgisi, okumalar ve hak sayısı sayfanın kendi localStorage'ında (yazsammi.com kökeni) kalır.

const s = StyleSheet.create({
  // Ekonomi / Astroloji: 1800 px'e kadar, ortalı, tam yükseklik (orta sütun)
  ekonomiKap: { flex: 1, minHeight: 0, width: '100%', maxWidth: 1800, alignSelf: 'center' },
  telefon: { flex: 1, width: '100%', maxWidth: 640, alignSelf: 'center' },
  masa: { flex: 1, width: '100%', flexDirection: 'row' },
  orta: { flex: 1, minWidth: 0, alignItems: 'stretch' },
  ortaKutu: { flex: 1, width: '100%', alignSelf: 'center', borderWidth: 1, borderRadius: 28, overflow: 'hidden' },
});
