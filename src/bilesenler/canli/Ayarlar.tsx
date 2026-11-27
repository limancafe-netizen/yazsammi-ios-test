// Ayarlar (Profil → ayar düğmesi): takma ad değiştirme (30 günde bir), mesaj ayarları, "Yazsam mı? beni hatırlasın" + hafızamı sil, engellenenler,
// kurallar ve yasal sayfalar, çıkış, hesabımı sil (onaylı). Sunucu: uyum.mjs (/c/hesap, /c/ad/degistir, /c/engellenenler, /c/engel/kaldir, /c/hesap/sil),
// mesaj.mjs (/c/ayar; hatirla dahil), hafiza.mjs (/c/hafiza/sil).
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { yazi } from '@/tema/tema';
import * as C from '@/canli';
import { APPLE_YEREL, appleSilmeKodu } from '@/appleGiris';
import * as StoreReview from 'expo-store-review';
import { depoOku, depoYaz } from '@/depo';
import { istekKaydet, kayitCoz } from '@/puanMantik';
import { puanSatiriGorunur, uygulamaAdresi } from '@/uygulamaBaglanti';
import type { Engellenen, HesapBilgi, MesajAyar } from '@/canli';
import { Avatar, Bas, Dugme, Ikon, useRenk } from './ortak';
import { useCanli } from './baglam';
import { UstBaslik } from './Duzen';
import { SilDogrulama } from './EpostaGiris';
import { bildirimSesi, bildirimSesiAcik, bildirimSesiAyarla } from '@/bildirimSesi';
import { BildirimAyarlari } from '@/bildirim/Ayar';
import { olcumAyarla, olcumTercihi } from '@/analiz';

const AD_KALIP = /^[a-zA-Z0-9_çğıöşüÇĞİÖŞÜ]{3,20}$/;
const tarihYaz = (ms: number) => new Date(ms).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });

function sayfaAc(yol: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.open(`${window.location.origin}${yol}`, '_blank', 'noopener');
    return;
  }
  Linking.openURL(`https://yazsammi.com${yol}`).catch(() => {});
}

// 1.9.0: "Uygulamaya puan ver" — YALNIZ sistem kartı (expo-store-review). Ön soru/süzme, ödül, kendi kartımız yok; sunucuya bir şey gitmez.
async function puanVer(tost: (m: string) => void) {
  try {
    depoYaz('yazsammi_puan_v1', JSON.stringify(istekKaydet(kayitCoz(depoOku('yazsammi_puan_v1')), Date.now())));
    if (!(await StoreReview.isAvailableAsync())) return tost('Puan penceresi şu an açılamadı.');
    await StoreReview.requestReview();
  } catch {
    tost('Puan penceresi şu an açılamadı.');
  }
}

export function Ayarlar({ geri }: { geri?: () => void }) {
  const R = useRenk();
  const c = useCanli();
  const [hesap, hesapAyarla] = useState<HesapBilgi | null>(null);
  const [ayar, ayarAyarla] = useState<MesajAyar | null>(null);
  const [ayarYok, ayarYokAyarla] = useState(false);
  const [engelli, engelliAyarla] = useState<Engellenen[] | null>(null);
  const [adAcik, adAcikAyarla] = useState(false);
  const [yeniAd, yeniAdAyarla] = useState('');
  const [adHata, adHataAyarla] = useState('');
  const [bekliyor, bekliyorAyarla] = useState(false);
  const [silAsama, silAsamaAyarla] = useState<0 | 1 | 2>(0); // 0 kapalı · 1 silme onayı · 2 önce e-posta yeniden doğrulama (yalnız e-posta üyeleri)
  const [silKontrol, silKontrolAyarla] = useState(false);
  const [hepsiAsama, hepsiAsamaAyarla] = useState<0 | 1>(0); // "Tüm cihazlardan çık" onay sorusu
  const [hepsiBekle, hepsiBekleAyarla] = useState(false);
  const [siliniyor, siliniyorAyarla] = useState(false);
  const [hafizaBekle, hafizaBekleAyarla] = useState(false);
  const [ses, sesAyarla] = useState(bildirimSesiAcik); // cihazda saklanır
  const [olcum, olcumAyarla2] = useState(() => olcumTercihi() === 'evet'); // Hukuk kararı (OLCUM_IZNI_KARAR.md): izni sonradan geri alma yolu

  useEffect(() => {
    if (!c.uye || c.uye.yeni) return;
    C.hesapGetir().then((r) => r.ok && hesapAyarla(r.veri));
    C.ayarGetir().then((r) => (r.ok ? ayarAyarla(r.veri) : ayarYokAyarla(true)));
    C.engellenenlerGetir().then((r) => engelliAyarla(r.ok ? r.veri : []));
  }, [c.uye?.uid]);

  const cik = () => {
    C.cikis();
    c.uyeAyarla(null);
    c.tost('Çıkış yapıldı');
    c.git({ tur: 'akis' });
  };
  const ayarDegis = async (d: Partial<MesajAyar>) => {
    if (!ayar) return;
    const once = ayar;
    ayarAyarla({ ...ayar, ...d });
    const r = await C.ayarKaydet(d);
    if (!r.ok) {
      ayarAyarla(once);
      return c.tost(C.hataYazisi(r.hata, r.durum));
    }
    ayarAyarla(r.veri);
  };
  const adKaydet = async () => {
    if (!AD_KALIP.test(yeniAd) || bekliyor) return;
    bekliyorAyarla(true);
    adHataAyarla('');
    const r = await C.adDegistir(yeniAd);
    bekliyorAyarla(false);
    if (!r.ok) return adHataAyarla(C.hataYazisi(r.hata, r.durum));
    c.uyeAyarla(r.veri);
    adAcikAyarla(false);
    hesapAyarla((h) => (h ? { ...h, adSonraki: Date.now() + 30 * 86400000 } : h));
    c.tost(`Artık @${r.veri.ad}`);
  };
  // "Hesabımı sil": e-posta üyesi son 10 dk içinde bağlantıyla doğrulamadıysa önce doğrulama; Google/Apple üyelerinde (gerekli=false) doğrudan onay.
  const silmeyeBasla = async () => {
    if (silKontrol) return;
    silKontrolAyarla(true);
    const r = await C.hesapDogrulama();
    silKontrolAyarla(false);
    silAsamaAyarla(r.ok && r.veri.gerekli && !r.veri.tamam ? 2 : 1);
  };
  const hepsindenCik = async () => {
    if (hepsiBekle) return;
    hepsiBekleAyarla(true);
    const r = await C.oturumHepsiniKapat();
    hepsiBekleAyarla(false);
    hepsiAsamaAyarla(0);
    c.tost(r.ok ? 'Diğer cihazlardaki oturumlar kapandı' : C.hataYazisi(r.hata, r.durum));
  };
  const hafizamiSil = async () => {
    if (hafizaBekle) return;
    hafizaBekleAyarla(true);
    const r = await C.hafizaSil();
    hafizaBekleAyarla(false);
    c.tost(r.ok ? 'Hafızan silindi. Yazsam mı? seni yeniden tanıyacak.' : C.hataYazisi(r.hata, r.durum));
  };
  const engelKaldir = async (e: Engellenen) => {
    const r = await C.engelKaldir(e.sohbet);
    if (!r.ok) return c.tost(C.hataYazisi(r.hata, r.durum));
    engelliAyarla((l) => (l ? l.filter((x) => x.sohbet !== e.sohbet) : l));
    c.tost(`${e.kisi.ad} engeli kaldırıldı`);
  };
  const hesabiSil = async () => {
    siliniyorAyarla(true);
    // Apple ile açılmış hesap (uid "a…", yalnız iOS): Apple bir kez daha onay ister, dönen kodla sunucu Apple girişini de iptal eder.
    const appleKod = APPLE_YEREL && c.uye?.uid.startsWith('a') ? await appleSilmeKodu() : undefined;
    const r = await C.hesapSil(appleKod);
    siliniyorAyarla(false);
    if (!r.ok && r.hata === 'yeniden_dogrula') return silAsamaAyarla(2); // doğrulama süresi dolmuş: yeniden iste
    if (!r.ok) return c.tost(C.hataYazisi(r.hata, r.durum));
    c.uyeAyarla(null);
    c.tost('Hesabın ve içeriklerin silindi');
    c.git({ tur: 'akis' });
  };

  if (!c.uye || c.uye.yeni) {
    return (
      <View style={{ flex: 1 }}>
        <UstBaslik baslik="Ayarlar" geri={geri} />
        <View style={s.bos}>
          <Text style={[s.alt, { color: R.soluk, textAlign: 'center' }]}>Ayarlar için giriş yap.</Text>
          <Dugme yazi="Giriş yap" tur="acik" onPress={() => c.girisIste('Ayarlar için giriş yap')} />
        </View>
      </View>
    );
  }

  const Bolum = ({ baslik }: { baslik: string }) => <Text style={[s.bolum, { color: R.soluk }]}>{baslik}</Text>;
  const Satir = ({ ikon, baslik, alt, onPress, renk }: { ikon: Parameters<typeof Ikon>[0]['ad']; baslik: string; alt?: string; onPress: () => void; renk?: string }) => (
    <Bas onPress={onPress} style={s.satir} hoverRenk={R.hover} etiket={baslik}>
      <Ikon ad={ikon} boyut={20} renk={renk ?? R.soluk} />
      <View style={{ flex: 1 }}>
        <Text style={[s.baslik, { color: renk ?? R.murekkep }]}>{baslik}</Text>
        {!!alt && <Text style={[s.alt, { color: R.soluk }]}>{alt}</Text>}
      </View>
      <Ikon ad="ok" boyut={16} renk={R.cizgi} />
    </Bas>
  );
  const Secim = ({ acik, baslik, alt, onPress }: { acik: boolean; baslik: string; alt: string; onPress: () => void }) => (
    <Bas onPress={onPress} style={[s.secim, { borderColor: acik ? R.vurgu : R.ince, backgroundColor: acik ? R.vurguYumusak : 'transparent' }]} etiket={baslik}>
      <View style={[s.radyo, { borderColor: acik ? R.vurgu : R.cizgi }]}>{acik && <View style={[s.radyoIc, { backgroundColor: R.vurgu }]} />}</View>
      <View style={{ flex: 1 }}>
        <Text style={[s.baslik, { color: R.murekkep }]}>{baslik}</Text>
        <Text style={[s.alt, { color: R.soluk }]}>{alt}</Text>
      </View>
    </Bas>
  );
  const adBekle = hesap?.adSonraki && hesap.adSonraki > Date.now() ? hesap.adSonraki : null;
  const ayrac = <View style={[s.ayrac, { backgroundColor: R.ince }]} />;
  const Anahtar = ({ acik, baslik, alt, onPress }: { acik: boolean; baslik: string; alt: string; onPress: () => void }) => (
    <Bas onPress={onPress} style={s.anahtarSatir} etiket={baslik}>
      <View style={{ flex: 1 }}>
        <Text style={[s.baslik, { color: R.murekkep }]}>{baslik}</Text>
        <Text style={[s.alt, { color: R.soluk }]}>{alt}</Text>
      </View>
      <View style={[s.anahtar, { backgroundColor: acik ? R.vurgu : R.cizgi }]}>
        <View style={[s.anahtarTop, { transform: [{ translateX: acik ? 20 : 0 }] }]} />
      </View>
    </Bas>
  );

  return (
    <View style={{ flex: 1 }}>
      <UstBaslik baslik="Ayarlar" geri={geri} />
      <ScrollView contentContainerStyle={s.icerik} keyboardShouldPersistTaps="handled">
        {hesap?.susturma ? <Text style={[s.uyari, { color: R.kalem, borderColor: R.kalem }]}>Kurallar nedeniyle {tarihYaz(hesap.susturma)} tarihine kadar yazamazsın.</Text> : null}

        <Bolum baslik="Hesap" />
        <View style={s.hesap}>
          <Avatar yazar={{ uid: c.uye.uid, ad: c.uye.ad, marka: false, yuz: c.uye.yuz, kurucu: c.uye.kurucu, balon: c.uye.balon }} boyut={44} />
          <View style={{ flex: 1 }}>
            <Text style={[s.baslik, { color: R.murekkep }]}>@{c.uye.ad}</Text>
            <Text style={[s.alt, { color: R.soluk }]}>{adBekle ? `Takma adını ${tarihYaz(adBekle)} sonrası değiştirebilirsin.` : 'Takma adını 30 günde bir değiştirebilirsin.'}</Text>
          </View>
          {!adBekle && !adAcik && <Dugme yazi="Değiştir" kucuk tur="cizgi" onPress={() => { yeniAdAyarla(c.uye?.ad ?? ''); adAcikAyarla(true); }} />}
        </View>
        {!!hesap?.eposta && (
          <View style={s.hesap}>
            <View style={[s.epostaIkon, { backgroundColor: R.vurguYumusak }]}>
              <Ikon ad="mesaj" boyut={20} renk={R.vurgu} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.baslik, { color: R.murekkep }]}>{hesap.eposta}</Text>
              <Text style={[s.alt, { color: R.soluk }]}>Giriş e-postan. Yalnız giriş bağlantısı için saklanır.</Text>
            </View>
          </View>
        )}
        {adAcik && (
          <View style={{ gap: 8, paddingHorizontal: 16, paddingBottom: 8 }}>
            <View style={[s.giris, { borderColor: yeniAd && !AD_KALIP.test(yeniAd) ? R.kalem : R.cizgi, backgroundColor: R.ust }]}>
              <Text style={[s.baslik, { color: R.soluk }]}>@</Text>
              <TextInput value={yeniAd} onChangeText={(t) => yeniAdAyarla(t.replace(/\s/g, '').slice(0, 20))} autoCapitalize="none" autoFocus placeholder="yeni_ad" placeholderTextColor={R.soluk} style={[s.girisYazi, { color: R.murekkep }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]} />
            </View>
            <Text style={[s.alt, { color: adHata ? R.kalem : R.soluk }]}>{adHata || '3–20 harf, rakam ya da _. Sonraki değişiklik 30 gün sonra.'}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Dugme yazi={bekliyor ? 'Bir saniye…' : 'Kaydet'} kucuk tur="acik" devre={!AD_KALIP.test(yeniAd) || bekliyor || yeniAd === c.uye.ad} onPress={adKaydet} />
              <Dugme yazi="Vazgeç" kucuk tur="cizgi" onPress={() => { adAcikAyarla(false); adHataAyarla(''); }} />
            </View>
          </View>
        )}
        {ayrac}

        <Bolum baslik="Mesaj al" />
        {!ayar && ayarYok ? (
          <Text style={[s.alt, { color: R.soluk, paddingHorizontal: 16 }]}>Şu an yüklenemedi. Biraz sonra tekrar dene.</Text>
        ) : !ayar ? (
          <ActivityIndicator style={{ marginVertical: 16 }} color={R.vurgu} />
        ) : (
          <View style={{ gap: 8, paddingHorizontal: 16 }}>
            <Secim acik={ayar.mesajAl === 'takip'} baslik="Karşılıklı takip" alt="Birbirinizi takip ediyorsanız istek gönderebilir." onPress={() => ayarDegis({ mesajAl: 'takip' })} />
            <Secim acik={ayar.mesajAl === 'kimse'} baslik="Kimseden" alt="Yeni istek gelmez. Açık sohbetler sürer." onPress={() => ayarDegis({ mesajAl: 'kimse' })} />
            <Bas onPress={() => ayarDegis({ okunduGoster: !ayar.okunduGoster })} style={s.anahtarSatir} etiket="Okundu bilgisi">
              <View style={{ flex: 1 }}>
                <Text style={[s.baslik, { color: R.murekkep }]}>Okundu bilgisi</Text>
                <Text style={[s.alt, { color: R.soluk }]}>Kapatırsan sen de başkalarınınkini göremezsin.</Text>
              </View>
              <View style={[s.anahtar, { backgroundColor: ayar.okunduGoster ? R.vurgu : R.cizgi }]}>
                <View style={[s.anahtarTop, { transform: [{ translateX: ayar.okunduGoster ? 20 : 0 }] }]} />
              </View>
            </Bas>
          </View>
        )}
        {ayrac}

        <Bolum baslik="Yazsam mı? hesabı" />
        {ayar ? (
          <View style={{ gap: 4, paddingHorizontal: 16 }}>
            <Bas onPress={() => ayarDegis({ hatirla: !ayar.hatirla })} style={s.anahtarSatir} etiket="Figürüm beni tanısın ve hatırlasın">
              <View style={{ flex: 1 }}>
                <Text style={[s.baslik, { color: R.murekkep }]}>Figürüm beni tanısın ve hatırlasın</Text>
                <Text style={[s.alt, { color: R.soluk }]}>Figürler sohbette kendi söylediklerinden (hitap, ilgi alanları gibi) kısa notlar tutar, sonraki sohbetlerde seni hatırlar. Zorunlu değil; kapatırsan notlar silinir, yenisi tutulmaz. <Text style={{ color: R.vurgu }} onPress={() => sayfaAc('/acik-riza')}>Ne saklanır?</Text></Text>
              </View>
              <View style={[s.anahtar, { backgroundColor: ayar.hatirla ? R.vurgu : R.cizgi }]}>
                <View style={[s.anahtarTop, { transform: [{ translateX: ayar.hatirla ? 20 : 0 }] }]} />
              </View>
            </Bas>
            <Anahtar acik={ayar.markaYazsin} baslik="Yazsam mı? bana yazabilir" alt="Birkaç gün uğramazsan Mesajlar'a kısa bir not bırakır (haftada en çok bir). Kapatırsan kendiliğinden yazmaz; sen yazınca yine cevap verir." onPress={() => ayarDegis({ markaYazsin: !ayar.markaYazsin })} />
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              <Dugme yazi="Yazsam mı? ile yaz" kucuk tur="acik" ikon="mesaj" onPress={() => c.git({ tur: 'sohbet', id: C.MARKA_SOHBET })} />
              <Dugme yazi={hafizaBekle ? 'Siliniyor…' : 'Hafızamı sil'} kucuk tur="cizgi" devre={hafizaBekle} onPress={hafizamiSil} />
            </View>
          </View>
        ) : (
          <ActivityIndicator style={{ marginVertical: 16 }} color={R.vurgu} />
        )}
        {ayrac}

        <Bolum baslik="Bildirimler" />
        <View style={{ paddingHorizontal: 16 }}>
          <Anahtar
            acik={ses}
            baslik="Bildirim sesi"
            alt={Platform.OS === 'web' ? 'Sayfa açıkken yeni bildirim ya da mesaj gelince kısa, yumuşak bir ses.' : 'Uygulama açıkken yeni bildirim ya da mesaj gelince kısa, yumuşak bir ses ve hafif titreşim.'}
            onPress={() => {
              const yeni = !ses;
              bildirimSesiAyarla(yeni);
              sesAyarla(yeni);
              if (yeni) setTimeout(bildirimSesi, 50); // nasıl duyulduğunu hemen duy
            }}
          />
          <BildirimAyarlari />
        </View>
        {ayrac}

        <Bolum baslik="Engellenenler" />
        {!engelli ? (
          <ActivityIndicator style={{ marginVertical: 16 }} color={R.vurgu} />
        ) : engelli.length === 0 ? (
          <Text style={[s.alt, { color: R.soluk, paddingHorizontal: 16, paddingBottom: 6 }]}>Kimseyi engellemedin. Engellemek için sohbette ⋯ → Engelle.</Text>
        ) : (
          engelli.map((e) => (
            <View key={e.sohbet} style={s.engelSatir}>
              <Avatar yazar={e.kisi} boyut={36} />
              <Text style={[s.baslik, { color: R.murekkep, flex: 1 }]} numberOfLines={1}>@{e.kisi.ad}</Text>
              <Dugme yazi="Engeli kaldır" kucuk tur="cizgi" onPress={() => engelKaldir(e)} />
            </View>
          ))
        )}
        {ayrac}

        <Bolum baslik="Gizlilik" />
        <View style={{ paddingHorizontal: 16 }}>
          <Anahtar
            acik={olcum}
            baslik="Kullanım sayımı"
            alt={Platform.OS === 'web' ? 'Siteyi geliştirmek için adsız ziyaret sayımı. Reklam ya da takip yok.' : 'Uygulamayı geliştirmek için adsız kullanım sayımı: cihazda rastgele bir numara ve ilk açılış günü tutulur; adınla ya da hesabınla bağı yoktur. Reklam ya da takip yok.'}
            onPress={() => {
              const yeni = !olcum;
              olcumAyarla(yeni ? 'evet' : 'hayir'); // kapatınca kimlik silinir, sunucuya bir şey gitmez
              olcumAyarla2(yeni);
            }}
          />
        </View>
        <Satir ikon="kisi" baslik="Gizlilik bilgisi" onPress={() => sayfaAc('/gizlilik/#cerez')} />
        {ayrac}

        <Bolum baslik="Bilgi" />
        <Satir ikon="bayrak" baslik="Topluluk kuralları" onPress={() => sayfaAc('/kurallar')} />
        <Satir ikon="kisi" baslik="Gizlilik ve aydınlatma" alt="Ne saklanır, ne zaman silinir" onPress={() => sayfaAc('/gizlilik')} />
        <Satir ikon="kalem" baslik="Kullanım şartları" onPress={() => sayfaAc('/sartlar')} />
        <Satir ikon="mesaj" baslik="İletişim ve şikâyet" alt="info@yazsammi.com" onPress={() => sayfaAc('/iletisim')} />
        {puanSatiriGorunur() && <Satir ikon="yildiz" baslik="Uygulamaya puan ver" onPress={() => void puanVer(c.tost)} />}
        {Platform.OS === 'web' && <Satir ikon="telefon" baslik="App Store'dan indir" onPress={() => window.open(uygulamaAdresi('ios'), '_blank', 'noopener')} />}
        {ayrac}

        <Satir ikon="cikis" baslik="Çıkış yap" onPress={cik} />
        {hepsiAsama === 0 ? (
          <Satir ikon="cikis" baslik="Tüm cihazlardan çık" alt="Diğer telefon ve tarayıcılardaki oturumları kapatır, burada açık kalırsın" onPress={() => hepsiAsamaAyarla(1)} />
        ) : (
          <View style={[s.silKutu, { borderColor: R.cizgi }]}>
            <Text style={[s.baslik, { color: R.murekkep }]}>Tüm cihazlardan çıkılsın mı?</Text>
            <Text style={[s.alt, { color: R.soluk }]}>Diğer cihazlardaki ve tarayıcılardaki oturumların hepsi kapanır. Burada açık kalırsın.</Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
              <Dugme yazi={hepsiBekle ? 'Bir saniye…' : 'Evet, hepsinden çık'} kucuk tur="acik" devre={hepsiBekle} onPress={hepsindenCik} />
              <Dugme yazi="Vazgeç" kucuk tur="cizgi" onPress={() => hepsiAsamaAyarla(0)} />
            </View>
          </View>
        )}
        {silAsama === 0 ? (
          <Satir ikon="cop" baslik="Hesabımı sil" renk={R.kalem} onPress={silmeyeBasla} />
        ) : silAsama === 2 ? (
          <SilDogrulama bitti={() => silAsamaAyarla(1)} vazgec={() => silAsamaAyarla(0)} />
        ) : (
          <View style={[s.silKutu, { borderColor: R.kalem }]}>
            <Text style={[s.baslik, { color: R.kalem }]}>Hesabın kalıcı olarak silinsin mi?</Text>
            <Text style={[s.alt, { color: R.murekkep }]}>Takma adın, gönderilerin, yorumların, beğenilerin, takiplerin, mesajlaşmaların (iki taraf için de), fotoğrafların ve Yazsam mı? hafızan hemen silinir. Geri alınamaz.</Text>
            <Text style={[s.alt, { color: R.soluk }]}>Yalnız kanunun istediği bağlantı kaydı (IP adresi ve saat, içerik yok) 1 yıl saklanır (5651 sayılı Kanun).</Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
              <Dugme yazi={siliniyor ? 'Siliniyor…' : 'Evet, kalıcı olarak sil'} kucuk tur="dolu" devre={siliniyor} onPress={hesabiSil} />
              <Dugme yazi="Vazgeç" kucuk tur="cizgi" onPress={() => silAsamaAyarla(0)} />
            </View>
          </View>
        )}
        <Text style={[s.dip, { color: R.soluk }]}>Yazsam mı? Canlı · yalnız 18 yaş ve üzeri</Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  icerik: { paddingBottom: 40, paddingTop: 6 },
  bos: { alignItems: 'center', gap: 14, paddingVertical: 60, paddingHorizontal: 30 },
  bolum: { fontFamily: yazi.kalin, fontSize: 13, letterSpacing: 0.4, textTransform: 'uppercase', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  satir: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 13 },
  baslik: { fontFamily: yazi.orta, fontSize: 15.5 },
  alt: { fontFamily: yazi.normal, fontSize: 13.5, lineHeight: 19 },
  hesap: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 10 },
  epostaIkon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  giris: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 12, height: 46 },
  girisYazi: { flex: 1, fontFamily: yazi.orta, fontSize: 16, height: '100%' },
  ayrac: { height: 1, marginTop: 12, marginHorizontal: 16 },
  secim: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderRadius: 16, padding: 12 },
  radyo: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radyoIc: { width: 10, height: 10, borderRadius: 5 },
  anahtarSatir: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  anahtar: { width: 46, height: 26, borderRadius: 13, padding: 3 },
  anahtarTop: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  engelSatir: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 8 },
  silKutu: { marginHorizontal: 16, marginTop: 6, borderWidth: 1.5, borderRadius: 16, padding: 14, gap: 6 },
  uyari: { marginHorizontal: 16, marginTop: 8, borderWidth: 1.5, borderRadius: 14, padding: 12, fontFamily: yazi.orta, fontSize: 14.5 },
  dip: { fontFamily: yazi.normal, fontSize: 12.5, textAlign: 'center', marginTop: 26 },
});
