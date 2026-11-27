// Gönderi ayrıntısı: kart + yorumlar (tek seviye cevap) + yorum yazma. 10 sn'de bir yenilenir (marka cevapları gelsin).
import { useCallback, useEffect, useRef, useState } from 'react';
import { okunduSay } from './okuma';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { yazi } from '@/tema/tema';
import * as C from '@/canli';
import type { Yorum } from '@/canli';
import { Ad, Avatar, Bas, Belir, Dugme, Ikon, Pencere, Rakam, useRenk } from './ortak';
import { useCanli } from './baglam';
import { KarakterHalkasi, harfSay } from './Sayac';
import { Kart } from './Kart';
import { UstBaslik, useYazmaAltPayi } from './Duzen';
import { KurucuSecenekleri } from './Kurucu';
import { EtiketliMetin, EtiketOneri } from './Etiket';
import { useKlavye } from './klavye';
import { EngelAlani, useEngel } from './engel';
import { gorevBildir } from './SagKose';

const YORUM_SINIR = 200;

export function Detay({ id, yaz }: { id: string; yaz?: boolean }) {
  const R = useRenk();
  const c = useCanli();
  const klavye = useKlavye();
  const g = c.harita[id];
  const [yorumlar, yorumlarAyarla] = useState<Yorum[] | null>(null);
  const [hata, hataAyarla] = useState(false);
  const [metin, metinAyarla] = useState('');
  const eng = useEngel(metin, 'yorum'); // engel uyarısı: kutuda kalan metin + sakin açıklama (engel.tsx)
  const [girisBoy, girisBoyAyarla] = useState(22); // boşken tek satır (sohbetteki gibi), yazdıkça 110 px'e kadar uzar
  const [cevap, cevapAyarla] = useState<Yorum | null>(null);
  const [gonderiliyor, gonderiliyorAyarla] = useState(false);
  const [yeniIdler, yeniIdlerAyarla] = useState<Set<string>>(new Set());
  const [silinecek, silinecekAyarla] = useState<Yorum | null>(null);
  const [yonet, yonetAyarla] = useState<Yorum | null>(null); // kurucu: yorum ⋯ menüsü
  const [siliniyor, siliniyorAyarla] = useState(false);
  const giris = useRef<TextInput>(null);
  const bilinen = useRef<Set<string>>(new Set());
  // Zincir görünümü: uzun zincirde son 2 yanıt; "↪ @kişi'ye yanıt"a dokununca o yoruma kaydır + kısa vurgu.
  const [acik, acikAyarla] = useState<Set<string>>(new Set());
  const [vurgu, vurguAyarla] = useState<string | null>(null);
  const kaydirma = useRef<ScrollView>(null);
  const zincirY = useRef<Record<string, number>>({});
  const satirY = useRef<Record<string, { kok: string; y: number }>>({});
  const yorumaGit = (hedef: string, kok: string) => {
    if (!acik.has(kok)) acikAyarla((s0) => new Set(s0).add(kok));
    setTimeout(() => {
      const r = satirY.current[hedef];
      const y = (zincirY.current[r?.kok ?? kok] ?? 0) + (r?.y ?? 0);
      kaydirma.current?.scrollTo({ y: Math.max(0, y - 80), animated: true });
      vurguAyarla(hedef);
      setTimeout(() => vurguAyarla((v) => (v === hedef ? null : v)), 1600);
    }, 60);
  };

  const yukle = useCallback(async () => {
    const r = await C.gonderiGetir(id);
    if (!r.ok) {
      if (!yorumlar) hataAyarla(true);
      return;
    }
    c.koy([r.veri.gonderi]);
    const hepsi = r.veri.yorumlar.flatMap((y) => [y.id, ...y.cevaplar.map((x) => x.id)]);
    if (bilinen.current.size) yeniIdlerAyarla(new Set(hepsi.filter((x) => !bilinen.current.has(x))));
    bilinen.current = new Set(hepsi);
    yorumlarAyarla(r.veri.yorumlar);
  }, [id]);

  useEffect(() => {
    yorumlarAyarla(null);
    hataAyarla(false);
    bilinen.current = new Set();
    yukle();
    const t = setInterval(yukle, 10000);
    return () => clearInterval(t);
  }, [id]);
  useEffect(() => {
    if (yaz && C.oturumVar()) setTimeout(() => giris.current?.focus(), 350);
  }, [yaz]);
  // Açılan balon okundu sayılır (Okur rozeti; 2 sn açık kalırsa).
  useEffect(() => {
    const t = setTimeout(() => okunduSay(id), 2000);
    return () => clearTimeout(t);
  }, [id]);

  // Çift gönderim kilidi (07.10): Enter + düğme ya da hızlı iki dokunuş aynı yorumu iki kez göndermesin (durum değişkeni bir sonraki çizime kadar eski kalır).
  const kilit = useRef(false);
  const gonder = async () => {
    const m = metin.trim();
    if (!m || kilit.current) return;
    if (harfSay(m) > YORUM_SINIR) return c.tost(`En çok ${YORUM_SINIR} harf.`);
    if (!c.girisIste('Yorum yazmak için giriş yap')) return;
    kilit.current = true;
    gonderiliyorAyarla(true);
    const r = await C.yorumYaz(id, m, cevap?.id);
    gonderiliyorAyarla(false);
    kilit.current = false;
    if (!r.ok) {
      if (r.durum === 401) c.girisIste('Yorum yazmak için giriş yap');
      else if (r.hata === 'tekrar') metinAyarla('');
      else if (!eng.koy(r, m)) c.tost(C.hataYazisi(r.hata, r.durum));
      return;
    }
    metinAyarla('');
    const y = r.veri;
    bilinen.current.add(y.id);
    yeniIdlerAyarla(new Set([y.id]));
    yorumlarAyarla((l) => {
      const liste = l ?? [];
      if (liste.some((x) => x.id === y.id || x.cevaplar.some((z) => z.id === y.id))) return liste;
      if (cevap) {
        const kok = cevap.cevap || cevap.id;
        return liste.map((x) => (x.id === kok ? { ...x, cevaplar: [...x.cevaplar, y] } : x));
      }
      return [...liste, y];
    });
    cevapAyarla(null);
    c.guncelle(id, (x) => ({ yorum: x.yorum + 1 }));
    gorevBildir('yorum', c.uye?.uid); // günün görevi (SagKose)
    setTimeout(yukle, 7000);
  };

  const yorumBegen = (y: Yorum) => {
    if (!c.girisIste('Beğenmek için giriş yap')) return;
    const degis = (l: Yorum[]): Yorum[] => l.map((x) => (x.id === y.id ? { ...x, begendim: !x.begendim, begeni: x.begeni + (x.begendim ? -1 : 1) } : { ...x, cevaplar: degis(x.cevaplar) }));
    yorumlarAyarla((l) => (l ? degis(l) : l));
    C.begen(y.id, 'yorum').then((r) => {
      if (!r.ok) {
        yorumlarAyarla((l) => (l ? degis(l) : l));
        c.tost(C.hataYazisi(r.hata, r.durum));
      }
    });
  };
  // Kendi yorumunu silme (⋯ → onay).
  const yorumSil = async () => {
    if (!silinecek) return;
    siliniyorAyarla(true);
    const r = await C.sil(silinecek.id, 'yorum');
    siliniyorAyarla(false);
    if (!r.ok) return c.tost(C.hataYazisi(r.hata, r.durum));
    const id0 = silinecek.id;
    const ust = yorumlar?.find((x) => x.id === id0);
    yorumlarAyarla((l) => (l ? l.filter((x) => x.id !== id0).map((x) => ({ ...x, cevaplar: x.cevaplar.filter((z) => z.id !== id0) })) : l));
    c.guncelle(id, (x) => ({ yorum: Math.max(0, x.yorum - 1 - (ust ? ust.cevaplar.length : 0)) }));
    silinecekAyarla(null);
    c.tost('Yorum silindi');
  };
  // Yeniden paylaş (#5): markanın cevabında Paylaş menüsü; paylaşılınca sayaç ve "paylaştım" işareti güncellenir.
  const yorumPaylas = (y: Yorum) => {
    const isle = (l: Yorum[]): Yorum[] => l.map((x) => (x.id === y.id ? { ...x, yeniden: (x.yeniden ?? 0) + 1, yenidenBen: true } : { ...x, cevaplar: isle(x.cevaplar) }));
    c.paylasAc({ tur: 'yorum', y, gonderiId: id, sonra: () => yorumlarAyarla((l) => (l ? isle(l) : l)) });
  };
  const cevapla = (y: Yorum) => {
    if (!c.girisIste('Cevap yazmak için giriş yap')) return;
    cevapAyarla(y);
    setTimeout(() => giris.current?.focus(), 50);
  };

  const kalan = YORUM_SINIR - harfSay(metin);
  // Telefonda yazma alanı yüzen rıhtımın (ve taşan Yaz düğmesinin) tam üstünde durur; klavye açıkken rıhtım gizli, pay 0.
  const altBosluk = useYazmaAltPayi(klavye);
  return (
    <View style={{ flex: 1 }}>
      <UstBaslik baslik="Gönderi" geri={c.geri} />
      <ScrollView ref={kaydirma} style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        {g ? <Kart g={g} tam /> : hata ? <Bos metin="Bu gönderi artık yok." /> : <ActivityIndicator style={{ marginTop: 40 }} color={R.vurgu} />}
        {g && (
          <View style={[s.yorumBaslik, { borderBottomColor: R.ince }]}>
            <Text style={[s.yorumBaslikYazi, { color: R.murekkep }]}>{g.tur === 'sohbet' || g.tur === 'soru' ? 'Cevaplar' : 'Yorumlar'}</Text>
            <Text style={[s.yorumSayi, { color: R.soluk }]}>{g.yorum || ''}</Text>
          </View>
        )}
        {g && yorumlar === null && !hata && <ActivityIndicator style={{ marginTop: 24 }} color={R.vurgu} />}
        {yorumlar && yorumlar.length === 0 && <Bos metin={g?.tur === 'sohbet' || g?.tur === 'soru' ? 'İlk cevabı sen yaz.' : 'İlk yorumu sen yaz.'} />}
        {yorumlar?.map((y) => {
          const gizli = y.cevaplar.length > 3 && !acik.has(y.id) ? y.cevaplar.length - 2 : 0;
          const gorunen = gizli ? y.cevaplar.slice(-2) : y.cevaplar;
          const konum = (x: Yorum) => (e: any) => {
            satirY.current[x.id] = { kok: y.id, y: e.nativeEvent.layout.y };
          };
          return (
            <View key={y.id} onLayout={(e) => { zincirY.current[y.id] = e.nativeEvent.layout.y; }} style={[s.zincir, { borderBottomColor: R.ince }]}>
              <View onLayout={konum(y)}>
                <YorumSatiri y={y} zincirVar={y.cevaplar.length > 0} yeni={yeniIdler.has(y.id)} vurgu={vurgu === y.id} begen={yorumBegen} cevapla={cevapla} paylas={yorumPaylas} sil={silinecekAyarla} yonet={yonetAyarla} />
              </View>
              {!!gizli && (
                <Bas onPress={() => acikAyarla((s0) => new Set(s0).add(y.id))} style={s.dahaFazla} hoverRenk={R.hover}>
                  <View style={[s.dahaCizgi, { backgroundColor: R.cizgi }]} />
                  <Text style={[s.dahaYazi, { color: R.vurgu }]}>{gizli} yanıtı daha gör</Text>
                </Bas>
              )}
              {gorunen.map((x, i) => (
                <View key={x.id} onLayout={konum(x)}>
                  <YorumSatiri y={x} alt son={i === gorunen.length - 1} yeni={yeniIdler.has(x.id)} vurgu={vurgu === x.id} yanitBas={x.yanit ? () => yorumaGit(x.yanit!, y.id) : undefined} begen={yorumBegen} cevapla={cevapla} paylas={yorumPaylas} sil={silinecekAyarla} yonet={yonetAyarla} />
                </View>
              ))}
            </View>
          );
        })}
      </ScrollView>
      <Pencere acik={!!yonet} kapat={() => yonetAyarla(null)} genislik={420} baslik="Yorum">
        {yonet && (
          <View style={{ paddingBottom: 14 }}>
            {(yonet.benim || yonet.yazar.uid === c.uye?.uid) && (
              <Bas onPress={() => { const y = yonet; yonetAyarla(null); silinecekAyarla(y); }} style={[s.menuSatir, { borderBottomColor: R.ince }]} hoverRenk={R.hover}>
                <Ikon ad="cop" boyut={19} renk={R.kalem} />
                <Text style={[s.menuYazi, { color: R.kalem }]}>Sil</Text>
              </Bas>
            )}
            <KurucuSecenekleri
              hedef={{ tur: 'yorum', id: yonet.id, korumali: yonet.yazar.uid === c.uye?.uid || yonet.yazar.marka || !!yonet.yazar.kurucu }}
              bitti={() => {
                const id0 = yonet.id;
                yonetAyarla(null);
                yorumlarAyarla((l) => (l ? l.filter((x) => x.id !== id0).map((x) => ({ ...x, cevaplar: x.cevaplar.filter((z) => z.id !== id0) })) : l));
                setTimeout(yukle, 600);
              }}
            />
          </View>
        )}
      </Pencere>
      <Pencere acik={!!silinecek} kapat={() => silinecekAyarla(null)} genislik={400}>
        <View style={s.silKutu}>
          <View style={[s.silIkon, { backgroundColor: R.gece ? 'rgba(255,92,108,0.14)' : 'rgba(215,38,61,0.08)' }]}>
            <Ikon ad="cop" boyut={24} renk={R.kalem} kalinlik={2.2} />
          </View>
          <Text style={[s.silBaslik, { color: R.murekkep }]}>Yorum silinsin mi?</Text>
          <Text style={[s.silAlt, { color: R.soluk }]}>Geri alınamaz.</Text>
          <View style={{ flexDirection: 'row', gap: 10, alignSelf: 'stretch', marginTop: 12 }}>
            <Dugme yazi="Vazgeç" tur="cizgi" onPress={() => silinecekAyarla(null)} style={{ flex: 1 }} />
            <Dugme yazi={siliniyor ? 'Siliniyor…' : 'Sil'} devre={siliniyor} onPress={yorumSil} style={{ flex: 1, backgroundColor: R.kalem, borderColor: R.kalem }} />
          </View>
        </View>
      </Pencere>
      <View style={[s.yazKap, { borderTopColor: R.ince, backgroundColor: R.panel, paddingBottom: 10 + altBosluk }]}>
        {cevap && (
          <View style={s.cevapSatir}>
            <Text style={[s.cevapYazi, { color: R.soluk }]} numberOfLines={1}>
              <Text style={{ fontFamily: yazi.kalin, color: R.vurgu }}>@{yonelme(cevap.yazar.ad)}</Text> yanıt veriyorsun
            </Text>
            <Bas onPress={() => cevapAyarla(null)} etiket="Cevabı iptal et" hitSlop={8}>
              <Ikon ad="kapat" boyut={16} renk={R.soluk} />
            </Bas>
          </View>
        )}
        <EtiketOneri metin={metin} ayarla={(t) => { metinAyarla(t.slice(0, YORUM_SINIR + 20)); giris.current?.focus(); }} ust />
        <EngelAlani engel={eng.engel} ipucu={eng.ipucu} />
        <View style={s.yazSatir}>
          {c.uye && !c.uye.yeni ? <Avatar yazar={{ uid: c.uye.uid, ad: c.uye.ad, marka: false, yuz: c.uye.yuz, kurucu: c.uye.kurucu, balon: c.uye.balon }} boyut={34} /> : <View style={[s.bosAvatar, { backgroundColor: R.ust }]}><Ikon ad="kisi" boyut={17} renk={R.soluk} /></View>}
          <View style={[s.giris, { backgroundColor: R.ust, borderColor: R.ince }]}>
            <TextInput
              ref={giris}
              value={metin}
              onChangeText={(t) => metinAyarla(t.slice(0, YORUM_SINIR + 20))}
              onFocus={() => {
                if (!C.oturumVar() || c.uye?.yeni) {
                  giris.current?.blur();
                  c.girisIste('Yorum yazmak için giriş yap', () => setTimeout(() => giris.current?.focus(), 300));
                }
              }}
              placeholder={g?.tur === 'sohbet' ? 'Sen ne cevap verirdin?' : g?.tur === 'soru' ? 'Cevabını yaz…' : 'Yorum yaz…'}
              placeholderTextColor={R.soluk}
              multiline
              numberOfLines={1}
              onContentSizeChange={(e) => girisBoyAyarla(Math.min(110, Math.max(22, Math.ceil(e.nativeEvent.contentSize.height))))}
              style={[s.girisYazi, { color: R.murekkep, height: metin ? girisBoy : 22 }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
              onSubmitEditing={gonder}
              blurOnSubmit={false}
              onKeyPress={(e: any) => {
                if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
                  e.preventDefault?.();
                  gonder();
                }
              }}
            />
            {!!metin && <View style={s.halka}><KarakterHalkasi uzunluk={harfSay(metin)} sinir={YORUM_SINIR} /></View>}
          </View>
          <Bas onPress={gonder} devre={!metin.trim() || kalan < 0 || gonderiliyor} etiket="Gönder" style={[s.gonder, { backgroundColor: R.vurgu }]}>
            {gonderiliyor ? <ActivityIndicator color="#fff" size="small" /> : <Ikon ad="yukari" boyut={18} renk="#fff" kalinlik={2.6} />}
          </Bas>
        </View>
      </View>
    </View>
  );
}

// "sitbil" -> "sitbil'e", "ali" -> "ali'ye", "yazsammi" -> "yazsammi'ye" (yönelme eki, ünlü uyumuyla).
export function yonelme(ad: string) {
  const SESLI = 'aeıioöuü';
  const k = ad.toLocaleLowerCase('tr');
  const sesli = [...k].reverse().find((h) => SESLI.includes(h));
  const ince = !sesli || 'eiöü'.includes(sesli);
  return `${ad}'${SESLI.includes(k.slice(-1)) ? 'y' : ''}${ince ? 'e' : 'a'}`;
}

function YorumSatiri({ y, alt, son, zincirVar, yeni, vurgu, yanitBas, begen, cevapla, paylas, sil, yonet }: { y: Yorum; alt?: boolean; son?: boolean; zincirVar?: boolean; yeni?: boolean; vurgu?: boolean; yanitBas?: () => void; begen: (y: Yorum) => void; cevapla: (y: Yorum) => void; paylas: (y: Yorum) => void; sil: (y: Yorum) => void; yonet: (y: Yorum) => void }) {
  const R = useRenk();
  const c = useCanli();
  const benim = y.benim || (!!c.uye && y.yazar.uid === c.uye.uid);
  const kurucu = !!c.uye?.kurucu;
  const zemin = vurgu || yeni ? R.vurguYumusak : benim ? (R.gece ? 'rgba(255,255,255,0.04)' : 'rgba(91,46,255,0.045)') : undefined;
  return (
    <Belir aktif={!!yeni}>
      <View style={[s.yorum, alt && s.yorumAlt, zemin ? { backgroundColor: zemin } : null]}>
        {(alt || zincirVar) && <View style={[s.altCizgi, alt ? (son ? { top: 0, height: 22 } : { top: 0, bottom: 0 }) : { top: 50, bottom: 0 }, { backgroundColor: R.cizgi }]} />}
        <Bas onPress={() => c.git({ tur: 'profil', ad: y.yazar.ad })} etiket={`${y.yazar.ad} profili`}>
          <Avatar yazar={y.yazar} boyut={alt ? 28 : 34} />
        </Bas>
        <View style={{ flex: 1, gap: 3 }}>
          <View style={s.yorumUst}>
            <Ad yazar={y.yazar} boyut={14.5} onPress={() => c.git({ tur: 'profil', ad: y.yazar.ad })} />
            <Text style={[s.yorumZaman, { color: R.soluk }]}>· {C.zamanOnce(y.zaman)}</Text>
            {(benim || kurucu) && (
              <Bas onPress={() => (kurucu ? yonet(y) : sil(y))} etiket="Yorum seçenekleri" style={s.yorumNokta} hoverRenk={R.vurguYumusak} hitSlop={6}>
                <Ikon ad="nokta" boyut={17} renk={R.soluk} />
              </Bas>
            )}
          </View>
          {alt && !!y.yanitAd && (
            <Bas onPress={yanitBas} style={s.yanitSatir} etiket={`@${y.yanitAd} yorumuna git`} hitSlop={4}>
              <Text style={[s.yanitYazi, { color: R.soluk }]} numberOfLines={1}>
                {'↪ '}
                <Text style={{ fontFamily: yazi.orta, color: R.vurgu }}>@{yonelme(y.yanitAd)}</Text> yanıt
              </Text>
            </Bas>
          )}
          <EtiketliMetin metin={y.metin} etiketler={y.etiketler} style={[s.yorumMetin, { color: R.murekkep }]} />
          <View style={s.yorumEylem}>
            <Bas onPress={() => begen(y)} style={s.yorumEylemOge} hitSlop={6} etiket="Beğen">
              <Ikon ad="kalp" boyut={15} renk={y.begendim ? R.kalp : R.soluk} dolu={y.begendim} />
              <Rakam n={y.begeni} renk={y.begendim ? R.kalp : R.soluk} boyut={12.5} />
            </Bas>
            <Bas onPress={() => cevapla(y)} style={s.yorumEylemOge} hitSlop={6}>
              <Text style={[s.cevaplaYazi, { color: R.soluk }]}>Cevapla</Text>
            </Bas>
            {y.yeniden !== undefined && (
              <Bas onPress={() => paylas(y)} style={s.yorumEylemOge} hitSlop={6} etiket={y.yeniden ? `Paylaş, ${y.yeniden} kişi akışında paylaştı` : 'Paylaş'}>
                <Ikon ad="paylas" boyut={15} renk={R.soluk} />
                {!!y.yeniden && (
                  <View style={s.yorumYeniden}>
                    <Ikon ad="yeniden" boyut={14} renk={y.yenidenBen ? R.vurgu : R.soluk} kalinlik={2.2} />
                    <Rakam n={y.yeniden} renk={y.yenidenBen ? R.vurgu : R.soluk} boyut={12.5} />
                  </View>
                )}
              </Bas>
            )}
          </View>
        </View>
      </View>
    </Belir>
  );
}

export function Bos({ metin }: { metin: string }) {
  const R = useRenk();
  return <Text style={[s.bos, { color: R.soluk }]}>{metin}</Text>;
}

const s = StyleSheet.create({
  yorumBaslik: { flexDirection: 'row', alignItems: 'baseline', gap: 8, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10, borderBottomWidth: 1 },
  yorumBaslikYazi: { fontFamily: yazi.kalin, fontSize: 16 },
  yorumSayi: { fontFamily: yazi.orta, fontSize: 14 },
  zincir: { borderBottomWidth: 1, paddingBottom: 4 },
  yorum: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 10 },
  yorumAlt: { paddingLeft: 60, paddingTop: 6, paddingBottom: 8 },
  altCizgi: { position: 'absolute', left: 32, width: 2, borderRadius: 1 },
  yanitSatir: { alignSelf: 'flex-start', marginTop: -1 },
  yanitYazi: { fontFamily: yazi.normal, fontSize: 12.5 },
  dahaFazla: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 60, paddingVertical: 8 },
  dahaCizgi: { position: 'absolute', left: 32, top: 0, bottom: 0, width: 2, borderRadius: 1 },
  dahaYazi: { fontFamily: yazi.orta, fontSize: 13.5 },
  yorumUst: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  yorumZaman: { fontFamily: yazi.normal, fontSize: 13 },
  yorumMetin: { fontFamily: yazi.normal, fontSize: 15, lineHeight: 21 },
  yorumEylem: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 2 },
  yorumEylemOge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 3 },
  cevaplaYazi: { fontFamily: yazi.orta, fontSize: 13 },
  yorumYeniden: { flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 2 },
  yazKap: { borderTopWidth: 1, paddingHorizontal: 12, paddingVertical: 10, gap: 6 },
  cevapSatir: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6 },
  cevapYazi: { fontFamily: yazi.normal, fontSize: 13, flex: 1 },
  yazSatir: { flexDirection: 'row', alignItems: 'flex-end', gap: 9 },
  bosAvatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  giris: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, minHeight: 40 },
  girisYazi: { flex: 1, fontFamily: yazi.normal, fontSize: 15, lineHeight: 21, marginVertical: 9, padding: 0, maxHeight: 110 },
  halka: { marginLeft: 6, marginRight: -6, alignSelf: 'flex-end', marginBottom: 7 },
  gonder: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  bos: { fontFamily: yazi.orta, fontSize: 15, textAlign: 'center', paddingVertical: 36 },
  yorumNokta: { marginLeft: 'auto', width: 28, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: -4 },
  silKutu: { alignItems: 'center', gap: 6, padding: 26 },
  silIkon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  silBaslik: { fontFamily: yazi.kalin, fontSize: 21, letterSpacing: -0.4, textAlign: 'center' },
  silAlt: { fontFamily: yazi.normal, fontSize: 15, textAlign: 'center' },
  menuSatir: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 22, paddingVertical: 14, borderBottomWidth: 1 },
  menuYazi: { fontFamily: yazi.orta, fontSize: 15.5 },
});
