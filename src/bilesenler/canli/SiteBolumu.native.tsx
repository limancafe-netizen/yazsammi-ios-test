// Astroloji ve Tarot Kart Analizi telefonda (04.11): sitenin /astroloji/ ve /tarot/ sayfaları uygulamanın içinde WebView ile, gerçek ekran olarak.
//
// Neden yerel paket değil, site adresi: iki bölüm ~18 MB (78 kart yüzü, gökyüzü verisi, three.js) ve onlarca ayrı dosya. Yerel pakette her dosya
// expo-asset ile tek tek tanımlanmalı, Android'de file:// altında göreli yollar ve localStorage kaynağı (origin) sorun çıkarır, her metin düzeltmesi
// mağaza güncellemesi ister. Site adresinde sayfa sitedekiyle birebir aynı, düzeltme dağıtımla anında gelir, localStorage kaynağı (yazsammi.com)
// sabit kalır (okumalarım, doğum bilgisi, hak sayısı korunur). Satın alma zaten sunucu doğrulaması istediği için ağ gerekiyordu; ağ yoksa
// "Bağlantı yok" ekranı ve "Yeniden dene" çıkar. Ödeme yalnız uygulamada: sayfa sitede "Uygulamada aç" gösterir, burada köprüyle (site/*/js/kopru.js)
// satın alma düğmesine döner; düğme → useSatin (satin.ts: Google Play → SUNUCU doğrular) → sayfaya hak yazılır.
//
// Geri: Android geri tuşu önce sayfanın içinde bir adım geri gider (açık kart ayrıntısı, alt sayfa), bölümün ana ekranındaysa Canlı'ya döner.
// Sayfanın sol üstteki "ana sayfaya dön" oku da Canlı'ya döner. Güvenli alan: WebView çentik ve alt çubuk payı içinde durur; sayfanın kendi alt
// menüsü (Gökyüzü · Haritam · Aşk uyumu / Tarot · Açılımlar · Okumalarım) altta kalır, uygulamanın alt sekmeleri bu ekranda gizlenir.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { yazi } from '@/tema/tema';
import { useSatin, TUM_URUNLER } from '@/kahin/satin';
import { ODEME_VAR } from '@/kahin/odeme';
import * as M from '@/magaza/yonetici';
import * as C from '@/canli';
import { iyiAnBildir } from '@/bildirim/iyiAn';
import { hakSonucYap, kopruMesaji, sayfaHaklari, sayfaPlus, type Onay } from '@/magaza/mantik';
import { useTema } from '@/tema/TemaSaglayici';
import { useCanli } from './baglam';

export type SiteBolumAd = 'astroloji' | 'tarot' | 'ekonomi' | 'oyun';
const AD: Record<SiteBolumAd, string> = { astroloji: 'Astroloji', tarot: 'Tarot Kart Analizi', ekonomi: 'Ekonomi', oyun: 'Oyun' };
const IZINLI_YOL = ['/astroloji', '/tarot', '/ekonomi', '/oyun']; // bölüm sayfaları uygulamanın içinde açılır (06.11: Ekonomi ve Oyun eklendi; eskiden Chrome'a atıyordu)
const SITE = 'https://yazsammi.com';
const ZEMIN = '#04050c'; // iki sayfanın gece rengi (yüklenirken beyaz parlama olmasın)
const SATIN_URUN: Record<string, SiteBolumAd> = { kahin_okuma_1: 'tarot', astro_harita: 'astroloji', astro_uyum: 'astroloji' };

export function SiteBolumu({ bolum, yol = '' }: { bolum: SiteBolumAd; yol?: string }) {
  const c = useCanli();
  const { r, secim } = useTema();
  const ek = useSafeAreaInsets();
  const web = useRef<WebView>(null);
  const [hata, hataAyarla] = useState(false);
  const [yuk, yukAyarla] = useState(true);
  const [anahtar, anahtarAyarla] = useState(0);
  const girisli = !!c.uye && !c.uye.yeni && !c.uye.sozGerekli; // 1.7.1 (S-3 E1): sözleşme onayı bekleyen üye tam üye sayılmaz (para alınır ama sunucu 403 soz_gerekli döner)
  const adres = `${SITE}/${bolum}/${yol}`;
  // Ekonomi ve Oyun uygulamanın gece/gündüz seçimini izler (Astroloji/Tarot hep gece); WebView'ın yazsammi.com deposuna yazılır, sayfa boyanmadan okur
  const temali = bolum === 'ekonomi' || bolum === 'oyun';
  const zemin = temali ? r.sis : ZEMIN;
  const geriVar = useRef(false); // sayfada WebView geçmişinde geri gidilecek yer var mı (köprüsüz sayfalar: Oyun, Ekonomi)

  // sayfaya mesaj (kopru.js: window.yazsammiUygulamaMesaj)
  const yolla = useCallback((m: object) => {
    web.current?.injectJavaScript(`window.yazsammiUygulamaMesaj&&window.yazsammiUygulamaMesaj(${JSON.stringify(m)});true;`);
  }, []);

  // --- ödeme: satin.ts akışı. Sunucu doğrulayınca sayfaya {tur:'hak', urun}; iptal / hata olursa {tur:'satinBitti', mesaj}. ---
  const bekliyor = useRef(false);
  const hakYaz = useCallback((urun: string) => {
    // bekleyen (önceki oturumdan kalmış) satın almalar da buraya düşer; ürün başka bölümünse o bölüm açılınca değil, şimdi sayılır (aynı kaynak: yazsammi.com)
    bekliyor.current = false;
    yolla({ tur: 'hak', urun });
  }, [yolla]);
  const satin = useSatin(girisli, hakYaz, c.tost);
  const mg = M.useMagaza(); // iOS: satın alma ve mağaza fiyatları src/magaza/'dan (diğer platformlarda boş)
  const IOS = M.MAGAZA_VAR; // yeni mağaza akışı (src/magaza/): iOS; Android yalnız androidAyar.ts bayrağı açıkken (adı eski: "IOS" = sunucu hakkı + mağaza yolu)
  // iOS (18.11): sayfadaki hak SUNUCUDAN (satın alınan + Plus); cihazda sayılmaz. Hak sayıları değişince ve sayfa yüklenince sayfaya itilir (yalnız gösterim önbelleği).
  const sayfaHak = useMemo(() => ({ haklar: sayfaHaklari(mg.haklar), plus: sayfaPlus(mg.haklar) }), [mg.haklar]);
  const sayfaHakRef = useRef(sayfaHak);
  sayfaHakRef.current = sayfaHak;
  const sayfaYuklendi = useRef(false);
  const haklariItele = useCallback(() => { if (IOS && sayfaYuklendi.current) yolla({ tur: 'haklar', ...sayfaHakRef.current }); }, [IOS, yolla]);
  useEffect(() => { if (IOS && girisli) void M.haklariTazele(); }, [IOS, girisli]);
  useEffect(() => { if (mg.haklarYuklendi) haklariItele(); }, [sayfaHak, mg.haklarYuklendi, haklariItele]);
  const oncekiYuk = useRef(false);
  useEffect(() => {
    if (oncekiYuk.current && !satin.yuk && bekliyor.current) {
      bekliyor.current = false;
      yolla({ tur: 'satinBitti', mesaj: satin.hata });
    }
    oncekiYuk.current = satin.yuk;
  }, [satin.yuk, satin.hata, yolla]);
  // Play fiyatları gelince sayfadaki düğmelere yazılır
  const urunler = useMemo(() => (IOS ? mg.urunler.filter((u) => u.satilabilir) : satin.urunler).filter((u) => SATIN_URUN[u.id] === bolum).map((u) => ({ id: u.id, fiyat: u.fiyat })), [satin.urunler, mg.urunler, bolum]);
  useEffect(() => { if (urunler.length) yolla({ tur: 'urunler', urunler }); }, [urunler, yolla]);

  const satinIste = (urun: string, onay?: Onay) => {
    if (!TUM_URUNLER.includes(urun) || SATIN_URUN[urun] !== bolum) return yolla({ tur: 'satinBitti', mesaj: '' });
    if (!onay) return yolla({ tur: 'satinBitti', mesaj: 'Önce onay kutusunu işaretle.' }); // cayma hakkı onayı olmadan satın alma başlamaz (Şartlar 2.3 md 9.6)
    if (!ODEME_VAR) return yolla({ tur: 'satinBitti', mesaj: 'Bu cihazda satın alma henüz açık değil.' });
    if (!girisli) {
      c.girisIste('Satın almak için giriş yap', () => {});
      return yolla({ tur: 'satinBitti', mesaj: 'Satın almak için önce giriş yap.' });
    }
    if (IOS) {
      // iOS (18.11): StoreKit 2 → sunucu doğrular → ancak o zaman sayfaya hak yazılır
      void M.satinAlVeBekle(urun, onay).then((x) => yolla(x.durum === 'tamam' ? { tur: 'hak', urun } : { tur: 'satinBitti', mesaj: x.mesaj }));
      return;
    }
    if (satin.neden) return yolla({ tur: 'satinBitti', mesaj: "Google Play'e bağlanılamadı. Biraz sonra yeniden dene." });
    bekliyor.current = true;
    satin.satinAlTikla(urun, onay);
  };

  // iOS: sayfa hakkını sunucudan düşürmek ister (POST /c/magaza/hak-kullan); sonuç sayfaya {tur:'hakSonuc'} gider, hak yoksa sayfa kendi satın alma / Plus düğmesini gösterir
  const hakKullan = async (id: string, hak: 'tarot' | 'harita' | 'uyum', anahtar?: string) => {
    if (!girisli) {
      c.girisIste('Hakkını kullanmak için giriş yap', () => {});
      return yolla(hakSonucYap(id, { ok: false, durum: 401 }));
    }
    const r = await C.magazaHakKullan(hak, anahtar);
    yolla(hakSonucYap(id, r));
    void M.haklariTazele();
  };
  const mesaj = (ev: WebViewMessageEvent) => {
    const m = kopruMesaji(ev.nativeEvent.data);
    if (!m) return;
    if (m.tur === 'satin') satinIste(m.urun, m.onay);
    else if (m.tur === 'geri') c.geri();
    else if (m.tur === 'bolumKazanildi') iyiAnBildir(); // Oyun: bölüm kazanılınca nazik bildirim kartı için "iyi an"
    else if (m.tur === 'hakKullan' && IOS) void hakKullan(m.id, m.hak, m.anahtar);
    else if (m.tur === 'plus' && IOS) { if (girisli) M.plusAc(); else c.girisIste('Plus için giriş yap', () => {}); }
  };
  const gezinme = (n: { canGoBack: boolean }) => { geriVar.current = n.canGoBack; };

  // --- geri tuşu (Android): sayfa karar verir (kopru.js geri()); sayfa yüklenmediyse doğrudan Canlı'ya ---
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const a = BackHandler.addEventListener('hardwareBackPress', () => {
      if (hata || yuk) c.geri();
      else if (bolum === 'oyun' || bolum === 'ekonomi') { if (geriVar.current) web.current?.goBack(); else c.geri(); } // Oyun ve Ekonomi sayfalarında köprü yok: WebView geçmişi (Ekonomi'nin alt sayfaları history.pushState ile açılır)
      else yolla({ tur: 'geri' });
      return true;
    });
    return () => a.remove();
  }, [hata, yuk, c.geri, yolla, bolum]);

  // --- gezinme: bölüm sayfaları içeride; ana sayfa ("/", "/canli") Canlı'ya döner; geri kalan her şey (Play, tel:, başka sayfa) dışarıda ---
  const izin = (r: ShouldStartLoadRequest) => {
    const u = r.url || '';
    if (u.startsWith('about:') || u.startsWith('data:') || u.startsWith('blob:')) return true;
    if (r.isTopFrame === false) return true; // sayfanın içindeki çerçeveler
    let yolAd = '';
    try {
      const x = new URL(u);
      if (x.origin !== SITE) { Linking.openURL(u).catch(() => {}); return false; }
      yolAd = x.pathname;
    } catch {
      Linking.openURL(u).catch(() => {});
      return false;
    }
    if (IZINLI_YOL.some((y) => yolAd === y || yolAd.startsWith(y + '/'))) return true;
    if (yolAd === '/' || yolAd === '' || yolAd.startsWith('/canli')) { c.geri(); return false; }
    Linking.openURL(u).catch(() => {});
    return false;
  };

  // sayfa yüklenmeden önce: uygulamada olduğunu, platformu ve bilinen fiyatları bildir (kopru.js okur)
  const tema = secim === 'gunduz' ? 'gunduz' : 'gece'; // uygulama 'otomatik'te gece açılır (TemaSaglayici geceMi): sayfa da aynı
  const once = `window.YAZSAMMI_UYGULAMA=${JSON.stringify({ platform: Platform.OS, odeme: ODEME_VAR, urunler, ...(IOS ? { hakKaynak: 'sunucu', ...sayfaHak } : {}) })};${temali ? `try{localStorage.setItem('yazsammi.tema',${JSON.stringify(tema)})}catch(e){}` : ''}true;`;

  return (
    <View style={[s.kap, { backgroundColor: zemin, paddingTop: ek.top, paddingBottom: ek.bottom, paddingLeft: ek.left, paddingRight: ek.right }]}>
      {hata ? (
        <View style={s.orta}>
          <Text style={s.baslik}>Bağlantı yok</Text>
          <Text style={s.alt}>{AD[bolum]} açılamadı. İnternet bağlantını kontrol edip yeniden dene.</Text>
          <Pressable onPress={() => { hataAyarla(false); yukAyarla(true); anahtarAyarla((k) => k + 1); }} accessibilityRole="button" style={({ pressed }) => [s.dugme, pressed && { opacity: 0.8 }]}>
            <Text style={s.dugmeYazi}>Yeniden dene</Text>
          </Pressable>
          <Pressable onPress={c.geri} accessibilityRole="button" style={s.metinDugme}>
            <Text style={s.metinDugmeYazi}>Geri dön</Text>
          </Pressable>
        </View>
      ) : (
        <WebView
          key={anahtar}
          ref={web}
          source={{ uri: adres }}
          style={{ flex: 1, backgroundColor: zemin }}
          containerStyle={{ backgroundColor: zemin }}
          onNavigationStateChange={gezinme}
          originWhitelist={['https://*', 'about:*', 'data:*', 'blob:*']}
          injectedJavaScriptBeforeContentLoaded={once}
          onMessage={mesaj}
          onShouldStartLoadWithRequest={izin}
          setSupportMultipleWindows={false}
          onOpenWindow={(e) => Linking.openURL(e.nativeEvent.targetUrl).catch(() => {})}
          onLoadEnd={() => { yukAyarla(false); sayfaYuklendi.current = true; haklariItele(); }}
          onError={() => hataAyarla(true)}
          onHttpError={(e) => { if (e.nativeEvent.statusCode >= 500 || e.nativeEvent.statusCode === 404) hataAyarla(true); }}
          onRenderProcessGone={() => anahtarAyarla((k) => k + 1)}
          onContentProcessDidTerminate={() => web.current?.reload()}
          domStorageEnabled
          javaScriptEnabled
          allowsBackForwardNavigationGestures
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction
          overScrollMode="never"
          bounces={false}
          pullToRefreshEnabled={false}
          textZoom={100}
          webviewDebuggingEnabled={__DEV__}
        />
      )}
      {yuk && !hata && (
        <View style={[StyleSheet.absoluteFill, s.orta]} pointerEvents="none">
          <ActivityIndicator color="#e8c77a" />
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  kap: { flex: 1, backgroundColor: ZEMIN },
  orta: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 10, backgroundColor: ZEMIN },
  baslik: { fontFamily: yazi.kalin, fontSize: 20, color: '#f6efe0' },
  alt: { fontFamily: yazi.normal, fontSize: 15, lineHeight: 22, color: '#a7b2d6', textAlign: 'center', maxWidth: 320 },
  dugme: { marginTop: 8, paddingHorizontal: 26, paddingVertical: 13, borderRadius: 999, backgroundColor: '#e8c77a' },
  dugmeYazi: { fontFamily: yazi.kalin, fontSize: 15.5, color: '#1a1405' },
  metinDugme: { paddingHorizontal: 16, paddingVertical: 10 },
  metinDugmeYazi: { fontFamily: yazi.orta, fontSize: 14.5, color: '#a7b2d6' },
});
