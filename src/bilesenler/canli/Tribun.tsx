// Tribün (plan/27, plan/33; Onur 08.10): büyük maçlar için canlı oda. Üç ekran: takvim · maç odası · (muhabir paneli ayrı dosyada).
// Oda: tabela + dakika şeridi · Oda (olay kartları + Yazsam mı? yorumları + kullanıcı mesajları + "Sence doğru karar mı?") · Olaylar · Tahmin
// · (yetkiliye) Muhabir. Maç sonunda paylaşılabilir özet kartı. Kulüp logosu yok: iki renk + kısaltma. Bahis/ödül yok.
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { yazi } from '@/tema/tema';
import * as C from '@/canli';
import type { TribunKadro, TribunKadroTakim, TribunKarar, TribunMac, TribunMesaj, TribunOda, TribunOlay, TribunTepkiSatiri, TribunTepkiTur } from '@/canli';
import { useGenis } from '@/bilesenler/Genis';
import { Avatar, Bas, Belir, CanliNokta, Dugme, Ikon, Pencere, YzEtiketi, useRenk, Rozet } from './ortak';
import { useCanli } from './baglam';
import { UstBaslik, useYazmaAltPayi } from './Duzen';
import { useKlavye } from './klavye';
import { KarakterHalkasi, harfSay } from './Sayac';
import { Tabela, TakimRozeti, TopIkon, bizIz, gunBasligi, kalanYaz, saatYaz, sa, trGun, useSimdi } from './tribunOrtak';
import { MuhabirPaneli } from './TribunMuhabir';
import { EtiketOneri, EtiketliMetin } from './Etiket';
import { tribunKartiPaylas } from './tribunKarti';
import { EngelAlani, useEngel } from './engel';
import { OdaUstSerit, TepkiSatir, TepkiSatiri } from './tribunSohbet';

const MESAJ_SINIR = 160;

// ============================================================ takvim ============================================================
export function TribunTakvim({ geri }: { geri?: () => void }) {
  const R = useRenk();
  const c = useCanli();
  const genis = useGenis();
  const [veri, veriAyarla] = useState<{ maclar: TribunMac[]; benMuhabir: boolean; simdi: number } | null>(null);
  const [hata, hataAyarla] = useState(false);
  const [bekleyen, bekleyenAyarla] = useState(false);
  const yukle = useCallback(() => {
    C.tribunTakvim().then((r) => {
      if (r.ok) { veriAyarla(r.veri); hataAyarla(false); } else hataAyarla(true);
    });
  }, []);
  useEffect(() => {
    yukle();
    const t = setInterval(yukle, 15000);
    return () => clearInterval(t);
  }, [yukle, c.uye?.uid]);
  const simdi = useSimdi(veri?.simdi, 15000);
  const hatirlat = (m: TribunMac) => {
    const yap = () => {
      C.tribunHatirlat(m.id, !m.ben.hatirlat).then((r) => {
        if (!r.ok) c.tost(C.hataYazisi(r.hata, r.durum));
        else { c.tost(!m.ben.hatirlat ? 'Hatırlatma açık: karar anlarında seni etiketleriz' : 'Hatırlatma kapandı'); yukle(); }
      });
    };
    if (c.girisIste('Hatırlatma için giriş yap', yap)) yap();
  };
  // Deneme araçları (yalnız deneme sitesi / yerel): yeniden oynatma ve olaysız deneme odası.
  const tekrarBaslat = (kayit: 'amed_bes' | 'bos') => {
    bekleyenAyarla(true);
    C.tribunTekrarBaslat({ ...(kayit === 'bos' ? ({ kayit: 'bos' } as any) : { hiz: 25 }), once_sn: 25 } as any).then((r) => {
      bekleyenAyarla(false);
      if (r.ok) c.git({ tur: 'tribunMac', id: r.veri.id });
      else c.tost(C.hataYazisi(r.hata, r.durum));
    });
  };
  const liste = veri?.maclar ?? [];
  const canli = liste.filter((m) => m.durum === 'canli' || m.durum === 'devre');
  const yaklasan = liste.filter((m) => m.durum === 'oncesi' && !m.tekrar);
  const biten = liste.filter((m) => m.durum === 'bitti').sort((a, b) => (b.bitis ?? 0) - (a.bitis ?? 0));
  const tekrarlar = liste.filter((m) => m.tekrar && m.durum === 'oncesi');
  const oneCikan: TribunMac | undefined = canli[0] ?? yaklasan[0];
  const gunler = useMemo(() => {
    const g: { gun: string; ms: number; liste: TribunMac[] }[] = [];
    for (const m of yaklasan) {
      const k = trGun(m.baslangic);
      const son = g.find((x) => x.gun === k);
      if (son) son.liste.push(m);
      else g.push({ gun: k, ms: m.baslangic, liste: [m] });
    }
    return g;
  }, [yaklasan.map((m) => m.id).join()]);
  const kutu = genis ? { paddingHorizontal: 28, maxWidth: 820, alignSelf: 'center' as const, width: '100%' as const } : null;
  return (
    <View style={{ flex: 1 }}>
      <UstBaslik baslik="Tribün" geri={geri} />
      <ScrollView contentContainerStyle={[{ paddingTop: 14, paddingBottom: 40, gap: 12, paddingHorizontal: genis ? 0 : 14 }]} showsVerticalScrollIndicator={false}>
        <View style={[kutu, { gap: 12 }]}>
          <View style={s.tanitim}>
            <Text style={[s.tanitimBaslik, { color: R.murekkep }]}>Maç odası</Text>
            <Text style={[s.tanitimYazi, { color: R.soluk }]}>Gol, kart ve karar anları odada canlı. Tahminini yap, tribüne yaz; Yazsam mı? her anı yorumlar.</Text>
          </View>
          {oneCikan && (
            <Belir>
              <Bas onPress={() => c.git({ tur: 'tribunMac', id: oneCikan.id })} etiket={`${oneCikan.ev.ad} ${oneCikan.dep.ad} maç odası`} rol="link">
                <Tabela mac={oneCikan} olaylar={[]} dkSayi={parseInt(oneCikan.dk, 10) || 0} bekle={oneCikan.durum === 'oncesi' ? `${kalanYaz(oneCikan.baslangic - simdi)} sonra` : undefined} />
              </Bas>
              <View style={s.heroAlt}>
                <Text style={[s.heroKanal, { color: R.soluk }]} numberOfLines={1}>{oneCikan.durum === 'oncesi' ? `${gunBasligi(oneCikan.baslangic, simdi).split(' · ').pop()} ${saatYaz(oneCikan.baslangic)}${genis && oneCikan.kanal ? ` · ${oneCikan.kanal}` : ''}` : `${oneCikan.odada} kişi odada`}</Text>
                <View style={{ flex: 1 }} />
                {oneCikan.durum === 'oncesi' && !oneCikan.tekrar && (
                  <Bas onPress={() => hatirlat(oneCikan)} etiket={oneCikan.ben.hatirlat ? 'Hatırlatmayı kapat' : 'Hatırlat'} style={[s.hatirlat, { borderColor: oneCikan.ben.hatirlat ? R.vurgu : R.cizgi, backgroundColor: oneCikan.ben.hatirlat ? R.vurguYumusak : 'transparent' }]} hitSlop={4}>
                    <Ikon ad="zil" boyut={14} renk={oneCikan.ben.hatirlat ? R.vurgu : R.soluk} kalinlik={2.2} />
                    <Text style={[s.hatirlatYazi, { color: oneCikan.ben.hatirlat ? R.vurgu : R.murekkep }]}>{oneCikan.ben.hatirlat ? 'Hatırlatılacak' : 'Hatırlat'}</Text>
                  </Bas>
                )}
                <Bas onPress={() => c.git({ tur: 'tribunMac', id: oneCikan.id })} etiket="Odaya gir" style={[s.gir, { backgroundColor: oneCikan.durum === 'canli' || oneCikan.durum === 'devre' ? R.kalp : R.vurgu }]}>
                  <Text style={[s.girYazi, { color: '#fff' }]}>{oneCikan.durum === 'canli' || oneCikan.durum === 'devre' ? 'Tribüne gir' : oneCikan.durum === 'bitti' ? 'Maç özeti' : 'Tahmin yap'}</Text>
                </Bas>
              </View>
            </Belir>
          )}
          {!veri && !hata && <ActivityIndicator style={{ marginTop: 30 }} color={R.vurgu} />}
          {hata && !veri && <Text style={[s.bos, { color: R.soluk }]}>Maçlar yüklenemedi. Biraz sonra tekrar dene.</Text>}
          {canli.filter((m) => m.id !== oneCikan?.id).length > 0 && <Baslik yazi="ŞU AN CANLI" canli />}
          {canli.filter((m) => m.id !== oneCikan?.id).map((m) => <MacKarti key={m.id} m={m} simdi={simdi} hatirlat={hatirlat} />)}
          {tekrarlar.map((m) => <MacKarti key={m.id} m={m} simdi={simdi} hatirlat={hatirlat} />)}
          {gunler.map((g) => g.liste.filter((m) => m.id !== oneCikan?.id).length > 0 && (
            <View key={g.gun} style={{ gap: 10 }}>
              <Baslik yazi={gunBasligi(g.ms, simdi).toLocaleUpperCase('tr')} />
              {g.liste.filter((m) => m.id !== oneCikan?.id).map((m) => <MacKarti key={m.id} m={m} simdi={simdi} hatirlat={hatirlat} />)}
            </View>
          ))}
          {biten.length > 0 && <Baslik yazi="BİTENLER" />}
          {biten.map((m) => <MacKarti key={m.id} m={m} simdi={simdi} hatirlat={hatirlat} />)}
          {veri && !canli.length && !yaklasan.length && !biten.length && !tekrarlar.length && <Text style={[s.bos, { color: R.soluk }]}>Yakında büyük maçlar burada.</Text>}
          {C.TEST_GIRISI && (
            <View style={[s.deneme, { borderColor: R.cizgi }]}>
              <Text style={[s.denemeBaslik, { color: R.soluk }]}>DENEME ARAÇLARI</Text>
              <Text style={[s.denemeYazi, { color: R.soluk }]}>Yalnız deneme sitesinde görünür. Gerçek bir maçın kaydı hızlandırılarak odada canlı gibi oynar.</Text>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                <Dugme yazi={bekleyen ? 'Hazırlanıyor…' : 'Yeniden oynat (Amed–Beşiktaş 3–2)'} tur="cizgi" kucuk devre={bekleyen} onPress={() => tekrarBaslat('amed_bes')} />
                <Dugme yazi="Boş deneme odası (AVL–FB)" tur="cizgi" kucuk devre={bekleyen} onPress={() => tekrarBaslat('bos')} />
              </View>
            </View>
          )}
          <Text style={[s.dipnot, { color: R.soluk }]}>Resmî değildir. Bahis ve ödül yoktur; tahmin yalnız oyun içindir.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function Baslik({ yazi: y, canli }: { yazi: string; canli?: boolean }) {
  const R = useRenk();
  return (
    <View style={s.baslikSatir}>
      {canli && <CanliNokta renk={R.kalp} boyut={4} />}
      <Text style={[s.baslik, { color: canli ? R.kalp : R.soluk }]}>{y}</Text>
    </View>
  );
}

function MacKarti({ m, simdi, hatirlat }: { m: TribunMac; simdi: number; hatirlat: (m: TribunMac) => void }) {
  const R = useRenk();
  const c = useCanli();
  const canli = m.durum === 'canli' || m.durum === 'devre';
  const kalan = m.baslangic - simdi;
  const durumYazi = m.durum === 'bitti' ? 'Bitti' : canli ? (m.durum === 'devre' ? 'Devre arası' : `${m.dk}'`) : m.tekrar ? 'Başlamak üzere' : kalan > 0 && kalan < 3 * 3600000 ? `${kalanYaz(kalan)} sonra` : '';
  return (
    <Belir>
      <Bas onPress={() => c.git({ tur: 'tribunMac', id: m.id })} etiket={`${m.ev.ad} ${m.dep.ad} maç odası`} rol="link" hoverRenk={R.hover} style={[s.mac, { backgroundColor: R.panel, borderColor: canli ? sa(R.kalp, 0.5) : R.ince }]}>
        <View style={s.macUst}>
          <Text style={[s.macLig, { color: R.soluk }]} numberOfLines={1}>{m.ligKisa}</Text>
          {m.tekrar && <View style={[s.mini, { backgroundColor: R.altinYumusak }]}><Text style={[s.miniYazi, { color: R.altinYazi }]}>DENEME</Text></View>}
          <View style={{ flex: 1 }} />
          {canli ? (
            <View style={[s.mini, { backgroundColor: sa(R.kalp, 0.14) }]}>
              <CanliNokta renk={R.kalp} boyut={3.5} />
              <Text style={[s.miniYazi, { color: R.kalp }]}>CANLI · {durumYazi}</Text>
            </View>
          ) : !!durumYazi && <Text style={[s.macDurum, { color: R.soluk }]}>{durumYazi}</Text>}
        </View>
        <View style={s.macOrta}>
          <View style={s.macTakim}>
            <TakimRozeti t={m.ev} boyut={52} />
            <Text style={[s.macTakimAd, { color: R.murekkep }]} numberOfLines={1}>{m.ev.ad}</Text>
          </View>
          <View style={s.macSkor}>
            {m.durum === 'oncesi' ? (
              <Text style={[s.macSaat, { color: R.murekkep }]}>{saatYaz(m.baslangic)}</Text>
            ) : (
              <Text style={[s.macSkorYazi, { color: R.murekkep }]}>{m.skor.ev}<Text style={{ color: R.soluk }}> – </Text>{m.skor.dep}</Text>
            )}
          </View>
          <View style={s.macTakim}>
            <TakimRozeti t={m.dep} boyut={52} />
            <Text style={[s.macTakimAd, { color: R.murekkep }]} numberOfLines={1}>{m.dep.ad}</Text>
          </View>
        </View>
        <View style={s.macAlt}>
          <Text style={[s.macKanal, { color: R.soluk }]} numberOfLines={1}>{m.kanal || (m.odada > 0 ? `${m.odada} kişi odada` : '')}</Text>
          <View style={{ flex: 1 }} />
          {m.durum === 'oncesi' && !m.tekrar && (
            <Bas onPress={() => hatirlat(m)} etiket={m.ben.hatirlat ? 'Hatırlatmayı kapat' : 'Hatırlat'} style={[s.hatirlat, { borderColor: m.ben.hatirlat ? R.vurgu : R.cizgi, backgroundColor: m.ben.hatirlat ? R.vurguYumusak : 'transparent' }]} hitSlop={4}>
              <Ikon ad="zil" boyut={14} renk={m.ben.hatirlat ? R.vurgu : R.soluk} kalinlik={2.2} />
              <Text style={[s.hatirlatYazi, { color: m.ben.hatirlat ? R.vurgu : R.murekkep }]}>{m.ben.hatirlat ? 'Hatırlatılacak' : 'Hatırlat'}</Text>
            </Bas>
          )}
          <View style={[s.gir, { backgroundColor: canli ? R.kalp : R.murekkep }]}>
            <Text style={[s.girYazi, { color: canli ? '#fff' : R.sis }]}>{canli ? 'Tribüne gir' : m.durum === 'bitti' ? 'Maç özeti' : 'Odaya bak'}</Text>
          </View>
        </View>
      </Bas>
    </Belir>
  );
}

// ============================================================ maç odası ============================================================
type Sekme = 'oda' | 'olaylar' | 'tahmin' | 'muhabir';
type AkisOgesi = TribunOlay | TribunMesaj | TribunTepkiSatiri | { t: 'kadro'; id: string; zaman: number };
export function TribunOdaEkrani({ id, geri }: { id: string; geri?: () => void }) {
  const R = useRenk();
  const c = useCanli();
  const genis = useGenis();
  const klavye = useKlavye();
  const altBosluk = useYazmaAltPayi(klavye);
  const [oda, odaAyarla] = useState<TribunOda | null>(null);
  const [hata, hataAyarla] = useState<string | null>(null);
  const [sekme, sekmeAyarla] = useState<Sekme>('oda');
  const [metin, metinAyarla] = useState('');
  const [gonderiliyor, gonderiliyorAyarla] = useState(false);
  const eng = useEngel(metin, 'tribun'); // engel uyarısı (engel.tsx)
  const [bildirAcik, bildirAyarla] = useState(false);
  const [tabelaAcik, tabelaAyarla] = useState(false); // plan/39 A: büyük tabela varsayılan kapalı (ince şerit); şeride dokununca açılır, sohbet kayınca kapanır
  const [yerel, yerelAyarla] = useState<TribunMesaj[]>([]); // yeni yazılan, sunucu listesine girene dek
  const kaydirma = useRef<ScrollView>(null);
  const altta = useRef(true);
  const giris = useRef<TextInput>(null);
  const girisli = !!c.uye && !c.uye.yeni;

  const yenile = useCallback(() => {
    C.tribunOda(id).then((r) => {
      if (r.ok) { odaAyarla(r.veri); hataAyarla(null); } else if (r.durum === 404) hataAyarla('yok'); else if (!oda) hataAyarla('baglanti');
    });
  }, [id, oda === null]);
  useEffect(() => {
    yenile();
    const t = setInterval(yenile, 3000);
    return () => clearInterval(t);
  }, [id, c.uye?.uid]);
  const simdi = useSimdi(oda?.simdi);

  const olaylar = (oda?.akis.filter((x) => x.t === 'olay') ?? []) as TribunOlay[];
  const kadro = oda?.kadro ?? null;
  const akis = useMemo(() => {
    const l: AkisOgesi[] = [...(oda?.akis ?? [])];
    const var_ = new Set(l.map((x) => x.id));
    for (const y of yerel) if (!var_.has(y.id)) l.push(y);
    if (kadro) l.push({ t: 'kadro', id: 'kadro', zaman: kadro.zaman }); // kadro kartı açıklandığı andan itibaren akışta yer alır (sunucu akış listesine yeni tür koymaz)
    return l.sort((a, b) => a.zaman - b.zaman);
  }, [oda?.akis, yerel, kadro?.zaman]);
  // Yeni öğe gelince, kullanıcı altaysa kaydır.
  const sonId = akis[akis.length - 1]?.id;
  // Biten ya da başlamamış maçta oda ilk açılınca özet kartı / maç öncesi panel en üstte görünsün (alta kaydırma yok); canlı maçta yeni öğe gelince alta kayar.
  const ilkYuk = useRef(true);
  useEffect(() => {
    if (!oda) return;
    if (ilkYuk.current) { ilkYuk.current = false; if (oda.mac.durum === 'bitti' || oda.mac.durum === 'oncesi') { altta.current = false; return; } }
    if (altta.current && sekme === 'oda') setTimeout(() => kaydirma.current?.scrollToEnd({ animated: true }), 80);
  }, [sonId, sekme, oda === null]);

  const mac = oda?.mac;
  const canli = mac && (mac.durum === 'canli' || mac.durum === 'devre');
  const oynaniyor = !!mac?.oynaniyor; // Bildir yalnız takvime göre maç oynanırken görünür (sunucu hesaplar)
  const muhabirAcik = !!oda?.benMuhabir && !!oda?.acilYedek; // Muhabir yalnız kurucuda ve yalnız ACİL YEDEKTE
  useEffect(() => { if (sekme === 'muhabir' && !muhabirAcik) sekmeAyarla('oda'); }, [sekme, muhabirAcik]);
  const yazabilir = !!mac && mac.odaAcik;
  const sayi = (n: number | undefined) => (n != null ? `${n}` : '');

  const gonder = () => {
    const t = metin.trim();
    if (!t || !mac || gonderiliyor) return;
    const yap = () => {
      gonderiliyorAyarla(true);
      C.tribunMesajYolla(mac.id, t).then((r) => {
        gonderiliyorAyarla(false);
        if (r.ok) {
          metinAyarla('');
          const m = r.veri.mesaj;
          yerelAyarla((l) => [...l, { ...m, yazar: c.uye ? { uid: c.uye.uid, ad: c.uye.ad, marka: false, yuz: c.uye.yuz, kurucu: c.uye.kurucu, balon: c.uye.balon } : m.yazar } as TribunMesaj]);
          altta.current = true;
          yenile();
        } else if (eng.koy(r, t)) { /* uyarı kutuda görünür; metin silinmez */ }
        else if (r.hata === 'yavas_mod') c.tost('Yavaş mod: birkaç saniye sonra yaz');
        else c.tost(C.hataYazisi(r.hata, r.durum));
      });
    };
    if (c.girisIste('Tribüne yazmak için giriş yap', yap)) yap();
  };
  const tepki = (tur: TribunTepkiTur) => {
    if (!mac) return;
    const yap = () => C.tribunTepki(mac.id, tur).then((r) => {
      if (r.ok) {
        // Cevaptaki kendi satırım ve nabız hemen akışa işlenir (ardından gelen yoklama aynı kimlikle günceller; çift satır olmaz)
        const v = r.veri;
        odaAyarla((o) => (o ? { ...o, tepki: v.tepki ?? o.tepki, nabiz: v.nabiz ?? o.nabiz, akis: v.satir ? [...o.akis.filter((x) => x.id !== v.satir!.id), v.satir] : o.akis } : o));
        altta.current = true;
      } else if (r.hata !== 'sinir') c.tost(C.hataYazisi(r.hata, r.durum));
    });
    if (c.girisIste('Tepki için giriş yap', yap)) yap();
  };
  const taraf = (t: string) => {
    if (!mac) return;
    const yap = () => C.tribunTarafSec(mac.id, t).then((r) => { if (!r.ok) c.tost(C.hataYazisi(r.hata, r.durum)); else yenile(); });
    if (c.girisIste('Taraf seçmek için giriş yap', yap)) yap();
  };
  const oyla = (k: TribunKarar, i: number) => {
    if (!mac) return;
    const yap = () => C.tribunOyVer(mac.id, k.id, i).then((r) => { if (!r.ok) c.tost(C.hataYazisi(r.hata, r.durum)); yenile(); });
    if (c.girisIste('Oy vermek için giriş yap', yap)) yap();
  };
  const hatirlat = () => {
    if (!mac || !oda) return;
    const yap = () => C.tribunHatirlat(mac.id, !oda.hatirlat).then((r) => { if (!r.ok) c.tost(C.hataYazisi(r.hata, r.durum)); else { c.tost(!oda.hatirlat ? 'Karar anlarında seni etiketleriz' : 'Hatırlatma kapandı'); yenile(); } });
    if (c.girisIste('Hatırlatma için giriş yap', yap)) yap();
  };

  if (hata === 'yok') return <View style={{ flex: 1 }}><UstBaslik baslik="Tribün" geri={geri} /><Text style={[s.bos, { color: R.soluk }]}>Bu maç odası yok ya da kapandı.</Text></View>;
  if (!oda || !mac) return <View style={{ flex: 1 }}><UstBaslik baslik="Tribün" geri={geri} />{hata ? <Text style={[s.bos, { color: R.soluk }]}>Oda açılamadı. Biraz sonra tekrar dene.</Text> : <ActivityIndicator style={{ marginTop: 40 }} color={R.vurgu} />}</View>;

  const sekmeler: [Sekme, string][] = [['oda', 'Oda'], ['olaylar', 'Olaylar'], ['tahmin', 'Tahmin'], ...(muhabirAcik ? ([['muhabir', 'Acil yedek']] as [Sekme, string][]) : [])];
  const dkSayi = parseInt(mac.dk, 10) || 0;
  const tabela = (
    <Tabela mac={mac} olaylar={olaylar} dkSayi={dkSayi} kompakt={!genis && mac.durum !== 'oncesi'} bekle={mac.durum === 'oncesi' ? `${kalanYaz(mac.baslangic - simdi)} sonra` : undefined}
      sag={mac.odada > 0 ? <View style={[s.odada]}><Ikon ad="kisi" boyut={11} renk="rgba(255,255,255,0.85)" kalinlik={2.2} /><Text style={s.odadaYazi}>{mac.odada}</Text></View> : undefined} />
  );
  const sekmeCubugu = (
    <View style={[s.sekmeler, { backgroundColor: R.ust }]}>
      {sekmeler.map(([k, ad]) => (
        <Pressable key={k} onPress={() => sekmeAyarla(k)} accessibilityRole="tab" accessibilityState={{ selected: sekme === k }} style={({ hovered }: { hovered?: boolean; pressed: boolean }) => [s.sekme, sekme === k ? { backgroundColor: R.panel } : hovered && { backgroundColor: R.hover }, sekme === k && Platform.OS === 'web' && ({ boxShadow: `0 2px 8px -2px ${R.golge}` } as any)]}>
          <Text style={[s.sekmeYazi, { color: sekme === k ? R.murekkep : R.soluk }, sekme === k && { fontFamily: yazi.kalin }]}>{ad}</Text>
        </Pressable>
      ))}
    </View>
  );

  const feed = (
    <ScrollView ref={kaydirma} style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: genis ? 4 : 2, paddingTop: 6, paddingBottom: 14, gap: 9 }} showsVerticalScrollIndicator={false}
      onScrollBeginDrag={() => tabelaAyarla(false)} testID="tribun-akis" onScroll={(e) => { const n = e.nativeEvent; altta.current = n.contentOffset.y + n.layoutMeasurement.height >= n.contentSize.height - 90; }} scrollEventThrottle={120}>
      {oda.ozet && <MacSonu oda={oda} />}
      {mac.durum === 'oncesi' && <Oncesi oda={oda} simdi={simdi} taraf={taraf} hatirlat={hatirlat} tahminAc={() => sekmeAyarla('tahmin')} />}
      {!akis.length && (
        <Text style={[s.bos, { color: R.soluk, paddingVertical: 24 }]}>{mac.durum === 'oncesi' ? (mac.odaAcik ? 'Oda açık. İlk mesajı sen yaz.' : `Oda ${saatYaz(mac.odaAcilis ?? mac.baslangic)}’da açılır.`) : 'Henüz sessiz.'}</Text>
      )}
      {akis.map((x) => {
        if (x.t === 'kadro') return <KadroKarti key="kadro" kadro={kadro!} mac={mac} acik0={false} />;
        if (x.t === 'olay') {
          const k = oda.kararlar.find((z) => z.olayId === x.id);
          return (
            <View key={x.id} style={{ gap: 8 }}>
              <OlayKarti o={x} mac={mac} />
              {k && <KararKarti k={k} oyla={(i) => oyla(k, i)} simdi={simdi} mac={mac} />}
            </View>
          );
        }
        if (x.t === 'tepki') return <TepkiSatir key={x.id} x={x} />;
        return <MesajSatiri key={x.id} m={x} benUid={c.uye?.uid} />;
      })}
      {oda.kararlar.filter((k) => k.tur === 'mac_adami').map((k) => <KararKarti key={k.id} k={k} oyla={(i) => oyla(k, i)} simdi={simdi} mac={mac} />)}
    </ScrollView>
  );

  const yazma = yazabilir && sekme === 'oda' && (
    <View testID="tribun-yaz" style={[s.yazKap, { borderTopColor: R.ince, backgroundColor: R.panel, paddingBottom: 10 + altBosluk }]}>
      {/* @ yazılınca öneri listesi (akıştaki bileşen; liste bu odanın üyelerini de içerir) */}
      <View style={{ paddingHorizontal: 12 }}>
        <EtiketOneri metin={metin} ayarla={(t) => { metinAyarla(t.slice(0, MESAJ_SINIR + 20)); giris.current?.focus(); }} adaylar={(q) => C.tribunEtiketAdaylari(mac.id, q)} ust />
      </View>
      {!klavye && <TepkiSatiri nabiz={oda.nabiz} bas={tepki} bildir={oynaniyor ? () => bildirAyarla(true) : undefined} />}
      <EngelAlani engel={eng.engel} ipucu={eng.ipucu} kenar={12} />
      <View style={s.yazSatir}>
        {c.uye && !c.uye.yeni ? <Avatar yazar={{ uid: c.uye.uid, ad: c.uye.ad, marka: false, yuz: c.uye.yuz, kurucu: c.uye.kurucu, balon: c.uye.balon }} boyut={34} /> : <View style={[s.bosAvatar, { backgroundColor: R.ust }]}><Ikon ad="kisi" boyut={17} renk={R.soluk} /></View>}
        <View style={[s.giris, { backgroundColor: R.ust, borderColor: R.ince }]}>
          <TextInput
            ref={giris}
            value={metin}
            onChangeText={(t) => metinAyarla(t.slice(0, MESAJ_SINIR + 20))}
            onFocus={() => { if (!C.oturumVar() || c.uye?.yeni) { giris.current?.blur(); c.girisIste('Tribüne yazmak için giriş yap', () => setTimeout(() => giris.current?.focus(), 300)); } }}
            placeholder="Tribüne yaz…"
            placeholderTextColor={R.soluk}
            returnKeyType="send"
            onSubmitEditing={gonder}
            blurOnSubmit={false}
            style={[s.girisYazi, { color: R.murekkep }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
            onKeyPress={(e: any) => { if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) { e.preventDefault?.(); gonder(); } }}
          />
          {!!metin && <View style={s.halka}><KarakterHalkasi uzunluk={harfSay(metin)} sinir={MESAJ_SINIR} /></View>}
        </View>
        <Bas onPress={gonder} devre={!metin.trim() || harfSay(metin) > MESAJ_SINIR || gonderiliyor} etiket="Gönder" style={[s.gonder, { backgroundColor: R.vurgu }]}>
          {gonderiliyor ? <ActivityIndicator color="#fff" size="small" /> : <Ikon ad="yukari" boyut={18} renk="#fff" kalinlik={2.6} />}
        </Bas>
      </View>
    </View>
  );

  const govde = (
    <>
      {sekme === 'oda' && feed}
      {sekme === 'olaylar' && <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 30, paddingTop: 4 }}><OlayListesi olaylar={olaylar} mac={mac} kadro={kadro} /></ScrollView>}
      {sekme === 'tahmin' && <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 30, paddingTop: 4 }}><TahminSekmesi oda={oda} yenile={yenile} /></ScrollView>}
      {sekme === 'muhabir' && muhabirAcik && <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 30, paddingTop: 4 }}><MuhabirPaneli oda={oda} yenile={yenile} /></ScrollView>}
    </>
  );

  const ustSerit = (
    <OdaUstSerit mac={mac} olaylar={olaylar} dkSayi={dkSayi} geri={geri} genis={genis} acik={tabelaAcik} degistir={() => tabelaAyarla((x) => !x)}
      bekle={mac.durum === 'oncesi' ? `${kalanYaz(mac.baslangic - simdi)} sonra` : undefined} tabela={tabela} />
  );
  return (
    <View style={{ flex: 1 }}>
      <BildirPenceresi acik={bildirAcik} kapat={() => bildirAyarla(false)} mac={mac} />
      {ustSerit}
      {genis ? (
        <View style={s.genisKap}>
          <View style={s.genisSol}>
            <View style={{ paddingHorizontal: 12, paddingTop: 8 }}>{sekmeCubugu}</View>
            <View style={{ flex: 1, paddingHorizontal: 12 }}>{govde}</View>
            {yazma}
          </View>
          <ScrollView style={[s.genisSag, { borderLeftColor: R.ince }]} contentContainerStyle={{ padding: 18, gap: 14 }} showsVerticalScrollIndicator={false}>
            <YanPanel oda={oda} simdi={simdi} />
          </ScrollView>
        </View>
      ) : (
        <>
          <View style={{ paddingHorizontal: 12, paddingTop: 6 }}>{sekmeCubugu}</View>
          <View style={{ flex: 1, paddingHorizontal: 12 }}>{govde}</View>
          {yazma}
        </>
      )}
    </View>
  );
}

// ---- maç öncesi: taraf, tahmin, hatırlat ----
function Oncesi({ oda, simdi, taraf, hatirlat, tahminAc }: { oda: TribunOda; simdi: number; taraf: (t: string) => void; hatirlat: () => void; tahminAc: () => void }) {
  const R = useRenk();
  const m = oda.mac;
  const kalan = m.baslangic - simdi;
  // Uluslararası maçta (m.destek dolu) yabancı takım tarafı seçtirilmez: yalnız Türk takımı ve "destekçiyim".
  const takimSecenegi = (k: 'ev' | 'dep'): [string, string, ReactNode] => [k, `${m[k].ad} tarafı`, <View key={k} style={[s.nokta, { backgroundColor: m[k].renk, borderColor: m[k].renk2 }]} />];
  const secenek: [string, string, ReactNode][] = [
    ...(m.destek ? [takimSecenegi(m.destek)] : [takimSecenegi('ev'), takimSecenegi('dep')]),
    ['tarafsiz', m.destek ? 'Futbolla aram yok, destekçiyim' : 'Tarafsızım', <Ikon key="t" ad="yildiz" boyut={13} renk={R.soluk} kalinlik={2} />],
  ];
  return (
    <View style={[s.oncesi, { backgroundColor: R.panel, borderColor: R.ince }]}>
      <View style={s.sayacSatir}>
        <View style={{ flex: 1 }}>
          <Text style={[s.sayacEtiket, { color: R.soluk }]}>BAŞLAMASINA</Text>
          <Text style={[s.sayacDeger, { color: R.murekkep }]}>{kalan > 0 ? kalanYaz(kalan) : 'az kaldı'}</Text>
        </View>
        <Bas onPress={hatirlat} etiket="Karar anlarında beni etiketle" style={[s.hatirlat, { borderColor: oda.hatirlat ? R.vurgu : R.cizgi, backgroundColor: oda.hatirlat ? R.vurguYumusak : 'transparent' }]}>
          <Ikon ad="zil" boyut={14} renk={oda.hatirlat ? R.vurgu : R.soluk} kalinlik={2.2} />
          <Text style={[s.hatirlatYazi, { color: oda.hatirlat ? R.vurgu : R.murekkep }]}>{oda.hatirlat ? 'Hatırlatılacak' : 'Hatırlat'}</Text>
        </Bas>
      </View>
      <Text style={[s.oncesiSoru, { color: R.murekkep }]}>{m.destek ? `Avrupa’da hepimiz ${bizIz(m[m.destek].ad)}. Sen nasıl izliyorsun?` : 'Bu maçı hangi taraftan izliyorsun?'}</Text>
      <View style={s.chipler}>
        {secenek.map(([k, ad, ik]) => {
          const sec = oda.taraf.ben === k;
          return (
            <Bas key={k} onPress={() => taraf(k)} style={[s.chip, { borderColor: sec ? R.vurgu : R.cizgi, backgroundColor: sec ? R.vurguYumusak : R.ust }]}>
              {ik}
              <Text style={[s.chipYazi, { color: sec ? R.vurgu : R.murekkep }, sec && { fontFamily: yazi.kalin }]}>{ad}</Text>
            </Bas>
          );
        })}
      </View>
      <Bas onPress={tahminAc} style={[s.tahminSatir, { backgroundColor: R.ust }]} hoverRenk={R.vurguYumusak}>
        <Ikon ad="yildiz" boyut={16} renk={R.altin} kalinlik={2} />
        <Text style={[s.tahminYazi, { color: R.murekkep }]}>{oda.tahmin.ben ? `Tahminin ${oda.tahmin.ben.ev}–${oda.tahmin.ben.dep}` : 'Skor tahmini yap'}</Text>
        <Text style={[s.tahminAlt, { color: R.soluk }]}>{oda.tahmin.ben ? 'değiştir' : 'tam skor 5 puan'}</Text>
        <Ikon ad="ok" boyut={15} renk={R.soluk} />
      </Bas>
      <Text style={[s.oncesiAlt, { color: R.soluk }]}>Oda {saatYaz(m.odaAcilis ?? m.baslangic)}’da açılır. Tahmin maç başlayana kadar açık.</Text>
    </View>
  );
}

// ---- olay kartı ----
const OLAY_AD: Record<string, string> = { gol: 'GOL', sari: 'SARI KART', kirmizi: 'KIRMIZI KART', penalti: 'PENALTI', var: 'VAR İNCELEMESİ', gol_iptal: 'GOL İPTAL', basladi: 'Düdük çaldı', devre: 'Devre arası', ikinci_yari: 'İkinci yarı başladı', bitti: 'Maç bitti' };
export function OlayKarti({ o, mac }: { o: TribunOlay; mac: TribunMac }) {
  const R = useRenk();
  const takim = o.takim === 'ev' ? mac.ev : o.takim === 'dep' ? mac.dep : null;
  if (['basladi', 'devre', 'ikinci_yari', 'bitti'].includes(o.tur)) {
    return (
      <View style={s.ayrac}>
        <View style={[s.ayracCizgi, { backgroundColor: R.ince }]} />
        <Text style={[s.ayracYazi, { color: R.soluk }]}>{OLAY_AD[o.tur]}{o.tur === 'devre' || o.tur === 'bitti' ? ` · ${mac.ev.kisa} ${o.skor.ev}–${o.skor.dep} ${mac.dep.kisa}` : ''}</Text>
        <View style={[s.ayracCizgi, { backgroundColor: R.ince }]} />
      </View>
    );
  }
  const gol = o.tur === 'gol';
  const kart = o.tur === 'sari' || o.tur === 'kirmizi';
  const renk = takim ? takim.renk : R.vurgu;
  const acik = o.iptal ? 0.5 : 1;
  const tey = !o.teyit || !!o.onBilgi; // ön bilgi: tek kaynaktan, ikinci kaynak henüz doğrulamadı
  return (
    <Belir>
      <View style={[gol ? s.olayBuyuk : s.olay, { backgroundColor: R.panel, borderColor: tey ? R.cizgi : gol ? sa(renk, 0.6) : R.ince, borderStyle: tey ? 'dashed' : 'solid', opacity: acik }]}>
        {gol && <View style={[s.olayBar, { backgroundColor: renk }]} />}
        <View style={s.olayIk}>
          {gol ? (
            <TopIkon boyut={30} zemin={R.gece ? '#F4F1FB' : '#FFFFFF'} koyu={R.gece ? '#14101F' : '#1D1830'} />
          ) : kart ? (
            <View style={[s.kartIk, { backgroundColor: o.tur === 'sari' ? '#FFD23F' : '#FF3B3B' }]} />
          ) : (
            <View style={[s.vIk, { backgroundColor: R.vurguYumusak }]}><Text style={[s.vYazi, { color: R.vurgu }]}>{o.tur === 'penalti' ? 'P' : 'VAR'}</Text></View>
          )}
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <View style={s.olayUst}>
            <Text style={[s.olayAd, { color: gol ? R.murekkep : R.soluk }, o.iptal && { textDecorationLine: 'line-through' }]}>{OLAY_AD[o.tur]}</Text>
            <Text style={[s.olayDk, { color: R.soluk }]}>{o.dk}’</Text>
            {tey && <View style={[s.mini, { backgroundColor: R.altinYumusak }]}><Text style={[s.miniYazi, { color: R.altinYazi }]}>ÖN BİLGİ</Text></View>}
            {o.iptal && <View style={[s.mini, { backgroundColor: sa(R.kalem, 0.14) }]}><Text style={[s.miniYazi, { color: R.kalem }]}>İPTAL</Text></View>}
          </View>
          <Text style={[s.olayTakim, { color: R.murekkep }]} numberOfLines={2}>
            {takim ? takim.ad : 'Hakem ekranda'}{!!o.oyuncu && <Text style={{ fontFamily: yazi.normal, color: R.soluk }}> · {o.oyuncu}</Text>}
          </Text>
        </View>
        {gol && !o.iptal && (
          <View style={s.olaySkor}>
            <Text style={[s.olaySkorYazi, { color: R.murekkep }]}>{o.skor.ev}–{o.skor.dep}</Text>
          </View>
        )}
      </View>
    </Belir>
  );
}

// ---- mesaj satırı (kullanıcı / Yazsam mı?) ----
function MesajSatiri({ m, benUid }: { m: TribunMesaj; benUid?: string }) {
  const R = useRenk();
  const c = useCanli();
  const benim = !!benUid && m.yazar.uid === benUid;
  const bekleyen = m.durum === 'inceleniyor';
  const gizli = m.durum === 'gizli';
  if (m.marka)
    return (
      <Belir>
        <View style={s.markaSatir}>
          <Avatar yazar={m.yazar} boyut={32} />
          <View style={[s.markaBalon, { backgroundColor: R.vurguYumusak, borderColor: sa(R.vurgu, 0.28) }]}>
            <View style={s.markaUst}>
              <Text style={[s.markaAd, { color: R.murekkep }]}>Yazsam mı?</Text>
              <Rozet boyut={14} />
              <YzEtiketi kucuk />
            </View>
            <EtiketliMetin metin={m.metin} etiketler={m.etiketler} style={[s.markaYazi, { color: R.murekkep }]} />
          </View>
        </View>
      </Belir>
    );
  return (
    <Belir>
      <View style={[s.mesaj, benim && { alignSelf: 'flex-end', flexDirection: 'row-reverse' }]}>
        <Bas onPress={() => c.git({ tur: 'profil', ad: m.yazar.ad })} etiket={`${m.yazar.ad} profili`}>
          <Avatar yazar={m.yazar} boyut={28} />
        </Bas>
        <View style={[s.mesajBalon, { backgroundColor: benim ? R.vurgu : R.ust, opacity: bekleyen ? 0.65 : 1 }, benim ? { borderBottomRightRadius: 6 } : { borderBottomLeftRadius: 6 }]}>
          {!benim && <Text style={[s.mesajAd, { color: R.soluk }]}>{m.yazar.ad}</Text>}
          <EtiketliMetin metin={m.metin} etiketler={m.etiketler} style={[s.mesajYazi, { color: benim ? '#fff' : R.murekkep }]} linkRenk={benim ? '#fff' : undefined} />
          {(bekleyen || gizli) && <Text style={[s.mesajNot, { color: benim ? 'rgba(255,255,255,0.8)' : R.soluk }]}>{gizli ? `Gizlendi: ${C.sebepYazisi(m.sebep ?? undefined, true)}` : 'Kontrol ediliyor…'}</Text>}
        </View>
      </View>
    </Belir>
  );
}

// ---- karar anı ----
function KararKarti({ k, oyla, simdi, mac }: { k: TribunKarar; oyla: (i: number) => void; simdi: number; mac: TribunMac }) {
  const R = useRenk();
  const acik = k.acik && simdi < k.kapanis;
  const verdi = k.benimOy != null;
  const yuzdeVar = !!k.oylar && (verdi || !acik);
  const toplam = k.toplam;
  const enCok = k.oylar ? Math.max(...k.oylar) : 0;
  const adayMi = k.tur === 'mac_adami';
  return (
    <Belir>
      <View style={[s.karar, { backgroundColor: R.panel, borderColor: acik ? sa(R.vurgu, 0.55) : R.ince }]}>
        <View style={s.kararUst}>
          <View style={[s.mini, { backgroundColor: R.vurguYumusak }]}><Text style={[s.miniYazi, { color: R.vurgu }]}>{adayMi ? 'MAÇIN ADAMI' : `KARAR ANI${k.dk ? ` · ${k.dk}’` : ''}`}</Text></View>
          <View style={{ flex: 1 }} />
          <Text style={[s.kararKalan, { color: R.soluk }]}>{acik ? `${kalanYaz(k.kapanis - simdi)} kaldı` : 'Kapandı'}</Text>
        </View>
        {!adayMi && <Text style={[s.kararBaslik, { color: R.soluk }]}>{k.baslik}</Text>}
        <Text style={[s.kararSoru, { color: R.murekkep }]}>{k.soru}</Text>
        <View style={{ gap: 7 }}>
          {k.secenekler.map((sec, i) => {
            const benim = k.benimOy === i;
            const yuz = k.oylar && toplam ? Math.round((k.oylar[i] * 100) / toplam) : 0;
            return (
              <Bas key={i} onPress={() => acik && !verdi && oyla(i)} devre={!acik || verdi} style={[s.kararSec, { borderColor: benim ? R.vurgu : verdi || !acik ? 'transparent' : R.cizgi, backgroundColor: verdi || !acik ? (R.gece ? 'rgba(255,255,255,0.04)' : 'rgba(29,24,48,0.035)') : 'transparent', opacity: !acik && !verdi ? 0.85 : 1 }]} hoverRenk={R.vurguYumusak}>
                {yuzdeVar && <View style={[s.kararDolgu, { width: `${yuz}%`, backgroundColor: benim ? sa(R.vurgu, 0.22) : R.gece ? 'rgba(255,255,255,0.08)' : 'rgba(29,24,48,0.07)' }]} />}
                <View style={s.kararSecIc}>
                  {benim && <View style={[s.tik, { backgroundColor: R.vurgu }]}><Ikon ad="tik" boyut={10} renk="#fff" kalinlik={3.4} /></View>}
                  <Text style={[s.kararSecYazi, { color: R.murekkep }, (benim || (yuzdeVar && k.oylar![i] === enCok)) && { fontFamily: yazi.kalin }]} numberOfLines={1}>{sec}</Text>
                  {yuzdeVar && <Text style={[s.kararYuz, { color: benim ? R.vurgu : R.murekkep }]}>%{yuz}</Text>}
                </View>
              </Bas>
            );
          })}
        </View>
        <Text style={[s.kararAlt, { color: R.soluk }]}>
          {toplam > 0 ? `${toplam} oy` : 'İlk oyu sen ver'}{!k.oylar && toplam > 0 ? ` · yüzde ${k.esik} oydan sonra görünür` : ''}{!acik ? '' : verdi ? ' · sonuç kapanınca netleşir' : ''}
        </Text>
      </View>
    </Belir>
  );
}

// ---- olaylar sekmesi ----
function OlayListesi({ olaylar, mac, kadro }: { olaylar: TribunOlay[]; mac: TribunMac; kadro: TribunKadro | null }) {
  const R = useRenk();
  const l = olaylar.filter((o) => o.tur !== 'sari' || true).slice().reverse();
  if (!l.length && !kadro) return <Text style={[s.bos, { color: R.soluk }]}>Henüz olay yok.</Text>;
  return (
    <View style={{ gap: 0, paddingHorizontal: 2 }}>
      {!l.length && <Text style={[s.bos, { color: R.soluk, paddingVertical: 18 }]}>Henüz maç olayı yok.</Text>}
      {l.map((o, i) => {
        const takim = o.takim === 'ev' ? mac.ev : o.takim === 'dep' ? mac.dep : null;
        return (
          <View key={o.id} style={[s.zaman, { borderBottomColor: R.ince }]}>
            <Text style={[s.zamanDk, { color: R.soluk }]}>{['basladi', 'devre', 'ikinci_yari', 'bitti'].includes(o.tur) ? '' : `${o.dk}’`}</Text>
            <View style={s.zamanIk}>
              {o.tur === 'gol' ? <TopIkon boyut={24} zemin={R.gece ? '#F4F1FB' : '#FFFFFF'} koyu={R.gece ? '#14101F' : '#1D1830'} /> : o.tur === 'sari' || o.tur === 'kirmizi' ? <View style={[s.kartIk, { backgroundColor: o.tur === 'sari' ? '#FFD23F' : '#FF3B3B' }]} /> : <View style={[s.nokta, { backgroundColor: R.cizgi, borderColor: 'transparent' }]} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.zamanAd, { color: R.murekkep }, o.iptal && { textDecorationLine: 'line-through', color: R.soluk }]}>{OLAY_AD[o.tur]}{takim ? ` · ${takim.ad}` : ''}{o.onBilgi ? ' (ön bilgi)' : ''}</Text>
              {!!o.oyuncu && <Text style={[s.zamanOyuncu, { color: R.soluk }]}>{o.oyuncu}</Text>}
            </View>
            {o.tur === 'gol' && !o.iptal && <Text style={[s.zamanSkor, { color: R.murekkep }]}>{o.skor.ev}–{o.skor.dep}</Text>}
          </View>
        );
      })}
      {kadro && <KadroSatiri kadro={kadro} mac={mac} />}
    </View>
  );
}

// ---- kadrolar (maç öncesi ilk 11 + yedekler; sunucu: kadro açıklanınca bir kez) ----
function KadroTakimi({ t, takim }: { t: TribunKadroTakim; takim: TribunMac['ev'] }) {
  const R = useRenk();
  return (
    <View style={s.kadroSut}>
      <View style={s.kadroBaslik}>
        <TakimRozeti t={takim} boyut={30} />
        <Text style={[s.kadroTakimAd, { color: R.murekkep }]} numberOfLines={1}>{takim.ad}</Text>
        {!!t.formasyon && <View style={[s.mini, { backgroundColor: R.vurguYumusak }]}><Text style={[s.miniYazi, { color: R.vurgu }]}>{t.formasyon}</Text></View>}
      </View>
      <Text style={[s.kadroEtiket, { color: R.soluk }]}>İLK 11</Text>
      {t.ilk11.map((p, i) => (
        <View key={`${p.no}-${i}`} style={s.kadroSatir}>
          <Text style={[s.kadroNo, { color: R.soluk }]}>{p.no}</Text>
          <Text style={[s.kadroAd, { color: R.murekkep }]} numberOfLines={1}>{p.ad}</Text>
        </View>
      ))}
      {t.yedek.length > 0 && <Text style={[s.kadroEtiket, { color: R.soluk, marginTop: 6 }]}>YEDEKLER</Text>}
      <View style={s.kadroYedekKap}>
        {t.yedek.map((p, i) => (
          <Text key={`${p.no}-${i}`} style={[s.kadroYedek, { color: R.soluk, backgroundColor: R.ust }]} numberOfLines={1}>{p.no} {p.ad}</Text>
        ))}
      </View>
      {!!t.teknik && <Text style={[s.kadroTeknik, { color: R.soluk }]}>Teknik direktör: <Text style={{ fontFamily: yazi.orta, color: R.murekkep }}>{t.teknik}</Text></Text>}
    </View>
  );
}
function KadroGovdesi({ kadro, mac }: { kadro: TribunKadro; mac: TribunMac }) {
  const genis = useGenis();
  const [yan, yanAyarla] = useState<'ev' | 'dep'>('ev');
  const R = useRenk();
  if (genis) {
    return (
      <View style={s.kadroIki}>
        <KadroTakimi t={kadro.ev} takim={mac.ev} />
        <View style={[s.kadroAyrac, { backgroundColor: R.ince }]} />
        <KadroTakimi t={kadro.dep} takim={mac.dep} />
      </View>
    );
  }
  return (
    <View style={{ gap: 12 }}>
      <View style={s.chipler}>
        {([['ev', mac.ev, kadro.ev], ['dep', mac.dep, kadro.dep]] as const).map(([k, takim, t]) => {
          const sec = yan === k;
          return (
            <Bas key={k} onPress={() => yanAyarla(k)} etiket={`${takim.ad} kadrosu`} style={[s.chip, { borderColor: sec ? R.vurgu : R.cizgi, backgroundColor: sec ? R.vurguYumusak : R.ust }]}>
              <View style={[s.nokta, { backgroundColor: takim.renk, borderColor: takim.renk2 }]} />
              <Text style={[s.chipYazi, { color: sec ? R.vurgu : R.murekkep }, sec && { fontFamily: yazi.kalin }]}>{takim.kisa}{t.formasyon ? ` ${t.formasyon}` : ''}</Text>
            </Bas>
          );
        })}
      </View>
      <KadroTakimi t={yan === 'ev' ? kadro.ev : kadro.dep} takim={yan === 'ev' ? mac.ev : mac.dep} />
    </View>
  );
}
// Kapalıyken özet: iki takımın formasyonu + ilk 11'in soyadları (yedekler ve numaralar açılınca).
function KadroOnizleme({ kadro, mac }: { kadro: TribunKadro; mac: TribunMac }) {
  const R = useRenk();
  const soyad = (ad: string) => ad.trim().split(/\s+/).slice(-1)[0] ?? ad;
  return (
    <View style={{ gap: 9 }}>
      {([[mac.ev, kadro.ev], [mac.dep, kadro.dep]] as const).map(([takim, t]) => (
        <View key={takim.kisa} style={s.kadroOnSatir}>
          <View style={s.kadroOnBas}>
            <View style={[s.nokta, { backgroundColor: takim.renk, borderColor: takim.renk2 }]} />
            <Text style={[s.kadroOnAd, { color: R.murekkep }]}>{takim.kisa}</Text>
            {!!t.formasyon && <Text style={[s.kadroOnForm, { color: R.vurgu }]}>{t.formasyon}</Text>}
          </View>
          <Text style={[s.kadroOnIsimler, { color: R.soluk }]}>{t.ilk11.map((p) => soyad(p.ad)).join(' · ')}</Text>
        </View>
      ))}
    </View>
  );
}
function KadroKarti({ kadro, mac, acik0 }: { kadro: TribunKadro; mac: TribunMac; acik0: boolean }) {
  const R = useRenk();
  const [acik, acikAyarla] = useState(acik0);
  return (
    <Belir>
      <View style={[s.kadro, { backgroundColor: R.panel, borderColor: R.ince }]}>
        <Bas onPress={() => acikAyarla(!acik)} etiket={acik ? 'Kadroları gizle' : 'Kadroların tamamını göster'} rol="button" style={s.kadroUst}>
          <View style={[s.mini, { backgroundColor: R.vurguYumusak }]}><Text style={[s.miniYazi, { color: R.vurgu }]}>KADROLAR</Text></View>
          <Text style={[s.kadroOzet, { color: R.soluk }]} numberOfLines={1}>{acik ? 'İlk 11 ve yedekler' : 'İlk 11’ler açıklandı'}</Text>
          <Text style={[s.kadroAc, { color: R.vurgu }]}>{acik ? 'Gizle' : 'Tümünü göster'}</Text>
        </Bas>
        {acik ? <KadroGovdesi kadro={kadro} mac={mac} /> : <KadroOnizleme kadro={kadro} mac={mac} />}
      </View>
    </Belir>
  );
}
// Olaylar sekmesindeki satır: dokununca kadrolar aynı satırın altında açılır.
function KadroSatiri({ kadro, mac }: { kadro: TribunKadro; mac: TribunMac }) {
  const R = useRenk();
  const [acik, acikAyarla] = useState(false);
  const saat = new Date(kadro.zaman).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' });
  return (
    <View style={{ borderBottomWidth: 1, borderBottomColor: R.ince }}>
      <Bas onPress={() => acikAyarla(!acik)} etiket="Kadrolar açıklandı" rol="button" style={[s.zaman, { borderBottomWidth: 0 }]}>
        <Text style={[s.zamanDk, { color: R.soluk, fontSize: 12.5 }]}>{saat}</Text>
        <View style={s.zamanIk}><View style={[s.nokta, { backgroundColor: R.vurgu, borderColor: 'transparent' }]} /></View>
        <View style={{ flex: 1 }}>
          <Text style={[s.zamanAd, { color: R.murekkep }]}>Kadrolar açıklandı</Text>
          <Text style={[s.zamanOyuncu, { color: R.soluk }]}>{mac.ev.kisa}{kadro.ev.formasyon ? ` ${kadro.ev.formasyon}` : ''} · {mac.dep.kisa}{kadro.dep.formasyon ? ` ${kadro.dep.formasyon}` : ''}</Text>
        </View>
        <Text style={[s.kadroAc, { color: R.vurgu }]}>{acik ? 'Gizle' : 'Göster'}</Text>
      </Bas>
      {acik && <View style={{ paddingHorizontal: 6, paddingBottom: 14 }}><KadroGovdesi kadro={kadro} mac={mac} /></View>}
    </View>
  );
}

// ---- tahmin sekmesi ----
function TahminSekmesi({ oda, yenile }: { oda: TribunOda; yenile: () => void }) {
  const R = useRenk();
  const c = useCanli();
  const m = oda.mac;
  const [ev, evAyarla] = useState(oda.tahmin.ben?.ev ?? 1);
  const [dep, depAyarla] = useState(oda.tahmin.ben?.dep ?? 1);
  const [kaydediyor, kayitAyarla] = useState(false);
  const kaydet = () => {
    const yap = () => {
      kayitAyarla(true);
      C.tribunTahmin(m.id, ev, dep).then((r) => { kayitAyarla(false); if (!r.ok) c.tost(C.hataYazisi(r.hata, r.durum)); else { c.tost(`Tahminin ${ev}–${dep} kaydedildi`); yenile(); } });
    };
    if (c.girisIste('Tahmin için giriş yap', yap)) yap();
  };
  const d = oda.tahmin.dagilim;
  const toplam = d ? d.ev + d.ber + d.dep : 0;
  return (
    <View style={{ gap: 12 }}>
      <View style={[s.kutuBlok, { backgroundColor: R.panel, borderColor: R.ince }]}>
        <Text style={[s.blokBaslik, { color: R.murekkep }]}>{oda.tahmin.acik ? 'Skor tahminin' : 'Tahminin'}</Text>
        <View style={s.stepSatir}>
          <Stepper t={m.ev} v={oda.tahmin.acik ? ev : oda.tahmin.ben?.ev ?? 0} ayarla={evAyarla} acik={oda.tahmin.acik} />
          <Text style={[s.stepTire, { color: R.soluk }]}>–</Text>
          <Stepper t={m.dep} v={oda.tahmin.acik ? dep : oda.tahmin.ben?.dep ?? 0} ayarla={depAyarla} acik={oda.tahmin.acik} />
        </View>
        {oda.tahmin.acik ? (
          <>
            <Dugme yazi={kaydediyor ? 'Kaydediliyor…' : oda.tahmin.ben ? 'Tahmini güncelle' : 'Tahmini kaydet'} tur="acik" devre={kaydediyor} onPress={kaydet} />
            <Text style={[s.blokAlt, { color: R.soluk }]}>Tam skor 5 puan, doğru sonuç 2, gol farkı +1. Puan yalnız oyun içindir; ödül yoktur.</Text>
          </>
        ) : oda.tahmin.ben ? (
          <Text style={[s.blokSonuc, { color: oda.tahmin.puan ? R.yesil : R.soluk }]}>{m.durum === 'bitti' ? (oda.tahmin.puan ? `Tuttu: +${oda.tahmin.puan} puan` : 'Bu sefer tutmadı') : 'Maç sürüyor, sonuç bitişte.'}</Text>
        ) : <Text style={[s.blokAlt, { color: R.soluk }]}>Tahmin süresi doldu.</Text>}
      </View>
      {d && toplam > 0 && (
        <View style={[s.kutuBlok, { backgroundColor: R.panel, borderColor: R.ince }]}>
          <Text style={[s.blokBaslik, { color: R.murekkep }]}>Tribün ne diyor?</Text>
          {[[`${m.ev.ad} kazanır`, d.ev, m.ev.renk], ['Berabere', d.ber, R.soluk], [`${m.dep.ad} kazanır`, d.dep, m.dep.renk]].map(([ad, n, renk]) => (
            <View key={String(ad)} style={{ gap: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={[s.dagAd, { color: R.murekkep }]}>{ad}</Text><Text style={[s.dagYuz, { color: R.soluk }]}>%{Math.round((Number(n) * 100) / toplam)}</Text></View>
              <View style={[s.dagIz, { backgroundColor: R.ince }]}><View style={[s.dagDolu, { width: `${(Number(n) * 100) / toplam}%`, backgroundColor: String(renk) }]} /></View>
            </View>
          ))}
          <Text style={[s.blokAlt, { color: R.soluk }]}>{oda.tahmin.toplam} tahmin</Text>
        </View>
      )}
      {oda.tahmin.tablo.length > 0 && <Tablo baslik="Bu maçın tahmin tablosu" l={oda.tahmin.tablo} tahmin />}
      {oda.tahmin.lig.length > 0 && <Tablo baslik="Oda ligi" l={oda.tahmin.lig} />}
    </View>
  );
}
function Tablo({ baslik, l, tahmin }: { baslik: string; l: C.TribunKisi[]; tahmin?: boolean }) {
  const R = useRenk();
  return (
    <View style={[s.kutuBlok, { backgroundColor: R.panel, borderColor: R.ince }]}>
      <Text style={[s.blokBaslik, { color: R.murekkep }]}>{baslik}</Text>
      {l.map((k, i) => (
        <View key={k.yazar.uid} style={s.tabloSatir}>
          <Text style={[s.tabloNo, { color: R.soluk }]}>{i + 1}</Text>
          <Avatar yazar={k.yazar} boyut={28} />
          <Text style={[s.tabloAd, { color: R.murekkep }]} numberOfLines={1}>{k.yazar.ad}</Text>
          {tahmin && !!k.tahmin && <Text style={[s.tabloTahmin, { color: R.soluk }]}>{k.tahmin.ev}–{k.tahmin.dep}</Text>}
          <Text style={[s.tabloPuan, { color: R.vurgu }]}>{k.puan} p</Text>
        </View>
      ))}
    </View>
  );
}
function Stepper({ t, v, ayarla, acik }: { t: C.TribunTakim; v: number; ayarla: (n: number) => void; acik: boolean }) {
  const R = useRenk();
  return (
    <View style={s.stepper}>
      <TakimRozeti t={t} boyut={44} />
      <View style={s.stepKontrol}>
        {acik && <Bas onPress={() => ayarla(Math.max(0, v - 1))} etiket="Azalt" style={[s.stepDugme, { backgroundColor: R.ust }]} hoverRenk={R.vurguYumusak}><Text style={[s.stepIsaret, { color: R.murekkep }]}>−</Text></Bas>}
        <Text style={[s.stepDeger, { color: R.murekkep }]}>{v}</Text>
        {acik && <Bas onPress={() => ayarla(Math.min(9, v + 1))} etiket="Artır" style={[s.stepDugme, { backgroundColor: R.ust }]} hoverRenk={R.vurguYumusak}><Text style={[s.stepIsaret, { color: R.murekkep }]}>+</Text></Bas>}
      </View>
    </View>
  );
}

// ---- kullanıcı bildirimi (Onur 09.10): olay OLUŞTURMAZ; yalnız veri kaynaklarının o an yeniden kontrol edilmesini sağlar ----
function BildirPenceresi({ acik, kapat, mac }: { acik: boolean; kapat: () => void; mac: TribunMac }) {
  const R = useRenk();
  const c = useCanli();
  const [mesgul, mesgulAyarla] = useState(false);
  const yolla = () => {
    const yap = () => {
      mesgulAyarla(true);
      C.tribunBildir(mac.id).then((r) => {
        mesgulAyarla(false);
        kapat();
        if (!r.ok) c.tost(r.hata === 'sinir' ? 'Az önce kontrol ettirdin, biraz bekle' : C.hataYazisi(r.hata, r.durum));
        else c.tost(r.veri.yoklandi ? 'Veri kaynakları şimdi kontrol edildi' : 'Veri kaynakları zaten yakın zamanda kontrol edildi');
      });
    };
    if (c.girisIste('Bunun için giriş yap', yap)) yap();
  };
  return (
    <Pencere acik={acik} kapat={kapat} baslik="Veriyi şimdi kontrol ettir" genislik={420}>
      <View style={{ paddingBottom: 14 }}>
        <Text style={[s.bildirAciklama, { color: R.soluk }]}>Sahada bir şey oldu da odaya düşmedi mi? Buradan veri kaynaklarının hemen yeniden kontrol edilmesini isteyebilirsin. Bu tek başına hiçbir olay oluşturmaz, skoru değiştirmez; olay yalnız kaynaklarda görününce odaya düşer.</Text>
        <Bas onPress={yolla} devre={mesgul} etiket="Kaynakları şimdi kontrol et" style={[s.bildirDugme, { backgroundColor: R.vurgu }]}>
          {mesgul ? <ActivityIndicator color="#fff" /> : <Text style={s.bildirDugmeYazi}>Kaynakları şimdi kontrol et</Text>}
        </Bas>
      </View>
    </Pencere>
  );
}

// ---- masaüstü yan panel ----
function YanPanel({ oda, simdi }: { oda: TribunOda; simdi: number }) {
  const R = useRenk();
  const c = useCanli();
  const m = oda.mac;
  const olaylar = oda.akis.filter((x) => x.t === 'olay') as TribunOlay[];
  const gol = olaylar.filter((o) => o.tur === 'gol' && !o.iptal);
  return (
    <>
      <View style={[s.kutuBlok, { backgroundColor: R.panel, borderColor: R.ince }]}>
        <Text style={[s.blokBaslik, { color: R.murekkep }]}>Maç bilgisi</Text>
        <Text style={[s.yanSatir, { color: R.soluk }]}>{m.lig}</Text>
        <Text style={[s.yanSatir, { color: R.soluk }]}>{new Date(m.baslangic).toLocaleString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' })}</Text>
        {!!m.kanal && <Text style={[s.yanSatir, { color: R.soluk }]}>{m.kanal}</Text>}
        <Text style={[s.yanSatir, { color: R.soluk }]}>{m.odada} kişi odada</Text>
      </View>
      <View style={[s.kutuBlok, { backgroundColor: R.panel, borderColor: R.ince }]}>
        <Text style={[s.blokBaslik, { color: R.murekkep }]}>Goller</Text>
        {gol.length === 0 ? <Text style={[s.yanSatir, { color: R.soluk }]}>Henüz gol yok.</Text> : gol.map((o) => <Text key={o.id} style={[s.yanSatir, { color: R.murekkep }]}>{o.dk}’ {o.takim === 'ev' ? m.ev.kisa : m.dep.kisa}{o.oyuncu ? ` · ${o.oyuncu}` : ''}</Text>)}
      </View>
      <View style={[s.kutuBlok, { backgroundColor: R.panel, borderColor: R.ince }]}>
        <Text style={[s.blokBaslik, { color: R.murekkep }]}>Kartlar</Text>
        {olaylar.filter((o) => (o.tur === 'sari' || o.tur === 'kirmizi') && !o.iptal).length === 0 ? <Text style={[s.yanSatir, { color: R.soluk }]}>Henüz kart yok.</Text> : olaylar.filter((o) => (o.tur === 'sari' || o.tur === 'kirmizi') && !o.iptal).map((o) => <Text key={o.id} style={[s.yanSatir, { color: R.murekkep }]}>{o.dk}’ {o.takim === 'ev' ? m.ev.kisa : m.dep.kisa} · {o.tur === 'sari' ? 'sarı' : 'kırmızı'}{o.oyuncu ? ` · ${o.oyuncu}` : ''}</Text>)}
      </View>
      {oda.tahmin.lig.length > 0 && <Tablo baslik="Oda ligi" l={oda.tahmin.lig} />}
      <Text style={[s.dipnot, { color: R.soluk }]}>Resmî değildir. Bahis ve ödül yoktur.</Text>
      <Dugme yazi="Takvime dön" tur="cizgi" kucuk onPress={() => c.git({ tur: 'tribun' })} />
    </>
  );
}

// ---- maç sonu özet kartı ----
function MacSonu({ oda }: { oda: TribunOda }) {
  const R = useRenk();
  const c = useCanli();
  const m = oda.mac;
  const o = oda.ozet!;
  const [bekle, bekleAyarla] = useState(false);
  const paylas = () => {
    bekleAyarla(true);
    tribunKartiPaylas({ mac: m, ozet: o.cumleler, tahmin: oda.tahmin.ben, puan: oda.tahmin.puan, mesaj: o.mesaj ?? 0 }).then((ok) => { bekleAyarla(false); if (!ok) c.tost('Kart paylaşılamadı'); });
  };
  return (
    <Belir>
      <View style={[s.sonu, { backgroundColor: R.panel, borderColor: R.ince }]}>
        <View style={s.sonuUst}>
          <View style={[s.mini, { backgroundColor: R.vurguYumusak }]}><Text style={[s.miniYazi, { color: R.vurgu }]}>MAÇ SONU</Text></View>
          <Text style={[s.sonuSkor, { color: R.murekkep }]}>{m.ev.kisa} {m.skor.ev}–{m.skor.dep} {m.dep.kisa}</Text>
        </View>
        <View style={[s.markaBalon, { backgroundColor: R.vurguYumusak, borderColor: sa(R.vurgu, 0.28), alignSelf: 'stretch', gap: 6 }]}>
          <View style={s.markaUst}><Text style={[s.markaAd, { color: R.murekkep }]}>Gecenin özeti</Text><YzEtiketi kucuk /></View>
          {o.cumleler.map((t, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
              <Text style={[s.sonuNo, { color: R.vurgu }]}>{i + 1}</Text>
              <Text style={[s.markaYazi, { color: R.murekkep, flex: 1 }]}>{t}</Text>
            </View>
          ))}
        </View>
        {oda.tahmin.ben && (
          <View style={[s.tutmaSatir, { backgroundColor: oda.tahmin.puan ? sa(R.yesil, 0.12) : R.ust }]}>
            <Ikon ad="yildiz" boyut={17} renk={oda.tahmin.puan ? R.yesil : R.soluk} kalinlik={2} />
            <Text style={[s.tutmaYazi, { color: R.murekkep }]}>Tahminin {oda.tahmin.ben.ev}–{oda.tahmin.ben.dep}{oda.tahmin.puan ? ` · tuttu, +${oda.tahmin.puan} puan` : ' · bu sefer tutmadı'}</Text>
          </View>
        )}
        {o.kararlar.some((k) => k.oylar) && (
          <View style={{ gap: 8 }}>
            <Text style={[s.sonuBaslik, { color: R.soluk }]}>GECENİN KARAR ANLARI · TRİBÜN NE DEDİ?</Text>
            {o.kararlar.filter((k) => k.oylar).map((k) => {
              const t = k.toplam || 1;
              const [d, y, e] = k.oylar!;
              return (
                <View key={k.id} style={{ gap: 4 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={[s.dagAd, { color: R.murekkep }]}>{k.dk}’ · {k.baslik}</Text><Text style={[s.dagYuz, { color: R.soluk }]}>{k.toplam} oy</Text></View>
                  <View style={s.cubuk}>
                    <View style={{ flex: d || 0.001, backgroundColor: R.yesil }} />
                    <View style={{ flex: y || 0.001, backgroundColor: R.kalem }} />
                    <View style={{ flex: e || 0.001, backgroundColor: R.cizgi }} />
                  </View>
                  <Text style={[s.blokAlt, { color: R.soluk }]}>doğru %{Math.round((d * 100) / t)} · yanlış %{Math.round((y * 100) / t)} · emin değil %{Math.round((e * 100) / t)}</Text>
                </View>
              );
            })}
          </View>
        )}
        <Text style={[s.blokAlt, { color: R.soluk }]}>Tribünde {o.mesaj} mesaj yazıldı{o.oy ? `, ${o.oy} oy kullanıldı` : ''}.{o.skorTeyit === 'tamam' ? ' Skor ikinci kaynakla doğrulandı.' : ''}</Text>
        <Dugme yazi={bekle ? 'Hazırlanıyor…' : 'Kartı paylaş'} tur="acik" ikon="paylas" devre={bekle} onPress={paylas} />
      </View>
    </Belir>
  );
}

// ============================================================ stiller ============================================================
const s = StyleSheet.create({
  bos: { fontFamily: yazi.orta, fontSize: 15, textAlign: 'center', paddingVertical: 36, paddingHorizontal: 20 },
  tanitim: { paddingHorizontal: 4, gap: 3, paddingBottom: 2 },
  heroAlt: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 10, paddingHorizontal: 2 },
  heroKanal: { fontFamily: yazi.orta, fontSize: 13, flexShrink: 1 },
  tanitimBaslik: { fontFamily: yazi.kalin, fontSize: 22, letterSpacing: -0.6 },
  tanitimYazi: { fontFamily: yazi.normal, fontSize: 14.5, lineHeight: 20 },
  baslikSatir: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 4, marginTop: 6 },
  baslik: { fontFamily: yazi.kalin, fontSize: 11.5, letterSpacing: 1.2 },
  muhRozet: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginRight: 8 },
  muhRozetYazi: { fontFamily: yazi.kalin, fontSize: 10.5, letterSpacing: 0.8 },
  mac: { borderRadius: 24, borderWidth: 1, padding: 16, gap: 12 },
  macUst: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  macLig: { fontFamily: yazi.kalin, fontSize: 11, letterSpacing: 1.1, flexShrink: 1 },
  macDurum: { fontFamily: yazi.orta, fontSize: 13 },
  macOrta: { flexDirection: 'row', alignItems: 'center' },
  macTakim: { flex: 1, alignItems: 'center', gap: 6, minWidth: 0 },
  macTakimAd: { fontFamily: yazi.kalin, fontSize: 14.5, textAlign: 'center' },
  macSkor: { minWidth: 86, alignItems: 'center' },
  macSaat: { fontFamily: yazi.marka, fontSize: 25, letterSpacing: -1 },
  macSkorYazi: { fontFamily: yazi.marka, fontSize: 30, letterSpacing: -1.2, fontVariant: ['tabular-nums'] },
  macAlt: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  macKanal: { fontFamily: yazi.normal, fontSize: 13, flexShrink: 1 },
  mini: { flexDirection: 'row', alignItems: 'center', gap: 2, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  miniYazi: { fontFamily: yazi.kalin, fontSize: 10, letterSpacing: 0.7 },
  hatirlat: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, borderWidth: 1.5, paddingHorizontal: 11, height: 36 },
  hatirlatYazi: { fontFamily: yazi.orta, fontSize: 13 },
  gir: { borderRadius: 999, paddingHorizontal: 15, height: 36, alignItems: 'center', justifyContent: 'center' },
  girYazi: { fontFamily: yazi.kalin, fontSize: 13.5 },
  deneme: { borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 20, padding: 14, gap: 8, marginTop: 8 },
  denemeBaslik: { fontFamily: yazi.kalin, fontSize: 10.5, letterSpacing: 1 },
  denemeYazi: { fontFamily: yazi.normal, fontSize: 13, lineHeight: 18 },
  dipnot: { fontFamily: yazi.normal, fontSize: 12, textAlign: 'center', marginTop: 4 },
  // oda
  ustAlt: { fontFamily: yazi.kalin, fontSize: 13.5, marginRight: 12, letterSpacing: 0.4 },
  odada: { flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 4 },
  odadaYazi: { fontFamily: yazi.kalin, fontSize: 11, color: 'rgba(255,255,255,0.85)' },
  sekmeler: { flexDirection: 'row', borderRadius: 14, padding: 2, gap: 2, height: 34 }, // plan/39 A: 34 px ince yapışkan şerit
  sekme: { flex: 1, height: 30, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sekmeYazi: { fontFamily: yazi.orta, fontSize: 13.5 },
  genisKap: { flex: 1, flexDirection: 'row' },
  genisSol: { flex: 1, minWidth: 0 },
  genisSag: { width: 330, flexGrow: 0, borderLeftWidth: 1 },
  yanSatir: { fontFamily: yazi.normal, fontSize: 14, lineHeight: 20 },
  yazKap: { borderTopWidth: 1, paddingTop: 7, gap: 6 },
  yazSatir: { flexDirection: 'row', alignItems: 'flex-end', gap: 9, paddingHorizontal: 12 },
  bosAvatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  giris: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, minHeight: 40 },
  girisYazi: { flex: 1, fontFamily: yazi.normal, fontSize: 15, paddingVertical: 9 },
  halka: { marginLeft: 6, marginRight: -6 },
  gonder: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  // önce
  oncesi: { borderRadius: 24, borderWidth: 1, padding: 16, gap: 12 },
  sayacSatir: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sayacEtiket: { fontFamily: yazi.kalin, fontSize: 10.5, letterSpacing: 1.1 },
  sayacDeger: { fontFamily: yazi.marka, fontSize: 26, letterSpacing: -1, marginTop: 2 },
  oncesiSoru: { fontFamily: yazi.kalin, fontSize: 15.5, letterSpacing: -0.2 },
  chipler: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 999, borderWidth: 1.5, paddingHorizontal: 13, height: 38 },
  chipYazi: { fontFamily: yazi.orta, fontSize: 13.5 },
  nokta: { width: 14, height: 14, borderRadius: 7, borderWidth: 2.5 },
  tahminSatir: { flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 16, paddingHorizontal: 14, height: 48 },
  tahminYazi: { fontFamily: yazi.kalin, fontSize: 14.5, flex: 1 },
  tahminAlt: { fontFamily: yazi.normal, fontSize: 12.5 },
  oncesiAlt: { fontFamily: yazi.normal, fontSize: 12.5, lineHeight: 17 },
  // olay
  ayrac: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  ayracCizgi: { flex: 1, height: 1 },
  ayracYazi: { fontFamily: yazi.kalin, fontSize: 12, letterSpacing: 0.3 },
  olay: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 11 },
  olayBuyuk: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 15, overflow: 'hidden' },
  olayBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5 },
  olayIk: { width: 34, alignItems: 'center' },
  top: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  topIc: { width: 11, height: 11, borderRadius: 3, transform: [{ rotate: '45deg' }] },
  kartIk: { width: 18, height: 25, borderRadius: 4 },
  vIk: { minWidth: 34, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  vYazi: { fontFamily: yazi.marka, fontSize: 10.5 },
  olayUst: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
  olayAd: { fontFamily: yazi.marka, fontSize: 12, letterSpacing: 0.2 },
  olayDk: { fontFamily: yazi.kalin, fontSize: 13 },
  olayTakim: { fontFamily: yazi.kalin, fontSize: 16, letterSpacing: -0.3 },
  olaySkor: { alignItems: 'flex-end' },
  olaySkorYazi: { fontFamily: yazi.marka, fontSize: 22, letterSpacing: -1, fontVariant: ['tabular-nums'] },
  // mesaj
  markaSatir: { flexDirection: 'row', gap: 9, alignItems: 'flex-start', paddingRight: 24 },
  markaBalon: { flex: 1, borderRadius: 18, borderTopLeftRadius: 6, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 10, gap: 3 },
  markaUst: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  markaAd: { fontFamily: yazi.kalin, fontSize: 13.5 },
  markaYazi: { fontFamily: yazi.normal, fontSize: 15, lineHeight: 21 },
  mesaj: { flexDirection: 'row', gap: 8, alignItems: 'flex-end', maxWidth: '88%' },
  mesajBalon: { borderRadius: 18, paddingHorizontal: 13, paddingVertical: 8, flexShrink: 1 },
  mesajAd: { fontFamily: yazi.kalin, fontSize: 12, marginBottom: 1 },
  mesajYazi: { fontFamily: yazi.normal, fontSize: 15, lineHeight: 20 },
  mesajNot: { fontFamily: yazi.normal, fontSize: 11.5, marginTop: 2 },
  // karar
  karar: { borderRadius: 22, borderWidth: 1.5, padding: 15, gap: 9 },
  kararUst: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kararKalan: { fontFamily: yazi.orta, fontSize: 12.5, fontVariant: ['tabular-nums'] },
  kararBaslik: { fontFamily: yazi.orta, fontSize: 13, marginBottom: -4 },
  kararSoru: { fontFamily: yazi.kalin, fontSize: 19, letterSpacing: -0.5, lineHeight: 24 },
  kararSec: { minHeight: 44, borderRadius: 13, borderWidth: 1.5, overflow: 'hidden', justifyContent: 'center' },
  kararDolgu: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  kararSecIc: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 14, paddingVertical: 9 },
  kararSecYazi: { flex: 1, fontFamily: yazi.orta, fontSize: 15 },
  kararYuz: { fontFamily: yazi.kalin, fontSize: 15, fontVariant: ['tabular-nums'] },
  kararAlt: { fontFamily: yazi.normal, fontSize: 12.5 },
  tik: { width: 17, height: 17, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  // kadro
  kadro: { borderRadius: 20, borderWidth: 1, padding: 14, gap: 12 },
  kadroUst: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  kadroOzet: { flex: 1, fontFamily: yazi.kalin, fontSize: 14, letterSpacing: -0.1 },
  kadroAc: { fontFamily: yazi.kalin, fontSize: 13 },
  kadroOnSatir: { gap: 3 },
  kadroOnBas: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  kadroOnAd: { fontFamily: yazi.kalin, fontSize: 13.5, letterSpacing: 0.3 },
  kadroOnForm: { fontFamily: yazi.kalin, fontSize: 12.5 },
  kadroOnIsimler: { fontFamily: yazi.orta, fontSize: 13.5, lineHeight: 19 },
  kadroIki: { flexDirection: 'row', gap: 14 },
  kadroAyrac: { width: 1 },
  kadroSut: { flex: 1, minWidth: 0, gap: 3 },
  kadroBaslik: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 6 },
  kadroTakimAd: { flexShrink: 1, fontFamily: yazi.kalin, fontSize: 15.5, letterSpacing: -0.3 },
  kadroEtiket: { fontFamily: yazi.kalin, fontSize: 10.5, letterSpacing: 1, marginBottom: 1 },
  kadroSatir: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 27 },
  kadroNo: { width: 26, textAlign: 'right', fontFamily: yazi.kalin, fontSize: 13.5, fontVariant: ['tabular-nums'] },
  kadroAd: { flex: 1, fontFamily: yazi.orta, fontSize: 15 },
  kadroYedekKap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  kadroYedek: { fontFamily: yazi.orta, fontSize: 12.5, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, overflow: 'hidden', maxWidth: '100%' },
  kadroTeknik: { fontFamily: yazi.normal, fontSize: 13, marginTop: 8 },
  // olay listesi
  zaman: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 6, borderBottomWidth: 1 },
  zamanDk: { width: 46, fontFamily: yazi.kalin, fontSize: 14, textAlign: 'right', fontVariant: ['tabular-nums'] },
  zamanIk: { width: 24, alignItems: 'center' },
  zamanAd: { fontFamily: yazi.kalin, fontSize: 15 },
  zamanOyuncu: { fontFamily: yazi.normal, fontSize: 13.5 },
  zamanSkor: { fontFamily: yazi.marka, fontSize: 16, letterSpacing: -0.5 },
  // tahmin
  kutuBlok: { borderRadius: 22, borderWidth: 1, padding: 16, gap: 11 },
  blokBaslik: { fontFamily: yazi.kalin, fontSize: 16, letterSpacing: -0.3 },
  blokAlt: { fontFamily: yazi.normal, fontSize: 12.5, lineHeight: 17 },
  blokSonuc: { fontFamily: yazi.kalin, fontSize: 16 },
  stepSatir: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingVertical: 4 },
  stepTire: { fontFamily: yazi.marka, fontSize: 22 },
  stepper: { alignItems: 'center', gap: 10 },
  stepKontrol: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepDugme: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  stepIsaret: { fontFamily: yazi.kalin, fontSize: 22, marginTop: -2 },
  stepDeger: { fontFamily: yazi.marka, fontSize: 36, letterSpacing: -1, minWidth: 34, textAlign: 'center' },
  dagAd: { fontFamily: yazi.orta, fontSize: 14 },
  dagYuz: { fontFamily: yazi.kalin, fontSize: 13.5 },
  dagIz: { height: 8, borderRadius: 4, overflow: 'hidden' },
  dagDolu: { height: 8, borderRadius: 4 },
  tabloSatir: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  tabloNo: { width: 16, fontFamily: yazi.kalin, fontSize: 13, textAlign: 'center' },
  tabloAd: { flex: 1, fontFamily: yazi.orta, fontSize: 14.5 },
  tabloTahmin: { fontFamily: yazi.orta, fontSize: 13.5, fontVariant: ['tabular-nums'] },
  tabloPuan: { fontFamily: yazi.kalin, fontSize: 14, minWidth: 36, textAlign: 'right' },
  // bildir
  bildirDugme: { height: 50, marginHorizontal: 20, marginTop: 6, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  bildirDugmeYazi: { fontFamily: yazi.kalin, fontSize: 15.5, color: '#fff' },
  bildirAciklama: { fontFamily: yazi.normal, fontSize: 13.5, lineHeight: 19, paddingHorizontal: 20, paddingVertical: 12 },
  bildirSatir: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: 1 },
  bildirYazi: { flex: 1, fontFamily: yazi.orta, fontSize: 15.5 },
  // maç sonu
  sonu: { borderRadius: 24, borderWidth: 1, padding: 16, gap: 12 },
  sonuUst: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sonuSkor: { fontFamily: yazi.marka, fontSize: 17, letterSpacing: -0.5 },
  sonuNo: { fontFamily: yazi.marka, fontSize: 13, marginTop: 3 },
  sonuBaslik: { fontFamily: yazi.kalin, fontSize: 10.5, letterSpacing: 1 },
  tutmaSatir: { flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 14, paddingHorizontal: 13, paddingVertical: 11 },
  tutmaYazi: { fontFamily: yazi.kalin, fontSize: 14.5, flex: 1 },
  cubuk: { flexDirection: 'row', height: 9, borderRadius: 5, overflow: 'hidden', gap: 2 },
});
