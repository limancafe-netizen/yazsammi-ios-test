// "Balonunu düzenle" penceresi (08.10 Balon Kimliği; taslak plan/23_MENU_PROFIL_TASARIM/profil.js Y.sayfalar.kimlik):
// üstte önizleme (duvar + büyük balon + ad + "Şekil · Renk · Yüz"), altında Şekil · Renk · Yüz ifadesi · Duvar sıraları ve Kaydet.
// Kaydet → sunucu /c/balon → oturumdaki üye güncellenir → pencere kapanır → profil yeniden yüklenir.
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { yazi } from '@/tema/tema';
import * as C from '@/canli';
import type { BalonKimlik } from '@/canli';
import { BalonAvatar, Duvar, DUVARLAR, ONCU_DUVAR, ONCU_RENK, RENKLER, SEKIL_ADLARI, YUZ_ADLARI } from './balon';
import { Bas, Pencere, useRenk } from './ortak';
import { useCanli } from './baglam';

/** Vurgu renginin üstündeki yazı: açık vurgulu dönemde (Lavanta gece) koyu, diğerlerinde beyaz. */
export function vurguYazi(zemin: string) {
  const n = parseInt(zemin.replace('#', '').slice(0, 6), 16);
  if (isNaN(n)) return '#fff';
  const l = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return l > 0.6 ? '#16112A' : '#fff';
}

export const kimlikOzet = (k: BalonKimlik) => `${SEKIL_ADLARI[k.s] ?? 'Klasik'} · ${(RENKLER[k.r] ?? RENKLER.mercan)[1]} · ${YUZ_ADLARI[k.y] ?? 'Mutlu'}`;

export function BalonDuzenle({ acik, kapat, ad, kimlik, duvar, duvaraGit, kaydedildi }: { acik: boolean; kapat: () => void; ad: string; kimlik: BalonKimlik; duvar: string; duvaraGit?: boolean; kaydedildi?: () => void }) {
  const R = useRenk();
  const c = useCanli();
  const [k, kAyarla] = useState<BalonKimlik>(kimlik);
  const [dv, dvAyarla] = useState(duvar);
  const [bekliyor, bekliyorAyarla] = useState(false);
  const [onG, onGAyarla] = useState(0);
  const kaydir = useRef<ScrollView>(null);
  const duvarY = useRef(0);

  // Her açılışta kayıtlı seçimden başlar.
  useEffect(() => {
    if (!acik) return;
    kAyarla(kimlik);
    dvAyarla(DUVARLAR[duvar] ? duvar : 'gece');
    bekliyorAyarla(false);
  }, [acik]);
  // "Duvarı değiştir"den açıldıysa Duvar sırasına kaydır.
  useEffect(() => {
    if (!acik || !duvaraGit) return;
    const t = setTimeout(() => kaydir.current?.scrollTo({ y: Math.max(0, duvarY.current - 12), animated: true }), 320);
    return () => clearTimeout(t);
  }, [acik, duvaraGit]);

  const kaydet = async () => {
    bekliyorAyarla(true);
    const r = await C.balonKaydet({ balonSekil: k.s, balonRenk: k.r, balonYuz: k.y, duvar: dv });
    bekliyorAyarla(false);
    if (!r.ok) return c.tost(C.hataYazisi(r.hata, r.durum));
    c.uyeAyarla(r.veri);
    kapat();
    c.tost('Balonun kaydedildi');
    kaydedildi?.();
  };

  const oncu = !!c.uye?.oncu; // İnci balon + İlk Işık duvarı yalnız Öncüye açık (diğerlerine seçicide gösterilmez)
  const secili = { borderColor: R.vurgu, backgroundColor: R.vurguYumusak };
  const golge = Platform.OS === 'web' ? ({ filter: 'drop-shadow(0 6px 10px rgba(0,0,0,.35))' } as any) : null;
  return (
    <Pencere acik={acik} kapat={kapat} genislik={520} baslik="Balonunu düzenle">
      <ScrollView ref={kaydir} style={{ flexShrink: 1 }} contentContainerStyle={s.icerik} showsVerticalScrollIndicator={false}>
        {/* Önizleme */}
        <View style={s.onizleme} onLayout={(e) => onGAyarla(e.nativeEvent.layout.width)}>
          {onG > 0 && (
            <View style={StyleSheet.absoluteFill}>
              <Duvar ad={dv} genislik={onG} yukseklik={150} />
            </View>
          )}
          <LinearGradient colors={['rgba(8,5,18,0)', 'rgba(8,5,18,0.42)']} locations={[0.25, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
          <View style={[s.onAv, golge]}>
            <BalonAvatar kimlik={k} boyut={96} />
          </View>
          <View style={s.onAd}>
            <Text numberOfLines={1} style={s.onAdYazi}>{ad}</Text>
            <Text numberOfLines={1} style={s.onAlt}>{kimlikOzet(k)}</Text>
          </View>
        </View>

        <Text style={[s.baslik, { color: R.soluk }]}>Şekil</Text>
        <View style={s.sira}>
          {Object.keys(SEKIL_ADLARI).map((x) => (
            <Bas key={x} onPress={() => kAyarla({ ...k, s: x })} etiket={`Şekil: ${SEKIL_ADLARI[x]}`} style={[s.sec, { flex: 1, backgroundColor: R.ust }, k.s === x && secili]}>
              <BalonAvatar kimlik={{ ...k, s: x }} boyut={44} />
              <Text style={[s.secYazi, { color: R.murekkep }]}>{SEKIL_ADLARI[x]}</Text>
            </Bas>
          ))}
        </View>

        <Text style={[s.baslik, { color: R.soluk }]}>Renk</Text>
        <View style={[s.sira, { gap: 4, flexWrap: 'wrap' }]}>
          {Object.entries(RENKLER).filter(([x]) => oncu || !ONCU_RENK.includes(x)).map(([x, [hex, isim]]) => (
            <Pressable key={x} onPress={() => kAyarla({ ...k, r: x })} accessibilityRole="button" accessibilityLabel={`Renk: ${isim}`} accessibilityState={{ selected: k.r === x }} style={[s.renkKap, k.r === x && { borderColor: R.vurgu }]}>
              <View style={[s.renk, { backgroundColor: hex, borderColor: R.gece ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.12)' }]} />
            </Pressable>
          ))}
        </View>

        <Text style={[s.baslik, { color: R.soluk }]}>Yüz ifadesi · bugünkü hâlin</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.kaydir} contentContainerStyle={s.kaydirIc}>
          {Object.keys(YUZ_ADLARI).map((x) => (
            <Bas key={x} onPress={() => kAyarla({ ...k, y: x })} etiket={`Yüz: ${YUZ_ADLARI[x]}`} style={[s.sec, s.yuz, { backgroundColor: R.ust }, k.y === x && secili]}>
              <BalonAvatar kimlik={{ ...k, y: x }} boyut={40} />
              <Text numberOfLines={1} style={[s.secYazi, { color: R.murekkep }]}>{YUZ_ADLARI[x]}</Text>
            </Bas>
          ))}
        </ScrollView>

        <View onLayout={(e) => (duvarY.current = e.nativeEvent.layout.y)}>
          <Text style={[s.baslik, { color: R.soluk }]}>Duvar</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.kaydir} contentContainerStyle={s.kaydirIc}>
          {Object.entries(DUVARLAR).filter(([x]) => oncu || !ONCU_DUVAR.includes(x)).map(([x, isim]) => (
            <Bas key={x} onPress={() => dvAyarla(x)} etiket={`Duvar: ${isim}`} style={s.dv}>
              <View style={[s.dvIc, { borderColor: dv === x ? R.vurgu : 'transparent' }]}>
                <Duvar ad={x} genislik={108} yukseklik={58} />
              </View>
              <Text numberOfLines={1} style={[s.secYazi, { color: R.murekkep, alignSelf: 'flex-start' }]}>{isim}</Text>
            </Bas>
          ))}
        </ScrollView>

        <Bas onPress={kaydet} devre={bekliyor} etiket="Kaydet" style={[s.kaydet, { backgroundColor: R.vurgu }]}>
          <Text style={[s.kaydetYazi, { color: vurguYazi(R.vurgu) }]}>{bekliyor ? 'Kaydediliyor…' : 'Kaydet'}</Text>
        </Bas>
      </ScrollView>
    </Pencere>
  );
}

const s = StyleSheet.create({
  icerik: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 18 },
  onizleme: { height: 150, borderRadius: 22, overflow: 'hidden', marginBottom: 14 },
  onAv: { position: 'absolute', left: 16, bottom: 12 },
  onAd: { position: 'absolute', left: 124, right: 14, bottom: 22 },
  onAdYazi: { fontFamily: yazi.kalin, fontSize: 20, color: '#fff', textShadowColor: 'rgba(0,0,0,0.35)', textShadowRadius: 6, textShadowOffset: { width: 0, height: 1 } },
  onAlt: { fontFamily: yazi.orta, fontSize: 12.5, color: 'rgba(255,255,255,0.9)', textShadowColor: 'rgba(0,0,0,0.35)', textShadowRadius: 6, textShadowOffset: { width: 0, height: 1 } },
  baslik: { fontFamily: yazi.kalin, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, marginTop: 2 },
  sira: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  sec: { height: 80, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 5, borderWidth: 2, borderColor: 'transparent' },
  secYazi: { fontFamily: yazi.orta, fontSize: 11.5 },
  yuz: { width: 68, height: 74 },
  renkKap: { width: 46, height: 46, borderRadius: 23, borderWidth: 2.5, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  renk: { width: 36, height: 36, borderRadius: 18, borderWidth: 1 },
  kaydir: { marginHorizontal: -16, marginBottom: 12, flexGrow: 0 },
  kaydirIc: { paddingHorizontal: 16, gap: 8 },
  dv: { width: 112, gap: 5 },
  dvIc: { height: 62, borderRadius: 14, overflow: 'hidden', borderWidth: 2 },
  kaydet: { height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  kaydetYazi: { fontFamily: yazi.kalin, fontSize: 15.5 },
});
