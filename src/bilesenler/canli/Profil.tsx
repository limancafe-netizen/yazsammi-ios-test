// Profil — "Balon Kimliği" (Onur 08.10 onayı; taslak plan/23_MENU_PROFIL_TASARIM/profil_a.html + profil_a.js + profil.js + profil.css).
// Kapak yerine dönem paletinden DUVAR, yuvarlak fotoğraf yerine kişinin BALONU (şekil + renk + bugünkü yüz), sayılar üç konuşma
// balonunda (yazdı · okuyan · bağ = karşılıklı takip), rozet rafı (yalnız gerçek rozetler + boş "Yakında" yuvaları), Balonları /
// Cevapları / Beğendikleri sekmeleri. Kendi profilinde "Balonunu düzenle" (BalonDuzenle.tsx) ve "Duvarı değiştir".
// Marka: dönem kapağı + el yazısı, onay rozeti. Kurucu: altın kapak + altın amblem + "kurucu" etiketi; balon/duvar düzenleme yok.
// Kurucu başkasının profilinde ⋯ → sustur / engelle. Markanın profilinde "Mesaj" → özel sohbet.
// Üyede "Mesaj" hep görünür; karşılıklı takip yoksa dokununca sebebi + tek dokunuşla "Takip et" çıkar.
// Genişlik ≥ 900 (bilgisayar): üstte geniş kimlik paneli, altta solda rozet rafı + balon kimliği, sağda sekmeler + iki sütun.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Animated, Easing, Platform, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { yazi } from '@/tema/tema';
import * as C from '@/canli';
import type { BalonKimlik, Gonderi, MesajKapi, Profil as ProfilTip, ProfilCevap, RafOge } from '@/canli';
import { DONEM, KURUCU_ALTIN, karistir, saydam } from '@/tema/donem';
import { Avatar, Bas, DostCerceve, Dugme, Ikon, KurucuDostEtiketi, KurucuEtiketi, KurucuRozet, Pencere, Rozet, YEREL_SURUCU, YzEtiketi, useRenk, type IkonAd, type Renk } from './ortak';
import { BalonAvatar, BalonIkon, balonBul, Duvar, DUVARLAR, RozetCizim, YUZ_ADLARI, type RafRozet, YuzBalon } from './balon';
import { BalonDuzenle, kimlikOzet, vurguYazi } from './BalonDuzenle';
import { KurucuSecenekleri } from './Kurucu';
import { useCanli } from './baglam';
import { Kart } from './Kart';
import { UstBaslik } from './Duzen';
import { Bos } from './Detay';
import { RozetRafi } from './rozetler';
import { AdRozeti } from './rozetGorsel';
import { PlusKarti } from '@/magaza/Magaza';

type Sekme = 'balon' | 'cevap' | 'begeni';
type EkSekme = { yukleniyor: boolean; hata: boolean; cevaplar: ProfilCevap[]; ids: string[]; imlec: string | null; yuklendi: boolean };
const BOS_EK: EkSekme = { yukleniyor: false, hata: false, cevaplar: [], ids: [], imlec: null, yuklendi: false };

const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
// Yılın okunuşuna göre ayrılma eki: 2026 (altı) → ’dan, 2027 (yedi) → ’den, 2030 (otuz) → ’dan.
const EK_BIRLER = ['', 'den', 'den', 'ten', 'ten', 'ten', 'dan', 'den', 'den', 'dan'];
const EK_ONLAR = ['den', 'dan', 'den', 'dan', 'tan', 'den', 'tan', 'ten', 'den', 'dan']; // 00 → (bin/iki bin) den
function katilimYazisi(ms?: number) {
  if (!ms) return '';
  const t = new Date(ms + 3 * 3600000); // Türkiye saati
  const yil = t.getUTCFullYear();
  const ek = yil % 10 ? EK_BIRLER[yil % 10] : EK_ONLAR[Math.floor(yil / 10) % 10];
  return `${AYLAR[t.getUTCMonth()]} ${yil}’${ek} beri yazıyor`;
}
// Tamlayan eki: ecemsi → ’nin, Kerem → ’in, Yazsam mı? → ’nın.
function tamlayan(ad: string) {
  const kok = ad.replace(/[^A-Za-zÇĞİÖŞÜçğıöşü]+$/, '');
  const unlu = kok.toLocaleLowerCase('tr').match(/[aeıioöuü]/g);
  const son = unlu ? unlu[unlu.length - 1] : 'e';
  const harf = { a: 'ı', ı: 'ı', e: 'i', i: 'i', o: 'u', u: 'u', ö: 'ü', ü: 'ü' }[son] ?? 'i';
  const sonHarf = kok.slice(-1).toLocaleLowerCase('tr');
  return /[aeıioöuü]/.test(sonHarf) ? `n${harf}n` : `${harf}n`;
}

// Balon hafifçe süzülür (taslak @keyframes yuzer). Sitede CSS animasyonu, uygulamada yerel sürücü.
const YUZER_CSS = [{ '0%': { transform: 'translateY(0px) rotate(0deg)' }, '50%': { transform: 'translateY(-4px) rotate(-2deg)' }, '100%': { transform: 'translateY(0px) rotate(0deg)' } }];
function Suzul({ children }: { children: ReactNode }) {
  if (Platform.OS === 'web') return <View style={{ animationKeyframes: YUZER_CSS, animationDuration: '3600ms', animationIterationCount: 'infinite', animationTimingFunction: 'ease-in-out' } as any}>{children}</View>;
  return <SuzulYerel>{children}</SuzulYerel>;
}
function SuzulYerel({ children }: { children: ReactNode }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const d = Animated.loop(Animated.sequence([Animated.timing(a, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: YEREL_SURUCU }), Animated.timing(a, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: YEREL_SURUCU })]));
    d.start();
    return () => d.stop();
  }, []);
  return <Animated.View style={{ transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }, { rotate: a.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-2deg'] }) }] }}>{children}</Animated.View>;
}

export function Profil({ ad, geri }: { ad: string; geri?: () => void }) {
  const R = useRenk();
  const c = useCanli();
  const [p, pAyarla] = useState<ProfilTip | null>(null);
  const [hata, hataAyarla] = useState(false);
  const [yonet, yonetAyarla] = useState(false);
  const [kilit, kilitAyarla] = useState(false); // "Birbirinizi takip edince mesajlaşabilirsiniz" penceresi
  const [duzen, duzenAyarla] = useState<null | 'balon' | 'duvar'>(null); // "Balonunu düzenle" penceresi (duvar: Duvar sırasına kaydırır)
  const [sekme, sekmeAyarla] = useState<Sekme>('balon');
  const [ek, ekAyarla] = useState<Record<'cevap' | 'begeni', EkSekme>>({ cevap: BOS_EK, begeni: BOS_EK });
  const [gen, genAyarla] = useState(0);
  const benim = !!c.uye && c.uye.ad === ad;

  const yukle = (sifirla: boolean) => {
    if (sifirla) {
      pAyarla(null);
      hataAyarla(false);
    }
    C.profilGetir(ad).then((r) => {
      if (!r.ok) return sifirla && hataAyarla(true);
      c.koy(r.veri.gonderiler);
      pAyarla(r.veri);
    });
  };
  useEffect(() => yukle(true), [ad, c.uye?.ad]);
  const ilkSurum = useRef(c.rozetSurum);
  useEffect(() => {
    if (c.rozetSurum !== ilkSurum.current) { ilkSurum.current = c.rozetSurum; yukle(false); } // kazanma anı kapandı: raf tazelenir
  }, [c.rozetSurum]);

  // Cevapları / Beğendikleri: sekme ilk açılışta (ya da hata sonrası yeniden dokununca) yüklenir; "Daha fazla" ile devam eder.
  const sekmeYukle = (t: 'cevap' | 'begeni', devam = false) => {
    const once = ek[t];
    if (once.yukleniyor) return;
    ekAyarla((x) => ({ ...x, [t]: { ...x[t], yukleniyor: true, hata: false } }));
    C.profilSekme(ad, t, devam ? once.imlec : null).then((r) => {
      if (!r.ok) return ekAyarla((x) => ({ ...x, [t]: { ...x[t], yukleniyor: false, hata: true } }));
      if (t === 'begeni') c.koy(r.veri.gonderiler);
      ekAyarla((x) => ({
        ...x,
        [t]: { yukleniyor: false, hata: false, yuklendi: true, imlec: r.veri.imlec, cevaplar: devam ? [...x[t].cevaplar, ...r.veri.cevaplar] : r.veri.cevaplar, ids: devam ? [...x[t].ids, ...r.veri.gonderiler.map((g) => g.id)] : r.veri.gonderiler.map((g) => g.id) },
      }));
    });
  };
  const sekmeSec = (t: Sekme) => {
    sekmeAyarla(t);
    if (t !== 'balon' && (!ek[t].yuklendi || ek[t].hata)) sekmeYukle(t);
  };

  const takip = (sonra?: (m: MesajKapi | null) => void) => {
    if (!p) return;
    const yap = () => {
      const once = p.uye.takipEdiyorum;
      pAyarla((x) => (x ? { ...x, uye: { ...x.uye, takipEdiyorum: !once, takipci: x.uye.takipci + (once ? -1 : 1) } } : x));
      C.takipEt(p.uye.uid).then((r) => {
        if (!r.ok) {
          pAyarla((x) => (x ? { ...x, uye: { ...x.uye, takipEdiyorum: once, takipci: x.uye.takipci + (once ? 1 : -1) } } : x));
          c.tost(C.hataYazisi(r.hata, r.durum));
        } else
          C.profilGetir(ad).then((y) => {
            if (!y.ok) return;
            pAyarla((x) => (x ? { ...x, uye: { ...x.uye, mesaj: y.veri.uye.mesaj, bag: y.veri.uye.bag } } : x)); // karşılıklı olduysa "Mesaj" açılır, bağ sayısı güncellenir
            sonra?.(y.veri.uye.mesaj ?? null);
          });
      });
    };
    if (c.girisIste('Takip etmek için giriş yap', yap)) yap();
  };

  const u = p?.uye;
  const mesajAc = () => {
    if (!u) return;
    const m = u.mesaj;
    if (m?.goster) return m.sohbet ? c.git({ tur: 'sohbet', id: m.sohbet }) : c.istekAc({ uid: u.uid, ad: u.ad, marka: u.marka, yuz: u.yuz, balon: u.balon }, !!m.yeniHesap);
    if (m?.neden) kilitAyarla(true);
  };
  const mesajBas = () => {
    if (c.girisIste('Mesaj için giriş yap', () => {})) mesajAc();
  };
  // Pencereden "Takip et": karşılıklı olduysa doğrudan mesaj isteği açılır; değilse pencere "o da seni takip edince" der.
  const kilitTakip = () =>
    takip((m) => {
      if (m?.goster && u) {
        kilitAyarla(false);
        if (m.sohbet) c.git({ tur: 'sohbet', id: m.sohbet });
        else c.istekAc({ uid: u.uid, ad: u.ad, marka: u.marka, yuz: u.yuz, balon: u.balon }, !!m.yeniHesap);
      }
    });
  const markaMesaj = () => {
    const ac = () => c.git({ tur: 'sohbet', id: C.MARKA_SOHBET });
    if (c.girisIste('Yazsam mı? ile yazışmak için giriş yap', ac)) ac();
  };
  const paylasProfil = () => {
    const hedef = u?.ad ?? ad;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const url = `${window.location.origin}/canli?profil=${encodeURIComponent(hedef)}`;
      const nav: any = window.navigator;
      if (nav.share && /Mobi|Android|iPhone/i.test(nav.userAgent)) {
        nav.share({ title: 'Yazsam mı? Canlı', text: `@${hedef} Yazsam mı?’da`, url }).catch(() => {});
        return;
      }
      (nav.clipboard?.writeText(url) ?? Promise.reject())
        .then(() => c.tost('Bağlantı kopyalandı'))
        .catch(() => c.tost(url));
      return;
    }
    Share.share({ message: `@${hedef} Yazsam mı?’da\nhttps://yazsammi.com/canli?profil=${encodeURIComponent(hedef)}` }).catch(() => {});
  };

  const neden = u?.mesaj?.neden;
  const kilitAlt = !u ? '' : neden === 'onun_takibi' ? `Sen takip ediyorsun. @${u.ad} de seni takip edince yazabilirsin.` : u.takipEdiyorBeni ? `@${u.ad} seni takip ediyor. Sen de takip et, hemen yaz.` : `Takip et; @${u.ad} de seni takip edince yazabilirsin.`;
  const yonetVar = !!c.uye?.kurucu && !!u && !benim && !u.ben && !u.marka;
  const kendi = !!u && (benim || u.ben);
  const sade = !!u && !u.marka && !u.kurucu; // balonlu üye (marka ve kurucu kendi kimliğini korur)
  const duzenleVar = kendi && sade;
  // Kendi profilinde kaydedilen seçim hemen görünsün diye oturumdaki üye önce gelir.
  const kimlik: BalonKimlik | null = !u ? null : benim && c.uye?.balon ? c.uye.balon : balonBul(u);
  const duvarAd = (benim && c.uye?.duvar) || u?.duvar || 'gece';
  const duvar = DUVARLAR[duvarAd] ? duvarAd : 'gece';
  const masa = gen >= 900;

  const ust = (
    <UstBaslik
      baslik={u?.marka ? 'Yazsam mı?' : kendi ? 'Ben' : ad}
      geri={geri}
      sag={
        yonetVar ? (
          <Bas onPress={() => yonetAyarla(true)} etiket="Kurucu seçenekleri" style={s.ustDug} hoverRenk={R.hover}>
            <Ikon ad="nokta" boyut={20} renk={R.murekkep} />
          </Bas>
        ) : kendi ? (
          <Bas onPress={() => c.git({ tur: 'ayarlar' })} etiket="Ayarlar" style={s.ustDug} hoverRenk={R.hover}>
            <Ikon ad="ayar" boyut={21} renk={R.murekkep} />
          </Bas>
        ) : undefined
      }
    />
  );

  const pencereler = u && (
    <>
      {yonetVar && (
        <Pencere acik={yonet} kapat={() => yonetAyarla(false)} genislik={420} baslik={`@${u.ad}`}>
          <View style={{ paddingBottom: 14 }}>
            <KurucuSecenekleri hedef={{ tur: 'uye', id: u.uid, korumali: !!u.kurucu }} bitti={() => yonetAyarla(false)} />
            {!!u.kurucu && <Text style={[s.yonetNot, { color: R.soluk }]}>Kurucu hesaplara yaptırım uygulanmaz.</Text>}
          </View>
        </Pencere>
      )}
      {!u.marka && (
        <Pencere acik={kilit} kapat={() => kilitAyarla(false)} genislik={400}>
          <View style={s.kilit}>
            <Avatar yazar={u} boyut={60} />
            <Text style={[s.kilitBaslik, { color: R.murekkep }]}>{neden === 'kapali' ? `@${u.ad} mesajlarını kapatmış.` : 'Birbirinizi takip edince mesajlaşabilirsiniz.'}</Text>
            {neden !== 'kapali' && <Text style={[s.kilitAlt, { color: R.soluk }]}>{kilitAlt}</Text>}
            {neden === 'takip_et' ? (
              <Dugme yazi={u.takipEdiyorBeni ? 'Sen de takip et' : 'Takip et'} tur="acik" ikon="kisi" onPress={kilitTakip} style={{ alignSelf: 'stretch', marginTop: 6 }} />
            ) : (
              <Dugme yazi="Tamam" tur="cizgi" onPress={() => kilitAyarla(false)} style={{ alignSelf: 'stretch', marginTop: 6 }} />
            )}
          </View>
        </Pencere>
      )}
      {duzenleVar && kimlik && <BalonDuzenle acik={!!duzen} kapat={() => duzenAyarla(null)} ad={u.ad} kimlik={kimlik} duvar={duvar} duvaraGit={duzen === 'duvar'} kaydedildi={() => yukle(false)} />}
    </>
  );

  if (hata || !u || !kimlik)
    return (
      <View style={{ flex: 1 }} onLayout={(e) => genAyarla(e.nativeEvent.layout.width)}>
        {ust}
        {hata ? (
          <View style={s.bos}>
            <YuzBalon ad="uzgun" boyut={70} />
            <Text style={[s.bosBaslik, { color: R.murekkep }]}>Böyle biri yok.</Text>
          </View>
        ) : (
          <ActivityIndicator style={{ marginTop: 40 }} color={R.vurgu} />
        )}
      </View>
    );

  // ---------- parçalar (telefon ve bilgisayar ortak) ----------
  const yuzAd = (YUZ_ADLARI[kimlik.y] ?? 'Mutlu').toLocaleLowerCase('tr');
  const katilim = katilimYazisi(u.katilim);
  const altSatir = [`@${u.ad}`, katilim].filter(Boolean).join(' · ');
  const biyo = u.marka ? 'İlişki, okul, iş, aile. Mesajlaşmanın tuhaf yanları. Her yoruma cevap veririm. Bana özelden de yazabilirsin.' : u.kurucu ? 'Yazsam mı?’yı kurdum. Akışı ben de okuyorum; bir şey takılırsa yaz.' : benim ? 'Burası senin köşen.' : 'Yazsam mı? Canlı’da';
  const kurucuKapak: [string, string] = R.gece ? ['#16112A', '#6B4E12'] : ['#FCE7A8', '#E3A93A'];

  const duvarCiz = (w: number, h: number, kucukDug?: boolean) => (
    <View style={{ height: h, overflow: 'hidden' }}>
      {sade ? (
        w > 0 && <Duvar ad={duvar} genislik={w} yukseklik={h} />
      ) : (
        <LinearGradient colors={u.marka ? DONEM.kapak : kurucuKapak} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, s.kapak]}>
          {u.marka && <Text style={s.kapakYazi}>hayatın içinden, gün boyu</Text>}
          {u.kurucu && <Text style={[s.kapakYazi, { color: R.gece ? 'rgba(255,236,190,0.92)' : 'rgba(92,58,0,0.82)' }]}>Yazsam mı?’nın kurucusu</Text>}
        </LinearGradient>
      )}
      {duzenleVar && (
        <Bas onPress={() => duzenAyarla('duvar')} etiket="Duvarı değiştir" hitSlop={8} style={[s.duvarDug, kucukDug ? { top: 14 } : { bottom: 12 }, Platform.OS === 'web' ? ({ backdropFilter: 'blur(8px)' } as any) : null]}>
          <Ikon ad="resim" boyut={16} renk="#fff" kalinlik={2.2} />
          <Text style={s.duvarDugYazi}>Duvarı değiştir</Text>
        </Bas>
      )}
    </View>
  );

  const golge = Platform.OS === 'web' ? ({ filter: `drop-shadow(0 8px 14px ${R.gece ? 'rgba(0,0,0,.35)' : 'rgba(29,24,48,.22)'})` } as any) : null;
  const buyukAvatar = (boyut: number) => {
    const ic = sade ? (
      <View style={golge}>
        <DostCerceve boyut={boyut} dost={!!u.kurucuDost}><BalonAvatar kimlik={kimlik} boyut={boyut} /></DostCerceve>
      </View>
    ) : (
      <View style={[s.halka, { borderColor: R.panel, backgroundColor: R.panel, borderRadius: boyut }]}>
        <Avatar yazar={u} boyut={boyut - 10} />
      </View>
    );
    return (
      <Suzul>
        {duzenleVar ? (
          <Bas onPress={() => duzenAyarla('balon')} etiket="Balonunu düzenle">
            {ic}
            <View style={[s.kalem, { backgroundColor: R.vurgu, borderColor: R.panel }]}>
              <Ikon ad="kalem" boyut={14} renk={vurguYazi(R.vurgu)} kalinlik={2.6} />
            </View>
          </Bas>
        ) : (
          ic
        )}
      </Suzul>
    );
  };

  const etiketler = (boyut: number) => (
    <>
      {u.marka && <Rozet boyut={boyut} />}
      {u.marka && <YzEtiketi />}
      {!u.marka && u.kurucu && <KurucuRozet boyut={boyut} />}
      {!u.marka && u.kurucu && <KurucuEtiketi />}
      {!u.marka && !u.kurucu && !!u.kurucuDost && <KurucuDostEtiketi />}
      {!u.marka && !!(benim ? c.uye?.vitrin ?? u.vitrin : u.vitrin) && <AdRozeti v={(benim ? c.uye?.vitrin ?? u.vitrin : u.vitrin)!} boyut={boyut >= 22 ? 26 : 24} />}
    </>
  );

  const dugmeler = (genis: boolean) =>
    kendi ? (
      <View style={s.dugSira}>
        {duzenleVar ? (
          <Dg R={R} ana yazi="Balonunu düzenle" ikonOge={<BalonIkon renk={vurguYazi(R.vurgu)} ic={R.vurgu} boyut={19} />} onPress={() => duzenAyarla('balon')} style={{ flex: 1 }} />
        ) : (
          <Dg R={R} ana yazi="Yaz" ikon="kalem" onPress={c.yaziciAc} style={{ flex: 1 }} />
        )}
        <Dg R={R} yazi={genis ? 'Paylaş' : undefined} ikon="paylas" etiket="Profili paylaş" onPress={paylasProfil} />
      </View>
    ) : (
      <View style={s.dugSira}>
        <Dg R={R} ana={!u.takipEdiyorum} yazi={u.takipEdiyorum ? 'Takip ediliyor' : u.takipEdiyorBeni ? 'Sen de takip et' : 'Takip et'} ikon={u.takipEdiyorum ? 'tik' : 'kisi'} onPress={() => takip()} style={{ flex: 1 }} />
        {u.marka && !u.mesaj?.goster && <Dg R={R} yazi="Mesaj" ikon="mesaj" onPress={markaMesaj} />}
        {(u.mesaj?.goster || (!u.marka && (!!u.mesaj?.neden || !c.uye))) && <Dg R={R} yazi="Mesaj" ikon="mesaj" onPress={mesajBas} />}
      </View>
    );

  const sekmeler = (dolu: boolean) => (
    <View style={[s.hap, { backgroundColor: R.panel, borderColor: R.ince }, !dolu && { alignSelf: 'flex-start' }]} accessibilityRole="tablist">
      {(
        [
          ['balon', 'Balonları'],
          ['cevap', 'Cevapları'],
          ['begeni', 'Beğendikleri'],
        ] as const
      ).map(([k, y]) => (
        <Bas key={k} rol="tab" etiket={y} hitSlop={4} onPress={() => sekmeSec(k)} hoverRenk={sekme === k ? undefined : R.hover} style={[s.hapDug, dolu && { flex: 1 }, sekme === k && { backgroundColor: R.vurguYumusak }]}>
          <Text numberOfLines={1} style={[s.hapYazi, { color: sekme === k ? R.vurgu : R.soluk }, sekme === k && { fontFamily: yazi.kalin }]}>{y}</Text>
        </Bas>
      ))}
    </View>
  );

  // Sekmenin öğeleri (her biri ayrı blok: telefonda alt alta, bilgisayarda kutularda iki sütun).
  const ogeler: { key: string; oge: ReactNode }[] = [];
  let bosMetin = '';
  let altOge: ReactNode = null;
  if (sekme === 'balon') {
    p!.gonderiler.forEach((g) => c.harita[g.id] && !c.gizli.has(g.id) && ogeler.push({ key: g.id, oge: <Kart g={c.harita[g.id]} /> }));
    bosMetin = kendi ? 'İlk balonun burada görünecek.' : 'Henüz balon yok.';
  } else {
    const e = ek[sekme];
    if (sekme === 'cevap') e.cevaplar.forEach((x) => ogeler.push({ key: x.yorum.id, oge: <CevapOge x={x} /> }));
    else e.ids.forEach((id) => c.harita[id] && !c.gizli.has(id) && ogeler.push({ key: id, oge: <Kart g={c.harita[id]} /> }));
    bosMetin = e.hata ? 'Yüklenemedi. Sekmeye yeniden dokun.' : sekme === 'cevap' ? (kendi ? 'Yazdığın cevaplar burada görünecek.' : 'Henüz cevap yok.') : kendi ? 'Beğendiğin balonlar burada görünecek.' : 'Henüz beğeni yok.';
    if (e.yukleniyor) altOge = <ActivityIndicator style={{ marginVertical: 24 }} color={R.vurgu} />;
    else if (e.imlec && ogeler.length > 0) altOge = <Dugme yazi="Daha fazla" tur="cizgi" kucuk onPress={() => sekmeYukle(sekme, true)} style={{ alignSelf: 'center', marginVertical: 16, minHeight: 44 }} />;
    if (!e.yuklendi && !e.hata) bosMetin = '';
  }
  const bos = ogeler.length === 0 && !!bosMetin && !altOge ? <Bos metin={bosMetin} /> : null;

  // ---------- bilgisayar ----------
  if (masa) {
    const icG = Math.min(gen - 32, 1100);
    const yanG = Math.round(Math.min(380, Math.max(300, icG * 0.3)));
    const akisG = icG - yanG - 16;
    const sutun = akisG >= 700 ? 2 : 1; // sütun ~350 altına inmesin (kart başlığı sığsın)
    const sagG = Math.round(Math.min(400, Math.max(330, icG * 0.34)));
    const kutular = ogeler.map(({ key, oge }) => (
      <View key={key} style={[s.kutu, { backgroundColor: R.panel, borderColor: R.ince }]}>
        <View style={{ marginBottom: -1 }}>{oge}</View>
      </View>
    ));
    return (
      <View style={{ flex: 1, backgroundColor: R.sis }} onLayout={(e) => genAyarla(e.nativeEvent.layout.width)}>
        {ust}
        {pencereler}
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          <View style={{ width: icG, alignSelf: 'center', gap: 16 }}>
            <View style={[s.kutu, { backgroundColor: R.panel, borderColor: R.ince }]}>
              {duvarCiz(icG - 2, 210, true)}
              <View style={s.mKim}>
                <View style={s.mAv}>{buyukAvatar(156)}</View>
                <View style={{ flex: 1, minWidth: 0, paddingBottom: 4 }}>
                  <View style={s.adSatir}>
                    <Text numberOfLines={1} style={[s.ad, { color: R.murekkep, fontSize: 30 }]}>{u.marka ? 'Yazsam mı?' : u.ad}</Text>
                    {etiketler(22)}
                  </View>
                  <Text style={[s.alt, { color: R.soluk, fontSize: 14 }]}>{[altSatir, sade ? `bugün ${yuzAd}` : ''].filter(Boolean).join(' · ')}</Text>
                  <Text style={[s.biyo, { color: R.murekkep, fontSize: 16, marginTop: 8 }]}>{biyo}</Text>
                </View>
                <View style={{ width: sagG, gap: 12 }}>
                  <SayiBalonlari u={u} R={R} />
                  {dugmeler(true)}
                </View>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 16, alignItems: 'flex-start' }}>
              <View style={{ width: yanG, gap: 16 }}>
                <View style={[s.kutu, { backgroundColor: R.panel, borderColor: R.ince, padding: 16 }]}>
                  <Raf u={u} R={R} yenile={() => yukle(false)} />
                </View>
                {benim && <PlusKarti />}
                {sade && (
                  <View style={[s.kutu, { backgroundColor: R.panel, borderColor: R.ince, padding: 16 }]}>
                    <Text style={[s.mkBaslik, { color: R.soluk }]}>Balon kimliği</Text>
                    <View style={s.ozet}>
                      <BalonAvatar kimlik={kimlik} boyut={64} />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={[s.ozetB, { color: R.murekkep }]}>{kimlikOzet(kimlik).split(' · ').slice(0, 2).join(' · ')}</Text>
                        <Text style={[s.ozetAlt, { color: R.soluk }]}>Yüz: {YUZ_ADLARI[kimlik.y]} · Duvar: {DUVARLAR[duvar]}</Text>
                      </View>
                      {duzenleVar && <Dg R={R} yazi="Düzenle" onPress={() => duzenAyarla('balon')} style={{ paddingHorizontal: 14 }} />}
                    </View>
                  </View>
                )}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ marginBottom: 14 }}>{sekmeler(false)}</View>
                {bos ? (
                  <View style={[s.kutu, { backgroundColor: R.panel, borderColor: R.ince }]}>{bos}</View>
                ) : sutun === 2 ? (
                  <View style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}>
                    {[0, 1].map((i) => (
                      <View key={i} style={{ flex: 1, minWidth: 0, gap: 14 }}>
                        {kutular.filter((_, j) => j % 2 === i)}
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={{ gap: 14 }}>{kutular}</View>
                )}
                {altOge}
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ---------- telefon ----------
  return (
    <View style={{ flex: 1 }} onLayout={(e) => genAyarla(e.nativeEvent.layout.width)}>
      {ust}
      {pencereler}
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        {duvarCiz(gen, 150)}
        <View style={s.govde}>
          <View style={[s.kimlik, { marginTop: sade ? -62 : -50 }]}>
            {buyukAvatar(118)}
            {sade && (
              <View style={[s.ruh, { backgroundColor: R.ust }]}>
                <BalonAvatar kimlik={kimlik} boyut={20} />
                <Text style={[s.ruhYazi, { color: R.soluk }]}>
                  bugün <Text style={{ color: R.murekkep, fontFamily: yazi.kalin }}>{yuzAd}</Text>
                </Text>
              </View>
            )}
          </View>
          <View style={[s.adSatir, { marginTop: 8 }]}>
            <Text numberOfLines={1} style={[s.ad, { color: R.murekkep }]}>{u.marka ? 'Yazsam mı?' : u.ad}</Text>
            {etiketler(20)}
          </View>
          <Text style={[s.alt, { color: R.soluk }]}>{altSatir}</Text>
          <Text style={[s.biyo, { color: R.murekkep }]}>{biyo}</Text>
          <View style={{ marginTop: 16, marginBottom: 18 }}>
            <SayiBalonlari u={u} R={R} />
          </View>
          <View style={{ marginBottom: 16 }}>{dugmeler(false)}</View>
          <Raf u={u} R={R} yenile={() => yukle(false)} />
          {benim && <View style={{ marginTop: 12 }}><PlusKarti /></View>}
          <View style={{ marginTop: 4 }}>{sekmeler(true)}</View>
        </View>
        <View style={[s.liste, { borderTopColor: R.ince }]}>
          {ogeler.map(({ key, oge }) => (
            <View key={key}>{oge}</View>
          ))}
          {bos}
          {altOge}
        </View>
      </ScrollView>
    </View>
  );
}

// Düğme (taslak .dug: 44 yüksek, 15 köşe; ana = dönem vurgusu, ikincil = üst ton).
function Dg({ R, yazi: y, ikon, ikonOge, onPress, ana, etiket, style }: { R: Renk; yazi?: string; ikon?: IkonAd; ikonOge?: ReactNode; onPress?: () => void; ana?: boolean; etiket?: string; style?: any }) {
  const renk = ana ? vurguYazi(R.vurgu) : R.murekkep;
  return (
    <Bas onPress={onPress} etiket={etiket ?? y} hoverRenk={ana ? undefined : R.yukselt} style={[s.dug, { backgroundColor: ana ? R.vurgu : R.ust }, !y && { width: 44, paddingHorizontal: 0 }, style]}>
      {ikonOge ?? (ikon ? <Ikon ad={ikon} boyut={18} renk={renk} kalinlik={2.3} /> : null)}
      {!!y && (
        <Text numberOfLines={1} style={[s.dugYazi, { color: renk }]}>
          {y}
        </Text>
      )}
    </Bas>
  );
}

// Sayılar üç konuşma balonunda (taslak .say-sira): yazdı · okuyan · bağ (karşılıklı takip).
const KUYRUK = 'M0 0L16 0C12 4 7 9 1 12C3 8 3 4 0 0Z';
function SayiBalonlari({ u, R }: { u: ProfilTip['uye']; R: Renk }) {
  const ogeler: [number, string, string][] = [
    [u.gonderiSayisi, 'yazdı', 'balon paylaştı'],
    [u.takipci, 'okuyan', 'takip ediyor'],
    [u.bag, 'bağ', 'karşılıklı takip; mesajlaşabilir'],
  ];
  const zemin = [R.vurgu, R.ust, karistir(R.vurgu, R.ust, 0.26)];
  const yaziR = [vurguYazi(R.vurgu), R.murekkep, R.murekkep];
  return (
    <View style={s.saySira}>
      {ogeler.map(([n, ad, alt], i) => (
        <View key={ad} accessible accessibilityLabel={`${n} ${ad}: ${alt}`} style={[s.say, { backgroundColor: zemin[i] }, i === 2 ? { borderBottomRightRadius: 8, alignItems: 'flex-end' } : { borderBottomLeftRadius: 8 }]}>
          <Text numberOfLines={1} style={[s.sayB, { color: yaziR[i] }]}>{C.kisaSayi(n)}</Text>
          <Text numberOfLines={1} style={[s.sayAd, { color: yaziR[i] }]}>{ad}</Text>
          <View style={[s.kuyruk, i === 2 ? { right: 12, transform: [{ scaleX: -1 }] } : { left: 12 }]} pointerEvents="none">
            <Svg width={16} height={12} viewBox="0 0 16 12">
              <Path d={KUYRUK} fill={zemin[i]} />
            </Svg>
          </View>
        </View>
      ))}
    </View>
  );
}

// Rozet rafı (Onur 08.10 23:50: düz rozet ailesi, plan/29_ROZETLER/v3). Kendi profilinde: kazanılan renkli, kazanılmayan sönük silüet + gerçek
// ilerleme, gizli rozet "???". Başkasının profilinde yalnız kazandıkları. Marka: yalnız "Yapay zekâ" rozeti. Dokununca ayrıntı penceresi.
function Raf({ u, R, yenile }: { u: ProfilTip['uye']; R: Renk; yenile: () => void }) {
  const c = useCanli();
  if (u.marka) {
    const v = DONEM.vurgu.gece;
    const r: RafRozet = { ad: 'Yapay zekâ', alt: 'Onaylı hesap', ikon: 'yz', renk: [karistir('#FFFFFF', v, 0.45), v, karistir('#16112A', v, 0.35)] };
    return (
      <View style={s.raf}>
        <View style={s.rafBas}>
          <Text style={[s.rafB, { color: R.murekkep }]}>Rozet rafı</Text>
        </View>
        <View style={s.rafSira}>
          <View style={s.rz} accessible accessibilityLabel="Rozet: Yapay zekâ">
            <RozetCizim r={r} boyut={56} kilitRenk={R.soluk} />
            <Text numberOfLines={1} style={[s.rzAd, { color: R.murekkep }]}>{r.ad}</Text>
            <Text numberOfLines={1} style={[s.rzAlt, { color: R.soluk }]}>{r.alt}</Text>
          </View>
        </View>
      </View>
    );
  }
  const kendi = !!(u.ben || (c.uye && c.uye.uid === u.uid));
  const ogeler: RafOge[] = kendi ? u.raf ?? [] : (u.rozetler ?? []).map((k) => ({ r: k.r, s: k.s, t: k.t, ...(k.n != null ? { n: k.n } : {}) }));
  const vitrin = kendi ? c.uye?.vitrin?.r ?? u.vitrin?.r ?? null : null;
  return (
    <View style={s.raf}>
      <RozetRafi ogeler={ogeler} kendi={kendi} vitrin={vitrin} yenile={yenile} bos={kendi ? 'İlk rozetin yolda. Bir şey yaz, bir yoruma cevap ver.' : 'Henüz rozet yok.'} />
    </View>
  );
}

// Cevapları sekmesindeki tek cevap: "↪ <sahip>’nin balonuna" + cevap metni; dokununca gönderi açılır.
function CevapOge({ x }: { x: ProfilCevap }) {
  const R = useRenk();
  const c = useCanli();
  const sahip = x.gonderi.yazar.marka ? 'Yazsam mı?' : x.gonderi.yazar.ad;
  const ac = (g: Gonderi) => {
    c.koy([g]);
    c.git({ tur: 'gonderi', id: g.id });
  };
  return (
    <Bas onPress={() => ac(x.gonderi)} rol="link" etiket={`${sahip} gönderisine cevap: ${x.yorum.metin}`} hoverRenk={R.hover} style={[s.cevap, { borderBottomColor: R.ince }]}>
      <Text numberOfLines={1} style={[s.cevapUst, { color: R.soluk }]}>
        ↪ <Text style={{ color: R.murekkep, fontFamily: yazi.kalin }}>{sahip}</Text>’{tamlayan(sahip)} balonuna · {C.zamanOnce(x.yorum.zaman)}
      </Text>
      <Text style={[s.cevapMetin, { color: R.murekkep }]}>{x.yorum.metin}</Text>
    </Bas>
  );
}

const s = StyleSheet.create({
  ustDug: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  kapak: { justifyContent: 'flex-end', padding: 14 },
  kapakYazi: { fontFamily: yazi.kalem, fontSize: 24, color: 'rgba(255,255,255,0.92)', alignSelf: 'flex-end', transform: [{ rotate: '-3deg' }] },
  duvarDug: { position: 'absolute', right: 12, height: 32, paddingHorizontal: 11, borderRadius: 12, backgroundColor: 'rgba(12,8,24,0.45)', flexDirection: 'row', alignItems: 'center', gap: 6 },
  duvarDugYazi: { color: '#fff', fontFamily: yazi.kalin, fontSize: 12.5 },
  govde: { paddingHorizontal: 16 },
  kimlik: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  halka: { borderWidth: 5, overflow: 'hidden' },
  kalem: { position: 'absolute', right: 2, bottom: 16, width: 30, height: 30, borderRadius: 15, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  ruh: { marginBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 6, height: 30, paddingLeft: 6, paddingRight: 12, borderTopLeftRadius: 15, borderTopRightRadius: 15, borderBottomRightRadius: 15, borderBottomLeftRadius: 5 },
  ruhYazi: { fontFamily: yazi.normal, fontSize: 12.5 },
  adSatir: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  ad: { fontFamily: yazi.kalin, fontSize: 24, letterSpacing: -0.7, flexShrink: 1 },
  alt: { fontFamily: yazi.normal, fontSize: 13.5, marginTop: 2 },
  biyo: { fontFamily: yazi.normal, fontSize: 15.5, lineHeight: 22, marginTop: 10 },
  saySira: { flexDirection: 'row', gap: 10 },
  say: { flex: 1, minWidth: 0, borderRadius: 20, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 9, alignItems: 'flex-start' },
  sayB: { fontFamily: yazi.kalin, fontSize: 22, letterSpacing: -0.6, lineHeight: 24, fontVariant: ['tabular-nums'] },
  sayAd: { fontFamily: yazi.orta, fontSize: 12.5, opacity: 0.85 },
  kuyruk: { position: 'absolute', bottom: -9, width: 16, height: 12 },
  dugSira: { flexDirection: 'row', gap: 8 },
  dug: { height: 44, minWidth: 44, paddingHorizontal: 18, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  dugYazi: { fontFamily: yazi.kalin, fontSize: 15 },
  raf: { marginTop: 6, marginBottom: 12 },
  rafBas: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 10 },
  rafB: { fontFamily: yazi.kalin, fontSize: 15.5, letterSpacing: -0.2 },
  rafAlt: { fontFamily: yazi.orta, fontSize: 12.5 },
  rafSira: { flexDirection: 'row', gap: 6, paddingBottom: 6 },
  rz: { width: 68, alignItems: 'center', gap: 2 },
  rzAd: { fontFamily: yazi.kalin, fontSize: 11.5, marginTop: 4 },
  rzAlt: { fontFamily: yazi.normal, fontSize: 10.5 },
  tahta: { height: 10, marginTop: -6, marginHorizontal: 4, borderTopWidth: 2, borderBottomLeftRadius: 10, borderBottomRightRadius: 10 },
  hap: { flexDirection: 'row', borderWidth: 1, borderRadius: 16, padding: 4 },
  hapDug: { height: 36, paddingHorizontal: 10, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  hapYazi: { fontFamily: yazi.orta, fontSize: 14 },
  liste: { borderTopWidth: 1, marginTop: 12 },
  cevap: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, gap: 4 },
  cevapUst: { fontFamily: yazi.normal, fontSize: 13 },
  cevapMetin: { fontFamily: yazi.normal, fontSize: 15.5, lineHeight: 22 },
  kutu: { borderWidth: 1, borderRadius: 24, overflow: 'hidden' },
  mKim: { flexDirection: 'row', alignItems: 'center', gap: 22, paddingTop: 16, paddingRight: 26, paddingBottom: 22, paddingLeft: 214 },
  mAv: { position: 'absolute', left: 34, top: -92 },
  mkBaslik: { fontFamily: yazi.kalin, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 },
  ozet: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  ozetB: { fontFamily: yazi.kalin, fontSize: 15 },
  ozetAlt: { fontFamily: yazi.normal, fontSize: 12.5, marginTop: 2 },
  bos: { alignItems: 'center', gap: 8, paddingVertical: 60 },
  yonetNot: { fontFamily: yazi.normal, fontSize: 13, paddingHorizontal: 22, paddingTop: 12 },
  bosBaslik: { fontFamily: yazi.kalin, fontSize: 20 },
  kilit: { alignItems: 'center', gap: 8, paddingHorizontal: 22, paddingTop: 22, paddingBottom: 20 },
  kilitBaslik: { fontFamily: yazi.kalin, fontSize: 18, lineHeight: 24, textAlign: 'center', marginTop: 4 },
  kilitAlt: { fontFamily: yazi.normal, fontSize: 14.5, lineHeight: 20, textAlign: 'center' },
});
