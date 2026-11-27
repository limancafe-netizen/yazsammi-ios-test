// KULLANILMIYOR (04.11.2026): eski KAHİN astroloji/tarot ekranı. Astroloji ve Tarot Kart Analizi artık sitenin /astroloji/ ve /tarot/ sayfaları,
// uygulamada WebView ile (bilesenler/canli/SiteBolumu.native.tsx); hiçbir ekran bu dosyayı içe aktarmıyor. Kod başvuru için duruyor, silinmedi.
// Burçlar: 12 burç ızgarası + günlük/haftalık yorum (sunucuda günde bir kez üretilir, ücretsiz). Kullanıcının Güneş burcu önceden seçili.
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import * as C from '@/canli';
import { useCanli } from '@/bilesenler/canli/baglam';
import { yazi } from '@/tema/tema';
import { BURC_SEMBOL } from './HaritaCark';
import { ALTIN, Cerceve, Dugme, SOLUK, YAZI } from './ortak';
import { YASAL_IBARE } from '@/kahin/yasal';

export function BurclarEkrani({ geri, benimBurc, tarotaGec }: { geri: () => void; benimBurc: string | null; tarotaGec: (soru: string) => void }) {
  const c = useCanli();
  const [burclar, burclarAyarla] = useState<C.AstroBurc[]>([]);
  const [no, noAyarla] = useState(1);
  const [tur, turAyarla] = useState<'gunluk' | 'haftalik'>('gunluk');
  const [yorum, yorumAyarla] = useState<C.AstroBurcYorum | null>(null);
  const [yuk, yukAyarla] = useState(true);
  const [hata, hataAyarla] = useState(false);
  useEffect(() => {
    C.astroDurum().then((d) => { if (d.ok) { burclarAyarla(d.veri.burclar); const b = d.veri.burclar.find((x) => x.ad === benimBurc); if (b) noAyarla(b.no); } });
  }, [benimBurc]);
  useEffect(() => {
    let iptal = false;
    yukAyarla(true); hataAyarla(false); yorumAyarla(null);
    C.astroBurcGetir(no, tur).then((r) => { if (iptal) return; yukAyarla(false); if (r.ok) yorumAyarla(r.veri); else hataAyarla(true); });
    return () => { iptal = true; };
  }, [no, tur]);
  const b = burclar.find((x) => x.no === no);
  return (
    <Cerceve baslik="Burçlar" alt="Günlük ve haftalık yorum" geri={geri}>
      <View style={s.izgara}>
        {burclar.map((x) => (
          <Pressable key={x.no} onPress={() => noAyarla(x.no)} accessibilityRole="button" accessibilityState={{ selected: x.no === no }} accessibilityLabel={x.ad} style={[s.kutu, x.no === no && s.kutuSecili]}>
            <Text style={[s.sembol, x.no === no && { color: ALTIN }]}>{BURC_SEMBOL[x.no - 1]}</Text>
            <Text style={s.ad}>{x.ad}</Text>
            {x.ad === benimBurc && <Text style={s.sen}>senin burcun</Text>}
          </Pressable>
        ))}
      </View>
      {b && (
        <View style={s.detay}>
          <Text style={s.dBaslik}>{BURC_SEMBOL[b.no - 1]} {b.ad}</Text>
          <Text style={s.dAlt}>{b.tarih} · {b.element} · {b.nitelik} · Yönetici: {b.yonetici}</Text>
          <View style={s.sekmeler}>
            {(['gunluk', 'haftalik'] as const).map((t) => (
              <Pressable key={t} onPress={() => turAyarla(t)} accessibilityRole="tab" accessibilityState={{ selected: tur === t }} style={[s.sekme, tur === t && s.sekmeAktif]}>
                <Text style={[s.sekmeYazi, tur === t && { color: '#1A1030' }]}>{t === 'gunluk' ? 'Günlük' : 'Haftalık'}</Text>
              </Pressable>
            ))}
          </View>
          {yuk ? (
            <View style={{ paddingVertical: 28, alignItems: 'center' }}><ActivityIndicator color={ALTIN} /><Text style={[s.dAlt, { marginTop: 8 }]}>KAHİN gökyüzüne bakıyor…</Text></View>
          ) : hata || !yorum ? (
            <Text style={s.metin}>Bu yorum şu an hazır değil; birazdan tekrar dene.</Text>
          ) : (
            <>
              <Text style={s.tema}>{yorum.tema}</Text>
              <Text style={s.metin}>{yorum.metin}</Text>
              <View style={s.anahtarlar}>{yorum.anahtar.map((k) => <View key={k} style={s.anahtar}><Text style={s.anahtarYazi}>{k}</Text></View>)}</View>
              <Text style={s.tarih}>{tur === 'gunluk' ? 'Bugün' : 'Bu hafta'} · {yorum.tarih}</Text>
            </>
          )}
          <Dugme yazi={`${b.ad} için kartlara sor`} onPress={() => tarotaGec(`${b.ad} burcu olarak ${tur === 'gunluk' ? 'bugün' : 'bu hafta'} neye dikkat etmeliyim?`)} />
        </View>
      )}
      <Text style={s.eglence}>{YASAL_IBARE}</Text>
    </Cerceve>
  );
}

const s = StyleSheet.create({
  izgara: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kutu: { width: '31.5%', backgroundColor: 'rgba(30,20,52,0.9)', borderRadius: 14, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(237,233,246,0.1)' },
  kutuSecili: { borderColor: ALTIN, backgroundColor: 'rgba(60,40,96,0.95)' },
  sembol: { fontSize: 26, color: YAZI, fontFamily: yazi.kalin },
  ad: { fontFamily: yazi.kalin, fontSize: 14, color: YAZI, marginTop: 2 },
  sen: { fontFamily: yazi.orta, fontSize: 10.5, color: ALTIN, marginTop: 1 },
  detay: { marginTop: 16, backgroundColor: 'rgba(30,20,52,0.9)', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(242,193,78,0.3)' },
  dBaslik: { fontFamily: yazi.marka, fontSize: 22, color: ALTIN },
  dAlt: { fontFamily: yazi.normal, fontSize: 12.5, color: SOLUK, marginTop: 2 },
  sekmeler: { flexDirection: 'row', gap: 8, marginTop: 14, marginBottom: 12 },
  sekme: { flex: 1, height: 40, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(237,233,246,0.25)', alignItems: 'center', justifyContent: 'center' },
  sekmeAktif: { backgroundColor: ALTIN, borderColor: ALTIN },
  sekmeYazi: { fontFamily: yazi.kalin, fontSize: 14.5, color: YAZI },
  tema: { fontFamily: yazi.kalem, fontSize: 26, color: ALTIN, marginBottom: 4 },
  metin: { fontFamily: yazi.normal, fontSize: 15.5, lineHeight: 23, color: YAZI },
  anahtarlar: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 10 },
  anahtar: { borderRadius: 999, borderWidth: 1, borderColor: 'rgba(242,193,78,0.5)', paddingHorizontal: 10, paddingVertical: 4 },
  anahtarYazi: { fontFamily: yazi.orta, fontSize: 12, color: ALTIN },
  tarih: { fontFamily: yazi.normal, fontSize: 12, color: SOLUK, marginTop: 10, marginBottom: 4 },
  eglence: { fontFamily: yazi.normal, fontSize: 12, color: SOLUK, textAlign: 'center', marginTop: 16, fontStyle: 'italic' },
});
