// KULLANILMIYOR (04.11.2026): eski KAHİN astroloji/tarot ekranı. Astroloji ve Tarot Kart Analizi artık sitenin /astroloji/ ve /tarot/ sayfaları,
// uygulamada WebView ile (bilesenler/canli/SiteBolumu.native.tsx); hiçbir ekran bu dosyayı içe aktarmıyor. Kod başvuru için duruyor, silinmedi.
// Uyum (sinastri): iki kişinin doğum haritası karşılaştırılır; yorum ücretli (`astro_uyum`), partner bilgisi KAYDEDİLMEZ.
import { useEffect, useState } from 'react';
import { Linking, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import * as C from '@/canli';
import { useCanli } from '@/bilesenler/canli/baglam';
import { yazi } from '@/tema/tema';
import { BOS_DOGUM, DogumAlanlari, dogumCevir, type DogumDeger } from './DogumAlanlari';
import { ALTIN, Cerceve, Dugme, SOLUK, SatinKutusu, YAZI } from './ortak';
import { useSatin } from './satin';
import { YorumOkuyucu } from './YorumOkuyucu';

const SITE = 'https://yazsammi.com';
export function UyumEkrani({ geri, haritayaGit }: { geri: () => void; haritayaGit: () => void }) {
  const c = useCanli();
  const girisli = !!c.uye && !c.uye.yeni;
  const [durum, durumAyarla] = useState<C.AstroDurum | null>(null);
  const [ad, adAyarla] = useState('');
  const [form, formAyarla] = useState<DogumDeger>(BOS_DOGUM);
  const [hata, hataAyarla] = useState('');
  const [yuk, yukAyarla] = useState(false);
  const [hakYok, hakYokAyarla] = useState(false);
  const [yorum, yorumAyarla] = useState<C.AstroYorum | null>(null);
  const tazele = () => { C.astroDurum().then((d) => d.ok && durumAyarla(d.veri)); };
  useEffect(() => { if (girisli) tazele(); }, [girisli]);
  const satin = useSatin(girisli, () => { hakYokAyarla(false); tazele(); }, c.tost);
  const webAc = () => { if (Platform.OS === 'web' && typeof window !== 'undefined') window.open(`${SITE}/?k=astro`, '_blank'); else Linking.openURL(SITE).catch(() => {}); };
  async function oku() {
    hataAyarla('');
    const k = dogumCevir(form, durum?.iller ?? []);
    if (k.hata || !k.dogum) { hataAyarla(k.hata || 'Eksik bilgi.'); return; }
    yukAyarla(true);
    const r = await C.astroYorumGetir('uyum', { ad: ad.trim() || 'Partnerin', dogum: k.dogum, il: k.il! });
    yukAyarla(false);
    if (r.ok) { yorumAyarla(r.veri); tazele(); return; }
    if (r.durum === 402) { hakYokAyarla(true); return; }
    hataAyarla(r.durum === 409 ? 'Önce kendi doğum haritanı çıkar.' : r.durum === 422 ? 'Bu ad kullanılamıyor.' : r.durum === 503 ? 'KAHİN şu an çok yoğun, hakkın korundu.' : 'Yorum şu an hazırlanamadı.');
  }
  if (yorum) return <YorumOkuyucu baslik={`Uyum: sen ve ${yorum.partner ?? 'partnerin'}`} ozet={yorum.ozet} parcalar={yorum.parcalar} kapat={() => yorumAyarla(null)} />;
  return (
    <Cerceve baslik="Uyum" alt="İki kişinin haritası" geri={geri}>
      {!girisli ? (
        <View style={s.kutu}><Text style={s.metin}>Uyum yorumu için önce giriş yapıp kendi doğum haritanı çıkarmalısın.</Text><Dugme yazi="Giriş yap" birincil buyuk onPress={() => c.girisIste('Uyum için giriş yap', () => {})} /></View>
      ) : durum && !durum.profil ? (
        <View style={s.kutu}><Text style={s.metin}>Uyum için önce kendi doğum bilgilerini girmelisin.</Text><Dugme yazi="Doğum haritama git" birincil buyuk onPress={haritayaGit} /></View>
      ) : (
        <View>
          <Text style={s.metin}>Karşındaki kişinin doğum bilgilerini gir; KAHİN Güneş, Ay, Venüs, Mars ve Merkür'ünüzü karşılaştırıp sesli yorumlasın.</Text>
          <Text style={s.etiket}>Adı</Text>
          <TextInput value={ad} onChangeText={(x) => adAyarla(x.replace(/[^\p{L}\s]/gu, '').slice(0, 20))} placeholder="Ad (ör. Ayşe)" placeholderTextColor="rgba(237,233,246,0.4)" style={s.girdi} accessibilityLabel="Partnerin adı" />
          <DogumAlanlari v={form} onChange={formAyarla} iller={durum?.iller ?? []} />
          <Text style={s.not}>Bu kişinin bilgileri yalnız yorum için işlenir, sunucuda saklanmaz. Bilgisini paylaşmaya iznin olduğundan emin ol.</Text>
          <Text style={s.hak}>{(durum?.uyum_hak ?? 0) > 0 ? `Kalan uyum hakkın: ${durum!.uyum_hak}` : 'Her uyum yorumu ayrı bir haktır.'}</Text>
          {!!hata && <Text style={s.hata}>{hata}</Text>}
          {hakYok || ((durum?.uyum_hak ?? 0) === 0 && hakYok) ? (
            <SatinKutusu baslik="Uyum hakkın yok" liste={[{ id: 'astro_uyum', ad: 'Uyum yorumu · 1 hak', birincil: true }]} urunler={satin.urunler} neden={satin.neden} yuk={satin.yuk} satin={satin.satinAlTikla} webAc={webAc} />
          ) : (
            <Dugme yazi={yuk ? 'KAHİN iki haritaya bakıyor…' : 'Uyumu oku'} birincil buyuk onPress={oku} devre={yuk} />
          )}
          {!!satin.hata && <Text style={s.hata}>{satin.hata}</Text>}
        </View>
      )}
    </Cerceve>
  );
}
const s = StyleSheet.create({
  kutu: { backgroundColor: 'rgba(30,20,52,0.9)', borderRadius: 18, padding: 16, borderColor: 'rgba(242,193,78,0.3)', borderWidth: 1 },
  metin: { fontFamily: yazi.normal, fontSize: 15, lineHeight: 22, color: YAZI },
  etiket: { fontFamily: yazi.kalin, fontSize: 14, color: SOLUK, marginTop: 14, marginBottom: 6 },
  girdi: { height: 46, backgroundColor: 'rgba(30,20,52,0.92)', borderColor: 'rgba(237,233,246,0.18)', borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, color: YAZI, fontFamily: yazi.normal, fontSize: 16 },
  not: { fontFamily: yazi.normal, fontSize: 12.5, lineHeight: 18, color: SOLUK, marginTop: 14 },
  hak: { fontFamily: yazi.orta, fontSize: 14, color: ALTIN, textAlign: 'center', marginTop: 10 },
  hata: { fontFamily: yazi.orta, fontSize: 14, color: '#FF8FA8', marginTop: 8 },
});
