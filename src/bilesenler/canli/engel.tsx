// Engel uyarısı (09.10, Onur): içerik süzgecine takılan metinde kullanıcı SAKİN bir uyarı görür (kırmızı hata kutusu ya da geçip giden
// bildirim değil): ne oldu + ne yapabilir; yazdığı metin kutuda kalır; sorunlu ifadeler işaretlenir (yalnız yazarına).
// Yazarken (gönder'e basmadan) aynı yerel listeyle ince ipucu çıkar (engelOnKontrol.ts); karar yine sunucudadır.
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { yazi } from '@/tema/tema';
import * as C from '@/canli';
import { Ikon, useRenk } from './ortak';
import { onKontrol, type Baglam } from './engelOnKontrol';

export type Engel = { kod: string; uyari: string; ifade: string[]; ciddi: boolean };
type Hata = { hata: string; durum: number; sebep?: string; kod?: string; uyari?: string; ifade?: string[]; ciddi?: boolean; tavan?: number };

const ad = (t: string) => (t.length > 40 ? t.slice(0, 38) + '…' : t);
const liste = (a: string[]) => a.slice(0, 3).map((x) => `«${ad(x)}»`).join(', ');

// Sunucu yanıtından uyarı. Eski sunucu (yalnız hata+sebep) gelirse aynı anlamlı yerel metin kurulur.
// Dönen değer null ise bu hata engel uyarısı değildir (bağlantı, günlük sınır vb. eskisi gibi gösterilir).
export function engelCoz(r: Hata, baglam: Baglam): Engel | null {
  if (r.hata === 'uygun_degil') {
    const sebep = r.sebep ?? '';
    const kod = r.kod ?? (sebep === 'spam' ? 'baglanti' : sebep || 'diger');
    return { kod, uyari: r.uyari ?? C.sebepYazisi(r.sebep, baglam === 'mesaj' || baglam === 'istek' || baglam === 'tribun'), ifade: r.ifade ?? [], ciddi: !!r.ciddi || ['taciz_tehdit', 'cinsel', 'cocuk', 'kendine_zarar'].includes(sebep) };
  }
  if (r.hata === 'uzunluk') {
    const kod = r.kod ?? 'uzun';
    return { kod, uyari: r.uyari ?? (r.tavan ? `Biraz uzun oldu: en çok ${r.tavan} harf. Kısaltıp tekrar gönderebilirsin.` : 'Biraz uzun oldu. Kısaltıp tekrar gönderebilirsin.'), ifade: [], ciddi: false };
  }
  return null;
}

// Sunucu uyarısı yalnız kutudaki metin DEĞİŞMEDİKÇE görünür (değişince kendiliğinden kalkar); yerine yazarken ön kontrol ipucu gelir.
export function useEngel(metin: string, baglam: Baglam) {
  const [kayit, kayitAyarla] = useState<{ metin: string; engel: Engel } | null>(null);
  const [yavas, yavasAyarla] = useState(metin);
  useEffect(() => {
    const t = setTimeout(() => yavasAyarla(metin), 450);
    return () => clearTimeout(t);
  }, [metin]);
  const engel = kayit && kayit.metin === metin.trim() ? kayit.engel : null;
  const ipucu = useMemo(() => {
    if (engel) return null;
    const o = onKontrol(yavas, baglam);
    return o ? o : null;
  }, [yavas, baglam, engel]);
  const ipucuGecerli = yavas === metin ? ipucu : null;
  return {
    engel,
    ipucu: ipucuGecerli,
    // r: sunucu yanıtı; gonderilen: gönderilen metin (kutuya geri konan). Engel uyarısıysa kaydeder ve true döner.
    koy: (r: Hata, gonderilen: string) => {
      const e = engelCoz(r, baglam);
      if (e) kayitAyarla({ metin: gonderilen.trim(), engel: e });
      return !!e;
    },
  };
}

// Kutunun hemen altında: sunucu uyarısı (sakin amber kutu + işaretli ifadeler) ya da yazarken ince ipucu.
export function EngelAlani({ engel, ipucu, kenar = 0 }: { engel: Engel | null; ipucu: ReturnType<typeof useEngel>['ipucu']; kenar?: number }) {
  const R = useRenk();
  if (engel) {
    return (
      <View accessibilityLiveRegion="polite" accessibilityRole="alert" style={[s.kutu, { backgroundColor: R.altinYumusak, marginHorizontal: kenar }]}>
        <View style={{ marginTop: 1 }}><Ikon ad="kalem" boyut={16} renk={R.altinYazi} kalinlik={2.2} /></View>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={[s.yazi, { color: R.murekkep }]}>{engel.uyari}</Text>
          {engel.ifade.length > 0 && !engel.ciddi && (
            <View style={s.parcalar}>
              {engel.ifade.slice(0, 4).map((x) => (
                <View key={x} style={[s.parca, { borderColor: R.altinYazi }]}>
                  <Text style={[s.parcaYazi, { color: R.altinYazi }]} numberOfLines={1}>{ad(x)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  }
  if (ipucu) {
    const ne = ipucu.kod === 'kufur' ? 'küfür çok yoğun' : ipucu.kod === 'siyaset' ? 'siyaset yazılmıyor' : ipucu.kod === 'baglanti' ? 'bağlantı paylaşılmıyor' : 'kişisel bilgi paylaşılmıyor';
    return (
      <Text accessibilityLiveRegion="polite" style={[s.ipucu, { color: R.altinYazi, marginHorizontal: kenar }]}>
        Bu hâliyle gönderilemeyebilir: {liste(ipucu.ifade)} ({ne}).
      </Text>
    );
  }
  return null;
}

const s = StyleSheet.create({
  kutu: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  yazi: { fontFamily: yazi.orta, fontSize: 13.5, lineHeight: 19 },
  parcalar: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  parca: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, maxWidth: '100%' },
  parcaYazi: { fontFamily: yazi.kalin, fontSize: 13 },
  ipucu: { fontFamily: yazi.orta, fontSize: 12.5, lineHeight: 17, paddingHorizontal: 4 },
});
