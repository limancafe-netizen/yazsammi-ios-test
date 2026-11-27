// Tribün'ün ortak görsel parçaları (plan/33): takım rozeti (forma renkleri + kısaltma, LOGO YOK), tabela, zaman şeridi, saat/dakika biçimleri.
// Kulüp logosu/arması kullanılmaz (KARARLAR 05.10, SMK md. 7/5-b): her takım iki renk + 2–3 harfli kısaltma ile gösterilir.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Line, Polygon } from 'react-native-svg';
import { yazi } from '@/tema/tema';
import type { TribunMac, TribunOlay, TribunTakim } from '@/canli';
import { CanliNokta, YEREL_SURUCU, useRenk } from './ortak';

// ---- renk yardımcıları ----
const rgb = (h: string) => {
  const x = h.replace('#', '');
  const n = parseInt(x.length === 3 ? x.split('').map((c) => c + c).join('') : x, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
};
export const karisim = (a: string, b: string, t: number) => {
  const [r1, g1, b1] = rgb(a), [r2, g2, b2] = rgb(b);
  const m = (x: number, y: number) => Math.round(x + (y - x) * t).toString(16).padStart(2, '0');
  return `#${m(r1, r2)}${m(g1, g2)}${m(b1, b2)}`;
};
const parlak = (h: string) => {
  const [r, g, b] = rgb(h).map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const karsitlik = (a: string, b: string) => { const x = parlak(a), y = parlak(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
export const yaziRengi = (zemin: string, tercih?: string) => (tercih && karsitlik(zemin, tercih) >= 3 ? tercih : parlak(zemin) > 0.4 ? '#14101F' : '#FFFFFF');
export const sa = (hex: string, a: number) => { const [r, g, b] = rgb(hex); return `rgba(${r},${g},${b},${a})`; };

// ---- zaman ----
export const saatYaz = (ms: number) => new Date(ms).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' });
const GUNLER = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
// Takım adına "-ız" eki (ünlü uyumu, sessiz harfe -ız, ünlüye -yız): "Galatasaray" -> "Galatasaray’ız", "Fenerbahçe" -> "Fenerbahçe’yiz", "Trabzonspor" -> "Trabzonspor’uz".
export function bizIz(ad: string) {
  const k = ad.trim().toLocaleLowerCase('tr');
  const sesli = [...k].reverse().find((h) => 'aeıioöuü'.includes(h));
  const ek = !sesli ? 'iz' : 'aı'.includes(sesli) ? 'ız' : 'ei'.includes(sesli) ? 'iz' : 'ou'.includes(sesli) ? 'uz' : 'üz';
  return `${ad.trim()}’${'aeıioöuü'.includes(k.slice(-1)) ? 'y' : ''}${ek}`;
}
export const trGun = (ms: number) => new Date(ms + 3 * 3600000).toISOString().slice(0, 10);
export function gunBasligi(ms: number, simdi: number) {
  const d = new Date(ms + 3 * 3600000);
  const fark = Math.round((Date.parse(trGun(ms) + 'T00:00:00Z') - Date.parse(trGun(simdi) + 'T00:00:00Z')) / 86400000);
  const ad = `${GUNLER[d.getUTCDay()]} ${d.getUTCDate()} ${AYLAR[d.getUTCMonth()]}`;
  return fark === 0 ? `Bugün · ${ad}` : fark === 1 ? `Yarın · ${ad}` : ad;
}
export function kalanYaz(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const g = Math.floor(s / 86400), sa_ = Math.floor((s % 86400) / 3600), d = Math.floor((s % 3600) / 60), sn = s % 60;
  if (g > 0) return `${g} gün ${sa_} sa`;
  if (sa_ > 0) return `${sa_} sa ${String(d).padStart(2, '0')} dk`;
  return `${String(d).padStart(2, '0')}:${String(sn).padStart(2, '0')}`;
}
// Sunucu saatiyle yerel saat farkı (cihaz saati şaşsa da geri sayım doğru).
export function useSimdi(sunucuSimdi?: number, aralik = 1000) {
  const fark = useRef(0);
  if (sunucuSimdi) fark.current = sunucuSimdi - Date.now();
  const [, yenile] = useState(0);
  useEffect(() => { const t = setInterval(() => yenile((x) => x + 1), aralik); return () => clearInterval(t); }, [aralik]);
  return Date.now() + fark.current;
}


// Futbol topu: beyaz daire, ortada koyu beşgen, beşgenden kenara beş çizgi.
export function TopIkon({ boyut = 28, zemin = '#FFFFFF', koyu = '#14101F' }: { boyut?: number; zemin?: string; koyu?: string }) {
  const pent = (r: number, cx: number, cy: number, d = -90) => Array.from({ length: 5 }, (_, i) => { const a = ((d + i * 72) * Math.PI) / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const; });
  const orta = pent(3.9, 12, 12);
  const dis = pent(9.3, 12, 12);
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24" accessibilityLabel="Top">
      <Circle cx={12} cy={12} r={10.9} fill={zemin} stroke={koyu} strokeWidth={1.5} />
      {orta.map((p, i) => <Line key={i} x1={p[0]} y1={p[1]} x2={dis[i][0]} y2={dis[i][1]} stroke={koyu} strokeWidth={1.3} strokeLinecap="round" />)}
      <Polygon points={orta.map((p) => p.join(',')).join(' ')} fill={koyu} />
      {dis.map((p, i) => <Circle key={i} cx={p[0]} cy={p[1]} r={1.5} fill={koyu} />)}
    </Svg>
  );
}

// ---- takım rozeti: forma gibi iki renk + kısaltma ----
export function TakimRozeti({ t, boyut = 56 }: { t: TribunTakim; boyut?: number }) {
  const yazi_ = yaziRengi(t.renk, t.renk2);
  const halka = Math.max(2, Math.round(boyut / 16));
  return (
    <View accessibilityLabel={t.ad} style={{ width: boyut, height: boyut, borderRadius: boyut / 2, backgroundColor: t.renk, borderWidth: halka, borderColor: t.renk2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: boyut * 0.46, backgroundColor: 'rgba(255,255,255,0.12)' }} />
      <Text style={{ fontFamily: yazi.marka, fontSize: boyut * (t.kisa.length > 2 ? 0.27 : 0.33), letterSpacing: -0.5, color: yazi_ }}>{t.kisa}</Text>
    </View>
  );
}

const TABELA_ZEMIN = '#120E1F';

// Dakika şeridi: iki takımın olayları iki sıra (üstte ev, altta deplasman); gol = dolu daire, sarı/kırmızı = küçük kart, penaltı/VAR = P/V.
export function ZamanSeridi({ mac, olaylar, dkSayi }: { mac: TribunMac; olaylar: TribunOlay[]; dkSayi: number }) {
  const son = Math.max(90, ...olaylar.map((x) => parseInt(x.dk, 10) + (parseInt(x.dk.split('+')[1] || '0', 10) || 0)));
  const yuz = (dk: string) => { const p = dk.split('+'); return Math.min(98, Math.max(2, ((parseInt(p[0], 10) + (parseInt(p[1] || '0', 10) || 0)) / son) * 100)); };
  const ilerleme = mac.durum === 'oncesi' ? 0 : mac.durum === 'bitti' ? 100 : Math.min(100, (Math.max(1, dkSayi) / son) * 100);
  const oge = olaylar.filter((x) => x.teyit && !x.iptal && ['gol', 'sari', 'kirmizi', 'penalti', 'gol_iptal'].includes(x.tur) && x.takim);
  return (
    <View style={s.seritKap}>
      <View style={s.seritYer}>
        <View style={[s.seritIz, { backgroundColor: 'rgba(255,255,255,0.14)' }]} />
        <View style={[s.seritDolu, { width: `${ilerleme}%` }]}>
          <LinearGradient colors={[mac.ev.renk, mac.dep.renk]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
        </View>
        <View style={[s.devre, { left: `${(45 / son) * 100}%` }]} />
        {oge.map((x) => {
          const takim = x.takim === 'ev' ? mac.ev : mac.dep;
          const ust = x.takim === 'ev';
          return (
            <View key={x.id} style={[s.seritOge, { left: `${yuz(x.dk)}%`, [ust ? 'bottom' : 'top']: 7 }]}>
              {x.tur === 'gol' ? (
                <View style={[s.goalDot, { backgroundColor: takim.renk, borderColor: '#fff' }]} />
              ) : x.tur === 'sari' || x.tur === 'kirmizi' ? (
                <View style={[s.kartMini, { backgroundColor: x.tur === 'sari' ? '#FFD23F' : '#FF3B3B' }]} />
              ) : (
                <View style={[s.pv, { backgroundColor: 'rgba(255,255,255,0.92)' }]}><Text style={s.pvYazi}>{x.tur === 'penalti' ? 'P' : 'V'}</Text></View>
              )}
            </View>
          );
        })}
      </View>
      <View style={s.seritEtiket}>
        <Text style={s.seritYazi}>0'</Text>
        <Text style={s.seritYazi}>45'</Text>
        <Text style={s.seritYazi}>90'</Text>
      </View>
    </View>
  );
}

// Tabela: lig + durum, iki takım rozeti, büyük skor, dakika şeridi. kompakt: canlı oda içinde yer kazanır.
export function Tabela({ mac, olaylar, dkSayi, kompakt, bekle, sag }: { mac: TribunMac; olaylar: TribunOlay[]; dkSayi: number; kompakt?: boolean; bekle?: string; sag?: ReactNode }) {
  const R = useRenk();
  const canli = mac.durum === 'canli' || mac.durum === 'devre';
  const durum = mac.durum === 'bitti' ? 'MAÇ BİTTİ' : mac.durum === 'devre' ? 'DEVRE ARASI' : canli ? `${mac.dk}'` : bekle || saatYaz(mac.baslangic);
  const rozet = kompakt ? 46 : 64;
  const skorBoy = kompakt ? 38 : 52;
  // Skor değişince kısa nabız (gol anı).
  const nabiz = useRef(new Animated.Value(1)).current;
  const onceki = useRef(mac.skor.ev + mac.skor.dep);
  useEffect(() => {
    const t = mac.skor.ev + mac.skor.dep;
    if (t !== onceki.current) {
      onceki.current = t;
      nabiz.setValue(1.28);
      Animated.timing(nabiz, { toValue: 1, duration: 650, easing: Easing.out(Easing.back(1.6)), useNativeDriver: YEREL_SURUCU }).start();
    }
  }, [mac.skor.ev, mac.skor.dep]);
  return (
    <View style={[s.tabela, { backgroundColor: TABELA_ZEMIN }]}>
      <LinearGradient colors={[sa(mac.ev.renk, 0.42), 'rgba(0,0,0,0)']} start={{ x: 0, y: 0.2 }} end={{ x: 0.75, y: 0.8 }} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={['rgba(0,0,0,0)', sa(mac.dep.renk, 0.42)]} start={{ x: 0.25, y: 0.2 }} end={{ x: 1, y: 0.8 }} style={StyleSheet.absoluteFill} />
      <View style={s.tabelaBar}>
        <View style={{ flex: 1, backgroundColor: mac.ev.renk }} />
        <View style={{ flex: 1, backgroundColor: mac.dep.renk }} />
      </View>
      <View style={[s.tabelaUst, kompakt && { marginBottom: 2 }]}>
        <Text style={s.lig} numberOfLines={1}>{mac.ligKisa}</Text>
        <View style={{ flex: 1 }} />
        {mac.tekrar && <View style={[s.pill, { backgroundColor: 'rgba(255,214,102,0.22)' }]}><Text style={[s.pillYazi, { color: '#FFE08A' }]}>DENEME</Text></View>}
        {canli ? (
          <View style={[s.pill, { backgroundColor: 'rgba(255,60,90,0.22)' }]}>
            <CanliNokta renk="#FF4D6D" boyut={4} />
            <Text style={[s.pillYazi, { color: '#FFD0D8' }]}>CANLI · {durum}</Text>
          </View>
        ) : (
          <View style={[s.pill, { backgroundColor: 'rgba(255,255,255,0.14)' }]}><Text style={[s.pillYazi, { color: '#fff' }]}>{durum}</Text></View>
        )}
        {sag}
      </View>
      <View style={s.tabelaOrta}>
        <View style={s.takim}>
          <TakimRozeti t={mac.ev} boyut={rozet} />
          <Text style={[s.takimAd, kompakt && { fontSize: 13 }]} numberOfLines={1}>{mac.ev.ad}</Text>
        </View>
        <Animated.View style={[s.skorKutu, { transform: [{ scale: nabiz }] }]}>
          {mac.durum === 'oncesi' ? (
            <Text style={[s.skor, { fontSize: skorBoy * 0.8, opacity: 0.9 }]}>{bekle ? saatYaz(mac.baslangic) : '– –'}</Text>
          ) : (
            <Text style={[s.skor, { fontSize: skorBoy }]}>{mac.skor.ev}<Text style={{ opacity: 0.45 }}> – </Text>{mac.skor.dep}</Text>
          )}
        </Animated.View>
        <View style={s.takim}>
          <TakimRozeti t={mac.dep} boyut={rozet} />
          <Text style={[s.takimAd, kompakt && { fontSize: 13 }]} numberOfLines={1}>{mac.dep.ad}</Text>
        </View>
      </View>
      {mac.durum !== 'oncesi' && <ZamanSeridi mac={mac} olaylar={olaylar} dkSayi={dkSayi} />}
    </View>
  );
}

const s = StyleSheet.create({
  tabela: { borderRadius: 26, overflow: 'hidden', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  tabelaBar: { position: 'absolute', left: 0, right: 0, top: 0, height: 4, flexDirection: 'row' },
  tabelaUst: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  lig: { fontFamily: yazi.kalin, fontSize: 10.5, letterSpacing: 0.7, color: 'rgba(255,255,255,0.72)', flexShrink: 1 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 2, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 3 },
  pillYazi: { fontFamily: yazi.kalin, fontSize: 9.5, letterSpacing: 0.6 },
  tabelaOrta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  takim: { flex: 1, alignItems: 'center', gap: 6, minWidth: 0 },
  takimAd: { fontFamily: yazi.kalin, fontSize: 14.5, color: '#fff', textAlign: 'center', maxWidth: '100%' },
  skorKutu: { alignItems: 'center', justifyContent: 'center', minWidth: 96 },
  skor: { fontFamily: yazi.marka, color: '#fff', letterSpacing: -1.5, fontVariant: ['tabular-nums'] },
  seritKap: { marginTop: 10, paddingHorizontal: 2 },
  seritYer: { height: 38, justifyContent: 'center' },
  seritIz: { position: 'absolute', left: 0, right: 0, top: 17, height: 4, borderRadius: 2 },
  seritDolu: { position: 'absolute', left: 0, top: 17, height: 4, borderRadius: 2, overflow: 'hidden' },
  devre: { position: 'absolute', top: 13, width: 2, height: 12, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.35)' },
  seritOge: { position: 'absolute', marginLeft: -6, alignItems: 'center' },
  goalDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2 },
  kartMini: { width: 8, height: 11, borderRadius: 2 },
  pv: { width: 14, height: 14, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  pvYazi: { fontFamily: yazi.kalin, fontSize: 9.5, color: '#14101F' },
  seritEtiket: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -2 },
  seritYazi: { fontFamily: yazi.orta, fontSize: 10, color: 'rgba(255,255,255,0.45)' },
});
