// Bildirimler (zil): toplanmış satırlar ("mavi ve 4 kişi beğendi"); açılınca okundu sayılır.
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { yazi } from '@/tema/tema';
import * as C from '@/canli';
import type { Zil as ZilOge } from '@/canli';
import { Avatar, Bas, Belir, Dugme, Ikon, useRenk, type IkonAd } from './ortak';
import { useCanli } from './baglam';
import { UstBaslik } from './Duzen';
import { RozetGorsel } from './rozetGorsel';
import { YuzBalon } from './balon';

const TUR: Record<ZilOge['tur'], { ikon: IkonAd; fiil: string; renk: (R: ReturnType<typeof useRenk>) => string }> = {
  begeni: { ikon: 'kalp', fiil: 'gönderini beğendi', renk: (R) => R.kalp },
  yorum_begeni: { ikon: 'kalp', fiil: 'yorumunu beğendi', renk: (R) => R.kalp },
  yorum: { ikon: 'yorum', fiil: 'yorum yaptı', renk: (R) => R.vurgu },
  cevap: { ikon: 'yorum', fiil: 'sana cevap verdi', renk: (R) => R.vurgu },
  takip: { ikon: 'kisi', fiil: 'seni takip etti', renk: (R) => R.yesil },
  dizi: { ikon: 'tik', fiil: 'yeni bölüm', renk: (R) => R.vurgu },
  mesaj_istek: { ikon: 'mesaj', fiil: 'sana mesaj isteği gönderdi', renk: (R) => R.vurgu },
  mesaj: { ikon: 'mesaj', fiil: 'sana yazdı', renk: (R) => R.vurgu },
  anma: { ikon: 'yorum', fiil: 'seni etiketledi', renk: (R) => R.vurgu },
  rozet: { ikon: 'yildiz', fiil: 'rozet', renk: (R) => R.altin },
  tribun: { ikon: 'bayrak', fiil: 'Tribün', renk: (R) => R.kalp },
};

export function Zil({ geri }: { geri?: () => void }) {
  const R = useRenk();
  const c = useCanli();
  const [liste, listeAyarla] = useState<ZilOge[] | null>(null);
  const girisli = !!c.uye && !c.uye.yeni;
  useEffect(() => {
    if (!girisli) return;
    let iptal = false;
    C.zilGetir().then((r) => {
      if (iptal) return;
      listeAyarla(r.ok ? r.veri.liste : []);
      if (r.ok && r.veri.okunmamis > 0) setTimeout(() => C.zilOkundu().then(() => c.zilSayiAyarla(0)), 1200);
    });
    return () => {
      iptal = true;
    };
  }, [girisli]);

  return (
    <View style={{ flex: 1 }}>
      <UstBaslik baslik="Yankı" geri={geri} />
      {!girisli ? (
        <View style={s.bos}>
          <YuzBalon ad="utangac" boyut={76} />
          <Text style={[s.bosBaslik, { color: R.murekkep }]}>Bildirimlerin burada.</Text>
          <Text style={[s.bosAlt, { color: R.soluk }]}>Beğeni, yorum, takip: hepsi burada.</Text>
          <Dugme yazi="Giriş yap" tur="acik" onPress={() => c.girisIste('Bildirimler için giriş yap', () => {})} style={{ marginTop: 8 }} />
        </View>
      ) : liste === null ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={R.vurgu} />
      ) : liste.length === 0 ? (
        <View style={s.bos}>
          <YuzBalon ad="kikir" boyut={76} />
          <Text style={[s.bosBaslik, { color: R.murekkep }]}>Henüz sessiz.</Text>
          <Text style={[s.bosAlt, { color: R.soluk }]}>Bir şey paylaş, bildirimler gelsin.</Text>
          <Dugme yazi="Gönderi yaz" tur="acik" ikon="kalem" onPress={c.yaziciAc} style={{ marginTop: 8 }} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
          {liste.map((z, i) => {
            const t = TUR[z.tur];
            const ilk = z.kisiler[0] ?? 'Biri';
            const diger = Math.max(0, z.sayi - 1);
            const hedef = z.hedef;
            return (
              <Belir key={z.id} gecikme={i * 40}>
                <Bas
                  onPress={() => ((z.tur === 'tribun' || z.tribunMac) && hedef ? c.git({ tur: 'tribunMac', id: hedef }) : z.tur === 'rozet' && c.uye ? c.git({ tur: 'profil', ad: c.uye.ad }) : z.tur === 'mesaj' && z.sayi === 1 && ilk === 'yazsammi' ? c.git({ tur: 'sohbet', id: C.MARKA_SOHBET }) : z.tur === 'mesaj' || z.tur === 'mesaj_istek' ? c.git({ tur: 'mesajlar', sekme: z.tur === 'mesaj_istek' ? 'istek' : 'sohbet' }) : hedef ? c.git({ tur: 'gonderi', id: hedef }) : c.git({ tur: 'profil', ad: ilk }))}
                  style={[s.satir, { borderBottomColor: R.ince }, !z.okundu && { backgroundColor: R.vurguYumusak }]}
                  hoverRenk={R.hover}
                  rol="link"
                >
                  <View style={[s.turIkon, { backgroundColor: t.renk(R) }]}>
                    <Ikon ad={t.ikon} boyut={15} renk="#fff" dolu={z.tur === 'begeni' || z.tur === 'yorum_begeni'} kalinlik={2.4} />
                  </View>
                  <View style={{ flex: 1, gap: 6 }}>
                    <View style={s.yuzler}>
                      {z.tur === 'rozet' && (z.rozetler ?? []).slice(0, 5).map((x, j) => (
                        <View key={x.r + j} style={{ marginLeft: j ? -4 : 0 }}>
                          <RozetGorsel r={x.r} s={x.s} mini boyut={36} />
                        </View>
                      ))}
                      {z.tur !== 'rozet' && z.kisiler.slice(0, 5).map((k, j) => (
                        <View key={k + j} style={{ marginLeft: j ? -6 : 0 }}>
                          <Avatar yazar={{ uid: k === 'yazsammi' ? 'marka' : `u_${k}`, ad: k, marka: k === 'yazsammi' }} boyut={30} halka={R.panel} />
                        </View>
                      ))}
                    </View>
                    <Text style={[s.metin, { color: R.murekkep }]}>
                      {z.tur === 'rozet' ? null : <Text style={{ fontFamily: yazi.kalin }}>{ilk === 'yazsammi' ? 'Yazsam mı?' : ilk}</Text>}
                      {z.tur === 'rozet' ? '' : z.baslik ? ' · ' : diger > 0 ? ` ve ${diger} kişi ` : ' '}
                      {z.baslik || t.fiil}
                      <Text style={{ color: R.soluk }}>{' · '}{C.zamanOnce(z.zaman)}</Text>
                    </Text>
                    {!!z.ozet && (
                      <Text style={[s.ozet, { color: R.soluk }]} numberOfLines={2}>
                        {z.ozet}
                      </Text>
                    )}
                  </View>
                  {!z.okundu && <View style={[s.nokta, { backgroundColor: R.vurgu }]} />}
                </Bas>
              </Belir>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  satir: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  turIkon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 0 },
  yuzler: { flexDirection: 'row' },
  metin: { fontFamily: yazi.normal, fontSize: 15, lineHeight: 21 },
  ozet: { fontFamily: yazi.normal, fontSize: 14, lineHeight: 19 },
  nokta: { width: 9, height: 9, borderRadius: 5, marginTop: 10 },
  bos: { alignItems: 'center', gap: 6, paddingVertical: 60, paddingHorizontal: 30 },
  bosBaslik: { fontFamily: yazi.kalin, fontSize: 21, marginTop: 8 },
  bosAlt: { fontFamily: yazi.normal, fontSize: 15, textAlign: 'center' },
});
