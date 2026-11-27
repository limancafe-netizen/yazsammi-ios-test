// Ayarlar → "Bildirimler" bölümünün anlık bildirim kısmı: ana aç/kapa + tür başına aç/kapa (cevap, etiket, takip, mesaj, beğeni).
// Ayar sunucuda saklanır (/c/bildirim/ayar); sistem izni telefondadır. Sitede ve (google-services.json yoksa) Android'de çizilmez.
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as C from '@/canli';
import { useCanli } from '@/bilesenler/canli/baglam';
import { Bas, useRenk } from '@/bilesenler/canli/ortak';
import { yazi } from '@/tema/tema';
import { PUSH_DESTEK, izinDurumu, izinIste, sistemAyarlariniAc, type SistemIzni } from './push';
import { TUR_SATIRLARI, VARSAYILAN_AYAR, anaAcikMi, ayarCevir, type BildirimAyar } from './mantik';
import { izinKaydiYaz, jetonuKaydet } from './kayit';

export function BildirimAyarlari() {
  return PUSH_DESTEK ? <Bolum /> : null;
}

function Bolum() {
  const R = useRenk();
  const c = useCanli();
  const [sistem, sistemAyarla] = useState<SistemIzni | null>(null);
  const [ayar, ayarAyarla] = useState<BildirimAyar | null>(null);

  useEffect(() => {
    izinDurumu().then(sistemAyarla);
    C.bildirimAyarGetir().then((r) => ayarAyarla(r.ok ? ayarCevir(r.veri?.ayar) : VARSAYILAN_AYAR));
  }, []);
  if (!sistem || !ayar) return null;

  const kaydet = async (d: Partial<BildirimAyar>) => {
    const once = ayar;
    ayarAyarla({ ...ayar, ...d });
    const r = await C.bildirimAyarKaydet(d as Record<string, boolean>);
    if (!r.ok) {
      ayarAyarla(once);
      c.tost(C.hataYazisi(r.hata, r.durum));
      return false;
    }
    ayarAyarla(ayarCevir(r.veri?.ayar));
    return true;
  };
  const anaDegis = async () => {
    if (anaAcikMi(sistem, ayar)) {
      kaydet({ acik: false });
      return;
    }
    let s = sistem;
    if (s === 'denied') {
      c.tost('Telefonun ayarlarından Yazsam mı? için bildirime izin ver');
      sistemAyarlariniAc();
      return;
    }
    if (s !== 'granted') {
      izinKaydiYaz('tamam');
      s = await izinIste();
      sistemAyarla(s);
      if (s !== 'granted') return;
    }
    if (await kaydet({ acik: true })) jetonuKaydet();
  };

  const ana = anaAcikMi(sistem, ayar);
  return (
    <View>
      <Anahtar R={R} acik={ana} baslik="Anlık bildirimler" alt={sistem === 'denied' ? 'Telefonun ayarlarında kapalı. Açmak için dokun.' : 'Cevap, etiket, takip, mesaj ve beğeni telefonuna haber olarak gelir. Gece 23.00 ile 08.00 arası gelmez.'} onPress={anaDegis} />
      {ana &&
        TUR_SATIRLARI.map((t) => (
          <Anahtar key={t.tur} R={R} acik={ayar[t.tur]} baslik={t.baslik} alt={t.alt} onPress={() => kaydet({ [t.tur]: !ayar[t.tur] })} />
        ))}
    </View>
  );
}

function Anahtar({ R, acik, baslik, alt, onPress }: { R: ReturnType<typeof useRenk>; acik: boolean; baslik: string; alt: string; onPress: () => void }) {
  return (
    <Bas onPress={onPress} style={s.satir} etiket={baslik}>
      <View style={{ flex: 1 }}>
        <Text style={[s.baslik, { color: R.murekkep }]}>{baslik}</Text>
        <Text style={[s.alt, { color: R.soluk }]}>{alt}</Text>
      </View>
      <View style={[s.anahtar, { backgroundColor: acik ? R.vurgu : R.cizgi }]}>
        <View style={[s.top, { transform: [{ translateX: acik ? 20 : 0 }] }]} />
      </View>
    </Bas>
  );
}

const s = StyleSheet.create({
  satir: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  baslik: { fontFamily: yazi.orta, fontSize: 15.5 },
  alt: { fontFamily: yazi.normal, fontSize: 13.5, lineHeight: 19 },
  anahtar: { width: 46, height: 26, borderRadius: 13, padding: 3 },
  top: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
});
