// iOS satın alma ekranları (18.11, sürüm 1.8.0): "Plus" ekranı + tek ürün teklifi (hak bitince) tek pencerede; Ben ekranındaki Plus kartı.
// Yalnız iOS (MAGAZA_VAR): Android ve web'de bu bileşenler hiçbir şey çizmez. Fiyat/ad/açıklama mağazadan gelir; burada fiyat yazılı değildir.
// Mevcut tasarım dili: ortak.tsx Pencere/Dugme/Bas, useRenk renkleri, yazi yazı tipleri; yeni çizim/ikon yok.
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { yazi } from '@/tema/tema';
import { Bas, Dugme, Ikon, Pencere, useRenk } from '@/bilesenler/canli/ortak';
import { useCanli } from '@/bilesenler/canli/baglam';
import * as M from './yonetici';
import { ABONELIKLER, TUKETILEBILIRLER, aboneMi, kalanSatirlari, kurucuDostMu, neDahil, onayYap, plusOzet, sureMetni } from './mantik';

const SARTLAR = 'https://yazsammi.com/sartlar/';
const GIZLILIK = 'https://yazsammi.com/gizlilik/';
const YENILEME_IOS = 'Abonelik, dönem bitiminden en az 24 saat önce iptal edilmezse otomatik yenilenir. Ödeme Apple Kimliği hesabından alınır. Aboneliğini istediğin zaman App Store hesap ayarlarından yönetebilir ve iptal edebilirsin. İptal edersen içinde bulunduğun dönemin sonuna kadar erişimin sürer.';
const YENILEME_ANDROID = 'Abonelik, seçtiğin dönem (aylık ya da yıllık) sonunda, yenileme tarihinden önce iptal etmezsen aynı dönem için ekranda yazan fiyatla otomatik yenilenir. Ödeme Google Play hesabından alınır. İptal için: Google Play Store → profil simgesi → Ödemeler ve abonelikler → Abonelikler → Yazsam mı? → Aboneliği iptal et. Uygulamayı silmek aboneliği iptal etmez. İptal edersen içinde bulunduğun dönemin sonuna kadar erişimin sürer. İade talepleri Google Play kurallarına göre Google üzerinden yapılır.'; // Hukuk onayı bekler (Android bayrağı açılmadan önce)
const YENILEME_METNI = Platform.OS === 'android' ? YENILEME_ANDROID : YENILEME_IOS;
// Cayma hakkı onayı (Kullanım Şartları 2.3, md 9.6): satın al düğmesinden ÖNCE, önceden işaretli GELMEZ; işaretlenmeden düğme çalışmaz. Onay satın alma isteğiyle sunucuya gider.
const ONAY_TEK = 'Hizmetin hemen başlamasını istiyorum; başladığında cayma hakkımın sona ereceğini kabul ediyorum.';
const ONAY_ABONELIK = 'Aboneliğin hemen başlamasını istiyorum; cayma hakkımı kaybedeceğimi ve süre sonunda kendiliğinden yenileneceğini kabul ediyorum.';
const tarihYaz = (ms: number) => new Date(ms).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

// Uygulamanın en üstünde (Pencereler içinde) bir kez durur: mağazayı başlatır, pencereyi çizer.
export function MagazaPenceresi() {
  const c = useCanli();
  const d = M.useMagaza();
  useEffect(() => {
    if (!M.MAGAZA_VAR) return;
    M.tostAyarla(c.tost);
    void M.baslat();
  }, []);
  if (!M.MAGAZA_VAR) return null;
  const p = d.pencere;
  return (
    <Pencere acik={!!p} kapat={() => M.pencereKapat(false)} genislik={480} baslik={p?.tur === 'teklif' ? 'Devam etmek için' : 'Yazsam mı? Plus'}>
      {p && <Icerik />}
    </Pencere>
  );
}

function Icerik() {
  const R = useRenk();
  const c = useCanli();
  const d = M.useMagaza();
  const [onayTek, onayTekAyarla] = useState(false); // her pencere açılışında işaretsiz başlar
  const [onayAb, onayAbAyarla] = useState(false);
  const p = d.pencere;
  if (!p) return null;
  const teklif = p.tur === 'teklif';
  const urun = (id: string) => d.urunler.find((u) => u.id === id);
  const sira = teklif ? p.secenekler : [...ABONELIKLER, ...TUKETILEBILIRLER];
  const oneCikan = teklif ? urun(p.urun) : undefined;
  const plusSira = sira.filter(aboneMi);
  const digerleri = sira.filter((id) => !aboneMi(id) && id !== (teklif ? p.urun : ''));

  const al = async (id: string) => {
    if (!c.girisIste('Satın almak için giriş yap')) { M.pencereKapat(false); return; }
    if (!(aboneMi(id) ? onayAb : onayTek)) return; // onay işaretli değilse satın alma başlamaz
    const s = await M.satinAlVeBekle(id, onayYap());
    onayTekAyarla(false); onayAbAyarla(false); // her satın alma için onay yeniden verilir
    if (s.durum === 'tamam' && teklif) M.pencereKapat(true); // kullanıcı kaldığı yerden devam eder: istek yeniden denenir
    else if (s.durum === 'giris') { M.pencereKapat(false); c.girisIste('Satın almak için giriş yap'); }
  };
  const geri = async () => {
    const r = await M.geriYukle();
    if (r.basari && teklif) M.pencereKapat(true);
  };
  const mesgul = !!d.yuk;

  const satirKarti = (id: string, vurgulu: boolean, onayGoster = false) => {
    const u = urun(id);
    if (!u) return null;
    return (
      <View key={id} style={[s.kart, { borderColor: vurgulu ? R.vurgu : R.ince, backgroundColor: vurgulu ? R.vurguYumusak : R.ust }]}>
        <Text style={[s.baslik, { color: R.murekkep }]}>{u.baslik}</Text>
        <Text style={[s.alt, { color: R.soluk }]}>{neDahil(u) || u.aciklama}</Text>
        {onayGoster && <OnayKutusu isaretli={onayTek} degis={onayTekAyarla} metin={ONAY_TEK} />}
        <View style={s.fiyatSatir}>
          <Text style={[s.fiyat, { color: R.murekkep }]}>{u.fiyat || 'Fiyat alınamadı'}</Text>
          <Dugme yazi={d.yuk === id ? 'Bir saniye…' : 'Satın al'} kucuk tur={vurgulu ? 'acik' : 'dolu'} devre={mesgul || !u.satilabilir || !onayTek} onPress={() => al(id)} />
        </View>
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 26, gap: 14 }} keyboardShouldPersistTaps="handled">
      {teklif ? (
        <View style={{ gap: 4 }}>
          <Text style={[s.ust, { color: R.murekkep }]}>Bu özelliğin hakkı bitti</Text>
          <Text style={[s.alt, { color: R.soluk }]}>Devam etmek için aşağıdakilerden birini seçebilirsin. İstersen şimdilik vazgeçebilirsin.</Text>
        </View>
      ) : (
        <Text style={[s.alt, { color: R.soluk }]}>Plus ile her ay Derin Tarot, doğum haritası ve burç uyumu hakların yenilenir. Tek seferlik seçenekler de aşağıda.</Text>
      )}

      {oneCikan && satirKarti(oneCikan.id, true, true)}

      {plusSira.length > 0 && (
        <View style={{ gap: 10 }}>
          <Text style={[s.bolum, { color: R.soluk }]}>Plus</Text>
          {/* Apple'ın zorunlu bilgisi: düğmelerden ÖNCE, okunur boyutta */}
          <Text style={[s.alt, { color: R.murekkep }]}>{YENILEME_METNI}</Text>
          <OnayKutusu isaretli={onayAb} degis={onayAbAyarla} metin={ONAY_ABONELIK} />
          {plusSira.map((id) => {
            const u = urun(id);
            if (!u) return null;
            return (
              <View key={id} style={[s.kart, { borderColor: R.ince, backgroundColor: R.ust }]}>
                <Text style={[s.baslik, { color: R.murekkep }]}>{u.baslik}</Text>
                <Text style={[s.alt, { color: R.soluk }]}>Süre: {sureMetni(u.sure)} · kendiliğinden yenilenir</Text>
                <Text style={[s.alt, { color: R.soluk }]}>{neDahil(u)}</Text>
                <View style={s.fiyatSatir}>
                  <Text style={[s.fiyat, { color: R.murekkep }]}>{u.fiyat ? `${u.fiyat} / ${sureMetni(u.sure)}` : 'Fiyat alınamadı'}</Text>
                  <Dugme yazi={d.yuk === id ? 'Bir saniye…' : 'Abone ol'} kucuk devre={mesgul || !u.satilabilir || !onayAb} onPress={() => al(id)} />
                </View>
              </View>
            );
          })}
        </View>
      )}

      {digerleri.length > 0 && (
        <View style={{ gap: 10 }}>
          <Text style={[s.bolum, { color: R.soluk }]}>Tek seferlik</Text>
          <OnayKutusu isaretli={onayTek} degis={onayTekAyarla} metin={ONAY_TEK} />
          {digerleri.map((id) => satirKarti(id, false))}
        </View>
      )}

      {!!d.mesaj && <Text style={[s.alt, { color: R.murekkep }]}>{d.mesaj}</Text>}
      {d.yuk === 'geri' && <ActivityIndicator color={R.vurgu} />}

      <View style={{ gap: 8 }}>
        <Dugme yazi={d.yuk === 'geri' ? 'Geri yükleniyor…' : 'Satın alımlarımı geri yükle'} tur="cizgi" devre={mesgul} onPress={geri} />
        <Dugme yazi="Abonelikleri yönet" tur="cizgi" onPress={() => { void M.abonelikleriYonet(); }} />
        {teklif && <Dugme yazi="Şimdilik vazgeç" tur="cizgi" onPress={() => M.pencereKapat(false)} />}
      </View>
      <View style={s.linkler}>
        <Bas onPress={() => { void Linking.openURL(SARTLAR).catch(() => {}); }} etiket="Kullanım Şartları (EULA)" style={s.link}>
          <Text style={[s.linkYazi, { color: R.vurgu }]}>Kullanım Şartları (EULA)</Text>
        </Bas>
        <Bas onPress={() => { void Linking.openURL(GIZLILIK).catch(() => {}); }} etiket="Gizlilik Politikası ve KVKK Aydınlatma" style={s.link}>
          <Text style={[s.linkYazi, { color: R.vurgu }]}>Gizlilik Politikası ve KVKK</Text>
        </Bas>
      </View>
      <Text style={[s.dip, { color: R.soluk }]}>İçerik eğlence ve kişisel gelişim amaçlıdır; sağlık, hukuk ya da yatırım yorumu içermez.</Text>
    </ScrollView>
  );
}

// Cayma onay satırı: kutu + metin + Kullanım Şartları bağlantısı (mevcut Ikon 'tik', yeni çizim yok).
function OnayKutusu({ isaretli, degis, metin }: { isaretli: boolean; degis: (v: boolean) => void; metin: string }) {
  const R = useRenk();
  return (
    <Pressable onPress={() => degis(!isaretli)} accessibilityRole="checkbox" accessibilityState={{ checked: isaretli }} accessibilityLabel={metin} style={s.onay}>
      <View style={[s.kutu, { borderColor: R.vurgu, backgroundColor: isaretli ? R.vurgu : 'transparent' }]}>{isaretli && <Ikon ad="tik" boyut={16} renk="#fff" kalinlik={2.6} />}</View>
      <Text style={[s.alt, { color: R.murekkep, flex: 1 }]}>
        {metin}{' '}
        <Text accessibilityRole="link" style={[s.onayLink, { color: R.vurgu }]} onPress={() => { void Linking.openURL(SARTLAR).catch(() => {}); }}>Kullanım Şartları</Text>
      </Text>
    </Pressable>
  );
}

// Ben ekranı: Plus durumu + kalan haklar + Plus ekranına giriş + geri yükle.
export function PlusKarti() {
  const R = useRenk();
  const c = useCanli();
  const d = M.useMagaza();
  const [mesaj, mesajAyarla] = useState('');
  useEffect(() => {
    if (M.MAGAZA_VAR) void M.haklariTazele();
  }, [c.uye?.uid]);
  if (!M.MAGAZA_VAR) return null;
  const h = d.haklar;
  const dost = kurucuDostMu(h);
  const aktif = !!h?.plus?.aktif || dost;
  const geri = async () => {
    const r = await M.geriYukle();
    mesajAyarla(r.mesaj);
  };
  return (
    <View style={[s.kart, { borderColor: R.ince, backgroundColor: R.panel }]}>
      <Text style={[s.baslik, { color: R.murekkep }]}>Plus ve haklarım</Text>
      {!d.haklarYuklendi ? (
        <ActivityIndicator style={{ marginVertical: 8 }} color={R.vurgu} />
      ) : !h ? (
        <Text style={[s.alt, { color: R.soluk }]}>Haklar şu an yüklenemedi.</Text>
      ) : (
        <>
          <Text style={[s.alt, { color: aktif ? R.murekkep : R.soluk }]}>{h.kurucu ? 'Kurucu hesabı: kullanım sınırı yok.' : plusOzet(h, tarihYaz)}</Text>
          {!h.kurucu && !dost && kalanSatirlari(h).map((x) => (
            <View key={x.ad} style={s.hakSatir}>
              <Text style={[s.alt, { color: R.soluk }]}>{x.ad}</Text>
              <Text style={[s.alt, { color: R.murekkep, flexShrink: 1, textAlign: 'right' }]}>{x.metin}</Text>
            </View>
          ))}
        </>
      )}
      {!!mesaj && <Text style={[s.alt, { color: R.murekkep }]}>{mesaj}</Text>}
      {!dost && (
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
          <Dugme yazi={aktif ? 'Plus ayrıntıları' : "Plus'a git"} kucuk tur="acik" onPress={M.plusAc} />
          <Dugme yazi={d.yuk === 'geri' ? 'Geri yükleniyor…' : 'Satın alımlarımı geri yükle'} kucuk tur="cizgi" devre={!!d.yuk} onPress={geri} />
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  kart: { borderWidth: 1.5, borderRadius: 16, padding: 14, gap: 6 },
  ust: { fontFamily: yazi.kalin, fontSize: 18 },
  baslik: { fontFamily: yazi.orta, fontSize: 15.5 },
  alt: { fontFamily: yazi.normal, fontSize: 13.5, lineHeight: 19 },
  bolum: { fontFamily: yazi.kalin, fontSize: 13, letterSpacing: 0.4, textTransform: 'uppercase' },
  fiyatSatir: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 6 },
  fiyat: { fontFamily: yazi.kalin, fontSize: 17, flexShrink: 1 },
  hakSatir: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  onay: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 2 },
  kutu: { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  onayLink: { fontFamily: yazi.orta, textDecorationLine: 'underline' },
  linkler: { flexDirection: 'row', flexWrap: 'wrap', gap: 18, justifyContent: 'center' },
  link: { paddingVertical: 6 },
  linkYazi: { fontFamily: yazi.orta, fontSize: 14, textDecorationLine: 'underline' },
  dip: { fontFamily: yazi.normal, fontSize: 12.5, textAlign: 'center', lineHeight: 18 },
});
