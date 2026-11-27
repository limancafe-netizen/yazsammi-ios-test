// Tribün Muhabiri — ACİL YEDEK (plan/33, Onur 09.10 kararı): normal kullanıcıya hiç görünmez; kurucuda da yalnız maç oynanırken ve TÜM otomatik veri
// kaynakları ≥3 dk susmuşken açılır. Buradan girilen hiçbir şey doğrudan yayınlanmaz, skoru değiştirmez, odaya/akışa düşmez, karakteri konuşturmaz:
// giriş önce "doğrulanmamış" kalır; kaynak geri gelip aynı olayı (aynı takım/tür, ±3 dk) görürse ya da Gemini tek tetik teyidi gelirse yayınlanır.
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { yazi } from '@/tema/tema';
import * as C from '@/canli';
import type { TribunOda, TribunTaraf } from '@/canli';
import { Bas, Ikon, useRenk } from './ortak';
import { useCanli } from './baglam';
import { TakimRozeti, sa, yaziRengi } from './tribunOrtak';

const AD: Record<string, string> = { gol: 'Gol', sari: 'Sarı kart', kirmizi: 'Kırmızı kart', penalti: 'Penaltı', devre: 'Devre arası', ikinci_yari: 'İkinci yarı', bitti: 'Maç bitti', basladi: 'Maç başladı' };
const DURUM_AD: Record<string, string> = { bekliyor: 'Teyit bekliyor — kimse görmüyor', teyitli: 'Teyitli — yayınlandı', teyitsiz: 'Teyitsiz kaldı — yayınlanmadı', geri_alindi: 'Geri alındı' };

export function MuhabirPaneli({ oda, yenile }: { oda: TribunOda; yenile: () => void }) {
  const R = useRenk();
  const c = useCanli();
  const m = oda.mac;
  const [mesgul, mesgulAyarla] = useState<string | null>(null);
  const [son, sonAyarla] = useState<string>('');
  const oynaniyor = !!m.oynaniyor && !!oda.acilYedek;

  const bas = (tur: string, takim?: TribunTaraf | null) => {
    if (mesgul || !oynaniyor) return;
    mesgulAyarla(`${tur}${takim ?? ''}`);
    C.tribunMuhabirOlay(m.id, tur, takim).then((r) => {
      mesgulAyarla(null);
      if (r.ok) { sonAyarla(`${AD[tur] ?? tur}${takim ? ` · ${takim === 'ev' ? m.ev.kisa : m.dep.kisa}` : ''} kaydedildi, teyit bekliyor (yayınlanmadı)`); yenile(); }
      else c.tost(r.hata === 'olmadi' ? 'Bu şu an olmaz (çift dokunma ya da yanlış sıra)' : C.hataYazisi(r.hata, r.durum));
    });
  };
  const geriAl = (id: string) => {
    mesgulAyarla('geri' + id);
    C.tribunMuhabirGeriAl(m.id, id).then((r) => {
      mesgulAyarla(null);
      if (!r.ok) c.tost(r.hata === 'yalniz_sonuncu' ? 'Bu giriş artık geri alınamaz' : C.hataYazisi(r.hata, r.durum));
      else { sonAyarla('Giriş geri alındı'); yenile(); }
    });
  };

  const sonrakiDurum = m.durum === 'oncesi' ? 'basladi' : m.durum === 'devre' ? 'ikinci_yari' : m.durum === 'canli' ? (m.yari === 2 ? 'bitti' : 'devre') : null;
  const canli = m.durum === 'canli' || m.durum === 'devre';
  const takimKol = (t: TribunTaraf) => {
    const tk = t === 'ev' ? m.ev : m.dep;
    const yaziR = yaziRengi(tk.renk, tk.renk2);
    return (
      <View style={s.kol}>
        <View style={s.kolUst}><TakimRozeti t={tk} boyut={34} /><Text style={[s.kolAd, { color: R.murekkep }]} numberOfLines={1}>{tk.ad}</Text></View>
        <Bas onPress={() => bas('gol', t)} devre={!oynaniyor || !canli} etiket={`Gol ${tk.ad}`} style={[s.gol, { backgroundColor: tk.renk, borderColor: tk.renk2 }]}>
          {mesgul === `gol${t}` ? <ActivityIndicator color={yaziR} /> : <Text style={[s.golYazi, { color: yaziR }]}>GOL</Text>}
        </Bas>
        <View style={s.ikili}>
          <Bas onPress={() => bas('sari', t)} devre={!oynaniyor || !canli} etiket={`Sarı kart ${tk.ad}`} style={[s.kart, { backgroundColor: R.ust, borderColor: R.cizgi }]}><View style={[s.kartIk, { backgroundColor: '#FFD23F' }]} /><Text style={[s.kartYazi, { color: R.murekkep }]}>Sarı</Text></Bas>
          <Bas onPress={() => bas('kirmizi', t)} devre={!oynaniyor || !canli} etiket={`Kırmızı kart ${tk.ad}`} style={[s.kart, { backgroundColor: R.ust, borderColor: R.cizgi }]}><View style={[s.kartIk, { backgroundColor: '#FF3B3B' }]} /><Text style={[s.kartYazi, { color: R.murekkep }]}>Kırmızı</Text></Bas>
        </View>
        <Bas onPress={() => bas('penalti', t)} devre={!oynaniyor || !canli} etiket={`Penaltı ${tk.ad}`} style={[s.penalti, { backgroundColor: R.ust, borderColor: R.cizgi }]}><Text style={[s.kartYazi, { color: R.murekkep }]}>Penaltı</Text></Bas>
      </View>
    );
  };

  return (
    <View style={{ gap: 12 }}>
      <View style={[s.baslik, { backgroundColor: R.altinYumusak }]}>
        <Ikon ad="mikrofon" boyut={18} renk={R.altinYazi} kalinlik={2} />
        <View style={{ flex: 1 }}>
          <Text style={[s.baslikAd, { color: R.altinYazi }]}>Acil yedek</Text>
          <Text style={[s.baslikAlt, { color: R.soluk }]}>Veri kaynağı sustuğunda yedek; teyitsiz yayınlanmaz.</Text>
        </View>
      </View>
      <View style={[s.uyari, { backgroundColor: sa(R.kalem, 0.1), borderColor: sa(R.kalem, 0.35) }]}>
        <Text style={[s.uyariYazi, { color: R.murekkep }]}>Girdiğin her şey önce “doğrulanmamış” kalır: skoru değiştirmez, odaya ve akışa düşmez, Yazsam mı? konuşmaz. Veri kaynağı geri gelip aynı olayı görürse (3 dakika içinde, aynı takım) yayınlanır; görmezse kimse görmeden kalır.</Text>
      </View>

      {sonrakiDurum && (
        <Bas onPress={() => bas(sonrakiDurum)} devre={!oynaniyor} etiket={AD[sonrakiDurum]} style={[s.durum, { backgroundColor: oynaniyor ? R.vurgu : R.ince }]}>
          {mesgul === sonrakiDurum ? <ActivityIndicator color="#fff" /> : <Text style={s.durumYazi}>{sonrakiDurum === 'basladi' ? 'Maç başladı' : sonrakiDurum === 'devre' ? 'Devre arası' : sonrakiDurum === 'ikinci_yari' ? 'İkinci yarı başladı' : 'Maç bitti'}</Text>}
        </Bas>
      )}

      <View style={s.ikiKol}>{takimKol('ev')}{takimKol('dep')}</View>

      {!!oda.girisler?.length && (
        <View style={[s.blok, { backgroundColor: R.panel, borderColor: R.ince }]}>
          <Text style={[s.blokBaslik, { color: R.soluk }]}>GİRİŞLERİN</Text>
          {oda.girisler.map((g) => (
            <View key={g.id} style={s.oneriSatir}>
              <Text style={[s.oneriYazi, { color: R.murekkep }]}>{g.dk ? `${g.dk}’ · ` : ''}{AD[g.tur] ?? g.tur}{g.takim ? ` · ${g.takim === 'ev' ? m.ev.kisa : m.dep.kisa}` : ''}</Text>
              <Text style={[s.durumEtiket, { color: g.durum === 'teyitli' ? R.yesil : R.soluk }]}>{DURUM_AD[g.durum] ?? g.durum}</Text>
              {g.durum === 'bekliyor' && <Bas onPress={() => geriAl(g.id)} devre={mesgul === 'geri' + g.id} etiket="Geri al" style={[s.mini, { backgroundColor: R.ust, borderWidth: 1, borderColor: R.cizgi }]}><Text style={[s.miniYazi, { color: R.murekkep }]}>Geri al</Text></Bas>}
            </View>
          ))}
        </View>
      )}
      {!!son && <Text style={[s.son, { color: R.yesil }]}>✓ {son}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  baslik: { flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: 18, padding: 14 },
  baslikAd: { fontFamily: yazi.kalin, fontSize: 15 },
  baslikAlt: { fontFamily: yazi.normal, fontSize: 12.5, lineHeight: 17, marginTop: 1 },
  uyari: { borderRadius: 14, borderWidth: 1, padding: 12 },
  uyariYazi: { fontFamily: yazi.orta, fontSize: 13.5, lineHeight: 19 },
  ikiKol: { flexDirection: 'row', gap: 12 },
  kol: { flex: 1, gap: 8, minWidth: 0 },
  kolUst: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kolAd: { fontFamily: yazi.kalin, fontSize: 14, flex: 1 },
  gol: { height: 74, borderRadius: 20, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  golYazi: { fontFamily: yazi.marka, fontSize: 24, letterSpacing: -0.5 },
  ikili: { flexDirection: 'row', gap: 8 },
  kart: { flex: 1, height: 52, borderRadius: 16, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  penalti: { height: 48, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  kartIk: { width: 14, height: 19, borderRadius: 3 },
  kartYazi: { fontFamily: yazi.kalin, fontSize: 14 },
  vYazi: { fontFamily: yazi.marka, fontSize: 14 },
  durum: { height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  durumYazi: { fontFamily: yazi.kalin, fontSize: 17, color: '#fff' },
  bitti: { fontFamily: yazi.normal, fontSize: 13.5, textAlign: 'center' },
  blok: { borderRadius: 18, borderWidth: 1.5, padding: 14, gap: 9 },
  blokBaslik: { fontFamily: yazi.kalin, fontSize: 10.5, letterSpacing: 1 },
  durumEtiket: { fontFamily: yazi.orta, fontSize: 12.5 },
  oneriSatir: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  oneriYazi: { fontFamily: yazi.orta, fontSize: 14, flex: 1, minWidth: 140 },
  mini: { height: 38, borderRadius: 12, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  miniYazi: { fontFamily: yazi.kalin, fontSize: 13.5, color: '#fff' },
  sonYazi: { fontFamily: yazi.kalin, fontSize: 15 },
  adSatir: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  adGiris: { flex: 1, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, height: 40, justifyContent: 'center' },
  adYazi: { fontFamily: yazi.normal, fontSize: 14.5 },
  son: { fontFamily: yazi.orta, fontSize: 13, textAlign: 'center' },
});
