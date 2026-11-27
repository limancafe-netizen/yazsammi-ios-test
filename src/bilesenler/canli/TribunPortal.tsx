// Tribün giriş ekranı (spor portalı, Onur 24.10 tasarımı): koyu stadyum teması, her sekme tek telefon ekranına sığar.
// Üst: TRİBÜN + Futbol/Basketbol seçici + arama · yatay canlı/bugün skor şeridi · sekmeler Gündem · Maçlar · Lig · Transfer · Video.
// Veri tek uçtan gelir (canli.ts tribunPortal → sunucu GET /c/tribun/portal?spor=); 60 sn'de bir sessizce yenilenir (sekme görünürken).
// Takım logoları yalnız takımı tanıtmak için küçük boyda gösterilir; yüklenemezse kısaltmalı yuvarlak yer tutucu çıkar.
// Video: webde YouTube'un resmî gömme oynatıcısı (youtube-nocookie) uygulama içi pencerede, yerel uygulamada YouTube bağlantısı. İndirme yok.
// Maç odaları takvimi (TribunTakvim) Maçlar sekmesinin altındaki "Maç odaları" bağlantısından açılır.
import { createContext, createElement, useCallback, useContext, useEffect, useRef, useState, type ReactNode, type ReactElement } from 'react';
import { ActivityIndicator, AppState, Image, Linking, Platform, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { yazi } from '@/tema/tema';
import * as C from '@/canli';
import type { KoseYazar, PortalHaber, PortalLig, PortalMac, PortalSpor, PortalTakim, PortalTransfer, PortalVideo, TribunKoseVeri, TribunPortalVeri } from '@/canli';
import { Bas, Ikon, Pencere, disariAc } from './ortak';
import { useCanli } from './baglam';
import { izleAdresi, kapakAdresi } from './youtubeOrtak';
import { buyukHarf } from './buyukHarf';
import { useGenis } from '@/bilesenler/Genis';

// ---- renkler (tasarımdaki koyu stadyum paleti) ----
export const K = {
  zemin: '#07090D', kart: '#10151C', cizgi: '#1C232E', cizgi2: '#232B36', ince: '#161C25',
  vurgu: '#C6F432', canli: '#FF3B30', canliAcik: '#FF5A4F', yazi: '#F2F4F7', orta: '#C9D1DB', soluk: '#8A94A3',
  yesil: '#3DDC97', sari: '#FFB020', gri: '#5B6573', mavi: '#7CB8FF', turuncu: '#FF9F43', mor: '#B48CFF',
} as const;
const MAKS_GENISLIK = 720;
const MAKS_GENISLIK_GENIS = 1800; // 27.10: bilgisayarda (≥1000 px) içerik alanına yayılır; telefonda 720 kalır
const KIMLIK = /^[A-Za-z0-9_-]{11}$/;
const AY = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const SEKMELER = [['gundem', 'Gündem'], ['maclar', 'Maçlar'], ['lig', 'Lig'], ['transfer', 'Transfer'], ['video', 'Video']] as const;
type Sekme = (typeof SEKMELER)[number][0];
type TransferDurum = PortalTransfer['durum'];
const DURUM: Record<TransferDurum, { ad: string; yazi: string; zemin: string }> = {
  resmi: { ad: 'RESMÎ', yazi: K.yesil, zemin: 'rgba(61,220,151,.15)' },
  gorusme: { ad: 'GÖRÜŞME', yazi: K.sari, zemin: 'rgba(255,176,32,.15)' },
  iddia: { ad: 'İDDİA', yazi: K.orta, zemin: 'rgba(138,148,163,.18)' },
};
const ETIKET_RENK: Record<string, string> = { 'SÜPER LİG': K.vurgu, TRANSFER: K.sari, BASKETBOL: K.turuncu, AVRUPA: K.mavi, VOLEYBOL: K.mor };

// ---- küçük yardımcılar ----
const buyuk = buyukHarf; // 04.11 (E-05): Latin adlar (Liverpool, Coinbase) tr kuralıyla "LİVERPOOL" olmasın
const sade = (s: string) => s.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i'); // "besiktas" yazılınca "Beşiktaş" bulunur
const gunKisa = (tarih: string) => {
  const p = tarih.split('-');
  const ay = Number(p[1]);
  return p.length === 3 && ay >= 1 && ay <= 12 ? `${Number(p[2])} ${AY[ay - 1]}` : tarih;
};
const skorBol = (skor: string | null): [string, string] => {
  const p = (skor ?? '').split(/\s*[-–]\s*/);
  return p.length === 2 ? [p[0], p[1]] : ['', ''];
};
const sayiYaz = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
const gorunuyor = () => (Platform.OS === 'web' ? typeof document === 'undefined' || document.visibilityState !== 'hidden' : AppState.currentState === 'active');
// 03.11: telefonda liste aşağı kaydırılınca skor şeridi gizlenir, yukarı kaydırınca geri gelir (içerik alanı büyür). Listeler onScroll'u bu bağlamdan alır.
const KaydirBaglam = createContext<((e: NativeSyntheticEvent<NativeScrollEvent>) => void) | null>(null);
const useKaydir = () => useContext(KaydirBaglam) ?? undefined;
const LISTE_ALT = 96; // listelerin sonunda sağ alttaki figür (Fener) son satırı örtmesin diye bırakılan boşluk

// ---- küçük parçalar ----
// Takım logosu (küçük). Adres yoksa ya da yüklenemezse takım kısaltmalı yuvarlak yer tutucu.
export function Logo({ t, boyut }: { t: PortalTakim; boyut: number }) {
  const [hata, hataAyarla] = useState(false);
  useEffect(() => hataAyarla(false), [t.logo]);
  if (t.logo && !hata) return <Image source={{ uri: t.logo }} resizeMode="contain" onError={() => hataAyarla(true)} accessibilityIgnoresInvertColors style={{ width: boyut, height: boyut }} />;
  return (
    <View style={{ width: boyut, height: boyut, borderRadius: boyut / 2, backgroundColor: K.cizgi2, alignItems: 'center', justifyContent: 'center' }}>
      <Text numberOfLines={1} style={{ fontFamily: yazi.dar, fontSize: Math.max(7, Math.round(boyut * 0.42)), color: K.orta }}>{t.kisa.slice(0, 3)}</Text>
    </View>
  );
}

// Seçilebilir hap (filtre, lig çipi, gün): görünen hap küçük, dokunma alanı en az 44 px.
function Cip({ ad, secili, onPress, renk, secilirenk, etiket, zemin, genislik }: { ad: string; secili?: boolean; onPress: () => void; renk?: string; secilirenk?: string; etiket?: string; zemin?: string; genislik?: number }) {
  return (
    <Bas onPress={onPress} etiket={etiket ?? ad} secili={!!secili} style={[s.cipDis, genislik ? { width: genislik } : null]}>
      <View style={[s.cip, { backgroundColor: secili ? secilirenk ?? K.yazi : zemin ?? K.kart, borderColor: secili ? secilirenk ?? K.yazi : K.cizgi2 }]}>
        <Text style={[s.cipYazi, { color: secili ? (secilirenk ? '#fff' : K.zemin) : renk ?? K.orta }]} numberOfLines={1}>{ad}</Text>
      </View>
    </Bas>
  );
}

function Bos({ yazi: y }: { yazi: string }) {
  return (
    <View style={s.bos}>
      <Text style={s.bosYazi}>{y}</Text>
    </View>
  );
}

function Kutu({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[s.kart, style]}>{children}</View>;
}

function AramaSimgesi({ renk }: { renk: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" accessibilityElementsHidden>
      <Circle cx={11} cy={11} r={7} stroke={renk} strokeWidth={2} />
      <Path d="M20 20l-3.5-3.5" stroke={renk} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

// Geri düğmesi (27.10, Onur): 40×40 kutu, köşe 12, Tribün kart zemini, ince kenar, yazısız 20 px ok. Dokunma alanı 44 px.
// Ekonomi ve Oyun'daki aynı görünüm; Tribün her zaman koyu olduğu için kenar sabit rgba(255,255,255,.08).
export function TribunGeri({ onPress, etiket }: { onPress: () => void; etiket: string }) {
  return (
    <Bas onPress={onPress} etiket={etiket} style={s.geriDis}>
      <View style={s.geriKutu}>
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" accessibilityElementsHidden>
          <Path d="M15 5l-7 7 7 7" stroke={K.yazi} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </View>
    </Bas>
  );
}

// Maç odasına ya da takvime gidip dönünce kaldığın yerden devam: seçili spor/sekme/gün/lig ve son veri bellekte kalır (uygulama kapanınca sıfırlanır); veri sessizce tazelenir.
export const SON: { spor: PortalSpor; sekme: Sekme; gun: string | null; lig: string | null; veri: TribunPortalVeri | null } = { spor: 'futbol', sekme: 'gundem', gun: null, lig: null, veri: null };

// ================================================================ ekran ================================================================
export function TribunPortal() {
  const c = useCanli();
  const { height } = useWindowDimensions();
  const ust = useSafeAreaInsets().top;
  const pay = Platform.OS === 'web' ? 0 : ust; // telefon uygulamasında durum çubuğunun altı
  const genis = useGenis();
  const [spor, sporAyarla] = useState<PortalSpor>(SON.spor);
  const [sekme, sekmeAyarlaHam] = useState<Sekme>(SON.sekme);
  const [veri, veriAyarla] = useState<TribunPortalVeri | null>(() => (SON.veri?.spor === SON.spor ? SON.veri : null));
  const [durum, durumAyarla] = useState<'yukleniyor' | 'hata' | 'tamam'>(veri ? 'tamam' : 'yukleniyor');
  const [aramaAcik, aramaAcikAyarla] = useState(false);
  const [q, qAyarla] = useState('');
  // sekme içi seçimler
  const [tumHaber, tumHaberAyarla] = useState(false);
  const [mansetNo, mansetNoAyarla] = useState(0);
  const [gunTarih, gunTarihAyarla] = useState<string | null>(SON.gun);
  const [yalnizCanli, yalnizCanliAyarla] = useState(false);
  const [ligKod, ligKodAyarla] = useState<string | null>(SON.lig);
  const [ligGorunum, ligGorunumAyarla] = useState<'puan' | 'kral'>('puan');
  const [transferSuz, transferSuzAyarla] = useState<TransferDurum | null>(null);
  const [seritGizli, seritGizliAyarla] = useState(false);
  const kaydirCapa = useRef(0);
  const [oynayan, oynayanAyarla] = useState<PortalVideo | null>(null);
  const kose = useKose();
  const acikVideo = useRef(false);
  acikVideo.current = !!oynayan;
  SON.spor = spor; SON.sekme = sekme; SON.gun = gunTarih; SON.lig = ligKod; SON.veri = veri;
  // 24.10 (Onur: "Tribünde geri yapıldı mı Tribün'e atılsın, akışa değil"): sekme ve video, tarayıcı geçmişine Tribün içinde kayıt düşer.
  // Gündem dışı bir sekme ve açık video birer geçmiş adımıdır; geri tuşu önce videoyu kapatır, sonra Gündem'e döner, en son akışa çıkar.
  // Adres değişmez (?tribun=1 kalır); geçmiş kaydına yalnız tsekme/tvideo eklenir, canli sayacı korunur (baglam.tsx popstate).
  const gecmisDurum = () => (Platform.OS === 'web' && typeof window !== 'undefined' ? (window.history.state ?? {}) : {});
  const sekmeAyarla = useCallback((k: Sekme) => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') { sekmeAyarlaHam(k); return; }
    const d = gecmisDurum();
    if (k === 'gundem') { if (d.tsekme) window.history.back(); else sekmeAyarlaHam(k); return; }
    if (d.tsekme) window.history.replaceState({ ...d, tsekme: k }, '');
    else window.history.pushState({ ...d, tsekme: k }, '');
    sekmeAyarlaHam(k);
  }, []);
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const f = () => {
      const d = gecmisDurum();
      // 28.10 (Onur: video X ile kapanınca Gündem'e atıyor): video açıkken geri/X yalnız videoyu kapatır, sekme (Video) ve kaydırma yerinde kalır.
      // Yönlendirme kütüphanesi geri gelinen kaydın durumunu ({ id }) sıfırlayıp tsekme'yi silebiliyor; o yüzden "tsekme yok = Gündem" yalnız video kapanışı değilken geçerli.
      if (!d.tvideo && acikVideo.current) {
        acikVideo.current = false;
        oynayanAyarla(null);
        window.history.replaceState({ ...d, tsekme: SON.sekme }, '');
        return;
      }
      if (!d.tvideo) oynayanAyarla(null);
      sekmeAyarlaHam(d.tsekme ?? 'gundem');
    };
    window.addEventListener('popstate', f);
    return () => window.removeEventListener('popstate', f);
  }, []);
  const videoKapat = useCallback(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && gecmisDurum().tvideo) window.history.back();
    else oynayanAyarla(null);
  }, []);
  // Tribün'e Gündem dışı bir sekmeyle girildiyse (son seçim hatırlanır) geri tuşu önce Gündem'e dönsün.
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && sekme !== 'gundem' && !gecmisDurum().tsekme) window.history.pushState({ ...gecmisDurum(), tsekme: sekme }, '');
  }, []);
  const sonOynayan = useRef<PortalVideo | null>(null);
  if (oynayan) sonOynayan.current = oynayan; // pencere kapanırken başlık birden kaybolmasın

  // Veri: spor değişince baştan, sonra 60 sn'de bir sessizce (ekran görünürken). Eski cevap yenisini ezmesin diye istek sayacı.
  const istekNo = useRef(0);
  const yukle = useCallback((sessiz: boolean) => {
    const no = ++istekNo.current;
    if (!sessiz) durumAyarla('yukleniyor');
    C.tribunPortal(spor).then((r) => {
      if (no !== istekNo.current) return;
      if (r.ok) {
        veriAyarla(r.veri);
        durumAyarla('tamam');
      } else if (!sessiz) durumAyarla('hata');
    });
  }, [spor]);
  useEffect(() => {
    if (veri?.spor !== spor) veriAyarla(null); // aynı sporun eski verisi varsa göster, arkadan tazele
    yukle(!!veri && veri.spor === spor);
    const t = setInterval(() => gorunuyor() && yukle(true), 60000);
    return () => {
      clearInterval(t);
      istekNo.current++;
    };
  }, [spor]);

  const sporSec = (x: PortalSpor) => {
    if (x === spor) return;
    sporAyarla(x);
    gunTarihAyarla(null);
    ligKodAyarla(null);
    transferSuzAyarla(null);
    mansetNoAyarla(0);
    tumHaberAyarla(false);
    yalnizCanliAyarla(false);
    sekmeAyarla('gundem'); // 04.11 (E-12): Basketbol/Futbol değişince önceki sporun son sekmesi (ör. Video) açık kalıyordu; yeni spor Gündem'den açılır
  };
  const qn = sade(q.trim());
  const eslesir = (...metinler: string[]) => !qn || metinler.some((m) => sade(m).includes(qn));
  const ligeGit = (kod?: string) => {
    if (kod && veri?.lig.some((l) => l.kod === kod)) ligKodAyarla(kod);
    ligGorunumAyarla('puan');
    sekmeAyarla('lig');
  };
  const videoAc = (v: PortalVideo) => {
    if (!KIMLIK.test(v.youtubeId)) return;
    if (Platform.OS === 'web') { if (!gecmisDurum().tvideo) window.history.pushState({ ...gecmisDurum(), tvideo: 1 }, ''); oynayanAyarla(v); }
    else Linking.openURL(izleAdresi(v.youtubeId)).catch(() => {});
  };
  // Her maç satırı ve şerit maç ekranını açar (lig kodu: gün listesindeki lig; şeritteki maçta kimlikten bulunur). Kod bulunamazsa oda varsa oda açılır.
  const macAc = (m: PortalMac, kod?: string) => {
    const k = kod ?? veri?.gunler.flatMap((g) => g.ligler).find((l) => l.maclar.some((x) => x.id === m.id))?.kod;
    if (k) c.git({ tur: 'tribunDetay', lig: k, id: m.id });
    else if (m.odaId) c.git({ tur: 'tribunMac', id: m.odaId });
  };

  // 03.11: basketbolda transfer haberi yoksa Transfer sekmesi gizlenir (boş sekme göstermesin)
  const transferGizli = !!veri && veri.spor === 'basket' && veri.transfer.length === 0;
  const sekmeler = SEKMELER.filter(([k]) => !(k === 'transfer' && transferGizli));
  const aktifSekme: Sekme = sekmeler.some(([k]) => k === sekme) ? sekme : 'gundem';
  useEffect(() => { seritGizliAyarla(false); kaydirCapa.current = 0; }, [aktifSekme, spor]);
  const gizliRef = useRef(false);
  gizliRef.current = seritGizli;
  const kaydirOlay = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (genis) return;
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const y = contentOffset.y;
    if (y <= 4) { kaydirCapa.current = y; if (gizliRef.current) seritGizliAyarla(false); return; }
    if (contentSize.height - layoutMeasurement.height < 90) return; // kısa listede şerit yerinde kalır (gizlenince alan 58 px büyür; yine de kayacak kadar içerik olmalı)
    if (!gizliRef.current) {
      if (y < kaydirCapa.current) kaydirCapa.current = y;
      else if (y > 60 && y - kaydirCapa.current > 28) { seritGizliAyarla(true); kaydirCapa.current = y; }
    } else if (y > kaydirCapa.current) kaydirCapa.current = y;
    else if (kaydirCapa.current - y > 28) { seritGizliAyarla(false); kaydirCapa.current = y; }
  }, [genis]);

  let icerik: ReactNode;
  if (!veri) {
    icerik =
      durum === 'hata' ? (
        <View style={s.merkez}>
          <Bas onPress={() => yukle(false)} etiket="Bağlantı sorunu, tekrar dene" style={s.tekrar}>
            <Text style={s.tekrarYazi}>Bağlantı sorunu, tekrar dene</Text>
          </Bas>
        </View>
      ) : (
        <View style={s.merkez}>
          <ActivityIndicator color={K.vurgu} accessibilityLabel="Yükleniyor" />
        </View>
      );
  } else if (aktifSekme === 'gundem') {
    icerik = <Gundem veri={veri} qn={qn} eslesir={eslesir} tum={tumHaber} tumAyarla={tumHaberAyarla} no={mansetNo} noAyarla={mansetNoAyarla} yuksek={height} git={(sk, lk) => (sk === 'lig' ? ligeGit(lk) : sekmeAyarla(sk))} gonderiAc={(id) => c.git({ tur: 'gonderi', id })} kose={kose} koseAc={(id) => c.git({ tur: 'tribunKose', id })} />;
  } else if (aktifSekme === 'maclar') {
    icerik = <Maclar veri={veri} eslesir={eslesir} gunTarih={gunTarih} gunAyarla={gunTarihAyarla} yalnizCanli={yalnizCanli} canliAyarla={yalnizCanliAyarla} macAc={macAc} ligeGit={ligeGit} takvimAc={() => c.git({ tur: 'tribunTakvim' })} />;
  } else if (aktifSekme === 'lig') {
    icerik = <Lig veri={veri} spor={spor} eslesir={eslesir} ligKod={ligKod} ligAyarla={ligKodAyarla} gorunum={ligGorunum} gorunumAyarla={ligGorunumAyarla} maclaraGit={() => sekmeAyarla('maclar')} />;
  } else if (aktifSekme === 'transfer') {
    icerik = <Transfer veri={veri} eslesir={eslesir} suz={transferSuz} suzAyarla={transferSuzAyarla} />;
  } else {
    icerik = <Videolar veri={veri} eslesir={eslesir} ac={videoAc} />;
  }

  return (
    <View style={s.kok}>
      <StatusBar style="light" />
      <View style={[s.sutun, genis && { maxWidth: MAKS_GENISLIK_GENIS }]}>
        {/* ---- üst ---- */}
        <View style={[s.ust, { paddingTop: 12 + pay }]}>
          {/* Telefonda Tribün'ün üst çubuğu yok: geri düğmesi akışa (Yazsam mı? ana sayfa) döner. Tribün içindeki sekme geçmişine dokunmaz. */}
          {!genis && <TribunGeri onPress={() => c.git({ tur: 'akis' })} etiket="Yazsam mı? ana sayfaya dön" />}
          <Text style={s.logo} accessibilityRole="header">TRİBÜN</Text>
          <View style={s.sporKap} accessibilityRole="radiogroup" accessibilityLabel="Spor seç">
            {([['futbol', 'Futbol'], ['basket', 'Basketbol']] as const).map(([k, ad]) => (
              <Bas key={k} onPress={() => sporSec(k)} etiket={ad} secili={spor === k} rol="button" hitSlop={3} style={[s.sporDugme, spor === k && { backgroundColor: K.vurgu }]}>
                <Text style={[s.sporYazi, { color: spor === k ? K.zemin : K.orta }]}>{ad}</Text>
              </Bas>
            ))}
          </View>
          <View style={{ flex: 1 }} />
          <Bas onPress={() => { if (aramaAcik) qAyarla(''); aramaAcikAyarla(!aramaAcik); }} etiket={aramaAcik ? 'Aramayı kapat' : 'Ara'} style={[s.araDugme, aramaAcik && { borderColor: K.vurgu }]}>
            <AramaSimgesi renk={aramaAcik ? K.vurgu : K.yazi} />
          </Bas>
        </View>
        {aramaAcik && (
          <View style={s.aramaKutu}>
            <TextInput
              value={q}
              onChangeText={qAyarla}
              autoFocus
              placeholder="Takım, haber ya da video ara"
              placeholderTextColor={K.soluk}
              accessibilityLabel="Tribünde ara"
              returnKeyType="search"
              style={[s.aramaGiris, Platform.OS === 'web' && ({ outlineStyle: 'none' } as object)]}
            />
            {!!q && (
              <Bas onPress={() => qAyarla('')} etiket="Aramayı temizle" style={s.aramaTemizle}>
                <Ikon ad="kapat" boyut={16} renk={K.soluk} />
              </Bas>
            )}
          </View>
        )}

        {/* ---- canlı / bugün skor şeridi ---- */}
        {!!veri && veri.canli.length > 0 && !seritGizli && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.seritKap} contentContainerStyle={s.seritIc} accessibilityLabel="Canlı skorlar">
            {veri.canli.map((m) => <SeritMac key={m.id} m={m} macAc={macAc} />)}
          </ScrollView>
        )}

        {/* ---- sekmeler: bilgisayarda üstte; telefonda (11.11, Onur) altta, Astroloji'deki gibi sayfanın kendi alt menüsü ---- */}
        {genis && <View style={s.sekmeler} accessibilityRole="tablist">
          {sekmeler.map(([k, ad]) => {
            const sec = aktifSekme === k;
            return (
              <Bas key={k} onPress={() => sekmeAyarla(k)} rol="tab" etiket={ad} secili={sec} style={[s.sekme, { borderBottomColor: sec ? K.vurgu : 'transparent' }]}>
                <Text style={[s.sekmeYazi, { color: sec ? K.yazi : K.soluk, fontFamily: sec ? yazi.kalin : yazi.orta }]} numberOfLines={1}>{ad}</Text>
              </Bas>
            );
          })}
        </View>}

        <KaydirBaglam.Provider value={kaydirOlay}><View style={s.govde}>{icerik}</View></KaydirBaglam.Provider>
        {!genis && <TribunAltCubuk sekmeler={sekmeler} aktif={aktifSekme} sec={sekmeAyarla} />}
      </View>

      {Platform.OS === 'web' && <VideoPenceresi video={oynayan} son={sonOynayan.current} kapat={videoKapat} />}
    </View>
  );
}

// ---------------------------------------------------------------- alt çubuk (telefon) ----------------------------------------------------------------
const ALT_SIMGE: Record<Sekme, ReactElement> = {
  gundem: <Path d="M4 5h13v14H6a2 2 0 0 1-2-2V5zM17 8h3v9a2 2 0 0 1-2 2M7 9h7M7 12h7M7 15h4" />,
  maclar: <><Circle cx="12" cy="12" r="8.5" /><Path d="M12 7l4 3-1.5 4.5h-5L8 10z" /></>,
  lig: <Path d="M5 20V10M12 20V4M19 20v-7" />,
  transfer: <Path d="M4 8h14l-3-3M20 16H6l3 3" />,
  video: <><Path d="M6 6h12a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3z" /><Path d="M10 9.5l5 2.5-5 2.5z" /></>,
};
function TribunAltCubuk({ sekmeler, aktif, sec }: { sekmeler: readonly (readonly [Sekme, string])[]; aktif: Sekme; sec: (k: Sekme) => void }) {
  const alt = useSafeAreaInsets().bottom;
  return (
    <View style={[s.altCubuk, { marginBottom: Math.max(10, alt + 4) }]} accessibilityRole="tablist">
      {sekmeler.map(([k, ad]) => {
        const a = aktif === k;
        const renk = a ? K.vurgu : K.soluk;
        return (
          <Bas key={k} onPress={() => sec(k)} rol="tab" etiket={ad} secili={a} style={[s.altOge, a && { backgroundColor: 'rgba(198,244,50,0.14)' }]}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={renk} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">{ALT_SIMGE[k]}</Svg>
            <Text style={[s.altYazi, { color: renk, fontFamily: a ? yazi.kalin : yazi.orta }]} numberOfLines={1}>{ad}</Text>
          </Bas>
        );
      })}
    </View>
  );
}

// Bilgisayarda manşet ve yan sütun yan yana (≥1280 px). 1000–1279 px'te tek sütun kalır (eski düzen).
function useYanYana() {
  const genis = useGenis();
  const { width } = useWindowDimensions();
  return genis && width >= 1280;
}

// ---------------------------------------------------------------- şerit ----------------------------------------------------------------
function SeritMac({ m, macAc }: { m: PortalMac; macAc: (m: PortalMac, kod?: string) => void }) {
  const canli = m.durum === 'canli';
  const dk = canli ? m.dk ?? 'CANLI' : m.durum === 'bitti' ? 'MS' : m.saat;
  const metin = `${m.ev.ad} ${m.skor ?? 'maç öncesi'} ${m.dep.ad}${canli ? ', canlı' : ''}`;
  const ic = (
    <>
      <Text style={[s.seritDk, { color: canli ? K.canliAcik : K.soluk }]}>{dk}</Text>
      <Logo t={m.ev} boyut={16} />
      <Text style={s.seritTakim}>{m.ev.kisa}</Text>
      <Text style={s.seritSkor}>{m.skor ?? '–'}</Text>
      <Text style={s.seritTakim}>{m.dep.kisa}</Text>
      <Logo t={m.dep} boyut={16} />
    </>
  );
  const stil = [s.seritMac, { borderColor: canli ? K.canli : K.cizgi2 }];
  return <Bas onPress={() => macAc(m)} etiket={`${metin}. Maç ekranını aç`} rol="link" style={stil}>{ic}</Bas>;
}

// ---------------------------------------------------------------- Manşet (yana kaydırmalı) ----------------------------------------------------------------
type MansetKart = { anahtar: string; baslik: string; alt: string; etiket: string; gorsel: string | null; ac: () => void };

// Manşet zemini: haberin görseli (koyu geçişle yazı okunur); görsel yoksa ya da yüklenmezse düzgün yedek zemin (gradyan + halkalar).
function MansetZemin({ gorsel }: { gorsel: string | null }) {
  const [hata, hataAyarla] = useState(false);
  const gorunen = !!gorsel && !hata;
  return (
    <>
      {gorunen ? (
        <>
          <Image source={{ uri: gorsel! }} onError={() => hataAyarla(true)} resizeMode="cover" accessibilityIgnoresInvertColors style={StyleSheet.absoluteFill} />
          <LinearGradient colors={['rgba(8,12,4,0.05)', 'rgba(8,12,4,0.35)', 'rgba(8,12,4,0.92)']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
        </>
      ) : (
        <>
          <LinearGradient colors={['#1D2C0C', '#10151C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <View style={s.mansetDaire} pointerEvents="none" />
          <View style={s.mansetDaire2} pointerEvents="none" />
        </>
      )}
    </>
  );
}

// Manşet ok düğmesi (bilgisayarda): yuvarlak, yarı saydam zeminde beyaz ok.
function MansetOk({ yon, onPress }: { yon: 'sol' | 'sag'; onPress: () => void }) {
  return (
    <Bas onPress={onPress} etiket={yon === 'sol' ? 'Önceki manşet' : 'Sonraki manşet'} style={[s.mansetOk, yon === 'sol' ? { left: 12 } : { right: 12 }]}>
      <Svg width={18} height={18} viewBox="0 0 24 24">
        <Path d={yon === 'sol' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </Bas>
  );
}
// Başlık yazı boyu uzunluğa göre kademeli küçülür; en çok 3 satır (kapalı listede 2), taşarsa "…" ile kesilir. Yazı akışla dizilir: kartın dışına çıkamaz.
function baslikBoyu(uzunluk: number, kucuk: boolean): { fontSize: number; lineHeight: number } {
  if (kucuk) return uzunluk > 60 ? { fontSize: 17, lineHeight: 18 } : { fontSize: 20, lineHeight: 21 };
  // 03.11: en çok 3 satır; başlık uzadıkça yazı küçülür (4 satıra taşıp 'MANŞET' etiketini kesiyordu)
  if (uzunluk <= 38) return { fontSize: 25, lineHeight: 26 };
  if (uzunluk <= 62) return { fontSize: 21, lineHeight: 22 };
  if (uzunluk <= 88) return { fontSize: 18, lineHeight: 19 };
  if (uzunluk <= 115) return { fontSize: 16, lineHeight: 17 };
  return { fontSize: 14, lineHeight: 15 };
}
function MansetSerit({ kartlar, no, noAyarla, tum, yuksek, bosYazi, sikis }: { kartlar: MansetKart[]; no: number; noAyarla: (n: number) => void; tum: boolean; yuksek: number; bosYazi: string; sikis?: boolean }) {
  const n = kartlar.length;
  const yanYana = useYanYana();
  const genis = useGenis();
  const kap = useRef<ScrollView>(null);
  const sarmal = useRef<View>(null);
  const [alan, alanAyarla] = useState({ g: 0, y: 0 });
  const idx = n ? Math.min(no, n - 1) : 0;
  const noRef = useRef(idx);
  noRef.current = idx;
  // Web'de kaydırılan DOM düğümü (yoksa null). Yumuşak kaydırma elle yapılır (tarayıcının smooth kaydırması snap ile bazen takılıyor).
  const dugum = (): HTMLElement | null => {
    const kok = sarmal.current as unknown as HTMLElement | null;
    return (kap.current as unknown as { getScrollableNode?: () => HTMLElement } | null)?.getScrollableNode?.() ?? (kok ? Array.from(kok.querySelectorAll<HTMLElement>('div')).find((d) => /(auto|scroll)/.test(getComputedStyle(d).overflowX) && d.scrollWidth > d.clientWidth) ?? null : null);
  };
  const kaydir = (el: HTMLElement, hedef: number) => {
    const bas = el.scrollLeft, fark = hedef - bas, t0 = performance.now();
    el.style.scrollSnapType = 'none';
    const adim = (t: number) => {
      const p = Math.min(1, (t - t0) / 240);
      el.scrollLeft = bas + fark * (1 - Math.pow(1 - p, 3));
      if (p < 1) requestAnimationFrame(adim);
      else { el.style.scrollSnapType = ''; el.scrollLeft = hedef; }
    };
    requestAnimationFrame(adim);
  };
  const git = (i: number) => {
    const el = Platform.OS === 'web' ? dugum() : null;
    if (el) kaydir(el, i * alan.g);
    else kap.current?.scrollTo({ x: i * alan.g, animated: true });
    noAyarla(i);
  };
  // Ölçü belli olunca (ya da genişlik değişince) kaldığı karta oturur.
  useEffect(() => {
    if (alan.g > 0 && n > 1) kap.current?.scrollTo({ x: noRef.current * alan.g, animated: false });
  }, [alan.g, n]);
  // Web'de fareyle sürükleyerek kaydırma (dokunmatikte tarayıcının kendi kaydırması çalışır). Sürükleme sonrası tıklama (bağlantı açılması) yutulur.
  useEffect(() => {
    if (Platform.OS !== 'web' || n < 2 || !alan.g) return;
    const el = dugum();
    if (!el) return;
    let basladi = false, surukluyor = false, x0 = 0, sol0 = 0;
    const asagi = (e: PointerEvent) => { if (e.pointerType !== 'mouse' || e.button !== 0) return; basladi = true; surukluyor = false; x0 = e.clientX; sol0 = el.scrollLeft; };
    const hareket = (e: PointerEvent) => {
      if (!basladi) return;
      const dx = e.clientX - x0;
      if (!surukluyor && Math.abs(dx) > 6) { surukluyor = true; el.style.scrollSnapType = 'none'; el.style.cursor = 'grabbing'; el.style.userSelect = 'none'; }
      if (surukluyor) el.scrollLeft = sol0 - dx;
    };
    const birak = () => {
      if (!basladi) return;
      basladi = false;
      if (!surukluyor) return;
      el.style.cursor = ''; el.style.userSelect = '';
      const i = Math.max(0, Math.min(n - 1, Math.round(el.scrollLeft / alan.g)));
      kaydir(el, i * alan.g);
      noAyarla(i);
      setTimeout(() => { surukluyor = false; }, 0);
    };
    const tik = (e: Event) => { if (surukluyor) { e.stopPropagation(); e.preventDefault(); } };
    el.addEventListener('pointerdown', asagi);
    window.addEventListener('pointermove', hareket);
    window.addEventListener('pointerup', birak);
    window.addEventListener('pointercancel', birak);
    el.addEventListener('click', tik, true);
    return () => {
      el.removeEventListener('pointerdown', asagi);
      window.removeEventListener('pointermove', hareket);
      window.removeEventListener('pointerup', birak);
      window.removeEventListener('pointercancel', birak);
      el.removeEventListener('click', tik, true);
    };
  }, [alan.g, n]);

  // Otomatik geçiş (6 sn): kullanıcı dokunduğu, kaydırdığı ya da ok/nokta seçtiği anda durur ve bir daha kendiliğinden başlamaz.
  const [oto, otoAyarla] = useState(true);
  const durdur = () => otoAyarla(false);
  const ilerle = (d: number) => {
    durdur();
    const i = (noRef.current + d + n) % n;
    git(i);
    noAyarla(i);
  };
  useEffect(() => {
    if (!oto || tum || n < 2 || alan.g <= 0) return;
    const t = setInterval(() => {
      const i = (noRef.current + 1) % n;
      git(i);
      noAyarla(i);
    }, 6000);
    return () => clearInterval(t);
  }, [oto, tum, n, alan.g]);

  // sikis: YORUMCULAR şeridi manşetin altında göründüğünde manşet biraz kısalır (Gündem yine tek ekrana sığar)
  const boy = tum ? { height: 104 } : yanYana ? { height: 420, flexGrow: 0, flexShrink: 0 } : sikis ? { flexGrow: 1, flexShrink: 1, flexBasis: 150, minHeight: 138, maxHeight: 200 } : { flexGrow: 1, flexShrink: 1, flexBasis: 190, minHeight: 176, maxHeight: yuksek > 760 ? 250 : 224 };
  if (n === 0) {
    return (
      <View style={[s.manset, tum ? { height: 104 } : { flexGrow: 1, flexShrink: 1, flexBasis: 150, minHeight: 104, maxHeight: 190 }]}>
        <LinearGradient colors={['#1D2C0C', '#10151C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={s.merkez}><Text style={s.bosYazi}>{bosYazi}</Text></View>
      </View>
    );
  }
  return (
    <View style={[boy, { minWidth: 0 }]}>
      <View ref={sarmal} style={{ flex: 1, minHeight: 0 }} onStartShouldSetResponderCapture={() => { durdur(); return false; }} onLayout={(e) => alanAyarla({ g: Math.round(e.nativeEvent.layout.width), y: Math.round(e.nativeEvent.layout.height) })}>
        {alan.g > 0 && (
          <ScrollView
            ref={kap}
            horizontal
            pagingEnabled={n > 1}
            scrollEnabled={n > 1}
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={(e) => { const i = Math.max(0, Math.min(n - 1, Math.round(e.nativeEvent.contentOffset.x / alan.g))); if (i !== noRef.current) { noRef.current = i; noAyarla(i); } }}
            style={{ width: alan.g, height: alan.y }}
            accessibilityLabel={n > 1 ? `Manşetler, ${idx + 1} / ${n}. Yana kaydır` : 'Manşet'}
          >
            {kartlar.map((k) => (
              <View key={k.anahtar} style={[s.manset, { width: alan.g, height: alan.y }]}>
                <MansetZemin gorsel={k.gorsel} />
                <Bas onPress={k.ac} etiket={`${k.etiket === 'MANŞET' ? 'Manşet' : k.etiket}: ${k.baslik}${k.alt ? `, ${k.alt}` : ''}`} rol="link" style={s.mansetIc}>
                  <Text style={s.mansetEtiket}>{k.etiket}</Text>
                  <View style={{ gap: 4, minHeight: 0, flexShrink: 1 }}>
                    <Text style={[s.mansetBaslik, baslikBoyu(k.baslik.length, tum), yanYana && { fontSize: 30, lineHeight: 35 }]} numberOfLines={tum ? 2 : 3} ellipsizeMode="tail">{buyuk(k.baslik)}</Text>
                    {!!k.alt && !tum && <Text style={s.mansetKaynak} numberOfLines={1}>{k.alt}</Text>}
                  </View>
                </Bas>
              </View>
            ))}
          </ScrollView>
        )}
        {alan.g > 0 && genis && n > 1 && !tum && (
          <>
            <MansetOk yon="sol" onPress={() => ilerle(-1)} />
            <MansetOk yon="sag" onPress={() => ilerle(1)} />
          </>
        )}
      </View>
      {n > 1 && (
        <View style={s.noktalar} accessibilityRole="tablist">
          {kartlar.map((k, i) => (
            <Bas key={k.anahtar} onPress={() => { durdur(); git(i); noAyarla(i); }} rol="tab" secili={i === idx} etiket={`${i + 1}. manşet`} style={s.noktaKap}>
              <View style={[s.nokta, i === idx && s.noktaSecili]} />
            </Bas>
          ))}
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------- YORUMCULAR şeridi ----------------------------------------------------------------
// Yapay zekâ yorumcuların (Golazar, Sportmence, Yorumsuz) son yazıları: sunucu GET /c/tribun/kose. Bellekte tutulur (sekme değişince titremez), görünürken 5 dk'da bir tazelenir.
const KOSE_BELLEK: { veri: TribunKoseVeri | null } = { veri: null };
function useKose(): TribunKoseVeri | null {
  const [veri, veriAyarla] = useState<TribunKoseVeri | null>(KOSE_BELLEK.veri);
  useEffect(() => {
    let acik = true;
    const yukle = () => C.tribunKose().then((r) => { if (acik && r.ok) { KOSE_BELLEK.veri = r.veri; veriAyarla(r.veri); } });
    yukle();
    const t = setInterval(() => gorunuyor() && yukle(), 300000);
    return () => { acik = false; clearInterval(t); };
  }, []);
  return veri;
}
// Yazar avatarı: yuvarlak, yazar renginde harf (ör. G, S, Y)
export function KoseAvatar({ ad, renk, boyut }: { ad: string; renk: string; boyut: number }) {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: boyut, height: boyut, borderRadius: boyut / 2, backgroundColor: `${renk}26`, borderWidth: 1.5, borderColor: renk, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: yazi.darKalin, fontSize: Math.round(boyut * 0.58), lineHeight: Math.round(boyut * 0.7), color: renk }}>{ad.slice(0, 1).toLocaleUpperCase('tr-TR')}</Text>
    </View>
  );
}
// 03.11: Basketbol seçiliyken futbol yazısı çıkmasın: her yazarın SEÇİLİ spordaki son yazısı bulunur (etiket/başlık/özette basketbol geçiyorsa basketbol yazısıdır); yazısı olmayan yazar gösterilmez.
const koseBasketMi = (y: { etiketler: string[]; baslik: string; ozet: string }) => /basket|nba|euroleague|potada/.test(sade(`${y.etiketler.join(' ')} ${y.baslik} ${y.ozet}`));
function koseYazarlari(kose: TribunKoseVeri | null, spor: PortalSpor): KoseYazar[] {
  if (!kose) return [];
  const l: KoseYazar[] = [];
  for (const y of kose.yazarlar) {
    const x = kose.yazilar.find((z) => z.yazar === y.kod && koseBasketMi(z) === (spor === 'basket'));
    if (x) l.push({ ...y, sonYazi: { id: x.id, baslik: x.baslik, ozet: x.ozet, zaman: x.zaman } });
  }
  return l;
}
function KoseSeridi({ yazarlar, ac }: { yazarlar: KoseYazar[]; ac: (id: string) => void }) {
  return (
    <View style={s.koseKap}>
      <View style={s.koseBasSatir}>
        <Text style={s.koseBaslik}>YORUMCULAR</Text>
        <Text style={s.koseAlt}>yapay zekâ yorumcular</Text>
      </View>
      <View style={s.koseSatir}>
        {yazarlar.map((y) => (
          <Bas key={y.kod} onPress={() => y.sonYazi && ac(y.sonYazi.id)} devre={!y.sonYazi} rol="link" etiket={`${y.ad}, ${y.rol}. ${y.sonYazi ? `Son yazı: ${y.sonYazi.baslik}. Yazıyı aç` : 'Henüz yazı yok'}`} style={s.koseKart}>
            <KoseAvatar ad={y.ad} renk={y.renk} boyut={26} />
            <View style={{ gap: 1 }}>
              <Text style={s.koseAd} numberOfLines={1}>{y.ad}</Text>
              <Text style={s.koseRol} numberOfLines={1}>{y.rol}</Text>
            </View>
            <Text style={s.koseYazi} numberOfLines={2}>{y.sonYazi?.baslik ?? 'Yakında'}</Text>
          </Bas>
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------- Gündem ----------------------------------------------------------------
function Gundem({ veri, qn, eslesir, tum, tumAyarla, no, noAyarla, yuksek, git, gonderiAc, kose, koseAc }: { veri: TribunPortalVeri; qn: string; eslesir: (...m: string[]) => boolean; tum: boolean; tumAyarla: (b: boolean) => void; no: number; noAyarla: (n: number) => void; yuksek: number; git: (s: Sekme, lig?: string) => void; gonderiAc: (id: string) => void; kose: TribunKoseVeri | null; koseAc: (id: string) => void }) {
  const haberler = veri.sondk.filter((h) => eslesir(h.baslik, h.kaynak, h.etiket));
  const yanYana = useYanYana();
  // YORUMCULAR şeridi (manşetin altı): yalnız seçili sporda en az bir yazar yazmışsa, aramada ve "tüm haberler" açıkken yok. Yer açmak için son dakika satırı bir azalır (en az 2); hepsi "Tüm haberler"de.
  const koseYazar = koseYazarlari(kose, veri.spor);
  const koseVar = !tum && !qn && koseYazar.length > 0;
  const kaydir = useKaydir();
  const kac = yanYana ? (yuksek < 900 ? 5 : 8) : Math.max(2, (yuksek < 800 ? 3 : yuksek < 880 ? 4 : 5) - (koseVar ? 1 : 0)); // büyütülen manşete yer açmak için kısa ekranlarda daha az satır
  const liste = tum ? haberler : haberler.slice(0, kac);
  const fazla = haberler.length > kac;
  const mansetler = qn ? [] : veri.manset;
  const yedek: PortalHaber | undefined = veri.sondk[0];

  // Manşet kartları: akıştaki spor gönderileri ve son dakika haberleri (haberin kendi görseli ile); hiç yoksa en yeni son dakika başlığı. Birden çoksa yana kaydırılır.
  const kartlar: MansetKart[] = mansetler.length
    ? mansetler.map((m) => ({ anahtar: m.gonderiId ?? m.haber?.url ?? m.metin, baslik: m.haber?.baslik || m.metin, alt: m.haber?.kaynak ?? '', etiket: 'MANŞET', gorsel: m.haber?.gorsel ?? null, ac: () => (m.gonderiId ? gonderiAc(m.gonderiId) : disariAc(m.haber?.url ?? '')) }))
    : !qn && yedek ? [{ anahtar: yedek.url, baslik: yedek.baslik, alt: yedek.kaynak, etiket: yedek.etiket, gorsel: null, ac: () => disariAc(yedek.url) }] : [];
  const mansetKutu = <MansetSerit kartlar={kartlar} no={no} noAyarla={noAyarla} tum={tum} yuksek={yuksek} sikis={koseVar} bosYazi={qn ? 'Aramayla eşleşen manşet yok' : 'Şimdilik manşet yok'} />;

  const satirlar = liste.map((h, i) => (
    <Bas key={`${h.url}${i}`} onPress={() => disariAc(h.url)} etiket={`${h.saat} ${h.baslik}, ${h.kaynak}. Haberi aç`} rol="link" style={[s.haber, i > 0 && { borderTopWidth: 1, borderTopColor: K.cizgi }]}>
      <View style={s.haberSaatKap}>
        {h.saat.includes(' ') ? <Text style={s.haberSaatUst}>{h.saat.slice(0, h.saat.lastIndexOf(' '))}</Text> : null}
        <Text style={s.haberSaat}>{h.saat.slice(h.saat.lastIndexOf(' ') + 1)}</Text>
      </View>
      <Text style={s.haberBaslik} numberOfLines={1}>{h.baslik}</Text>
      <Text style={[s.haberEtiket, { color: ETIKET_RENK[h.etiket] ?? K.soluk }]} numberOfLines={1}>{h.etiket}</Text>
    </Bas>
  ));
  // 04.11 (E-08): manşet doluyken altında "Şimdilik haber yok" kutusu çıkıyordu (manşet akıştan, liste son dakikadan gelir; ikincisi boş
  // olabilir). Manşet varsa ve aramada değilsek boş haber kutusu hiç çizilmez; boş kutu yalnız manşet de yokken ya da aramada görünür.
  const haberKutu = haberler.length === 0 && !qn && kartlar.length > 0 ? null : (
    <Kutu style={tum ? { flex: 1, minHeight: 0 } : undefined}>
      {haberler.length === 0 ? (
        <Bos yazi={qn ? 'Aramayla eşleşen haber yok' : 'Şimdilik haber yok'} />
      ) : tum ? (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>{satirlar}</ScrollView>
      ) : (
        satirlar
      )}
      {fazla && (
        <Bas onPress={() => tumAyarla(!tum)} etiket={tum ? 'Daha az haber göster' : `Tüm haberler, ${haberler.length} haber`} style={s.tumHaber}>
          <Text style={s.tumHaberYazi}>{tum ? 'Daha az göster' : `Tüm haberler (${haberler.length})`}</Text>
        </Bas>
      )}
    </Kutu>
  );

  // Kısayollar: üstteki küçük rakam/yazı gerçek veriden (lider, bugünkü maç sayısı, transfer ve video adedi).
  const bugun = veri.gunler.find((g) => g.etiket === 'Bugün') ?? veri.gunler[0];
  const bugunSay = bugun ? bugun.ligler.reduce((t, l) => t + l.maclar.length, 0) : 0;
  const kisayol: { ad: string; ust: string; renk: string; git: () => void }[] = [
    { ad: 'Puan tablosu', ust: String(veri.lig.length), renk: K.vurgu, git: () => git('lig', veri.lig[0]?.kod) },
    { ad: 'Fikstür', ust: String(bugunSay), renk: K.mavi, git: () => git('maclar') },
    { ad: 'Transfer', ust: String(veri.transfer.length), renk: K.sari, git: () => git('transfer') },
    { ad: 'Video', ust: String(veri.video.length), renk: K.turuncu, git: () => git('video') },
  ].filter((k) => !(k.ad === 'Transfer' && veri.spor === 'basket' && veri.transfer.length === 0)); // 03.11: boş '0 Transfer' kısayolu gizlenir
  const kisayolSatir = (
    <View style={s.kisayollar}>
      {kisayol.map((k) => (
        <Bas key={k.ad} onPress={k.git} etiket={`${k.ad} sekmesine geç`} style={s.kisayol}>
          <Text style={[s.kisayolUst, { color: k.renk }]}>{k.ust}</Text>
          <Text style={s.kisayolAd}>{k.ad}</Text>
        </Bas>
      ))}
    </View>
  );

  // Liste açıkken sayfa kaymaz: haber listesi kalan boşluğu alır ve KENDİ içinde kayar. Kapalıyken ekrana sığmazsa sayfa kayar.
  if (tum) return <View style={s.gundem}>{mansetKutu}{haberKutu}{kisayolSatir}</View>;
  // Bilgisayar (27.10): manşet solda, yorumcular ve haber listesi sağda; ekrana yayılır (sağ taraf kendi içinde kayar).
  if (yanYana)
    return (
      <View style={s.gundemGenis}>
        <View style={s.gundemSol}>{mansetKutu}{kisayolSatir}</View>
        <ScrollView style={s.gundemSag} contentContainerStyle={{ gap: 10, paddingBottom: LISTE_ALT }} showsVerticalScrollIndicator={false}>
          {koseVar && <KoseSeridi yazarlar={koseYazar} ac={koseAc} />}
          {haberKutu}
        </ScrollView>
      </View>
    );
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={[s.gundem, { flexGrow: 1, paddingBottom: LISTE_ALT }]} onScroll={kaydir} scrollEventThrottle={16} showsVerticalScrollIndicator={false}>
      {mansetKutu}
      {koseVar && <KoseSeridi yazarlar={koseYazar} ac={koseAc} />}
      {haberKutu}
      {kisayolSatir}
    </ScrollView>
  );
}

// ---------------------------------------------------------------- Maçlar ----------------------------------------------------------------
function Maclar({ veri, eslesir, gunTarih, gunAyarla, yalnizCanli, canliAyarla, macAc, ligeGit, takvimAc }: { veri: TribunPortalVeri; eslesir: (...m: string[]) => boolean; gunTarih: string | null; gunAyarla: (t: string) => void; yalnizCanli: boolean; canliAyarla: (b: boolean) => void; macAc: (m: PortalMac, kod?: string) => void; ligeGit: (kod: string) => void; takvimAc: () => void }) {
  const gun = veri.gunler.find((g) => g.tarih === gunTarih) ?? veri.gunler.find((g) => g.etiket === 'Bugün') ?? veri.gunler[0];
  const genis = useGenis();
  const kaydir = useKaydir();
  const canliSay = gun ? gun.ligler.reduce((t, l) => t + l.maclar.filter((m) => m.durum === 'canli').length, 0) : 0;
  const ligler = (gun?.ligler ?? [])
    .map((l) => ({ ...l, maclar: l.maclar.filter((m) => (!yalnizCanli || m.durum === 'canli') && eslesir(m.ev.ad, m.dep.ad, l.ad)) }))
    .filter((l) => l.maclar.length > 0);
  return (
    <View style={{ flex: 1 }}>
      {veri.gunler.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.yatay} contentContainerStyle={s.yatayIc} accessibilityRole="tablist">
          {veri.gunler.map((g) => {
            const sec = g.tarih === gun?.tarih;
            return (
              <Bas key={g.tarih} onPress={() => gunAyarla(g.tarih)} rol="tab" secili={sec} etiket={`${g.etiket}, ${gunKisa(g.tarih)}`} style={[s.gun, { backgroundColor: sec ? K.yazi : K.kart, borderColor: sec ? K.yazi : K.cizgi2 }]}>
                <Text style={[s.gunUst, { color: sec ? K.zemin : K.orta }]}>{g.etiket}</Text>
                <Text style={[s.gunAlt, { color: sec ? K.zemin : K.soluk }]}>{gunKisa(g.tarih)}</Text>
              </Bas>
            );
          })}
        </ScrollView>
      )}
      <View style={s.filtreSatir}>
        <Cip ad="Tümü" secili={!yalnizCanli} onPress={() => canliAyarla(false)} />
        <Cip ad={canliSay ? `Canlı ${canliSay}` : 'Canlı'} secili={yalnizCanli} secilirenk={K.canli} zemin={canliSay ? 'rgba(255,59,48,.15)' : K.kart} renk={canliSay ? K.canliAcik : K.orta} onPress={() => canliAyarla(true)} />
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={[{ paddingHorizontal: 14, paddingBottom: LISTE_ALT }, genis && { flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, alignItems: 'flex-start' }]} onScroll={kaydir} scrollEventThrottle={16} showsVerticalScrollIndicator={false}>
        {ligler.length === 0 ? (
          <Bos yazi={yalnizCanli ? 'Şu an canlı maç yok' : `${gun?.etiket ?? 'Bugün'} bu ligde maç yok`} />
        ) : (
          ligler.map((l) => (
            <View key={l.kod} style={[s.kart, { marginBottom: 8 }, genis && ({ width: 'calc(50% - 6px)' } as object)]}>
              <View style={s.ligBaslik}>
                <Text style={s.ligBaslikYazi} numberOfLines={1}>{buyuk(l.ad)}</Text>
                {veri.lig.some((x) => x.kod === l.kod) && (
                  <Bas onPress={() => ligeGit(l.kod)} etiket={`${l.ad} puan durumu`} rol="link" style={s.ligLink}>
                    <Text style={s.ligLinkYazi}>Puan durumu ›</Text>
                  </Bas>
                )}
              </View>
              {l.maclar.map((m, i) => <MacSatiri key={m.id} m={m} ilk={i === 0} ac={() => macAc(m, l.kod)} />)}
            </View>
          ))
        )}
      </ScrollView>
      <Bas onPress={takvimAc} etiket="Maç odaları ve takvim" rol="link" style={s.odalar}>
        <Text style={s.odalarYazi}>Maç odaları</Text>
        <Ikon ad="ok" boyut={16} renk={K.vurgu} kalinlik={2.4} />
      </Bas>
    </View>
  );
}

function MacSatiri({ m, ilk, ac }: { m: PortalMac; ilk: boolean; ac: () => void }) {
  const canli = m.durum === 'canli';
  const sol = canli ? m.dk ?? 'CANLI' : m.durum === 'bitti' ? 'MS' : m.saat;
  const [a, b] = skorBol(m.skor);
  const etiket = `${m.ev.ad} ${m.dep.ad}, ${m.skor ? m.skor : m.saat}${canli ? ', canlı' : m.durum === 'bitti' ? ', maç sonu' : ''}`;
  const ic = (
    <>
      <Text style={[s.macZaman, { color: canli ? K.canliAcik : K.soluk }]}>{sol}</Text>
      <View style={s.macTakimlar}>
        <View style={s.macTakim}><Logo t={m.ev} boyut={16} /><Text style={s.macAd} numberOfLines={1}>{m.ev.ad}</Text></View>
        <View style={s.macTakim}><Logo t={m.dep} boyut={16} /><Text style={s.macAd} numberOfLines={1}>{m.dep.ad}</Text></View>
      </View>
      {!!m.odaId && <View style={s.oda}><Text style={s.odaYazi}>ODA</Text></View>}
      <View style={s.macSkor}>
        <Text style={[s.macSkorYazi, canli && { color: K.yazi }]}>{a}</Text>
        <Text style={[s.macSkorYazi, canli && { color: K.yazi }]}>{b}</Text>
      </View>
    </>
  );
  const stil = [s.macSatir, !ilk && { borderTopWidth: 1, borderTopColor: K.ince }];
  return <Bas onPress={ac} etiket={`${etiket}. Maç ekranını aç`} rol="link" style={stil}>{ic}</Bas>;
}

// ---------------------------------------------------------------- Lig ----------------------------------------------------------------
function Lig({ veri, spor, eslesir, ligKod, ligAyarla, gorunum, gorunumAyarla, maclaraGit }: { veri: TribunPortalVeri; spor: PortalSpor; eslesir: (...m: string[]) => boolean; ligKod: string | null; ligAyarla: (k: string) => void; gorunum: 'puan' | 'kral'; gorunumAyarla: (g: 'puan' | 'kral') => void; maclaraGit: () => void }) {
  const lig: PortalLig | undefined = veri.lig.find((l) => l.kod === ligKod) ?? veri.lig[0];
  const genis = useGenis();
  if (!lig) return <Bos yazi="Puan durumu şimdilik yok" />;
  return (
    <View style={{ flex: 1 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.yatay} contentContainerStyle={s.yatayIc} accessibilityRole="tablist">
        {veri.lig.map((l) => <Cip key={l.kod} ad={l.ad} secili={l.kod === lig.kod} onPress={() => ligAyarla(l.kod)} />)}
      </ScrollView>
      <View style={[s.ayirici, genis && { alignSelf: 'flex-start', width: 200 }]} accessibilityRole="tablist">
        {!genis && ([['puan', 'Puan'], ['kral', spor === 'basket' ? 'Sayı krallığı' : 'Krallık']] as const).map(([k, ad]) => (
          <Bas key={k} onPress={() => gorunumAyarla(k)} rol="tab" etiket={ad} secili={gorunum === k} style={[s.ayiriciDugme, gorunum === k && { backgroundColor: K.vurgu }]}>
            <Text style={[s.ayiriciYazi, { color: gorunum === k ? K.zemin : K.orta }]}>{ad}</Text>
          </Bas>
        ))}
        {/* Fikstür için ayrı uç yok: Maçlar sekmesine geçer */}
        <Bas onPress={maclaraGit} rol="link" etiket="Fikstür, Maçlar sekmesine geç" style={s.ayiriciDugme}>
          <Text style={[s.ayiriciYazi, { color: K.orta }]}>Fikstür ›</Text>
        </Bas>
      </View>
      {genis ? (
        // 03.11: bilgisayarda puan tablosu en çok 760 px, yanında krallık (tablo bütün ekrana yayılmasın)
        <View style={{ flex: 1, flexDirection: 'row', gap: 16, alignItems: 'stretch' }}>
          <View style={{ flex: 1, maxWidth: 760, minWidth: 0 }}><PuanTablosu lig={lig} spor={spor} eslesir={eslesir} /></View>
          <View style={{ width: 360, minWidth: 0 }}><Krallik lig={lig} spor={spor} eslesir={eslesir} baslik /></View>
        </View>
      ) : gorunum === 'puan' ? <PuanTablosu lig={lig} spor={spor} eslesir={eslesir} /> : <Krallik lig={lig} spor={spor} eslesir={eslesir} />}
    </View>
  );
}

const FORM_RENK: Record<string, string> = { G: K.yesil, B: K.gri, M: K.canliAcik };
function PuanTablosu({ lig, spor, eslesir }: { lig: PortalLig; spor: PortalSpor; eslesir: (...m: string[]) => boolean }) {
  const kaydir = useKaydir();
  const sonSutun = spor === 'basket' ? 'G' : 'P'; // 03.11: basketbolda son sütun puan değil galibiyet sayısıdır
  const toplam = lig.puan.length;
  const formVar = lig.puan.some((p) => !!p.form);
  const yerel = /^(tur|eng|esp|ita|ger)\.1$/.test(lig.kod) || lig.kod === 'bsl'; // son kırmızı şeritler yalnız ülke liglerinde anlamlı (düşme)
  const dusen = lig.kod === 'bsl' ? 2 : 3; // BSL: son 2 takım küme düşer (08.11)
  const yesilSay = lig.kod.startsWith('uefa') || lig.kod === 'euroleague' || lig.kod.startsWith('nba') ? (lig.kod.startsWith('uefa') ? 8 : 6) : lig.kod === 'bsl' ? 8 : 4; // BSL: ilk 8 play-off
  const satirlar = lig.puan.filter((p) => eslesir(p.takim.ad));
  if (toplam === 0) return <Bos yazi="Puan durumu şimdilik yok" />;
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: LISTE_ALT }} onScroll={kaydir} scrollEventThrottle={16} showsVerticalScrollIndicator={false}>
      <View style={s.kart}>
        <View style={s.puanBas}>
          <Text style={[s.puanBasYazi, { width: 22 }]}>#</Text>
          <Text style={[s.puanBasYazi, { flex: 1, paddingLeft: 26 }]}>TAKIM</Text>
          {formVar && <Text style={[s.puanBasYazi, { width: 62, textAlign: 'center' }]}>FORM</Text>}
          <Text style={[s.puanBasYazi, { width: 26, textAlign: 'right' }]}>O</Text>
          <Text style={[s.puanBasYazi, { width: 34, textAlign: 'right' }]}>AV</Text>
          <Text style={[s.puanBasYazi, { width: 32, textAlign: 'right' }]}>{sonSutun}</Text>
        </View>
        {satirlar.length === 0 && <Bos yazi="Aramayla eşleşen takım yok" />}
        {satirlar.map((p) => {
          const serit = p.sira <= yesilSay ? K.yesil : yerel && p.sira > toplam - dusen ? K.canliAcik : 'transparent';
          return (
            <View key={`${p.sira}${p.takim.ad}`} accessible accessibilityLabel={`${p.sira}. ${p.takim.ad}, ${p.o} maç, averaj ${p.av}, ${p.p} ${spor === 'basket' ? 'galibiyet' : 'puan'}`} style={s.puanSatir}>
              <View style={[s.puanSerit, { backgroundColor: serit }]} />
              <Text style={[s.puanHucre, { width: 22, color: K.soluk }]}>{p.sira}</Text>
              <View style={{ marginRight: 8 }}><Logo t={p.takim} boyut={18} /></View>
              <Text style={s.puanTakim} numberOfLines={1}>{p.takim.ad}</Text>
              {formVar && (
                <View style={s.form}>
                  {p.form ? p.form.slice(-5).split('').map((f, i) => <View key={i} style={[s.formKare, { backgroundColor: FORM_RENK[f] ?? K.gri }]} />) : null}
                </View>
              )}
              <Text style={[s.puanHucre, { width: 26, textAlign: 'right', color: K.soluk }]}>{p.o}</Text>
              <Text style={[s.puanHucre, { width: 34, textAlign: 'right', color: K.soluk }]}>{p.av > 0 ? `+${p.av}` : p.av}</Text>
              <Text style={s.puanP}>{p.p}</Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

function Krallik({ lig, spor, eslesir, baslik }: { lig: PortalLig; spor: PortalSpor; eslesir: (...m: string[]) => boolean; baslik?: boolean }) {
  const kaydir = useKaydir();
  const liste = lig.kral.filter((k) => eslesir(k.ad, k.takim));
  if (lig.kral.length === 0) return <Bos yazi="Krallık bilgisi şimdilik yok" />;
  if (liste.length === 0) return <Bos yazi="Aramayla eşleşen oyuncu yok" />;
  const enCok = Math.max(...lig.kral.map((k) => k.deger), 1);
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: LISTE_ALT }} onScroll={kaydir} scrollEventThrottle={16} showsVerticalScrollIndicator={false}>
      <View style={[s.kart, { padding: 12, gap: 14 }]}>
        {baslik && <Text style={s.krallikBaslik}>{spor === 'basket' ? 'SAYI KRALLIĞI' : 'GOL KRALLIĞI'}</Text>}
        {liste.map((k) => (
          <View key={`${k.ad}${k.takim}`} accessible accessibilityLabel={`${lig.kral.indexOf(k) + 1}. ${k.ad}, ${k.takim}, ${sayiYaz(k.deger)} ${spor === 'basket' ? 'sayı' : 'gol'}`} style={s.kral}>
            <Text style={s.kralSira}>{lig.kral.indexOf(k) + 1}</Text>
            <View style={{ flex: 1 }}>
              <View style={s.kralUst}>
                <Text style={s.kralAd} numberOfLines={1}>{k.ad}<Text style={{ color: K.soluk }}> · {k.takim}</Text></Text>
                <Text style={s.kralDeger}>{sayiYaz(k.deger)}</Text>
              </View>
              <View style={s.kralCubuk}><View style={[s.kralDolgu, { width: `${Math.max(4, Math.round((k.deger / enCok) * 100))}%` }]} /></View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------- Transfer ----------------------------------------------------------------
function Transfer({ veri, eslesir, suz, suzAyarla }: { veri: TribunPortalVeri; eslesir: (...m: string[]) => boolean; suz: TransferDurum | null; suzAyarla: (d: TransferDurum | null) => void }) {
  const say = (d: TransferDurum) => veri.transfer.filter((t) => t.durum === d).length;
  const liste = veri.transfer.filter((t) => (!suz || t.durum === suz) && eslesir(t.baslik, t.kaynak));
  const kaydir = useKaydir();
  return (
    <View style={{ flex: 1 }}>
      <View style={s.filtreSatir}>
        {(['resmi', 'gorusme', 'iddia'] as const).map((d) => (
          <Cip key={d} ad={`${DURUM[d].ad[0] + DURUM[d].ad.slice(1).toLocaleLowerCase('tr-TR')} ${say(d)}`} etiket={`${DURUM[d].ad.toLocaleLowerCase('tr-TR')} transferler, ${say(d)}`} secili={suz === d} secilirenk={DURUM[d].yazi} zemin={DURUM[d].zemin} renk={DURUM[d].yazi} onPress={() => suzAyarla(suz === d ? null : d)} />
        ))}
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: LISTE_ALT, gap: 8 }} onScroll={kaydir} scrollEventThrottle={16} showsVerticalScrollIndicator={false}>
        {liste.length === 0 ? (
          <Bos yazi={veri.transfer.length === 0 ? 'Şimdilik yeni transfer haberi yok' : 'Bu filtrede transfer haberi yok'} />
        ) : (
          liste.map((t, i) => (
            <Bas key={`${t.url}${i}`} onPress={() => disariAc(t.url)} etiket={`${DURUM[t.durum].ad.toLocaleLowerCase('tr-TR')}: ${t.baslik}, ${t.kaynak}. Haberi aç`} rol="link" style={s.transfer}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={s.transferBaslik} numberOfLines={2}>{t.baslik}</Text>
                <Text style={s.transferAlt} numberOfLines={1}>{t.kaynak}{t.saat ? ` · ${t.saat}` : ''}</Text>
              </View>
              <View style={[s.rozet, { backgroundColor: DURUM[t.durum].zemin }]}><Text style={[s.rozetYazi, { color: DURUM[t.durum].yazi }]}>{DURUM[t.durum].ad}</Text></View>
            </Bas>
          ))
        )}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------- Video ----------------------------------------------------------------
function Videolar({ veri, eslesir, ac }: { veri: TribunPortalVeri; eslesir: (...m: string[]) => boolean; ac: (v: PortalVideo) => void }) {
  const liste = veri.video.filter((v) => KIMLIK.test(v.youtubeId) && eslesir(v.baslik, v.kanal));
  const kaydir = useKaydir();
  if (liste.length === 0) return <Bos yazi={veri.video.length === 0 ? 'Şimdilik video yok' : 'Aramayla eşleşen video yok'} />;
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={s.videolar} onScroll={kaydir} scrollEventThrottle={16} showsVerticalScrollIndicator={false}>
      {liste.map((v) => <VideoKart key={v.youtubeId} v={v} ac={ac} />)}
    </ScrollView>
  );
}
function VideoKart({ v, ac }: { v: PortalVideo; ac: (v: PortalVideo) => void }) {
  const [hata, hataAyarla] = useState(false);
  const genis = useGenis();
  return (
    <Bas onPress={() => ac(v)} etiket={`${v.baslik}, ${v.kanal}. Videoyu oynat`} style={[s.videoKart, genis && { width: '31.5%' }]}>
      <View style={s.videoKapak}>
        {!hata && <Image source={{ uri: kapakAdresi(v.youtubeId) }} resizeMode="cover" onError={() => hataAyarla(true)} accessibilityIgnoresInvertColors style={StyleSheet.absoluteFill} />}
        <View style={s.oynatDaire} pointerEvents="none">
          <Svg width={18} height={18} viewBox="0 0 24 24"><Path d="M8 5.2v13.6a1 1 0 0 0 1.52.85l11-6.8a1 1 0 0 0 0-1.7l-11-6.8A1 1 0 0 0 8 5.2Z" fill="#fff" /></Svg>
        </View>
      </View>
      <Text style={s.videoBaslik} numberOfLines={2}>{v.baslik}</Text>
      <Text style={s.videoKanal} numberOfLines={1}>{v.kanal}</Text>
    </Bas>
  );
}

// 04.11 (E-12): oynatıcı yüklenene kadar ~3 sn siyah kutu görünüyordu. Kapak görseli (i.ytimg.com) altta durur; iframe yüklenene kadar
// görünmez (opacity 0) ve yüklenince üstüne gelir. Kapak açılmazsa düz koyu zemin kalır.
function OynaticiCerceve({ video }: { video: PortalVideo }) {
  const [hazir, hazirAyarla] = useState(false);
  const [kapakHata, kapakHataAyarla] = useState(false);
  return (
    <View style={{ flex: 1, backgroundColor: '#120E1E' }}>
      {!hazir && !kapakHata && <Image source={{ uri: kapakAdresi(video.youtubeId) }} resizeMode="cover" onError={() => kapakHataAyarla(true)} accessibilityIgnoresInvertColors style={StyleSheet.absoluteFill} />}
      {!hazir && <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]} pointerEvents="none"><ActivityIndicator color="#fff" /></View>}
      {createElement('iframe', {
        src: `https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0`,
        title: video.baslik,
        allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
        allowFullScreen: true,
        referrerPolicy: 'strict-origin-when-cross-origin',
        onLoad: () => hazirAyarla(true),
        style: { position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0, display: 'block', backgroundColor: 'transparent', opacity: hazir ? 1 : 0, transition: 'opacity .25s' },
      })}
    </View>
  );
}

// Uygulama içi oynatıcı (yalnız web): YouTube'un resmî gömme oynatıcısı (youtube-nocookie). Pencere kapanınca iframe kalkar, video durur.
function VideoPenceresi({ video, son, kapat }: { video: PortalVideo | null; son: PortalVideo | null; kapat: () => void }) {
  const { width } = useWindowDimensions();
  const masa = width >= 760;
  const g = video ?? son;
  return (
    <Pencere acik={!!video} kapat={kapat} genislik={720} tamEkran>
      <View style={[{ backgroundColor: K.zemin }, !masa && { flex: 1 }]}>
        <View style={s.oynatUst}>
          <Text style={s.oynatKanal} numberOfLines={1}>{g?.kanal}</Text>
          <Bas onPress={kapat} etiket="Videoyu kapat" style={s.oynatKapat}><Ikon ad="kapat" boyut={20} renk={K.yazi} /></Bas>
        </View>
        <View style={s.oynatKutu}>
          {video && <OynaticiCerceve key={video.youtubeId} video={video} />}
        </View>
        <View style={s.oynatAlt}>
          <Text style={s.oynatBaslik}>{g?.baslik}</Text>
          <Text style={s.oynatKanalAlt}>{g?.kanal}</Text>
        </View>
      </View>
    </Pencere>
  );
}

// ================================================================ biçimler ================================================================
const s = StyleSheet.create({
  kok: { flex: 1, backgroundColor: K.zemin },
  sutun: { flex: 1, width: '100%', maxWidth: MAKS_GENISLIK, alignSelf: 'center' },
  govde: { flex: 1, minHeight: 0, overflow: 'hidden' },
  merkez: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 20 },
  bos: { alignItems: 'center', justifyContent: 'center', paddingVertical: 28, paddingHorizontal: 20 },
  bosYazi: { fontFamily: yazi.orta, fontSize: 14, color: K.soluk, textAlign: 'center' },
  tekrar: { minHeight: 44, paddingHorizontal: 20, borderRadius: 12, backgroundColor: K.vurgu, alignItems: 'center', justifyContent: 'center' },
  tekrarYazi: { fontFamily: yazi.kalin, fontSize: 14.5, color: K.zemin },
  kart: { borderRadius: 16, backgroundColor: K.kart, borderWidth: 1, borderColor: K.cizgi, overflow: 'hidden' },
  // üst
  ust: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 8 },
  geriDis: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  geriKutu: { width: 40, height: 40, borderRadius: 12, backgroundColor: K.kart, borderWidth: 1, borderColor: 'rgba(255,255,255,.08)', alignItems: 'center', justifyContent: 'center' },
  logo: { fontFamily: yazi.darKalin, fontSize: 28, lineHeight: 32, color: K.yazi, letterSpacing: 0.3 },
  sporKap: { flexDirection: 'row', backgroundColor: K.kart, borderWidth: 1, borderColor: K.cizgi2, borderRadius: 12, padding: 3, marginLeft: 2 },
  sporDugme: { height: 38, paddingHorizontal: 11, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  sporYazi: { fontFamily: yazi.kalin, fontSize: 13 },
  araDugme: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, borderColor: K.cizgi2, backgroundColor: K.kart, alignItems: 'center', justifyContent: 'center' },
  aramaKutu: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 14, marginBottom: 8, height: 44, borderRadius: 12, borderWidth: 1, borderColor: K.cizgi2, backgroundColor: K.kart },
  aramaGiris: { flex: 1, height: 44, paddingHorizontal: 14, fontFamily: yazi.normal, fontSize: 15, color: K.yazi },
  aramaTemizle: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  // şerit
  seritKap: { flexGrow: 0, flexShrink: 0 },
  seritIc: { paddingHorizontal: 14, paddingTop: 4, paddingBottom: 10, gap: 8 },
  seritMac: { flexDirection: 'row', alignItems: 'center', gap: 7, height: 44, paddingHorizontal: 12, borderRadius: 12, backgroundColor: K.kart, borderWidth: 1 },
  seritDk: { fontFamily: yazi.kalin, fontSize: 11, minWidth: 26 },
  seritTakim: { fontFamily: yazi.kalin, fontSize: 12.5, color: K.yazi },
  seritSkor: { fontFamily: yazi.dar, fontSize: 19, color: K.yazi, minWidth: 28, textAlign: 'center' },
  // sekmeler
  sekmeler: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: K.cizgi, paddingHorizontal: 6 },
  sekme: { flex: 1, height: 46, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 3 },
  sekmeYazi: { fontSize: 14 },
  altCubuk: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginHorizontal: 12, marginTop: 6, height: 66, borderRadius: 33, borderWidth: 1, borderColor: K.cizgi2, backgroundColor: K.kart, paddingHorizontal: 4 },
  altOge: { flex: 1, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', gap: 2, marginHorizontal: 2 },
  altYazi: { fontSize: 11.5 },
  // ortak yatay şerit / hap
  yatay: { flexGrow: 0, flexShrink: 0 },
  yatayIc: { paddingHorizontal: 14, paddingTop: 4, gap: 6 },
  filtreSatir: { flexDirection: 'row', gap: 6, paddingHorizontal: 14, paddingBottom: 2 },
  cipDis: { minHeight: 44, justifyContent: 'center' },
  cip: { height: 34, paddingHorizontal: 13, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cipYazi: { fontFamily: yazi.kalin, fontSize: 12.5 },
  // gündem
  gundem: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 6, gap: 10, flex: 1 },
  manset: { borderRadius: 18, overflow: 'hidden', backgroundColor: K.kart, borderWidth: 1, borderColor: K.cizgi },
  mansetDaire: { position: 'absolute', right: -60, top: -70, width: 230, height: 230, borderRadius: 115, borderWidth: 2, borderColor: 'rgba(198,244,50,0.12)' },
  mansetDaire2: { position: 'absolute', left: -90, bottom: -130, width: 300, height: 300, borderRadius: 150, borderWidth: 2, borderColor: 'rgba(198,244,50,0.08)' },
  mansetOk: { position: 'absolute', top: '50%', marginTop: -22, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.45)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', zIndex: 3 },
  mansetEtiket: { alignSelf: 'flex-start', flexShrink: 0, fontFamily: yazi.kalin, fontSize: 11, letterSpacing: 0.6, color: K.zemin, backgroundColor: K.vurgu, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, overflow: 'hidden' },
  mansetIc: { flex: 1, padding: 12, justifyContent: 'space-between' },
  noktalar: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', height: 22, marginTop: 2 },
  noktaKap: { minWidth: 44, height: 44, marginVertical: -11, alignItems: 'center', justifyContent: 'center' }, // dokunma alanı 44 px
  nokta: { width: 7, height: 7, borderRadius: 4, backgroundColor: K.cizgi2 },
  noktaSecili: { width: 18, backgroundColor: K.vurgu },
  mansetBaslik: { fontFamily: yazi.darKalin, color: '#fff' },
  mansetKaynak: { fontFamily: yazi.orta, fontSize: 12, color: K.orta },
  haber: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 46, paddingHorizontal: 12 },
  haberSaatKap: { width: 44, justifyContent: 'center' },
  haberSaat: { fontFamily: yazi.dar, fontSize: 14.5, color: K.vurgu },
  haberSaatUst: { fontFamily: yazi.normal, fontSize: 11, lineHeight: 12, color: K.soluk },
  haberBaslik: { flex: 1, fontFamily: yazi.normal, fontSize: 13, color: K.yazi },
  haberEtiket: { fontFamily: yazi.kalin, fontSize: 11, maxWidth: 84 },
  tumHaber: { minHeight: 44, alignItems: 'center', justifyContent: 'center', borderTopWidth: 1, borderTopColor: K.cizgi },
  tumHaberYazi: { fontFamily: yazi.orta, fontSize: 13, color: K.vurgu },
  koseKap: { gap: 6 },
  koseBasSatir: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2 },
  koseBaslik: { fontFamily: yazi.kalin, fontSize: 11, letterSpacing: 0.6, color: K.soluk },
  koseAlt: { fontFamily: yazi.normal, fontSize: 11, color: K.soluk },
  koseSatir: { flexDirection: 'row', gap: 8 },
  koseKart: { flex: 1, minWidth: 0, minHeight: 100, gap: 3, paddingHorizontal: 9, paddingVertical: 7, borderRadius: 14, borderWidth: 1, borderColor: K.cizgi, backgroundColor: K.kart },
  koseAd: { fontFamily: yazi.kalin, fontSize: 12.5, lineHeight: 15, color: K.yazi },
  koseRol: { fontFamily: yazi.normal, fontSize: 11, lineHeight: 13, color: K.soluk },
  koseYazi: { fontFamily: yazi.orta, fontSize: 11.5, lineHeight: 14, color: K.orta },
  gundemGenis: { flex: 1, minHeight: 0, flexDirection: 'row', gap: 16, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 8 },
  gundemSol: { flex: 1, minWidth: 0, minHeight: 0, gap: 10 },
  gundemSag: { flexGrow: 0, flexShrink: 0, width: '36%', minHeight: 0 },
  kisayollar: { flexDirection: 'row', gap: 8 },
  kisayol: { flex: 1, minHeight: 54, borderRadius: 14, borderWidth: 1, borderColor: K.cizgi, backgroundColor: K.kart, alignItems: 'center', justifyContent: 'center', gap: 2 },
  kisayolUst: { fontFamily: yazi.darKalin, fontSize: 19, lineHeight: 22 },
  kisayolAd: { fontFamily: yazi.orta, fontSize: 12, color: K.yazi },
  // maçlar
  gun: { width: 58, height: 50, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  gunUst: { fontFamily: yazi.kalin, fontSize: 13 },
  gunAlt: { fontFamily: yazi.normal, fontSize: 12 },
  ligBaslik: { flexDirection: 'row', alignItems: 'center', height: 44, paddingLeft: 12, paddingRight: 4, borderBottomWidth: 1, borderBottomColor: K.cizgi },
  ligBaslikYazi: { flex: 1, fontFamily: yazi.kalin, fontSize: 12, letterSpacing: 0.4, color: K.soluk },
  ligLink: { minWidth: 44, height: 44, paddingHorizontal: 8, alignItems: 'flex-end', justifyContent: 'center' }, // dokunma alanı 44 px
  ligLinkYazi: { fontFamily: yazi.normal, fontSize: 12, color: K.soluk },
  macSatir: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48, paddingHorizontal: 12, paddingVertical: 4 },
  macZaman: { width: 40, fontFamily: yazi.kalin, fontSize: 12 },
  macTakimlar: { flex: 1, gap: 4, minWidth: 0 },
  macTakim: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  macAd: { flexShrink: 1, fontFamily: yazi.normal, fontSize: 13, color: K.yazi },
  oda: { borderRadius: 5, borderWidth: 1, borderColor: 'rgba(198,244,50,.5)', paddingHorizontal: 5, paddingVertical: 1 },
  odaYazi: { fontFamily: yazi.kalin, fontSize: 11, letterSpacing: 0.5, color: K.vurgu },
  macSkor: { width: 28, alignItems: 'flex-end', gap: 2 },
  macSkorYazi: { fontFamily: yazi.dar, fontSize: 16, lineHeight: 18, color: K.orta },
  odalar: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginHorizontal: 14, marginTop: 2, marginBottom: 6, borderRadius: 12, borderWidth: 1, borderColor: K.cizgi2, backgroundColor: K.kart },
  odalarYazi: { fontFamily: yazi.kalin, fontSize: 13.5, color: K.yazi },
  // lig
  ayirici: { flexDirection: 'row', marginHorizontal: 14, marginBottom: 10, marginTop: 2, backgroundColor: K.kart, borderWidth: 1, borderColor: K.cizgi2, borderRadius: 12, padding: 3 },
  ayiriciDugme: { flex: 1, height: 38, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  ayiriciYazi: { fontFamily: yazi.kalin, fontSize: 13 },
  puanBas: { flexDirection: 'row', alignItems: 'center', height: 28, paddingLeft: 12, paddingRight: 20 },
  puanBasYazi: { fontFamily: yazi.normal, fontSize: 11, letterSpacing: 0.4, color: K.soluk },
  puanSatir: { flexDirection: 'row', alignItems: 'center', height: 40, paddingLeft: 12, paddingRight: 20, borderTopWidth: 1, borderTopColor: K.ince },
  puanSerit: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  puanHucre: { fontFamily: yazi.normal, fontSize: 13, color: K.yazi },
  puanTakim: { flex: 1, fontFamily: yazi.orta, fontSize: 13, color: K.yazi },
  puanP: { width: 32, textAlign: 'right', fontFamily: yazi.dar, fontSize: 17, color: K.yazi },
  form: { width: 62, flexDirection: 'row', gap: 2, justifyContent: 'center' },
  formKare: { width: 10, height: 10, borderRadius: 3 },
  kral: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  kralSira: { width: 16, fontFamily: yazi.dar, fontSize: 16, color: K.soluk },
  kralUst: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  kralAd: { flex: 1, fontFamily: yazi.normal, fontSize: 13, color: K.yazi },
  kralDeger: { fontFamily: yazi.darKalin, fontSize: 18, color: K.yazi },
  kralCubuk: { height: 5, borderRadius: 3, backgroundColor: K.cizgi, marginTop: 5, overflow: 'hidden' },
  kralDolgu: { height: 5, backgroundColor: K.vurgu },
  krallikBaslik: { fontFamily: yazi.kalin, fontSize: 12, letterSpacing: 0.6, color: K.soluk },
  // transfer
  transfer: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 64, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, backgroundColor: K.kart, borderWidth: 1, borderColor: K.cizgi },
  transferBaslik: { fontFamily: yazi.orta, fontSize: 14, lineHeight: 18, color: K.yazi },
  transferAlt: { fontFamily: yazi.normal, fontSize: 12, color: K.soluk, marginTop: 2 },
  rozet: { paddingHorizontal: 7, paddingVertical: 4, borderRadius: 6 },
  rozetYazi: { fontFamily: yazi.kalin, fontSize: 11 },
  // video
  videolar: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', columnGap: 12, rowGap: 12, paddingHorizontal: 14, paddingTop: 12, paddingBottom: LISTE_ALT }, // 03.11: son satırda boşluk kalmasın (space-between değil)
  videoKart: { width: '47.5%', gap: 6 },
  videoKapak: { width: '100%', aspectRatio: 16 / 9, borderRadius: 12, overflow: 'hidden', backgroundColor: K.cizgi, alignItems: 'center', justifyContent: 'center' },
  oynatDaire: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(7,9,13,0.66)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.55)', alignItems: 'center', justifyContent: 'center', paddingLeft: 2 },
  videoBaslik: { fontFamily: yazi.orta, fontSize: 13, lineHeight: 17, color: K.yazi },
  videoKanal: { fontFamily: yazi.normal, fontSize: 12, color: K.soluk },
  // oynatıcı penceresi
  oynatUst: { flexDirection: 'row', alignItems: 'center', paddingLeft: 16, paddingRight: 4, minHeight: 52 },
  oynatKanal: { flex: 1, fontFamily: yazi.kalin, fontSize: 14, color: K.vurgu },
  oynatKapat: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  oynatKutu: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' },
  oynatAlt: { paddingHorizontal: 16, paddingVertical: 14, gap: 4 },
  oynatBaslik: { fontFamily: yazi.kalin, fontSize: 16, lineHeight: 21, color: K.yazi },
  oynatKanalAlt: { fontFamily: yazi.orta, fontSize: 13, color: K.soluk },
});
