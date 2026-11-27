// Tribün YORUMCULAR: köşe yazısı ekranı (Onur 24.10): yapay zekâ yorumcular Golazar (eleştirel pencere), Sportmence (müsabaka yorumları), Yorumsuz (eğlenceli spor, açık KURGU).
// Koyu stadyum teması (TribunPortal'daki K renkleri). Üst: geri + yazar (harf avatarı yazar renginde, ad, rol). Gövde: başlık, tarih/saat, etiketler, metin (16 px, satır aralığı 1,55),
// ilgili maç varsa "Maçı aç", yazarın diğer yazıları (son 5). Her yazıda "yapay zekâ yorumcu" ibaresi; Yorumsuz'da "KURGU" rozeti.
// Veri: canli.ts tribunKoseYazi → sunucu GET /c/tribun/kose/yazi?id=. Geri: Tribün'e döner (app/canli.tsx koseGeri).
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { yazi } from '@/tema/tema';
import * as C from '@/canli';
import type { KoseKisa, KoseYazi } from '@/canli';
import { Bas, Ikon } from './ortak';
import { useCanli } from './baglam';
import { K, KoseAvatar, TribunGeri } from './TribunPortal';

const MAKS_GENISLIK = 720;
const AY = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
// "24 Eki · 09:07" (Türkiye saati: UTC+3, yaz saati yok)
export function koseTarih(ms: number) {
  if (!ms) return '';
  const d = new Date(ms + 3 * 3600000);
  return `${d.getUTCDate()} ${AY[d.getUTCMonth()]} · ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

export function TribunKoseYazisi({ id, geri }: { id: string; geri: () => void }) {
  const c = useCanli();
  const ust = useSafeAreaInsets().top;
  const pay = Platform.OS === 'web' ? 0 : ust;
  const [yz, yzAyarla] = useState<KoseYazi | null>(null);
  const [durum, durumAyarla] = useState<'yukleniyor' | 'hata' | 'yok' | 'tamam'>('yukleniyor');
  const istekNo = useRef(0);
  const kaydirma = useRef<ScrollView>(null);

  const yukle = useCallback(() => {
    const no = ++istekNo.current;
    durumAyarla('yukleniyor');
    C.tribunKoseYazi(id).then((r) => {
      if (no !== istekNo.current) return;
      if (r.ok) { yzAyarla(r.veri); durumAyarla('tamam'); }
      else durumAyarla(r.durum === 404 ? 'yok' : 'hata');
    });
  }, [id]);
  useEffect(() => {
    yzAyarla(null);
    yukle();
    kaydirma.current?.scrollTo({ y: 0, animated: false });
    return () => { istekNo.current++; };
  }, [yukle]);

  const y = yz?.yazarBilgi;
  const renk = y?.renk || K.vurgu;

  return (
    <View style={s.kok}>
      <StatusBar style="light" />
      <View style={s.sutun}>
        <View style={[s.ust, { paddingTop: 8 + pay }]}>
          <TribunGeri onPress={geri} etiket="Geri, Tribün'e dön" />
          {y ? (
            <View style={s.yazar} accessible accessibilityLabel={`${y.ad}, ${y.rol}. Yapay zekâ yorumcu`}>
              <KoseAvatar ad={y.ad} renk={renk} boyut={36} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={s.yazarAd} numberOfLines={1}>{y.ad}</Text>
                <Text style={s.yazarRol} numberOfLines={1}>{y.rol} · yapay zekâ yorumcu</Text>
              </View>
            </View>
          ) : (
            <Text style={s.yazarRol}>Yorumcular</Text>
          )}
        </View>

        {!yz ? (
          <View style={s.merkez}>
            {durum === 'yukleniyor' ? (
              <ActivityIndicator color={K.vurgu} accessibilityLabel="Yükleniyor" />
            ) : durum === 'yok' ? (
              <>
                <Text style={s.bosYazi}>Bu yazı artık yok</Text>
                <Bas onPress={geri} etiket="Tribün'e dön" style={s.tekrar}><Text style={s.tekrarYazi}>Tribün'e dön</Text></Bas>
              </>
            ) : (
              <Bas onPress={yukle} etiket="Bağlantı sorunu, tekrar dene" style={s.tekrar}><Text style={s.tekrarYazi}>Bağlantı sorunu, tekrar dene</Text></Bas>
            )}
          </View>
        ) : (
          <ScrollView ref={kaydirma} style={{ flex: 1 }} contentContainerStyle={s.icerik} showsVerticalScrollIndicator={false}>
            {yz.kurgu && (
              <View style={s.kurgu} accessible accessibilityLabel="Kurgu: bu yazıdaki anlatılanlar gerçekte yaşanmadı">
                <Text style={s.kurguYazi}>KURGU</Text>
              </View>
            )}
            <Text style={s.baslik} accessibilityRole="header">{yz.baslik}</Text>
            <Text style={s.tarih}>{koseTarih(yz.zaman)}</Text>
            {yz.etiketler.length > 0 && (
              <View style={s.etiketler}>
                {yz.etiketler.map((e) => (
                  <View key={e} style={s.etiket}><Text style={s.etiketYazi}>{e}</Text></View>
                ))}
              </View>
            )}
            <View style={s.metin}>
              {yz.metin.split(/\n+/).filter(Boolean).map((p, i) => (
                <Text key={i} selectable style={s.paragraf}>{p}</Text>
              ))}
            </View>
            {yz.kurgu && <Text style={s.not}>Bu yazı kurgudur: anlatılanlar gerçekte yaşanmadı. Yalnız başlangıçtaki sonuç gerçektir.</Text>}
            {yz.ilgiliMac && (
              <Bas onPress={() => c.git({ tur: 'tribunDetay', lig: yz.ilgiliMac!.lig, id: yz.ilgiliMac!.id })} etiket="Maçı aç" rol="link" style={s.macDugme}>
                <Text style={s.macYazi}>Maçı aç</Text>
                <Ikon ad="ok" boyut={16} renk={K.zemin} kalinlik={2.4} />
              </Bas>
            )}
            <Text style={s.not}>Yapay zekâ yorumcu: yazı gerçek maç verileriyle otomatik hazırlanır, görüş niteliğindedir.</Text>

            {yz.digerleri.length > 0 && (
              <View style={s.diger}>
                <Text style={s.digerBaslik}>{(y?.ad ?? 'Yazarın').toLocaleUpperCase('tr-TR')} · DİĞER YAZILAR</Text>
                <View style={s.digerKutu}>
                  {yz.digerleri.map((d: KoseKisa, i) => (
                    <Bas key={d.id} onPress={() => c.git({ tur: 'tribunKose', id: d.id })} etiket={`${d.baslik}. ${koseTarih(d.zaman)}. Yazıyı aç`} rol="link" style={[s.digerSatir, i > 0 && { borderTopWidth: 1, borderTopColor: K.cizgi }]}>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={s.digerYazi} numberOfLines={2}>{d.baslik}</Text>
                        <Text style={s.digerTarih}>{koseTarih(d.zaman)}{d.kurgu ? ' · KURGU' : ''}</Text>
                      </View>
                      <Ikon ad="ok" boyut={16} renk={K.soluk} kalinlik={2} />
                    </Bas>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  kok: { flex: 1, backgroundColor: K.zemin },
  sutun: { flex: 1, width: '100%', maxWidth: MAKS_GENISLIK, alignSelf: 'center' },
  merkez: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 20 },
  bosYazi: { fontFamily: yazi.orta, fontSize: 14, color: K.soluk, textAlign: 'center' },
  tekrar: { minHeight: 44, paddingHorizontal: 20, borderRadius: 12, backgroundColor: K.vurgu, alignItems: 'center', justifyContent: 'center' },
  tekrarYazi: { fontFamily: yazi.kalin, fontSize: 14.5, color: K.zemin },
  ust: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: K.cizgi },
  yazar: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 0 },
  yazarAd: { fontFamily: yazi.kalin, fontSize: 16, lineHeight: 20, color: K.yazi },
  yazarRol: { fontFamily: yazi.orta, fontSize: 12, color: K.soluk },
  icerik: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 28, gap: 12 },
  kurgu: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 6, backgroundColor: K.mor },
  kurguYazi: { fontFamily: yazi.kalin, fontSize: 11, letterSpacing: 0.8, color: K.zemin },
  baslik: { fontFamily: yazi.darKalin, fontSize: 30, lineHeight: 32, color: K.yazi },
  tarih: { fontFamily: yazi.orta, fontSize: 12.5, color: K.soluk },
  etiketler: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  etiket: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1, borderColor: K.cizgi2, backgroundColor: K.kart },
  etiketYazi: { fontFamily: yazi.kalin, fontSize: 11.5, color: K.orta },
  metin: { gap: 14, marginTop: 4 },
  paragraf: { fontFamily: yazi.normal, fontSize: 16, lineHeight: 24.8, color: K.yazi },
  not: { fontFamily: yazi.normal, fontSize: 12, lineHeight: 17, color: K.soluk },
  macDugme: { alignSelf: 'flex-start', minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, borderRadius: 12, backgroundColor: K.vurgu },
  macYazi: { fontFamily: yazi.kalin, fontSize: 14.5, color: K.zemin },
  diger: { marginTop: 10, gap: 8 },
  digerBaslik: { fontFamily: yazi.kalin, fontSize: 11, letterSpacing: 0.4, color: K.soluk },
  digerKutu: { borderRadius: 14, backgroundColor: K.kart, borderWidth: 1, borderColor: K.cizgi, overflow: 'hidden' },
  digerSatir: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 56, paddingHorizontal: 12, paddingVertical: 8 },
  digerYazi: { fontFamily: yazi.orta, fontSize: 14, lineHeight: 18, color: K.yazi },
  digerTarih: { fontFamily: yazi.normal, fontSize: 11.5, color: K.soluk, marginTop: 2 },
});
