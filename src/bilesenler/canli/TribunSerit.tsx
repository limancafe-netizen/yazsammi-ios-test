// Canlı akışın üstündeki Tribün şeridi (plan/27 §1.3, taslak ekran 3): canlı maç varsa canlı skor şeridi; odayı takip edip karar anında
// etiketlenmişsen "uygulama içi etiket şeridi" (Sence doğru karar mı? → Oyla); maça 3 saatten az varsa "oda açılacak" satırı.
// Telefon bildirimi YOK (AKTIF_KURALLAR: günde en çok 1, olaya bağlı); etiket Yankı'ya da düşer.
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { yazi } from '@/tema/tema';
import { Bas, CanliNokta, Ikon, useRenk } from './ortak';
import { useCanli } from './baglam';
import { useTribunDurum } from './bolumler';
import { TakimRozeti, saatYaz, sa } from './tribunOrtak';

export function TribunSerit() {
  const R = useRenk();
  const c = useCanli();
  const dar = useWindowDimensions().width < 440; // telefonda "Tribüne gir" yazısı sığmaz; ok yeter (şeridin tamamı dokunulur)
  const d = useTribunDurum();
  if (!d) return null;
  const git = (id: string) => c.git({ tur: 'tribunMac', id });
  if (d.etiket) {
    const e = d.etiket;
    return (
      <View style={s.kap}>
        <Bas onPress={() => git(e.mac)} etiket="Karar anına git" style={[s.kutu, { backgroundColor: R.panel, borderColor: sa(R.vurgu, 0.55) }]} hoverRenk={R.vurguYumusak}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[s.etiket, { color: R.vurgu }]}>KARAR ANI · {e.dk}’ · TRİBÜN {e.kisa}</Text>
            <Text style={[s.yazi, { color: R.murekkep }]} numberOfLines={2}><Text style={{ fontFamily: yazi.kalin }}>@{e.ad}</Text>, {e.baslik}: {e.soru}</Text>
          </View>
          <View style={[s.oyla, { backgroundColor: R.vurgu }]}><Text style={s.oylaYazi}>Oyla</Text></View>
        </Bas>
      </View>
    );
  }
  const m = d.canli[0];
  if (m) {
    return (
      <View style={s.kap}>
        <Bas onPress={() => git(m.id)} etiket={`${m.ev.ad} ${m.dep.ad} canlı skor, Tribüne gir`} style={[s.kutu, { backgroundColor: R.panel, borderColor: sa(R.kalp, 0.45) }]} hoverRenk={R.hover}>
          <CanliNokta renk={R.kalp} boyut={4} />
          <Text style={[s.canli, { color: R.kalp }]}>CANLI</Text>
          <TakimRozeti t={m.ev} boyut={26} />
          <Text style={[s.skor, { color: R.murekkep }]}>{m.skor.ev}–{m.skor.dep}</Text>
          <TakimRozeti t={m.dep} boyut={26} />
          <Text style={[s.dk, { color: R.soluk }]} numberOfLines={1}>{m.durum === 'devre' ? 'Devre arası' : `${m.dk}’`}</Text>
          <View style={{ flex: 1 }} />
          {!dar && <Text style={[s.git, { color: R.vurgu }]} numberOfLines={1}>Tribüne gir</Text>}
          <Ikon ad="ok" boyut={15} renk={R.vurgu} kalinlik={2.4} />
        </Bas>
      </View>
    );
  }
  const y = d.yaklasan;
  if (y)
    return (
      <View style={s.kap}>
        <Bas onPress={() => git(y.id)} etiket="Yaklaşan maç odası" style={[s.kutu, { backgroundColor: R.panel, borderColor: R.ince }]} hoverRenk={R.hover}>
          <TakimRozeti t={y.ev} boyut={26} />
          <TakimRozeti t={y.dep} boyut={26} />
          <Text style={[s.yazi, { color: R.murekkep, flex: 1 }]} numberOfLines={1}><Text style={{ fontFamily: yazi.kalin }}>Tribün · {saatYaz(y.baslangic)}</Text> {y.ev.kisa}–{y.dep.kisa}</Text>
          <Text style={[s.git, { color: R.vurgu }]}>{y.ben.hatirlat ? 'Hatırlatılacak' : 'Tahmin yap'}</Text>
          <Ikon ad="ok" boyut={15} renk={R.vurgu} kalinlik={2.4} />
        </Bas>
      </View>
    );
  return null;
}

const s = StyleSheet.create({
  kap: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 2 },
  kutu: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 18, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 8, minHeight: 46 },
  etiket: { fontFamily: yazi.kalin, fontSize: 10.5, letterSpacing: 0.9, marginBottom: 1 },
  yazi: { fontFamily: yazi.normal, fontSize: 13.5, lineHeight: 18 },
  oyla: { borderRadius: 999, paddingHorizontal: 16, height: 34, alignItems: 'center', justifyContent: 'center' },
  oylaYazi: { fontFamily: yazi.kalin, fontSize: 13.5, color: '#fff' },
  canli: { fontFamily: yazi.kalin, fontSize: 10.5, letterSpacing: 0.9, marginLeft: -2 },
  skor: { fontFamily: yazi.marka, fontSize: 16, letterSpacing: -0.6, fontVariant: ['tabular-nums'], flexShrink: 0 },
  dk: { fontFamily: yazi.orta, fontSize: 13, flexShrink: 1 },
  git: { fontFamily: yazi.kalin, fontSize: 13, flexShrink: 0 },
});
