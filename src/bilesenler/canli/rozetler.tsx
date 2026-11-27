// Rozet rafı (Onur 08.10 23:50 onayı; plan/29_ROZETLER/v3): düz rozet ailesi — profilde raf, rozet detayı, kazanma anı, adın yanında
// kişinin SEÇTİĞİ tek rozet (AdRozeti: rozetGorsel.tsx). Çizim marka/rozetCiz.ts (dönem paletinden; dönem değişince tonlar kendiliğinden döner).
// Kurallar: rozet geri alınmaz, seri yok; kazanılmayan rozet sönük silüet + gerçek ilerleme ("61/100"), gizli rozet "???".
// Başkasının profilinde yalnız kazandıkları görünür (kilitli/ilerleme yok).
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { yazi } from '@/tema/tema';
import * as C from '@/canli';
import type { RafOge, RozetKayit } from '@/canli';
import { DONEM, saydam } from '@/tema/donem';
import { Bas, Ikon, Pencere, YEREL_SURUCU, useRenk } from './ortak';
import { useCanli } from './baglam';
import { BILGI, SEVIYELI, sayiYaz, seviyeYazi, tarihYaz } from './rozetBilgi';
import { RozetGorsel } from './rozetGorsel';

// ---------- raf ----------
type Oge = RafOge; // kendi rafında kilitliler (s: 0) de gelir; başkasında yalnız kazanılanlar
const kayitOge = (k: RozetKayit): Oge => ({ r: k.r, s: k.s, t: k.t, ...(k.n != null ? { n: k.n } : {}) });
const sonraki = (o: Oge) => (o.esik && o.s < o.esik.length ? o.esik[o.s] : null);
// Raf hücresinin alt satırı: kazanılmışta o seviyenin eşiği, kilitlide gerçek ilerleme ("61/100"), gizlide ipucu.
function altYazi(o: Oge): string {
  const b = BILGI[o.r];
  if (o.gizli) return 'gizli rozet';
  if (o.s > 0) {
    if (o.r === 'oncu') return 'ilk 100 üye';
    if (o.r === 'bumerang') return `×${o.s}`;
    if (o.r === 'kurucu') return 'Yazsam mı?';
    if (o.r === 'kurucu_dost') return 'kurucu dost';
    if (o.r === 'ilkses') return 'ilk söz';
    if (o.esik) return `${sayiYaz(o.esik[Math.min(o.s, o.esik.length) - 1])} ${b.birim ?? ''}`.trim();
    return o.r === 'gece' ? '5 gece' : o.r === 'donem' ? 'dönem rozeti' : '';
  }
  if (o.esik) return `${sayiYaz(o.deger ?? 0)}/${sayiYaz(o.esik[0])}`;
  if (o.r === 'donem') return `${o.deger ?? 0}/${o.hedef ?? 15} gün`;
  if (o.r === 'ilkses') return 'ilk yorum';
  return '';
}

export function RozetRafi({ ogeler, kendi, vitrin, yenile, bos }: { ogeler: Oge[]; kendi: boolean; vitrin?: string | null; yenile?: () => void; bos?: string }) {
  const R = useRenk();
  const [gen, genAyarla] = useState(0);
  const [acilan, acilanAyarla] = useState<Oge | null>(null);
  const liste = kendi ? ogeler : ogeler.filter((o) => o.s > 0);
  const kazanilan = liste.filter((o) => o.s > 0).length;
  const sutun = gen >= 560 ? 6 : gen >= 330 ? 4 : 3;
  const hucre = gen ? Math.floor(gen / sutun) : 72;
  return (
    <View onLayout={(e) => genAyarla(e.nativeEvent.layout.width)}>
      <View style={s.rafBas}>
        <Text style={[s.rafB, { color: R.murekkep }]}>Rozet rafı</Text>
        <Text style={[s.rafAlt, { color: R.soluk }]}>{kazanilan ? `${kazanilan} rozet kazanıldı` : kendi ? 'ilk rozetin yolda' : ''}</Text>
      </View>
      {liste.length === 0 ? (
        <Text style={[s.rafBos, { color: R.soluk }]}>{bos ?? 'Henüz rozet yok.'}</Text>
      ) : (
        <View style={s.izgara}>
          {liste.map((o) => (
            <Hucre key={o.r} o={o} genislik={hucre} secili={!!vitrin && vitrin === o.r} onPress={() => acilanAyarla(o)} />
          ))}
        </View>
      )}
      <LinearGradientTahta />
      <RozetDetay oge={acilan} kapat={() => acilanAyarla(null)} kendi={kendi} vitrin={vitrin ?? null} yenile={yenile} />
    </View>
  );
}
function LinearGradientTahta() {
  const R = useRenk();
  return <View style={[s.tahta, { backgroundColor: saydam(R.murekkep, 0.06), borderTopColor: saydam(R.murekkep, 0.14) }]} />;
}
function Hucre({ o, genislik, onPress, secili }: { o: Oge; genislik: number; onPress: () => void; secili: boolean }) {
  const R = useRenk();
  const kilit = o.s === 0;
  const gizli = !!o.gizli;
  const ilerleme = kilit && !gizli && o.esik ? Math.min(1, (o.deger ?? 0) / o.esik[0]) : kilit && o.r === 'donem' ? Math.min(1, (o.deger ?? 0) / (o.hedef ?? 15)) : 0;
  const golge = Platform.OS === 'web' && !kilit ? ({ filter: 'drop-shadow(0 5px 7px rgba(0,0,0,.26))' } as any) : null;
  const ad = gizli ? '???' : BILGI[o.r]?.ad ?? o.r;
  return (
    <Bas onPress={onPress} etiket={`${ad}${o.s ? `, ${seviyeYazi(o.r, o.s)}` : ', henüz kazanılmadı'}`} hoverRenk={R.hover} style={[s.hucre, { width: genislik }]}>
      <View style={golge}>
        <RozetGorsel r={gizli ? 'gizli' : o.r} s={o.s || 1} kilit={kilit && !gizli} no={o.n} boyut={56} etiket="" />
        {!!o.yeni && (
          <View style={[s.yeniEtiket, { backgroundColor: R.vurgu, borderColor: R.panel }]}>
            <Text style={s.yeniYazi}>yeni</Text>
          </View>
        )}
        {secili && !o.yeni && (
          <View style={[s.secili, { backgroundColor: R.vurgu, borderColor: R.panel }]} accessibilityLabel="Adının yanında gösteriliyor">
            <Ikon ad="tik" boyut={10} renk="#fff" kalinlik={3.4} />
          </View>
        )}
      </View>
      <Text numberOfLines={1} style={[s.hAd, { color: kilit ? R.soluk : R.murekkep }, kilit && { fontFamily: yazi.orta }]}>{o.r === 'oncu' && o.n ? `Öncü #${o.n}` : ad}</Text>
      {!!altYazi(o) && <Text numberOfLines={1} style={[s.hAlt, { color: R.soluk }]}>{altYazi(o)}</Text>}
      {kilit && ilerleme > 0 && (
        <View style={[s.cubuk, { backgroundColor: saydam(R.murekkep, 0.1) }]}>
          <View style={[s.cubukDolu, { width: `${Math.max(8, ilerleme * 100)}%`, backgroundColor: R.vurgu }]} />
        </View>
      )}
    </Bas>
  );
}

// ---------- detay ----------
export function RozetDetay({ oge, kapat, kendi, vitrin, yenile }: { oge: Oge | null; kapat: () => void; kendi: boolean; vitrin: string | null; yenile?: () => void }) {
  const R = useRenk();
  const c = useCanli();
  const [onizle, onizleAyarla] = useState(0); // seviye önizleme (0: kendi seviyesi)
  const [bekliyor, bekliyorAyarla] = useState(false);
  const [son, sonAyarla] = useState<Oge | null>(oge);
  useEffect(() => {
    if (oge) {
      sonAyarla(oge);
      onizleAyarla(0);
    }
  }, [oge]);
  const o = oge ?? son;
  if (!o) return <Pencere acik={false} kapat={kapat}>{null}</Pencere>;
  const b = BILGI[o.r];
  const gizli = !!o.gizli;
  const kilit = o.s === 0;
  const seviyeSayisi = o.esik?.length ?? 0;
  const gosterilen = onizle || Math.max(1, o.s);
  const onizlemeKilit = !gizli && (kilit || (onizle > 0 && onizle > o.s));
  const secili = vitrin === o.r;
  const hedef = sonraki(o);
  const oran = hedef ? Math.min(1, (o.deger ?? 0) / hedef) : o.r === 'donem' && kilit ? Math.min(1, (o.deger ?? 0) / (o.hedef ?? 15)) : 0;
  const vitrinDegis = async () => {
    bekliyorAyarla(true);
    const r = await C.vitrinSec(secili ? null : o.r);
    bekliyorAyarla(false);
    if (!r.ok) return c.tost(C.hataYazisi(r.hata, r.durum));
    c.benTazele();
    c.tost(secili ? 'Adının yanından kaldırıldı' : 'Adının yanında görünecek');
    yenile?.();
  };
  const ad = gizli ? 'Gizli rozet' : o.r === 'oncu' && o.n ? `Öncü #${o.n}` : b.ad;
  return (
    <Pencere acik={!!oge} kapat={kapat} genislik={420}>
      <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={s.dKap} showsVerticalScrollIndicator={false}>
        <RozetBuyuk r={gizli ? 'gizli' : o.r} s={gosterilen} kilit={onizlemeKilit} no={o.n} />
        <Text style={[s.dAd, { color: R.murekkep }]}>{ad}</Text>
        {!gizli && (o.s > 0 || o.esik) && (
          <View style={[s.hap, { backgroundColor: o.s > 0 && (!onizle || onizle <= o.s) ? R.vurguYumusak : saydam(R.murekkep, 0.07) }]}>
            <Text style={[s.hapYazi, { color: o.s > 0 && (!onizle || onizle <= o.s) ? R.vurgu : R.soluk }]}>{o.s > 0 && (!onizle || onizle <= o.s) ? seviyeYazi(o.r, gosterilen) || 'kazanıldı' : onizle > 0 ? `${onizle}. seviye · henüz yok` : 'henüz kazanılmadı'}</Text>
          </View>
        )}
        <Text style={[s.dSoz, { color: R.soluk }]}>{gizli ? b.ipucu ?? 'Gizli.' : o.s > 0 && !onizlemeKilit ? b.soz : kilit ? 'Henüz rafında değil.' : b.soz}</Text>

        {seviyeSayisi > 1 && !gizli && (
          <View style={s.seviyeSira}>
            {o.esik!.map((e, i) => {
              const sv = i + 1;
              const kazan = sv <= o.s;
              return (
                <Bas key={sv} onPress={() => onizleAyarla(sv === onizle ? 0 : sv)} etiket={`${sv}. seviye: ${sayiYaz(e)} ${b.birim ?? ''}`} style={[s.sv, { borderColor: gosterilen === sv ? R.vurgu : 'transparent', backgroundColor: R.ust }]}>
                  <RozetGorsel r={o.r} s={sv} kilit={!kazan} mini boyut={34} etiket="" />
                  <Text style={[s.svYazi, { color: kazan ? R.murekkep : R.soluk }]}>{sayiYaz(e)}</Text>
                </Bas>
              );
            })}
          </View>
        )}

        <View style={[s.kutu, { backgroundColor: R.ust }]}>
          <Text style={[s.kutuB, { color: R.soluk }]}>{'Nasıl gelir'.toLocaleUpperCase('tr')}</Text>
          <Text style={[s.kutuY, { color: R.murekkep }]}>{gizli ? 'Bu rozet gizli. Kazanınca ne olduğu açılır.' : b.nasil}</Text>
          {!gizli && o.esik && onizle > 0 && (
            <Text style={[s.kutuY, { color: R.vurgu, fontFamily: yazi.kalin, marginTop: 4 }]}>{onizle}. seviye: {sayiYaz(o.esik[onizle - 1])} {b.birim}</Text>
          )}
        </View>

        {!gizli && (hedef || (o.r === 'donem' && kilit)) && (
          <View style={{ alignSelf: 'stretch', marginTop: 12 }}>
            <View style={s.ilerSatir}>
              <Text style={[s.kutuB, { color: R.soluk, marginBottom: 0 }]}>{(o.s > 0 ? `Sıradaki: ${seviyeYazi(o.r, o.s + 1)}` : 'İlerleme').toLocaleUpperCase('tr')}</Text>
              <Text style={[s.ilerSayi, { color: R.murekkep }]}>{sayiYaz(o.deger ?? 0)} / {sayiYaz(hedef ?? o.hedef ?? 15)} {b.birim}</Text>
            </View>
            <View style={[s.cubukBuyuk, { backgroundColor: saydam(R.murekkep, 0.1) }]}>
              <View style={[s.cubukDolu, { width: `${Math.max(oran > 0 ? 4 : 0, oran * 100)}%`, backgroundColor: R.vurgu }]} />
            </View>
          </View>
        )}
        {o.s > 0 && !!o.t && <Text style={[s.tarih, { color: R.soluk }]}>{kendi ? 'Kazandığın gün' : 'Kazanıldı'}: {tarihYaz(o.t)}</Text>}

        {kendi && o.s > 0 && (
          <Bas onPress={vitrinDegis} devre={bekliyor} etiket={secili ? 'Adımın yanından kaldır' : 'Adımın yanında göster'} style={[s.dugme, secili ? { borderColor: R.vurgu, borderWidth: 1.5, backgroundColor: R.vurguYumusak } : { backgroundColor: R.vurgu }]}>
            {secili && <Ikon ad="tik" boyut={17} renk={R.vurgu} kalinlik={2.6} />}
            <Text style={[s.dugmeYazi, { color: secili ? R.vurgu : '#fff' }]}>{secili ? 'Adımın yanında gösteriliyor' : 'Adımın yanında göster'}</Text>
          </Bas>
        )}
        {kendi && o.s > 0 && secili && <Text style={[s.not, { color: R.soluk }]}>Dokunursan adının yanından kalkar.</Text>}
        {kendi && o.s > 0 && !secili && <Text style={[s.not, { color: R.soluk }]}>Adının yanında yalnız seçtiğin tek rozet görünür.</Text>}
      </ScrollView>
    </Pencere>
  );
}

// Büyük rozet: hafif sallanır.
function RozetBuyuk({ r, s: sv, kilit, no }: { r: string; s: number; kilit: boolean; no?: number }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const d = Animated.loop(Animated.sequence([Animated.timing(a, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: YEREL_SURUCU }), Animated.timing(a, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: YEREL_SURUCU })]));
    d.start();
    return () => d.stop();
  }, []);
  const golge = Platform.OS === 'web' && !kilit ? ({ filter: 'drop-shadow(0 12px 18px rgba(0,0,0,.35))' } as any) : null;
  return (
    <Animated.View style={[golge, { transform: [{ rotate: a.interpolate({ inputRange: [0, 1], outputRange: ['-3deg', '3deg'] }) }, { translateY: a.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }] }]}>
      <RozetGorsel r={r} s={sv} kilit={kilit} no={no} boyut={148} etiket="" />
    </Animated.View>
  );
}

// ---------- kazanma anı ----------
const KONFETI = ['#FFD23F', '#FFFFFF', '#FF9E4A', '#9FEBCF', '#C9B8FF', '#A9D8FF'];
function Konfeti({ renk }: { renk: string }) {
  const parcalar = useMemo(
    () => Array.from({ length: 30 }, (_, i) => ({ x: ((i * 37) % 100) / 100, gec: (i % 10) * 90, boy: 7 + ((i * 5) % 8), renk: i % 3 === 0 ? renk : KONFETI[i % KONFETI.length], don: (i % 2 ? 1 : -1) * (180 + (i % 5) * 90), yuvarlak: i % 4 === 0 })),
    [renk],
  );
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    a.setValue(0);
    Animated.timing(a, { toValue: 1, duration: 2600, easing: Easing.out(Easing.quad), useNativeDriver: YEREL_SURUCU }).start();
  }, []);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {parcalar.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute', left: `${p.x * 100}%`, top: 0, width: p.boy, height: p.yuvarlak ? p.boy : p.boy * 0.5, borderRadius: p.yuvarlak ? p.boy : 2, backgroundColor: p.renk,
            opacity: a.interpolate({ inputRange: [0, 0.08, 0.75, 1], outputRange: [0, 1, 1, 0] }),
            transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [-20, 300 + (i % 6) * 22] }) }, { translateX: a.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, (i % 2 ? 1 : -1) * 18, (i % 2 ? -1 : 1) * 10] }) }, { rotate: a.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.don}deg`] }) }],
          }}
        />
      ))}
    </View>
  );
}
const isinXml = (renk: string) => {
  const n = 14;
  const dilim = Array.from({ length: n }, (_, i) => {
    const a1 = (i * 2 * Math.PI) / n, a2 = a1 + Math.PI / n;
    const p = (a: number) => `${(100 + Math.cos(a) * 100).toFixed(1)} ${(100 + Math.sin(a) * 100).toFixed(1)}`;
    return `<path d="M100 100L${p(a1)}L${p(a2)}Z"/>`;
  }).join('');
  // Işınlar kenara doğru solar (sahne sınırında keskin kesilme yok).
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><radialGradient id="isn" cx=".5" cy=".5" r=".5"><stop offset=".25" stop-color="${renk}" stop-opacity=".32"/><stop offset="1" stop-color="${renk}" stop-opacity="0"/></radialGradient></defs><g fill="url(#isn)">${dilim}</g></svg>`;
};

/** Rozet kazanılınca bir kez açılır: yeni rozetler tek kartta sırayla akar (art arda pencere yok). "Rafa koy" ile görüldü sayılır. */
export function KazanmaAni() {
  const R = useRenk();
  const c = useCanli();
  const [kuyruk, kuyrukAyarla] = useState<RozetKayit[]>([]);
  const [sira, siraAyarla] = useState(0);
  const [acik, acikAyarla] = useState(false);
  const [raf, rafAyarla] = useState<RafOge[]>([]);
  const [secilen, secilenAyarla] = useState<string | null>(null);
  const kilit = useRef(false);
  const girisli = !!c.uye && !c.uye.yeni;
  const baska = !!c.pencere;

  // Açılışta ve zil yoklamasında sunucu "yeni rozet var" derse kartlar çekilir.
  useEffect(() => {
    if (!girisli || acik || kilit.current || baska || c.rozetYeni <= 0) return;
    kilit.current = true;
    C.rozetGetir().then((r) => {
      kilit.current = false;
      c.rozetYeniAyarla(0);
      if (!r.ok) return; // sunucuda rozet kapalıysa ya da bağlantı yoksa sessizce geçilir
      if (!r.veri.yeni.length) return;
      rafAyarla(r.veri.raf);
      secilenAyarla(r.veri.vitrin);
      kuyrukAyarla(r.veri.yeni);
      siraAyarla(0);
      acikAyarla(true);
    });
  }, [girisli, c.rozetYeni, acik, baska]);
  // Girişte bir kez de sor (yoklama 15 sn sonra gelirdi).
  useEffect(() => {
    if (girisli) c.rozetYeniAyarla(Math.max(1, c.rozetYeni));
  }, [girisli]);

  const k = kuyruk[sira];
  const [bekliyor, bekliyorAyarla] = useState(false);
  const bitir = () => {
    if (kilit.current) return;
    kilit.current = true; // "görüldü" yazılana kadar yeniden açılmasın (yoklama aradan yeni sayı getirebilir)
    acikAyarla(false);
    const liste = kuyruk.map((x) => x.r);
    kuyrukAyarla([]);
    C.rozetGoruldu(liste).then(() => {
      kilit.current = false;
      c.rozetYeniAyarla(0);
    });
  };
  const ileri = () => (sira + 1 < kuyruk.length ? siraAyarla(sira + 1) : bitir());
  const vitrinYap = async () => {
    if (!k) return;
    bekliyorAyarla(true);
    const r = await C.vitrinSec(k.r);
    bekliyorAyarla(false);
    if (!r.ok) return c.tost(C.hataYazisi(r.hata, r.durum));
    secilenAyarla(k.r);
    c.benTazele();
    c.tost('Adının yanında görünecek');
  };
  const oge = k ? raf.find((x) => x.r === k.r) : undefined;
  const hedef = oge ? sonraki(oge) : null;
  const b = k ? BILGI[k.r] : null;
  const isin = useRef(new Animated.Value(0)).current;
  const sicra = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!acik) return;
    sicra.setValue(0);
    Animated.spring(sicra, { toValue: 1, friction: 4.2, tension: 70, useNativeDriver: YEREL_SURUCU }).start();
    isin.setValue(0);
    const d = Animated.loop(Animated.timing(isin, { toValue: 1, duration: 22000, easing: Easing.linear, useNativeDriver: YEREL_SURUCU }));
    d.start();
    return () => d.stop();
  }, [acik, sira]);
  const isinRenk = R.gece ? DONEM.vurgu.gece : DONEM.vurgu.gunduz;
  const xmlIsin = useMemo(() => isinXml(isinRenk), [isinRenk]);
  const sonOldu = sira + 1 >= kuyruk.length;
  return (
    <Pencere acik={acik} kapat={bitir} genislik={400}>
      {!!k && !!b && (
        <View style={s.kaKap}>
          <View style={s.kaSahne}>
            <Animated.View style={[s.kaIsin, { transform: [{ rotate: isin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }]} pointerEvents="none">
              <SvgXml xml={xmlIsin} width={250} height={250} />
            </Animated.View>
            <Konfeti key={sira} renk={isinRenk} />
            <Animated.View style={[Platform.OS === 'web' ? ({ filter: 'drop-shadow(0 14px 20px rgba(0,0,0,.4))' } as any) : null, { transform: [{ scale: sicra.interpolate({ inputRange: [0, 1], outputRange: [0.15, 1] }) }, { rotate: sicra.interpolate({ inputRange: [0, 1], outputRange: ['-14deg', '0deg'] }) }] }]}>
              <RozetGorsel r={k.r} s={k.s} no={k.n} boyut={160} etiket={`${b.ad} rozeti`} />
            </Animated.View>
          </View>
          <Text style={[s.kaUst, { color: R.vurgu }]}>{(kuyruk.length > 1 ? `Yeni rozet ${sira + 1}/${kuyruk.length}` : 'Yeni rozet').toLocaleUpperCase('tr')}</Text>
          <Text style={[s.kaAd, { color: R.murekkep }]}>{k.r === 'oncu' && k.n ? `Öncü #${k.n}` : b.ad}{SEVIYELI.has(k.r) ? ` · ${k.s}. seviye` : k.r === 'bumerang' ? ` ×${k.s}` : ''}</Text>
          <Text style={[s.kaSoz, { color: R.soluk }]}>{b.soz}</Text>
          {!!hedef && !!oge && (
            <View style={s.kaHedef}>
              <View style={s.ilerSatir}>
                <Text style={[s.kutuB, { color: R.soluk, marginBottom: 0 }]}>{`Sıradaki: ${seviyeYazi(k.r, k.s + 1)}`.toLocaleUpperCase('tr')}</Text>
                <Text style={[s.ilerSayi, { color: R.murekkep }]}>{sayiYaz(oge.deger ?? 0)} / {sayiYaz(hedef)} {b.birim}</Text>
              </View>
              <View style={[s.cubukBuyuk, { backgroundColor: saydam(R.murekkep, 0.1) }]}>
                <View style={[s.cubukDolu, { width: `${Math.max(4, Math.min(100, ((oge.deger ?? 0) / hedef) * 100))}%`, backgroundColor: R.vurgu }]} />
              </View>
            </View>
          )}
          <Bas onPress={ileri} etiket={sonOldu ? 'Rafa koy' : 'Sıradaki rozet'} style={[s.dugme, { backgroundColor: R.vurgu }]}>
            <Text style={[s.dugmeYazi, { color: '#fff' }]}>{sonOldu ? 'Rafa koy' : 'Sıradaki'}</Text>
          </Bas>
          {k.r !== 'kurucu' && (
            <Bas onPress={vitrinYap} devre={bekliyor || secilen === k.r} etiket="Adımın yanında göster" style={[s.ikincil, { borderColor: R.cizgi }]}>
              {secilen === k.r && <Ikon ad="tik" boyut={16} renk={R.vurgu} kalinlik={2.6} />}
              <Text style={[s.ikincilYazi, { color: secilen === k.r ? R.vurgu : R.murekkep }]}>{secilen === k.r ? 'Adının yanında görünecek' : 'Adımın yanında göster'}</Text>
            </Bas>
          )}
        </View>
      )}
    </Pencere>
  );
}

const s = StyleSheet.create({
  rafBas: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 10 },
  rafB: { fontFamily: yazi.kalin, fontSize: 15.5, letterSpacing: -0.2 },
  rafAlt: { fontFamily: yazi.orta, fontSize: 12.5 },
  rafBos: { fontFamily: yazi.normal, fontSize: 14, paddingVertical: 6 },
  izgara: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 8 },
  hucre: { alignItems: 'center', gap: 2, paddingVertical: 4, borderRadius: 14 },
  hAd: { fontFamily: yazi.kalin, fontSize: 11.5, marginTop: 4, maxWidth: '100%', textAlign: 'center' },
  hAlt: { fontFamily: yazi.normal, fontSize: 10.5, maxWidth: '100%', textAlign: 'center' },
  cubuk: { width: 44, height: 4, borderRadius: 2, overflow: 'hidden', marginTop: 3 },
  cubukDolu: { height: '100%', borderRadius: 3 },
  cubukBuyuk: { height: 8, borderRadius: 4, overflow: 'hidden', marginTop: 7 },
  yeniEtiket: { position: 'absolute', top: -3, right: -8, borderRadius: 8, borderWidth: 2, paddingHorizontal: 5, height: 17, alignItems: 'center', justifyContent: 'center' },
  yeniYazi: { color: '#fff', fontFamily: yazi.kalin, fontSize: 9.5 },
  secili: { position: 'absolute', top: -2, right: -4, width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  tahta: { height: 10, marginTop: 2, marginHorizontal: 4, borderTopWidth: 2, borderBottomLeftRadius: 10, borderBottomRightRadius: 10 },
  dKap: { alignItems: 'center', paddingHorizontal: 22, paddingTop: 22, paddingBottom: 22 },
  dAd: { fontFamily: yazi.kalin, fontSize: 24, letterSpacing: -0.5, marginTop: 10, textAlign: 'center' },
  hap: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, marginTop: 8 },
  hapYazi: { fontFamily: yazi.kalin, fontSize: 12.5 },
  dSoz: { fontFamily: yazi.normal, fontSize: 15, marginTop: 8, textAlign: 'center' },
  seviyeSira: { flexDirection: 'row', gap: 8, marginTop: 14 },
  sv: { width: 78, height: 70, borderRadius: 16, borderWidth: 2, alignItems: 'center', justifyContent: 'center', gap: 2 },
  svYazi: { fontFamily: yazi.kalin, fontSize: 12 },
  kutu: { alignSelf: 'stretch', borderRadius: 16, padding: 14, marginTop: 14 },
  kutuB: { fontFamily: yazi.kalin, fontSize: 11.5, letterSpacing: 1, marginBottom: 5 },
  kutuY: { fontFamily: yazi.normal, fontSize: 14.5, lineHeight: 21 },
  ilerSatir: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 },
  ilerSayi: { fontFamily: yazi.kalin, fontSize: 13.5, fontVariant: ['tabular-nums'] },
  tarih: { fontFamily: yazi.orta, fontSize: 13, marginTop: 12 },
  dugme: { alignSelf: 'stretch', height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 16 },
  dugmeYazi: { fontFamily: yazi.kalin, fontSize: 15.5 },
  not: { fontFamily: yazi.normal, fontSize: 12.5, marginTop: 8, textAlign: 'center' },
  ikincil: { alignSelf: 'stretch', height: 46, borderRadius: 15, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7, marginTop: 10 },
  ikincilYazi: { fontFamily: yazi.kalin, fontSize: 14.5 },
  kaKap: { alignItems: 'center', paddingHorizontal: 22, paddingTop: 10, paddingBottom: 24 },
  kaSahne: { width: '100%', height: 250, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  kaIsin: { position: 'absolute', width: 250, height: 250, alignItems: 'center', justifyContent: 'center' },
  kaUst: { fontFamily: yazi.kalin, fontSize: 12.5, letterSpacing: 1.4, marginTop: 6 },
  kaAd: { fontFamily: yazi.kalin, fontSize: 26, letterSpacing: -0.6, marginTop: 6, textAlign: 'center' },
  kaSoz: { fontFamily: yazi.normal, fontSize: 16, marginTop: 6, textAlign: 'center' },
  kaHedef: { alignSelf: 'stretch', marginTop: 16 },
});
