// Akış üstünde açılan pencereler: giriş (Google / test), takma ad adımı, bildir, yeni gönderi.
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { FOTO_VAR, fotoSec, type HazirFoto } from '@/canliFoto';
import { yazi } from '@/tema/tema';
import * as C from '@/canli';
import type { Alinti, Gonderi, Sebep } from '@/canli';
import { Avatar, Bas, Dugme, Ikon, Pencere, useRenk } from './ortak';
import { useCanli, type PaylasHedef } from './baglam';
import { gorevBildir } from './SagKose';
import { AlintiKart } from './Kart';
import { GOOGLE_YEREL } from '@/googleGiris';
import { APPLE_YEREL } from '@/appleGiris';
import { SITE } from '@/analiz';
import { AppleYerelDugme } from './AppleYerel';
import { GoogleYerelDugme } from './GoogleYerel';
import { KurucuSecenekleri } from './Kurucu';
import { EtiketOneri } from './Etiket';
import { EngelAlani, useEngel } from './engel';
import { KarakterHalkasi, harfSay } from './Sayac';
import { YuzBalon } from './balon';
import { YASAL_IBARE } from '@/kahin/yasal';
import { EpostaBekle, EpostaYolu } from './EpostaGiris';
import { ParolaGiris } from './ParolaGiris';
import { MagazaPenceresi } from '@/magaza/Magaza';
import { beklemeKaydi, beklemeSil } from '@/uyelik';

// Şartlar / Gizlilik: sitede yeni sekme, uygulamada tarayıcı.
const sayfaAc = (yol: string) => (Platform.OS === 'web' ? window.open(yol, '_blank') : Linking.openURL(`${SITE}${yol}`));

export function Pencereler() {
  const c = useCanli();
  const p = c.pencere;
  // Güncel sözleşme sürümü onaylanmazsa (Şimdi değil, çarpı, dış tık, geri tuşu) üye olarak devam edilmez: oturum kapanır.
  const sozReddet = () => {
    C.cikis();
    c.uyeAyarla(null);
    c.pencereKapat();
    c.tost('Onaylamadan üye olarak devam edilemez; çıkış yapıldı.');
  };
  return (
    <>
      <Pencere acik={p?.tur === 'giris'} kapat={c.pencereKapat} genislik={420}>
        {p?.tur === 'giris' && <Giris neden={p.neden} mod={p.mod} />}
      </Pencere>
      <Pencere acik={p?.tur === 'ad'} kapat={c.pencereKapat} genislik={440}>
        {p?.tur === 'ad' && <AdAdimi />}
      </Pencere>
      <Pencere acik={p?.tur === 'adsiz'} kapat={c.pencereKapat} genislik={440}>
        {p?.tur === 'adsiz' && <AdsizAdimi />}
      </Pencere>
      <Pencere acik={p?.tur === 'soz'} kapat={sozReddet} genislik={440}>
        {p?.tur === 'soz' && <SozAdimi reddet={sozReddet} />}
      </Pencere>
      <Pencere acik={p?.tur === 'bildir'} kapat={c.pencereKapat} genislik={420} baslik="Gönderi">
        {p?.tur === 'bildir' && <Bildir id={p.id} />}
      </Pencere>
      <Pencere acik={p?.tur === 'yazici'} kapat={c.pencereKapat} genislik={560}>
        {p?.tur === 'yazici' && <Yazici />}
      </Pencere>
      <Pencere acik={p?.tur === 'paylas'} kapat={c.pencereKapat} genislik={420} baslik="Paylaş">
        {p?.tur === 'paylas' && <PaylasMenu hedef={p.hedef} />}
      </Pencere>
      <Pencere acik={p?.tur === 'yeniden'} kapat={c.pencereKapat} genislik={560}>
        {p?.tur === 'yeniden' && <YenidenYazici hedef={p.hedef} />}
      </Pencere>
      <MagazaPenceresi />
    </>
  );
}

// --- Google Identity Services (web) ---
declare global {
  interface Window {
    google?: any;
  }
}
let gisSozu: Promise<void> | null = null;
function gisYukle() {
  if (gisSozu) return gisSozu;
  gisSozu = new Promise((tamam, hata) => {
    if (window.google?.accounts?.id) return tamam();
    const e = document.createElement('script');
    e.src = 'https://accounts.google.com/gsi/client';
    e.async = true;
    e.defer = true;
    e.onload = () => tamam();
    e.onerror = () => {
      gisSozu = null;
      hata(new Error('gis'));
    };
    document.head.appendChild(e);
  });
  return gisSozu;
}

// 29.10 (reklam ölçümü: 2 günde ~1.300 Instagram/Facebook/TikTok ziyaretçisi, 1 giriş isteği): Google, uygulamaların içindeki tarayıcıda
// girişe izin vermiyor ("tarayıcı güvenli değil" engeli; istek sunucuya hiç gelmez). Orada Google düğmesi yerine "tarayıcıda aç" yolu gösterilir.
const UA = Platform.OS === 'web' && typeof navigator !== 'undefined' ? navigator.userAgent : '';
const UYGULAMA_ICI = /FBAN|FBAV|FB_IAB|Instagram|musical_ly|BytedanceWebview|TikTok|Line\//.test(UA);
const ANDROID = /Android/.test(UA);
// Reklam kaynağı (acilis.js ölçümü: yazsammi_kaynak_v1) yeni tarayıcıya ?k= ile taşınır; yoksa orada "diğer" sayılırdı.
function disAdres() {
  let k = '';
  try { k = JSON.parse(localStorage.getItem('yazsammi_kaynak_v1') || 'null')?.k || ''; } catch {}
  const q = new URLSearchParams(location.search);
  if (/^(ig|tt)$/.test(k) && !q.get('k')) q.set('k', k);
  const s = q.toString();
  return location.host + location.pathname + (s ? '?' + s : '');
}
function tarayicidaAc() {
  const a = disAdres();
  if (ANDROID) location.href = `intent://${a}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent('https://' + a)};end`;
  else location.href = 'x-safari-https://' + a;
}

function UygulamaIciGiris() {
  const R = useRenk();
  const [kopya, kopyaAyarla] = useState(false);
  const kopyala = async () => {
    try { await navigator.clipboard.writeText('https://' + disAdres()); kopyaAyarla(true); } catch { kopyaAyarla(false); }
  };
  return (
    <View style={{ alignSelf: 'stretch', alignItems: 'center', gap: 10, paddingHorizontal: 18 }}>
      <Text style={[s.girisAlt, { color: R.soluk }]}>Bu uygulamanın içindeki tarayıcıda Google girişi çalışmıyor. Siteyi {ANDROID ? "Chrome'da" : "Safari'de"} aç, oradan tek dokunuşla gir.</Text>
      <Dugme yazi={ANDROID ? "Chrome'da aç" : "Safari'de aç"} tur="acik" onPress={tarayicidaAc} />
      <Text style={[s.girisAlt, { color: R.soluk, fontSize: 13 }]}>Açılmazsa sağ üstteki ⋯ menüsünden “Tarayıcıda aç”a dokun.</Text>
      <Bas onPress={kopyala} style={{ paddingVertical: 4, paddingHorizontal: 10 }}>
        <Text style={[s.testBag, { color: R.soluk }]}>{kopya ? 'Bağlantı kopyalandı' : 'Bağlantıyı kopyala'}</Text>
      </Bas>
    </View>
  );
}

// kapi: zorunlu üye girişi kapısı (UygulamaKapisi.tsx) — pencere değil tam ekran; "Şimdi değil" yok, çıkış yolu yok.
export function Giris({ neden, kapi = false, mod }: { neden: string; kapi?: boolean; mod?: 'giris' | 'uye' }) {
  const R = useRenk();
  const c = useCanli();
  const [testAd, testAdAyarla] = useState('');
  const [testAcik, testAcikAyarla] = useState(false);
  const [bekliyor, bekliyorAyarla] = useState(false);
  const [hata, hataAyarla] = useState('');
  const [dolu, doluAyarla] = useState(false); // günlük yeni kayıt kontenjanı doldu: hata değil, sakin bilgi ekranı
  const dugmeKutusu = useRef<View>(null);
  const googleVar = Platform.OS === 'web' && !!C.GOOGLE_ISTEMCI && !UYGULAMA_ICI;
  // E-posta yolu (08.11): sunucuda açıksa Google/Apple'ın altında görünür; bağlantı gidince "E-postana bak" ekranı.
  const [epostaAcik, epostaAcikAyarla] = useState(false);
  const [bekle, bekleAyarla] = useState<{ e: string; sk: string; t: number; kod: string; yeni: boolean } | null>(() => {
    const k = beklemeKaydi(); // pencere kapanıp açıldıysa ya da sayfa yenilendiyse bekleyiş sürer (15 dk)
    return k ? { e: k.e, sk: k.sk, t: k.t, kod: k.kod ?? '', yeni: false } : null;
  });
  const [sonEposta, sonEpostaAyarla] = useState('');
  const [parolaVar, parolaVarAyarla] = useState(false); // 18.11: e-posta + parola (onaysız giriş/üye ol); sunucu desteklemiyorsa eski bağlantılı yol
  useEffect(() => {
    let iptal = false;
    C.epostaDurum().then((a) => !iptal && epostaAcikAyarla(a));
    C.parolaDurum().then((a) => !iptal && parolaVarAyarla(a));
    return () => {
      iptal = true;
    };
  }, []);
  const sosyalVar = !UYGULAMA_ICI && (googleVar || APPLE_YEREL || GOOGLE_YEREL);

  const sonuc = async (govde: { idToken: string } | { apple: string } | { test: string }) => {
    bekliyorAyarla(true);
    hataAyarla('');
    const r = await C.girisYap(govde);
    bekliyorAyarla(false);
    if (!r.ok && r.hata === 'kontenjan_dolu') return doluAyarla(true);
    if (!r.ok) return hataAyarla(C.hataYazisi(r.hata, r.durum));
    c.girisTamam(r.veri);
  };

  useEffect(() => {
    if (!googleVar) return;
    let iptal = false;
    gisYukle()
      .then(() => {
        if (iptal) return;
        const g = window.google.accounts.id;
        g.initialize({ client_id: C.GOOGLE_ISTEMCI, callback: (y: { credential: string }) => sonuc({ idToken: y.credential }), cancel_on_tap_outside: true, use_fedcm_for_prompt: true, context: 'signin', ux_mode: 'popup', itp_support: true });
        const el = dugmeKutusu.current as unknown as HTMLElement | null;
        if (el) g.renderButton(el, { theme: R.gece ? 'filled_black' : 'outline', size: 'large', shape: 'pill', text: 'continue_with', locale: 'tr', width: 300, logo_alignment: 'center' });
        if (!C.ORNEK) g.prompt();
      })
      .catch(() => hataAyarla('Google şu an açılmadı.'));
    return () => {
      iptal = true;
      if (!C.ORNEK)
        try {
          window.google?.accounts?.id?.cancel();
        } catch {}
    };
  }, [googleVar, R.gece]);

  if (bekle && !dolu)
    return (
      <View style={s.giris}>
        <EpostaBekle
          e={bekle.e}
          sk={bekle.sk}
          t={bekle.t}
          kod={bekle.kod}
          yeniGonderildi={bekle.yeni}
          bitti={(u) => c.girisTamam(u)}
          degistir={() => {
            beklemeSil();
            sonEpostaAyarla(bekle.e);
            bekleAyarla(null);
          }}
        />
        {!kapi && (
          <Bas onPress={c.pencereKapat} style={s.simdiDegil}>
            <Text style={[s.simdiDegilYazi, { color: R.soluk }]}>Şimdi değil</Text>
          </Bas>
        )}
      </View>
    );

  if (dolu)
    return (
      <View style={s.giris}>
        <View style={s.girisYuzler}>
          {['goz', 'kikir', 'kahkaha'].map((y, i) => (
            <View key={y} style={{ transform: [{ rotate: `${(i - 1) * 9}deg` }, { translateY: i === 1 ? -6 : 0 }], marginLeft: i ? -14 : 0 }}>
              <YuzBalon ad={y} boyut={i === 1 ? 70 : 56} />
            </View>
          ))}
        </View>
        <Text style={[s.girisBaslik, { color: R.murekkep }]}>Bugünkü yerler doldu.</Text>
        <Text style={[s.girisAlt, { color: R.soluk }]}>Yarın tekrar gel — yerin hazır olacak.</Text>
        <Bas onPress={kapi ? () => doluAyarla(false) : c.pencereKapat} style={s.simdiDegil}>
          <Text style={[s.simdiDegilYazi, { color: R.soluk }]}>Tamam</Text>
        </Bas>
      </View>
    );

  return (
    <View style={s.giris}>
      <View style={s.girisYuzler}>
        {['goz', 'kikir', 'kahkaha'].map((y, i) => (
          <View key={y} style={{ transform: [{ rotate: `${(i - 1) * 9}deg` }, { translateY: i === 1 ? -6 : 0 }], marginLeft: i ? -14 : 0 }}>
            <YuzBalon ad={y} boyut={i === 1 ? 70 : 56} />
          </View>
        ))}
      </View>
      <Text style={[s.girisBaslik, { color: R.murekkep }]}>{neden}</Text>
      {sosyalVar ? (
        <Text style={[s.girisAlt, { color: R.soluk }]}>{APPLE_YEREL ? (GOOGLE_YEREL ? 'Apple ya da Google ile girersen e-postanın kendisi saklanmaz, yalnız geri çevrilemez özeti tutulur; e-postayla girersen e-posta adresin saklanır.' : 'Apple ile girersen e-postanın kendisi saklanmaz, yalnız geri çevrilemez özeti tutulur; e-postayla girersen e-posta adresin saklanır.') : 'Google ile girersen e-postanın kendisi saklanmaz, yalnız geri çevrilemez özeti tutulur; e-postayla girersen e-posta adresin saklanır.'}</Text>
      ) : epostaAcik && !parolaVar ? (
        <Text style={[s.girisAlt, { color: R.soluk }]}>Şifre yok. Sana bir giriş bağlantısı göndeririz.</Text>
      ) : null}
      <View style={{ alignSelf: 'stretch', alignItems: 'center', gap: 12, marginTop: 8 }}>
        {UYGULAMA_ICI && !!C.GOOGLE_ISTEMCI ? (
          <UygulamaIciGiris />
        ) : googleVar ? (
          <View ref={dugmeKutusu} style={{ minHeight: 44, minWidth: 300, alignItems: 'center' }} />
        ) : APPLE_YEREL ? (
          // iOS: Apple düğmesi (App Store 4.8) üstte; Google yalnız iOS istemci kimliği derlemeye verildiyse (googleGiris.native.ts).
          <>
            <AppleYerelDugme jeton={(apple) => sonuc({ apple })} hata={hataAyarla} devre={bekliyor} />
            {GOOGLE_YEREL && <GoogleYerelDugme jeton={(idToken) => sonuc({ idToken })} hata={hataAyarla} devre={bekliyor} />}
          </>
        ) : GOOGLE_YEREL ? (
          <GoogleYerelDugme jeton={(idToken) => sonuc({ idToken })} hata={hataAyarla} devre={bekliyor} />
        ) : (
          <View style={[s.googleYakinda, { borderColor: R.cizgi }]}>
            <Text style={[s.googleG, { color: R.soluk }]}>G</Text>
            <Text style={[s.googleYazi, { color: R.soluk }]}>Google ile giriş çok yakında</Text>
          </View>
        )}
        {C.TEST_GIRISI && !testAcik && (
          <Bas onPress={() => testAcikAyarla(true)} style={{ paddingVertical: 4, paddingHorizontal: 10 }}>
            <Text style={[s.testBag, { color: R.soluk }]}>Test girişi</Text>
          </Bas>
        )}
        {C.TEST_GIRISI && testAcik && (
          <View style={{ flexDirection: 'row', gap: 8, alignSelf: 'stretch', paddingHorizontal: 18 }}>
            <TextInput
              value={testAd}
              onChangeText={testAdAyarla}
              placeholder="test adı"
              placeholderTextColor={R.soluk}
              autoCapitalize="none"
              autoFocus
              onSubmitEditing={() => testAd.trim() && sonuc({ test: testAd.trim() })}
              style={[s.testGiris, { color: R.murekkep, borderColor: R.cizgi, backgroundColor: R.ust }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
            />
            <Dugme yazi="Gir" kucuk tur="cizgi" devre={!testAd.trim() || bekliyor} onPress={() => sonuc({ test: testAd.trim() })} />
          </View>
        )}
        {bekliyor && <ActivityIndicator color={R.vurgu} />}
        {!!hata && <Text style={[s.hata, { color: R.kalem }]}>{hata}</Text>}
        {(epostaAcik || parolaVar) && (
          <>
            {!UYGULAMA_ICI && (
              <View style={s.veya}>
                <View style={[s.veyaCizgi, { backgroundColor: R.cizgi }]} />
                <Text style={[s.veyaYazi, { color: R.soluk }]}>ya da</Text>
                <View style={[s.veyaCizgi, { backgroundColor: R.cizgi }]} />
              </View>
            )}
            {parolaVar ? <ParolaGiris baslangic={mod} bitti={(u) => c.girisTamam(u)} /> : <EpostaYolu varsayilan={sonEposta} gonderildi={(e, sk, kod) => bekleAyarla({ e, sk, t: Date.now(), kod, yeni: true })} />}
          </>
        )}
      </View>
      {!kapi && !!c.uye?.yeni && C.oturumVar() && (
        <Bas onPress={c.kayitTamamla} etiket="Kaydımı tamamla" style={s.simdiDegil}>
          <Text style={[s.simdiDegilYazi, { color: R.soluk }]}>Kaydımı tamamla</Text>
        </Bas>
      )}
      <Text style={[s.yasal, { color: R.soluk }]}>
        18+ · <Text style={{ textDecorationLine: 'underline' }} onPress={() => sayfaAc('/sartlar/')}>Kullanım şartları</Text> ·{' '}
        <Text style={{ textDecorationLine: 'underline' }} onPress={() => sayfaAc('/gizlilik/')}>KVKK aydınlatma metni</Text>
      </Text>
      {!kapi && (
        <Bas onPress={c.pencereKapat} style={s.simdiDegil}>
          <Text style={[s.simdiDegilYazi, { color: R.soluk }]}>Şimdi değil</Text>
        </Bas>
      )}
    </View>
  );
}

// Onay kutusu (AdAdimi ve SozAdimi).
function Kutu({ acik, degis, children }: { acik: boolean; degis: () => void; children: React.ReactNode }) {
  const R = useRenk();
  return (
    <Pressable onPress={degis} accessibilityRole="checkbox" accessibilityState={{ checked: acik }} style={s.kutuSatir}>
      <View style={[s.kutu, { borderColor: acik ? R.vurgu : R.cizgi, backgroundColor: acik ? R.vurgu : 'transparent' }]}>{acik && <Ikon ad="tik" boyut={14} renk="#fff" kalinlik={3.2} />}</View>
      <View style={{ flex: 1 }}>{children}</View>
    </Pressable>
  );
}

// Sözleşme kutuları (yeni kayıt ve sürüm onayı penceresi) — HUKUK şartnamesi (onur_isler/HUKUK/UYELIK_ONAYLARI.md): dört şey ayrı tutulur.
//  1) Kullanım Şartları + Topluluk kuralları: ZORUNLU kutu, işaretsiz gelir. 2) KVKK Aydınlatma: kutu değil, görünür cümle + bağlantı.
//  3) Açık rıza kutuları (figür hafızası, "Yazsam mı? bana yazabilir"): şartların bloğundan AYRI bir blokta, işaretsiz, isteğe bağlı.
//  "Tümünü kabul et" düğmesi yok; ticari ileti kutusu yok.
function SozKutulari({ zorunlu, zorunluAyarla, hafiza, hafizaAyarla, durtme, durtmeAyarla, tekDokunus = false }: { zorunlu: boolean; zorunluAyarla: (v: boolean) => void; hafiza: boolean; hafizaAyarla: (v: boolean) => void; durtme: boolean; durtmeAyarla: (v: boolean) => void; tekDokunus?: boolean }) {
  const R = useRenk();
  const bag = (yol: string, yazi: string) => (
    <Text style={{ color: R.vurgu, textDecorationLine: 'underline' }} onPress={() => sayfaAc(yol)}>{yazi}</Text>
  );
  return (
    <View style={{ gap: 14 }}>
      <View style={[s.blok, { borderColor: R.cizgi, backgroundColor: R.ust }]}>
        <Text style={[s.blokBaslik, { color: R.soluk }]}>ÜYELİK İÇİN GEREKLİ</Text>
        {tekDokunus ? (
          <Text style={[s.kural, { color: R.murekkep, fontSize: 14 }]}>
            “Kabul ediyorum” dediğinde {bag('/sartlar/', 'Kullanım Şartları')}’nı ve {bag('/kurallar/', 'Topluluk kuralları')}’nı kabul etmiş olursun.
          </Text>
        ) : (
          <Kutu acik={zorunlu} degis={() => zorunluAyarla(!zorunlu)}>
            <Text style={[s.kural, { color: R.murekkep, fontSize: 14, marginTop: 0 }]}>
              {bag('/sartlar/', 'Kullanım Şartları')}’nı ve {bag('/kurallar/', 'Topluluk kuralları')}’nı okudum, kabul ediyorum.
            </Text>
          </Kutu>
        )}
        <Text style={[s.kural, { color: R.soluk, fontSize: 13 }]}>
          Kişisel verilerin {bag('/gizlilik/', 'KVKK Aydınlatma Metni')}’nde anlatıldığı gibi işlenir.
        </Text>
        {/* Onur 03.11: Kullanım şartları 6/B ile aynı ibare, onay metninin içinde de görünür */}
        <Text style={[s.kural, { color: R.soluk, fontSize: 12.5 }]}>Astroloji ve Tarot: {YASAL_IBARE}</Text>
      </View>
      <View style={[s.blok, { borderColor: R.cizgi }]}>
        <Text style={[s.blokBaslik, { color: R.soluk }]}>İSTEĞE BAĞLI İZİNLER</Text>
        <Kutu acik={hafiza} degis={() => hafizaAyarla(!hafiza)}>
          <Text style={[s.kural, { color: R.murekkep, fontSize: 14, marginTop: 0 }]}>Figürüm beni tanısın ve hatırlasın: sohbette kendi söylediklerimden (hitap, ilgi alanları gibi) kısa notlar tutulsun.</Text>
        </Kutu>
        <View style={[s.blokAyrac, { backgroundColor: R.ince }]} />
        <Kutu acik={durtme} degis={() => durtmeAyarla(!durtme)}>
          <Text style={[s.kural, { color: R.murekkep, fontSize: 14, marginTop: 0 }]}>Yazsam mı? bana yazabilir: bir süre girmezsem Mesajlar’a kısa bir not bırakabilir.</Text>
        </Kutu>
        <Text style={[s.kural, { color: R.soluk, fontSize: 12.5 }]}>
          İzin vermezsen hizmet aynen çalışır. İstediğin an Ayarlar’dan değiştirirsin. {bag('/acik-riza/', 'Açık rıza metni')}
        </Text>
      </View>
    </View>
  );
}

// Güncel sözleşme sürümünü onaylamamış üye (eski sürüm ya da sürümsüz): onaylayınca devam eder, onaylamazsa çıkış yapılır.
function SozAdimi({ reddet }: { reddet: () => void }) {
  const R = useRenk();
  const c = useCanli();
  const zorunlu = true; // 23.10 (Onur): mevcut üye tek dokunuşla geçer; düğme açık kabul beyanıdır, isteğe bağlı izinler işaretsiz kalır
  const [hafiza, hafizaAyarla] = useState(false);
  const [durtme, durtmeAyarla] = useState(false);
  const [bekliyor, bekliyorAyarla] = useState(false);
  const [hata, hataAyarla] = useState('');
  const onayla = async () => {
    if (!zorunlu || bekliyor) return;
    bekliyorAyarla(true);
    hataAyarla('');
    const r = await C.sozOnayla({ hafiza, durtme });
    bekliyorAyarla(false);
    if (!r.ok) return hataAyarla(C.hataYazisi(r.hata, r.durum));
    c.girisTamam(r.veri);
  };
  return (
    <ScrollView contentContainerStyle={s.ad} keyboardShouldPersistTaps="handled">
      <View style={{ alignItems: 'center', gap: 6 }}>
        <Text style={[s.girisBaslik, { color: R.murekkep }]}>Sözleşmelerimizi güncelledik</Text>
        <Text style={[s.girisAlt, { color: R.soluk, textAlign: 'center' }]}>Devam etmek için yeni sürümü onayla. Yeni: figürlerle sohbet ve hafıza (isteğe bağlı izin).</Text>
      </View>
      <SozKutulari zorunlu={zorunlu} zorunluAyarla={() => {}} hafiza={hafiza} hafizaAyarla={hafizaAyarla} durtme={durtme} durtmeAyarla={durtmeAyarla} tekDokunus />
      {!!hata && <Text style={[s.hata, { color: R.kalem }]}>{hata}</Text>}
      <Dugme yazi={bekliyor ? 'Bir saniye…' : 'Kabul ediyorum, devam et'} tur="acik" devre={!zorunlu || bekliyor} onPress={onayla} />
      <Bas onPress={reddet} style={[s.simdiDegil, { alignSelf: 'center' }]}>
        <Text style={[s.simdiDegilYazi, { color: R.soluk }]}>Şimdi değil</Text>
      </Bas>
    </ScrollView>
  );
}

// Yeni üye: takma ad + doğum tarihi (gün-ay-yıl; yaş sunucuda hesaplanır, 18 altında tarih saklanmaz) + sözleşmeler.
const AD_KALIP = /^[a-zA-Z0-9_çğıöşüÇĞİÖŞÜ]{3,20}$/;
const iki = (n: number) => String(n).padStart(2, '0');
// Gerçek bir takvim günü mü? (31 Şubat olmaz). Tamamsa ISO tarih ve tam yaş döner.
function tarihCoz(g: string, a: string, y: string, simdi = new Date()) {
  const gg = +g, aa = +a, yy = +y;
  if (!g || !a || y.length !== 4 || gg < 1 || gg > 31 || aa < 1 || aa > 12 || yy < 1900 || yy > simdi.getFullYear()) return null;
  const d = new Date(Date.UTC(yy, aa - 1, gg));
  if (d.getUTCFullYear() !== yy || d.getUTCMonth() !== aa - 1 || d.getUTCDate() !== gg) return null;
  const yas = simdi.getFullYear() - yy - (simdi.getMonth() + 1 < aa || (simdi.getMonth() + 1 === aa && simdi.getDate() < gg) ? 1 : 0);
  if (yas < 0) return null;
  return { iso: `${yy}-${iki(aa)}-${iki(gg)}`, yas };
}
// kapi: zorunlu giriş kapısında takma ad adımından çıkış yolu ("Başka hesapla gir"); pencere ve site davranışı aynen.
// 19.11: giriş yapıldı ama bu e-postanın hesabında takma ad yok (ör. Google/Apple ile üye olan kişi e-postayla ayrı boş hesap açmış). Takma ad formu yerine durum açıklanır; form yalnız isteyene.
export function AdsizAdimi() {
  const R = useRenk();
  const c = useCanli();
  const [form, formAyarla] = useState(false);
  if (form) return <AdAdimi />;
  return (
    <View style={s.giris}>
      <Text style={[s.girisBaslik, { color: R.murekkep }]}>Bu e-postanın takma adı yok.</Text>
      <Text style={[s.girisAlt, { color: R.soluk }]}>Daha önce Google ya da Apple ile üye olduysan o hesap bu e-postaya bağlı değil: ana sayfadan o düğmeyle gir. Bu e-postayı ayrı bir hesap olarak kullanmak istersen takma adını seç.</Text>
      <View style={{ alignSelf: 'stretch', gap: 10, marginTop: 8 }}>
        <Dugme yazi="Ana sayfaya dön" tur="acik" onPress={() => { C.cikis(); c.uyeAyarla(null); c.pencereKapat(); }} />
        <Dugme yazi="Takma adımı seçeceğim" tur="cizgi" onPress={() => formAyarla(true)} />
      </View>
    </View>
  );
}

export function AdAdimi({ kapi = false }: { kapi?: boolean }) {
  const R = useRenk();
  const c = useCanli();
  const [ad, adAyarla] = useState('');
  const [gun, gunAyarla] = useState('');
  const [ay, ayAyarla] = useState('');
  const [yil, yilAyarla] = useState('');
  const [zorunlu, zorunluAyarla] = useState(false); // kullanım şartları + topluluk kuralları (KVKK aydınlatma kutu değil, cümle); sunucu sürüm ve zamanı saklar
  const [hafiza, hafizaAyarla] = useState(false); // isteğe bağlı açık rızalar (ayrı blok, işaretsiz)
  const [durtme, durtmeAyarla] = useState(false);
  const [davet, davetAyarla] = useState('');
  const davetVar = !!c.uye?.davetGerekli; // canlıda davetle açılış
  const [bekliyor, bekliyorAyarla] = useState(false);
  const [hata, hataAyarla] = useState('');
  const gunRef = useRef<TextInput>(null);
  const ayRef = useRef<TextInput>(null);
  const yilRef = useRef<TextInput>(null);
  const t = tarihCoz(gun, ay, yil);
  const kucuk = !!t && t.yas < 18;
  const tarihDolu = !!gun && !!ay && yil.length === 4;
  const tarihSorunlu = (tarihDolu && !t) || kucuk;
  const adTamam = AD_KALIP.test(ad);
  const hazir = adTamam && !!t && !kucuk && zorunlu && (!davetVar || davet.trim().length >= 4) && !bekliyor;
  const kaydet = async () => {
    if (!hazir || !t) return;
    bekliyorAyarla(true);
    hataAyarla('');
    const r = await C.adKaydet(ad, +yil, { dogumTarihi: t.iso, onay: true, soz: true, rizalar: { hafiza, durtme }, ...(davetVar ? { davet: davet.trim() } : {}) });
    bekliyorAyarla(false);
    if (!r.ok) return hataAyarla(C.hataYazisi(r.hata, r.durum));
    c.girisTamam(r.veri);
  };
  const webSiz = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null;
  const tarihStil = (genis: number): any => [s.tarihGiris, { borderColor: tarihSorunlu ? R.kalem : R.cizgi, backgroundColor: R.ust, color: R.murekkep, flexGrow: genis, flexShrink: 1, flexBasis: 0, minWidth: 0 }, webSiz];
  return (
    <ScrollView contentContainerStyle={s.ad} keyboardShouldPersistTaps="handled">
      <View style={{ alignItems: 'center', gap: 6 }}>
        <Avatar yazar={{ uid: ad || 'yeni', ad: ad || 'yeni', marka: false }} boyut={72} />
        <Text style={[s.girisBaslik, { color: R.murekkep }]}>Sana ne diyelim?</Text>
        <Text style={[s.girisAlt, { color: R.soluk }]}>Gerçek adın değil, takma ad.</Text>
      </View>
      <View style={{ gap: 6 }}>
        <View style={[s.adGiris, { borderColor: ad && !adTamam ? R.kalem : R.cizgi, backgroundColor: R.ust }]}>
          <Text style={[s.et, { color: R.soluk }]}>@</Text>
          <TextInput value={ad} onChangeText={(x) => adAyarla(x.replace(/\s/g, '').slice(0, 20))} placeholder="takma_ad" placeholderTextColor={R.soluk} autoCapitalize="none" autoFocus accessibilityLabel="Takma adın" style={[s.adYazi, { color: R.murekkep }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]} />
          {adTamam && <Ikon ad="tik" boyut={18} renk={R.yesil} kalinlik={2.8} />}
        </View>
        <Text style={[s.ipucu, { color: ad && !adTamam ? R.kalem : R.soluk }]}>3–20 harf, rakam ya da _ · kişisel bilgi yazma</Text>
      </View>
      <View style={{ gap: 6 }}>
        <Text style={[s.alanEtiket, { color: R.soluk }]}>Doğum tarihin</Text>
        <View style={s.tarihSira}>
          <TextInput
            ref={gunRef}
            value={gun}
            onChangeText={(x) => {
              let v = x.replace(/\D/g, '').slice(0, 2);
              if (v.length === 1 && +v > 3) v = '0' + v; // 5 → 05
              gunAyarla(v);
              if (v.length === 2) ayRef.current?.focus();
            }}
            placeholder="Gün"
            placeholderTextColor={R.soluk}
            keyboardType="number-pad"
            inputMode="numeric"
            maxLength={2}
            accessibilityLabel="Doğum günü"
            style={tarihStil(1)}
          />
          <TextInput
            ref={ayRef}
            value={ay}
            onChangeText={(x) => {
              let v = x.replace(/\D/g, '').slice(0, 2);
              if (v.length === 1 && +v > 1) v = '0' + v; // 3 → 03
              ayAyarla(v);
              if (v.length === 2) yilRef.current?.focus();
            }}
            onKeyPress={(o) => o.nativeEvent.key === 'Backspace' && !ay && gunRef.current?.focus()}
            placeholder="Ay"
            placeholderTextColor={R.soluk}
            keyboardType="number-pad"
            inputMode="numeric"
            maxLength={2}
            accessibilityLabel="Doğum ayı"
            style={tarihStil(1)}
          />
          <TextInput
            ref={yilRef}
            value={yil}
            onChangeText={(x) => yilAyarla(x.replace(/\D/g, '').slice(0, 4))}
            onKeyPress={(o) => o.nativeEvent.key === 'Backspace' && !yil && ayRef.current?.focus()}
            placeholder="Yıl"
            placeholderTextColor={R.soluk}
            keyboardType="number-pad"
            inputMode="numeric"
            maxLength={4}
            accessibilityLabel="Doğum yılı"
            style={tarihStil(1.5)}
          />
        </View>
        <Text style={[s.ipucu, { color: tarihSorunlu ? R.kalem : R.soluk }]}>{kucuk ? '18 yaşından küçükler katılamaz.' : tarihDolu && !t ? 'Doğum tarihini kontrol et.' : '18 yaşından büyük olmalısın; yalnız yaşını doğrulamak için.'}</Text>
      </View>
      {davetVar && (
        <View style={{ gap: 6 }}>
          <View style={[s.adGiris, { borderColor: R.cizgi, backgroundColor: R.ust }]}>
            <TextInput value={davet} onChangeText={(x) => davetAyarla(x.replace(/\s/g, '').slice(0, 20))} placeholder="Davet kodu" placeholderTextColor={R.soluk} autoCapitalize="characters" style={[s.adYazi, { color: R.murekkep }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]} />
          </View>
          <Text style={[s.ipucu, { color: R.soluk }]}>Şu an yalnız davetle açık. Kodu seni davet edenden al.</Text>
        </View>
      )}
      <SozKutulari zorunlu={zorunlu} zorunluAyarla={zorunluAyarla} hafiza={hafiza} hafizaAyarla={hafizaAyarla} durtme={durtme} durtmeAyarla={durtmeAyarla} />
      {!!hata && <Text style={[s.hata, { color: R.kalem }]}>{hata}</Text>}
      <Dugme yazi={bekliyor ? 'Bir saniye…' : 'Üyeliğimi tamamla'} tur="acik" devre={!hazir} onPress={kaydet} />
      {kapi && (
        <Bas onPress={() => C.cikis()} style={[s.simdiDegil, { alignSelf: 'center' }]}>
          <Text style={[s.simdiDegilYazi, { color: R.soluk }]}>Başka hesapla gir</Text>
        </Bas>
      )}
    </ScrollView>
  );
}

// Bildir: sebepler; ilk üçü anında gizler (sunucuda).
const SEBEPLER: [Sebep, string, string][] = [
  ['beni_anlatiyor', 'Beni ya da tanıdığımı anlatıyor', 'Hemen gizlenir'],
  ['kisisel_bilgi', 'Kişisel bilgi var', 'Ad soyad, numara, adres'],
  ['cocuk', 'Çocuk güvenliği', 'Hemen gizlenir'],
  ['hakaret', 'Hakaret ya da zorbalık', ''],
  ['spam', 'Reklam ya da spam', ''],
  ['uygunsuz', 'Rahatsız edici', ''],
];
function Bildir({ id }: { id: string }) {
  const R = useRenk();
  const c = useCanli();
  const [bitti, bittiAyarla] = useState(false);
  const [bekliyor, bekliyorAyarla] = useState<Sebep | null>(null);
  const [silOnay, silOnayAyarla] = useState(false);
  const [siliniyor, siliniyorAyarla] = useState(false);
  const g = c.harita[id];
  const benim = !!g && (g.benim || (!!c.uye && g.yazar.uid === c.uye.uid));
  const silGonder = async () => {
    siliniyorAyarla(true);
    const r = await C.sil(id, 'gonderi');
    siliniyorAyarla(false);
    if (!r.ok) return c.tost(C.hataYazisi(r.hata, r.durum));
    c.gizle(id);
    c.pencereKapat();
    c.tost('Gönderi silindi');
    if (c.ekran.tur === 'gonderi' && c.ekran.id === id) c.geri();
  };
  if (benim && silOnay)
    return (
      <View style={s.tesekkur}>
        <View style={[s.silIkon, { backgroundColor: R.gece ? 'rgba(255,92,108,0.14)' : 'rgba(215,38,61,0.08)' }]}>
          <Ikon ad="cop" boyut={26} renk={R.kalem} kalinlik={2.2} />
        </View>
        <Text style={[s.girisBaslik, { color: R.murekkep }]}>Gönderi silinsin mi?</Text>
        <Text style={[s.girisAlt, { color: R.soluk }]}>Geri alınamaz. Yorumları da kaybolur.</Text>
        <View style={{ flexDirection: 'row', gap: 10, alignSelf: 'stretch', marginTop: 12 }}>
          <Dugme yazi="Vazgeç" tur="cizgi" onPress={() => silOnayAyarla(false)} style={{ flex: 1 }} />
          <Dugme yazi={siliniyor ? 'Siliniyor…' : 'Sil'} devre={siliniyor} onPress={silGonder} style={{ flex: 1, backgroundColor: R.kalem, borderColor: R.kalem }} />
        </View>
      </View>
    );
  const gonder = async (sebep: Sebep) => {
    bekliyorAyarla(sebep);
    const r = await C.bildir(id, sebep);
    bekliyorAyarla(null);
    if (!r.ok && r.durum === 401) return c.girisIste('Bildirmek için giriş yap', () => gonder(sebep));
    if (!r.ok) return c.tost(C.hataYazisi(r.hata, r.durum));
    bittiAyarla(true);
    c.gizle(id);
  };
  if (bitti)
    return (
      <View style={s.tesekkur}>
        <YuzBalon ad="emin" boyut={64} />
        <Text style={[s.girisBaslik, { color: R.murekkep }]}>Teşekkürler.</Text>
        <Text style={[s.girisAlt, { color: R.soluk }]}>Bakıyoruz. Bu gönderiyi artık görmeyeceksin.</Text>
        <Dugme yazi="Tamam" onPress={c.pencereKapat} style={{ marginTop: 10, alignSelf: 'stretch' }} />
      </View>
    );
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 18 }}>
      {g && (
        <Bas onPress={() => { c.paylas(g); c.pencereKapat(); }} style={[s.sebep, { borderBottomColor: R.ince }]} hoverRenk={R.hover}>
          <Ikon ad="paylas" boyut={19} renk={R.murekkep} />
          <Text style={[s.sebepYazi, { color: R.murekkep }]}>Bağlantıyı paylaş</Text>
        </Bas>
      )}
      {benim && (
        <Bas onPress={() => silOnayAyarla(true)} style={[s.sebep, { borderBottomColor: R.ince }]} hoverRenk={R.hover}>
          <Ikon ad="cop" boyut={19} renk={R.kalem} />
          <Text style={[s.sebepYazi, { color: R.kalem }]}>Sil</Text>
        </Bas>
      )}
      {g && c.uye?.kurucu && (
        <KurucuSecenekleri
          hedef={{ tur: 'gonderi', id, sabit: !!g.sabit, korumali: benim || g.yazar.marka || !!g.yazar.kurucu }}
          bitti={(islem) => {
            c.pencereKapat();
            if (islem === 'one_cikar' || islem === 'one_kaldir') return c.guncelle(id, () => ({ sabit: islem === 'one_cikar' }));
            c.gizle(id);
            if (c.ekran.tur === 'gonderi' && c.ekran.id === id) c.geri();
          }}
        />
      )}
      {!benim && !c.uye?.kurucu && <Text style={[s.bildirBaslik, { color: R.soluk }]}>Bildir</Text>}
      {!benim && !c.uye?.kurucu && SEBEPLER.map(([k, ad, alt]) => (
        <Bas key={k} onPress={() => gonder(k)} devre={!!bekliyor} style={[s.sebep, { borderBottomColor: R.ince }]} hoverRenk={R.hover}>
          <Ikon ad="bayrak" boyut={18} renk={k === 'beni_anlatiyor' || k === 'cocuk' || k === 'kisisel_bilgi' ? R.kalem : R.soluk} />
          <View style={{ flex: 1 }}>
            <Text style={[s.sebepYazi, { color: R.murekkep }]}>{ad}</Text>
            {!!alt && <Text style={[s.sebepAlt, { color: R.soluk }]}>{alt}</Text>}
          </View>
          {bekliyor === k && <ActivityIndicator size="small" color={R.vurgu} />}
        </Bas>
      ))}
    </ScrollView>
  );
}

// --- Yeniden paylaş (#5) ---
// Paylaş menüsü: marka gönderisi/cevabı için "Akışımda paylaş" + "Bağlantıyı paylaş".
function PaylasMenu({ hedef }: { hedef: PaylasHedef }) {
  const R = useRenk();
  const c = useCanli();
  const sayi = hedef.tur === 'gonderi' ? hedef.g.yeniden : hedef.y.yeniden;
  const var_ = hedef.tur === 'gonderi' ? hedef.g.yenidenBen : hedef.y.yenidenBen;
  const baglanti = () => {
    c.pencereKapat();
    if (hedef.tur === 'gonderi') c.paylas(hedef.g);
    else c.paylas({ id: hedef.gonderiId, metin: hedef.y.metin } as Gonderi);
  };
  return (
    <View style={{ paddingBottom: 14 }}>
      <Bas onPress={() => c.yenidenAc(hedef)} etiket="Akışımda paylaş" style={[s.sebep, { borderBottomColor: R.ince }]} hoverRenk={R.hover}>
        <View style={[s.menuIkon, { backgroundColor: R.vurguYumusak }]}>
          <Ikon ad="yeniden" boyut={20} renk={R.vurgu} kalinlik={2.2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.sebepYazi, { color: R.murekkep }]}>{var_ ? 'Akışında paylaştın' : 'Akışımda paylaş'}</Text>
          <Text style={[s.sebepAlt, { color: R.soluk }]}>{var_ ? 'Bu içerik akışında zaten var' : 'Kendi adınla, istersen yorumunla'}{sayi ? ` · ${sayi} kişi paylaştı` : ''}</Text>
        </View>
        {var_ && <Ikon ad="tik" boyut={18} renk={R.yesil} kalinlik={2.8} />}
      </Bas>
      <Bas onPress={baglanti} etiket="Bağlantıyı paylaş" style={[s.sebep, { borderBottomColor: 'transparent' }]} hoverRenk={R.hover}>
        <View style={[s.menuIkon, { backgroundColor: R.gece ? 'rgba(255,255,255,0.06)' : 'rgba(29,24,48,0.05)' }]}>
          <Ikon ad="paylas" boyut={19} renk={R.murekkep} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.sebepYazi, { color: R.murekkep }]}>Bağlantıyı paylaş</Text>
          <Text style={[s.sebepAlt, { color: R.soluk }]}>Başka uygulamada gönder</Text>
        </View>
      </Bas>
    </View>
  );
}

// Yeniden paylaşım penceresi: isteğe bağlı kısa yorum (karakter halkası) + gömülü orijinal kart. Yorum varsa herkese açılmadan önce denetlenir.
function YenidenYazici({ hedef }: { hedef: PaylasHedef }) {
  const R = useRenk();
  const c = useCanli();
  const { width } = useWindowDimensions();
  const [metin, metinAyarla] = useState('');
  const [bekliyor, bekliyorAyarla] = useState(false);
  const [hata, hataAyarla] = useState('');
  const eng = useEngel(metin, 'gonderi');
  const kilit = useRef(false);
  const uzunluk = harfSay(metin);
  const kalan = C.YENIDEN_SINIR - uzunluk;
  const hedefId = hedef.tur === 'gonderi' ? hedef.g.id : hedef.y.id;
  // Pencerede gösterilen gömülü kart: sunucudaki gibi 'Alinti' biçimi, bellekteki karttan kurulur.
  const alinti: Alinti =
    hedef.tur === 'gonderi'
      ? { durum: 'var', tur: 'gonderi', id: hedef.g.id, gonderi: hedef.g.id, yazar: hedef.g.yazar, zaman: hedef.g.zaman, icerik: hedef.g }
      : { durum: 'var', tur: 'yorum', id: hedef.y.id, gonderi: hedef.gonderiId, yazar: hedef.y.yazar, zaman: hedef.y.zaman, icerik: { id: hedef.y.id, tur: 'metin', yazar: hedef.y.yazar, zaman: hedef.y.zaman, metin: hedef.y.metin, begeni: 0, yorum: 0, begendim: false }, ...(hedef.y.yanitAd ? { yanitAd: hedef.y.yanitAd } : {}) };
  const paylas = async () => {
    if (kilit.current) return;
    if (kalan < 0) return hataAyarla(`En çok ${C.YENIDEN_SINIR} harf.`);
    kilit.current = true;
    bekliyorAyarla(true);
    hataAyarla('');
    const m = metin.trim();
    const r = await C.yenidenPaylas(hedefId, hedef.tur, m);
    bekliyorAyarla(false);
    kilit.current = false;
    if (!r.ok) {
      if (r.hata === 'zaten_var') {
        c.pencereKapat();
        return c.tost('Akışında zaten var');
      }
      if (r.durum === 401) return c.girisIste('Akışında paylaşmak için giriş yap');
      if (eng.koy(r, m)) return;
      return hataAyarla(C.hataYazisi(r.hata, r.durum));
    }
    c.pencereKapat();
    // Orijinalde sayaç ve "paylaştım" işareti hemen güncellenir (yorumlu paylaşım denetimden sonra herkese açılır, ama sayı iyimser artar).
    if (hedef.tur === 'gonderi') c.guncelle(hedef.g.id, (x) => ({ yeniden: (x.yeniden ?? 0) + 1, yenidenBen: true }));
    hedef.sonra?.();
    c.yeniGonderiAyarla({ ...r.veri.gonderi, inceleniyor: !!m });
    gorevBildir('balon', c.uye?.uid); // günün görevi (SagKose)
    c.tost(m ? 'Akışında paylaşıldı · yorumun inceleniyor' : 'Akışında paylaştın');
  };
  const masa = width >= 760;
  return (
    <View style={s.yazici}>
      <View style={s.yaziciUst}>
        <View style={s.yaziciYan}>
          <Bas onPress={c.pencereKapat} style={s.vazgec}>
            <Text style={[s.vazgecYazi, { color: R.soluk }]}>Vazgeç</Text>
          </Bas>
        </View>
        <Text style={[s.yaziciBaslik, { color: R.murekkep }]}>Akışında paylaş</Text>
        <View style={[s.yaziciYan, s.yaziciSag]}>
          <Dugme yazi={bekliyor ? 'Paylaşılıyor…' : 'Paylaş'} tur="acik" kucuk devre={kalan < 0 || bekliyor} onPress={paylas} style={{ minWidth: 84 }} />
        </View>
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 520 }}>
        <View style={[s.yaziciGovde, { borderColor: 'transparent', paddingBottom: 10 }]}>
          {c.uye && <Avatar yazar={{ uid: c.uye.uid, ad: c.uye.ad, marka: false, yuz: c.uye.yuz, kurucu: c.uye.kurucu, balon: c.uye.balon }} boyut={42} />}
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[s.yaziciAd, { color: R.murekkep }]}>{c.uye?.ad}</Text>
            <TextInput
              value={metin}
              onChangeText={(t) => metinAyarla(t.replace(/\n/g, ' ').slice(0, C.YENIDEN_SINIR + 30))}
              placeholder="Bir şey ekle… (isteğe bağlı)"
              placeholderTextColor={R.soluk}
              multiline
              autoFocus={masa}
              style={[s.yaziciGiris, { minHeight: 58, fontSize: 17 }, { color: R.murekkep }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
            />
            <EngelAlani engel={eng.engel} ipucu={eng.ipucu} />
          </View>
        </View>
        <View style={{ paddingHorizontal: 18, paddingBottom: 6 }}>
          <AlintiKart a={alinti} onizleme />
        </View>
      </ScrollView>
      <View style={s.yaziciAlt}>
        <Text style={[s.kuralKisa, { color: R.soluk }]}>Herkes görür · eklediğin yorum da kurallara tabi</Text>
        <View style={{ minHeight: 26, justifyContent: 'center' }}>{!!metin && <KarakterHalkasi uzunluk={uzunluk} sinir={C.YENIDEN_SINIR} />}</View>
      </View>
      {!!hata && <Text style={[s.hata, { color: R.kalem, paddingHorizontal: 20, paddingBottom: 14 }]}>{hata}</Text>}
    </View>
  );
}

// Yeni gönderi (≤280).
const SINIR = 280;
function Yazici() {
  const R = useRenk();
  const c = useCanli();
  const [metin, metinAyarla] = useState('');
  const [bekliyor, bekliyorAyarla] = useState(false);
  const [hata, hataAyarla] = useState('');
  const [foto, fotoAyarla] = useState<HazirFoto | null>(null);
  const [fotoHazir, fotoHazirAyarla] = useState(false);
  const [girisBoy, girisBoyAyarla] = useState(0);
  const eng = useEngel(metin, 'gonderi');
  const uzunluk = harfSay(metin);
  const kalan = SINIR - uzunluk;
  const fotoEkle = async () => {
    if (!FOTO_VAR) return c.tost('Fotoğraf eklemek şimdilik yalnız sitede.');
    fotoHazirAyarla(true);
    const f = await fotoSec();
    fotoHazirAyarla(false);
    if (!f) return;
    if ('hata' in f) return hataAyarla(f.hata);
    hataAyarla('');
    fotoAyarla(f);
  };
  const kilit = useRef(false); // çift gönderim kilidi (07.10)
  const paylas = async () => {
    const m = metin.trim();
    if ((!m && !foto) || kilit.current) return;
    if (kalan < 0) return hataAyarla(`En çok ${SINIR} harf.`);
    kilit.current = true;
    bekliyorAyarla(true);
    hataAyarla('');
    const r = await C.gonderiPaylas(m, foto ? { veri: foto.veri, en: foto.en, boy: foto.boy } : null);
    bekliyorAyarla(false);
    kilit.current = false;
    if (!r.ok) {
      if (r.hata === 'tekrar') return c.pencereKapat();
      if (r.durum === 401) return c.girisIste('Paylaşmak için giriş yap', c.yaziciAc);
      if (eng.koy(r, m)) return;
      return hataAyarla(C.hataYazisi(r.hata, r.durum));
    }
    c.pencereKapat();
    if (c.ekran.tur !== 'akis') c.git({ tur: 'akis' });
    c.yeniGonderiAyarla({ ...r.veri, inceleniyor: true });
    gorevBildir('balon', c.uye?.uid); // günün görevi (SagKose)
    c.tost('Gönderin inceleniyor · birazdan herkeste');
  };
  // 08.10 (Yaz düğmesi kurgu a): SADE paylaşım sayfası — yazı + fotoğraf; günün sorusu, hazır cümle, karakter yok
  // (plan/25_YAZ_DUGMESI motor.js YZ.sadeYazici).
  const paylasDugme = <Dugme yazi={bekliyor ? (foto ? 'Yükleniyor…' : 'Gönderiliyor…') : 'Paylaş'} tur="acik" kucuk devre={(!metin.trim() && !foto) || kalan < 0 || bekliyor} onPress={paylas} style={{ minWidth: 84 }} />;
  return (
    <View style={s.yazici}>
      <View style={s.yaziciUst}>
        <View style={s.yaziciYan}>
          <Bas onPress={c.pencereKapat} style={s.vazgec}>
            <Text style={[s.vazgecYazi, { color: R.soluk }]}>Vazgeç</Text>
          </Bas>
        </View>
        <Text style={[s.yaziciBaslik, { color: R.murekkep }]}>Yeni paylaşım</Text>
        {/* 08.10: karakter halkası Paylaş'ın yanında (eski Yazıcı'daki halka geri geldi). */}
        <View style={[s.yaziciYan, s.yaziciSag]}>
          <KarakterHalkasi uzunluk={uzunluk} sinir={SINIR} />
          {paylasDugme}
        </View>
      </View>
      <View style={[s.yaziciGovde, { borderColor: R.ince }]}>
        {c.uye && <Avatar yazar={{ uid: c.uye.uid, ad: c.uye.ad, marka: false, yuz: c.uye.yuz, kurucu: c.uye.kurucu, balon: c.uye.balon }} boyut={42} />}
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[s.yaziciAd, { color: R.murekkep }]}>{c.uye?.ad}</Text>
          <Text aria-hidden pointerEvents="none" onLayout={(e) => girisBoyAyarla(Math.ceil(e.nativeEvent.layout.height))} style={[s.yaziciGiris, s.ayna]}>{`${metin || ' '}​`}</Text>
          <TextInput
            value={metin}
            onChangeText={(t) => metinAyarla(t.slice(0, SINIR + 40))}
            placeholder={foto ? 'Bir şey ekle… (isteğe bağlı)' : 'Bir şey yaz…'}
            placeholderTextColor={R.soluk}
            multiline
            autoFocus
            style={[s.yaziciGiris, { color: R.murekkep }, foto && { minHeight: 52, height: Math.min(200, Math.max(52, girisBoy)) }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
          />
          <EtiketOneri metin={metin} ayarla={(t) => metinAyarla(t.slice(0, SINIR + 40))} />
          <EngelAlani engel={eng.engel} ipucu={eng.ipucu} />
          {foto && (
            <View style={[s.onizleme, { borderColor: R.ince, backgroundColor: R.ust, aspectRatio: Math.max(0.8, foto.en / foto.boy) }]}>
              <Image source={{ uri: foto.onizleme }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              <Bas onPress={() => fotoAyarla(null)} etiket="Fotoğrafı kaldır" style={s.onizlemeSil}>
                <Ikon ad="kapat" boyut={16} renk="#fff" kalinlik={2.6} />
              </Bas>
              <View style={s.onizlemeNot}>
                <Text style={s.onizlemeNotYazi}>konum ve cihaz bilgisi silindi · {(foto.bayt / 1024 / 1024).toFixed(1).replace('.', ',')} MB</Text>
              </View>
            </View>
          )}
        </View>
      </View>
      {!foto && (
        <View style={s.fotoSira}>
          <Bas onPress={fotoEkle} devre={fotoHazir} etiket="Fotoğraf ekle" style={[s.fotoEkle, { borderColor: R.cizgi, backgroundColor: R.vurguYumusak }]} hoverRenk={R.vurguYumusak}>
            {fotoHazir ? <ActivityIndicator size="small" color={R.vurgu} /> : <Ikon ad="resim" boyut={22} renk={R.vurgu} kalinlik={1.9} />}
            <Text style={[s.fotoEkleYazi, { color: R.vurgu }]}>Fotoğraf ekle</Text>
          </Bas>
        </View>
      )}
      <View style={s.yaziciAlt}>
        <Text style={[s.kuralKisa, { color: R.soluk }]}>Herkes görür · kimseyi ifşa etme · siyaset yok</Text>
      </View>
      {!!hata && <Text style={[s.hata, { color: R.kalem, paddingHorizontal: 20, paddingBottom: 14 }]}>{hata}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  giris: { alignItems: 'center', gap: 6, paddingHorizontal: 26, paddingTop: 26, paddingBottom: 18 },
  girisYuzler: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 6 },
  girisBaslik: { fontFamily: yazi.kalin, fontSize: 23, letterSpacing: -0.5, textAlign: 'center' },
  girisAlt: { fontFamily: yazi.normal, fontSize: 15, textAlign: 'center' },
  googleYakinda: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderRadius: 999, paddingVertical: 11, paddingHorizontal: 20, opacity: 0.8, borderStyle: 'dashed' },
  googleG: { fontFamily: yazi.kalin, fontSize: 17 },
  googleYazi: { fontFamily: yazi.orta, fontSize: 15 },
  testBag: { fontFamily: yazi.orta, fontSize: 13, textDecorationLine: 'underline' },
  testGiris: { flex: 1, borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, fontFamily: yazi.normal, fontSize: 15 },
  hata: { fontFamily: yazi.orta, fontSize: 14, textAlign: 'center' },
  yasal: { fontFamily: yazi.normal, fontSize: 12.5, textAlign: 'center', lineHeight: 18, marginTop: 12 },
  veya: { flexDirection: 'row', alignItems: 'center', gap: 12, alignSelf: 'stretch', paddingHorizontal: 24, marginTop: 2 },
  veyaCizgi: { flex: 1, height: 1 },
  veyaYazi: { fontFamily: yazi.orta, fontSize: 13 },
  simdiDegil: { paddingVertical: 10, paddingHorizontal: 16, marginTop: 2 },
  simdiDegilYazi: { fontFamily: yazi.orta, fontSize: 14.5 },
  ad: { padding: 24, gap: 16 },
  adGiris: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 14, gap: 4 },
  et: { fontFamily: yazi.kalin, fontSize: 17 },
  adYazi: { flex: 1, fontFamily: yazi.orta, fontSize: 17, paddingVertical: 13 },
  ipucu: { fontFamily: yazi.normal, fontSize: 12.5, paddingHorizontal: 6 },
  kutuSatir: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  kutu: { width: 24, height: 24, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  kutuYazi: { fontFamily: yazi.orta, fontSize: 15.5 },
  kural: { fontFamily: yazi.normal, fontSize: 13, marginTop: 2, lineHeight: 19 },
  blok: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 13, gap: 11 },
  blokBaslik: { fontFamily: yazi.kalin, fontSize: 11.5, letterSpacing: 0.9 },
  blokAyrac: { height: 1 },
  alanEtiket: { fontFamily: yazi.orta, fontSize: 13, paddingHorizontal: 6 },
  tarihSira: { flexDirection: 'row', gap: 8 },
  tarihGiris: { borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 13, fontFamily: yazi.orta, fontSize: 17, textAlign: 'center' },
  tesekkur: { alignItems: 'center', gap: 6, padding: 26 },
  silIkon: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  bildirBaslik: { fontFamily: yazi.kalin, fontSize: 13, paddingHorizontal: 22, paddingTop: 16, paddingBottom: 4 },
  sebep: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 22, paddingVertical: 14, borderBottomWidth: 1 },
  menuIkon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  sebepYazi: { fontFamily: yazi.orta, fontSize: 15.5 },
  sebepAlt: { fontFamily: yazi.normal, fontSize: 12.5, marginTop: 1 },
  yazici: { paddingBottom: 6 },
  yaziciUst: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10 },
  yaziciYan: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  yaziciSag: { justifyContent: 'flex-end', gap: 10 },
  vazgec: { paddingVertical: 8, paddingHorizontal: 8, alignSelf: 'flex-start' },
  vazgecYazi: { fontFamily: yazi.orta, fontSize: 15 },
  yaziciBaslik: { fontFamily: yazi.kalin, fontSize: 16.5 },
  yaziciGovde: { flexDirection: 'row', gap: 12, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 16, borderBottomWidth: 1 },
  yaziciAd: { fontFamily: yazi.kalin, fontSize: 15.5 },
  yaziciGiris: { fontFamily: yazi.normal, fontSize: 18, lineHeight: 25, minHeight: 130, textAlignVertical: 'top' },
  ayna: { position: 'absolute', left: 0, right: 0, top: 0, minHeight: 0, opacity: 0 },
  yaziciAlt: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 12, gap: 12 },
  kuralKisa: { fontFamily: yazi.normal, fontSize: 13, flexShrink: 1 },
  fotoDugme: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  fotoSira: { paddingHorizontal: 18, paddingTop: 12 },
  fotoEkle: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'flex-start', height: 48, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed' },
  fotoEkleYazi: { fontFamily: yazi.kalin, fontSize: 14.5 },
  onizleme: { width: '100%', maxHeight: 300, borderRadius: 18, borderWidth: 1, overflow: 'hidden', marginTop: 4 },
  onizlemeSil: { position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(10,8,20,0.62)', alignItems: 'center', justifyContent: 'center' },
  onizlemeNot: { position: 'absolute', left: 10, bottom: 10, borderRadius: 999, backgroundColor: 'rgba(10,8,20,0.55)', paddingHorizontal: 10, paddingVertical: 4 },
  onizlemeNotYazi: { color: '#fff', fontFamily: yazi.orta, fontSize: 11.5 },
});
