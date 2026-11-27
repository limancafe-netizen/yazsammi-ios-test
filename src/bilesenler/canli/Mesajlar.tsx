// Özel mesaj (plan/16 "2. adım — mesajlaşma"): Mesajlar listesi (Sohbetler / İstekler), sohbet ekranı (balonlar, saat, ✓/✓✓,
// açıkken 4 sn'de bir yoklama), ilk mesaj (istek) yazıcısı, mesaj ayarları. (09.10: eski "Yazsam mı? ölç" kutusu yeni arayüzden kalktı.)
// "Yazsam mı?" ile özel sohbet: listede en üstte sabit satır; sohbette cevap hazırlanırken "yazıyor…" (yoklama 1,5 sn), ⋯ → Sohbeti sil.
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { yazi } from '@/tema/tema';
import * as C from '@/canli';
import type { Kutular, Mesaj, MesajAyar, SohbetBilgi, SohbetOzet, Yazar } from '@/canli';
import { Avatar, Bas, Belir, Dugme, Ikon, KurucuRozet, Pencere, Rozet, useRenk, type Renk } from './ortak';
import { bildirimSesi } from '@/bildirimSesi';
import { useCanli } from './baglam';
import { UstBaslik, useYazmaAltPayi } from './Duzen';
import { useKlavye } from './klavye';
import { KarakterHalkasi, harfSay } from './Sayac';
import { YuzBalon } from './balon';
import { EngelAlani, useEngel } from './engel';

const ISTEK_SINIR = 300;
const MESAJ_SINIR = 1000;
const YOKLAMA = 4000;
const MARKA_YOKLAMA = 1500;
const gorunur = () => !(Platform.OS === 'web' && typeof document !== 'undefined' && document.hidden);
const saatYaz = (ms: number) => {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};
const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
function gunYaz(ms: number) {
  const d = new Date(ms);
  const bugun = new Date();
  const fark = Math.round((new Date(bugun.getFullYear(), bugun.getMonth(), bugun.getDate()).getTime() - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 86400000);
  if (fark === 0) return 'Bugün';
  if (fark === 1) return 'Dün';
  return `${d.getDate()} ${AYLAR[d.getMonth()]}`;
}
const adGoster = (y: Yazar) => (y.marka ? 'Yazsam mı?' : y.ad);
// Adın yanındaki rozet: marka mavi, kurucu altın.
const AdRozeti = ({ y, boyut = 15 }: { y: Yazar; boyut?: number }) => (y.marka ? <Rozet boyut={boyut} /> : y.kurucu ? <KurucuRozet boyut={boyut} /> : null);

// ---------------- Mesajlar listesi ----------------
export function Mesajlar({ geri, sekme: ilkSekme }: { geri?: () => void; sekme?: 'sohbet' | 'istek' }) {
  const R = useRenk();
  const c = useCanli();
  const girisli = !!c.uye && !c.uye.yeni;
  const [sekme, sekmeAyarla] = useState<'sohbet' | 'istek'>(ilkSekme ?? 'sohbet');
  const [k, kAyarla] = useState<Kutular | null>(null);
  const [hata, hataAyarla] = useState(false);
  const [islem, islemAyarla] = useState<string | null>(null);

  const yukle = useCallback(async () => {
    const r = await C.kutularGetir();
    if (!r.ok) return hataAyarla(true);
    hataAyarla(false);
    kAyarla(r.veri);
    c.mesajSayiAyarla(r.veri.okunmamis);
  }, []);
  useEffect(() => {
    if (!girisli) return;
    yukle();
    const t = setInterval(() => gorunur() && yukle(), 10000);
    return () => clearInterval(t);
  }, [girisli]);
  useEffect(() => {
    if (ilkSekme) sekmeAyarla(ilkSekme);
  }, [ilkSekme]);

  const istekIslem = async (s: SohbetOzet, is: 'kabul' | 'sil') => {
    islemAyarla(s.id + is);
    const r = await C.sohbetIslem(s.id, is);
    islemAyarla(null);
    if (!r.ok) return c.tost(C.hataYazisi(r.hata, r.durum));
    if (is === 'kabul') {
      c.tost('Sohbet açıldı');
      c.git({ tur: 'sohbet', id: s.id });
    } else c.tost('İstek silindi');
    yukle();
  };

  const istekSayi = k?.istekler.length ?? 0;
  return (
    <View style={{ flex: 1 }}>
      <UstBaslik
        baslik="Sohbet"
        geri={geri}
        sag={
          girisli ? (
            <Bas onPress={c.mesajAyarAc} etiket="Mesaj ayarları" style={s.ustDugme} hoverRenk={R.hover}>
              <Ikon ad="ayar" boyut={20} renk={R.murekkep} />
            </Bas>
          ) : undefined
        }
      />
      {!girisli ? (
        <BosEkran yuz="utangac" baslik="Mesajların burada." alt="Karşılıklı takipleştiğin kişilerle yazış." dugme="Giriş yap" onPress={() => c.girisIste('Mesajlar için giriş yap', () => {})} />
      ) : (
        <>
          <View style={[s.sekmeler, { borderBottomColor: R.ince }]}>
            {(
              [
                ['sohbet', 'Sohbetler', 0],
                ['istek', 'İstekler', istekSayi],
              ] as const
            ).map(([kk, ad, n]) => (
              <Pressable key={kk} onPress={() => sekmeAyarla(kk)} accessibilityRole="tab" accessibilityState={{ selected: sekme === kk }} style={({ hovered }: { hovered?: boolean; pressed: boolean }) => [s.sekme, hovered && { backgroundColor: R.hover }]}>
                <View style={s.sekmeIc}>
                  <Text style={[s.sekmeYazi, { color: sekme === kk ? R.murekkep : R.soluk }, sekme === kk && { fontFamily: yazi.kalin }]}>{ad}</Text>
                  {n > 0 && (
                    <View style={[s.sekmeSayi, { backgroundColor: R.kalem }]}>
                      <Text style={s.sekmeSayiYazi}>{n > 9 ? '9+' : n}</Text>
                    </View>
                  )}
                </View>
                {sekme === kk && <View style={[s.sekmeCizgi, { backgroundColor: R.vurgu }]} />}
              </Pressable>
            ))}
          </View>
          {!k ? (
            hata ? (
              <BosEkran yuz="uzgun" baslik="Mesajlar açılmadı." alt="Bağlantını kontrol et." dugme="Tekrar dene" onPress={yukle} />
            ) : (
              <ActivityIndicator style={{ marginTop: 40 }} color={R.vurgu} />
            )
          ) : sekme === 'sohbet' ? (
            <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
              {k.marka && <SohbetSatiri x={k.marka} marka onPress={() => c.git({ tur: 'sohbet', id: C.MARKA_SOHBET })} />}
              {k.sohbetler.length === 0 ? (
                <BosEkran yuz="kikir" baslik="Henüz sohbet yok." alt="Birini takip et; o da seni takip edince profilinden “Mesaj”a dokun." />
              ) : (
                k.sohbetler.map((x, i) => (
                  <Belir key={x.id} gecikme={Math.min(i, 8) * 30}>
                    <SohbetSatiri x={x} onPress={() => c.git({ tur: 'sohbet', id: x.id })} />
                  </Belir>
                ))
              )}
            </ScrollView>
          ) : k.istekler.length === 0 ? (
            <BosEkran yuz="emin" baslik="İstek yok." alt="Sana gelen ilk mesajlar burada bekler. Sen kabul edene kadar okunduğunu görmezler." />
          ) : (
            <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
              <Text style={[s.istekNot, { color: R.soluk }]}>Kabul edene kadar okunduğunu görmezler.</Text>
              {k.istekler.map((x) => (
                <Bas key={x.id} onPress={() => c.git({ tur: 'sohbet', id: x.id })} style={[s.istek, { borderBottomColor: R.ince }]} hoverRenk={R.hover} rol="link">
                  <Avatar yazar={x.kisi} boyut={48} />
                  <View style={{ flex: 1, gap: 4, minWidth: 0 }}>
                    <View style={s.satirUst}>
                      <Text numberOfLines={1} style={[s.ad, { color: R.murekkep }]}>{adGoster(x.kisi)}</Text>
                      <Text style={[s.zaman, { color: R.soluk }]}>{C.zamanOnce(x.zaman)}</Text>
                    </View>
                    {!!x.son && (
                      <View style={[s.istekBalon, { backgroundColor: R.ust }]}>
                        <Text style={[s.istekMetin, { color: R.murekkep }]} numberOfLines={3}>{x.son.metin}</Text>
                      </View>
                    )}
                    <View style={s.istekDugmeler}>
                      <Dugme yazi="Sil" kucuk tur="cizgi" devre={!!islem} onPress={() => istekIslem(x, 'sil')} style={{ flex: 1 }} />
                      <Dugme yazi={islem === x.id + 'kabul' ? '…' : 'Kabul et'} kucuk tur="acik" devre={!!islem} onPress={() => istekIslem(x, 'kabul')} style={{ flex: 1 }} />
                    </View>
                  </View>
                </Bas>
              ))}
            </ScrollView>
          )}
        </>
      )}
    </View>
  );
}

function SohbetSatiri({ x, onPress, marka }: { x: SohbetOzet; onPress: () => void; marka?: boolean }) {
  const R = useRenk();
  const yeni = x.okunmamis > 0;
  return (
    <Bas onPress={onPress} style={[s.satir, yeni && { backgroundColor: R.vurguYumusak }, marka && { borderBottomWidth: 1, borderBottomColor: R.ince }]} hoverRenk={R.hover} rol="link" etiket={`${adGoster(x.kisi)} ile sohbet`}>
      <Avatar yazar={x.kisi} boyut={52} />
      <View style={{ flex: 1, gap: 3, minWidth: 0 }}>
        <View style={s.satirUst}>
          <View style={s.adKutu}>
            <Text numberOfLines={1} style={[s.ad, { color: R.murekkep }]}>{adGoster(x.kisi)}</Text>
            <AdRozeti y={x.kisi} />
            {marka && (
              <View style={[s.sabitCip, { backgroundColor: R.vurguYumusak }]}>
                <Text style={[s.sabitCipYazi, { color: R.vurgu }]}>sabit</Text>
              </View>
            )}
          </View>
          {!!x.zaman && <Text style={[s.zaman, { color: yeni ? R.vurgu : R.soluk }, yeni && { fontFamily: yazi.kalin }]}>{C.zamanOnce(x.zaman)}</Text>}
        </View>
        <View style={s.satirUst}>
          {marka && x.yaziyor ? (
            <Text numberOfLines={1} style={[s.onizleme, { color: R.vurgu, fontFamily: yazi.orta }]}>yazıyor…</Text>
          ) : marka && !x.son ? (
            <Text numberOfLines={1} style={[s.onizleme, { color: R.soluk }]}>Ne yazacağını bilemedin mi? Bana yaz.</Text>
          ) : x.giden ? (
            <View style={s.bekliyor}>
              <Ikon ad="saat" boyut={13} renk={R.soluk} kalinlik={2.2} />
              <Text numberOfLines={1} style={[s.onizleme, { color: R.soluk }]}>İstek gönderildi · bekliyor</Text>
            </View>
          ) : (
            <Text numberOfLines={1} style={[s.onizleme, { color: yeni ? R.murekkep : R.soluk }, yeni && { fontFamily: yazi.orta }]}>
              {x.son ? `${x.son.ben ? 'Sen: ' : ''}${x.son.metin}` : 'Sohbet açıldı. İlk sen yaz.'}
            </Text>
          )}
          {yeni && (
            <View style={[s.okunmamis, { backgroundColor: R.vurgu }]}>
              <Text style={s.okunmamisYazi}>{x.okunmamis > 9 ? '9+' : x.okunmamis}</Text>
            </View>
          )}
        </View>
      </View>
    </Bas>
  );
}

function BosEkran({ yuz, baslik, alt, dugme, onPress }: { yuz: string; baslik: string; alt: string; dugme?: string; onPress?: () => void }) {
  const R = useRenk();
  return (
    <View style={s.bos}>
      <YuzBalon ad={yuz} boyut={76} />
      <Text style={[s.bosBaslik, { color: R.murekkep }]}>{baslik}</Text>
      <Text style={[s.bosAlt, { color: R.soluk }]}>{alt}</Text>
      {!!dugme && <Dugme yazi={dugme} tur="acik" onPress={onPress} style={{ marginTop: 10 }} />}
    </View>
  );
}

// ---------------- Sohbet ekranı ----------------
export function Sohbet({ id, geri }: { id: string; geri: () => void }) {
  const R = useRenk();
  const c = useCanli();
  const klavye = useKlavye();
  const altPay = useYazmaAltPayi(klavye); // telefonda rıhtımın üstünde dur, klavyede 0
  const sondaMi = useRef(true); // okuyan en altta mı (klavye açılınca / alan küçülünce son mesaj görünür kalsın)
  const [bilgi, bilgiAyarla] = useState<SohbetBilgi | null>(null);
  const [mesajlar, mesajlarAyarla] = useState<Mesaj[]>([]);
  const [karsiOkundu, karsiOkunduAyarla] = useState<number | null>(null);
  const [imlec, imlecAyarla] = useState<number | null>(null);
  const [durum, durumAyarla] = useState<'yukleniyor' | 'hazir' | 'yok' | 'giris'>('yukleniyor');
  const [metin, metinAyarla] = useState('');
  const [uyari, uyariAyarla] = useState('');
  const eng = useEngel(metin, 'mesaj');
  const [islem, islemAyarla] = useState(false);
  const [menu, menuAyarla] = useState(false);
  const [yaziyor, yaziyorAyarla] = useState(false);
  const [silOnay, silOnayAyarla] = useState(false);
  const [girisBoy, girisBoyAyarla] = useState(22);
  const markaSohbet = id === C.MARKA_SOHBET;
  const yaziyorRef = useRef(false);
  yaziyorRef.current = yaziyor;
  const liste = useRef<ScrollView>(null);
  const giris = useRef<TextInput>(null);
  const son = useRef(0);
  const okunanSon = useRef(0);
  const sonaKaydir = useRef(true);

  const okundu = useCallback(
    (l: Mesaj[]) => {
      const sonKarsi = Math.max(0, ...l.filter((m) => !m.ben).map((m) => m.zaman));
      if (!sonKarsi || sonKarsi <= okunanSon.current || !gorunur()) return;
      okunanSon.current = sonKarsi;
      C.sohbetIslem(id, 'okundu').then((r) => r.ok && typeof r.veri?.okunmamis === 'number' && c.mesajSayiAyarla(r.veri.okunmamis));
    },
    [id],
  );

  const ilkYukle = useCallback(async () => {
    const r = await C.sohbetGetir(id);
    if (!r.ok) return durumAyarla(r.durum === 401 || r.durum === 403 ? 'giris' : 'yok');
    bilgiAyarla(r.veri.sohbet);
    mesajlarAyarla(r.veri.mesajlar);
    karsiOkunduAyarla(r.veri.karsiOkundu);
    imlecAyarla(r.veri.imlec);
    yaziyorAyarla(r.veri.yaziyor);
    son.current = Math.max(1, ...r.veri.mesajlar.map((m) => m.zaman));
    durumAyarla('hazir');
    okundu(r.veri.mesajlar);
  }, [id]);

  useEffect(() => {
    durumAyarla('yukleniyor');
    son.current = 0;
    okunanSon.current = 0;
    ilkYukle();
    // Markayla sohbette cevap beklenirken sık (1,5 sn), diğer zamanlarda 4 sn'de bir yoklama.
    let bitti = false;
    let t: ReturnType<typeof setTimeout>;
    const yokla = async () => {
      if (gorunur() && son.current) {
        const r = await C.sohbetGetir(id, { sonra: son.current });
        if (r.ok && !bitti) {
          bilgiAyarla(r.veri.sohbet);
          karsiOkunduAyarla(r.veri.karsiOkundu);
          yaziyorAyarla(r.veri.yaziyor);
          const yeni = r.veri.mesajlar;
          if (yeni.length) {
            son.current = Math.max(son.current, ...yeni.map((m) => m.zaman));
            mesajlarAyarla((l) => {
              const var_ = new Set(l.map((m) => m.id));
              return [...l, ...yeni.filter((m) => !var_.has(m.id))];
            });
            if (yeni.some((m) => !m.ben)) bildirimSesi();
            sonaKaydir.current = true;
            okundu(yeni);
          }
        }
      }
      if (!bitti) t = setTimeout(yokla, markaSohbet && yaziyorRef.current ? MARKA_YOKLAMA : YOKLAMA);
    };
    t = setTimeout(yokla, markaSohbet ? MARKA_YOKLAMA : YOKLAMA);
    return () => {
      bitti = true;
      clearTimeout(t);
    };
  }, [id]);

  const dahaEski = async () => {
    if (!imlec) return;
    sonaKaydir.current = false;
    const r = await C.sohbetGetir(id, { once: imlec });
    if (!r.ok) return;
    mesajlarAyarla((l) => [...r.veri.mesajlar, ...l]);
    imlecAyarla(r.veri.imlec);
  };

  const gonder = async () => {
    const m = metin.trim();
    if (!m || [...m].length > MESAJ_SINIR || !bilgi) return;
    uyariAyarla('');
    const gecici: Mesaj = { id: 'g' + Date.now(), ben: true, metin: m, zaman: Date.now(), gidiyor: true };
    sonaKaydir.current = true;
    mesajlarAyarla((l) => [...l, gecici]);
    metinAyarla('');
    const r = await C.mesajGonder(id, m);
    if (!r.ok) {
      mesajlarAyarla((l) => l.filter((x) => x.id !== gecici.id));
      metinAyarla(m);
      if (!eng.koy(r, m)) uyariAyarla(C.hataYazisi(r.hata, r.durum));
      return;
    }
    son.current = Math.max(son.current, r.veri.zaman);
    mesajlarAyarla((l) => l.map((x) => (x.id === gecici.id ? r.veri : x)));
    if (markaSohbet) {
      yaziyorAyarla(true);
      sonaKaydir.current = true;
    }
    setTimeout(() => giris.current?.focus(), 30);
  };
  const markaSil = async () => {
    silOnayAyarla(false);
    const r = await C.markaSohbetSil();
    if (!r.ok) return c.tost(C.hataYazisi(r.hata, r.durum));
    c.tost('Sohbet silindi');
    mesajlarAyarla([]);
    son.current = 1;
    geri();
  };

  const istekIslem = async (is: 'kabul' | 'sil') => {
    islemAyarla(true);
    const r = await C.sohbetIslem(id, is);
    islemAyarla(false);
    if (!r.ok) return c.tost(C.hataYazisi(r.hata, r.durum));
    if (is === 'sil') {
      c.tost('İstek silindi');
      return geri();
    }
    bilgiAyarla((b) => (b ? { ...b, durum: 'acik' } : b));
    c.tost('Sohbet açıldı');
    setTimeout(() => giris.current?.focus(), 200);
  };
  const engelle = async (bildirAyni: boolean) => {
    menuAyarla(false);
    const r = await C.sohbetIslem(id, 'engelle', bildirAyni);
    if (!r.ok) return c.tost(C.hataYazisi(r.hata, r.durum));
    c.tost(bildirAyni ? 'Engellendi ve bildirildi' : 'Engellendi');
    geri();
  };

  const kisi = bilgi?.kisi;
  const kalan = MESAJ_SINIR - harfSay(metin);
  return (
    <View style={{ flex: 1, backgroundColor: R.panel }}>
      <View style={[s.sohbetUst, { borderBottomColor: R.ince, backgroundColor: R.panel }]}>
        <Bas onPress={geri} etiket="Geri" style={s.ustDugme} hoverRenk={R.hover}>
          <Ikon ad="geri" boyut={21} renk={R.murekkep} />
        </Bas>
        {kisi ? (
          <Bas onPress={() => c.git({ tur: 'profil', ad: kisi.ad })} style={s.sohbetKisi} rol="link" etiket={`${kisi.ad} profili`}>
            <Avatar yazar={kisi} boyut={36} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={s.adKutu}>
                <Text numberOfLines={1} style={[s.sohbetAd, { color: R.murekkep }]}>{adGoster(kisi)}</Text>
                <AdRozeti y={kisi} boyut={15} />
              </View>
              {markaSohbet && yaziyor ? (
                <Text numberOfLines={1} style={[s.sohbetAlt, { color: R.vurgu, fontFamily: yazi.orta }]}>yazıyor…</Text>
              ) : (
                <Text numberOfLines={1} style={[s.sohbetAlt, { color: R.soluk }]}>{markaSohbet ? 'yapay zekâ · hemen cevap verir' : bilgi?.durum === 'istek' ? (bilgi.giden ? 'İstek gönderildi' : 'Mesaj isteği') : `@${kisi.ad}`}</Text>
              )}
            </View>
          </Bas>
        ) : (
          <View style={{ flex: 1 }} />
        )}
        {bilgi && bilgi.durum !== 'engelli' && (
          <Bas onPress={() => menuAyarla(true)} etiket="Seçenekler" style={s.ustDugme} hoverRenk={R.hover}>
            <Ikon ad="nokta" boyut={20} renk={R.murekkep} />
          </Bas>
        )}
      </View>

      {durum === 'yukleniyor' ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={R.vurgu} />
      ) : durum === 'giris' ? (
        <BosEkran yuz="utangac" baslik="Önce giriş yap." alt={markaSohbet ? 'Yazsam mı? ile özelden yazışmak için giriş yap.' : 'Mesajların için giriş yap.'} dugme="Giriş yap" onPress={() => c.girisIste(markaSohbet ? 'Yazsam mı? ile yazışmak için giriş yap' : 'Mesajlar için giriş yap', () => ilkYukle())} />
      ) : durum === 'yok' ? (
        <BosEkran yuz="uzgun" baslik="Bu sohbet artık yok." alt="Mesajlarına dönebilirsin." dugme="Mesajlar" onPress={() => c.git({ tur: 'mesajlar' })} />
      ) : (
        <ScrollView
          ref={liste}
          style={{ flex: 1 }}
          contentContainerStyle={s.akis}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={100}
          onScroll={(e) => {
            const { contentOffset: o, contentSize: b, layoutMeasurement: g } = e.nativeEvent;
            sondaMi.current = o.y + g.height >= b.height - 80;
          }}
          onContentSizeChange={() => sonaKaydir.current && liste.current?.scrollToEnd({ animated: false })}
          // Klavye açılıp alan küçülünce (ya da ekran döndüğünde) son mesaj klavyenin arkasında kalmasın.
          onLayout={() => (sonaKaydir.current || sondaMi.current) && liste.current?.scrollToEnd({ animated: false })}
        >
          {imlec ? (
            <Bas onPress={dahaEski} style={[s.dahaEski, { borderColor: R.ince }]} hoverRenk={R.hover}>
              <Text style={[s.dahaEskiYazi, { color: R.soluk }]}>Daha eski mesajlar</Text>
            </Bas>
          ) : (
            kisi &&
            (markaSohbet ? (
              <View style={s.tanitim}>
                <Avatar yazar={kisi} boyut={76} />
                <View style={[s.adKutu, { marginTop: 8 }]}>
                  <Text style={[s.tanitimAd, { color: R.murekkep, marginTop: 0 }]}>Yazsam mı?</Text>
                  <Rozet boyut={19} />
                </View>
                <Text style={[s.tanitimAlt, { color: R.soluk, textAlign: 'center', maxWidth: 320 }]}>Yapay zekâ karakteri. Yazmadan önce danış, dert yan, ya da sadece laflayalım. Sohbet yalnız ikimizin; istediğin an silebilirsin.</Text>
                {mesajlar.length === 0 && (
                  <View style={s.oneriler}>
                    {['Ona ne yazsam bilemedim', 'Görüldü attı, ne demek?', 'Bugün canım sıkkın'].map((o) => (
                      <Bas key={o} onPress={() => { metinAyarla(o); setTimeout(() => giris.current?.focus(), 30); }} style={[s.baslangic, { borderColor: R.ince, backgroundColor: R.ust }]} hoverRenk={R.vurguYumusak}>
                        <Text style={[s.baslangicYazi, { color: R.murekkep }]}>{o}</Text>
                      </Bas>
                    ))}
                  </View>
                )}
              </View>
            ) : (
              <View style={s.tanitim}>
                <Avatar yazar={kisi} boyut={76} />
                <Text style={[s.tanitimAd, { color: R.murekkep }]}>{adGoster(kisi)}</Text>
                <Text style={[s.tanitimAlt, { color: R.soluk }]}>@{kisi.ad} · Yazsam mı? Canlı</Text>
                <Dugme yazi="Profili gör" kucuk tur="cizgi" onPress={() => c.git({ tur: 'profil', ad: kisi.ad })} style={{ marginTop: 6 }} />
              </View>
            ))
          )}
          <Balonlar mesajlar={mesajlar} karsiOkundu={karsiOkundu} R={R} />
          {markaSohbet && yaziyor && <YaziyorBalon R={R} />}
        </ScrollView>
      )}

      {bilgi && durum === 'hazir' && (
        <View style={[s.alt, { borderTopColor: R.ince, backgroundColor: R.panel }, altPay ? { paddingBottom: 12 + altPay } : null]}>
          {bilgi.durum === 'acik' ? (
            <>
              <EngelAlani engel={eng.engel} ipucu={eng.ipucu} />
              {!!uyari && (
                <View style={[s.uyari, { backgroundColor: R.gece ? 'rgba(255,92,108,0.12)' : 'rgba(215,38,61,0.07)' }]}>
                  <Ikon ad="engel" boyut={15} renk={R.kalem} kalinlik={2.3} />
                  <Text style={[s.uyariYazi, { color: R.kalem }]}>{uyari}</Text>
                </View>
              )}
              <View style={s.yazSatir}>
                <View style={[s.giris, { backgroundColor: R.ust, borderColor: R.ince }]}>
                  <TextInput
                    ref={giris}
                    value={metin}
                    onChangeText={(t) => {
                      metinAyarla(t.slice(0, MESAJ_SINIR + 50));
                      if (uyari) uyariAyarla('');
                    }}
                    onFocus={() => setTimeout(() => liste.current?.scrollToEnd({ animated: true }), 350)}
                    placeholder={markaSohbet ? 'Yazsam mı?’ya yaz…' : 'Mesaj yaz…'}
                    placeholderTextColor={R.soluk}
                    multiline
                    numberOfLines={1}
                    onContentSizeChange={(e) => girisBoyAyarla(Math.min(110, Math.max(22, Math.ceil(e.nativeEvent.contentSize.height))))}
                    style={[s.girisYazi, { color: R.murekkep, height: metin ? girisBoy : 22 }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                    onKeyPress={(e: any) => {
                      if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
                        e.preventDefault?.();
                        gonder();
                      }
                    }}
                  />
                  {!!metin && <View style={s.halka}><KarakterHalkasi uzunluk={harfSay(metin)} sinir={MESAJ_SINIR} /></View>}
                </View>
                <Bas onPress={gonder} devre={!metin.trim() || kalan < 0} etiket="Gönder" style={[s.gonder, { backgroundColor: R.vurgu }]}>
                  <Ikon ad="yukari" boyut={18} renk="#fff" kalinlik={2.6} />
                </Bas>
              </View>
            </>
          ) : bilgi.durum === 'istek' && !bilgi.giden ? (
            <View style={s.istekPanel}>
              <Text style={[s.istekBaslik, { color: R.murekkep }]}>
                <Text style={{ fontFamily: yazi.kalin }}>{kisi ? adGoster(kisi) : ''}</Text> sana yazmak istiyor.
              </Text>
              <Text style={[s.istekAlt, { color: R.soluk }]}>Kabul edersen sohbet açılır. Etmezsen haberi olmaz.</Text>
              <View style={s.istekDugmeler}>
                <Dugme yazi="Engelle" kucuk tur="cizgi" devre={islem} onPress={() => engelle(false)} style={{ flex: 1 }} />
                <Dugme yazi="Sil" kucuk tur="cizgi" devre={islem} onPress={() => istekIslem('sil')} style={{ flex: 1 }} />
                <Dugme yazi="Kabul et" kucuk tur="acik" devre={islem} onPress={() => istekIslem('kabul')} style={{ flex: 1.3 }} />
              </View>
            </View>
          ) : bilgi.durum === 'istek' ? (
            <View style={[s.bilgiKutu, { backgroundColor: R.vurguYumusak }]}>
              <Ikon ad="saat" boyut={16} renk={R.vurgu} kalinlik={2.3} />
              <Text style={[s.bilgiYazi, { color: R.vurgu }]}>İstek gönderildi. Kabul edince sohbet açılır.</Text>
            </View>
          ) : (
            <View style={[s.bilgiKutu, { backgroundColor: R.ust }]}>
              <Ikon ad="engel" boyut={16} renk={R.soluk} kalinlik={2.3} />
              <Text style={[s.bilgiYazi, { color: R.soluk }]}>Bu sohbet kapalı.</Text>
            </View>
          )}
        </View>
      )}

      <Pencere acik={menu && markaSohbet} kapat={() => { menuAyarla(false); silOnayAyarla(false); }} genislik={400} baslik="Yazsam mı?">
        {silOnay ? (
          <View style={s.silKutu}>
            <Text style={[s.silBaslik, { color: R.murekkep }]}>Sohbet silinsin mi?</Text>
            <Text style={[s.silAlt, { color: R.soluk }]}>Bütün mesajlar iki taraftan da silinir. Geri alınamaz.</Text>
            <View style={{ flexDirection: 'row', gap: 10, alignSelf: 'stretch', marginTop: 12 }}>
              <Dugme yazi="Vazgeç" tur="cizgi" onPress={() => silOnayAyarla(false)} style={{ flex: 1 }} />
              <Dugme yazi="Sil" onPress={() => { menuAyarla(false); markaSil(); }} style={{ flex: 1, backgroundColor: R.kalem, borderColor: R.kalem }} />
            </View>
          </View>
        ) : (
          <View style={{ paddingBottom: 14 }}>
            <Bas onPress={() => { menuAyarla(false); c.git({ tur: 'profil', ad: 'yazsammi' }); }} style={[s.menuSatir, { borderBottomColor: R.ince }]} hoverRenk={R.hover}>
              <Ikon ad="kisi" boyut={19} renk={R.murekkep} />
              <Text style={[s.menuYazi, { color: R.murekkep }]}>Profili gör</Text>
            </Bas>
            <Bas onPress={() => silOnayAyarla(true)} style={[s.menuSatir, { borderBottomColor: R.ince }]} hoverRenk={R.hover}>
              <Ikon ad="cop" boyut={19} renk={R.kalem} />
              <View style={{ flex: 1 }}>
                <Text style={[s.menuYazi, { color: R.kalem }]}>Sohbeti sil</Text>
                <Text style={[s.menuAlt, { color: R.soluk }]}>Bütün mesajlar silinir</Text>
              </View>
            </Bas>
          </View>
        )}
      </Pencere>
      <Pencere acik={menu && !markaSohbet} kapat={() => menuAyarla(false)} genislik={400} baslik={kisi ? adGoster(kisi) : 'Sohbet'}>
        <View style={{ paddingBottom: 14 }}>
          {kisi && (
            <Bas onPress={() => { menuAyarla(false); c.git({ tur: 'profil', ad: kisi.ad }); }} style={[s.menuSatir, { borderBottomColor: R.ince }]} hoverRenk={R.hover}>
              <Ikon ad="kisi" boyut={19} renk={R.murekkep} />
              <Text style={[s.menuYazi, { color: R.murekkep }]}>Profili gör</Text>
            </Bas>
          )}
          <Bas onPress={() => engelle(true)} style={[s.menuSatir, { borderBottomColor: R.ince }]} hoverRenk={R.hover}>
            <Ikon ad="bayrak" boyut={19} renk={R.kalem} />
            <View style={{ flex: 1 }}>
              <Text style={[s.menuYazi, { color: R.kalem }]}>Engelle ve bildir</Text>
              <Text style={[s.menuAlt, { color: R.soluk }]}>Son 50 mesaj incelemeye gider</Text>
            </View>
          </Bas>
          <Bas onPress={() => engelle(false)} style={[s.menuSatir, { borderBottomColor: R.ince }]} hoverRenk={R.hover}>
            <Ikon ad="engel" boyut={19} renk={R.murekkep} />
            <View style={{ flex: 1 }}>
              <Text style={[s.menuYazi, { color: R.murekkep }]}>Engelle</Text>
              <Text style={[s.menuAlt, { color: R.soluk }]}>Sana yazamaz, takip de kalkar</Text>
            </View>
          </Bas>
        </View>
      </Pencere>
    </View>
  );
}

// "yazıyor…" balonu: üç nokta sırayla parlar (sitede CSS, uygulamada sabit).
const NOKTA_CSS = [{ '0%': { opacity: 0.25 }, '30%': { opacity: 1 }, '60%': { opacity: 0.25 }, '100%': { opacity: 0.25 } }];
function YaziyorBalon({ R }: { R: Renk }) {
  const onun = R.gece ? '#2A2342' : '#EFEAF8';
  return (
    <View style={{ alignItems: 'flex-start', marginTop: 10 }} accessibilityLabel="Yazsam mı? yazıyor">
      <View style={[s.balon, s.yaziyor, { backgroundColor: onun }]}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[s.yaziyorNokta, { backgroundColor: R.soluk }, Platform.OS === 'web' ? ({ animationKeyframes: NOKTA_CSS, animationDuration: '1200ms', animationIterationCount: 'infinite', animationDelay: `${i * 180}ms` } as any) : { opacity: 0.4 + i * 0.2 }]} />
        ))}
      </View>
    </View>
  );
}

// Balonlar: aynı kişinin art arda mesajları gruplanır; gün ayracı; saat ve ✓/✓✓ balonun içinde.
function Balonlar({ mesajlar, karsiOkundu, R }: { mesajlar: Mesaj[]; karsiOkundu: number | null; R: Renk }) {
  const onun = R.gece ? '#2A2342' : '#EFEAF8';
  return (
    <View>
      {mesajlar.map((m, i) => {
        const once = mesajlar[i - 1];
        const sonra = mesajlar[i + 1];
        const yeniGun = !once || gunYaz(once.zaman) !== gunYaz(m.zaman);
        const oncekiAyni = !!once && !yeniGun && once.ben === m.ben && m.zaman - once.zaman < 5 * 60000;
        const sonrakiAyni = !!sonra && gunYaz(sonra.zaman) === gunYaz(m.zaman) && sonra.ben === m.ben && sonra.zaman - m.zaman < 5 * 60000;
        const okundu = m.ben && karsiOkundu != null && karsiOkundu >= m.zaman;
        return (
          <View key={m.id}>
            {yeniGun && <Text style={[s.gun, { color: R.soluk, backgroundColor: R.gece ? 'rgba(255,255,255,0.06)' : 'rgba(29,24,48,0.05)' }]}>{gunYaz(m.zaman)}</Text>}
            <View style={{ alignItems: m.ben ? 'flex-end' : 'flex-start', marginTop: oncekiAyni ? 2 : 10 }}>
              <View
                style={[
                  s.balon,
                  { backgroundColor: m.ben ? R.vurgu : onun },
                  m.ben ? { borderTopRightRadius: oncekiAyni ? 6 : 20, borderBottomRightRadius: sonrakiAyni ? 6 : 20 } : { borderTopLeftRadius: oncekiAyni ? 6 : 20, borderBottomLeftRadius: sonrakiAyni ? 6 : 20 },
                  m.gidiyor && { opacity: 0.65 },
                ]}
              >
                <Text style={[s.balonYazi, { color: m.ben ? '#fff' : R.murekkep }]}>
                  {m.metin}
                  <Text style={s.balonBosluk}>{`   ${saatYaz(m.zaman)}${m.ben ? '     ' : ''}`}</Text>
                </Text>
                <View style={s.balonAlt}>
                  <Text style={[s.balonSaat, { color: m.ben ? 'rgba(255,255,255,0.75)' : R.soluk }]}>{saatYaz(m.zaman)}</Text>
                  {m.ben && (m.gidiyor ? <Ikon ad="saat" boyut={11} renk="rgba(255,255,255,0.75)" kalinlik={2.4} /> : <Ikon ad={okundu ? 'ciftTik' : 'tik'} boyut={14} renk={okundu ? '#9DF5D2' : 'rgba(255,255,255,0.75)'} kalinlik={2.4} />)}
                </View>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ---------------- Pencereler: ilk mesaj (istek) ve ayarlar ----------------
export function MesajPencereleri() {
  const c = useCanli();
  const p = c.pencere;
  return (
    <>
      <Pencere acik={p?.tur === 'istek'} kapat={c.pencereKapat} genislik={520}>
        {p?.tur === 'istek' && <IstekYazici kisi={p.kisi} yeniHesap={!!p.yeniHesap} />}
      </Pencere>
      <Pencere acik={p?.tur === 'mesajAyar'} kapat={c.pencereKapat} genislik={440} baslik="Mesaj ayarları">
        {p?.tur === 'mesajAyar' && <MesajAyarlari />}
      </Pencere>
    </>
  );
}

function IstekYazici({ kisi, yeniHesap }: { kisi: Yazar; yeniHesap: boolean }) {
  const R = useRenk();
  const c = useCanli();
  const [metin, metinAyarla] = useState('');
  const [bekliyor, bekliyorAyarla] = useState(false);
  const [hata, hataAyarla] = useState('');
  const eng = useEngel(metin, 'istek');
  const uzunluk = harfSay(metin);
  const kalan = ISTEK_SINIR - uzunluk;

  const gonder = async () => {
    const m = metin.trim();
    if (!m || kalan < 0 || bekliyor) return;
    bekliyorAyarla(true);
    hataAyarla('');
    const r = await C.istekGonder(kisi.uid, m);
    bekliyorAyarla(false);
    if (!r.ok) {
      if (r.hata === 'sohbet_var' && r.sohbet) {
        c.pencereKapat();
        return c.git({ tur: 'sohbet', id: r.sohbet });
      }
      if (eng.koy(r, m)) return;
      return hataAyarla(C.hataYazisi(r.hata, r.durum));
    }
    c.pencereKapat();
    c.tost('İstek gönderildi');
    c.git({ tur: 'sohbet', id: r.veri.sohbet });
  };

  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 8 }}>
      <View style={s.yaziciUst}>
        <Bas onPress={c.pencereKapat} style={s.vazgec}>
          <Text style={[s.vazgecYazi, { color: R.murekkep }]}>Vazgeç</Text>
        </Bas>
        <Text style={[s.yaziciBaslik, { color: R.murekkep }]}>Mesaj isteği</Text>
        <View style={{ width: 72 }} />
      </View>
      <View style={[s.alici, { borderColor: R.ince }]}>
        <Avatar yazar={kisi} boyut={46} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={[s.aliciAd, { color: R.murekkep }]}>{adGoster(kisi)}</Text>
          <Text numberOfLines={1} style={[s.aliciAlt, { color: R.soluk }]}>@{kisi.ad}</Text>
        </View>
        <View style={[s.cip, { backgroundColor: R.vurguYumusak }]}>
          <Ikon ad="tik" boyut={12} renk={R.vurgu} kalinlik={3} />
          <Text style={[s.cipYazi, { color: R.vurgu }]}>karşılıklı takip</Text>
        </View>
      </View>
      {yeniHesap ? (
        <View style={[s.bilgiKutu, { backgroundColor: R.ust, margin: 18 }]}>
          <Ikon ad="saat" boyut={16} renk={R.soluk} kalinlik={2.3} />
          <Text style={[s.bilgiYazi, { color: R.murekkep }]}>Yeni hesaplar ilk 3 gün mesaj isteği gönderemez. Biraz akışta takıl, sonra yaz.</Text>
        </View>
      ) : (
        <>
          <View style={s.istekGovde}>
            <TextInput
              value={metin}
              onChangeText={(t) => {
                metinAyarla(t.slice(0, ISTEK_SINIR + 30));
                if (hata) hataAyarla('');
              }}
              placeholder={`${adGoster(kisi)} için ilk mesajın…`}
              placeholderTextColor={R.soluk}
              multiline
              autoFocus
              style={[s.istekGiris, { color: R.murekkep }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
            />
            <Text style={[s.istekIpucu, { color: R.soluk }]}>Tek mesaj, istek olarak gider. Kabul ederse sohbet açılır.</Text>
          </View>
          <View style={{ marginTop: 10 }}><EngelAlani engel={eng.engel} ipucu={eng.ipucu} kenar={18} /></View>
          {!!hata && (
            <View style={[s.uyari, { backgroundColor: R.gece ? 'rgba(255,92,108,0.12)' : 'rgba(215,38,61,0.07)', marginHorizontal: 18, marginTop: 10 }]}>
              <Ikon ad="engel" boyut={15} renk={R.kalem} kalinlik={2.3} />
              <Text style={[s.uyariYazi, { color: R.kalem }]}>{hata}</Text>
            </View>
          )}
          <View style={s.yaziciAlt}>
            <Text style={[s.kuralKisa, { color: R.soluk }]}>Tehdit, cinsel içerik ve kişisel bilgi gitmez.</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <KarakterHalkasi uzunluk={uzunluk} sinir={ISTEK_SINIR} />
              <Dugme yazi={bekliyor ? 'Gönderiliyor…' : 'Gönder'} tur="acik" kucuk ikon="paylas" devre={!metin.trim() || kalan < 0 || bekliyor} onPress={gonder} />
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

function MesajAyarlari() {
  const R = useRenk();
  const c = useCanli();
  const [a, aAyarla] = useState<MesajAyar | null>(null);
  useEffect(() => {
    C.ayarGetir().then((r) => (r.ok ? aAyarla(r.veri) : c.tost(C.hataYazisi(r.hata, r.durum))));
  }, []);
  const degis = async (d: Partial<MesajAyar>) => {
    if (!a) return;
    const once = a;
    aAyarla({ ...a, ...d });
    const r = await C.ayarKaydet(d);
    if (!r.ok) {
      aAyarla(once);
      return c.tost(C.hataYazisi(r.hata, r.durum));
    }
    aAyarla(r.veri);
  };
  if (!a) return <ActivityIndicator style={{ marginVertical: 40 }} color={R.vurgu} />;
  const Secim = ({ acik, baslik, alt, onPress }: { acik: boolean; baslik: string; alt: string; onPress: () => void }) => (
    <Bas onPress={onPress} style={[s.secim, { borderColor: acik ? R.vurgu : R.ince, backgroundColor: acik ? R.vurguYumusak : 'transparent' }]} rol="button" etiket={baslik}>
      <View style={[s.radyo, { borderColor: acik ? R.vurgu : R.cizgi }]}>{acik && <View style={[s.radyoIc, { backgroundColor: R.vurgu }]} />}</View>
      <View style={{ flex: 1 }}>
        <Text style={[s.secimBaslik, { color: R.murekkep }]}>{baslik}</Text>
        <Text style={[s.secimAlt, { color: R.soluk }]}>{alt}</Text>
      </View>
    </Bas>
  );
  return (
    <View style={s.ayar}>
      <Text style={[s.ayarBaslik, { color: R.soluk }]}>Mesaj al</Text>
      <Secim acik={a.mesajAl === 'takip'} baslik="Karşılıklı takip" alt="Birbirinizi takip ediyorsanız istek gönderebilir." onPress={() => degis({ mesajAl: 'takip' })} />
      <Secim acik={a.mesajAl === 'kimse'} baslik="Kimseden" alt="Yeni istek gelmez. Açık sohbetler sürer." onPress={() => degis({ mesajAl: 'kimse' })} />
      <View style={[s.ayrac, { backgroundColor: R.ince }]} />
      <Bas onPress={() => degis({ okunduGoster: !a.okunduGoster })} style={s.anahtarSatir} rol="button" etiket="Okundu bilgisi">
        <View style={{ flex: 1 }}>
          <Text style={[s.secimBaslik, { color: R.murekkep }]}>Okundu bilgisi</Text>
          <Text style={[s.secimAlt, { color: R.soluk }]}>Kapatırsan sen de başkalarınınkini göremezsin.</Text>
        </View>
        <View style={[s.anahtar, { backgroundColor: a.okunduGoster ? R.vurgu : R.cizgi }]}>
          <View style={[s.anahtarTop, { transform: [{ translateX: a.okunduGoster ? 20 : 0 }] }]} />
        </View>
      </Bas>
    </View>
  );
}

const s = StyleSheet.create({
  ustDugme: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  sekmeler: { flexDirection: 'row', borderBottomWidth: 1 },
  sekme: { flex: 1, alignItems: 'center', justifyContent: 'center', height: 48 },
  sekmeIc: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sekmeYazi: { fontFamily: yazi.orta, fontSize: 15 },
  sekmeSayi: { minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center' },
  sekmeSayiYazi: { color: '#fff', fontFamily: yazi.kalin, fontSize: 10.5 },
  sekmeCizgi: { position: 'absolute', bottom: -1, height: 3, width: 64, borderRadius: 2 },
  satir: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 11 },
  satirUst: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  ad: { fontFamily: yazi.kalin, fontSize: 15.5, letterSpacing: -0.2, flexShrink: 1 },
  zaman: { fontFamily: yazi.normal, fontSize: 13 },
  onizleme: { fontFamily: yazi.normal, fontSize: 14.5, flex: 1 },
  bekliyor: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 },
  okunmamis: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  okunmamisYazi: { color: '#fff', fontFamily: yazi.kalin, fontSize: 11 },
  istekNot: { fontFamily: yazi.normal, fontSize: 13, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  istek: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  istekBalon: { alignSelf: 'flex-start', borderRadius: 16, borderTopLeftRadius: 6, paddingHorizontal: 12, paddingVertical: 8, maxWidth: '100%' },
  istekMetin: { fontFamily: yazi.normal, fontSize: 14.5, lineHeight: 20 },
  istekDugmeler: { flexDirection: 'row', gap: 8, marginTop: 6 },
  bos: { alignItems: 'center', gap: 6, paddingVertical: 60, paddingHorizontal: 30 },
  bosBaslik: { fontFamily: yazi.kalin, fontSize: 21, marginTop: 8, textAlign: 'center' },
  bosAlt: { fontFamily: yazi.normal, fontSize: 15, textAlign: 'center', lineHeight: 21, maxWidth: 340 },

  sohbetUst: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, height: 60, borderBottomWidth: 1 },
  sohbetKisi: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 0, paddingVertical: 4 },
  sohbetAd: { fontFamily: yazi.kalin, fontSize: 16, letterSpacing: -0.2 },
  sohbetAlt: { fontFamily: yazi.normal, fontSize: 12.5, marginTop: -1 },
  akis: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 16, flexGrow: 1, justifyContent: 'flex-end' },
  tanitim: { alignItems: 'center', gap: 3, paddingTop: 18, paddingBottom: 22 },
  tanitimAd: { fontFamily: yazi.kalin, fontSize: 20, letterSpacing: -0.4, marginTop: 8 },
  tanitimAlt: { fontFamily: yazi.normal, fontSize: 13.5 },
  dahaEski: { alignSelf: 'center', borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6, marginVertical: 10 },
  dahaEskiYazi: { fontFamily: yazi.orta, fontSize: 13 },
  gun: { alignSelf: 'center', fontFamily: yazi.orta, fontSize: 11.5, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 3, overflow: 'hidden', marginTop: 14, marginBottom: 2 },
  balon: { maxWidth: '80%', borderRadius: 20, paddingHorizontal: 13, paddingTop: 8, paddingBottom: 8 },
  balonYazi: { fontFamily: yazi.normal, fontSize: 15.5, lineHeight: 21 },
  balonBosluk: { fontFamily: yazi.normal, fontSize: 10.5, color: 'transparent' }, // saat ve tik için yer (görünmez kopya)
  balonAlt: { position: 'absolute', right: 10, bottom: 5, flexDirection: 'row', alignItems: 'center', gap: 3 },
  balonSaat: { fontFamily: yazi.normal, fontSize: 10.5 },
  alt: { borderTopWidth: 1, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 12, gap: 8 },
  yazSatir: { flexDirection: 'row', alignItems: 'flex-end', gap: 9 },
  giris: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 22, borderWidth: 1, paddingHorizontal: 16, minHeight: 44 },
  girisYazi: { flex: 1, fontFamily: yazi.normal, fontSize: 15.5, lineHeight: 21, marginVertical: 11, padding: 0, maxHeight: 110 },
  halka: { marginLeft: 6, marginRight: -8, alignSelf: 'flex-end', marginBottom: 9 },
  gonder: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  uyari: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  uyariYazi: { fontFamily: yazi.orta, fontSize: 13.5, flex: 1 },
  istekPanel: { gap: 4, paddingHorizontal: 4, paddingTop: 2 },
  istekBaslik: { fontFamily: yazi.normal, fontSize: 15.5, textAlign: 'center' },
  istekAlt: { fontFamily: yazi.normal, fontSize: 13, textAlign: 'center' },
  bilgiKutu: { flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  bilgiYazi: { fontFamily: yazi.orta, fontSize: 14, flex: 1, lineHeight: 19 },
  menuSatir: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 22, paddingVertical: 14, borderBottomWidth: 1 },
  menuYazi: { fontFamily: yazi.orta, fontSize: 15.5 },
  menuAlt: { fontFamily: yazi.normal, fontSize: 12.5, marginTop: 1 },

  yaziciUst: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10 },
  vazgec: { paddingVertical: 8, paddingHorizontal: 8, minWidth: 72 },
  vazgecYazi: { fontFamily: yazi.orta, fontSize: 15 },
  yaziciBaslik: { fontFamily: yazi.kalin, fontSize: 16.5 },
  alici: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingBottom: 14, borderBottomWidth: 1 },
  aliciAd: { fontFamily: yazi.kalin, fontSize: 16 },
  aliciAlt: { fontFamily: yazi.normal, fontSize: 13.5 },
  cip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  cipYazi: { fontFamily: yazi.orta, fontSize: 12 },
  istekGovde: { paddingHorizontal: 18, paddingTop: 12, gap: 6 },
  istekGiris: { fontFamily: yazi.normal, fontSize: 18, lineHeight: 25, minHeight: 104, textAlignVertical: 'top' },
  istekIpucu: { fontFamily: yazi.normal, fontSize: 12.5 },
  karar: { borderRadius: 999, paddingHorizontal: 11, paddingVertical: 4 },
  kararYazi: { color: '#fff', fontFamily: yazi.kalin, fontSize: 13.5 },
  hisler: { flexDirection: 'row', gap: 14 },
  hisAd: { fontFamily: yazi.orta, fontSize: 12 },
  hisSayi: { fontFamily: yazi.kalin, fontSize: 12.5, fontVariant: ['tabular-nums'] },
  hisCizgi: { height: 5, borderRadius: 3, overflow: 'hidden' },
  hisDolu: { height: 5, borderRadius: 3 },
  ilkUc: { fontFamily: yazi.normal, fontSize: 14.5, lineHeight: 20, fontStyle: 'italic' },
  kullanYazi: { fontFamily: yazi.kalin, fontSize: 14 },
  yaziciAlt: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14, gap: 12 },
  kuralKisa: { fontFamily: yazi.normal, fontSize: 12.5, flexShrink: 1 },

  adKutu: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1, minWidth: 0 },
  sabitCip: { borderRadius: 999, paddingHorizontal: 7, paddingVertical: 1, marginLeft: 2 },
  sabitCipYazi: { fontFamily: yazi.kalin, fontSize: 10.5 },
  yaziyor: { flexDirection: 'row', gap: 5, alignItems: 'center', paddingVertical: 13, paddingHorizontal: 15 },
  yaziyorNokta: { width: 7, height: 7, borderRadius: 4 },
  oneriler: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 14, paddingHorizontal: 8 },
  baslangic: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 8 },
  baslangicYazi: { fontFamily: yazi.orta, fontSize: 13.5 },
  silKutu: { alignItems: 'center', gap: 6, padding: 24 },
  silBaslik: { fontFamily: yazi.kalin, fontSize: 20, letterSpacing: -0.4, textAlign: 'center' },
  silAlt: { fontFamily: yazi.normal, fontSize: 14.5, textAlign: 'center' },
  ayar: { padding: 20, gap: 10 },
  ayarBaslik: { fontFamily: yazi.kalin, fontSize: 12.5, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 },
  secim: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12 },
  radyo: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radyoIc: { width: 10, height: 10, borderRadius: 5 },
  secimBaslik: { fontFamily: yazi.kalin, fontSize: 15.5 },
  secimAlt: { fontFamily: yazi.normal, fontSize: 13, marginTop: 1, lineHeight: 18 },
  ayrac: { height: 1, marginVertical: 8 },
  anahtarSatir: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 6 },
  anahtar: { width: 46, height: 26, borderRadius: 13, padding: 3, justifyContent: 'center' },
  anahtarTop: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
});
