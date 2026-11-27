// "Görüldü" dizisi: kart üstündeki dizi şeridi, anketteki "Sonraki bölüm" sayacı ve sezonun bölüm listesi.
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { yazi } from '@/tema/tema';
import * as C from '@/canli';
import type { Dizi, DiziSezon, Gonderi } from '@/canli';
import { Bas, Ikon, Pencere, useRenk, type Renk } from './ortak';
import { DONEM } from '@/tema/donem';
import { useCanli } from './baglam';

// Dizinin rengi GÜNCEL DÖNEM paletinden (tema/donemler.json; Onur 07.10: sabit mavi yok).
export const DIZI_RENK: [string, string] = DONEM.kapak;
export const diziVurgu = (R: Renk) => R.vurgu;
export const diziBalon = (R: Renk) => R.vurgu;

function CiftTik({ boyut = 14, renk = '#fff' }: { boyut?: number; renk?: string }) {
  return (
    <Svg width={boyut * 1.35} height={boyut} viewBox="0 0 27 20" fill="none">
      <Path d="M2 10.5l4.6 4.6L16 5.5" stroke={renk} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M11.5 14.6l.5.5L21.5 5.5" stroke={renk} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// Yalnız hap (sağ sütundaki küçük ankette).
export function DiziHap({ d }: { d: Dizi }) {
  return (
    <LinearGradient colors={DIZI_RENK} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[s.hap, { alignSelf: 'flex-start' }]}>
      <CiftTik boyut={11} />
      <Text style={s.hapAd}>GÖRÜLDÜ</Text>
      <View style={s.hapNokta} />
      <Text style={s.hapBolum}>{d.final ? 'Sezon finali' : `Bölüm ${d.bolum}`}</Text>
    </LinearGradient>
  );
}

// Kartın en üstünde: "GÖRÜLDÜ · Bölüm 4" hapı + "Önceki bölümler"; bölümde (sohbet) altında bölüm adı.
export function DiziBaslik({ d, listeAc, adGoster }: { d: Dizi; listeAc: () => void; adGoster?: boolean }) {
  const R = useRenk();
  return (
    <View style={{ gap: 6 }}>
      <View style={s.baslik}>
        <DiziHap d={d} />
        {d.bolum > 1 && (
          <Bas onPress={listeAc} style={s.onceki} hoverRenk={R.vurguYumusak} rol="link" etiket="Önceki bölümler" hitSlop={6}>
            <Text style={[s.oncekiYazi, { color: diziVurgu(R) }]}>Önceki bölümler</Text>
            <Ikon ad="sol" boyut={13} renk={diziVurgu(R)} kalinlik={2.6} />
          </Bas>
        )}
      </View>
      {adGoster && !!d.baslik && <Text style={[s.bolumAd, { color: R.murekkep }]}>{d.baslik}</Text>}
    </View>
  );
}

const TR = 3 * 3600000;
const saatYaz = (ms: number) => new Date(ms + TR).toISOString().slice(11, 16);
function kalanYaz(ms: number) {
  const dk = Math.max(0, Math.ceil(ms / 60000));
  if (dk < 60) return `${dk} dk`;
  const sa = Math.floor(dk / 60);
  return dk % 60 ? `${sa} sa ${dk % 60} dk` : `${sa} sa`;
}

// Anketin altında: güncel ankette "Sonraki bölüm 18:30 · 2 sa 14 dk", sonuçlanmışta kazanan + sonraki bölüme geçiş.
export function DiziSayac({ g, kucuk }: { g: Gonderi; kucuk?: boolean }) {
  const R = useRenk();
  const c = useCanli();
  const d = g.dizi!;
  const [simdi, simdiAyarla] = useState(Date.now());
  useEffect(() => {
    if (!d.sonraki) return;
    const t = setInterval(() => simdiAyarla(Date.now()), 30000);
    return () => clearInterval(t);
  }, [d.sonraki]);
  const vurgu = diziVurgu(R);
  if (d.kazanan != null && d.sonrakiBolum) {
    const ton = d.tonlar?.[d.kazanan];
    const secenek = g.secenekler?.[d.kazanan];
    return (
      <Bas onPress={() => c.git({ tur: 'gonderi', id: d.sonrakiBolum! })} style={[s.sayac, { backgroundColor: R.gece ? 'rgba(91,155,255,0.12)' : 'rgba(31,107,255,0.07)' }]} hoverRenk={R.gece ? 'rgba(91,155,255,0.2)' : 'rgba(31,107,255,0.12)'} rol="link">
        <View style={[s.sayacIkon, { backgroundColor: vurgu }]}>
          <Ikon ad="tik" boyut={12} renk="#fff" kalinlik={3.2} />
        </View>
        <Text style={[s.sayacYazi, { color: R.murekkep }]} numberOfLines={kucuk ? 2 : 1}>
          <Text style={{ fontFamily: yazi.kalin }}>Kazanan{ton ? `: ${ton}` : ''}</Text>
          {secenek && !kucuk ? <Text style={{ color: R.soluk }}> · “{secenek}”</Text> : null}
        </Text>
        <Text style={[s.sayacSag, { color: vurgu }]}>Bölüm {d.bolum + 1}</Text>
        <Ikon ad="ok" boyut={14} renk={vurgu} kalinlik={2.6} />
      </Bas>
    );
  }
  if (!d.sonraki) return null;
  const kalan = d.sonraki - simdi;
  return (
    <View style={[s.sayac, { backgroundColor: R.gece ? 'rgba(91,155,255,0.12)' : 'rgba(31,107,255,0.07)' }]}>
      <View style={[s.sayacIkon, { backgroundColor: vurgu }]}>
        <Ikon ad="saat" boyut={13} renk="#fff" kalinlik={2.4} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.sayacBaslik, { color: R.murekkep }]} numberOfLines={1}>
          Sonraki bölüm {saatYaz(d.sonraki)}
        </Text>
        <Text style={[s.sayacNot, { color: R.soluk }]} numberOfLines={1}>
          {kucuk ? (kalan > 0 ? `${kalanYaz(kalan)} kaldı` : 'geliyor') : 'kazanan cevapla devam eder'}
        </Text>
      </View>
      {!kucuk && <Text style={[s.sayacKalan, { color: vurgu }]}>{kalan > 0 ? kalanYaz(kalan) : 'geliyor'}</Text>}
    </View>
  );
}

// Sezonun bölümleri, sırayla. Dokununca bölüm açılır.
export function DiziListe({ acik, kapat, sezon }: { acik: boolean; kapat: () => void; sezon: number }) {
  return (
    <Pencere acik={acik} kapat={kapat} genislik={520} baslik={`Görüldü · ${sezon}. sezon`}>
      {acik && <Liste sezon={sezon} kapat={kapat} />}
    </Pencere>
  );
}

function Liste({ sezon, kapat }: { sezon: number; kapat: () => void }) {
  const R = useRenk();
  const c = useCanli();
  const [veri, veriAyarla] = useState<DiziSezon | null | 'hata'>(null);
  useEffect(() => {
    let iptal = false;
    C.diziGetir(sezon).then((r) => !iptal && veriAyarla(r.ok ? r.veri : 'hata'));
    return () => {
      iptal = true;
    };
  }, [sezon]);
  if (veri === null) return <ActivityIndicator style={{ marginVertical: 40 }} color={diziVurgu(R)} />;
  if (veri === 'hata') return <Text style={[s.bos, { color: R.soluk }]}>Bölümler yüklenemedi. Biraz sonra tekrar dene.</Text>;
  const ac = (id: string) => {
    kapat();
    setTimeout(() => c.git({ tur: 'gonderi', id }), 200);
  };
  return (
    <ScrollView contentContainerStyle={s.liste}>
      <View style={s.ust}>
        <View style={s.ciftAvatar}>
          <LinearGradient colors={['#FF6A3D', '#FF3D7F']} style={s.harf}>
            <Text style={s.harfYazi}>{veri.karakterler.ben.slice(0, 1)}</Text>
          </LinearGradient>
          <LinearGradient colors={DIZI_RENK} style={[s.harf, { marginLeft: -10, borderColor: R.panel }]}>
            <Text style={s.harfYazi}>{veri.karakterler.o.slice(0, 1)}</Text>
          </LinearGradient>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.ustAd, { color: R.murekkep }]}>
            {veri.karakterler.ben} & {veri.karakterler.o}
          </Text>
          <Text style={[s.ustAlt, { color: R.soluk }]}>
            {veri.bolumler.length}/{veri.toplamBolum} bölüm · her gün 12:30, 18:30, 22:30 · kurgu
          </Text>
        </View>
      </View>
      {veri.bolumler.map((b) => {
        const a = b.anket;
        const d = a?.dizi;
        const son = b.sohbet.balonlar?.at(-1);
        let durum = '';
        if (d?.kazanan != null) {
          const toplam = (a!.oylar ?? []).reduce((x, y) => x + y, 0);
          const yuzde = toplam ? Math.round(((a!.oylar?.[d.kazanan] ?? 0) * 100) / toplam) : 0;
          durum = `Kazanan: ${d.tonlar?.[d.kazanan] ?? ''}${toplam >= 5 ? ` · %${yuzde}` : ''}`;
        } else if (d?.sonraki) durum = `Oylama sürüyor · sonraki bölüm ${saatYaz(d.sonraki)}`;
        else if (b.sohbet.dizi?.final) durum = 'Sezon finali';
        return (
          <Bas key={b.bolum} onPress={() => ac(b.sohbet.id)} style={[s.oge, { borderBottomColor: R.ince }]} hoverRenk={R.hover} rol="link">
            <LinearGradient colors={DIZI_RENK} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.no}>
              <Text style={s.noYazi}>{b.bolum}</Text>
            </LinearGradient>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[s.ogeAd, { color: R.murekkep }]} numberOfLines={1}>
                {b.baslik || `Bölüm ${b.bolum}`}
              </Text>
              {!!son && (
                <Text style={[s.ogeSon, { color: R.soluk }]} numberOfLines={1}>
                  {son.kim === 'ben' ? `${veri.karakterler.ben}: ` : `${veri.karakterler.o}: `}
                  {son.metin}
                </Text>
              )}
              {!!durum && <Text style={[s.ogeDurum, { color: d?.kazanan != null ? R.murekkep : diziVurgu(R) }]}>{durum}</Text>}
            </View>
            <Ikon ad="ok" boyut={16} renk={R.soluk} kalinlik={2.2} />
          </Bas>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  baslik: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, rowGap: 4, marginTop: -2 }, // dar telefonda (320) "Önceki bölümler" alta iner
  hap: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingLeft: 8, paddingRight: 10, paddingVertical: 4 },
  hapAd: { color: '#fff', fontFamily: yazi.marka, fontSize: 10, letterSpacing: 0.6 },
  hapNokta: { width: 3, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.75)' },
  hapBolum: { color: '#fff', fontFamily: yazi.kalin, fontSize: 12.5 },
  bolumAd: { fontFamily: yazi.kalin, fontSize: 19, lineHeight: 24, letterSpacing: -0.4, marginTop: 2 },
  onceki: { flexDirection: 'row-reverse', alignItems: 'center', gap: 1, marginLeft: 'auto', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, marginRight: -6 },
  oncekiYazi: { fontFamily: yazi.orta, fontSize: 13 },

  sayac: { flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 14, paddingHorizontal: 11, paddingVertical: 9, marginTop: 2 },
  sayacIkon: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  sayacYazi: { flex: 1, fontFamily: yazi.normal, fontSize: 14 },
  sayacSag: { fontFamily: yazi.kalin, fontSize: 13.5 },
  sayacBaslik: { fontFamily: yazi.kalin, fontSize: 14.5 },
  sayacNot: { fontFamily: yazi.normal, fontSize: 12.5, marginTop: 1 },
  sayacKalan: { fontFamily: yazi.kalin, fontSize: 13.5, fontVariant: ['tabular-nums'] },

  liste: { paddingBottom: 18 },
  ust: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 12 },
  ciftAvatar: { flexDirection: 'row' },
  harf: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  harfYazi: { color: '#fff', fontFamily: yazi.kalin, fontSize: 15 },
  ustAd: { fontFamily: yazi.kalin, fontSize: 16 },
  ustAlt: { fontFamily: yazi.normal, fontSize: 13, marginTop: 1 },
  oge: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1 },
  no: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  noYazi: { color: '#fff', fontFamily: yazi.kalin, fontSize: 15 },
  ogeAd: { fontFamily: yazi.kalin, fontSize: 15.5 },
  ogeSon: { fontFamily: yazi.normal, fontSize: 13.5 },
  ogeDurum: { fontFamily: yazi.orta, fontSize: 12.5, marginTop: 1 },
  bos: { fontFamily: yazi.normal, fontSize: 15, textAlign: 'center', padding: 30 },
});
