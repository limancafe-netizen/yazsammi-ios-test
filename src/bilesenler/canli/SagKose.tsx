// Sağ sütunun yeni parçaları (22.10 taslak; Onur: "kurulsun, görelim"). Anket ve kısa yollar kalktı; yerine:
// 1) FİGÜR KÖŞESİ: sitenin canlı asistanı (kod/site/acilis/acilis.js) masaüstünde bu kartın sahnesine OTURUR — ayrı bir kopya çizilmez,
//    window.yazsammiAsistan.yerlestir() ile yüzen asistan buraya taşınır (çift figür olmaz). Kullanıcı sürükleyip çıkarırsa serbest kalır,
//    kart "çağır" düğmesi gösterir. Karşılar (ad + günün saati), günün önerisini söyler; "Konuş" ile hazır cevaplı kısa sohbet (gerçek sohbet yok).
// 2) GÜNÜN GÖREVİ: her gün tek küçük hedef (oyun / balon / yorum), ilerleme + üst üste gün serisi; tamamlanınca figür sevinir, kart kutlar.
//    Girişsizde kayıt bu cihazda; girişliyse sunucuda (GET /c/gorev, POST /c/gorev/ilerle; sunucu gorev.mjs).
// 3) YAKINDA: sıradaki figürün karanlıkta silueti + "İlk sen tanış", altında Karanlık Ev ve mobil uygulama.
// Telefonda sağ sütun yok: TelefonGorevKarti akışın üstünde (görev + yakında, gün boyu kapatılabilir); figür zaten yüzen asistan.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Image, Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';
import { depoOku, depoYaz } from '@/depo';
import { yazi } from '@/tema/tema';
import { Bas, CanliNokta, Ikon, useRenk, type Renk } from './ortak';
import { useCanli } from './baglam';
import { gorevGetir, gorevIlerlet, type GorevSunucu } from '@/canli';

const WEB = Platform.OS === 'web' && typeof window !== 'undefined';
type FigurAd = 'fener' | 'bukalemun';
const ADLAR: Record<FigurAd, string> = { fener: 'Fener', bukalemun: 'Bukalemun' };

// ---------- sitenin asistanı (acilis.js) ----------
type Asistan = {
  hazir: boolean;
  figur: () => string | null;
  tepki: (ad: string, o?: { metin?: string; sure?: number; hiz?: number }) => boolean;
  yerlestir: (x: number, y: number, boy?: number, o?: { zorla?: boolean }) => void;
  yeniEkran: () => void;
  yukle: (l: string[]) => void;
  sozler: (fn: (f: string) => string[] | null) => void;
};
const asistan = (): Asistan | null => (WEB ? ((window as any).yazsammiAsistan as Asistan) ?? null : null);
// figür köşesindeyse kart kendi balonunda konuşur; sitenin balonu (acilis.js) ikinci kez açılmaz
let koseYuvada = false;
const asistanYeri = (): { x: number; y: number; boy: number; surukle: unknown } | null => (WEB ? (window as any).__acilis?.A ?? null : null);

// Telefonda (<761) yüzen figürün başlangıç yeri: içerik metnini kapatmasın diye küçük (58) ve sağ kenarda, alt menünün (rıhtım: yükseklik 68,
// alttan max(güvenli alan, 10)) üstüne tünemiş. Kullanıcı daha önce sürüklediyse (yazsammi_asistan_yer) ya da bu oturumda sürüklerse onun yeri kalır.
const TEL_BOY = 58;
// 28.10: dar ekranda (≤360) figür biraz küçük.
const telBoy = () => (window.innerWidth <= 360 ? 48 : TEL_BOY);
function telefonYeri(alt = 10) {
  const W = window.innerWidth, H = window.innerHeight;
  const TEL_BOY = telBoy();
  // 28.10 (Onur, iPhone: figür ve yön düğmesi alt menünün üstüne biniyor): menünün ÜSTÜNE tünemez, hemen üstünde durur (figür kutusunun %14 taşan çizimi dahil 22 px pay).
  // 03.11 (denetim: figür okurken içeriği örtüyor): sağ kenara yaslı (eskiden 14 px içerideydi); acilis.js asistanVarsayilan() ile aynı yer.
  // 19.11 (Onur): girişsiz ziyaretçiye alt menünün üstünde "Giriş yap | Üye ol" şeridi (44 px, #giris-serit) var; figür onun da üstünde durur.
  const serit = typeof document !== 'undefined' && document.getElementById('giris-serit') ? 44 : 0;
  return { x: W - TEL_BOY - 4, y: H - Math.max(alt, 10) - 68 - serit - TEL_BOY - 22 };
}
export function TelefonAsistanYeri() {
  const alt = useSafeAreaInsets().bottom;
  useEffect(() => {
    if (!WEB) return;
    const elle = () => !!depoOku('yazsammi_asistan_yer');
    const yerles = () => {
      const a = asistan();
      if (!a?.hazir || window.innerWidth >= 761 || elle()) return !!a?.hazir;
      const h = telefonYeri(alt); a.yerlestir(h.x, h.y, telBoy()); return true;
    };
    let z2 = 0;
    const t = setInterval(() => { if (yerles()) { clearInterval(t); z2 = setTimeout(yerles, 1500) as any; } }, 300); // şerit (Giriş yap | Üye ol) sonradan çizilirse figür bir kez daha yerleşir
    let z = 0;
    const boyut = () => { clearTimeout(z); z = setTimeout(yerles, 160) as any; };
    window.addEventListener('resize', boyut);
    return () => { clearInterval(t); clearTimeout(z); clearTimeout(z2); window.removeEventListener('resize', boyut); };
  }, [alt]);
  return null;
}

function useFigur(): FigurAd {
  const R = useRenk();
  const oku = () => {
    const f = asistan()?.figur() ?? depoOku('yazsammi_figur_v1');
    return f === 'fener' || f === 'bukalemun' ? f : R.gece ? 'fener' : 'bukalemun';
  };
  const [f, ayarla] = useState<FigurAd>(oku);
  useEffect(() => {
    if (!WEB) return;
    const d = (e: Event) => { const v = (e as CustomEvent).detail; if (v === 'fener' || v === 'bukalemun') ayarla(v); };
    window.addEventListener('yazsammi:figur', d);
    const t = setInterval(() => ayarla(oku()), 1500); // açılış seçimi bitince
    return () => { window.removeEventListener('yazsammi:figur', d); clearInterval(t); };
  }, [R.gece]);
  return f;
}

// ---------- tarih ----------
// 25.10 (Onur: günlük görev tarayıcıda/telefonda ayrı çıkıyordu): gün, Türkiye tarihine göre (UTC+3, yaz saati yok) hesaplanır;
// cihazın saat dilimine bağlı değildir. Aynı gün herkeste aynı tarih anahtarı → aynı görev.
const gunAnahtar = (d = new Date()) => new Date(d.getTime() + 3 * 3600000).toISOString().slice(0, 10);
const gunNo = (d = new Date()) => Math.floor(new Date(gunAnahtar(d) + 'T00:00:00Z').getTime() / 86400000);
const oncekiGun = (k: string, n = 1) => { const d = new Date(k + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() - n); return d.toISOString().slice(0, 10); };
function selamla(ad?: string | null) {
  const s = new Date().getHours();
  const g = s < 5 ? 'İyi geceler' : s < 11 ? 'Günaydın' : s < 17 ? 'İyi günler' : s < 22 ? 'İyi akşamlar' : 'İyi geceler';
  return ad ? `${g}, ${ad}!` : `${g}!`;
}

// ---------- günün görevi ----------
type GorevAd = 'tas' | 'uc' | 'balon' | 'yorum';
type GorevTanim = { baslik: string; hedef: number; birim: string; oneri: (f: FigurAd) => string; dugme: string; ikon: 'yildiz' | 'kalem' | 'yorum' | 'ok' };
const GOREV: Record<GorevAd, GorevTanim> = {
  tas: { baslik: 'Taş Ustası’nda 3 yıldız topla', hedef: 3, birim: 'yıldız', dugme: 'Oyna', ikon: 'yildiz', oneri: () => 'Bugün Taş Ustası’nda 3 yıldız alalım mı?' },
  uc: { baslik: 'Birlikte Uç’ta 2 tur uç', hedef: 2, birim: 'tur', dugme: 'Uç', ikon: 'ok', oneri: (f) => (f === 'fener' ? 'Bugün Birlikte Uç’ta 2 tur atalım mı? Yolu ben aydınlatırım.' : 'Bugün Birlikte Uç’ta 2 tur atalım mı? Kanatlarım hazır!') },
  balon: { baslik: 'Bir balon yaz', hedef: 1, birim: 'balon', dugme: 'Yaz', ikon: 'kalem', oneri: () => 'Bugün aklından geçeni bir balona yazalım mı?' },
  yorum: { baslik: 'Bir balona yorum yaz', hedef: 1, birim: 'yorum', dugme: 'Akışa bak', ikon: 'yorum', oneri: () => 'Bugün birinin balonuna güzel bir yorum bırakalım mı?' },
};
const OYUN_YOLU: Partial<Record<GorevAd, string>> = { tas: '/oyun/tas-ustasi/', uc: '/oyun/birlikte-uc/' };
function json(a: string): any { try { const s = depoOku(a); return s ? JSON.parse(s) : null; } catch { return null; } }
/** oyunların kendi kayıtlarından sayaç (aynı alan adı, aynı tarayıcı hafızası) */
function oyunSayac(g: GorevAd): number {
  if (g === 'tas') {
    const d = json('cift_bul_v2'); if (!d) return 0;
    let t = 0; for (const k in d.sv || {}) t += d.sv[k]?.y || 0; for (const k in d.gunluk || {}) t += d.gunluk[k]?.y || 0;
    return t;
  }
  if (g === 'uc') return json('birlikte_uc_v1')?.oyun || 0;
  return 0;
}
type GorevKayit = { gun: string; ad: GorevAd; taban: number; sayac: number; tamam: boolean; gunler: string[]; tanis?: boolean };
export type GorevDurum = { ad: GorevAd; t: GorevTanim; ilerleme: number; tamam: boolean; seri: number; hafta: boolean[]; yeniTamam: number; git: () => void };

const GOREV_OLAY = 'yazsammi:gorev'; // balon/yorum gönderilince açık görev kartları depodan tazelenir
const gorevAnahtar = (uid?: string) => 'yazsammi_gorev_v1' + (uid ? ':' + uid : '');
/** 25.10: herkese aynı sıra; gün Türkiye tarihinden (gunNo) → aynı gün aynı görev. Balon/yorum görevi girişsizde giriş ister, girince sayılır. */
const GOREV_SIRA: GorevAd[] = ['tas', 'balon', 'uc', 'yorum'];
/** bugünün görev kaydı (yoksa bugünün görevi atanır) */
function bugununKaydi(anahtar: string): GorevKayit {
  const bugun = gunAnahtar();
  const x: GorevKayit | null = json(anahtar);
  if (x && x.gun === bugun) return x;
  const ad = GOREV_SIRA[gunNo() % GOREV_SIRA.length];
  return { gun: bugun, ad, taban: oyunSayac(ad), sayac: 0, tamam: false, gunler: (x?.gunler ?? []).filter((g) => g >= oncekiGun(bugun, 60)) };
}
// 23.10 (Onur): balon/yorum nereden yazılırsa yazılsın (görev düğmesi, alttaki Yaz, başka ekran) görevden sayılır.
// 27.10: girişliyse sayaç sunucuda (POST /c/gorev/ilerle); kart ekranda olmasa da sayılır. Girişsizde balon/yorum sayılmaz (eski davranış).
export function gorevBildir(tur: 'yorum' | 'balon', uid?: string) {
  if (WEB) try { window.dispatchEvent(new CustomEvent(GOREV_OLAY, { detail: { tur, iyimser: !!uid } })); } catch {}
  if (!uid) return;
  gorevIlerlet(tur, 1).then((r) => {
    if (r.ok && WEB) try { window.dispatchEvent(new CustomEvent(GOREV_OLAY, { detail: { tur, durum: r.veri } })); } catch {}
  }).catch(() => {});
}
// 27.10: giriş yapılınca, cihazdaki o günün ilerlemesi sunucudakinden büyükse bir kez sunucuya taşınır (üye+gün başına bayrak).
const gorevTasima = (uid: string, gun: string) => `yazsammi_gorev_tasindi:${uid}:${gun}`;
/** girişsizken cihazdaki bugünkü ilerleme (eski kayıt; yalnız taşıma için okunur) */
function girissizIlerleme(ad: GorevAd): number {
  const x: GorevKayit | null = json(gorevAnahtar());
  if (!x || x.gun !== gunAnahtar() || x.ad !== ad) return 0;
  return OYUN_YOLU[ad] ? Math.max(0, oyunSayac(ad) - x.taban) : x.sayac;
}

function seriHesap(gunler: string[], bugun: string) {
  const v = new Set(gunler);
  let s = 0, k = v.has(bugun) ? bugun : oncekiGun(bugun);
  while (v.has(k)) { s++; k = oncekiGun(k); }
  return s;
}

export function useGunlukGorev(akisaDon?: () => void): GorevDurum {
  const c = useCanli();
  const uye = c.uye && !c.uye.yeni ? c.uye : null;
  const uid = uye?.uid;
  const anahtar = gorevAnahtar(uid);
  // girişsiz: cihaz kaydı (eski davranış)
  const [k, kAyarla] = useState<GorevKayit | null>(null);
  // girişli: sunucu durumu (telefon ve bilgisayar aynı görünür)
  const [sunucu, sunucuAyarla] = useState<GorevSunucu | null>(null);
  const [yeniTamam, yeniTamamAyarla] = useState(0);
  const onceki = useRef<boolean | null>(null); // bu oturumda son bilinen "tamam" (geçişte kutlamak için)
  useEffect(() => { onceki.current = null; sunucuAyarla(null); }, [uid]);
  const sunucuUygula = useCallback((d: GorevSunucu) => {
    sunucuAyarla(d);
    const t = d.tamam.includes(d.gorev);
    if (onceki.current === false && t) yeniTamamAyarla((n) => n + 1);
    onceki.current = t;
  }, []);
  const sunucuYukle = useCallback(async () => {
    if (!uid) return;
    const r = await gorevGetir();
    if (!r.ok) return;
    sunucuUygula(r.veri);
    // giriş yapılınca bir kez: cihazdaki bugünkü ilerleme sunucudakinden büyükse farkı sunucuya yaz
    const bayrak = gorevTasima(uid, r.veri.gun);
    if (depoOku(bayrak)) return;
    const ad = r.veri.gorev as GorevAd;
    const fark = Math.min(girissizIlerleme(ad), GOREV[ad].hedef) - (r.veri.sayac[ad] || 0);
    if (fark > 0) {
      const t = await gorevIlerlet(ad, fark);
      if (!t.ok) return; // bayrak konmaz: sonraki açılışta yeniden denenir
      sunucuUygula(t.veri);
    }
    depoYaz(bayrak, '1');
  }, [uid, sunucuUygula]);
  const tazele = useCallback(() => {
    if (uid) { void sunucuYukle(); return; }
    const bugun = gunAnahtar();
    let x = bugununKaydi(anahtar);
    const t = GOREV[x.ad];
    const sayac = OYUN_YOLU[x.ad] ? Math.max(0, oyunSayac(x.ad) - x.taban) : x.sayac;
    const tamam = sayac >= t.hedef;
    const yeni = tamam && !x.tamam;
    x = { ...x, sayac, tamam, gunler: tamam && !x.gunler.includes(bugun) ? [...x.gunler, bugun] : x.gunler };
    depoYaz(anahtar, JSON.stringify(x));
    kAyarla(x);
    if (yeni) yeniTamamAyarla((n) => n + 1);
  }, [anahtar, uid, sunucuYukle]);
  useEffect(() => {
    tazele();
    if (!WEB) return;
    const odak = () => tazele();
    const olay = (e: Event) => {
      const d = (e as CustomEvent).detail;
      if (uid && d && typeof d === 'object') {
        if (d.durum) sunucuUygula(d.durum as GorevSunucu);
        else if (d.iyimser) sunucuAyarla((s) => (s && s.gorev === d.tur ? { ...s, sayac: { ...s.sayac, [d.tur]: Math.min(GOREV[d.tur as GorevAd].hedef, (s.sayac[d.tur] || 0) + 1) } } : s)); // iyimser: sunucu yanıtını bekleme
      }
      if (!uid) tazele(); // girişli: yalnız sunucu yanıtı (durum) ya da iyimser sayım; sunucudan yeniden çekme yok
    };
    window.addEventListener('focus', odak); document.addEventListener('visibilitychange', odak); window.addEventListener('storage', odak); window.addEventListener(GOREV_OLAY, olay);
    return () => { window.removeEventListener('focus', odak); document.removeEventListener('visibilitychange', odak); window.removeEventListener('storage', odak); window.removeEventListener(GOREV_OLAY, olay); };
  }, [tazele, uid, sunucuUygula]);
  // yeni balon/yorum: gorevBildir sunucuya yazar; sonuç GOREV_OLAY ile buraya gelir

  const git = (ad: GorevAd) => () => {
    const yol = OYUN_YOLU[ad];
    if (yol) { if (WEB) window.location.href = yol; return; }
    if (ad === 'balon') c.yaziciAc();
    else if (akisaDon) akisaDon();
  };
  if (uid) {
    const ad = (sunucu?.gorev ?? GOREV_SIRA[gunNo() % GOREV_SIRA.length]) as GorevAd;
    const t = GOREV[ad];
    return {
      ad, t, ilerleme: Math.min(t.hedef, sunucu?.sayac[ad] ?? 0), tamam: !!sunucu?.tamam.includes(ad), seri: sunucu?.seri ?? 0,
      hafta: sunucu ? sunucu.gunler.map((x) => x.tamam) : Array(7).fill(false), yeniTamam, git: git(ad),
    };
  }
  const bugun = gunAnahtar();
  const ad = k?.ad ?? 'tas';
  const t = GOREV[ad];
  const gunler = k?.gunler ?? [];
  const hafta = Array.from({ length: 7 }, (_, i) => gunler.includes(oncekiGun(bugun, 6 - i)));
  return { ad, t, ilerleme: Math.min(t.hedef, k?.sayac ?? 0), tamam: !!k?.tamam, seri: seriHesap(gunler, bugun), hafta, yeniTamam, git: git(ad) };
}

// kutlama: figür sevinir (hangi köşede olursa olsun) — her tamamlanmada bir kez
function useKutlama(g: GorevDurum, figur: FigurAd) {
  const once = useRef(g.yeniTamam);
  useEffect(() => {
    if (g.yeniTamam === once.current) return;
    once.current = g.yeniTamam;
    const metin = g.seri > 1 ? `Görev tamam! ${g.seri} gündür seri bizde!` : 'Görev tamam! Yarın yeni görev var.';
    const dene = (n: number) => { const a = asistan(); if (a?.hazir) a.tepki('sevinc', {}); else if (n > 0) setTimeout(() => dene(n - 1), 600); };
    dene(12);
  }, [g.yeniTamam]);
}

// ---------- küçük parçalar ----------
function Alev({ boyut = 16, renk }: { boyut?: number; renk: string }) {
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Path d="M12 2.5c.6 3.1 2.4 4.6 4 6.4 1.5 1.7 2.5 3.5 2.5 5.9A6.5 6.5 0 0 1 12 21.5a6.5 6.5 0 0 1-6.5-6.7c0-2.2 1-3.9 2.3-5.2.2 1.5.9 2.6 2 3.2-.2-3.6.6-7.1 2.2-10.3Z" fill={renk} />
      <Path d="M12 13c.9 1.3 2.3 2.2 2.3 4a2.3 2.3 0 0 1-4.6 0c0-1.1.6-1.9 1.3-2.6.3.6.6.9 1 1-.2-.8-.2-1.6 0-2.4Z" fill="#fff" opacity={0.85} />
    </Svg>
  );
}

function Ilerleme({ oran, renk, zemin }: { oran: number; renk: string; zemin: string }) {
  const a = useRef(new Animated.Value(oran)).current;
  useEffect(() => { Animated.timing(a, { toValue: oran, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start(); }, [oran]);
  return (
    <View style={[s.cubuk, { backgroundColor: zemin }]}>
      <Animated.View style={[s.cubukDolu, { backgroundColor: renk, width: a.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
    </View>
  );
}

/** harf harf beliren konuşma (figür konuşurken) */
function useYaziAkisi(metin: string) {
  const [n, nAyarla] = useState(metin.length);
  useEffect(() => {
    nAyarla(0);
    let i = 0;
    const t = setInterval(() => { i += 2; nAyarla(Math.min(metin.length, i)); if (i >= metin.length) clearInterval(t); }, 22);
    return () => clearInterval(t);
  }, [metin]);
  return metin.slice(0, n);
}

/** konfeti: tamamlanınca kartın içinden saçılan küçük renkli parçalar */
function Konfeti({ tetik, renkler }: { tetik: number; renkler: string[] }) {
  const p = useMemo(() => Array.from({ length: 26 }, (_, i) => ({ a: (i / 26) * Math.PI * 2 + (i % 3) * 0.2, r: 60 + (i % 5) * 22, b: 5 + (i % 3) * 2, k: renkler[i % renkler.length], kare: i % 2 === 0 })), [renkler.join()]);
  const v = useRef(new Animated.Value(0)).current;
  const [gor, gorAyarla] = useState(false);
  useEffect(() => {
    if (!tetik) return;
    gorAyarla(true); v.setValue(0);
    Animated.timing(v, { toValue: 1, duration: 1700, easing: Easing.out(Easing.quad), useNativeDriver: false }).start(() => gorAyarla(false));
  }, [tetik]);
  if (!gor) return null;
  return (
    <View pointerEvents="none" style={s.konfeti}>
      {p.map((x, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute', width: x.b, height: x.kare ? x.b : x.b * 2, borderRadius: x.kare ? 2 : x.b, backgroundColor: x.k,
            opacity: v.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] }),
            transform: [
              { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(x.a) * x.r] }) },
              { translateY: v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, Math.sin(x.a) * x.r - 18, Math.sin(x.a) * x.r + 26] }) },
              { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${(i % 2 ? 1 : -1) * 320}deg`] }) },
            ],
          }}
        />
      ))}
    </View>
  );
}

// ---------- 1) FİGÜR KÖŞESİ ----------
const SOHBET: Record<FigurAd, { soru: string; cevap: string; klip: string }[]> = {
  fener: [
    { soru: 'Nasılsın?', cevap: 'Işığım tam dolu! Sen nasılsın? Bir balona yazsana.', klip: 'selam' },
    { soru: 'Oyun öner', cevap: 'Birlikte Uç’ta karanlık mağaraya girelim, yolu ben aydınlatırım!', klip: 'sevinc' },
    { soru: 'Yeni ne var?', cevap: 'Karanlıkta biri var… Gözlerini gördüm! Aşağıya bak.', klip: 'saskin' },
  ],
  bukalemun: [
    { soru: 'Nasılsın?', cevap: 'Bugün mor gibiyim, yani harika! Sen ne renktesin?', klip: 'selam' },
    { soru: 'Oyun öner', cevap: 'Taş Ustası’nda çift bulalım, renkleri ben seçerim!', klip: 'sevinc' },
    { soru: 'Yeni ne var?', cevap: 'Psst… Karanlıkta yeni biri bekliyor. Aşağıya bak!', klip: 'saskin' },
  ],
};

function Sahne({ figur, R }: { figur: FigurAd; R: Renk }) {
  // figürün arkasında yumuşak ışık: Fener = sıcak fener ışığı, Bukalemun = renk lekeleri
  const nefes = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const l = Animated.loop(Animated.sequence([
      Animated.timing(nefes, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      Animated.timing(nefes, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
    ]));
    l.start();
    return () => l.stop();
  }, []);
  const fener = figur === 'fener';
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: nefes.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1] }), transform: [{ scale: nefes.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.04] }) }] }]}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          <RadialGradient id="isik" cx="50%" cy="46%" r="50%">
            <Stop offset="0" stopColor={fener ? '#FFC870' : '#B98CFF'} stopOpacity={fener ? (R.gece ? 0.42 : 0.32) : 0.34} />
            <Stop offset="0.55" stopColor={fener ? '#FF9F43' : '#5BD6C4'} stopOpacity={fener ? 0.12 : 0.14} />
            <Stop offset="1" stopColor={fener ? '#FF9F43' : '#FFB86B'} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx="50" cy="48" r="50" fill="url(#isik)" />
      </Svg>
      <View style={[s.zemin, { backgroundColor: R.gece ? 'rgba(0,0,0,0.28)' : 'rgba(29,24,48,0.08)' }]} />
    </Animated.View>
  );
}

export function FigurKosesi({ gorev }: { gorev: GorevDurum }) {
  const R = useRenk();
  const c = useCanli();
  const figur = useFigur();
  const ad = ADLAR[figur];
  const uye = c.uye && !c.uye.yeni ? c.uye : null;
  const sahne = useRef<View>(null);
  const [durum, durumAyarla] = useState<'bekliyor' | 'yuvada' | 'serbest'>('bekliyor');
  const [sohbet, sohbetAyarla] = useState<number | null>(null); // seçilen hazır soru (null: günün önerisi)
  useKutlama(gorev, figur);
  useEffect(() => { if (gorev.yeniTamam) sohbetAyarla(null); }, [gorev.yeniTamam]); // kutlamada kart görevi söyler

  // yüzen asistanı sahneye oturt; yeniden boyutta yeniden ölç; köşe kapanınca serbest bırak
  const hedef = useRef<{ x: number; y: number; boy: number } | null>(null);
  const olc = () => {
    const el = sahne.current as any;
    const r = el?.getBoundingClientRect?.();
    if (!r || !r.width) return null;
    const boy = Math.round(Math.min(r.width, r.height) / 1.32);
    return { x: r.left + (r.width - boy) / 2, y: r.top + (r.height - boy) / 2 + 2, boy };
  };
  const yerles = (zorla = false) => {
    const a = asistan();
    if (!a?.hazir) return false;
    const h = olc(); if (!h) return false;
    hedef.current = h;
    if (zorla) a.yeniEkran();
    a.yerlestir(h.x, h.y, h.boy, { zorla });
    return true;
  };
  useEffect(() => {
    if (!WEB) return;
    let ilk = false, sayac = 0;
    const t = setInterval(() => {
      if (!ilk) { if (yerles()) { ilk = true; const a = asistan(); a?.yukle(['sevinc', 'saskin', 'selam']); void 0 /* 28.10: Fener kendiliğinden selam vermez */; } return; }
      const A = asistanYeri(), h = hedef.current;
      if (!A || !h) return;
      const yuvada = Math.abs(A.x - h.x) < 8 && Math.abs(A.y - h.y) < 8;
      const d = yuvada || A.surukle || ++sayac < 3 ? 'yuvada' : 'serbest';
      koseYuvada = d === 'yuvada';
      durumAyarla(d);
      if (yuvada) sayac = 0;
    }, 450);
    let z = 0;
    const boyut = () => { clearTimeout(z); z = setTimeout(() => yerles(), 140) as any; };
    window.addEventListener('resize', boyut);
    return () => {
      clearInterval(t); clearTimeout(z); window.removeEventListener('resize', boyut);
      koseYuvada = false;
      // köşe kapandı (dar ekran / profil): asistan olağan köşesine döner
      const a = asistan(), W = window.innerWidth, H = window.innerHeight;
      if (a?.hazir) { if (W >= 761) a.yerlestir(W - 132 - 26, H - 132 - 26, 0); else { const h = telefonYeri(); a.yerlestir(h.x, h.y, telBoy()); } }
    };
  }, []);

  // figürün kendisine dokununca (acilis.js balonu) da günün önerisi + hazır cevaplar sırayla söylenir
  useEffect(() => {
    const a = asistan(); if (!a?.sozler) return;
    a.sozler((f) => (f === 'fener' || f === 'bukalemun' ? [gorev.tamam ? 'Bugünün görevi tamam! Harikasın.' : gorev.t.oneri(f), ...SOHBET[f].map((x) => x.cevap)] : null));
    return () => a.sozler(() => null);
  }, [gorev.ad, gorev.tamam, durum]);
  const soru = sohbet != null ? SOHBET[figur][sohbet] : null;
  const metin = soru ? soru.cevap : gorev.tamam ? (gorev.seri > 1 ? `Bugünün görevi tamam, ${gorev.seri} gündür seri bizde! Yarın yine buradayım.` : 'Bugünün görevi tamam! Yarın yeni bir görevle buradayım.') : gorev.t.oneri(figur);
  const akan = useYaziAkisi(metin);
  const sor = (i: number) => {
    sohbetAyarla(i);
    const a = asistan(); if (a?.hazir) a.tepki(SOHBET[figur][i].klip);
  };
  const konusAc = () => { const a = asistan(); if (a?.hazir) a.tepki('konus'); sohbetAyarla((x) => (x == null ? 0 : (x + 1) % SOHBET[figur].length)); };
  const balonRenk = R.ust;

  return (
    <View testID="figur-kosesi" style={[s.kutu, s.kose, { backgroundColor: R.panel, borderColor: R.ince }]}>
      <View style={s.kutuUst}>
        <View style={[s.suAn, { backgroundColor: R.vurguYumusak }]}>
          <CanliNokta renk={R.vurgu} boyut={5} />
          <Text style={[s.suAnYazi, { color: R.vurgu }]}>{c.burada != null ? `ŞU AN ${c.burada} KİŞİ BURADA` : 'ŞU AN CANLI'}</Text>
        </View>
      </View>
      <View style={s.koseGovde}>
        <View style={{ flex: 1, minWidth: 0, gap: 8 }}>
          <View>
            <Text style={[s.selam, { color: R.murekkep }]} numberOfLines={2}>{selamla(uye?.ad)}</Text>
            <Text style={[s.figurAd, { color: R.soluk }]}>{ad} · asistanın</Text>
          </View>
          <View style={[s.konusma, { backgroundColor: balonRenk }]}>
            <Text style={[s.konusmaYazi, { color: R.murekkep }]}>
              {akan}
              <Text style={{ color: 'transparent' }}>{metin.slice(akan.length)}</Text>
            </Text>
            {soru == null && !gorev.tamam && (
              <Bas onPress={gorev.git} etiket={gorev.t.dugme} style={[s.hadi, { backgroundColor: R.vurgu }]} hoverRenk={R.vurgu}>
                <Text style={[s.cipYazi, { color: '#fff' }]}>Hadi!</Text>
                <Ikon ad="ok" boyut={13} renk="#fff" kalinlik={2.6} />
              </Bas>
            )}
            <View style={[s.kuyruk, { backgroundColor: balonRenk }]} />
          </View>
        </View>
        <Bas onPress={() => (durum === 'serbest' ? yerles(true) : konusAc())} etiket={durum === 'serbest' ? `${ad}’i köşesine çağır` : `${ad} ile konuş`} style={s.sahneKap}>
          <View ref={sahne} style={s.sahne}>
            <Sahne figur={figur} R={R} />
            {durum === 'serbest' && (
              <View style={[s.cagir, { borderColor: R.ince }]}>
                <Text style={[s.cagirYazi, { color: R.soluk }]}>{ad}’i{'\n'}çağır</Text>
              </View>
            )}
          </View>
        </Bas>
      </View>
      <View style={s.cipler}>
        {SOHBET[figur].map((x, i) => (
          <Bas key={x.soru} onPress={() => sor(i)} etiket={x.soru} style={[s.cip, { backgroundColor: sohbet === i ? R.vurguYumusak : R.ust }]} hoverRenk={R.hover}>
            <Text style={[s.cipYazi, { color: sohbet === i ? R.vurgu : R.murekkep }]}>{x.soru}</Text>
          </Bas>
        ))}
        {soru != null && (
          <Bas onPress={() => sohbetAyarla(null)} etiket="Günün önerisine dön" style={[s.cip, { backgroundColor: 'transparent' }]} hoverRenk={R.hover}>
            <Ikon ad="geri" boyut={15} renk={R.soluk} kalinlik={2.2} />
          </Bas>
        )}
      </View>
    </View>
  );
}

// ---------- 2) GÜNÜN GÖREVİ ----------
export function GununGorevi({ gorev, sik }: { gorev: GorevDurum; sik?: boolean }) {
  const R = useRenk();
  const t = gorev.t;
  const pop = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!gorev.yeniTamam) return;
    pop.setValue(0.6);
    Animated.spring(pop, { toValue: 1, friction: 4, tension: 140, useNativeDriver: false }).start();
  }, [gorev.yeniTamam]);
  const altin = R.altin;
  const ikon = gorev.tamam ? <Ikon ad="tik" boyut={20} renk="#fff" kalinlik={2.8} /> : <Ikon ad={t.ikon} boyut={19} renk={R.vurgu} kalinlik={2.2} dolu={t.ikon === 'yildiz'} />;
  return (
    <View testID="gunun-gorevi" style={[s.kutu, sik && { padding: 14, gap: 10 }, { backgroundColor: R.panel, borderColor: gorev.tamam ? R.vurgu : R.ince }]}>
      <View style={s.kutuUst}>
        <Text style={[s.kutuBaslik, { color: R.soluk }]}>GÜNÜN GÖREVİ</Text>
        <Animated.View style={[s.seri, { backgroundColor: gorev.seri ? R.altinYumusak : R.ust, transform: [{ scale: pop }] }]}>
          <Alev boyut={14} renk={gorev.seri ? altin : R.soluk} />
          <Text style={[s.seriYazi, { color: gorev.seri ? R.altinYazi : R.soluk }]}>{gorev.seri ? `${gorev.seri} gün seri` : 'Seri başlat'}</Text>
        </Animated.View>
      </View>
      <View style={s.gorevSatir}>
        <View style={[s.gorevIk, { backgroundColor: gorev.tamam ? R.vurgu : R.vurguYumusak }]}>{ikon}</View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[s.gorevBaslik, { color: R.murekkep }]} numberOfLines={2}>{t.baslik}</Text>
          <Text style={[s.gorevAlt, { color: gorev.tamam ? R.vurgu : R.soluk }]}>{gorev.tamam ? 'Tamamlandı · yarın yeni görev' : `${gorev.ilerleme}/${t.hedef} ${t.birim}`}</Text>
        </View>
        {!gorev.tamam && (
          <Bas onPress={gorev.git} etiket={t.dugme} style={[s.gorevDug, { backgroundColor: R.vurgu }]} hoverRenk={R.vurgu}>
            <Text style={s.gorevDugYazi}>{t.dugme}</Text>
          </Bas>
        )}
      </View>
      <Ilerleme oran={gorev.ilerleme / t.hedef} renk={R.vurgu} zemin={R.ust} />
      {!sik && (
        <View style={s.hafta}>
          {gorev.hafta.map((v, i) => (
            <View key={i} style={{ alignItems: 'center', gap: 4, flex: 1 }}>
              <View style={[s.haftaNokta, { backgroundColor: v ? altin : 'transparent', borderColor: v ? altin : i === 6 ? R.vurgu : R.ince }]}>{v && <Alev boyut={11} renk="#fff" />}</View>
              <Text style={[s.haftaGun, { color: i === 6 ? R.murekkep : R.soluk }]}>{i === 6 ? 'Bugün' : ['Pz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct'][new Date(Date.now() - (6 - i) * 86400000).getDay()]}</Text>
            </View>
          ))}
        </View>
      )}
      <Konfeti tetik={gorev.yeniTamam} renkler={[R.vurgu, altin, '#FF7AA8', '#3DDC97', '#7CC7FF']} />
    </View>
  );
}

// ---------- 3) YAKINDA ----------
const SILUET = { govde: require('../../../assets/yakinda/baykus_govde.webp'), kenar: require('../../../assets/yakinda/baykus_kenar.webp'), goz: require('../../../assets/yakinda/baykus_goz.webp') };

function Siluet({ en }: { en: number }) {
  const boy = Math.round(en * 1.2);
  const t = useRef(new Animated.Value(0)).current; // süzülme
  const k = useRef(new Animated.Value(0)).current; // kenar ışığı
  const g = useRef(new Animated.Value(1)).current; // göz kırpma
  useEffect(() => {
    const d = Animated.loop(Animated.sequence([
      Animated.timing(t, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      Animated.timing(t, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
    ]));
    const p = Animated.loop(Animated.sequence([
      Animated.timing(k, { toValue: 1, duration: 3100, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
      Animated.timing(k, { toValue: 0, duration: 3100, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
    ]));
    d.start(); p.start();
    let z: ReturnType<typeof setTimeout>;
    const kirp = () => {
      z = setTimeout(() => {
        const iki = Math.random() < 0.3;
        const tek = [Animated.timing(g, { toValue: 0.05, duration: 70, useNativeDriver: false }), Animated.timing(g, { toValue: 1, duration: 110, useNativeDriver: false })];
        Animated.sequence(iki ? [...tek, Animated.delay(120), ...tek] : tek).start(kirp);
      }, 2400 + Math.random() * 3200);
    };
    kirp();
    return () => { d.stop(); p.stop(); clearTimeout(z); };
  }, []);
  const ty = t.interpolate({ inputRange: [0, 1], outputRange: [3, -4] });
  const tam = { position: 'absolute' as const, left: 0, top: 0, width: en, height: boy };
  return (
    <Animated.View style={{ width: en, height: boy, transform: [{ translateY: ty }] }}>
      <Image source={SILUET.govde} style={tam} resizeMode="contain" />
      <Animated.Image source={SILUET.kenar} style={[tam, { opacity: k.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }) }]} resizeMode="contain" />
      <Animated.Image source={SILUET.goz} style={[tam, { opacity: g, transform: [{ scaleY: g.interpolate({ inputRange: [0, 1], outputRange: [0.15, 1] }) }] }]} resizeMode="contain" />
    </Animated.View>
  );
}

export function useTanis() {
  const c = useCanli();
  const uye = c.uye && !c.uye.yeni ? c.uye : null;
  const anahtar = 'yazsammi_tanis_v1' + (uye ? ':' + uye.uid : '');
  const [tamam, ayarla] = useState(() => depoOku(anahtar) === '1');
  useEffect(() => { ayarla(depoOku(anahtar) === '1'); }, [anahtar]);
  const tanis = () => {
    const yap = () => { depoYaz('yazsammi_tanis_v1' + (c.uye ? ':' + c.uye.uid : ''), '1'); ayarla(true); c.tost('Tamam! Gelince ilk sana haber vereceğiz.'); const a = asistan(); if (a?.hazir) a.tepki('saskin'); };
    if (c.girisIste('Yeni figürle ilk sen tanış: giriş yap, gelince haber verelim', yap)) yap();
  };
  return { tamam, tanis };
}

export function Yakinda({ sik }: { sik?: boolean }) {
  const R = useRenk();
  const { tamam, tanis } = useTanis();
  // karanlık sahne her iki temada da karanlık ("karanlıkta siluet"), gündüzde kartın içinde gece penceresi gibi
  const zemin = R.gece ? '#0F0B1C' : '#1B1530';
  return (
    <View testID="yakinda" style={[s.kutu, { backgroundColor: R.panel, borderColor: R.ince }, sik && { padding: 14 }]}>
      <Text style={[s.kutuBaslik, { color: R.soluk }]}>YAKINDA</Text>
      <View style={[s.karanlik, { backgroundColor: zemin }]}>
        <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient id="spot" cx="30%" cy="62%" r="60%">
              <Stop offset="0" stopColor="#7A5CFF" stopOpacity={0.38} />
              <Stop offset="1" stopColor="#7A5CFF" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx="30" cy="62" r="70" fill="url(#spot)" />
        </Svg>
        <View style={s.siluetYer}>
          <Siluet en={sik ? 70 : 96} />
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <Text style={s.yeniBaslik}>Yeni bir dost geliyor</Text>
          <Text style={s.yeniAlt}>Karanlıkta bekliyor. Kim olduğunu ilk sen öğren.</Text>
          <Bas onPress={tamam ? undefined : tanis} etiket={tamam ? 'Haber vereceğiz' : 'İlk sen tanış'} style={[s.tanis, { backgroundColor: tamam ? 'rgba(255,255,255,0.12)' : '#FFC46A' }]} hoverRenk={tamam ? undefined : '#FFD08A'}>
            {tamam && <Ikon ad="tik" boyut={14} renk="#FFE3B0" kalinlik={2.8} />}
            <Text style={[s.tanisYazi, { color: tamam ? '#FFE3B0' : '#2A1D05' }]}>{tamam ? 'Haber vereceğiz' : 'İlk sen tanış'}</Text>
          </Bas>
        </View>
      </View>
      {!sik && (
        <View style={{ gap: 2 }}>
          {[
            { ad: 'Karanlık Ev', alt: 'Yeni oyun · Fener’in ışığıyla', ikon: <Ikon ad="ev" boyut={17} renk={R.murekkep} kalinlik={2} /> },
            { ad: 'Mobil uygulama', alt: 'Android yakında', ikon: <Ikon ad="telefon" boyut={16} renk={R.murekkep} kalinlik={2} /> },
          ].map((x) => (
            <View key={x.ad} style={s.siradaki}>
              <View style={[s.siradakiIk, { backgroundColor: R.ust }]}>{x.ikon}</View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[s.siradakiAd, { color: R.murekkep }]}>{x.ad}</Text>
                <Text style={[s.siradakiAlt, { color: R.soluk }]}>{x.alt}</Text>
              </View>
              <View style={[s.yakindaHap, { backgroundColor: R.ust }]}>
                <Text style={[s.yakindaHapYazi, { color: R.soluk }]}>Yakında</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ---------- telefon: akışın üstünde tek kart (görev + yakında), bugün için kapatılabilir ----------
export function TelefonGorevKarti({ akisaDon }: { akisaDon?: () => void }) {
  const R = useRenk();
  const gorev = useGunlukGorev(akisaDon);
  const figur = useFigur();
  useKutlama(gorev, figur);
  const { tamam: tanisti, tanis } = useTanis();
  const kapaliAnahtar = 'yazsammi_gorev_kart_kapali';
  const [kapali, kapaliAyarla] = useState(() => depoOku(kapaliAnahtar) === gunAnahtar());
  if (kapali) return null;
  const t = gorev.t;
  return (
    <View testID="telefon-gorev" style={[s.telKart, { backgroundColor: R.yukselt, borderColor: R.ince }]}>
      <View style={s.telUst}>
        <Text style={[s.kutuBaslik, { color: R.soluk }]}>GÜNÜN GÖREVİ</Text>
        <View style={[s.seri, { backgroundColor: gorev.seri ? R.altinYumusak : R.ust }]}>
          <Alev boyut={13} renk={gorev.seri ? R.altin : R.soluk} />
          <Text style={[s.seriYazi, { color: gorev.seri ? R.altinYazi : R.soluk }]}>{gorev.seri ? `${gorev.seri} gün` : 'Seri başlat'}</Text>
        </View>
        <View style={{ flex: 1 }} />
        <Bas onPress={() => { depoYaz(kapaliAnahtar, gunAnahtar()); kapaliAyarla(true); }} etiket="Bugün gizle" style={s.telKapat} hitSlop={8}>
          <Ikon ad="kapat" boyut={16} renk={R.soluk} kalinlik={2.2} />
        </Bas>
      </View>
      <View style={s.gorevSatir}>
        <View style={[s.gorevIk, { width: 38, height: 38, borderRadius: 13, backgroundColor: gorev.tamam ? R.vurgu : R.vurguYumusak }]}>
          {gorev.tamam ? <Ikon ad="tik" boyut={18} renk="#fff" kalinlik={2.8} /> : <Ikon ad={t.ikon} boyut={17} renk={R.vurgu} kalinlik={2.2} dolu={t.ikon === 'yildiz'} />}
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
          <Text style={[s.gorevBaslik, { color: R.murekkep, fontSize: 14.5 }]} numberOfLines={1}>{t.baslik}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ flex: 1 }}><Ilerleme oran={gorev.ilerleme / t.hedef} renk={R.vurgu} zemin={R.ust} /></View>
            <Text style={[s.gorevAlt, { color: R.soluk, marginTop: 0 }]}>{gorev.ilerleme}/{t.hedef}</Text>
          </View>
        </View>
        {gorev.tamam ? (
          <Text style={[s.gorevAlt, { color: R.vurgu }]}>Tamam!</Text>
        ) : (
          <Bas onPress={gorev.git} etiket={t.dugme} style={[s.gorevDug, { backgroundColor: R.vurgu }]} hoverRenk={R.vurgu}>
            <Text style={s.gorevDugYazi}>{t.dugme}</Text>
          </Bas>
        )}
      </View>
      <View style={[s.telAyrac, { backgroundColor: R.ince }]} />
      <View style={s.telYakinda}>
        <View style={[s.telSiluet, { backgroundColor: R.gece ? '#0F0B1C' : '#1B1530' }]}>
          <Siluet en={34} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[s.siradakiAd, { color: R.murekkep }]}>Yakında: yeni bir dost</Text>
          <Text style={[s.siradakiAlt, { color: R.soluk }]} numberOfLines={1}>Sonra Karanlık Ev ve Android uygulaması</Text>
        </View>
        <Bas onPress={tanisti ? undefined : tanis} etiket={tanisti ? 'Haber vereceğiz' : 'İlk sen tanış'} style={[s.telTanis, { backgroundColor: tanisti ? R.ust : '#FFC46A' }]}>
          <Text style={[s.tanisYazi, { fontSize: 12.5, color: tanisti ? R.soluk : '#2A1D05' }]}>{tanisti ? 'Haber verilecek' : 'İlk sen tanış'}</Text>
        </Bas>
      </View>
      <Konfeti tetik={gorev.yeniTamam} renkler={[R.vurgu, R.altin, '#FF7AA8', '#3DDC97', '#7CC7FF']} />
    </View>
  );
}

const s = StyleSheet.create({
  kutu: { borderRadius: 24, borderWidth: 1, padding: 18, gap: 12 },
  kutuUst: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kutuBaslik: { fontFamily: yazi.kalin, fontSize: 11.5, letterSpacing: 1.1 },
  suAn: { flexDirection: 'row', alignItems: 'center', gap: 2, borderRadius: 999, paddingLeft: 3, paddingRight: 8, paddingVertical: 1 },
  suAnYazi: { fontFamily: yazi.kalin, fontSize: 10.5, letterSpacing: 0.8 },
  // figür köşesi
  kose: { paddingBottom: 14, gap: 8, overflow: 'visible' },
  koseGovde: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  selam: { fontFamily: yazi.marka, fontSize: 17, letterSpacing: -0.5, lineHeight: 22 },
  figurAd: { fontFamily: yazi.orta, fontSize: 12.5, marginTop: 2 },
  konusma: { borderRadius: 16, borderBottomRightRadius: 5, paddingHorizontal: 12, paddingVertical: 9 },
  konusmaYazi: { fontFamily: yazi.kalin, fontSize: 13.5, lineHeight: 18 },
  kuyruk: { position: 'absolute', right: -5, bottom: 7, width: 12, height: 12, transform: [{ rotate: '45deg' }], borderRadius: 2 },
  sahneKap: { borderRadius: 70 },
  sahne: { width: 132, height: 150, alignItems: 'center', justifyContent: 'center' },
  zemin: { position: 'absolute', left: 30, right: 30, bottom: 6, height: 10, borderRadius: 999 },
  cagir: { width: 84, height: 84, borderRadius: 42, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  cagirYazi: { fontFamily: yazi.kalin, fontSize: 12, textAlign: 'center' },
  cipler: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  hadi: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', height: 28, paddingHorizontal: 11, borderRadius: 999, marginTop: 8 },
  cip: { height: 30, paddingHorizontal: 10, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  cipYazi: { fontFamily: yazi.kalin, fontSize: 12.5 },
  // görev
  seri: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingLeft: 6, paddingRight: 9, height: 24 },
  seriYazi: { fontFamily: yazi.kalin, fontSize: 12 },
  gorevSatir: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  gorevIk: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  gorevBaslik: { fontFamily: yazi.kalin, fontSize: 15, lineHeight: 19 },
  gorevAlt: { fontFamily: yazi.orta, fontSize: 12.5, marginTop: 2 },
  gorevDug: { height: 34, paddingHorizontal: 14, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  gorevDugYazi: { color: '#fff', fontFamily: yazi.kalin, fontSize: 13.5 },
  cubuk: { height: 8, borderRadius: 999, overflow: 'hidden' },
  cubukDolu: { height: '100%', borderRadius: 999 },
  hafta: { flexDirection: 'row', justifyContent: 'space-between' },
  haftaNokta: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  haftaGun: { fontFamily: yazi.orta, fontSize: 10.5 },
  konfeti: { position: 'absolute', left: '50%', top: '45%', width: 0, height: 0 },
  // yakında
  karanlik: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, padding: 12, paddingLeft: 6, overflow: 'hidden' },
  siluetYer: { alignItems: 'center', justifyContent: 'flex-end' },
  yeniBaslik: { color: '#F3EEFF', fontFamily: yazi.marka, fontSize: 14.5, letterSpacing: -0.4, lineHeight: 19 },
  yeniAlt: { color: 'rgba(243,238,255,0.68)', fontFamily: yazi.orta, fontSize: 12.5, lineHeight: 16 },
  tanis: { flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'center', gap: 5, height: 32, paddingHorizontal: 14, borderRadius: 999, marginTop: 6 },
  tanisYazi: { fontFamily: yazi.kalin, fontSize: 13.5 },
  siradaki: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 },
  siradakiIk: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  siradakiAd: { fontFamily: yazi.kalin, fontSize: 13.5 },
  siradakiAlt: { fontFamily: yazi.normal, fontSize: 12 },
  yakindaHap: { borderRadius: 999, paddingHorizontal: 9, height: 22, justifyContent: 'center' },
  yakindaHapYazi: { fontFamily: yazi.kalin, fontSize: 11 },
  // telefon kartı
  telKart: { marginHorizontal: 12, marginTop: 10, marginBottom: 4, borderRadius: 22, borderWidth: 1, padding: 14, gap: 11 },
  telUst: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  telKapat: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: -4 },
  telAyrac: { height: 1 },
  telYakinda: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  telSiluet: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'flex-end', overflow: 'hidden' },
  telTanis: { height: 30, paddingHorizontal: 12, borderRadius: 999, justifyContent: 'center' },
});
