// "Yazsam mı? Canlı" akışının sunucu bağlantısı (plan/16). Sunucu: kod/sunucu topluluk.mjs (/c/...).
// Geliştirirken sunucu yoksa adrese ?mock=1 eklenir: bütün istekler cihazdaki örnek verilerle (canliOrnek.ts) cevaplanır.
// Sunucudan gelen alanlar burada tek biçime çevrilir (alan adı farklarına dayanıklı).
import { Platform } from 'react-native';
import { DENEME_KOPYASI, SUNUCU, cihazBilgi } from '@/analiz';
import { depoOku, depoYaz } from '@/depo';
import { ornekIstek } from '@/canliOrnek';
import { hakYokTeklifi, type Teklif } from '@/magaza/mantik';

// Google girişi istemci kimliği (web OAuth istemcisi). İzin ekranı "Testing" modundayken yalnız test kullanıcıları girebilir;
// bu yüzden deneme kopyasında Google düğmesinin yanında "Test girişi" de durur.
export const GOOGLE_ISTEMCI = process.env.EXPO_PUBLIC_GOOGLE_ISTEMCI || '';

const webAra = () => (Platform.OS === 'web' && typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null);
// 08.11 (YÖNETİM): canlı alan adında (yazsammi.com, www) örnek veri kipi ve "Test girişi" HİÇBİR koşulda açılmaz (?mock=1 dahil).
const CANLI_ALAN = Platform.OS === 'web' && typeof window !== 'undefined' && /(^|\.)yazsammi\.com$/.test(window.location.hostname);
export const ORNEK = (() => {
  const a = webAra();
  return !!a && a.get('mock') === '1' && !CANLI_ALAN;
})();
const YEREL = Platform.OS === 'web' && typeof window !== 'undefined' && /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(window.location.host);
// Yerelde (geliştirme) canlı akış uçları deneme sunucusuna gider; canlı sunucuya hiç dokunulmaz.
// Yerelde ayrıca ?sunucu=http://localhost:PORT ile kendi makinemdeki sunucuya yönlendirilebilir (yalnız localhost adresi; canlıda YEREL false olduğundan hiç işlemez).
const YEREL_SUNUCU = YEREL ? (webAra()?.get('sunucu') ?? '') : '';
// 29.10 (KAHİN uygulama denemesi): emülatörde yerel sunucuya bağlanmak için TEK anahtar, yalnız derleme anında EXPO_PUBLIC_YEREL_SUNUCU=http://10.0.2.2:PORT.
// Canlı/mağaza derlemesinde bu değişken yoktur; satır hiç işlemez.
const UYGULAMA_YEREL = Platform.OS !== 'web' ? (process.env.EXPO_PUBLIC_YEREL_SUNUCU ?? '') : '';
const C_SUNUCU = UYGULAMA_YEREL && /^http:\/\/[\w.\-]+:\d{2,5}$/.test(UYGULAMA_YEREL) ? UYGULAMA_YEREL : YEREL ? (/^http:\/\/(localhost|127\.0\.0\.1):\d{2,5}$/.test(YEREL_SUNUCU) ? YEREL_SUNUCU : (process.env.EXPO_PUBLIC_TEST_SUNUCU || '')) : SUNUCU;
// Test girişi yalnız deneme kopyasında, yerelde ya da örnek veride (canlı sitede asla).
export const TEST_GIRISI = !CANLI_ALAN && (DENEME_KOPYASI || YEREL || ORNEK || !!UYGULAMA_YEREL);

export type Tur = 'metin' | 'sohbet' | 'anket' | 'soru' | 'video' | 'ozellik';
// Balon kimliği (08.10, plan/23 profil A): s şekil, r renk, y bugünkü yüz. Sunucu her yazarda verir (kaydı yoksa eski yüzden türetir).
export type BalonKimlik = { s: string; r: string; y: string };
// Rozet (plan/29_ROZETLER): r rozet adı, s seviye (Bumerang'da kaç kez), n Öncü numarası. vitrin = kişinin adının yanında göstermeyi SEÇTİĞİ tek rozet.
export type Vitrin = { r: string; s: number; n?: number };
export type RozetKayit = { r: string; s: number; t: string; n?: number };
// Kendi rafın: kazanılmayan rozet de gelir (s: 0; esik = seviye eşikleri, deger = ilerleme, gizli = "???"), yeni = henüz kutlanmadı.
export type RafOge = { r: string; s: number; esik?: number[]; deger?: number; hedef?: number; son?: string; gizli?: boolean; t?: string; yeni?: boolean; n?: number };
export type Yazar = { uid: string; ad: string; marka: boolean; yuz?: string; kurucu?: boolean; kurucuDost?: boolean; balon?: BalonKimlik; vitrin?: Vitrin }; // kurucu: altın tik + "kurucu" etiketi
export type Balon = { kim: 'o' | 'ben'; metin: string; saat?: string };
export type KisaYorum = { ad: string; metin: string; marka?: boolean; yuz?: string; kurucu?: boolean; balon?: BalonKimlik };
export type Ozellik = 'gunun' | 'balonlar' | 'gundem' | 'olc';
// "Görüldü" dizisi: sohbet = bölüm, anket = "ne yazsın?". sonraki: güncel anketin sonraki bölüm saati; kazanan/sonrakiBolum: sonuçlanmış anket.
export type Dizi = { ad: string; sezon: number; bolum: number; baslik?: string; final?: boolean; tonlar?: string[]; kazanan?: number | null; sonrakiBolum?: string | null; sonraki?: number | null };
export type DiziSezon = { sezon: number; toplamBolum: number; karakterler: { ben: string; o: string }; bolumler: { bolum: number; baslik: string; sohbet: Gonderi; anket: Gonderi | null }[] };
const videoKapak = (v?: string) => (v && /\/video\/\d+\.mp4$/.test(v) ? v.replace(/\.mp4$/, '.jpg') : undefined);
export type Gonderi = {
  id: string;
  tur: Tur;
  yazar: Yazar;
  zaman: number;
  metin?: string;
  tespit?: boolean;
  balonlar?: Balon[];
  kisi?: string; // sohbet ekranındaki karşı taraf adı
  soru?: string;
  secenekler?: string[];
  oylar?: number[];
  oyum?: number | null;
  video?: string;
  kapak?: string;
  ozellik?: Ozellik;
  baslik?: string;
  dugme?: string;
  begeni: number;
  yorum: number;
  begendim: boolean;
  enIyi?: KisaYorum | null;
  dizi?: Dizi;
  inceleniyor?: boolean;
  foto?: Foto;
  benim?: boolean;
  sabit?: boolean; // kurucunun "Öne çıkar"ı: 24 saat akışın başında
  etiketler?: string[]; // metindeki geçerli @etiketler (dokununca profil)
  alinti?: Alinti; // yeniden paylaşım (#5): bu gönderi bir marka içeriğini kendi akışında paylaşıyor
  yeniden?: number; // marka içeriğinde yeniden paylaşım sayısı (alan varsa "Akışımda paylaş" sunulur)
  yenidenBen?: boolean; // bu içeriği ben zaten akışımda paylaştım
  tribun?: { mac: string; tur: string }; // Tribün'ün akışa yazdığı maç kartı ("Tribüne gir")
  kaynak?: Kaynak; // haber kartı: gönderi gerçek bir haberden üretildiyse kaynağı (url varsa kartın altında "HABER" kutusu çizilir; başlık: baslik)
  haber?: boolean;
  yt?: string; // YouTube video kartı: 11 karakterlik video kimliği (kaynak.ad kanal adı, baslik video başlığı); tıklayınca gömülü oynatıcı
  kategori?: string; // haber/video/hava kartının konusu (spor, ekonomi, dunya, ilginc…): kartta etiket olarak görünür
  hava?: Hava; // hava durumu kartı (günde 2 kez; MET Norway verisi)
};
// Hava kartı (sunucu/hava.mjs kartKur çıktısı). simge: MET simge kodlarından sunucunun ürettiği temel simge; yagis mm; atif: veri sahibi (CC BY 4.0 şartı).
export type HavaSimge = 'acik' | 'azbulutlu' | 'parcali' | 'bulutlu' | 'sis' | 'hafifyagmur' | 'yagmur' | 'saganak' | 'karyagmur' | 'kar' | 'gokgurultulu';
export type HavaSehir = { ad: string; simge: HavaSimge; derece: number; enAz: number; enCok: number; yagis: number };
export type Hava = { donem: 'sabah' | 'aksam'; baslik: string; tarih: string; guncelleme?: string; sehirler: HavaSehir[]; atif: { ad: string; url?: string; lisans?: string } };
// Haber kaynağı: ad alan adı ya da site adı; url yalnız https:// (istemci başka adresi açmaz).
export type Kaynak = { ad: string; url?: string };
// Yeniden paylaşılan içerik: durum 'kaldirildi' ise "Bu gönderi kaldırıldı" kartı. icerik: gönderi ya da markanın cevabı (tur 'yorum': yalnız metin).
export type Alinti = { durum: 'var' | 'kaldirildi'; tur: 'gonderi' | 'yorum'; id?: string; gonderi?: string; yazar?: Yazar; zaman?: number; icerik?: Gonderi; yanitAd?: string };
export type Foto = { url: string; en: number; boy: number };
export type Yorum = { id: string; yazar: Yazar; metin: string; zaman: number; begeni: number; begendim: boolean; cevap?: string | null; cevaplar: Yorum[]; benim?: boolean; etiketler?: string[]; yanit?: string; yanitAd?: string; yeniden?: number; yenidenBen?: boolean }; // yanit/yanitAd: kime yanıt; yeniden: markanın cevabında yeniden paylaşım sayısı
export type Uye = { uid: string; ad: string; yeni: boolean; adsizEski?: boolean; yuz?: string; davetGerekli?: boolean; sozGerekli?: boolean; kurucu?: boolean; kurucuDost?: boolean; balon?: BalonKimlik; duvar?: string; oncu?: boolean; vitrin?: Vitrin }; // davetGerekli: canlıda davetle açılış (DAVET_KODLARI); kurucu: ⋯ menüsünde yönetim; sozGerekli: güncel sözleşme sürümü onaylanmadı (pencere 'soz', yazma kilitli)
// Profildeki "Mesaj" düğmesi: karşılıklı takipte ya da zaten sohbet/istek varken görünür.
// neden: düğme kapalıysa sebebi (takip_et: sen takip etmiyorsun · onun_takibi: o seni takip etmiyor · kapali: mesajlarını kapatmış).
export type MesajKapi = { goster: boolean; sohbet?: string | null; durum?: 'istek' | 'acik' | null; yeniHesap?: boolean; neden?: 'takip_et' | 'onun_takibi' | 'kapali' | null };
export type Profil = { uye: Yazar & { takipci: number; takip: number; bag: number; duvar?: string; katilim?: number; gonderiSayisi: number; takipEdiyorum: boolean; takipEdiyorBeni?: boolean; ben: boolean; mesaj?: MesajKapi | null; rozetler?: RozetKayit[]; raf?: RafOge[] }; gonderiler: Gonderi[] };
export type ZilTur = 'begeni' | 'yorum_begeni' | 'yorum' | 'cevap' | 'takip' | 'mesaj_istek' | 'mesaj' | 'anma';
export type Zil = { id: string; tur: ZilTur | 'dizi' | 'rozet' | 'tribun'; kisiler: string[]; sayi: number; hedef?: string; tribunMac?: string; ozet?: string; zaman: number; okundu: boolean; baslik?: string; rozetler?: { r: string; s: number }[] };
export type Sebep = 'beni_anlatiyor' | 'kisisel_bilgi' | 'cocuk' | 'hakaret' | 'spam' | 'uygunsuz';
// 09.10 engel uyarısı: sunucu 422'de kod/uyari/ifade/ciddi, 400 uzunluk'ta kod/uyari/tavan da yollar (eski sunucuda yok: istemci yerel metne döner).
export type Sonuc<T> = { ok: true; veri: T } | { ok: false; durum: number; hata: string; sebep?: string; sohbet?: string; kod?: string; uyari?: string; ifade?: string[]; ciddi?: boolean; tavan?: number; urun?: string; secenekler?: string[] };

// --- oturum ---
const OTURUM_ANAHTARI = 'yazsammi.canli.oturum';
const UYE_ANAHTARI = 'yazsammi.canli.uye';
let oturum: string | null = depoOku(OTURUM_ANAHTARI);
export function oturumVar() {
  return !!oturum;
}
export function kayitliUye(): Uye | null {
  try {
    const u = depoOku(UYE_ANAHTARI);
    return u && oturum ? (JSON.parse(u) as Uye) : null;
  } catch {
    return null;
  }
}
// Oturum değişince (giriş, takma ad, çıkış, hesap silme, 401) dinleyenler uyarılır: uygulama kapısı (bilesenler/canli/UygulamaKapisi.tsx) bununla açılıp kapanır.
const oturumDinleyen = new Set<() => void>();
export function oturumDinle(f: () => void) {
  oturumDinleyen.add(f);
  return () => {
    oturumDinleyen.delete(f);
  };
}
function oturumOlayYay() {
  oturumDinleyen.forEach((f) => f());
}
function oturumYaz(o: string | null, u: Uye | null) {
  oturum = o;
  depoYaz(OTURUM_ANAHTARI, o ?? '');
  depoYaz(UYE_ANAHTARI, u ? JSON.stringify(u) : '');
  if (!o) oturum = null;
  oturumOlayYay();
}
// 18.11 (anlık bildirim): çıkıştan HEMEN ÖNCE (oturum jetonu hâlâ geçerliyken) çalışır; src/bildirim/BildirimKopru.tsx cihaz jetonunu sunucudan sildirir.
const cikisDinleyen = new Set<() => void>();
export function cikisOnceDinle(f: () => void) {
  cikisDinleyen.add(f);
  return () => {
    cikisDinleyen.delete(f);
  };
}
export function cikis() {
  cikisDinleyen.forEach((f) => {
    try {
      f();
    } catch {}
  });
  oturumYaz(null, null);
}
// Web: başka sekme ya da statik bölüm sayfası (site/uyelik/uyelik.js, site/giris/) aynı depo anahtarlarına giriş yazmış olabilir.
// Depoyu yeniden okur; kayıtlı üyeyi (ya da çıkış yapıldıysa null) döner. Uygulamada depo yalnız bu sürece aittir, hep aynı kalır.
export function oturumTazele(): Uye | null {
  const o = depoOku(OTURUM_ANAHTARI);
  oturum = o ? o : null;
  return kayitliUye();
}
// Cihaz kimliği analiz.ts'in ürettiği adsız kimlik (oturumsuz anket oyu için).
const cihaz = () => cihazBilgi()?.c ?? ''; // 22.10: yalnız ölçüm izni verildiyse (analiz.ts)
export const cihazVar = () => !!cihaz(); // 20.11 (E-22): anket oyu için giriş gerekir mi (src/oy.ts)

// 18.11 (iOS satın alma): satın alma penceresi (src/magaza/Magaza.tsx) kendini buraya kaydeder; true dönerse (satın alma tamam) istek yeniden denenir.
let hakYokDinleyen: ((t: Teklif, yol: string) => Promise<boolean>) | null = null;
export function hakYokDinle(f: (t: Teklif, yol: string) => Promise<boolean>) {
  hakYokDinleyen = f;
  return () => {
    if (hakYokDinleyen === f) hakYokDinleyen = null;
  };
}

async function istek<T>(yol: string, govde?: unknown, yontem?: 'GET' | 'POST', tekrar = false): Promise<Sonuc<T>> {
  const m = yontem ?? (govde === undefined ? 'GET' : 'POST');
  if (ORNEK) return ornekIstek(yol, m, govde, oturum) as Promise<Sonuc<T>>;
  // iOS'ta Tribün yok (Build 4, Onur 18.11): sunucu iOS'a 404 dönüyor; hiç istek atılmaz. Android ve web'de aynen.
  if (Platform.OS === 'ios' && yol.startsWith('/c/tribun')) return { ok: false, durum: 404, hata: 'kapali' };
  try {
    const basliklar: Record<string, string> = { 'X-Cihaz': cihaz() };
    if (govde !== undefined) basliklar['Content-Type'] = 'application/json';
    if (oturum) basliklar.Authorization = `Bearer ${oturum}`;
    const r = await fetch(`${C_SUNUCU}${yol}`, { method: m, headers: basliklar, body: govde === undefined ? undefined : JSON.stringify(govde) });
    let d: any = null;
    try {
      d = await r.json();
    } catch {}
    if (r.status === 401 && oturum) oturumYaz(null, null);
    if (!r.ok && Platform.OS !== 'web' && !tekrar && hakYokDinleyen && (r.status === 402 || r.status === 503)) {
      // 18.11 (iOS satın alma): Derin Tarot / harita / uyum isteği 402 hak_yok dönerse satın alma penceresi açılır; satın alma bitince istek bir kez yeniden denenir. 503 yogun: sakin mesaj, pencere açılmaz.
      const t = hakYokTeklifi(r.status, d, yol, govde);
      if (t && (await hakYokDinleyen(t, yol))) return istek<T>(yol, govde, yontem, true);
    }
    if (!r.ok) return { ok: false, durum: r.status, hata: (d && (d.hata || d.mesaj)) || 'hata', ...(d?.sebep ? { sebep: String(d.sebep) } : {}), ...(d?.sohbet ? { sohbet: String(d.sohbet) } : {}), ...(typeof d?.kod === 'string' ? { kod: d.kod } : {}), ...(typeof d?.uyari === 'string' ? { uyari: d.uyari } : {}), ...(Array.isArray(d?.ifade) ? { ifade: d.ifade.map(String) } : {}), ...(d?.ciddi ? { ciddi: true } : {}), ...(typeof d?.tavan === 'number' ? { tavan: d.tavan } : {}), ...(typeof d?.urun === 'string' ? { urun: d.urun } : {}), ...(Array.isArray(d?.secenekler) ? { secenekler: d.secenekler.map(String) } : {}) };
    return { ok: true, veri: d as T };
  } catch {
    return { ok: false, durum: 0, hata: 'baglanti' };
  }
}

// --- biçim çevirme ---
const sayi = (x: unknown, v = 0) => (typeof x === 'number' && isFinite(x) ? x : typeof x === 'string' && x.trim() && !isNaN(+x) ? +x : v);
const zamanCevir = (x: unknown) => {
  if (typeof x === 'number') return x < 1e12 ? x * 1000 : x;
  if (typeof x === 'string') {
    const t = Date.parse(x);
    if (!isNaN(t)) return t;
  }
  if (x && typeof x === 'object' && '_seconds' in (x as any)) return (x as any)._seconds * 1000;
  return Date.now();
};
function yazarCevir(g: any): Yazar {
  const y = g?.yazar && typeof g.yazar === 'object' ? g.yazar : g;
  const ad = String(y?.ad ?? y?.yazarAd ?? y?.takmaAd ?? g?.yazarAd ?? 'yazsammi');
  const marka = !!(y?.marka ?? y?.rozet ?? y?.yapayZeka ?? g?.marka ?? (y?.uid === 'marka' || y?.uid === 'yazsammi' || ad === 'yazsammi'));
  return { uid: String(y?.uid ?? g?.uid ?? ad), ad, marka, yuz: y?.yuz ?? undefined, ...(y?.kurucu && !marka ? { kurucu: true } : {}), ...(y?.kurucuDost === true && !marka && !y?.kurucu ? { kurucuDost: true } : {}), ...(balonCevir(y?.balon) ? { balon: balonCevir(y?.balon)! } : {}), ...(vitrinCevir(y?.vitrin) ? { vitrin: vitrinCevir(y?.vitrin)! } : {}) };
}
export function vitrinCevir(v: any): Vitrin | undefined {
  return v && typeof v === 'object' && typeof v.r === 'string' ? { r: v.r, s: sayi(v.s, 1), ...(typeof v.n === 'number' ? { n: v.n } : {}) } : undefined;
}
export function balonCevir(b: any): BalonKimlik | undefined {
  return b && typeof b === 'object' && typeof b.s === 'string' && typeof b.r === 'string' && typeof b.y === 'string' ? { s: b.s, r: b.r, y: b.y } : undefined;
}
// 09.10: eski bölümlere (Günün Cümlesi, Balon Avı, Ölç, eski Gündem) kapı kartı olan marka gönderileri akışta ve profillerde görünmez.
export const eskiKapiDegil = (g: Gonderi) => g.tur !== 'ozellik';
export function gonderiCevir(g: any): Gonderi {
  const secenekHam: any[] = Array.isArray(g.secenekler) ? g.secenekler : [];
  const secenekler = secenekHam.map((s) => (typeof s === 'string' ? s : String(s?.metin ?? s?.ad ?? '')));
  const oylar = Array.isArray(g.oylar) ? g.oylar.map((x: unknown) => sayi(x)) : secenekHam.map((s) => sayi(s?.oy ?? s?.sayi));
  const enIyiHam = g.enIyi ?? g.enIyiYorum ?? g.ilkYorum ?? null;
  const tur: Tur = (['metin', 'sohbet', 'anket', 'soru', 'video', 'ozellik'] as const).includes(g.tur) ? g.tur : 'metin';
  return {
    id: String(g.id),
    tur,
    yazar: yazarCevir(g),
    zaman: zamanCevir(g.zaman ?? g.olusturma ?? g.tarih),
    metin: g.metin ?? undefined,
    tespit: !!(g.tespit || g.alt === 'tespit' || g.stil === 'tespit'),
    balonlar: Array.isArray(g.balonlar) ? g.balonlar.map((b: any) => ({ kim: b.kim === 'ben' ? 'ben' : 'o', metin: String(b.metin ?? ''), saat: b.saat })) : undefined,
    kisi: g.kisi ?? g.karsi ?? undefined,
    soru: g.soru ?? undefined,
    secenekler: secenekler.length ? secenekler : undefined,
    oylar: secenekler.length ? secenekler.map((_, i) => oylar[i] ?? 0) : undefined,
    oyum: typeof (g.oyum ?? g.benimOyum) === 'number' ? (g.oyum ?? g.benimOyum) : null,
    video: g.video ?? g.url ?? undefined,
    kapak: g.kapak ?? videoKapak(g.video ?? g.url),
    ozellik: g.ozellik ?? g.kapi ?? g.hedef ?? undefined,
    baslik: g.baslik ?? undefined,
    dugme: g.dugme ?? undefined,
    begeni: sayi(g.begeni ?? g.begeniSayisi),
    yorum: sayi(g.yorum ?? g.yorumSayisi),
    begendim: !!g.begendim,
    dizi: g.dizi && typeof g.dizi === 'object' ? { ad: String(g.dizi.ad ?? 'Görüldü'), sezon: sayi(g.dizi.sezon, 1), bolum: sayi(g.dizi.bolum, 1), baslik: g.dizi.baslik ?? undefined, final: !!g.dizi.final, tonlar: Array.isArray(g.dizi.tonlar) ? g.dizi.tonlar.map(String) : undefined, kazanan: typeof g.dizi.kazanan === 'number' ? g.dizi.kazanan : null, sonrakiBolum: g.dizi.sonrakiBolum ?? null, sonraki: g.dizi.sonraki ? zamanCevir(g.dizi.sonraki) : null } : undefined,
    enIyi: enIyiHam ? { ad: String(enIyiHam.ad ?? enIyiHam.yazar?.ad ?? ''), metin: String(enIyiHam.metin ?? ''), marka: !!(enIyiHam.marka ?? enIyiHam.yazar?.marka), yuz: enIyiHam.yuz ?? enIyiHam.yazar?.yuz, kurucu: !!(enIyiHam.kurucu ?? enIyiHam.yazar?.kurucu), balon: balonCevir(enIyiHam.balon ?? enIyiHam.yazar?.balon) } : null,
    inceleniyor: !!(g.inceleniyor || g.durum === 'inceleniyor' || g.durum === 'bekliyor'),
    foto: g.foto && typeof g.foto.url === 'string' ? { url: g.foto.url, en: sayi(g.foto.en, 4), boy: sayi(g.foto.boy, 3) } : undefined,
    benim: !!g.benim,
    ...(g.sabit ? { sabit: true } : {}),
    ...(Array.isArray(g.etiketler) && g.etiketler.length ? { etiketler: g.etiketler.map(String) } : {}),
    ...(g.alinti && typeof g.alinti === 'object' ? { alinti: alintiCevir(g.alinti) } : {}),
    ...(typeof g.yeniden === 'number' ? { yeniden: g.yeniden } : {}),
    ...(g.yenidenBen ? { yenidenBen: true } : {}),
    ...(g.tribun?.mac ? { tribun: { mac: String(g.tribun.mac), tur: String(g.tribun.tur ?? '') } } : {}),
    ...(kaynakCevir(g.kaynak) ? { kaynak: kaynakCevir(g.kaynak)! } : {}),
    ...(g.haber ? { haber: true } : {}),
    ...(ytCevir(g.yt) ? { yt: ytCevir(g.yt)! } : {}),
    ...(typeof g.kategori === 'string' && /^[a-z_]{2,20}$/.test(g.kategori) ? { kategori: g.kategori } : {}),
    ...(havaCevir(g.hava) ? { hava: havaCevir(g.hava)! } : {}),
  };
}
const HAVA_SIMGELERI: HavaSimge[] = ['acik', 'azbulutlu', 'parcali', 'bulutlu', 'sis', 'hafifyagmur', 'yagmur', 'saganak', 'karyagmur', 'kar', 'gokgurultulu'];
// Hava kartı: bilinmeyen simge "bulutlu"ya düşer; sayı olmayan alanlı şehir atılır; en az bir şehir şart. Atıf bağlantısı yalnız https.
export function havaCevir(h: any): Hava | undefined {
  if (!h || typeof h !== 'object' || !Array.isArray(h.sehirler)) return undefined;
  const say = (x: any) => (typeof x === 'number' && Number.isFinite(x) ? x : null);
  const sehirler: HavaSehir[] = h.sehirler.slice(0, 8).flatMap((s: any) => {
    const derece = say(s?.derece), enAz = say(s?.enAz), enCok = say(s?.enCok), yagis = say(s?.yagis);
    if (typeof s?.ad !== 'string' || !s.ad || derece === null || enAz === null || enCok === null) return [];
    return [{ ad: s.ad.slice(0, 24), simge: HAVA_SIMGELERI.includes(s.simge) ? s.simge : 'bulutlu', derece, enAz, enCok, yagis: yagis ?? 0 } as HavaSehir];
  });
  if (!sehirler.length) return undefined;
  const atifUrl = typeof h.atif?.url === 'string' && /^https:\/\/[^\s]+$/i.test(h.atif.url) ? h.atif.url : undefined;
  return {
    donem: h.donem === 'aksam' ? 'aksam' : 'sabah', baslik: typeof h.baslik === 'string' && h.baslik ? h.baslik.slice(0, 40) : 'Hava durumu', tarih: String(h.tarih ?? ''),
    ...(typeof h.guncelleme === 'string' && /^\d{2}:\d{2}$/.test(h.guncelleme) ? { guncelleme: h.guncelleme } : {}), sehirler,
    atif: { ad: typeof h.atif?.ad === 'string' && h.atif.ad ? h.atif.ad.slice(0, 40) : 'MET Norway', ...(atifUrl ? { url: atifUrl } : {}), ...(typeof h.atif?.lisans === 'string' ? { lisans: h.atif.lisans.slice(0, 20) } : {}) },
  };
}
// YouTube video kimliği: yalnız 11 karakter [A-Za-z0-9_-] kabul edilir (başka her şey düşer; iframe adresine ham değer girmez).
export function ytCevir(y: any): string | undefined {
  return typeof y === 'string' && /^[A-Za-z0-9_-]{11}$/.test(y) ? y : undefined;
}
// Haber kaynağı: yalnız https:// adresler alınır (javascript:, http: vb. düşer; ad yine gösterilebilir).
export function kaynakCevir(k: any): Kaynak | undefined {
  if (!k || typeof k !== 'object') return undefined;
  const url = typeof k.url === 'string' && /^https:\/\/[^\s]+$/i.test(k.url.trim()) ? k.url.trim() : undefined;
  const ad = typeof k.ad === 'string' ? k.ad : '';
  return url || ad ? { ad, ...(url ? { url } : {}) } : undefined;
}
function alintiCevir(a: any): Alinti {
  const tur = a.tur === 'yorum' ? 'yorum' : 'gonderi';
  if (a.durum !== 'var' || !a.icerik) return { durum: 'kaldirildi', tur };
  return { durum: 'var', tur, id: String(a.id), gonderi: String(a.gonderi ?? a.id), yazar: yazarCevir(a), zaman: zamanCevir(a.zaman), icerik: gonderiCevir({ ...a.icerik, yazar: a.yazar, zaman: a.zaman }), ...(a.yanitAd ? { yanitAd: String(a.yanitAd) } : {}) };
}
function yorumCevir(y: any): Yorum {
  return { id: String(y.id), yazar: yazarCevir(y), metin: String(y.metin ?? ''), zaman: zamanCevir(y.zaman ?? y.olusturma), begeni: sayi(y.begeni), begendim: !!y.begendim, cevap: y.cevap ?? y.ust ?? null, cevaplar: Array.isArray(y.cevaplar) ? y.cevaplar.map(yorumCevir) : [], benim: !!y.benim, ...(y.yanit ? { yanit: String(y.yanit), yanitAd: String(y.yanitAd ?? '') } : {}), ...(Array.isArray(y.etiketler) && y.etiketler.length ? { etiketler: y.etiketler.map(String) } : {}), ...(typeof y.yeniden === 'number' ? { yeniden: y.yeniden } : {}), ...(y.yenidenBen ? { yenidenBen: true } : {}) };
}
// Düz liste gelirse tek seviyelik ağaca çevrilir.
function agacKur(liste: Yorum[]): Yorum[] {
  const kok = liste.filter((y) => !y.cevap);
  const harita = new Map(kok.map((y) => [y.id, y]));
  for (const y of liste) if (y.cevap && harita.has(y.cevap)) harita.get(y.cevap)!.cevaplar.push(y);
  return kok;
}

// --- uçlar ---
export type AkisSayfa = { gonderiler: Gonderi[]; imlec: string | null };
export async function akisGetir(tur: 'hepsi' | 'takip', once?: string | null): Promise<Sonuc<AkisSayfa>> {
  const r = await istek<any>(`/c/akis?tur=${tur}${once ? `&once=${encodeURIComponent(once)}` : ''}`);
  if (!r.ok) return r;
  const d = r.veri ?? {};
  const liste: any[] = d.gonderiler ?? d.liste ?? d.ogeler ?? (Array.isArray(d) ? d : []);
  return { ok: true, veri: { gonderiler: liste.map(gonderiCevir).filter(eskiKapiDegil), imlec: d.imlec ?? d.once ?? d.sonraki ?? null } };
}
export async function yeniSay(sonra: number): Promise<{ sayi: number; burada: number | null; zil: number | null; mesaj: number | null; rozet: number | null } | null> {
  const r = await istek<any>(`/c/yeni?sonra=${sonra}`);
  if (!r.ok) return null;
  return { sayi: sayi(r.veri?.sayi ?? r.veri?.yeni), burada: r.veri?.burada == null ? null : sayi(r.veri.burada), zil: typeof r.veri?.zil === 'number' ? r.veri.zil : null, mesaj: typeof r.veri?.mesaj === 'number' ? r.veri.mesaj : null, rozet: typeof r.veri?.rozet === 'number' ? r.veri.rozet : null };
}
export async function gonderiGetir(id: string): Promise<Sonuc<{ gonderi: Gonderi; yorumlar: Yorum[] }>> {
  const r = await istek<any>(`/c/gonderi/${encodeURIComponent(id)}`);
  if (!r.ok) return r;
  const d = r.veri ?? {};
  const ham: Yorum[] = (d.yorumlar ?? []).map(yorumCevir);
  const duz = ham.some((y) => y.cevap);
  return { ok: true, veri: { gonderi: gonderiCevir(d.gonderi ?? d), yorumlar: duz ? agacKur(ham) : ham } };
}
// foto: istemcide küçültülmüş JPEG (base64, ön eksiz) + boyutları.
export async function gonderiPaylas(metin: string, foto?: { veri: string; en: number; boy: number } | null): Promise<Sonuc<Gonderi>> {
  const r = await istek<any>('/c/gonderi', { metin, ...(foto ? { foto } : {}) });
  if (!r.ok) return r;
  return { ok: true, veri: gonderiCevir(r.veri?.gonderi ?? r.veri) };
}
export async function yorumYaz(gonderi: string, metin: string, cevap?: string | null): Promise<Sonuc<Yorum>> {
  const r = await istek<any>('/c/yorum', { gonderi, metin, ...(cevap ? { cevap } : {}) });
  if (!r.ok) return r;
  return { ok: true, veri: yorumCevir(r.veri?.yorum ?? r.veri) };
}
// Yeniden paylaş (#5): marka gönderisini ('gonderi') ya da cevabını ('yorum') kendi akışında paylaş; metin isteğe bağlı (en çok YENIDEN_SINIR harf).
export const YENIDEN_SINIR = 140;
export async function yenidenPaylas(hedef: string, tur: 'gonderi' | 'yorum', metin: string): Promise<Sonuc<{ gonderi: Gonderi; yeniden: number }>> {
  const r = await istek<any>('/c/yeniden', { hedef, tur, ...(metin ? { metin } : {}) });
  if (!r.ok) return r;
  return { ok: true, veri: { gonderi: gonderiCevir(r.veri?.gonderi ?? r.veri), yeniden: sayi(r.veri?.yeniden) } };
}
export const begen = (hedef: string, tur: 'gonderi' | 'yorum') => istek<{ begendim?: boolean; begeni?: number }>('/c/begen', { hedef, tur });
export async function oyVer(gonderi: string, secenek: number): Promise<Sonuc<{ oylar?: number[] }>> {
  const r = await istek<any>('/c/oy', { gonderi, secenek });
  if (!r.ok) return r;
  const d = r.veri ?? {};
  const oylar = Array.isArray(d.oylar) ? d.oylar.map((x: unknown) => sayi(x)) : Array.isArray(d.secenekler) ? d.secenekler.map((s: any) => sayi(s?.oy)) : undefined;
  return { ok: true, veri: { oylar } };
}
export const takipEt = (uid: string) => istek<{ takip?: boolean }>('/c/takip', { uid });
export async function profilGetir(ad: string): Promise<Sonuc<Profil>> {
  const r = await istek<any>(`/c/profil/${encodeURIComponent(ad)}`);
  if (!r.ok) return r;
  const d = r.veri ?? {};
  const u = d.uye ?? d.profil ?? d;
  const y = yazarCevir(u);
  return {
    ok: true,
    veri: {
      uye: { ...y, takipci: sayi(u.takipci), takip: sayi(u.takip), bag: sayi(u.bag), duvar: typeof u.duvar === 'string' ? u.duvar : undefined, katilim: u.katilim ? zamanCevir(u.katilim) : undefined, gonderiSayisi: sayi(u.gonderiSayisi ?? u.gonderi ?? (d.gonderiler ?? []).length), takipEdiyorum: !!(u.takipEdiyorum ?? u.takipte), takipEdiyorBeni: !!u.takipEdiyorBeni, ben: !!(u.ben ?? u.benim), mesaj: u.mesaj && typeof u.mesaj === 'object' ? { goster: !!u.mesaj.goster, sohbet: u.mesaj.sohbet ?? null, durum: u.mesaj.durum ?? null, yeniHesap: !!u.mesaj.yeniHesap, neden: ['takip_et', 'onun_takibi', 'kapali'].includes(u.mesaj.neden) ? u.mesaj.neden : null } : null, ...(Array.isArray(u.rozetler) ? { rozetler: u.rozetler.map(kayitCevir) } : {}), ...(Array.isArray(u.raf) ? { raf: u.raf.map(rafCevir) } : {}) },
      gonderiler: (d.gonderiler ?? []).map(gonderiCevir).filter(eskiKapiDegil),
    },
  };
}
export async function zilGetir(): Promise<Sonuc<{ liste: Zil[]; okunmamis: number }>> {
  const r = await istek<any>('/c/zil');
  if (!r.ok) return r;
  const d = r.veri ?? {};
  const liste: Zil[] = (d.bildirimler ?? d.liste ?? []).map((z: any) => ({
    id: String(z.id),
    tur: (['begeni', 'yorum_begeni', 'yorum', 'cevap', 'takip', 'mesaj_istek', 'mesaj', 'anma'] as const).includes(z.tur) ? z.tur : 'begeni',
    kisiler: Array.isArray(z.kisiler) ? z.kisiler.map(String) : Array.isArray(z.adlar) ? z.adlar.map(String) : z.kim ? [String(z.kim)] : [],
    sayi: sayi(z.sayi, Array.isArray(z.kisiler) ? z.kisiler.length : 1),
    // Gönderiye gider: yorum bildiriminde yorumun gönderisi; takipte hedef yok (profil açılır).
    hedef: z.hedefTur === 'uye' || z.tur === 'takip' || z.tur === 'mesaj' || z.tur === 'mesaj_istek' ? undefined : z.hedefTur === 'yorum' ? z.gonderi ?? undefined : z.hedef ?? z.gonderi ?? undefined,
    ozet: z.ozet ?? z.metin ?? undefined,
    zaman: zamanCevir(z.zaman),
    okundu: !!z.okundu,
    ...(z.tur === 'anma' && z.hedefTur === 'tribun' ? { hedef: String(z.hedef ?? ''), tribunMac: String(z.hedef ?? '') } : {}), // Tribün odasında etiketlendi: dokununca o oda açılır
    ...(z.tur === 'tribun' ? { tur: 'tribun' as const, baslik: String(z.metin ?? ''), hedef: String(z.hedef ?? '') } : {}), // Tribün: karar anı etiketi, odayı açar
    ...(z.tur === 'dizi' ? { tur: 'dizi' as const, baslik: String(z.metin ?? '') } : {}), // Görüldü: "senin seçtiğin oldu / olmadı"
    ...(z.tur === 'rozet' ? { tur: 'rozet' as const, baslik: String(z.metin ?? ''), rozetler: (Array.isArray(z.rozetler) ? z.rozetler : []).map((x: unknown) => { const [r, s] = String(x).split(':'); return { r, s: sayi(s, 1) }; }) } : {}), // rozet rafına yeni rozet geldi
  }));
  return { ok: true, veri: { liste, okunmamis: sayi(d.okunmamis, liste.filter((z) => !z.okundu).length) } };
}
// @ önerisi: etiketleyebileceğin kişiler (sunucu kuralı: karşılıklı takip + Yazsam mı? + kurucu; kurucu herkesi).
export async function etiketAdaylari(q: string): Promise<Yazar[]> {
  const r = await istek<any>(`/c/etiket?q=${encodeURIComponent(q)}`);
  return r.ok && Array.isArray(r.veri?.liste) ? r.veri.liste.map(yazarCevir) : [];
}
export const zilOkundu = () => istek<unknown>('/c/zil/okundu', {});
// 18.11 anlık bildirim (sunucu bildirim_push.mjs): ayar, cihaz jetonu kaydı/silme
export const bildirimAyarGetir = () => istek<any>('/c/bildirim/ayar');
export const bildirimAyarKaydet = (a: Record<string, boolean>) => istek<any>('/c/bildirim/ayar', a);
export const bildirimJetonKaydet = (jeton: string, platform: 'ios' | 'android') => istek<unknown>('/c/bildirim/jeton', { jeton, platform });
export const bildirimJetonSil = (jeton: string) => istek<unknown>('/c/bildirim/jeton-sil', { jeton });
export const bildir = (hedef: string, sebep: Sebep) => istek<unknown>('/c/bildir', { hedef, sebep });
export async function diziGetir(sezon?: number): Promise<Sonuc<DiziSezon>> {
  const r = await istek<any>(`/c/dizi${sezon ? `?sezon=${sezon}` : ''}`);
  if (!r.ok) return r;
  const d = r.veri ?? {};
  return {
    ok: true,
    veri: {
      sezon: sayi(d.sezon, 1),
      toplamBolum: sayi(d.toplamBolum, 21),
      karakterler: { ben: String(d.karakterler?.ben ?? ''), o: String(d.karakterler?.o ?? '') },
      bolumler: (d.bolumler ?? []).map((b: any) => ({ bolum: sayi(b.bolum), baslik: String(b.baslik ?? ''), sohbet: gonderiCevir(b.sohbet), anket: b.anket ? gonderiCevir(b.anket) : null })),
    },
  };
}
export const sil = (hedef: string, tur: 'gonderi' | 'yorum') => istek<unknown>('/c/sil', { hedef, tur });

// --- özel mesaj (plan/16 2. adım) ---
// hatirla: Yazsam mı? hesabı seni hatırlasın (sunucu hafiza.mjs); markaYazsin: Yazsam mı? bana kendiliğinden yazabilir (uzun süre uğramayınca)
export type MesajAyar = { mesajAl: 'takip' | 'kimse'; okunduGoster: boolean; hatirla: boolean; markaYazsin: boolean };
export type SohbetOzet = { id: string; kisi: Yazar; durum: 'istek' | 'acik'; giden: boolean; son: { metin: string; ben: boolean; zaman: number } | null; okunmamis: number; zaman: number; yaziyor?: boolean };
// marka: "Yazsam mı?" ile özel sohbet (Mesajlar'da en üstte sabit; henüz yazışma yoksa son: null)
export type Kutular = { marka: SohbetOzet | null; sohbetler: SohbetOzet[]; istekler: SohbetOzet[]; okunmamis: number; ayar: MesajAyar };
export type Mesaj = { id: string; ben: boolean; metin: string; zaman: number; gidiyor?: boolean };
export type SohbetBilgi = { id: string; kisi: Yazar; durum: 'istek' | 'acik' | 'engelli'; giden: boolean; marka?: boolean };
export type SohbetVeri = { sohbet: SohbetBilgi; mesajlar: Mesaj[]; karsiOkundu: number | null; okunduKapali: boolean; imlec: number | null; yaziyor: boolean };
export const MARKA_SOHBET = 'yazsammi'; // markayla özel sohbetin adresi (/c/mesaj/yazsammi)
const ayarCevir = (a: any): MesajAyar => ({ mesajAl: a?.mesajAl === 'kimse' ? 'kimse' : 'takip', okunduGoster: a?.okunduGoster !== false, hatirla: a?.hatirla !== false, markaYazsin: a?.markaYazsin !== false });
const ozetCevir = (x: any): SohbetOzet => ({ id: String(x.id), kisi: yazarCevir(x.kisi ?? {}), durum: x.durum === 'acik' ? 'acik' : 'istek', giden: !!x.giden, son: x.son ? { metin: String(x.son.metin ?? ''), ben: !!x.son.ben, zaman: zamanCevir(x.son.zaman) } : null, okunmamis: sayi(x.okunmamis), zaman: x.zaman ? zamanCevir(x.zaman) : 0, ...(x.yaziyor ? { yaziyor: true } : {}) });
const mesajCevir = (m: any): Mesaj => ({ id: String(m.id), ben: !!m.ben, metin: String(m.metin ?? ''), zaman: zamanCevir(m.zaman) });
export async function kutularGetir(): Promise<Sonuc<Kutular>> {
  const r = await istek<any>('/c/mesaj/kutular');
  if (!r.ok) return r;
  const d = r.veri ?? {};
  return { ok: true, veri: { marka: d.marka ? ozetCevir(d.marka) : null, sohbetler: (d.sohbetler ?? []).map(ozetCevir), istekler: (d.istekler ?? []).map(ozetCevir), okunmamis: sayi(d.okunmamis), ayar: ayarCevir(d.ayar) } };
}
export async function sohbetGetir(id: string, secenek: { sonra?: number; once?: number } = {}): Promise<Sonuc<SohbetVeri>> {
  const q = secenek.sonra ? `?sonra=${secenek.sonra}` : secenek.once ? `?once=${secenek.once}` : '';
  const r = await istek<any>(`/c/mesaj/${encodeURIComponent(id)}${q}`);
  if (!r.ok) return r;
  const d = r.veri ?? {};
  const s = d.sohbet ?? {};
  return {
    ok: true,
    veri: {
      sohbet: { id: String(s.id ?? id), kisi: yazarCevir(s.kisi ?? {}), durum: s.durum === 'acik' ? 'acik' : s.durum === 'engelli' ? 'engelli' : 'istek', giden: !!s.giden, ...(s.marka ? { marka: true } : {}) },
      mesajlar: (d.mesajlar ?? []).map(mesajCevir),
      karsiOkundu: typeof d.karsiOkundu === 'number' ? d.karsiOkundu : null,
      okunduKapali: !!d.okunduKapali,
      imlec: typeof d.imlec === 'number' ? d.imlec : null,
      yaziyor: !!d.yaziyor,
    },
  };
}
export async function mesajGonder(id: string, metin: string): Promise<Sonuc<Mesaj>> {
  const r = await istek<any>(`/c/mesaj/${encodeURIComponent(id)}`, { metin });
  if (!r.ok) return r;
  return { ok: true, veri: mesajCevir(r.veri?.mesaj ?? {}) };
}
export const istekGonder = (uid: string, metin: string) => istek<{ sohbet: string }>('/c/mesaj/istek', { uid, metin });
export const sohbetIslem = (id: string, is: 'kabul' | 'sil' | 'okundu' | 'engelle', bildirAyni?: boolean) => istek<{ okunmamis?: number }>(`/c/mesaj/${encodeURIComponent(id)}/${is}`, is === 'engelle' ? { bildir: !!bildirAyni } : {});
export async function ayarGetir(): Promise<Sonuc<MesajAyar>> {
  const r = await istek<any>('/c/ayar');
  if (!r.ok) return r;
  return { ok: true, veri: ayarCevir(r.veri?.ayar) };
}
export async function ayarKaydet(a: Partial<MesajAyar>): Promise<Sonuc<MesajAyar>> {
  const r = await istek<any>('/c/ayar', a);
  if (!r.ok) return r;
  return { ok: true, veri: ayarCevir(r.veri?.ayar) };
}
export const hafizaSil = () => istek<unknown>('/c/hafiza/sil', {});
export const markaSohbetSil = () => istek<unknown>(`/c/mesaj/${MARKA_SOHBET}/sil`, {});

// --- kurucu (yalnız kurucu hesabında görünür; sunucu uyum.mjs /c/kurucu/islem) ---
export type KurucuIslem = 'gizle' | 'sustur' | 'engelle' | 'one_cikar' | 'one_kaldir';
export const kurucuIslem = (islem: KurucuIslem, tur: 'gonderi' | 'yorum' | 'uye', hedef: string) => istek<{ tamam?: boolean; sabit?: boolean }>('/c/kurucu/islem', { islem, tur, hedef });

// Süzgeçten dönen sebebin kısa açıklaması (gönderi, yorum, mesaj).
export function sebepYazisi(sebep?: string, mesajMi = false) {
  const s: Record<string, string> = {
    taciz_tehdit: 'Tehdit ya da taciz gibi duruyor. Gönderilmedi.',
    cinsel: 'Cinsel içerik gönderilemez.',
    cocuk: '18 yaş altıyla ilgili içerik olmaz.',
    kisisel_bilgi: 'Telefon, e-posta gibi kişisel bilgi paylaşılamaz.',
    spam: mesajMi ? 'İlk mesajda bağlantı olmaz.' : 'Bağlantı paylaşılamaz.',
    kufur: mesajMi ? 'İlk mesaj küfürlü olmaz.' : 'Küfürlü hâliyle paylaşılamaz.',
    siyaset: 'Burada siyaset yok.',
    kendine_zarar: 'Bu hâliyle paylaşılamıyor. Konuşmak istersen 112 her an açık.',
  };
  return (sebep && s[sebep]) || 'Bu hâliyle gönderilemiyor.';
}

export async function girisYap(govde: { idToken: string } | { apple: string } | { test: string }): Promise<Sonuc<Uye>> {
  const r = await istek<any>('/c/giris', govde);
  if (!r.ok) return r;
  const u = r.veri?.uye ?? {};
  const uye: Uye = { uid: String(u.uid ?? ''), ad: String(u.ad ?? ''), yeni: !!(u.yeni || !u.ad), yuz: u.yuz ?? undefined, ...(u.davetGerekli ? { davetGerekli: true } : {}), ...(u.sozGerekli ? { sozGerekli: true } : {}), ...(u.kurucu ? { kurucu: true } : {}), ...uyeKimlik(u) };
  oturumYaz(String(r.veri?.oturum ?? ''), uye);
  return { ok: true, veri: uye };
}
// --- E-POSTA İLE GİRİŞ (08.11; sunucu eposta_giris.mjs) ---
// Akış: epostaIste → e-postaya bağlantı gider (site/giris/ sayfasını açar, orada onaylanır) → bu cihaz epostaBekle ile 3 sn'de bir sorar, oturum gelince girilmiş olur.
// Bekleme anahtarı yalnız bu cihazda üretilir; sunucuda yalnız özeti durur.
const girisUyesi = (u: any): Uye => ({ uid: String(u?.uid ?? ''), ad: String(u?.ad ?? ''), yeni: !!(u?.yeni || u?.yeniHesap || !u?.ad), ...(!u?.ad && !u?.yeniHesap ? { adsizEski: true } : {}), yuz: u?.yuz ?? undefined, ...(u?.davetGerekli ? { davetGerekli: true } : {}), ...(u?.sozGerekli ? { sozGerekli: true } : {}), ...(u?.kurucu ? { kurucu: true } : {}), ...uyeKimlik(u) });
let epostaDurumSozu: Promise<{ acik: boolean; parola: boolean }> | null = null;
/** Sunucuda e-posta girişi açık mı, parolalı giriş (18.11) var mı? Ulaşılamıyorsa ikisi de false. Sonuç oturum boyunca saklanır. */
function epostaDurumHam() {
  if (!epostaDurumSozu) {
    epostaDurumSozu = istek<{ acik?: boolean; parola?: boolean }>('/c/eposta/durum').then((r) => {
      if (!r.ok) epostaDurumSozu = null; // ağ hatası: bir sonraki açılışta yeniden sorulur
      return { acik: r.ok && !!r.veri?.acik, parola: r.ok && !!r.veri?.parola };
    });
  }
  return epostaDurumSozu;
}
/** Sunucuda e-posta girişi açık mı? Kapalıysa (ya da sunucuya ulaşılamıyorsa) e-posta yolu hiç gösterilmez. */
export const epostaDurum = () => epostaDurumHam().then((d) => d.acik);
/** Parolalı giriş (e-posta + parola) sunucuda açık mı? Değilse eski bağlantılı e-posta yolu gösterilir. */
export const parolaDurum = () => epostaDurumHam().then((d) => d.parola);
// --- PAROLALI ÜYELİK (Onur 18.11): giriş/üye ol e-posta onayı OLMADAN; bağlantı yalnız "parolamı unuttum" / parolası olmayan eski üye için ---
// Hatalar: eposta_kayitli (409, üye ol) · kayit_yok (404, giriş yap) · parola_yok (409, eski üye: bir kez belirlemesi gerek) · parola_yanlis (401) · parola_kisa/parola_uzun (400) · sinir (429).
async function parolaOturumu(yol: string, govde: { eposta: string; parola: string }): Promise<Sonuc<Uye>> {
  const r = await istek<any>(yol, govde);
  if (!r.ok) return r;
  const uye = girisUyesi(r.veri?.uye);
  oturumYaz(String(r.veri?.oturum ?? ''), uye);
  return { ok: true, veri: uye };
}
export const epostaKayit = (eposta: string, parola: string) => parolaOturumu('/c/eposta/kayit', { eposta, parola });
export const epostaGirisParola = (eposta: string, parola: string) => parolaOturumu('/c/eposta/giris', { eposta, parola });
/** Parola belirleme/sıfırlama bağlantısı ister (hesap yoksa sunucu aynı genel yanıtı verir; hiçbir şey gitmez). */
export const parolaIste = (eposta: string) => istek<{ tamam: boolean; yogun?: boolean }>('/c/eposta/parola-iste', { eposta });
/** 24–64 karakterlik [A-Za-z0-9_-] gizli bekleme anahtarı. */
export function beklemeAnahtari(): string {
  const harf = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
  const n = 40;
  const b = new Uint8Array(n);
  const g: any = globalThis as any;
  if (g.crypto?.getRandomValues) g.crypto.getRandomValues(b);
  else for (let i = 0; i < n; i++) b[i] = Math.floor(Math.random() * 256) ^ (Date.now() >> (i % 8)) & 255;
  let s = '';
  for (let i = 0; i < n; i++) s += harf[b[i] & 63];
  return s;
}
// eslesme: 3 haneli eşleştirme kodu (bekleme gönderildiyse her yanıtta). Bağlantı başka telefonda/tarayıcıda açılırsa orada bu kod sorulur.
// yogun: sunucunun günlük e-posta tavanı doldu (14.11 GÜVENLİK): bağlantı GİTMEDİ; ekranda 'çok yoğunuz' denir, bekleme/geri sayım başlatılmaz.
export const YOGUN_YAZI = 'Şu an çok yoğunuz, biraz sonra tekrar dene.';
export const epostaIste = (eposta: string, bekleme: string) => istek<{ tamam: boolean; eslesme?: string; yogun?: boolean }>('/c/eposta/iste', { eposta, bekleme });
// Hesap silmeden önce yeniden doğrulama (GÜVENLİK U2): e-posta üyesi son 10 dk içinde bağlantıyla doğrulamadıysa silme 403 'yeniden_dogrula' döner.
// Önce hesapDogrulama(); gerekli && !tamam ise epostaSilDogrulamaIste() hesabın kendi adresine bağlantı yollar (adres gövdeden alınmaz), sonra tamam olana dek sorulur.
export async function hesapDogrulama(): Promise<Sonuc<{ gerekli: boolean; tamam: boolean }>> {
  const r = await istek<any>('/c/hesap/dogrulama');
  if (!r.ok) return r;
  return { ok: true, veri: { gerekli: !!r.veri?.gerekli, tamam: !!r.veri?.tamam } };
}
export const epostaSilDogrulamaIste = () => istek<{ tamam: boolean; yogun?: boolean }>('/c/eposta/iste', { amac: 'sil' });
/** Beklenen oturum geldiyse (bir kez verilir) saklanır ve üye döner; gelmediyse bekliyor (true: bağlantıya henüz dokunulmadı, false: istek süresi geçti). */
export async function epostaBekle(bekleme: string): Promise<Sonuc<{ uye: Uye } | { bekliyor: boolean }>> {
  const r = await istek<any>('/c/eposta/bekle', { bekleme });
  if (!r.ok) return r;
  if (typeof r.veri?.oturum === 'string' && r.veri.oturum) {
    const uye = girisUyesi(r.veri.uye);
    oturumYaz(r.veri.oturum, uye);
    return { ok: true, veri: { uye } };
  }
  return { ok: true, veri: { bekliyor: !!r.veri?.bekliyor } };
}
/** Bağlantıdaki kodu bu cihazda onaylamak için (uygulamada kullanılmaz: bağlantı site/giris/ sayfasında onaylanır; web'de aynı mantık). */
export async function epostaOnayla(eposta: string, oobCode: string, bekleme?: string): Promise<Sonuc<Uye>> {
  const r = await istek<any>('/c/eposta/onayla', { eposta, oobCode, ...(bekleme ? { bekleme } : {}) });
  if (!r.ok) return r;
  const uye = girisUyesi(r.veri?.uye);
  oturumYaz(String(r.veri?.oturum ?? ''), uye);
  return { ok: true, veri: uye };
}
// "Tüm cihazlardan çık": sunucu yeni jetonu bu cihaza verir, öbür cihazların jetonu 401 alır.
export async function oturumHepsiniKapat(): Promise<Sonuc<unknown>> {
  const r = await istek<any>('/c/oturum/hepsi', {});
  if (!r.ok) return r;
  if (typeof r.veri?.oturum === 'string' && r.veri.oturum) oturumYaz(r.veri.oturum, kayitliUye());
  return { ok: true, veri: { tamam: true } };
}
// Açılışta üyelik bilgisini tazeler (ör. kurucu işareti sonradan eklendiyse).
export async function benGetir(): Promise<Uye | null> {
  if (!oturum) return null;
  const r = await istek<any>('/c/ben');
  if (!r.ok || !r.veri?.uye) return null;
  const u = r.veri.uye;
  const uye: Uye = { uid: String(u.uid ?? ''), ad: String(u.ad ?? ''), yeni: !!(u.yeni || !u.ad), yuz: u.yuz ?? undefined, ...(u.davetGerekli ? { davetGerekli: true } : {}), ...(u.sozGerekli ? { sozGerekli: true } : {}), ...(u.kurucu ? { kurucu: true } : {}), ...uyeKimlik(u) };
  // Sunucu 7 günden eski jetonu yeniler: yeni jeton gelirse saklanır (çıkış yapılmadıkça oturum açık kalır).
  oturumYaz(typeof r.veri.oturum === 'string' && r.veri.oturum ? r.veri.oturum : oturum, uye);
  return uye;
}
// --- günün görevi (27.10, sunucu: gorev.mjs). Girişsizde çağrılmaz; kart girişli üyede sunucudan okur. ---
export type GorevSunucu = { gun: string; gorev: string; sayac: Record<string, number>; tamam: string[]; seri: number; gunler: { gun: string; tamam: boolean }[]; gecersiz?: boolean };
export const gorevGetir = () => istek<GorevSunucu>('/c/gorev');
export const gorevIlerlet = (gorev: string, adet = 1) => istek<GorevSunucu>('/c/gorev/ilerle', { gorev, adet });

// --- KAHİN ücretli tarot (29.10, sunucu: kahin.mjs). Okuma: /c/kahin/okuma; satın alma doğrulama: /c/kahin/satin; ses: /c/kahin/ses/<id>.wav (geçici). ---
export type KahinAcilim = { id: 'tek' | 'uc' | 'iliski' | 'kelt'; ad: string; kart: number; sure: string };
export type KahinUrun = { id: string; hak: number };
export type KahinDurum = { acik: boolean; giris: boolean; hak?: number; ucretsiz_var?: boolean; acilimlar: KahinAcilim[]; urunler: KahinUrun[] };
export type KahinKart = { id: string; ad: string; ters: boolean; sira: number; pozisyon: string; anlam: string; anahtar: string[] };
export type KahinParca = { tur: 'giris' | 'kart' | 'kapanis'; kart: number | null; metin: string; duygu: 'sicak' | 'soguk' | 'sasirma' | 'nese' | 'kahkaha' | 'ofke'; ses: string | null; sure: number | null };
export type KahinOkuma = { acilim: string; acilim_ad: string; soru: string; kartlar: KahinKart[]; okuma_sirasi: number[]; ozet: string; parcalar: KahinParca[]; odeme: 'ucretsiz' | 'hak'; hak: number; ucretsiz_var: boolean; kriz?: undefined } | { kriz: true; metin: string };
export const kahinDurum = () => istek<KahinDurum>('/c/kahin/durum');
export const kahinOkuma = (acilim: string, soru: string, astro = false) => istek<KahinOkuma & { hak?: number }>('/c/kahin/okuma', { acilim, soru, ...(astro ? { astro: true } : {}) });
// Adım adım okuma (30.10, yeni tarot tasarımı; sunucu kahin.mjs oturum uçları)
export const kahinOturumBaslat = (acilim: string, soru: string, secim: number[], astro = false) => istek<any>('/c/kahin/oturum/baslat', { acilim, soru, secim, ...(astro ? { astro: true } : {}) });
export const kahinOturumDevam = (oturum: string, cevap?: string) => istek<any>('/c/kahin/oturum/devam', { oturum, ...(cevap ? { cevap } : {}) });
export const kahinSatinDogrula = (urun: string, token: string, onay?: { cayma_onay: true; cayma_onay_zaman: string }) => istek<{ tamam: boolean; hak: number; ucretsiz_var: boolean; zaten?: boolean }>('/c/kahin/satin', { urun, token, ...(onay ?? {}) }); // onay: cayma hakkı onayı (Şartlar 2.3 md 9.6); yoksa sunucu "onay_yok" yazar, reddetmez
export const kahinSesAdres = (yol: string) => (/^https?:/.test(yol) ? yol : `${C_SUNUCU}${yol}`);
// --- MAĞAZA (18.11, iOS satın alma; sunucu: magaza.mjs). Fiyat sunucudan GELMEZ (mağazadan okunur). ---
export const magazaUrunler = () => istek<any>('/c/magaza/urunler');
export const magazaHaklarim = () => istek<any>('/c/magaza/haklarim');
// Sayfa (WebView) hakkı: sunucuda bir hak düşer (satın alınmış → Plus; kurucu muaf). anahtar: aynı öğe yeniden açılınca ikinci hak düşmesin. 402'de satın alma penceresi AÇILMAZ (sayfa kendi düğmesini gösterir).
export const magazaHakKullan = (hak: 'tarot' | 'harita' | 'uyum', anahtar?: string) => istek<{ tamam: boolean; kaynak: string; haklar?: any }>('/c/magaza/hak-kullan', { tur: hak, ...(anahtar ? { anahtar } : {}) });
// Android (1.9.0): gövde mantik.ts googleGovdesi() ile kurulur; uç sunucuda YAMA_ANDROID_PLAY.md ile eklenir (bayrak kapalıyken hiç çağrılmaz).
export const magazaIslemGoogle = (govde: { islemler: { urun: string; token: string }[]; cayma_onay?: true; cayma_onay_zaman?: string }) => istek<{ tamam: boolean; sonuclar: any[]; haklar?: any }>('/c/magaza/google/islem', govde);
export const magazaIslem = (jwsler: string[], onay?: { cayma_onay: true; cayma_onay_zaman: string }) => istek<{ tamam: boolean; sonuclar: any[]; haklar?: any }>('/c/magaza/apple/islem', { islemler: jwsler, ...(onay ?? {}) }); // onay yalnız tek işlemlik satın alma isteğinde; geri yükleme/bekleyen işlemlerde yok
// Yalnız deneme sunucusunda (TEST_GIRIS): emülatör denemesinde hak vermek için.
export const kahinTestHak = (hak: number) => istek<{ hak: number; ucretsiz_var: boolean }>('/c/kahin/test/hak', { hak });

// --- ASTROLOJİ (29.10, sunucu: astro.mjs): profil (açık rızayla), doğum haritası, yorum (Gemini + Kore sesi), burçlar, uyum. Satın alma KAHİN ucundan (astro_harita, astro_uyum). ---
export type AstroBurc = { no: number; ad: string; element: string; nitelik: string; yonetici: string; tarih: string };
export type AstroDurum = { acik: boolean; giris: boolean; profil?: boolean; harita_hak?: number; harita_ucretsiz_var?: boolean; uyum_hak?: number; burclar: AstroBurc[]; iller: string[]; urunler: string[]; riza: { surum: string; metin: string }; gunluk_tarih: string };
export type AstroDogum = { yil: number; ay: number; gun: number; saat: number | null; dk: number };
export type AstroGezegen = { anahtar: string; ad: string; boylam: number; burc: string; burcNo: number; derece: number; dakika: number; geri: boolean; ev: number | null };
export type AstroNokta = { boylam: number; burc: string; burcNo: number; derece: number; dakika: number; metin: string };
export type AstroAci = { a: string; b: string; tur: string; aci: number; sapma: number };
export type AstroHarita = { il: string; dogum: AstroDogum; harita: { saatBilinmiyor: boolean; sistem: string | null; asc: AstroNokta | null; mc: AstroNokta | null; evler: (AstroNokta & { ev: number })[] | null; gezegenler: AstroGezegen[]; acilar: AstroAci[]; notlar: string[] }; ozet: { gunes: string; ay: string; yukselen: string | null } };
export type AstroParca = { tur: 'giris' | 'bolum' | 'kapanis'; baslik: string | null; metin: string; duygu: 'sicak' | 'soguk' | 'sasirma' | 'nese' | 'kahkaha' | 'ofke'; ses: string | null; sure: number | null };
export type AstroYorum = { tur: 'harita' | 'uyum'; ozet: string; parcalar: AstroParca[]; odeme: 'ucretsiz' | 'hak'; harita_hak: number; harita_ucretsiz_var: boolean; uyum_hak: number; partner?: string };
export type AstroBurcYorum = { burc: AstroBurc; tur: 'gunluk' | 'haftalik'; tarih: string; metin: string; tema: string; anahtar: string[] };
export const astroDurum = () => istek<AstroDurum>('/c/astro/durum');
export const astroProfilGetir = () => istek<{ profil: { dogum: AstroDogum; il: string; riza_zaman: number } | null }>('/c/astro/profil');
export const astroProfilKaydet = (dogum: AstroDogum, il: string, riza: boolean) => istek<{ tamam: boolean }>('/c/astro/profil', { dogum, il, riza });
export const astroProfilSil = () => istek<{ tamam: boolean }>('/c/astro/profil/sil', {});
export const astroHaritaGetir = () => istek<AstroHarita>('/c/astro/harita');
export const astroYorumGetir = (tur: 'harita' | 'uyum', partner?: { ad: string; dogum: AstroDogum; il: string }) => istek<AstroYorum>('/c/astro/yorum', { tur, ...(partner ? { partner } : {}) });
export const astroBurcGetir = (no: number, tur: 'gunluk' | 'haftalik') => istek<AstroBurcYorum>(`/c/astro/burc/${no}?tur=${tur}`);
export const astroTestHak = (v: { harita?: number; uyum?: number; harita_ucretsiz_kullandi?: boolean }) => istek<any>('/c/astro/test/hak', v);

// dogumTarihi ("YYYY-AA-GG", HUKUK şartnamesi): verilirse yaş sunucuda tam tarihle hesaplanır (18 altı: 'yas', tarih saklanmaz) ve dogumYili gönderilmez.
export async function adKaydet(ad: string, dogumYili: number, ek: { davet?: string; onay?: boolean; soz?: boolean; rizalar?: Rizalar; dogumTarihi?: string } = {}): Promise<Sonuc<Uye>> {
  const { dogumTarihi, ...diger } = ek;
  const r = await istek<any>('/c/ad', { ad, ...(dogumTarihi ? { dogumTarihi } : { dogumYili }), kurallar: true, ...diger });
  if (!r.ok) return r;
  const eski = kayitliUye();
  const u = r.veri?.uye ?? {};
  const uye: Uye = { uid: String(u.uid ?? eski?.uid ?? ''), ad: String(u.ad ?? ad), yeni: false, yuz: u.yuz ?? undefined, ...(u.sozGerekli ? { sozGerekli: true } : {}), ...(u.kurucu || eski?.kurucu ? { kurucu: true } : {}), ...uyeKimlik(u) };
  if (r.veri?.oturum) oturum = String(r.veri.oturum);
  oturumYaz(oturum, uye);
  return { ok: true, veri: uye };
}
// Sözleşme sürümü onayı (22.10): zorunlu kutu + isteğe bağlı rızalar (hafiza → 'beni hatırlasın', durtme → 'bana not bırakabilir'); onay sunucuda kaydedilir.
export type Rizalar = { hafiza: boolean; durtme: boolean };
export async function sozOnayla(rizalar: Rizalar): Promise<Sonuc<Uye>> {
  const r = await istek<any>('/c/soz', { zorunlu: true, rizalar });
  if (!r.ok) return r;
  const eski = kayitliUye();
  const u = r.veri?.uye ?? {};
  const uye: Uye = { uid: String(u.uid ?? eski?.uid ?? ''), ad: String(u.ad ?? eski?.ad ?? ''), yeni: false, yuz: u.yuz ?? undefined, ...(u.sozGerekli ? { sozGerekli: true } : {}), ...(u.kurucu || eski?.kurucu ? { kurucu: true } : {}), ...uyeKimlik(u) };
  if (r.veri?.oturum) oturum = String(r.veri.oturum);
  oturumYaz(oturum, uye);
  return { ok: true, veri: uye };
}
const uyeKimlik = (u: any) => ({ ...(u?.kurucuDost === true && !u?.kurucu ? { kurucuDost: true } : {}), ...(balonCevir(u?.balon) ? { balon: balonCevir(u.balon)! } : {}), ...(typeof u?.duvar === 'string' ? { duvar: u.duvar } : {}), ...(u?.oncu ? { oncu: true } : {}), ...(vitrinCevir(u?.vitrin) ? { vitrin: vitrinCevir(u.vitrin)! } : {}) });

// Balon kimliği ve duvar seçimi (08.10). Gönderilmeyen alan değişmez; dönen üye kayıtlı oturuma yazılır.
export async function balonKaydet(d: { balonSekil?: string; balonRenk?: string; balonYuz?: string; duvar?: string }): Promise<Sonuc<Uye>> {
  if (ORNEK) {
    const e = kayitliUye();
    const b = { s: d.balonSekil ?? e?.balon?.s ?? 'klasik', r: d.balonRenk ?? e?.balon?.r ?? 'mercan', y: d.balonYuz ?? e?.balon?.y ?? 'utangac' };
    const uye = { ...(e ?? { uid: 'ornek', ad: 'ornek', yeni: false }), balon: b, duvar: d.duvar ?? e?.duvar ?? 'gece' } as Uye;
    return { ok: true, veri: uye };
  }
  const r = await istek<any>('/c/balon', d);
  if (!r.ok) return r;
  const eski = kayitliUye();
  const u = r.veri?.uye ?? {};
  const uye: Uye = { ...(eski ?? { uid: String(u.uid ?? ''), ad: String(u.ad ?? ''), yeni: false }), ...uyeKimlik(u) };
  oturumYaz(oturum, uye);
  return { ok: true, veri: uye };
}

// Profil sekmeleri: Cevapları (yorum + gönderisi) ve Beğendikleri.
export type ProfilCevap = { yorum: Yorum; gonderi: Gonderi };
export async function profilSekme(ad: string, sekme: 'cevap' | 'begeni', imlec?: string | null): Promise<Sonuc<{ cevaplar: ProfilCevap[]; gonderiler: Gonderi[]; imlec: string | null }>> {
  const r = await istek<any>(`/c/profil/${encodeURIComponent(ad)}?sekme=${sekme}${imlec ? `&once=${encodeURIComponent(imlec)}` : ''}`);
  if (!r.ok) return r;
  const d = r.veri ?? {};
  return { ok: true, veri: { cevaplar: (d.cevaplar ?? []).filter((x: any) => x?.yorum && x?.gonderi).map((x: any) => ({ yorum: yorumCevir(x.yorum), gonderi: gonderiCevir(x.gonderi) })), gonderiler: (d.gonderiler ?? []).map(gonderiCevir), imlec: d.imlec ?? null } };
}

// --- rozetler (plan/29_ROZETLER; sunucu rozet.mjs) ---
const kayitCevir = (x: any): RozetKayit => ({ r: String(x.r), s: sayi(x.s, 1), t: String(x.t ?? ''), ...(typeof x.n === 'number' ? { n: x.n } : {}) });
const rafCevir = (x: any): RafOge => ({ r: String(x.r), s: sayi(x.s), ...(Array.isArray(x.esik) ? { esik: x.esik.map((e: unknown) => sayi(e)) } : {}), ...(typeof x.deger === 'number' ? { deger: x.deger } : {}), ...(typeof x.hedef === 'number' ? { hedef: x.hedef } : {}), ...(typeof x.son === 'string' ? { son: x.son } : {}), ...(x.gizli ? { gizli: true } : {}), ...(typeof x.t === 'string' ? { t: x.t } : {}), ...(x.yeni ? { yeni: true } : {}), ...(typeof x.n === 'number' ? { n: x.n } : {}) });
export type RozetDurum = { raf: RafOge[]; vitrin: string | null; yeni: RozetKayit[]; oncuNo: number | null };
export async function rozetGetir(): Promise<Sonuc<RozetDurum>> {
  const r = await istek<any>('/c/rozet');
  if (!r.ok) return r;
  const d = r.veri ?? {};
  return { ok: true, veri: { raf: (d.rozetler ?? []).map(rafCevir), vitrin: typeof d.vitrin === 'string' && d.vitrin ? d.vitrin : null, yeni: (d.yeni ?? []).map(kayitCevir), oncuNo: typeof d.oncuNo === 'number' ? d.oncuNo : null } };
}
export const rozetGoruldu = (r?: string[]) => istek<{ yeni?: number }>('/c/rozet/goruldu', { ...(r ? { r } : {}) });
// Adın yanında gösterilecek tek rozet (boş: hiç). Dönen üye kayıtlı oturuma yazılır.
export async function vitrinSec(r: string | null): Promise<Sonuc<{ vitrin: string | null }>> {
  const x = await istek<any>('/c/vitrin', { r: r ?? '' });
  if (!x.ok) return x;
  await benGetir(); // oturumdaki üye (vitrin) tazelenir
  return { ok: true, veri: { vitrin: x.veri?.vitrin || null } };
}
// Okunan balon SAYISI (hangi balon olduğu sunucuya gitmez).
export const okunduYolla = (n: number) => istek<{ okuSay?: number; yeni?: number }>('/c/okundu', { n });


// --- Tribün (plan/27, plan/33; sunucu tribun.mjs): maç odası ---
export type TribunTakim = { ad: string; kisa: string; renk: string; renk2: string };
export type TribunTaraf = 'ev' | 'dep';
export type TribunMac = {
  id: string; lig: string; ligKisa: string; avrupa: boolean; ev: TribunTakim; dep: TribunTakim; baslangic: number; kanal: string; buyuk: boolean; derbi: boolean; destek: '' | TribunTaraf;
  durum: 'oncesi' | 'canli' | 'devre' | 'bitti'; skor: { ev: number; dep: number }; dk: string; odaAcik: boolean; tekrar: boolean; hiz: number; bitis: number | null; odada: number;
  ben: { taraf: '' | 'ev' | 'dep' | 'tarafsiz'; hatirlat: boolean; tahmin: { ev: number; dep: number } | null; puan: number | null };
  kapanis?: number | null; odaAcilis?: number; destekTakimi?: string; akisSay?: number; yari?: 1 | 2;
  oynaniyor?: boolean; // sunucu: takvime göre şu an oynanıyor mu (Bildir yalnız bu durumda görünür)
};
export type TribunOlay = { t: 'olay'; id: string; tur: 'basladi' | 'gol' | 'sari' | 'kirmizi' | 'penalti' | 'var' | 'gol_iptal' | 'devre' | 'ikinci_yari' | 'bitti'; takim: TribunTaraf | null; oyuncu: string; dk: string; zaman: number; teyit: boolean; iptal: boolean; skor: { ev: number; dep: number }; kaynak: string; onBilgi?: boolean };
export type TribunMesaj = { t: 'mesaj'; id: string; yazar: Yazar; metin: string; zaman: number; marka: boolean; olayId: string | null; durum?: string; sebep?: string | null; etiketler?: string[] };
// Tepki satırı (sunucu: tp=1 isteyene): ben=true kendi satırın ("ali ⚽ Gooool! ×3"), ben=false başkalarının toplu satırı ("sarikirmizi01 ve 23 kişi ⚽ Gooool! ×24").
export type TribunTepkiTur = 'gol' | 'dayan' | 'helal' | 'kalbim';
export type TribunTepkiSatiri = { t: 'tepki'; id: string; tur: TribunTepkiTur; ad: string; kisi: number; n: number; ben: boolean; zaman: number };
export type TribunKarar = { id: string; tur: 'karar' | 'mac_adami'; olayId: string; dk: string; baslik: string; soru: string; secenekler: string[]; acik: boolean; kapanis: number; toplam: number; oylar: number[] | null; esik: number; benimOy: number | null; zaman: number };
// Muhabir (yalnız ACİL YEDEK): elle giriş yayınlanmaz; durum 'bekliyor' → kaynakla eşleşirse 'teyitli', süre dolarsa 'teyitsiz'
export type TribunGiris = { id: string; tur: string; takim: TribunTaraf | null; dk: string; zaman: number; durum: 'bekliyor' | 'teyitli' | 'teyitsiz' | 'geri_alindi' };
export type TribunKadroTakim = { formasyon: string; ilk11: { no: string; ad: string }[]; yedek: { no: string; ad: string }[]; teknik: string };
export type TribunKadro = { zaman: number; yorum: string; ev: TribunKadroTakim; dep: TribunKadroTakim }; // maç öncesi açıklanan ilk 11 + yedekler (sunucu: ESPN özeti; logo yok)
export type TribunKisi = { yazar: Yazar; tahmin?: { ev: number; dep: number }; puan: number };
export type TribunOda = {
  simdi: number; mac: TribunMac; akis: (TribunOlay | TribunMesaj | TribunTepkiSatiri)[]; kararlar: TribunKarar[];
  tahmin: { ben: { ev: number; dep: number } | null; puan: number | null; acik: boolean; toplam: number; dagilim: { ev: number; ber: number; dep: number } | null; tablo: TribunKisi[]; lig: TribunKisi[] };
  taraf: { ben: string; sayilar: Record<string, number> }; hatirlat: boolean; tepki: Record<string, number>; nabiz?: Record<string, number>;
  ozet: { cumleler: string[]; mesaj: number; oy: number; kararlar: TribunKarar[]; skorTeyit: string | null } | null;
  benMuhabir: boolean; acilYedek?: boolean; girisler?: TribunGiris[];
  kadro?: TribunKadro | null;
};
export type TribunDurum = { simdi: number; canli: TribunMac[]; etiket: { mac: string; kisa: string; karar: string; dk: string; baslik: string; soru: string; kapanis: number; ad: string } | null; yaklasan: TribunMac | null };
const tribunMacCevir = (m: any): TribunMac => ({ ...m, baslangic: sayi(m.baslangic), skor: { ev: sayi(m.skor?.ev), dep: sayi(m.skor?.dep) }, ben: { taraf: m.ben?.taraf ?? '', hatirlat: !!m.ben?.hatirlat, tahmin: m.ben?.tahmin ?? null, puan: m.ben?.puan ?? null } });
export async function tribunTakvim(): Promise<Sonuc<{ maclar: TribunMac[]; benMuhabir: boolean; simdi: number }>> {
  const r = await istek<any>('/c/tribun/takvim');
  if (!r.ok) return r;
  return { ok: true, veri: { maclar: (r.veri?.maclar ?? []).map(tribunMacCevir), benMuhabir: !!r.veri?.benMuhabir, simdi: sayi(r.veri?.simdi, Date.now()) } };
}
export async function tribunDurum(): Promise<TribunDurum | null | 'kapali'> {
  const r = await istek<any>('/c/tribun/durum');
  if (!r.ok) return r.durum === 404 ? 'kapali' : null; // 404: Tribün sunucuda kapalı (canlıda onay öncesi)
  return { simdi: sayi(r.veri?.simdi, Date.now()), canli: (r.veri?.canli ?? []).map(tribunMacCevir), etiket: r.veri?.etiket ?? null, yaklasan: r.veri?.yaklasan ? tribunMacCevir(r.veri.yaklasan) : null };
}
export async function tribunOda(id: string): Promise<Sonuc<TribunOda>> {
  const r = await istek<any>(`/c/tribun/mac?id=${encodeURIComponent(id)}&tp=1`); // tp=1: tepki satırlarını bilen istemci
  if (!r.ok) return r;
  const d = r.veri ?? {};
  const akis = (d.akis ?? []).map((x: any) => (x.t === 'mesaj' ? ({ ...x, yazar: yazarCevir({ yazar: x.yazar }) } as TribunMesaj) : (x as TribunOlay | TribunTepkiSatiri)));
  const kisi = (x: any): TribunKisi => ({ yazar: yazarCevir({ yazar: x.yazar }), tahmin: x.tahmin, puan: sayi(x.puan) });
  return { ok: true, veri: { ...d, mac: tribunMacCevir(d.mac), akis, kararlar: d.kararlar ?? [], tahmin: { ...d.tahmin, tablo: (d.tahmin?.tablo ?? []).map(kisi), lig: (d.tahmin?.lig ?? []).map(kisi) } } };
}
// Tribün odasında @ önerisi: akıştaki liste + bu odadaki üyeler (sunucu kuralı).
export async function tribunEtiketAdaylari(mac: string, q: string): Promise<Yazar[]> {
  const r = await istek<any>(`/c/tribun/etiket?mac=${encodeURIComponent(mac)}&q=${encodeURIComponent(q)}`);
  return r.ok && Array.isArray(r.veri?.liste) ? r.veri.liste.map(yazarCevir) : [];
}
export const tribunMesajYolla = (mac: string, metin: string) => istek<{ mesaj: any }>('/c/tribun/mesaj', { mac, metin });
export const tribunTarafSec = (mac: string, taraf: string) => istek<unknown>('/c/tribun/taraf', { mac, taraf });
export const tribunTahmin = (mac: string, ev: number, dep: number) => istek<unknown>('/c/tribun/tahmin', { mac, ev, dep });
export const tribunHatirlat = (mac: string, acik: boolean) => istek<unknown>('/c/tribun/hatirlat', { mac, acik });
export const tribunOyVer = (mac: string, karar: string, secenek: number) => istek<{ karar: TribunKarar }>('/c/tribun/oy', { mac, karar, secenek });
export const tribunTepki = (mac: string, tur: string) => istek<{ tepki: Record<string, number>; nabiz: Record<string, number>; satir: TribunTepkiSatiri | null }>('/c/tribun/tepki', { mac, tur });
// Bildir = yalnız kaynak yoklamasını hızlandıran sinyal (olay oluşturmaz).
export const tribunBildir = (mac: string) => istek<{ yoklandi: boolean }>('/c/tribun/bildir', { mac });
export const tribunMuhabirOlay = (mac: string, tur: string, takim?: TribunTaraf | null) => istek<{ olay: { id: string; durum: string }; yayinlandi: boolean }>('/c/tribun/muhabir/olay', { mac, tur, ...(takim ? { takim } : {}) });
export const tribunMuhabirGeriAl = (mac: string, giris: string) => istek<unknown>('/c/tribun/muhabir/duzelt', { mac, olay: giris, islem: 'sil' });
// Deneme araçları (yalnız deneme sunucusunda): yeniden oynatma başlat / sil.
export const tribunTekrarBaslat = (govde: { hiz?: number; akis?: boolean; once_sn?: number; yari_sn?: number } = {}) => istek<{ id: string; baslangic: number; sure_sn: number }>('/c/tribun/test/tekrar', govde);
export const tribunTekrarSil = (mac: string) => istek<{ silindi: boolean }>('/c/tribun/test/sil', { mac });

// --- Tribün spor portalı (sunucu tribun_portal.mjs): GET /c/tribun/portal?spor=futbol|basket, girişsiz; tek çağrıda bütün sekmeler ---
export type PortalSpor = 'futbol' | 'basket';
export type PortalTakim = { ad: string; kisa: string; logo: string | null };
export type PortalMac = { id: string; lig: string; ev: PortalTakim; dep: PortalTakim; skor: string | null; durum: 'canli' | 'bitti' | 'once'; dk: string | null; saat: string; odaId: string | null };
export type PortalManset = { gonderiId: string | null; metin: string; haber: { url: string; baslik: string; kaynak: string; gorsel: string | null } | null };
export type PortalHaber = { saat: string; baslik: string; kaynak: string; url: string; etiket: string };
export type PortalGun = { tarih: string; etiket: string; ligler: { kod: string; ad: string; maclar: PortalMac[] }[] };
export type PortalPuan = { sira: number; takim: PortalTakim; o: number; g: number; b: number; m: number; av: number; p: number; form: string | null };
export type PortalLig = { kod: string; ad: string; puan: PortalPuan[]; kral: { ad: string; takim: string; deger: number }[] };
export type PortalTransfer = { baslik: string; kaynak: string; url: string; saat: string; durum: 'resmi' | 'gorusme' | 'iddia' };
export type PortalVideo = { baslik: string; kanal: string; youtubeId: string; tarih: string };
export type TribunPortalVeri = { simdi: number; spor: PortalSpor; canli: PortalMac[]; manset: PortalManset[]; sondk: PortalHaber[]; gunler: PortalGun[]; lig: PortalLig[]; transfer: PortalTransfer[]; video: PortalVideo[] };
const portalTakim = (t: any): PortalTakim => ({ ad: String(t?.ad ?? ''), kisa: String(t?.kisa ?? '').slice(0, 4), logo: typeof t?.logo === 'string' && /^https:\/\//.test(t.logo) ? t.logo : null });
const portalMac = (m: any): PortalMac => ({ id: String(m?.id ?? ''), lig: String(m?.lig ?? ''), ev: portalTakim(m?.ev), dep: portalTakim(m?.dep), skor: typeof m?.skor === 'string' && m.skor ? m.skor : null, durum: m?.durum === 'canli' || m?.durum === 'bitti' ? m.durum : 'once', dk: typeof m?.dk === 'string' && m.dk ? m.dk : null, saat: String(m?.saat ?? ''), odaId: typeof m?.odaId === 'string' && m.odaId ? m.odaId : null });
const dizi = (x: any): any[] => (Array.isArray(x) ? x : []);
export async function tribunPortal(spor: PortalSpor): Promise<Sonuc<TribunPortalVeri>> {
  const r = await istek<any>(`/c/tribun/portal?spor=${spor}`);
  if (!r.ok) return r;
  const d = r.veri ?? {};
  return {
    ok: true,
    veri: {
      simdi: sayi(d.simdi, Date.now()),
      spor: d.spor === 'basket' ? 'basket' : 'futbol',
      canli: dizi(d.canli).map(portalMac),
      // Manşet: akış gönderisi (gonderiId) ya da son dakika haberi (gonderiId yok, adres açılır). Görsel yalnız https.
      manset: dizi(d.gundem?.manset).filter((x: any) => x?.haber?.baslik).map((x: any) => ({ gonderiId: x.gonderiId ? String(x.gonderiId) : null, metin: String(x.metin ?? ''), haber: { url: String(x.haber.url ?? ''), baslik: String(x.haber.baslik), kaynak: String(x.haber.kaynak ?? ''), gorsel: typeof x.haber.gorsel === 'string' && /^https:\/\//.test(x.haber.gorsel) ? x.haber.gorsel : null } })),
      sondk: dizi(d.gundem?.sondk).map((x: any) => ({ saat: String(x?.saat ?? ''), baslik: String(x?.baslik ?? ''), kaynak: String(x?.kaynak ?? ''), url: String(x?.url ?? ''), etiket: String(x?.etiket ?? 'SPOR') })),
      gunler: dizi(d.maclar?.gunler).map((g: any) => ({ tarih: String(g?.tarih ?? ''), etiket: String(g?.etiket ?? ''), ligler: dizi(g?.ligler).map((l: any) => ({ kod: String(l?.kod ?? ''), ad: String(l?.ad ?? ''), maclar: dizi(l?.maclar).map(portalMac) })) })),
      lig: dizi(d.lig).map((l: any) => ({
        kod: String(l?.kod ?? ''),
        ad: String(l?.ad ?? ''),
        puan: dizi(l?.puan).map((p: any) => ({ sira: sayi(p?.sira), takim: portalTakim(p?.takim), o: sayi(p?.o), g: sayi(p?.g), b: sayi(p?.b), m: sayi(p?.m), av: sayi(p?.av), p: sayi(p?.p), form: typeof p?.form === 'string' && p.form ? p.form : null })),
        kral: dizi(l?.kral).map((k: any) => ({ ad: String(k?.ad ?? ''), takim: String(k?.takim ?? ''), deger: sayi(k?.deger) })),
      })),
      transfer: dizi(d.transfer).map((t: any) => ({ baslik: String(t?.baslik ?? ''), kaynak: String(t?.kaynak ?? ''), url: String(t?.url ?? ''), saat: String(t?.saat ?? ''), durum: t?.durum === 'resmi' || t?.durum === 'gorusme' ? t.durum : 'iddia' })),
      video: dizi(d.video).map((v: any) => ({ baslik: String(v?.baslik ?? ''), kanal: String(v?.kanal ?? ''), youtubeId: String(v?.youtubeId ?? ''), tarih: String(v?.tarih ?? '') })),
    },
  };
}

// --- Tribün maç ekranı (sunucu tribun_mac.mjs): GET /c/tribun/mac?lig=<espn lig kodu>&id=<espn maç id>, girişsiz; ESPN özeti (bahis oranı yok) ---
export type MacAnTur = 'gol' | 'kart_sari' | 'kart_kirmizi' | 'degisiklik' | 'penalti' | 'diger';
export type MacAn = { dk: string; tur: MacAnTur; taraf: 'ev' | 'dep'; metin: string };
export type MacIst = { ad: string; ev: string; dep: string; evOran: number; depOran: number };
export type MacOyuncu = { no: string; ad: string; kisa: string; poz: string; yer: number | null };
export type MacKadroYan = { dizilis: string | null; ilk: MacOyuncu[]; yedek: MacOyuncu[] };
export type MacBilgi = { id: string; lig: string; ligAd: string; ev: PortalTakim; dep: PortalTakim; skor: string | null; durum: 'canli' | 'bitti' | 'once'; dk: string | null; saat: string | null; tarih: string | null; stat: string | null; hakem: string | null; odaId: string | null };
export type TribunMacDetayVeri = { simdi: number; mac: MacBilgi; anlar: MacAn[]; ist: MacIst[]; kadro: { ev: MacKadroYan; dep: MacKadroYan } | null; form: { ev: string[]; dep: string[] } | null; anlatim: { dk: string; metin: string }[] };
const ANLAR_TUR: MacAnTur[] = ['gol', 'kart_sari', 'kart_kirmizi', 'degisiklik', 'penalti', 'diger'];
const macMetin = (x: any): string | null => (typeof x === 'string' && x ? x : null);
const macOran = (x: any) => Math.max(0, Math.min(1, Number(x) || 0));
const macKadroYan = (y: any): MacKadroYan => ({
  dizilis: macMetin(y?.dizilis),
  ilk: dizi(y?.ilk).map((o: any) => ({ no: String(o?.no ?? ''), ad: String(o?.ad ?? ''), kisa: String(o?.kisa ?? o?.ad ?? ''), poz: String(o?.poz ?? ''), yer: Number(o?.yer) > 0 ? Number(o.yer) : null })),
  yedek: dizi(y?.yedek).map((o: any) => ({ no: String(o?.no ?? ''), ad: String(o?.ad ?? ''), kisa: String(o?.kisa ?? o?.ad ?? ''), poz: String(o?.poz ?? ''), yer: null })),
});
export async function tribunMacDetay(lig: string, id: string): Promise<Sonuc<TribunMacDetayVeri>> {
  const r = await istek<any>(`/c/tribun/mac?lig=${encodeURIComponent(lig)}&id=${encodeURIComponent(id)}`);
  if (!r.ok) return r;
  const d = r.veri ?? {};
  const m = d.mac ?? {};
  return {
    ok: true,
    veri: {
      simdi: sayi(d.simdi, Date.now()),
      mac: { id: String(m.id ?? id), lig: String(m.lig ?? lig), ligAd: String(m.ligAd ?? ''), ev: portalTakim(m.ev), dep: portalTakim(m.dep), skor: macMetin(m.skor), durum: m.durum === 'canli' || m.durum === 'bitti' ? m.durum : 'once', dk: macMetin(m.dk), saat: macMetin(m.saat), tarih: macMetin(m.tarih), stat: macMetin(m.stat), hakem: macMetin(m.hakem), odaId: macMetin(m.odaId) },
      anlar: dizi(d.anlar).filter((a: any) => ANLAR_TUR.includes(a?.tur)).map((a: any) => ({ dk: String(a.dk ?? ''), tur: a.tur, taraf: a.taraf === 'dep' ? 'dep' : 'ev', metin: String(a.metin ?? '') })),
      ist: dizi(d.ist).map((x: any) => ({ ad: String(x?.ad ?? ''), ev: String(x?.ev ?? ''), dep: String(x?.dep ?? ''), evOran: macOran(x?.evOran), depOran: macOran(x?.depOran) })),
      kadro: d.kadro?.ev && d.kadro?.dep ? { ev: macKadroYan(d.kadro.ev), dep: macKadroYan(d.kadro.dep) } : null,
      form: d.form ? { ev: dizi(d.form.ev).map(String), dep: dizi(d.form.dep).map(String) } : null,
      anlatim: dizi(d.anlatim).map((a: any) => ({ dk: String(a?.dk ?? ''), metin: String(a?.metin ?? '') })),
    },
  };
}

// --- Tribün YORUMCULAR (sunucu tribun_yorumcu.mjs): GET /c/tribun/kose ve /c/tribun/kose/yazi?id=, girişsiz; yapay zekâ yorumcuların köşe yazıları ---
export type KoseKunye = { kod: string; ad: string; rol: string; renk: string };
export type KoseYazar = KoseKunye & { sonYazi: { id: string; baslik: string; ozet: string; zaman: number } | null };
export type KoseKisa = { id: string; yazar: string; baslik: string; ozet: string; zaman: number; etiketler: string[]; kurgu: boolean };
export type TribunKoseVeri = { yazarlar: KoseYazar[]; yazilar: KoseKisa[] };
export type KoseYazi = KoseKisa & { metin: string; ilgiliMac: { lig: string; id: string } | null; yazarBilgi: KoseKunye; digerleri: KoseKisa[] };
const koseRenk = (x: any) => (typeof x === 'string' && /^#[0-9A-Fa-f]{6}$/.test(x) ? x : '#C6F432');
const koseKunye = (x: any): KoseKunye => ({ kod: String(x?.kod ?? ''), ad: String(x?.ad ?? ''), rol: String(x?.rol ?? ''), renk: koseRenk(x?.renk) });
const koseKisa = (x: any): KoseKisa => ({ id: String(x?.id ?? ''), yazar: String(x?.yazar ?? ''), baslik: String(x?.baslik ?? ''), ozet: String(x?.ozet ?? ''), zaman: sayi(x?.zaman), etiketler: dizi(x?.etiketler).map(String).slice(0, 3), kurgu: !!x?.kurgu });
export async function tribunKose(): Promise<Sonuc<TribunKoseVeri>> {
  const r = await istek<any>('/c/tribun/kose');
  if (!r.ok) return r;
  const d = r.veri ?? {};
  return {
    ok: true,
    veri: {
      yazarlar: dizi(d.yazarlar).filter((y: any) => y?.kod).map((y: any) => ({ ...koseKunye(y), sonYazi: y.sonYazi?.id ? { id: String(y.sonYazi.id), baslik: String(y.sonYazi.baslik ?? ''), ozet: String(y.sonYazi.ozet ?? ''), zaman: sayi(y.sonYazi.zaman) } : null })),
      yazilar: dizi(d.yazilar).filter((y: any) => y?.id).map(koseKisa),
    },
  };
}
export async function tribunKoseYazi(id: string): Promise<Sonuc<KoseYazi>> {
  const r = await istek<any>(`/c/tribun/kose/yazi?id=${encodeURIComponent(id)}`);
  if (!r.ok) return r;
  const d = r.veri ?? {};
  const m = d.ilgiliMac;
  return {
    ok: true,
    veri: {
      ...koseKisa(d),
      metin: String(d.metin ?? ''),
      ilgiliMac: m?.lig && m?.id ? { lig: String(m.lig), id: String(m.id) } : null,
      yazarBilgi: koseKunye(d.yazarBilgi),
      digerleri: dizi(d.digerleri).filter((y: any) => y?.id).map(koseKisa),
    },
  };
}

// Sunucu hata kodlarının kısa Türkçe karşılığı.
export function hataYazisi(h: string, durum?: number) {
  const s: Record<string, string> = {
    baglanti: 'Bağlantı yok. Tekrar dene.',
    mac_oynanmiyor: 'Maç şu an oynanmıyor.',
    acil_yedek_kapali: 'Acil yedek şu an kapalı: veri kaynakları çalışıyor ya da sessizlik henüz 3 dakikayı doldurmadı.',
    ad_alinmis: 'Bu ad alınmış. Sana aitse (ör. Google ile üye olduysan) o hesapla giriş yap.',
    ad_gecersiz: '3–20 harf, rakam ya da _',
    ad_bicim: '3–20 harf, rakam ya da _',
    ad_sakli: 'Bu ad kullanılamaz.',
    ad_var: 'Takma adın zaten var.',
    dogum_yili: 'Doğum yılını kontrol et.',
    dogum_tarihi: 'Doğum tarihini kontrol et.',
    eposta_gecersiz: 'Bu e-posta adresi doğru görünmüyor.',
    eposta_gecici: 'Geçici e-posta adresleri kabul edilmiyor.',
    baglanti_gecersiz: 'Bu bağlantı geçersiz ya da süresi dolmuş. Yeni bir bağlantı iste.',
    sunucu: 'Şu an doğrulayamadım. Tekrar dene.',
    yeniden_dogrula: 'Silmeden önce e-postanı bağlantıyla yeniden doğrulaman gerekiyor.',
    kod_gerekli: 'Eşleştirme kodunu yaz (bekleyen ekranda görünen 3 haneli kod).',
    kod_yanlis: 'Eşleştirme kodu tutmadı. Bekleyen ekrandaki kodu kontrol et.',
    kurallar: 'Kuralları onayla.',
    uzunluk: 'En çok 280 harf.',
    gunluk_sinir: 'Bugünlük sınıra ulaştın. Yarın yine yaz.',
    jeton: 'Google girişi olmadı. Tekrar dene.',
    giris_kapali: 'E-posta girişi şu an kapalı. Birazdan tekrar dene.',
    parola_yanlis: 'Parola yanlış.',
    kayit_yok: 'Bu e-postayla kayıt bulunamadı.',
    eposta_kayitli: 'Bu e-posta kayıtlı.',
    parola_yok: 'Bu hesabın parolası yok.',
    parola_kisa: 'Parola en az 8 karakter olsun.',
    parola_uzun: 'Parola en çok 128 karakter olsun.',
    dogrulama: 'Güvenlik doğrulaması geçilemedi. Sayfayı yenileyip tekrar dene.',
    yazsammi_com: 'Yazsam mı? artık yazsammi.com’da. Oradan giriş yap.',
    kontenjan_dolu: 'Bugünkü yerler doldu. Yarın tekrar gel — yerin hazır olacak.', // hata değil: giriş penceresi bunu sakin bir ekranla gösterir (Pencereler.tsx)
    kendi: 'Kendi gönderini bildiremezsin.',
    yok: 'Bu artık yok.',
    ad_uygunsuz: 'Bu ad olmaz, başka dene.',
    yas: '18 yaşından küçükler katılamaz.',
    uzun: 'Biraz uzun oldu.',
    uygunsuz: 'Bu hâliyle paylaşılamıyor.',
    sinir: 'Çok hızlı gittin. Biraz bekleyip tekrar dene.',
    karsilikli_takip: 'Birbirinizi takip edince mesajlaşabilirsiniz.',
    mesaj_kapali: 'Bu kişiye şu an mesaj gönderilemiyor.',
    yeni_hesap: 'Yeni hesaplar ilk 3 gün istek gönderemez.',
    istek_sinir: 'Bugünlük 10 istek hakkın doldu.',
    istek_bekliyor: 'Kabul edince yazabilirsin.',
    once_kabul: 'Önce isteği kabul et.',
    engelli: 'Bu kişiyle etkileşim kapalı.',
    davet_gerekli: 'Şu an yalnız davetle açık. Davet kodunu yaz.',
    davet_yanlis: 'Bu kod tutmadı. Şu an yalnız davetle açık.',
    onay_gerekli: 'Devam etmek için onay kutusunu işaretle.',
    soz_gerekli: 'Devam etmek için güncel sözleşmeleri onayla.',
    susturuldu: 'Kurallar nedeniyle hesabın 7 gün yazamaz.',
    hesap_kapali: 'Hesabın kurallara aykırılık nedeniyle kapatıldı.',
    ad_bekle: 'Takma adını 30 günde bir değiştirebilirsin.',
    ad_ayni: 'Bu zaten senin adın.',
    hesap_yok: 'Bu hesapla açılmış üyelik yok.',
    siliniyor: 'Hesabın siliniyor, bir saniye.',
    foto_kapali: 'Fotoğraf şu an kapalı.',
    foto_buyuk: 'Fotoğraf çok büyük.',
    foto_tur: 'Bu dosya fotoğraf değil.',
    foto_bicim: 'Fotoğraf okunamadı.',
    foto_exif: 'Fotoğraf okunamadı.',
    uygun_degil: 'Bu hâliyle paylaşılamıyor.',
    kodlama: 'Yazı okunamadı. Tekrar dene.',
    hazirlaniyor: 'Akış hazırlanıyor. Birkaç saniye sonra tekrar dene.',
    uretiliyor: 'Hazırlanıyor. Az sonra tekrar dene.',
    giris_gerekli: 'Önce giriş yap.',
    ad_gerekli: 'Önce takma adını seç.',
    eksik: 'Eksik bir şey var. Tekrar dene.',
    tekrar: 'Bunu az önce gönderdin.',
    zaten_var: 'Akışında zaten var.',
    yetki_yok: 'Bunun için yetkin yok.',
    durum: 'Bu şu an yapılamıyor.',
    oncu_gerek: 'Bu yalnız Öncülere açık.',
    rozet_yok: 'Bu rozet henüz rafında değil.',
    yavas_mod: 'Yavaş mod: birkaç saniye sonra yaz.',
    oda_kapali: 'Oda şu an kapalı.',
    tahmin_kapali: 'Tahmin süresi doldu.',
    mac_canli_degil: 'Maç canlı değil.',
    oy_verildi: 'Oyunu zaten verdin.',
    oy_kapali: 'Oylama kapandı.',
    taraf_kilitli: 'Maç içinde taraf değişmez.',
    yabanci_taraf: 'Avrupa maçında yabancı takımın tarafı seçilmez.',
    muhabir_degil: 'Bunu yalnız Tribün Muhabiri yapar.',
  };
  if (s[h]) return s[h];
  if (durum === 429) return s.sinir;
  if (durum === 401) return 'Önce giriş yap.';
  return 'Olmadı. Tekrar dene.';
}

// Yazara göre sabit yüz (duygu balonu). Marka hesabı kendi yüzüyle.
export const MARKA_YUZ = 'kikir';
const YUZLER = ['gergin', 'utangac', 'uzgun', 'emin', 'panik', 'kahkaha', 'goz', 'devir', 'kikir'];
export function yuzSec(y: Pick<Yazar, 'uid' | 'ad' | 'marka' | 'yuz'>) {
  if (y.marka) return MARKA_YUZ;
  if (y.yuz === 'gece') return 'devir'; // yuzler.ts'de "gece" anahtarı logoyla eziliyor; yüz olarak "devir" gösterilir
  if (y.yuz && YUZLER.includes(y.yuz)) return y.yuz;
  let h = 0;
  for (const c of y.ad || y.uid) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return YUZLER[h % YUZLER.length];
}

export function zamanOnce(ms: number, simdi = Date.now()) {
  const s = Math.max(0, Math.round((simdi - ms) / 1000));
  if (s < 45) return 'şimdi';
  const d = Math.max(1, Math.floor(s / 60)); // aşağı yuvarlama: 23,5 saat "dün" değil "23 sa" (07.10)
  if (d < 60) return `${d} dk`; // bölünmez boşluk: satır sonunda 'dk' tek başına alt satıra düşmesin (08.10)
  const sa = Math.floor(d / 60);
  if (sa < 24) return `${sa} sa`;
  const g = Math.floor(sa / 24);
  if (g === 1) return 'dün';
  if (g < 7) return `${g} g`;
  const t = new Date(ms);
  return `${t.getDate()} ${['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'][t.getMonth()]}`;
}
export function kisaSayi(n: number) {
  if (n < 1000) return String(n);
  if (n < 10000) return `${(n / 1000).toFixed(1).replace('.0', '').replace('.', ',')}B`;
  return `${Math.round(n / 1000)}B`;
}

// --- hesap ve ayarlar (Ayarlar ekranı; sunucu uyum.mjs) ---
export type HesapBilgi = { adSonraki: number | null; susturma: number | null; katilim: number; eposta?: string }; // eposta: sunucunun maskelediği (a***@alan.com); yalnız e-postayla girenlerde var
export async function hesapGetir(): Promise<Sonuc<HesapBilgi>> {
  const r = await istek<any>('/c/hesap');
  if (!r.ok) return r;
  const t = (x: unknown) => (typeof x === 'string' && x ? Date.parse(x) : null);
  return { ok: true, veri: { adSonraki: t(r.veri?.adSonraki), susturma: t(r.veri?.susturma), katilim: t(r.veri?.katilim) ?? 0, ...(typeof r.veri?.eposta === 'string' && r.veri.eposta ? { eposta: r.veri.eposta } : {}) } };
}
export async function adDegistir(ad: string): Promise<Sonuc<Uye>> {
  const r = await istek<any>('/c/ad/degistir', { ad });
  if (!r.ok) return r;
  const eski = kayitliUye();
  const u = r.veri?.uye ?? {};
  const uye: Uye = { uid: String(u.uid ?? eski?.uid ?? ''), ad: String(u.ad ?? ad), yeni: false, yuz: u.yuz ?? undefined, ...(u.kurucu || eski?.kurucu ? { kurucu: true } : {}), ...uyeKimlik(u) };
  oturumYaz(r.veri?.oturum ? String(r.veri.oturum) : oturum, uye);
  return { ok: true, veri: uye };
}
export type Engellenen = { sohbet: string; kisi: Yazar; zaman: number };
export async function engellenenlerGetir(): Promise<Sonuc<Engellenen[]>> {
  const r = await istek<any>('/c/engellenenler');
  if (!r.ok) return r;
  const liste = Array.isArray(r.veri?.liste) ? r.veri.liste : [];
  return { ok: true, veri: liste.map((x: any) => ({ sohbet: String(x.sohbet), kisi: yazarCevir({ yazar: x.kisi }), zaman: zamanCevir(x.zaman) })) };
}
export const engelKaldir = (sohbet: string) => istek<unknown>('/c/engel/kaldir', { sohbet });
// appleKod: yalnız iOS'ta Apple hesabı silinirken (Apple'daki girişin iptali için tek kullanımlık kod; appleGiris.ios.ts).
export async function hesapSil(appleKod?: string): Promise<Sonuc<unknown>> {
  const r = await istek<unknown>('/c/hesap/sil', { onay: true, ...(appleKod ? { appleKod } : {}) });
  if (r.ok) oturumYaz(null, null);
  return r;
}
