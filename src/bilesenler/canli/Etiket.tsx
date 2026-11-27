// @etiket: metinde dokunulabilir @takmaad (yalnız sunucunun geçerli saydıkları) + yazarken "@" önerisi.
// Kural sunucuda: normal üye karşılıklı takipleştiklerini + Yazsam mı? + kurucuyu; kurucu ve Yazsam mı? herkesi etiketler.
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native';
import { yazi } from '@/tema/tema';
import * as C from '@/canli';
import type { Yazar } from '@/canli';
import { Avatar, Bas, useRenk } from './ortak';
import { useCanli } from './baglam';

const PARCA = /(@[\p{L}\p{N}_]{3,20})/u;
const kucuk = (s: string) => s.toLocaleLowerCase('tr');

// linkRenk: koyu/vurgu renkli zeminde (kendi mesaj balonu) bağlantı rengi; verilirse altı da çizilir.
export function EtiketliMetin({ metin, etiketler, style, numberOfLines, linkRenk }: { metin: string; etiketler?: string[]; style?: StyleProp<TextStyle>; numberOfLines?: number; linkRenk?: string }) {
  const R = useRenk();
  const c = useCanli();
  if (!etiketler?.length || !metin.includes('@')) return <Text style={style} numberOfLines={numberOfLines}>{metin}</Text>;
  const gecerli = new Map(etiketler.map((a) => [kucuk(a), a]));
  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {metin.split(PARCA).map((p, i) => {
        const ad = p.startsWith('@') ? gecerli.get(kucuk(p.slice(1))) : undefined;
        if (!ad) return p;
        return (
          <Text
            key={i}
            onPress={(e: any) => {
              e?.stopPropagation?.();
              c.git({ tur: 'profil', ad });
            }}
            accessibilityRole="link"
            style={{ color: linkRenk ?? R.vurgu, fontFamily: yazi.kalin, ...(linkRenk ? { textDecorationLine: 'underline' as const } : {}) }}
          >
            {p}
          </Text>
        );
      })}
    </Text>
  );
}

// Metnin sonunda "@…" yazılıyorsa öneri listesi; seçilince "@takmaad " eklenir.
const SON = /(^|\s)@([\p{L}\p{N}_]{0,20})$/u;
// adaylar: öneri kaynağı (varsayılan akış listesi; Tribün odası kendi listesini verir).
export function EtiketOneri({ metin, ayarla, ust, adaylar }: { metin: string; ayarla: (t: string) => void; ust?: boolean; adaylar?: (q: string) => Promise<Yazar[]> }) {
  const R = useRenk();
  const c = useCanli();
  const [liste, listeAyarla] = useState<Yazar[]>([]);
  const sira = useRef(0);
  const adRef = useRef(adaylar);
  adRef.current = adaylar; // satır içi işlev her çizimde yeni olur; efekt yalnız q/giriş değişince çalışsın
  const m = SON.exec(metin);
  const q = m ? m[2] : null;
  const girisli = !!c.uye && !c.uye.yeni;
  useEffect(() => {
    if (q === null || !girisli) return listeAyarla([]);
    const n = ++sira.current;
    const t = setTimeout(() => (adRef.current ?? C.etiketAdaylari)(q).then((l) => n === sira.current && listeAyarla(l.slice(0, 5))), 120);
    return () => clearTimeout(t);
  }, [q, girisli]);
  if (q === null || !liste.length) return null;
  const sec = (y: Yazar) => {
    ayarla(metin.replace(SON, `$1@${y.ad} `));
    listeAyarla([]);
  };
  return (
    <View style={[s.kutu, { backgroundColor: R.panel, borderColor: R.ince }, ust && s.ust]}>
      {liste.map((y) => (
        <Bas key={y.uid} onPress={() => sec(y)} style={s.satir} hoverRenk={R.hover} etiket={`@${y.ad} etiketle`}>
          <Avatar yazar={y} boyut={28} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={[s.ad, { color: R.murekkep }]}>{y.marka ? 'Yazsam mı?' : y.ad}</Text>
            <Text numberOfLines={1} style={[s.kulp, { color: R.soluk }]}>@{y.ad}</Text>
          </View>
        </Bas>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  kutu: { borderWidth: 1, borderRadius: 14, overflow: 'hidden', marginVertical: 6 },
  ust: { marginTop: 0, marginBottom: 8 },
  satir: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 8 },
  ad: { fontFamily: yazi.kalin, fontSize: 14.5 },
  kulp: { fontFamily: yazi.normal, fontSize: 12.5 },
});
