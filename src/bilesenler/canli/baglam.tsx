// Canlı akışın ortak durumu: gönderiler (tek harita), oturum, ekran geçişleri, giriş isteme, iyimser beğeni ve oy.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, AppState, Easing, Platform, Share, StyleSheet, Text, View } from 'react-native';
import * as C from '@/canli';
import type { Gonderi, Uye, Yazar, Yorum } from '@/canli';
import { yazi } from '@/tema/tema';
import { KAHIN_ACIK, TRIBUN_ACIK, useRenk, YEREL_SURUCU } from './ortak';
import { bildirimSesi } from '@/bildirimSesi';
import { oyGirisGerek, oyKarari } from '@/oy';
import { TRIBUN_NEDEN, beklemeKaydi, beklemeSil, tribunMacIzni } from '@/uyelik';

export type Ekran = { tur: 'akis' } | { tur: 'zil' } | { tur: 'profil'; ad: string } | { tur: 'gonderi'; id: string; yaz?: boolean } | { tur: 'mesajlar'; sekme?: 'sohbet' | 'istek' } | { tur: 'sohbet'; id: string } | { tur: 'ayarlar' } | { tur: 'tribun' } | { tur: 'tribunTakvim' } | { tur: 'tribunMac'; id: string } | { tur: 'tribunDetay'; lig: string; id: string } | { tur: 'tribunKose'; id: string } | { tur: 'ekonomi' } | { tur: 'oyun' } | { tur: 'astroloji'; yol?: string } | { tur: 'kahin' };
export type GirisNedeni = string;
// Yeniden paylaş (#5): paylaşılacak marka içeriği — gönderi ya da markanın cevabı (yorum). sonra: paylaşım olunca çağıran ekranı günceller.
export type PaylasHedef = { tur: 'gonderi'; g: Gonderi; sonra?: () => void } | { tur: 'yorum'; y: Yorum; gonderiId: string; sonra?: () => void };

type Deger = {
  uye: Uye | null;
  uyeAyarla: (u: Uye | null) => void;
  harita: Record<string, Gonderi>;
  koy: (liste: Gonderi[]) => void;
  guncelle: (id: string, f: (g: Gonderi) => Partial<Gonderi>) => void;
  gizli: Set<string>;
  gizle: (id: string) => void;
  begen: (id: string) => void;
  oy: (id: string, i: number) => void;
  girisIste: (neden: GirisNedeni, sonra?: () => void) => boolean;
  ekran: Ekran;
  git: (e: Ekran) => void;
  geri: () => void;
  yaziciAc: () => void;
  bildirAc: (id: string) => void;
  paylas: (g: Gonderi) => void;
  paylasAc: (h: PaylasHedef) => void; // "Paylaş" menüsü: Akışımda paylaş / Bağlantıyı paylaş
  yenidenAc: (h: PaylasHedef) => void; // yeniden paylaşım penceresi (giriş ister; zaten paylaşıldıysa uyarır)
  tost: (m: string) => void;
  zilSayi: number;
  zilSayiAyarla: (n: number) => void;
  burada: number | null;
  buradaAyarla: (n: number | null) => void;
  yeniGonderi: Gonderi | null;
  yeniGonderiAyarla: (g: Gonderi | null) => void;
  mesajSayi: number;
  mesajSayiAyarla: (n: number) => void;
  // Kutlanmamış yeni rozet sayısı (sunucu /c/yeni ve /c/ben söyler; KazanmaAni kartı açar) + üyelik bilgisini (vitrin vb.) tazele.
  rozetYeni: number;
  rozetYeniAyarla: (n: number) => void;
  rozetSurum: number; // kazanma anı kapanınca artar: profildeki raf yenilenir ("yeni" etiketleri kalkar)
  benTazele: () => void;
  // Akışta okunmamış yeni gönderi sayısı (alt menüde Canlı ikonunun "yeni" noktası; başka sekmedeyken görünür).
  akisYeni: number;
  akisYeniAyarla: (n: number) => void;
  istekAc: (kisi: Yazar, yeniHesap?: boolean) => void;
  mesajAyarAc: () => void;
  // sayfa içi sayfalar (giriş, bildir, yazıcı, mesaj isteği, mesaj ayarları) — sağlayıcı çizer
  pencere: { tur: 'giris'; neden: string; mod?: 'giris' | 'uye' } | { tur: 'ad' } | { tur: 'adsiz' } | { tur: 'soz' } | { tur: 'bildir'; id: string } | { tur: 'yazici' } | { tur: 'istek'; kisi: Yazar; yeniHesap?: boolean } | { tur: 'mesajAyar' } | { tur: 'paylas'; hedef: PaylasHedef } | { tur: 'yeniden'; hedef: PaylasHedef } | null;
  pencereKapat: () => void;
  girisTamam: (u: Uye) => void;
  girisAc: (mod: 'giris' | 'uye') => void; // 19.11: alt şerit düğmeleri: giriş penceresini Giriş yap / Üye ol sekmesi seçili aç (adı boş eski oturumda da)
  kayitTamamla: () => void; // 19.11: yarım kalmış (takma adsız) oturum için kayıt formunu AÇIKÇA aç
};

const Baglam = createContext<Deger | null>(null);
// KASMA (18.11): kartlar yalnız eylemleri kullanır. Ana bağlam her ekran geçişinde / 15 sn'lik yoklamada değiştiği için tüm kartlar yeniden çiziliyordu;
// eylemler ayrı ve sabit bir bağlamda → kart yalnız kendi verisi değişince çizilir.
type Eylem = Pick<Deger, 'begen' | 'oy' | 'git' | 'paylas' | 'bildirAc' | 'paylasAc'>;
const EylemBaglam = createContext<Eylem | null>(null);
export function useCanliEylem() {
  const d = useContext(EylemBaglam);
  if (!d) throw new Error('useCanliEylem, CanliSaglayici içinde kullanılmalı');
  return d;
}
export function useCanli() {
  const d = useContext(Baglam);
  if (!d) throw new Error('useCanli, CanliSaglayici içinde kullanılmalı');
  return d;
}

// Adres çubuğu ile ekran eşleşmesi (web): /canli, /canli?g=ID, /canli?profil=ad, /canli?zil=1. Geri tuşu çalışır.
function adrestenEkran(): Ekran {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return { tur: 'akis' };
  const a = new URLSearchParams(window.location.search);
  if (a.get('g')) return { tur: 'gonderi', id: a.get('g')! };
  if (a.get('profil')) return { tur: 'profil', ad: a.get('profil')! };
  if (a.get('zil')) return { tur: 'zil' };
  if (a.get('ayarlar')) return { tur: 'ayarlar' };
  if (a.get('mac')) return { tur: 'tribunMac', id: a.get('mac')! };
  if (a.get('takvim')) return { tur: 'tribunTakvim' };
  const tm = /^([A-Za-z0-9._-]{1,24}):([A-Za-z0-9_-]{1,24})$/.exec(a.get('tmac') ?? '');
  if (tm) return { tur: 'tribunDetay', lig: tm[1], id: tm[2] };
  const km = /^[A-Za-z0-9_-]{1,40}$/.exec(a.get('kose') ?? '');
  if (km) return { tur: 'tribunKose', id: km[0] };
  if (a.get('tribun')) return { tur: 'tribun' };
  if (a.get('ekonomi')) return { tur: 'ekonomi' };
  if (a.get('astroloji')) return { tur: 'astroloji' };
  if (a.get('kahin') && KAHIN_ACIK) return { tur: 'kahin' }; // 03.11: web'de KAHİN kapalıyken ?kahin=1 akışa düşer
  if (a.get('sohbet')) return { tur: 'sohbet', id: a.get('sohbet')! };
  if (a.get('mesajlar')) return { tur: 'mesajlar', sekme: a.get('mesajlar') === 'istek' ? 'istek' : 'sohbet' };
  return { tur: 'akis' };
}
function ekranAdresi(e: Ekran) {
  const a = new URLSearchParams(window.location.search);
  ['g', 'profil', 'zil', 'sohbet', 'mesajlar', 'ayarlar', 'tribun', 'takvim', 'mac', 'tmac', 'kose', 'ekonomi', 'astroloji', 'kahin'].forEach((k) => a.delete(k));
  if (e.tur === 'gonderi') a.set('g', e.id);
  if (e.tur === 'profil') a.set('profil', e.ad);
  if (e.tur === 'zil') a.set('zil', '1');
  if (e.tur === 'ayarlar') a.set('ayarlar', '1');
  if (e.tur === 'tribun') a.set('tribun', '1');
  if (e.tur === 'ekonomi') a.set('ekonomi', '1');
  if (e.tur === 'astroloji') a.set('astroloji', '1');
  if (e.tur === 'kahin') a.set('kahin', '1');
  if (e.tur === 'tribunTakvim') a.set('takvim', '1');
  if (e.tur === 'tribunMac') a.set('mac', e.id);
  if (e.tur === 'tribunDetay') a.set('tmac', `${e.lig}:${e.id}`);
  if (e.tur === 'tribunKose') a.set('kose', e.id);
  if (e.tur === 'sohbet') a.set('sohbet', e.id);
  if (e.tur === 'mesajlar') a.set('mesajlar', e.sekme === 'istek' ? 'istek' : '1');
  const s = a.toString();
  return `${window.location.pathname}${s ? `?${s}` : ''}`;
}

export function CanliSaglayici({ children }: { children: ReactNode }) {
  const [uye, uyeAyarla] = useState<Uye | null>(() => C.kayitliUye());
  const [harita, haritaAyarla] = useState<Record<string, Gonderi>>({});
  const [gizli, gizliAyarla] = useState<Set<string>>(new Set());
  // Tribün (Onur 07.11, "ilk sonuç serbest, ikincisinde üyelik"): adresten ikinci bir maç odası açılırsa oda yerine Tribün ana ekranı açılır, giriş penceresi çıkar.
  const kapiBekleyen = useRef<Ekran | null>(null);
  const [ekran, ekranAyarla] = useState<Ekran>(() => {
    const e = adrestenEkran();
    if (e.tur === 'tribunMac' && !tribunMacIzni(e.id)) {
      kapiBekleyen.current = e;
      return { tur: 'tribun' };
    }
    return e;
  });
  const [pencere, pencereAyarla] = useState<Deger['pencere']>(null);
  const [zilSayi, zilSayiAyarla] = useState(0);
  const [mesajSayi, mesajSayiAyarla] = useState(0);
  const [rozetYeni, rozetYeniAyarla] = useState(0);
  const [rozetSurum, rozetSurumAyarla] = useState(0);
  const [akisYeni, akisYeniAyarla] = useState(0);
  const [burada, buradaAyarla] = useState<number | null>(null);
  const [yeniGonderi, yeniGonderiAyarla] = useState<Gonderi | null>(null);
  const [tostMetni, tostAyarla] = useState<string | null>(null);
  const bekleyen = useRef<(() => void) | null>(null);
  const haritaRef = useRef(harita);
  haritaRef.current = harita;
  const yigin = useRef(0);

  // Yeni zil ya da mesaj (sayı arttı): kısa ses / titreşim. Açılıştaki ilk sayılar (ilk 6 sn) ses çıkarmaz.
  const sayiOnce = useRef({ z: 0, m: 0, t: Date.now() });
  useEffect(() => {
    sayiOnce.current = { z: 0, m: 0, t: Date.now() };
  }, [uye?.uid]);
  useEffect(() => {
    const o = sayiOnce.current;
    const artti = zilSayi > o.z || mesajSayi > o.m;
    sayiOnce.current = { ...o, z: zilSayi, m: mesajSayi };
    if (artti && uye && !uye.yeni && Date.now() - o.t > 6000) bildirimSesi();
  }, [zilSayi, mesajSayi]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    // Tarayıcının geri/ileri tuşu: uygulama içi geçmiş sayacı da adresle eşitlenir (yoksa iç "geri" siteden çıkarabiliyordu).
    const f = (ev: PopStateEvent) => {
      yigin.current = typeof ev.state?.canli === 'number' ? ev.state.canli : 0;
      const e = adrestenEkran();
      ekranAyarla(e.tur === 'tribunMac' && !tribunMacIzni(e.id) ? { tur: 'tribun' } : e);
    };
    window.addEventListener('popstate', f);
    return () => window.removeEventListener('popstate', f);
  }, []);

  const koy = useCallback((liste: Gonderi[]) => {
    haritaAyarla((h) => {
      const y = { ...h };
      for (const g of liste) y[g.id] = g;
      return y;
    });
  }, []);
  const guncelle = useCallback((id: string, f: (g: Gonderi) => Partial<Gonderi>) => {
    haritaAyarla((h) => (h[id] ? { ...h, [id]: { ...h[id], ...f(h[id]) } } : h));
  }, []);
  const tost = useCallback((m: string) => tostAyarla(m), []);

  const girisIste = useCallback(
    (neden: string, sonra?: () => void) => {
      if (uye && !uye.yeni && !uye.sozGerekli && C.oturumVar()) return true;
      bekleyen.current = sonra ?? null;
      pencereAyarla(uye?.sozGerekli && !uye.yeni && C.oturumVar() ? { tur: 'soz' } : { tur: 'giris', neden }); // 19.11: takma adı olmayan eski oturum kendiliğinden kayıt formu AÇMAZ; giriş ekranı gelir ("Kaydımı tamamla" bağlantısı orada)
      return false;
    },
    [uye],
  );
  // Açılış sayfası (22.10, kod/site/acilis): figür seçildikten sonra "Kayıt ol / Giriş yap" bu giriş penceresini açar
  // ('yazsammi:giris-ac'). Giriş bitince figür "Hoş geldin, <ad>!" der ('yazsammi:giris-tamam'); pencere girişsiz kapanırsa
  // açılış kapanır ('yazsammi:giris-kapandi'). Açılış uygulamadan önce yüklenir: erken tıklama window.__acilisIstek'te bekler.
  const acilisBekliyor = useRef(false);
  const acilisaYolla = (ad: string, detay?: object) => {
    if (Platform.OS === 'web') window.dispatchEvent(new CustomEvent(ad, { detail: detay }));
  };
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const ac = (e?: Event) => {
      const tur = (e as CustomEvent | undefined)?.detail?.tur ?? (window as any).__acilisIstek;
      (window as any).__acilisIstek = null;
      const u = C.kayitliUye();
      if (u && !u.yeni && !u.sozGerekli && C.oturumVar()) return acilisaYolla('yazsammi:giris-tamam', { ad: u.ad });
      acilisBekliyor.current = true;
      bekleyen.current = null;
      pencereAyarla(u?.sozGerekli && !u.yeni && C.oturumVar() ? { tur: 'soz' } : { tur: 'giris', neden: tur === 'giris' ? 'Hesabınla devam et' : 'Yazsam mı?’ya katıl' });
    };
    window.addEventListener('yazsammi:giris-ac', ac);
    if ((window as any).__acilisIstek) ac();
    return () => window.removeEventListener('yazsammi:giris-ac', ac);
  }, []);
  useEffect(() => {
    if (!pencere && acilisBekliyor.current) {
      acilisBekliyor.current = false;
      acilisaYolla('yazsammi:giris-kapandi');
    }
  }, [pencere]);

  // Açılışta benGetir ile gelen, güncel sözleşme sürümünü onaylamamış üyeye onay penceresi açılır (başka pencere açıksa dokunulmaz).
  useEffect(() => {
    if (uye && !uye.yeni && uye.sozGerekli && C.oturumVar()) pencereAyarla((p) => p ?? { tur: 'soz' });
  }, [uye?.uid, uye?.sozGerekli]);

  const girisTamam = useCallback((u: Uye) => {
    uyeAyarla(u);
    if (u.yeni) {
      pencereAyarla(u.adsizEski ? { tur: 'adsiz' } : { tur: 'ad' }); // 19.11: yeni kayıt değilse (adı boş e-posta hesabı) önce durum açıklanır; takma ad formu yalnız yeni kayıtta/isteyene
      return;
    }
    if (u.sozGerekli) {
      pencereAyarla({ tur: 'soz' });
      return;
    }
    if (acilisBekliyor.current) {
      // selamı açılıştaki figür verir (kısa yazı çıkmaz)
      acilisBekliyor.current = false;
      acilisaYolla('yazsammi:giris-tamam', { ad: u.ad });
      pencereAyarla(null);
      return;
    }
    pencereAyarla(null);
    tostAyarla(`Hoş geldin, ${u.ad}`);
    const f = bekleyen.current;
    bekleyen.current = null;
    if (f) setTimeout(f, 250);
  }, []);

  // Adresle açılan ikinci maç odası: Tribün ana ekranına düşmüştü, şimdi giriş penceresi açılır (giriş olunca oda açılır).
  useEffect(() => {
    const e = kapiBekleyen.current;
    if (!e) return;
    kapiBekleyen.current = null;
    if (Platform.OS === 'web' && typeof window !== 'undefined') window.history.replaceState(window.history.state, '', ekranAdresi({ tur: 'tribun' }));
    girisIsteRef.current(TRIBUN_NEDEN, () => gitRef.current(e));
  }, []);

  // Giriş başka yerde olduysa bu ekran da öğrenir: web'de başka sekme ya da statik bölüm sayfası (Tarot, Astroloji…, giriş bağlantı sayfası) aynı depoya yazar
  // ('storage' olayı + pencere odağı); uygulamada e-posta bağlantısı tarayıcıda onaylanır, uygulama öne gelince bekleyen giriş bir kez sorulur.
  const uyeRef = useRef(uye);
  uyeRef.current = uye;
  const pencereRef = useRef(pencere);
  pencereRef.current = pencere;
  useEffect(() => {
    const esitle = () => {
      const u = C.oturumTazele();
      const m = uyeRef.current;
      if (!u) {
        if (m && !C.oturumVar()) uyeAyarla(null); // başka sekmede çıkış yapıldı
        return;
      }
      if (m && m.uid === u.uid && m.ad === u.ad && !!m.sozGerekli === !!u.sozGerekli) return;
      if (pencereRef.current?.tur === 'giris') girisTamam(u);
      else uyeAyarla(u);
    };
    const bekleyenGiris = async () => {
      if (C.oturumVar() || pencereRef.current?.tur === 'giris') return;
      const k = beklemeKaydi();
      if (!k) return;
      const r = await C.epostaBekle(k.sk);
      if (r.ok && 'uye' in r.veri) {
        beklemeSil();
        girisTamam(r.veri.uye);
      }
    };
    const odak = () => {
      esitle();
      bekleyenGiris();
    };
    const depoOlay = (o: StorageEvent) => (!o.key || o.key.startsWith('yazsammi.canli.')) && esitle();
    const durum = AppState.addEventListener('change', (d) => d === 'active' && odak());
    if (Platform.OS === 'web') {
      window.addEventListener('storage', depoOlay);
      window.addEventListener('focus', odak);
    }
    return () => {
      durum.remove();
      if (Platform.OS === 'web') {
        window.removeEventListener('storage', depoOlay);
        window.removeEventListener('focus', odak);
      }
    };
  }, [girisTamam]);

  const begen = useCallback(
    (id: string) => {
      const yap = () => {
        const onceki = haritaRef.current[id];
        if (!onceki) return;
        guncelle(id, (g) => ({ begendim: !g.begendim, begeni: Math.max(0, g.begeni + (g.begendim ? -1 : 1)) }));
        C.begen(id, 'gonderi').then((r) => {
          if (!r.ok) {
            guncelle(id, () => ({ begendim: onceki.begendim, begeni: onceki.begeni }));
            if (r.durum === 401) girisIste('Beğenmek için giriş yap');
            else tostAyarla(C.hataYazisi(r.hata, r.durum));
          } else if (typeof r.veri?.begeni === 'number') guncelle(id, () => ({ begeni: r.veri.begeni!, begendim: r.veri.begendim ?? true }));
        });
      };
      if (girisIste('Beğenmek için giriş yap', yap)) yap();
    },
    [girisIste, guncelle],
  );

  const oy = useCallback(
    (id: string, i: number) => {
      const yap = () => {
        const onceki = haritaRef.current[id];
        guncelle(id, (g) => (g.oyum != null || !g.oylar ? {} : { oyum: i, oylar: g.oylar.map((n, j) => (j === i ? n + 1 : n)) }));
        C.oyVer(id, i).then((r) => {
          if (r.ok && r.veri.oylar) guncelle(id, () => ({ oylar: r.veri.oylar, oyum: i }));
          else if (!r.ok) {
            if (onceki) guncelle(id, () => ({ oyum: onceki.oyum, oylar: onceki.oylar })); // 20.11 (E-22): hata varsa iyimser oy geri alınır
            if (oyGirisGerek(r)) girisIste('Oy vermek için giriş yap', yap);
            else tostAyarla(C.hataYazisi(r.hata, r.durum));
          }
        });
      };
      if (oyKarari({ oturum: C.oturumVar(), cihaz: C.cihazVar() }) === 'gonder' || girisIste('Oy vermek için giriş yap', yap)) yap(); // üye değil + cihaz kimliği yok: istek atılmaz, giriş istenir
    },
    [girisIste, guncelle],
  );

  const girisIsteRef = useRef(girisIste);
  girisIsteRef.current = girisIste;
  const gitRef = useRef<(e: Ekran) => void>(() => {});
  const git = useCallback((e: Ekran) => {
    if (!TRIBUN_ACIK && e.tur.startsWith('tribun')) return; // iOS'ta Tribün ekranı yok (Build 4)
    // İkinci maç odası girişsize kapalı: giriş penceresi açılır; giriş olursa oda açılır, vazgeçilirse olduğu yerde kalınır.
    if (e.tur === 'tribunMac' && !tribunMacIzni(e.id) && !girisIsteRef.current(TRIBUN_NEDEN, () => gitRef.current(e))) return;
    ekranAyarla(e);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.history.pushState({ canli: ++yigin.current }, '', ekranAdresi(e));
    }
  }, []);
  gitRef.current = git;
  const geri = useCallback(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && yigin.current > 0) {
      yigin.current--;
      window.history.back();
      return;
    }
    ekranAyarla({ tur: 'akis' });
    if (Platform.OS === 'web' && typeof window !== 'undefined') window.history.replaceState(null, '', ekranAdresi({ tur: 'akis' }));
  }, []);

  const paylas = useCallback((g: Gonderi) => {
    const metin = g.metin || g.soru || g.alinti?.icerik?.metin || g.alinti?.icerik?.soru || 'Yazsam mı? Canlı';
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const url = `${window.location.origin}/canli?g=${encodeURIComponent(g.id)}`;
      const nav: any = window.navigator;
      if (nav.share && /Mobi|Android|iPhone/i.test(nav.userAgent)) {
        nav.share({ title: 'Yazsam mı? Canlı', text: metin, url }).catch(() => {});
        return;
      }
      (nav.clipboard?.writeText(url) ?? Promise.reject())
        .then(() => tostAyarla('Bağlantı kopyalandı'))
        .catch(() => tostAyarla(url));
      return;
    }
    Share.share({ message: `${metin}\nhttps://yazsammi.com/canli?g=${g.id}` }).catch(() => {});
  }, []);

  const gizle = useCallback((id: string) => gizliAyarla((s) => new Set(s).add(id)), []);

  const deger = useMemo<Deger>(
    () => ({
      uye,
      uyeAyarla,
      harita,
      koy,
      guncelle,
      gizli,
      gizle,
      begen,
      oy,
      girisIste,
      ekran,
      git,
      geri,
      yaziciAc: () => {
        if (girisIste('Paylaşmak için giriş yap', () => pencereAyarla({ tur: 'yazici' }))) pencereAyarla({ tur: 'yazici' });
      },
      bildirAc: (id) => pencereAyarla({ tur: 'bildir', id }),
      paylas,
      paylasAc: (h) => pencereAyarla({ tur: 'paylas', hedef: h }),
      yenidenAc: (h) => {
        const var_ = h.tur === 'gonderi' ? h.g.yenidenBen : h.y.yenidenBen;
        if (var_) {
          pencereAyarla(null);
          tostAyarla('Akışında zaten var');
          return;
        }
        if (girisIste('Akışında paylaşmak için giriş yap', () => pencereAyarla({ tur: 'yeniden', hedef: h }))) pencereAyarla({ tur: 'yeniden', hedef: h });
      },
      tost,
      zilSayi,
      zilSayiAyarla,
      burada,
      buradaAyarla,
      yeniGonderi,
      yeniGonderiAyarla,
      mesajSayi,
      mesajSayiAyarla,
      rozetYeni,
      rozetYeniAyarla: (n) => { rozetYeniAyarla(n); if (n === 0) rozetSurumAyarla((x) => x + 1); },
      rozetSurum,
      benTazele: () => { C.benGetir().then((u) => u && !u.yeni && uyeAyarla(u)); },
      akisYeni,
      akisYeniAyarla,
      istekAc: (kisi, yeniHesap) => {
        if (girisIste('Mesaj için giriş yap', () => pencereAyarla({ tur: 'istek', kisi, yeniHesap }))) pencereAyarla({ tur: 'istek', kisi, yeniHesap });
      },
      mesajAyarAc: () => pencereAyarla({ tur: 'mesajAyar' }),
      pencere,
      pencereKapat: () => {
        bekleyen.current = null;
        pencereAyarla(null);
      },
      girisTamam,
      kayitTamamla: () => pencereAyarla({ tur: 'ad' }),
      girisAc: (mod: 'giris' | 'uye') => { bekleyen.current = null; pencereAyarla({ tur: 'giris', neden: mod === 'uye' ? 'Üye ol' : 'Giriş yap', mod }); },
    }),
    [uye, harita, gizli, ekran, pencere, zilSayi, mesajSayi, rozetYeni, rozetSurum, akisYeni, burada, yeniGonderi, koy, guncelle, gizle, begen, oy, girisIste, git, geri, paylas, tost, girisTamam],
  );

  const eylem = useMemo<Eylem>(
    () => ({ begen, oy, git, paylas, bildirAc: (id) => pencereAyarla({ tur: 'bildir', id }), paylasAc: (h) => pencereAyarla({ tur: 'paylas', hedef: h }) }),
    [begen, oy, git, paylas],
  );

  return (
    <Baglam.Provider value={deger}>
      <EylemBaglam.Provider value={eylem}>{children}</EylemBaglam.Provider>
      <Tost metin={tostMetni} bitti={() => tostAyarla(null)} />
    </Baglam.Provider>
  );
}

function Tost({ metin, bitti }: { metin: string | null; bitti: () => void }) {
  const R = useRenk();
  const a = useRef(new Animated.Value(0)).current;
  const [gorunen, gorunenAyarla] = useState<string | null>(null);
  useEffect(() => {
    if (!metin) return;
    gorunenAyarla(metin);
    a.setValue(0);
    const d = Animated.sequence([
      Animated.timing(a, { toValue: 1, duration: 240, easing: Easing.out(Easing.back(1.4)), useNativeDriver: YEREL_SURUCU }),
      Animated.delay(2200),
      Animated.timing(a, { toValue: 0, duration: 220, useNativeDriver: YEREL_SURUCU }),
    ]);
    d.start(({ finished }) => {
      if (finished) {
        gorunenAyarla(null);
        bitti();
      }
    });
    return () => d.stop();
  }, [metin]);
  if (!gorunen) return null;
  return (
    <View pointerEvents="none" style={s.tostKap}>
      <Animated.View style={[s.tost, { backgroundColor: R.murekkep, opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
        <Text style={[s.tostYazi, { color: R.sis }]}>{gorunen}</Text>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  tostKap: { position: 'absolute', left: 0, right: 0, bottom: 96, alignItems: 'center', zIndex: 50 },
  tost: { borderRadius: 999, paddingVertical: 11, paddingHorizontal: 20, maxWidth: 420 },
  tostYazi: { fontFamily: yazi.orta, fontSize: 14.5 },
});
