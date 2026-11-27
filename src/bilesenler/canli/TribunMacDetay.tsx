// Tribün MAÇ EKRANI (Onur 24.10 tasarımı, Mac.dc.html): tek telefon ekranı. Üstte skor tabelası, altında sekmeler Özet · İstatistik · Kadro · Oda.
// Sekme içeriği ekrana sığar; sığmazsa yalnız o bölüm kendi içinde kayar (sayfa kaymaz). Veri tek uçtan (canli.ts tribunMacDetay → sunucu GET /c/tribun/mac?lig=&id=);
// canlı maçta 30 sn'de bir sessizce yenilenir. Bahis oranı yok; oyuncu puanı yok (kaynakta yok). Portal ile aynı koyu stadyum paleti, yazı tipleri ve parçalar.
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, AppState, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { yazi } from '@/tema/tema';
import * as C from '@/canli';
import type { MacAn, MacKadroYan, MacOyuncu, PortalMac, TribunMacDetayVeri } from '@/canli';
import { Bas, Ikon } from './ortak';
import { useCanli } from './baglam';
import { K, Logo, SON, TribunGeri } from './TribunPortal';

const MAKS_GENISLIK = 720;
const AY = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const SEKMELER = [['ozet', 'Özet'], ['ist', 'İstatistik'], ['kadro', 'Kadro'], ['oda', 'Oda']] as const;
type Sekme = (typeof SEKMELER)[number][0];
const EV_RENK = K.vurgu, DEP_RENK = K.mavi;
const AN_RENK: Record<MacAn['tur'], string> = { gol: K.vurgu, kart_sari: K.sari, kart_kirmizi: K.canli, degisiklik: K.gri, penalti: K.turuncu, diger: K.gri };
const FORM_RENK: Record<string, string> = { G: K.yesil, B: K.gri, M: K.canliAcik };
const BASKET = (lig: string) => lig === 'nba' || lig === 'euroleague' || lig === 'bsl';
const gorunuyor = () => (Platform.OS === 'web' ? typeof document === 'undefined' || document.visibilityState !== 'hidden' : AppState.currentState === 'active');
const skorBol = (skor: string | null): [string, string] => {
  const p = (skor ?? '').split(/\s*[-–]\s*/);
  return p.length === 2 ? [p[0], p[1]] : ['', ''];
};
const tarihYaz = (tarih: string | null, saat: string | null) => {
  const p = (tarih ?? '').split('-');
  const ay = Number(p[1]);
  const gun = p.length === 3 && ay >= 1 && ay <= 12 ? `${Number(p[2])} ${AY[ay - 1]} ${p[0]}` : '';
  return [gun, saat].filter(Boolean).join(' · ');
};

// Portalda zaten yüklü olan maç (ekran ilk açılırken başlık anında dolsun, kaynak yanıtı gecikirse de takım adları görünsün).
function portaldaMac(id: string): { m: PortalMac; ligAd: string } | null {
  const v = SON.veri;
  if (!v) return null;
  for (const g of v.gunler) for (const l of g.ligler) { const m = l.maclar.find((x) => x.id === id); if (m) return { m, ligAd: l.ad }; }
  const m = v.canli.find((x) => x.id === id);
  return m ? { m, ligAd: m.lig } : null;
}

// ---------------------------------------------------------------- Saha yerleşimi ----------------------------------------------------------------
// Kaynağın formationPlace numaraları dizilişe göre sabit bir şablondan gelir (kaleci 1). Her şablon: arkadan öne satırlar, her satır soldan sağa (takımın kendi bakışıyla).
// (Sayılar gerçek maç verilerinden çıkarıldı: Süper Lig + 4 büyük lig + Avrupa kupaları.) Şablonda olmayan diziliş ya da eksik yer numarası için dizilişteki sayılara göre bölünür.
const YERLESIM: Record<string, number[][]> = {
  '4-4-2': [[3, 6, 5, 2], [11, 8, 4, 7], [9, 10]],
  '4-2-3-1': [[3, 6, 5, 2], [4, 8], [11, 10, 7], [9]],
  '4-1-4-1': [[3, 6, 5, 2], [4], [11, 10, 8, 7], [9]],
  '4-3-3': [[3, 6, 5, 2], [8, 4, 7], [11, 9, 10]],
  '4-3-2-1': [[3, 6, 5, 2], [7, 4, 8], [11, 10], [9]],
  '5-3-2': [[3, 4, 5, 6, 2], [11, 8, 7], [9, 10]],
  '5-4-1': [[3, 4, 5, 6, 2], [11, 10, 8, 7], [9]],
  '3-4-3': [[4, 5, 6], [3, 8, 7, 2], [11, 9, 10]],
  '3-4-2-1': [[4, 5, 6], [3, 8, 7, 2], [11, 10], [9]],
  '3-4-1-2': [[4, 5, 6], [3, 8, 7, 2], [9], [11, 10]],
  '3-5-2': [[4, 5, 6], [3, 8, 11, 7, 2], [9, 10]],
  '3-1-4-2': [[6, 4, 5], [8], [3, 11, 7, 2], [10, 9]],
};
export function sahaSatirlari(yan: MacKadroYan): { kaleci: MacOyuncu | null; satirlar: MacOyuncu[][] } {
  const ilk = yan.ilk;
  const kaleci = ilk.find((o) => o.yer === 1) ?? ilk.find((o) => o.poz === 'G') ?? null;
  const diger = ilk.filter((o) => o !== kaleci);
  const sablon = yan.dizilis ? YERLESIM[yan.dizilis] : undefined;
  if (sablon) {
    const harita = new Map(diger.map((o) => [o.yer, o] as const));
    const hepsi = sablon.flat();
    if (hepsi.length === diger.length && hepsi.every((p) => harita.has(p))) return { kaleci, satirlar: sablon.map((r) => r.map((p) => harita.get(p)!)) };
  }
  const siralı = diger.slice().sort((a, b) => (a.yer ?? 99) - (b.yer ?? 99));
  const sayilar = (yan.dizilis?.split('-').map(Number) ?? []).filter((n) => n > 0);
  const say = sayilar.reduce((t, n) => t + n, 0) === siralı.length ? sayilar : siralı.length === 10 ? [4, 4, 2] : [siralı.length];
  const satirlar: MacOyuncu[][] = [];
  let i = 0;
  for (const n of say) { satirlar.push(siralı.slice(i, i + n)); i += n; }
  return { kaleci, satirlar: satirlar.filter((r) => r.length) };
}
// Saha üstü konum (yüzde). ust = ev sahibi (üst yarı, kale yukarıda, takımın solu ekranın sağında); alt = deplasman (alt yarı, solu ekranın solunda).
export function sahaKonum(yan: MacKadroYan, ust: boolean): { o: MacOyuncu; x: number; y: number }[] {
  const { kaleci, satirlar } = sahaSatirlari(yan);
  const l: { o: MacOyuncu; x: number; y: number }[] = [];
  const dikey = (t: number) => (ust ? t * 100 : 100 - t * 100);
  if (kaleci) l.push({ o: kaleci, x: 50, y: dikey(0.055) });
  satirlar.forEach((r, i) => {
    const t = 0.16 + 0.28 * (satirlar.length === 1 ? 0.5 : i / (satirlar.length - 1));
    r.forEach((o, j) => { const x = ((j + 0.5) / r.length) * 100; l.push({ o, x: ust ? 100 - x : x, y: dikey(t) }); });
  });
  return l;
}

// ================================================================ ekran ================================================================
export function TribunMacDetay({ lig, id, geri }: { lig: string; id: string; geri: () => void }) {
  const c = useCanli();
  const ust = useSafeAreaInsets().top;
  const pay = Platform.OS === 'web' ? 0 : ust;
  const [veri, veriAyarla] = useState<TribunMacDetayVeri | null>(null);
  const [durum, durumAyarla] = useState<'yukleniyor' | 'hata' | 'tamam'>('yukleniyor');
  const [sekme, sekmeAyarla] = useState<Sekme>('ozet');
  const istekNo = useRef(0);
  const sonDurum = useRef<'canli' | 'bitti' | 'once'>(portaldaMac(id)?.m.durum ?? 'once');
  const sayac = useRef(0);

  const yukle = useCallback((sessiz: boolean) => {
    const no = ++istekNo.current;
    if (!sessiz) durumAyarla('yukleniyor');
    C.tribunMacDetay(lig, id).then((r) => {
      if (no !== istekNo.current) return;
      if (r.ok) {
        if (r.veri.mac.ev.ad) sonDurum.current = r.veri.mac.durum;
        veriAyarla(r.veri);
        durumAyarla('tamam');
      } else if (!sessiz) durumAyarla('hata');
    });
  }, [lig, id]);
  useEffect(() => {
    yukle(false);
    // Canlı maçta 30 sn'de bir; başlamamışta 60 sn'de bir (kaynak 5 dk önbellekli, boşuna yük bindirmez); bitmişte yenileme yok. Ekran görünürken.
    const t = setInterval(() => {
      if (!gorunuyor()) return;
      sayac.current++;
      if (sonDurum.current === 'canli' || (sonDurum.current === 'once' && sayac.current % 2 === 0)) yukle(true);
    }, 30000);
    return () => {
      clearInterval(t);
      istekNo.current++;
    };
  }, [yukle]);

  const yedek = portaldaMac(id);
  const bos = !veri || !veri.mac.ev.ad; // kaynak şimdilik boş döndüyse portaldaki bilgi kullanılır
  const m = bos && yedek
    ? { id, lig, ligAd: yedek.ligAd, ev: yedek.m.ev, dep: yedek.m.dep, skor: yedek.m.skor, durum: yedek.m.durum, dk: yedek.m.dk, saat: yedek.m.saat, tarih: null, stat: null, hakem: null, odaId: yedek.m.odaId }
    : veri?.mac ?? null;

  let icerik: ReactNode;
  if (!veri) {
    icerik = durum === 'hata' ? (
      <View style={s.merkez}>
        <Bas onPress={() => yukle(false)} etiket="Bağlantı sorunu, tekrar dene" style={s.tekrar}>
          <Text style={s.tekrarYazi}>Bağlantı sorunu, tekrar dene</Text>
        </Bas>
      </View>
    ) : (
      <View style={s.merkez}>
        <ActivityIndicator color={K.vurgu} accessibilityLabel="Yükleniyor" />
      </View>
    );
  } else if (sekme === 'ozet') icerik = <Ozet veri={veri} m={m!} />;
  else if (sekme === 'ist') icerik = <Istatistik veri={veri} m={m!} />;
  else if (sekme === 'kadro') icerik = <Kadro veri={veri} m={m!} />;
  else icerik = <Oda veri={veri} m={m!} odayaGit={(oda) => c.git({ tur: 'tribunMac', id: oda })} />;

  return (
    <View style={s.kok}>
      <StatusBar style="light" />
      <View style={s.sutun}>
        <Tabela m={m} anlar={veri?.anlar ?? []} geri={geri} pay={pay} lig={lig} />
        <View style={s.sekmeler} accessibilityRole="tablist">
          {SEKMELER.map(([k, ad]) => {
            const sec = sekme === k;
            return (
              <Bas key={k} onPress={() => sekmeAyarla(k)} rol="tab" etiket={ad} secili={sec} style={[s.sekme, { borderBottomColor: sec ? K.vurgu : 'transparent' }]}>
                <Text style={[s.sekmeYazi, { color: sec ? K.yazi : K.soluk, fontFamily: sec ? yazi.kalin : yazi.orta }]} numberOfLines={1}>{ad}</Text>
              </Bas>
            );
          })}
        </View>
        <View style={s.govde}>{icerik}</View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------- skor tabelası ----------------------------------------------------------------
const soyad = (metin: string) => {
  const ad = metin.split(' · ')[1] ?? '';
  const p = ad.replace(/ girdi,.*$/, '').trim().split(/\s+/);
  return p[p.length - 1] || '';
};
function golYaz(a: MacAn) {
  const k = /^Kendi kalesine/.test(a.metin) ? ' (k.k.)' : /^Penaltı/.test(a.metin) ? ' (P)' : '';
  return `${soyad(a.metin)}${k} ${a.dk}`.trim();
}
function Tabela({ m, anlar, geri, pay, lig }: { m: TribunMacDetayVeri['mac'] | null; anlar: MacAn[]; geri: () => void; pay: number; lig: string }) {
  const canli = m?.durum === 'canli';
  const [a, b] = skorBol(m?.skor ?? null);
  const goller = anlar.filter((x) => x.tur === 'gol');
  const evGol = goller.filter((x) => x.taraf === 'ev').slice(0, 5), depGol = goller.filter((x) => x.taraf === 'dep').slice(0, 5);
  const baslik = m?.ligAd || ' ';
  const sonuc = m ? `${m.ev.ad} ${m.skor ?? 'maç öncesi'} ${m.dep.ad}${canli ? `, canlı ${m.dk ?? ''}` : m.durum === 'bitti' ? ', maç sonu' : `, ${m.saat ?? ''}`}` : 'Maç yükleniyor';
  return (
    <View style={[s.tabela, { paddingTop: 10 + pay }]} accessible accessibilityLabel={sonuc}>
      <LinearGradient colors={['#16212B', '#0B1017', K.zemin]} locations={[0, 0.55, 1]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={s.tabelaDaire} pointerEvents="none" />
      <View style={s.tabelaUst}>
        <TribunGeri onPress={geri} etiket="Geri" />
        <Text style={s.tabelaLig} numberOfLines={1}>{baslik}</Text>
        <View style={{ width: 44 }} />
      </View>
      <View style={s.tabelaOrta} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={s.tabelaTakim}>
          {m && m.ev.ad ? <Logo t={m.ev} boyut={48} /> : <View style={s.logoBos} />}
          <Text style={s.tabelaAd} numberOfLines={2}>{m?.ev.ad ?? ''}</Text>
        </View>
        <View style={s.tabelaSkor}>
          {m?.durum === 'once' || !m?.skor ? (
            <>
              <Text style={s.tabelaSaat}>{m?.saat ?? '–'}</Text>
              {!!m?.tarih && <Text style={s.tabelaTarih}>{tarihYaz(m.tarih, null)}</Text>}
              {m?.dk === 'Ertelendi' || m?.dk === 'Yarıda' ? <Text style={[s.tabelaTarih, { color: K.sari }]}>{m.dk}</Text> : null}
            </>
          ) : (
            <>
              <View style={s.skorSatir}>
                <Text style={s.tabelaRakam}>{a}</Text>
                <Text style={s.tabelaIki}>:</Text>
                <Text style={s.tabelaRakam}>{b}</Text>
              </View>
              {canli ? (
                <View style={s.canliRozet}><View style={s.canliNokta} /><Text style={s.canliYazi}>{m.dk ?? 'CANLI'}</Text></View>
              ) : (
                <View style={[s.canliRozet, { backgroundColor: 'rgba(138,148,163,.16)' }]}><Text style={[s.canliYazi, { color: K.orta }]}>MS</Text></View>
              )}
            </>
          )}
        </View>
        <View style={s.tabelaTakim}>
          {m && m.dep.ad ? <Logo t={m.dep} boyut={48} /> : <View style={s.logoBos} />}
          <Text style={s.tabelaAd} numberOfLines={2}>{m?.dep.ad ?? ''}</Text>
        </View>
      </View>
      {(evGol.length > 0 || depGol.length > 0) && !BASKET(lig) && (
        <View style={s.goller}>
          <View style={{ flex: 1 }}>{evGol.map((g, i) => <Text key={i} style={s.golYazi} numberOfLines={1}>{golYaz(g)}</Text>)}</View>
          <View style={{ flex: 1 }}>{depGol.map((g, i) => <Text key={i} style={[s.golYazi, { textAlign: 'right' }]} numberOfLines={1}>{golYaz(g)}</Text>)}</View>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------- Özet ----------------------------------------------------------------
function Ozet({ veri, m }: { veri: TribunMacDetayVeri; m: TribunMacDetayVeri['mac'] }) {
  const once = m.durum === 'once';
  const anlar = veri.anlar.slice().reverse();
  const bilgi: [string, string][] = ([
    ['Stat', m.stat ?? ''], ['Hakem', m.hakem ?? ''], ['Tarih', tarihYaz(m.tarih, m.saat)], ['Lig', m.ligAd],
  ] as [string, string][]).filter(([, d]) => !!d);
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={s.sekmeIc} showsVerticalScrollIndicator={false}>
      {!once && (
        <Kutu>
          {anlar.length === 0 ? (
            <Bos yazi={m.durum === 'canli' ? 'Henüz önemli an yok' : BASKET(m.lig) ? 'Bu maç için önemli an listesi yok' : 'Önemli an bilgisi yok'} />
          ) : (
            anlar.map((a, i) => (
              <View key={i} accessible accessibilityLabel={`${a.dk} ${a.metin}`} style={[s.anSatir, i > 0 && { borderTopWidth: 1, borderTopColor: K.ince }]}>
                <Text style={s.anDk}>{a.dk}</Text>
                <View style={[s.anNokta, { backgroundColor: AN_RENK[a.tur] }]} />
                <Text style={[s.anMetin, a.tur === 'gol' && { fontFamily: yazi.kalin }]} numberOfLines={2}>{a.metin}</Text>
                {a.tur !== 'diger' && <Text style={s.anTakim}>{(a.taraf === 'ev' ? m.ev : m.dep).kisa}</Text>}
              </View>
            ))
          )}
        </Kutu>
      )}
      {veri.form && (
        <Kutu style={{ padding: 12, gap: 10 }}>
          <Text style={s.kutuBaslik}>SON 5 MAÇ</Text>
          {([[m.ev, veri.form.ev], [m.dep, veri.form.dep]] as const).map(([t, f], i) => (
            <View key={i} style={s.formSatir} accessible accessibilityLabel={`${t.ad} son maçlar: ${f.length ? f.join(' ') : 'bilgi yok'}`}>
              <Logo t={t} boyut={22} />
              <Text style={s.formAd} numberOfLines={1}>{t.ad}</Text>
              <View style={s.formKareler}>
                {f.length === 0 ? <Text style={s.soluk}>–</Text> : f.map((x, j) => <View key={j} style={[s.formKare, { backgroundColor: FORM_RENK[x] ?? K.gri }]}><Text style={s.formHarf}>{x}</Text></View>)}
              </View>
            </View>
          ))}
        </Kutu>
      )}
      {bilgi.length > 0 && (
        <Kutu style={{ paddingHorizontal: 12, paddingVertical: 4 }}>
          {bilgi.map(([a, d], i) => (
            <View key={a} style={[s.bilgiSatir, i > 0 && { borderTopWidth: 1, borderTopColor: K.ince }]}>
              <Text style={s.bilgiAd}>{a}</Text>
              <Text style={s.bilgiDeger} numberOfLines={2}>{d}</Text>
            </View>
          ))}
        </Kutu>
      )}
    </ScrollView>
  );
}

// ---------------------------------------------------------------- İstatistik ----------------------------------------------------------------
function Istatistik({ veri, m }: { veri: TribunMacDetayVeri; m: TribunMacDetayVeri['mac'] }) {
  if (veri.ist.length === 0) return <Bos yazi="Maç başlayınca istatistikler burada" />;
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={s.sekmeIc} showsVerticalScrollIndicator={false}>
      <Kutu style={{ padding: 14, gap: 14 }}>
        <View style={s.istBaslik}>
          <View style={s.istTakim}><View style={[s.istNokta, { backgroundColor: EV_RENK }]} /><Text style={s.istTakimAd} numberOfLines={1}>{m.ev.kisa || m.ev.ad}</Text></View>
          <View style={s.istTakim}><Text style={s.istTakimAd} numberOfLines={1}>{m.dep.kisa || m.dep.ad}</Text><View style={[s.istNokta, { backgroundColor: DEP_RENK }]} /></View>
        </View>
        {veri.ist.map((x) => (
          <View key={x.ad} accessible accessibilityLabel={`${x.ad}: ${m.ev.ad} ${x.ev}, ${m.dep.ad} ${x.dep}`}>
            <View style={s.istUst}>
              <Text style={s.istDeger}>{x.ev}</Text>
              <Text style={s.istAd}>{x.ad}</Text>
              <Text style={s.istDeger}>{x.dep}</Text>
            </View>
            <View style={s.istCubuklar}>
              <View style={[s.istCubuk, { alignItems: 'flex-end' }]}><View style={{ width: `${Math.round(x.evOran * 100)}%`, height: 6, backgroundColor: EV_RENK }} /></View>
              <View style={s.istCubuk}><View style={{ width: `${Math.round(x.depOran * 100)}%`, height: 6, backgroundColor: DEP_RENK }} /></View>
            </View>
          </View>
        ))}
      </Kutu>
    </ScrollView>
  );
}

// ---------------------------------------------------------------- Kadro ----------------------------------------------------------------
function Kadro({ veri, m }: { veri: TribunMacDetayVeri; m: TribunMacDetayVeri['mac'] }) {
  const [alan, alanAyarla] = useState(0);
  const [yedekAcik, yedekAcikAyarla] = useState(false);
  const k = veri.kadro;
  if (!k) return <Bos yazi="Kadrolar maçtan yaklaşık 1 saat önce açıklanır" />;
  const basket = BASKET(m.lig);
  const sahaY = Math.max(340, Math.min(540, alan - 56));
  return (
    <View style={{ flex: 1 }} onLayout={(e) => alanAyarla(e.nativeEvent.layout.height)}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.sekmeIc} showsVerticalScrollIndicator={false}>
        {basket ? <BasketKadro k={k} m={m} /> : <Saha k={k} m={m} yukseklik={sahaY} />}
        {basket ? null : (
          <>
            <View style={s.sahaAlt}>
              <Text style={s.sahaAltYazi} numberOfLines={1}>{m.ev.kisa} {k.ev.dizilis ?? ''} · üstte</Text>
              <Text style={s.sahaAltYazi} numberOfLines={1}>{m.dep.kisa} {k.dep.dizilis ?? ''} · altta</Text>
            </View>
            <Bas onPress={() => yedekAcikAyarla(!yedekAcik)} etiket={yedekAcik ? 'Yedekleri gizle' : 'Yedekleri göster'} style={s.yedekDugme}>
              <Text style={s.yedekDugmeYazi}>{yedekAcik ? 'Yedekleri gizle' : `Yedekler (${k.ev.yedek.length + k.dep.yedek.length})`}</Text>
            </Bas>
            {yedekAcik && (
              <View style={s.yedekler}>
                <YedekListe takim={m.ev.kisa || m.ev.ad} liste={k.ev.yedek} renk={EV_RENK} />
                <YedekListe takim={m.dep.kisa || m.dep.ad} liste={k.dep.yedek} renk={DEP_RENK} />
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
function Saha({ k, m, yukseklik }: { k: NonNullable<TribunMacDetayVeri['kadro']>; m: TribunMacDetayVeri['mac']; yukseklik: number }) {
  const boyut = Math.max(20, Math.min(26, Math.round(yukseklik / 18)));
  const cizgi = 'rgba(255,255,255,.25)';
  const yerler = [...sahaKonum(k.ev, true).map((p) => ({ ...p, renk: EV_RENK })), ...sahaKonum(k.dep, false).map((p) => ({ ...p, renk: DEP_RENK }))];
  return (
    <View style={[s.saha, { height: yukseklik }]} accessibilityLabel={`${m.ev.ad} ve ${m.dep.ad} ilk on birleri, saha dizilişi`}>
      <View style={{ position: 'absolute', left: 12, right: 12, top: '50%', height: 1, backgroundColor: cizgi }} />
      <View style={{ position: 'absolute', left: '50%', top: '50%', width: 80, height: 80, marginLeft: -40, marginTop: -40, borderWidth: 1, borderColor: cizgi, borderRadius: 40 }} />
      <View style={{ position: 'absolute', left: '30%', right: '30%', top: 0, height: 46, borderWidth: 1, borderTopWidth: 0, borderColor: cizgi }} />
      <View style={{ position: 'absolute', left: '30%', right: '30%', bottom: 0, height: 46, borderWidth: 1, borderBottomWidth: 0, borderColor: cizgi }} />
      {yerler.map((p, i) => (
        <View key={i} accessible accessibilityLabel={`${p.o.no} ${p.o.ad}`} style={[s.oyuncu, { left: `${p.x}%`, top: `${p.y}%`, width: 70, marginLeft: -35, transform: [{ translateY: -(boyut + 14) / 2 }] }]}>
          <View style={[s.forma, { width: boyut, height: boyut, borderRadius: boyut / 2, backgroundColor: p.renk }]}>
            <Text style={[s.formaNo, { fontSize: boyut > 24 ? 12 : 11 }]}>{p.o.no}</Text>
          </View>
          <Text style={s.oyuncuAd} numberOfLines={1}>{p.o.kisa}</Text>
        </View>
      ))}
    </View>
  );
}
function YedekListe({ takim, liste, renk }: { takim: string; liste: MacOyuncu[]; renk: string }) {
  return (
    <View style={{ flex: 1, minWidth: 0 }}>
      <View style={s.istTakim}><View style={[s.istNokta, { backgroundColor: renk }]} /><Text style={s.istTakimAd}>{takim}</Text></View>
      {liste.length === 0 ? <Text style={s.soluk}>Yedek bilgisi yok</Text> : liste.map((o, i) => (
        <View key={i} style={s.oyuncuSatir}>
          <Text style={s.oyuncuNo}>{o.no}</Text>
          <Text style={s.oyuncuIsim} numberOfLines={1}>{o.ad}</Text>
        </View>
      ))}
    </View>
  );
}
function BasketKadro({ k, m }: { k: NonNullable<TribunMacDetayVeri['kadro']>; m: TribunMacDetayVeri['mac'] }) {
  const sut = (takim: string, yan: MacKadroYan, renk: string) => (
    <View style={{ flex: 1, minWidth: 0 }}>
      <View style={[s.istTakim, { marginBottom: 6 }]}><View style={[s.istNokta, { backgroundColor: renk }]} /><Text style={s.istTakimAd} numberOfLines={1}>{takim}</Text></View>
      <Text style={s.kutuBaslik}>İLK BEŞ</Text>
      {yan.ilk.map((o, i) => (
        <View key={i} style={s.oyuncuSatir} accessible accessibilityLabel={`${o.no} ${o.ad}, ${o.poz}`}>
          <Text style={s.oyuncuNo}>{o.no}</Text>
          <Text style={s.oyuncuIsim} numberOfLines={1}>{o.ad}</Text>
          <Text style={s.oyuncuPoz}>{o.poz}</Text>
        </View>
      ))}
      {yan.yedek.length > 0 && <Text style={[s.kutuBaslik, { marginTop: 10 }]}>YEDEKLER</Text>}
      {yan.yedek.map((o, i) => (
        <View key={i} style={s.oyuncuSatir} accessible accessibilityLabel={`${o.no} ${o.ad}, ${o.poz}`}>
          <Text style={s.oyuncuNo}>{o.no}</Text>
          <Text style={[s.oyuncuIsim, { color: K.orta }]} numberOfLines={1}>{o.ad}</Text>
          <Text style={s.oyuncuPoz}>{o.poz}</Text>
        </View>
      ))}
    </View>
  );
  return (
    <Kutu style={{ padding: 12, flexDirection: 'row', gap: 14 }}>
      {sut(m.ev.ad, k.ev, EV_RENK)}
      {sut(m.dep.ad, k.dep, DEP_RENK)}
    </Kutu>
  );
}

// ---------------------------------------------------------------- Oda ----------------------------------------------------------------
function Oda({ veri, m, odayaGit }: { veri: TribunMacDetayVeri; m: TribunMacDetayVeri['mac']; odayaGit: (id: string) => void }) {
  if (m.odaId) {
    return (
      <View style={s.sekmeIc}>
        <Kutu style={{ padding: 16, gap: 12 }}>
          <View style={s.odaUst}><View style={s.canliNokta} /><Text style={s.kutuBaslik}>MAÇ ODASI AÇIK</Text></View>
          <Text style={s.odaMetin}>{m.ev.ad} – {m.dep.ad} için Tribün odası açık. Maçı izleyenlerle birlikte yaz, tepki ver, maçı birlikte yaşa.</Text>
          <Bas onPress={() => odayaGit(m.odaId!)} etiket={`${m.ev.ad} ${m.dep.ad} maç odasına gir`} rol="link" style={s.odaDugme}>
            <Text style={s.odaDugmeYazi}>Odaya gir</Text>
            <Ikon ad="ok" boyut={18} renk={K.zemin} kalinlik={2.4} />
          </Bas>
        </Kutu>
      </View>
    );
  }
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={s.sekmeIc} showsVerticalScrollIndicator={false}>
      <Kutu style={{ padding: 16 }}>
        <Text style={s.odaMetin}>Bu maç için oda açılmadı. Büyük maçlarda oda açılır.</Text>
      </Kutu>
      {veri.anlatim.length > 0 && (
        <Kutu>
          <Text style={[s.kutuBaslik, { padding: 12, paddingBottom: 4 }]}>CANLI ANLATIM</Text>
          {veri.anlatim.map((a, i) => (
            <View key={i} style={[s.anSatir, { height: undefined, minHeight: 40, paddingVertical: 8 }, i > 0 && { borderTopWidth: 1, borderTopColor: K.ince }]}>
              <Text style={s.anDk}>{a.dk}</Text>
              <Text style={s.anMetin}>{a.metin}</Text>
            </View>
          ))}
        </Kutu>
      )}
    </ScrollView>
  );
}

// ---------------------------------------------------------------- küçük parçalar ----------------------------------------------------------------
function Kutu({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[s.kart, style]}>{children}</View>;
}
function Bos({ yazi: y }: { yazi: string }) {
  return (
    <View style={s.bos}>
      <Text style={s.bosYazi}>{y}</Text>
    </View>
  );
}

// ================================================================ biçimler ================================================================
const s = StyleSheet.create({
  kok: { flex: 1, backgroundColor: K.zemin },
  sutun: { flex: 1, width: '100%', maxWidth: MAKS_GENISLIK, alignSelf: 'center' },
  govde: { flex: 1, minHeight: 0, overflow: 'hidden' },
  merkez: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 20 },
  bos: { alignItems: 'center', justifyContent: 'center', paddingVertical: 28, paddingHorizontal: 20 },
  bosYazi: { fontFamily: yazi.orta, fontSize: 14, color: K.soluk, textAlign: 'center' },
  soluk: { fontFamily: yazi.normal, fontSize: 12, color: K.soluk },
  tekrar: { minHeight: 44, paddingHorizontal: 20, borderRadius: 12, backgroundColor: K.vurgu, alignItems: 'center', justifyContent: 'center' },
  tekrarYazi: { fontFamily: yazi.kalin, fontSize: 14.5, color: K.zemin },
  kart: { borderRadius: 14, backgroundColor: K.kart, borderWidth: 1, borderColor: K.cizgi, overflow: 'hidden' },
  kutuBaslik: { fontFamily: yazi.kalin, fontSize: 11, letterSpacing: 0.4, color: K.soluk },
  sekmeIc: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12, gap: 10 },
  // tabela
  tabela: { paddingBottom: 10, paddingHorizontal: 16, overflow: 'hidden' },
  tabelaDaire: { position: 'absolute', right: -70, top: -90, width: 260, height: 260, borderRadius: 130, borderWidth: 2, borderColor: 'rgba(198,244,50,0.10)' },
  tabelaUst: { flexDirection: 'row', alignItems: 'center', marginLeft: -6, marginRight: -6 },
  tabelaLig: { flex: 1, textAlign: 'center', fontFamily: yazi.orta, fontSize: 12.5, color: K.orta },
  tabelaOrta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  tabelaTakim: { width: 96, alignItems: 'center', gap: 6 },
  logoBos: { width: 48, height: 48, borderRadius: 24, backgroundColor: K.cizgi2 },
  tabelaAd: { fontFamily: yazi.kalin, fontSize: 13, lineHeight: 16, color: K.yazi, textAlign: 'center', minHeight: 32 },
  tabelaSkor: { alignItems: 'center', minWidth: 110 },
  skorSatir: { flexDirection: 'row', alignItems: 'center' },
  tabelaRakam: { fontFamily: yazi.darKalin, fontSize: 58, lineHeight: 62, color: K.yazi },
  tabelaIki: { fontFamily: yazi.darKalin, fontSize: 44, lineHeight: 52, color: K.gri, marginHorizontal: 8 },
  tabelaSaat: { fontFamily: yazi.darKalin, fontSize: 46, lineHeight: 50, color: K.yazi },
  tabelaTarih: { fontFamily: yazi.orta, fontSize: 12, color: K.soluk, marginTop: 2 },
  canliRozet: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, backgroundColor: 'rgba(255,59,48,.18)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  canliNokta: { width: 7, height: 7, borderRadius: 4, backgroundColor: K.canli },
  canliYazi: { fontFamily: yazi.kalin, fontSize: 12, color: K.canliAcik },
  goller: { flexDirection: 'row', gap: 16, marginTop: 8, minHeight: 0 },
  golYazi: { fontFamily: yazi.normal, fontSize: 11.5, lineHeight: 15, color: K.orta },
  // sekmeler
  sekmeler: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: K.cizgi, paddingHorizontal: 6 },
  sekme: { flex: 1, height: 46, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 3 },
  sekmeYazi: { fontSize: 14 },
  // özet
  anSatir: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 42, paddingHorizontal: 12 },
  anDk: { width: 40, fontFamily: yazi.dar, fontSize: 16, color: K.orta },
  anNokta: { width: 10, height: 10, borderRadius: 5 },
  anMetin: { flex: 1, fontFamily: yazi.normal, fontSize: 13, color: K.yazi },
  anTakim: { fontFamily: yazi.kalin, fontSize: 10.5, color: K.soluk },
  formSatir: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  formAd: { flex: 1, fontFamily: yazi.orta, fontSize: 13, color: K.yazi },
  formKareler: { flexDirection: 'row', gap: 4 },
  formKare: { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  formHarf: { fontFamily: yazi.kalin, fontSize: 11.5, color: K.zemin },
  bilgiSatir: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 40 },
  bilgiAd: { fontFamily: yazi.normal, fontSize: 12.5, color: K.soluk },
  bilgiDeger: { flexShrink: 1, fontFamily: yazi.orta, fontSize: 13, color: K.yazi, textAlign: 'right' },
  // istatistik
  istBaslik: { flexDirection: 'row', justifyContent: 'space-between' },
  istTakim: { flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0 },
  istNokta: { width: 8, height: 8, borderRadius: 4 },
  istTakimAd: { fontFamily: yazi.kalin, fontSize: 12, color: K.orta },
  istUst: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 },
  istDeger: { fontFamily: yazi.dar, fontSize: 18, lineHeight: 20, color: K.yazi, minWidth: 44 },
  istAd: { fontFamily: yazi.normal, fontSize: 12, color: K.soluk },
  istCubuklar: { flexDirection: 'row', gap: 4 },
  istCubuk: { flex: 1, height: 6, borderRadius: 3, backgroundColor: K.cizgi, overflow: 'hidden' },
  // kadro
  saha: { borderRadius: 16, backgroundColor: '#0F3B24', borderWidth: 1, borderColor: K.cizgi, overflow: 'hidden' },
  oyuncu: { position: 'absolute', alignItems: 'center', gap: 1 },
  forma: { alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,.7)' },
  formaNo: { fontFamily: yazi.kalin, color: K.zemin },
  oyuncuAd: { maxWidth: 70, fontFamily: yazi.orta, fontSize: 9.5, lineHeight: 12, color: K.yazi, backgroundColor: 'rgba(0,0,0,.45)', paddingHorizontal: 4, borderRadius: 4, overflow: 'hidden' },
  sahaAlt: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  sahaAltYazi: { flexShrink: 1, fontFamily: yazi.normal, fontSize: 12, color: K.soluk },
  yedekDugme: { minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: K.cizgi2, backgroundColor: K.kart, alignItems: 'center', justifyContent: 'center' },
  yedekDugmeYazi: { fontFamily: yazi.kalin, fontSize: 13.5, color: K.yazi },
  yedekler: { flexDirection: 'row', gap: 14, padding: 12, borderRadius: 14, backgroundColor: K.kart, borderWidth: 1, borderColor: K.cizgi },
  oyuncuSatir: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 32, borderTopWidth: 1, borderTopColor: K.ince },
  oyuncuNo: { width: 22, fontFamily: yazi.dar, fontSize: 15, color: K.soluk, textAlign: 'right' },
  oyuncuIsim: { flex: 1, fontFamily: yazi.normal, fontSize: 12.5, color: K.yazi },
  oyuncuPoz: { fontFamily: yazi.kalin, fontSize: 10, color: K.soluk },
  // oda
  odaUst: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  odaMetin: { fontFamily: yazi.normal, fontSize: 14, lineHeight: 20, color: K.orta },
  odaDugme: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, backgroundColor: K.vurgu },
  odaDugmeYazi: { fontFamily: yazi.kalin, fontSize: 14.5, color: K.zemin },
});
