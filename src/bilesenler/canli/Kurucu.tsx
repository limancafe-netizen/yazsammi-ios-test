// Kurucu seçenekleri (yalnız kurucu hesabında görünür): gönderi/yorum/kişi ⋯ menüsünde Öne çıkar (24 saat), Gizle / Kaldır,
// 7 gün sustur, Engelle. /yonetim ile aynı kararlar; sunucu uyum.mjs /c/kurucu/islem (c_kararlar'a yazılır). Her işlem önce onay ister.
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { yazi } from '@/tema/tema';
import * as C from '@/canli';
import type { KurucuIslem } from '@/canli';
import { Bas, Dugme, Ikon, KurucuRozet, useRenk, type IkonAd } from './ortak';
import { useCanli } from './baglam';

type Hedef = { tur: 'gonderi' | 'yorum' | 'uye'; id: string; sabit?: boolean; korumali?: boolean }; // korumali: marka / kurucu / kendisi (sustur-engelle yok)
const ISLEM: Record<KurucuIslem, { ad: string; alt: string; ikon: IkonAd; onay: string; tamam: string; tehlike?: boolean }> = {
  one_cikar: { ad: 'Öne çıkar', alt: '24 saat akışın en üstünde', ikon: 'yukari', onay: 'Bu gönderi 24 saat akışın en üstünde dursun mu?', tamam: 'Öne çıkarıldı · 24 saat' },
  one_kaldir: { ad: 'Öne çıkarmayı kaldır', alt: 'Akıştaki normal yerine döner', ikon: 'kapat', onay: 'Öne çıkarma kaldırılsın mı?', tamam: 'Öne çıkarma kaldırıldı' },
  gizle: { ad: 'Gizle / Kaldır', alt: 'Herkesten kaldırılır, kayda geçer', ikon: 'engel', onay: 'Herkesten kaldırılsın mı? Yönetim kaydına yazılır.', tamam: 'Kaldırıldı', tehlike: true },
  sustur: { ad: '7 gün sustur', alt: 'İçerik kalkar, kişi 7 gün yazamaz', ikon: 'saat', onay: 'İçerik kaldırılıp kişi 7 gün susturulsun mu?', tamam: '7 gün susturuldu', tehlike: true },
  engelle: { ad: 'Engelle', alt: 'Hesap kapanır, içerikleri gizlenir', ikon: 'bayrak', onay: 'Hesap kapatılsın mı? İçeriklerinin hepsi gizlenir.', tamam: 'Hesap engellendi', tehlike: true },
};

export function KurucuSecenekleri({ hedef, bitti }: { hedef: Hedef; bitti: (islem: KurucuIslem) => void }) {
  const R = useRenk();
  const c = useCanli();
  const [onay, onayAyarla] = useState<KurucuIslem | null>(null);
  const [bekliyor, bekliyorAyarla] = useState(false);
  if (!c.uye?.kurucu) return null;
  const liste: KurucuIslem[] = [
    ...(hedef.tur === 'gonderi' ? [hedef.sabit ? 'one_kaldir' : 'one_cikar'] as KurucuIslem[] : []),
    ...(hedef.tur !== 'uye' ? ['gizle'] as KurucuIslem[] : []),
    ...(!hedef.korumali ? (['sustur', 'engelle'] as KurucuIslem[]) : []),
  ];
  const yap = async (islem: KurucuIslem) => {
    bekliyorAyarla(true);
    const r = await C.kurucuIslem(islem, hedef.tur, hedef.id);
    bekliyorAyarla(false);
    onayAyarla(null);
    if (!r.ok) return c.tost(C.hataYazisi(r.hata, r.durum));
    c.tost(ISLEM[islem].tamam);
    bitti(islem);
  };
  if (onay) {
    const x = ISLEM[onay];
    return (
      <View style={s.onay}>
        <View style={[s.onayIkon, { backgroundColor: x.tehlike ? (R.gece ? 'rgba(255,92,108,0.14)' : 'rgba(215,38,61,0.08)') : R.altinYumusak }]}>
          <Ikon ad={x.ikon} boyut={24} renk={x.tehlike ? R.kalem : R.altin} kalinlik={2.3} />
        </View>
        <Text style={[s.onayBaslik, { color: R.murekkep }]}>{x.onay}</Text>
        <View style={{ flexDirection: 'row', gap: 10, alignSelf: 'stretch', marginTop: 12 }}>
          <Dugme yazi="Vazgeç" tur="cizgi" onPress={() => onayAyarla(null)} style={{ flex: 1 }} />
          <Dugme yazi={bekliyor ? '…' : x.ad} devre={bekliyor} onPress={() => yap(onay)} style={[{ flex: 1 }, x.tehlike ? { backgroundColor: R.kalem, borderColor: R.kalem } : { backgroundColor: R.altin, borderColor: R.altin }]} />
        </View>
      </View>
    );
  }
  return (
    <View>
      <View style={[s.baslik, { borderBottomColor: R.ince }]}>
        <KurucuRozet boyut={15} />
        <Text style={[s.baslikYazi, { color: R.altinYazi }]}>Kurucu</Text>
        {bekliyor && <ActivityIndicator size="small" color={R.altin} />}
      </View>
      {liste.map((k) => {
        const x = ISLEM[k];
        return (
          <Bas key={k} onPress={() => onayAyarla(k)} style={[s.satir, { borderBottomColor: R.ince }]} hoverRenk={R.hover} etiket={x.ad}>
            <Ikon ad={x.ikon} boyut={19} renk={x.tehlike ? R.kalem : R.altin} kalinlik={2.2} />
            <View style={{ flex: 1 }}>
              <Text style={[s.ad, { color: x.tehlike ? R.kalem : R.murekkep }]}>{x.ad}</Text>
              <Text style={[s.alt, { color: R.soluk }]}>{x.alt}</Text>
            </View>
          </Bas>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  baslik: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 22, paddingTop: 14, paddingBottom: 8, borderBottomWidth: 1 },
  baslikYazi: { fontFamily: yazi.kalin, fontSize: 13, letterSpacing: 0.3, textTransform: 'uppercase', flex: 1 },
  satir: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 22, paddingVertical: 13, borderBottomWidth: 1 },
  ad: { fontFamily: yazi.orta, fontSize: 15.5 },
  alt: { fontFamily: yazi.normal, fontSize: 12.5, marginTop: 1 },
  onay: { alignItems: 'center', gap: 6, padding: 24 },
  onayIkon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  onayBaslik: { fontFamily: yazi.kalin, fontSize: 18, letterSpacing: -0.3, textAlign: 'center', lineHeight: 24 },
});
