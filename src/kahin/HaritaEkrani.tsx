// KULLANILMIYOR (04.11.2026): eski KAHİN astroloji/tarot ekranı. Astroloji ve Tarot Kart Analizi artık sitenin /astroloji/ ve /tarot/ sayfaları,
// uygulamada WebView ile (bilesenler/canli/SiteBolumu.native.tsx); hiçbir ekran bu dosyayı içe aktarmıyor. Kod başvuru için duruyor, silinmedi.
// Doğum haritam: profil (açık rızayla) → çember harita + tablo + sesli yorum (ilk ücretsiz, sonra `astro_harita`) + "bu konuda kartlara sor".
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import * as C from '@/canli';
import { useCanli } from '@/bilesenler/canli/baglam';
import { yazi } from '@/tema/tema';
import { BOS_DOGUM, DogumAlanlari, dogumCevir, type DogumDeger } from './DogumAlanlari';
import { GEZEGEN_SEMBOL, HaritaCark } from './HaritaCark';
import { ALTIN, Cerceve, Dugme, SOLUK, SatinKutusu, YAZI } from './ortak';
import { useSatin } from './satin';
import { YorumOkuyucu } from './YorumOkuyucu';

const EV_KONU = ['benlik', 'para ve güvence', 'iletişim', 'yuva ve aile', 'yaratıcılık ve aşk', 'günlük düzen', 'ilişkiler', 'ortak kaynaklar ve dönüşüm', 'öğrenme ve inanç', 'kariyer', 'topluluk ve umutlar', 'iç dünya'];
const SITE = 'https://yazsammi.com';

export function HaritaEkrani({ geri, tarotaGec }: { geri: () => void; tarotaGec: (soru: string) => void }) {
  const c = useCanli();
  const { width } = useWindowDimensions();
  const [durum, durumAyarla] = useState<C.AstroDurum | null>(null);
  const [harita, haritaAyarla] = useState<C.AstroHarita | null>(null);
  const [yukleniyor, yukAyarla] = useState(true);
  const [form, formAyarla] = useState<DogumDeger>(BOS_DOGUM);
  const [riza, rizaAyarla] = useState(false);
  const [hata, hataAyarla] = useState('');
  const [kayit, kayitAyarla] = useState(false);
  const [yorum, yorumAyarla] = useState<C.AstroYorum | null>(null);
  const [yorumYuk, yorumYukAyarla] = useState(false);
  const [hakYok, hakYokAyarla] = useState(false);
  const girisli = !!c.uye && !c.uye.yeni;

  const yukle = useCallback(async () => {
    yukAyarla(true);
    const d = await C.astroDurum();
    if (d.ok) durumAyarla(d.veri);
    if (d.ok && d.veri.profil) { const h = await C.astroHaritaGetir(); haritaAyarla(h.ok ? h.veri : null); } else haritaAyarla(null);
    yukAyarla(false);
  }, []);
  useEffect(() => { if (girisli) yukle(); else yukAyarla(false); }, [girisli, yukle]);
  const satin = useSatin(girisli, () => { hakYokAyarla(false); yukle(); }, c.tost);

  async function kaydet() {
    hataAyarla('');
    const k = dogumCevir(form, durum?.iller ?? []);
    if (k.hata || !k.dogum) { hataAyarla(k.hata || 'Eksik bilgi.'); return; }
    if (!riza) { hataAyarla('Devam etmek için açık rıza kutusunu işaretle.'); return; }
    kayitAyarla(true);
    const r = await C.astroProfilKaydet(k.dogum, k.il!, true);
    kayitAyarla(false);
    if (!r.ok) { hataAyarla('Kaydedilemedi, bağlantını kontrol edip tekrar dene.'); return; }
    yukle();
  }
  async function yorumIste() {
    yorumYukAyarla(true); hataAyarla('');
    const r = await C.astroYorumGetir('harita');
    yorumYukAyarla(false);
    if (r.ok) { yorumAyarla(r.veri); yukle(); return; }
    if (r.durum === 402) { hakYokAyarla(true); return; }
    hataAyarla(r.durum === 503 ? 'KAHİN şu an çok yoğun, hakkın korundu. Birazdan tekrar dene.' : r.durum === 429 ? 'Bugünlük yorum sınırına geldin.' : 'Yorum şu an hazırlanamadı.');
  }
  async function bilgiSil() {
    const r = await C.astroProfilSil();
    if (r.ok) { haritaAyarla(null); formAyarla(BOS_DOGUM); rizaAyarla(false); yukle(); c.tost('Doğum bilgilerin silindi'); }
  }
  const webAc = () => { if (Platform.OS === 'web' && typeof window !== 'undefined') window.open(`${SITE}/?k=astro`, '_blank'); else Linking.openURL(SITE).catch(() => {}); };

  if (yorum) return <YorumOkuyucu baslik="Doğum haritası yorumu" ozet={yorum.ozet} parcalar={yorum.parcalar} kapat={() => yorumAyarla(null)} ekDugme={{ yazi: 'Bu konuda kartlara sor', onPress: () => { yorumAyarla(null); tarotaGec(`Doğum haritamda ${harita?.ozet.gunes} Güneşi, ${harita?.ozet.ay} Ayı var. Şu an hayatımda neye dikkat etmeliyim?`); } }} />;

  const hh = harita?.harita;
  const g = (k: string) => hh?.gezegenler.find((x) => x.anahtar === k);
  const cark = Math.min(width - 32, 420);
  return (
    <Cerceve baslik="Doğum haritam" alt="Yıldızlar, evler, açılar" geri={geri}>
      {!girisli ? (
        <View style={s.kutu}>
          <Text style={s.baslik}>Önce giriş yap</Text>
          <Text style={s.metin}>Doğum haritanı hesaplayıp hesabında saklamak için giriş yapman gerekir.</Text>
          <Dugme yazi="Giriş yap" birincil buyuk onPress={() => c.girisIste('Doğum haritan için giriş yap', () => {})} />
        </View>
      ) : yukleniyor ? (
        <View style={{ paddingVertical: 60, alignItems: 'center' }}><ActivityIndicator color={ALTIN} /></View>
      ) : !harita ? (
        <View>
          <Text style={s.metin}>Doğum haritanı çıkarmak için doğum tarihine, saatine ve yerine ihtiyacım var. Saatini bilmiyorsan yine de Güneş, Ay ve gezegenlerini çıkarabilirim.</Text>
          <DogumAlanlari v={form} onChange={formAyarla} iller={durum?.iller ?? []} />
          <Pressable onPress={() => rizaAyarla((x) => !x)} accessibilityRole="checkbox" accessibilityState={{ checked: riza }} style={s.rizaSatir}>
            <View style={[s.kutucuk, riza && { backgroundColor: ALTIN, borderColor: ALTIN }]}>{riza && <Text style={{ color: '#1A1030', fontSize: 14, lineHeight: 16, fontFamily: yazi.kalin }}>✓</Text>}</View>
            <Text style={s.rizaYazi}>{durum?.riza.metin}</Text>
          </Pressable>
          {!!hata && <Text style={s.hata}>{hata}</Text>}
          <Dugme yazi={kayit ? 'Kaydediliyor…' : 'Haritamı çıkar'} birincil buyuk onPress={kaydet} devre={kayit} />
        </View>
      ) : (
        <View>
          <View style={s.ozetSatir}>
            {[['Güneş', harita.ozet.gunes], ['Ay', harita.ozet.ay], ['Yükselen', harita.ozet.yukselen ?? '—']].map(([a, b]) => (
              <View key={a} style={s.ozetKutu}><Text style={s.ozetEtiket}>{a}</Text><Text style={s.ozetDeger}>{b}</Text></View>
            ))}
          </View>
          <View style={{ alignItems: 'center', marginVertical: 10 }}><HaritaCark h={harita.harita} boyut={cark} /></View>
          {hh?.saatBilinmiyor && <Text style={s.not}>Doğum saati yok: yükselen ve evler hesaplanmadı; Ay burcu gün içinde değişmiş olabilir.</Text>}
          <Text style={s.altBaslik}>Gezegenler</Text>
          <View style={s.tablo}>
            {hh!.gezegenler.map((p, i) => (
              <View key={p.anahtar} style={[s.satir, i % 2 === 0 && { backgroundColor: 'rgba(237,233,246,0.04)' }]}>
                <Text style={s.sembol}>{GEZEGEN_SEMBOL[p.anahtar]}</Text>
                <Text style={[s.hucre, { flex: 1.3 }]}>{p.ad}{p.geri ? ' (geri)' : ''}</Text>
                <Text style={[s.hucre, { flex: 1.4, color: ALTIN }]}>{p.burc} {p.derece}°{String(p.dakika).padStart(2, '0')}′</Text>
                <Text style={[s.hucre, { flex: 0.8, textAlign: 'right', color: SOLUK }]}>{p.ev ? `${p.ev}. ev` : ''}</Text>
              </View>
            ))}
          </View>
          {hh?.evler && (
            <>
              <Text style={s.altBaslik}>Evler</Text>
              <View style={s.evIzgara}>
                {hh.evler.map((e) => (
                  <View key={e.ev} style={s.evKutu}><Text style={s.evNo}>{e.ev}</Text><Text style={s.evBurc}>{e.burc}</Text><Text style={s.evKonu}>{EV_KONU[e.ev - 1]}</Text></View>
                ))}
              </View>
            </>
          )}
          {!!hata && <Text style={s.hata}>{hata}</Text>}
          <Text style={s.altBaslik}>Ayrıntılı yorum</Text>
          <Text style={s.metin}>KAHİN haritanı bölüm bölüm yorumlar ve kendi sesiyle okur. {durum?.harita_ucretsiz_var ? 'İlk yorumun ücretsiz.' : `Kalan yorum hakkın: ${durum?.harita_hak ?? 0}`}</Text>
          {hakYok ? (
            <SatinKutusu baslik="Yorum hakkın bitti" liste={[{ id: 'astro_harita', ad: 'Harita yorumu · 1 hak', birincil: true }]} urunler={satin.urunler} neden={satin.neden} yuk={satin.yuk} satin={satin.satinAlTikla} webAc={webAc} />
          ) : (
            <Dugme yazi={yorumYuk ? 'KAHİN haritana bakıyor…' : 'Yorumla ve sesli oku'} birincil buyuk onPress={yorumIste} devre={yorumYuk} />
          )}
          {!!satin.hata && <Text style={s.hata}>{satin.hata}</Text>}
          <Text style={s.altBaslik}>Kartlara sor</Text>
          <View style={{ gap: 8 }}>
            {[
              [`Venüs ${g('venus')?.burc ?? ''}${g('venus')?.ev ? `, ${g('venus')!.ev}. evde` : ''}: aşk hayatım için kartlar ne diyor?`, 'Aşk'],
              [`Güneşim ${g('gunes')?.burc ?? ''}${g('gunes')?.ev ? `, ${g('gunes')!.ev}. evde` : ''}: kariyerimde hangi yola bakmalıyım?`, 'Kariyer'],
              [`Ayım ${g('ay')?.burc ?? ''}${g('ay')?.ev ? `, ${g('ay')!.ev}. evde` : ''}: duygusal olarak şu an neye ihtiyacım var?`, 'Duygular'],
            ].map(([soru, ad]) => <Dugme key={ad} yazi={`${ad} için kartlara sor`} onPress={() => tarotaGec(soru)} />)}
          </View>
          <Pressable onPress={bilgiSil} accessibilityRole="button" style={{ marginTop: 18, alignSelf: 'center', padding: 8 }}><Text style={s.sil}>Doğum bilgilerimi sil</Text></Pressable>
        </View>
      )}
    </Cerceve>
  );
}

const s = StyleSheet.create({
  kutu: { backgroundColor: 'rgba(30,20,52,0.9)', borderRadius: 18, padding: 16, borderColor: 'rgba(242,193,78,0.3)', borderWidth: 1 },
  baslik: { fontFamily: yazi.kalin, fontSize: 18, color: ALTIN, marginBottom: 6 },
  metin: { fontFamily: yazi.normal, fontSize: 15, lineHeight: 22, color: YAZI },
  not: { fontFamily: yazi.normal, fontSize: 12.5, lineHeight: 18, color: SOLUK, marginTop: 4 },
  hata: { fontFamily: yazi.orta, fontSize: 14, color: '#FF8FA8', marginTop: 10 },
  altBaslik: { fontFamily: yazi.kalin, fontSize: 16, color: ALTIN, marginTop: 20, marginBottom: 8 },
  ozetSatir: { flexDirection: 'row', gap: 8 },
  ozetKutu: { flex: 1, backgroundColor: 'rgba(30,20,52,0.9)', borderRadius: 14, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(242,193,78,0.25)' },
  ozetEtiket: { fontFamily: yazi.orta, fontSize: 12, color: SOLUK },
  ozetDeger: { fontFamily: yazi.kalin, fontSize: 17, color: YAZI, marginTop: 2 },
  tablo: { borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(237,233,246,0.1)' },
  satir: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 10 },
  sembol: { width: 26, fontSize: 18, color: ALTIN, fontFamily: yazi.kalin },
  hucre: { fontFamily: yazi.orta, fontSize: 13.5, color: YAZI },
  evIzgara: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  evKutu: { width: '31.5%', backgroundColor: 'rgba(30,20,52,0.9)', borderRadius: 12, padding: 8, borderWidth: 1, borderColor: 'rgba(237,233,246,0.1)' },
  evNo: { fontFamily: yazi.kalin, fontSize: 13, color: ALTIN },
  evBurc: { fontFamily: yazi.kalin, fontSize: 14.5, color: YAZI },
  evKonu: { fontFamily: yazi.normal, fontSize: 11.5, color: SOLUK, marginTop: 1 },
  rizaSatir: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginTop: 16, marginBottom: 4 },
  kutucuk: { width: 24, height: 24, borderRadius: 7, borderWidth: 1.5, borderColor: 'rgba(237,233,246,0.5)', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  rizaYazi: { flex: 1, fontFamily: yazi.normal, fontSize: 13, lineHeight: 19, color: YAZI },
  sil: { fontFamily: yazi.orta, fontSize: 13, color: SOLUK, textDecorationLine: 'underline' },
});
