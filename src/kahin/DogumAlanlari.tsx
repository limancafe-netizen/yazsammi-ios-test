// KULLANILMIYOR (04.11.2026): eski KAHİN astroloji/tarot ekranı. Astroloji ve Tarot Kart Analizi artık sitenin /astroloji/ ve /tarot/ sayfaları,
// uygulamada WebView ile (bilesenler/canli/SiteBolumu.native.tsx); hiçbir ekran bu dosyayı içe aktarmıyor. Kod başvuru için duruyor, silinmedi.
// Doğum bilgisi giriş alanları (profil + uyum partneri): tarih (gün/ay/yıl), saat (ya da "bilmiyorum"), il (arama + seçim).
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { AstroDogum } from '@/canli';
import { yazi } from '@/tema/tema';
import { ALTIN, SOLUK, YAZI } from './ortak';

export type DogumDeger = { gun: string; ay: string; yil: string; saat: string; dk: string; bilmiyorum: boolean; il: string };
export const BOS_DOGUM: DogumDeger = { gun: '', ay: '', yil: '', saat: '', dk: '', bilmiyorum: false, il: '' };
const sayi = (s: string) => (/^\d{1,4}$/.test(s.trim()) ? Number(s) : NaN);
/** alanlardan sunucuya gidecek doğum; geçersizse hata metni */
export function dogumCevir(v: DogumDeger, iller: string[]): { dogum?: AstroDogum; il?: string; hata?: string } {
  const gun = sayi(v.gun), ay = sayi(v.ay), yil = sayi(v.yil);
  if (![gun, ay, yil].every(Number.isInteger) || gun < 1 || gun > 31 || ay < 1 || ay > 12 || yil < 1900 || yil > new Date().getFullYear()) return { hata: 'Doğum tarihini gün, ay, yıl olarak yaz (ör. 17 5 1990).' };
  const d = new Date(Date.UTC(yil, ay - 1, gun));
  if (d.getUTCMonth() !== ay - 1 || d.getUTCDate() !== gun) return { hata: 'Bu tarih takvimde yok.' };
  let saat: number | null = null, dk = 0;
  if (!v.bilmiyorum) {
    saat = sayi(v.saat); dk = v.dk.trim() === '' ? 0 : sayi(v.dk);
    if (!Number.isInteger(saat) || !Number.isInteger(dk) || saat < 0 || saat > 23 || dk < 0 || dk > 59) return { hata: 'Saati 0-23 ve dakikayı 0-59 olarak yaz; bilmiyorsan "Saatimi bilmiyorum"u seç.' };
  }
  if (!iller.includes(v.il)) return { hata: 'Doğum ilini listeden seç.' };
  return { dogum: { yil, ay, gun, saat, dk }, il: v.il };
}

export function DogumAlanlari({ v, onChange, iller }: { v: DogumDeger; onChange: (d: DogumDeger) => void; iller: string[] }) {
  const [ara, araAyarla] = useState(v.il);
  const [odak, odakAyarla] = useState(false);
  const oneri = useMemo(() => {
    const k = ara.toLocaleLowerCase('tr').trim();
    return k.length === 0 || v.il === ara ? [] : iller.filter((i) => i.toLocaleLowerCase('tr').includes(k)).slice(0, 5);
  }, [ara, iller, v.il]);
  const set = (p: Partial<DogumDeger>) => onChange({ ...v, ...p });
  return (
    <View>
      <Text style={s.etiket}>Doğum tarihi</Text>
      <View style={s.satir}>
        <TextInput value={v.gun} onChangeText={(x) => set({ gun: x.replace(/\D/g, '').slice(0, 2) })} placeholder="Gün" placeholderTextColor="rgba(237,233,246,0.4)" keyboardType="number-pad" maxLength={2} style={[s.girdi, { flex: 1 }]} accessibilityLabel="Doğum günü" />
        <TextInput value={v.ay} onChangeText={(x) => set({ ay: x.replace(/\D/g, '').slice(0, 2) })} placeholder="Ay" placeholderTextColor="rgba(237,233,246,0.4)" keyboardType="number-pad" maxLength={2} style={[s.girdi, { flex: 1 }]} accessibilityLabel="Doğum ayı" />
        <TextInput value={v.yil} onChangeText={(x) => set({ yil: x.replace(/\D/g, '').slice(0, 4) })} placeholder="Yıl" placeholderTextColor="rgba(237,233,246,0.4)" keyboardType="number-pad" maxLength={4} style={[s.girdi, { flex: 1.5 }]} accessibilityLabel="Doğum yılı" />
      </View>
      <Text style={s.etiket}>Doğum saati</Text>
      <View style={s.satir}>
        <TextInput value={v.saat} editable={!v.bilmiyorum} onChangeText={(x) => set({ saat: x.replace(/\D/g, '').slice(0, 2) })} placeholder="Saat" placeholderTextColor="rgba(237,233,246,0.4)" keyboardType="number-pad" maxLength={2} style={[s.girdi, { flex: 1 }, v.bilmiyorum && { opacity: 0.4 }]} accessibilityLabel="Doğum saati" />
        <TextInput value={v.dk} editable={!v.bilmiyorum} onChangeText={(x) => set({ dk: x.replace(/\D/g, '').slice(0, 2) })} placeholder="Dakika" placeholderTextColor="rgba(237,233,246,0.4)" keyboardType="number-pad" maxLength={2} style={[s.girdi, { flex: 1 }, v.bilmiyorum && { opacity: 0.4 }]} accessibilityLabel="Doğum dakikası" />
        <Pressable onPress={() => set({ bilmiyorum: !v.bilmiyorum })} accessibilityRole="checkbox" accessibilityState={{ checked: v.bilmiyorum }} style={[s.cip, v.bilmiyorum && { borderColor: ALTIN, backgroundColor: 'rgba(242,193,78,0.16)' }]}>
          <Text style={[s.cipYazi, v.bilmiyorum && { color: ALTIN }]}>Saatimi bilmiyorum</Text>
        </Pressable>
      </View>
      {v.bilmiyorum && <Text style={s.not}>Saat yoksa yükselen burç ve evler hesaplanamaz; Güneş, gezegenler ve açılar yine çıkar.</Text>}
      <Text style={s.etiket}>Doğum ili</Text>
      <TextInput value={ara} onChangeText={(x) => { araAyarla(x); if (v.il) set({ il: '' }); }} onFocus={() => odakAyarla(true)} onBlur={() => odakAyarla(false)} placeholder="İl ara (ör. Ankara)" placeholderTextColor="rgba(237,233,246,0.4)" autoCapitalize="words" style={s.girdi} accessibilityLabel="Doğum ili" />
      {v.il !== '' && <Text style={s.secili}>✓ {v.il}</Text>}
      {(odak || ara.length > 0) && oneri.length > 0 && (
        <View style={s.liste}>
          {oneri.map((i) => (
            <Pressable key={i} onPress={() => { araAyarla(i); set({ il: i }); }} style={s.oge} accessibilityRole="button" accessibilityLabel={i}><Text style={s.ogeYazi}>{i}</Text></Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  etiket: { fontFamily: yazi.kalin, fontSize: 14, color: SOLUK, marginTop: 12, marginBottom: 6 },
  satir: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  girdi: { height: 46, backgroundColor: 'rgba(30,20,52,0.92)', borderColor: 'rgba(237,233,246,0.18)', borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, color: YAZI, fontFamily: yazi.normal, fontSize: 16 },
  cip: { borderWidth: 1, borderColor: 'rgba(237,233,246,0.28)', borderRadius: 14, paddingHorizontal: 10, height: 46, justifyContent: 'center', flexShrink: 1 },
  cipYazi: { fontFamily: yazi.orta, fontSize: 12.5, color: YAZI, textAlign: 'center' },
  not: { fontFamily: yazi.normal, fontSize: 12.5, color: SOLUK, marginTop: 6 },
  secili: { fontFamily: yazi.kalin, fontSize: 14, color: ALTIN, marginTop: 6 },
  liste: { marginTop: 6, backgroundColor: 'rgba(30,20,52,0.98)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(237,233,246,0.18)', overflow: 'hidden' },
  oge: { paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(237,233,246,0.12)' },
  ogeYazi: { fontFamily: yazi.orta, fontSize: 15.5, color: YAZI },
});
