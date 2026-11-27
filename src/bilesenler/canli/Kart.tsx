// Gönderi kartı: üst satır (avatar, ad, rozet, zaman, ⋯), türüne göre gövde, eylemler (♥ 💬 paylaş) ve öne çıkan yorum.
import { memo, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { OY_ESIGI } from '@/analiz';
import { Balon as MarkaBalon } from '@/bilesenler/Marka';
import { yazi } from '@/tema/tema';
import { ORNEK, kisaSayi, zamanOnce, type Alinti, type Gonderi, type Ozellik } from '@/canli';
import { DONEM, karistir, saydam } from '@/tema/donem';
import { Ad, Avatar, Bas, Belir, Ikon, Rakam, Rozet, YEREL_SURUCU, TRIBUN_ACIK, disariAc, useRenk, type Renk } from './ortak';
import { useCanliEylem } from './baglam';
import { Video } from './Video';
import { YouTube } from './YouTube';
import { HavaKart } from './Hava';
import { DiziBaslik, DiziHap, DiziListe, DiziSayac, diziBalon } from './Dizi';
import { FotoKart } from './Foto';
import { EtiketliMetin } from './Etiket';
import { useOkuma } from './okuma';
import { YuzBalon } from './balon';

// İlk ve üçüncü degrade GÜNCEL DÖNEM paletinden (tema/donemler.json): marka kartları dönemle renk değiştirir.
const TESPIT_RENKLERI: [string, string, string][] = [
  DONEM.tespit[0],
  ['#FF4F8B', '#FF6A3D', '#FFB23D'],
  DONEM.tespit[1],
  ['#0FA98F', '#1497E0', '#5B2EFF'],
  ['#E5243B', '#FF3D7F', '#9B3FD6'],
];
// Sohbet ekranında karşı tarafın adı sunucudan gelmezse metinden tahmin edilir (anne, patron…), yoksa sabit bir ad.
const ADLAR = ['Ece', 'Kerem', 'Deniz', 'Mert', 'Selin', 'Can', 'Zeynep', 'Burak', 'Defne', 'Emir'];
function kisiTahmin(g: Gonderi) {
  const t = (g.balonlar ?? []).map((b) => b.metin).join(' ').toLocaleLowerCase('tr');
  if (/(^|[^a-zçğıöşü])anne(ciğim)?([^a-zçğıöşü]|$)|annem/.test(t)) return 'Annem';
  if (/(^|[^a-zçğıöşü])baba(cım)?([^a-zçğıöşü]|$)|babam/.test(t)) return 'Babam';
  if (/hocam|ödev|sınav/.test(t)) return 'Hocam';
  if (/toplant|müdür|patron|mesai/.test(t)) return 'İş';
  return ADLAR[karma(g.id) % ADLAR.length];
}
const karma = (s: string) => {
  let h = 0;
  for (const c of s) h = (h * 33 + c.charCodeAt(0)) >>> 0;
  return h;
};

// 08.10 (Balon Rıhtımı taslağı): balon + ad başlıkta yan yana, metin tam genişlikte (X'in sol sütun avatar düzeni değil).
// kutu: bilgisayarda çok sütunlu akışta yuvarlak kenarlı ayrı kart.
export const Kart = memo(function Kart({ g, tam = false, yeni = false, kutu = false }: { g: Gonderi; tam?: boolean; yeni?: boolean; kutu?: boolean }) {
  if (ORNEK) (globalThis as any).__kartCizim = ((globalThis as any).__kartCizim ?? 0) + 1; // KASMA ölçümü: yalnız ?mock=1 (web geliştirme) kipinde sayar
  const R = useRenk();
  const c = useCanliEylem();
  const ac = (yaz?: boolean) => !tam && c.git({ tur: 'gonderi', id: g.id, yaz });
  const profil = () => c.git({ tur: 'profil', ad: g.yazar.ad });
  const [diziListe, diziListeAc] = useState(false);
  const kok = useRef<View>(null);
  useOkuma(kok, g.id, !tam && !g.inceleniyor); // Okur rozeti: ekranda ≥2 sn kalan balon sayılır (yalnız sayı yollanır)
  return (
    <Belir aktif={yeni}>
      <Pressable
        ref={kok}
        onPress={() => ac()}
        disabled={tam}
        accessibilityRole={tam ? undefined : 'link'}
        style={({ hovered }: { hovered?: boolean; pressed: boolean }) => [s.kart, { borderBottomColor: R.ince }, kutu && [s.kutu, { borderColor: hovered ? R.cizgi : R.ince, backgroundColor: R.panel }], hovered && !tam && !kutu && { backgroundColor: R.hover }, tam && { paddingTop: 18 }]}
      >
        <View style={s.sag}>
          <View style={s.ust}>
            <View style={s.ustSol}>
              <Pressable onPress={profil} accessibilityLabel={`${g.yazar.ad} profili`}>
                <KartAvatar yazar={g.yazar} />
              </Pressable>
              <View style={{ flexShrink: 1, minWidth: 0 }}>
                <View style={s.adSatir}>
                  <Ad yazar={g.yazar} onPress={profil} />
                  {!kutu && <Text numberOfLines={1} style={[s.zaman, { color: R.soluk }]}>· {zamanOnce(g.zaman)}</Text>}
                </View>
                {/* Dar sütunlu kutuda zaman alt satırda (ad kesilmesin). */}
                {(g.yazar.marka || kutu) && <Text numberOfLines={1} style={[s.markaAlt, { color: R.soluk }]}>{[kutu ? zamanOnce(g.zaman) : '', g.yazar.marka ? 'Markanın kendisi · her yoruma cevap verir' : ''].filter(Boolean).join(' · ')}</Text>}
              </View>
            </View>
            <Bas onPress={() => c.bildirAc(g.id)} etiket="Diğer" style={s.nokta} hoverRenk={R.vurguYumusak} hitSlop={6}>
              <Ikon ad="nokta" boyut={20} renk={R.soluk} />
            </Bas>
          </View>
          {g.sabit && !tam && (
            <View style={[s.inceleme, { backgroundColor: R.vurguYumusak }]}>
              <Ikon ad="yukari" boyut={13} renk={R.vurgu} kalinlik={2.6} />
              <Text style={[s.incelemeYazi, { color: R.vurgu }]}>Öne çıkan</Text>
            </View>
          )}
          {g.inceleniyor && (
            <View style={[s.inceleme, { backgroundColor: R.vurguYumusak }]}>
              <Ikon ad="saat" boyut={13} renk={R.vurgu} kalinlik={2.4} />
              <Text style={[s.incelemeYazi, { color: R.vurgu }]}>İnceleniyor · birazdan herkeste</Text>
            </View>
          )}
          {!!g.dizi && <DiziBaslik d={g.dizi} listeAc={() => diziListeAc(true)} adGoster={g.tur === 'sohbet'} />}
          {!!g.alinti && !g.metin && (
            <View style={s.yenidenEtiket}>
              <Ikon ad="yeniden" boyut={14} renk={R.soluk} kalinlik={2.2} />
              <Text style={[s.yenidenEtiketYazi, { color: R.soluk }]}>Akışında paylaştı</Text>
            </View>
          )}
          <Govde g={g} R={R} ac={ac} tam={tam} />
          {!!g.kaynak?.url && !g.yt && !g.hava && <HaberKutu url={g.kaynak.url} baslik={g.baslik} ad={g.kaynak.ad} kategori={g.kategori} R={R} />}
          <Eylemler g={g} ac={ac} />
          {!tam && g.enIyi && (g.tur === 'sohbet' || g.tur === 'soru' || g.yorum > 0) && <EnIyi g={g} ac={() => ac()} />}
        </View>
      </Pressable>
      {!!g.dizi && <DiziListe acik={diziListe} kapat={() => diziListeAc(false)} sezon={g.dizi.sezon} />}
    </Belir>
  );
});

// 08.10 hiza (Onur: uzun yazıda metin ile avatar + ad satırının hizası bozuk): balon avatarın çizimi kutusunun ~%16 içinden başlıyordu,
// metin balonun görünen sol kenarından 6-7 px dışarı taşmış gibi duruyordu. Balon, görünen sol kenarı metnin sol kenarına denk düşecek
// biçimde 38 px'lik yuvaya oturur (marka/kurucu yuvarlağıyla aynı yuva): ad her kartta aynı yerden, metin avatarla aynı çizgiden başlar.
function KartAvatar({ yazar }: { yazar: Gonderi['yazar'] }) {
  if (yazar.marka || yazar.kurucu) return <Avatar yazar={yazar} boyut={38} />;
  return (
    <View style={s.balonYuva}>
      <View style={s.balonIc}>
        <Avatar yazar={yazar} boyut={54} />
      </View>
    </View>
  );
}

function Govde({ g, R, ac, tam }: { g: Gonderi; R: Renk; ac: (yaz?: boolean) => void; tam: boolean }) {
  switch (g.tur) {
    case 'sohbet':
      return <Sohbet g={g} R={R} />;
    case 'anket':
      return <Anket g={g} />;
    case 'soru':
      return <Soru g={g} R={R} ac={ac} />;
    case 'video':
      return (
        <View style={{ gap: 10 }}>
          {!!g.metin && <Metin metin={g.metin} etiketler={g.etiketler} R={R} />}
          {!!g.video && <Video kaynak={g.video} kapak={g.kapak} />}
        </View>
      );
    case 'ozellik': // eski bölüm kapı kartı: yeni arayüzde çizilmez (liste de bunları ayıklar)
      return null;
    default:
      if (g.hava)
        return (
          <View style={{ gap: 10 }}>
            {!!g.metin && <Metin metin={g.metin} etiketler={g.etiketler} R={R} buyuk={tam} />}
            <HavaKart hava={g.hava} R={R} />
          </View>
        );
      if (g.yt)
        return (
          <View style={{ gap: 10 }}>
            {!!g.metin && <Metin metin={g.metin} etiketler={g.etiketler} R={R} buyuk={tam} />}
            <YouTube id={g.yt} baslik={g.baslik} kanal={g.kaynak?.ad} />
          </View>
        );
      if (g.alinti)
        return (
          <View style={{ gap: 10 }}>
            {!!g.metin && <Metin metin={g.metin} etiketler={g.etiketler} R={R} buyuk={tam} />}
            <AlintiKart a={g.alinti} />
          </View>
        );
      if (g.foto)
        return (
          <View style={{ gap: 10 }}>
            {!!g.metin && <Metin metin={g.metin} etiketler={g.etiketler} R={R} buyuk={tam} />}
            <FotoKart foto={g.foto} tam={tam} />
          </View>
        );
      if (g.tribun) return <TribunKart g={g} R={R} tam={tam} />;
      return g.tespit && g.metin ? <Tespit g={g} /> : <Metin metin={g.metin ?? ''} etiketler={g.etiketler} R={R} buyuk={tam} />;
  }
}

// Haber kartı: gönderi gerçek bir haberden üretildiyse metnin altında "HABER" kutusu: kaynak, haber başlığı (en çok 2 satır), "Habere git ↗".
// Dokununca kaynak yeni sekmede açılır (04.11, E-12: telefonda da; ortak.tsx disariAc); yalnız https:// adresler açılır. Başka sitenin görseli çekilmez.
const httpsMi = (u?: string): u is string => !!u && /^https:\/\/[^\s]+$/i.test(u);
const alanAdi = (u: string) => u.match(/^https:\/\/([^/?#:@]+)/i)?.[1].replace(/^www\./i, '').toLocaleLowerCase('tr') ?? '';
const haberAc = (url: string) => { if (httpsMi(url)) disariAc(url); };
// Konu etiketi (sürekli akış): kutudaki "HABER" rozeti haberin konusunu söyler (SPOR, EKONOMİ, DÜNYA, İLGİNÇ…); bilinmeyen/yoksa "HABER".
const KONU_ETIKET: Record<string, string> = { gundem: 'GÜNDEM', spor: 'SPOR', ekonomi: 'EKONOMİ', dunya: 'DÜNYA', magazin: 'MAGAZİN', teknoloji: 'TEKNOLOJİ', bilim: 'BİLİM', ilginc: 'İLGİNÇ', kultur: 'KÜLTÜR-SANAT', yasam: 'YAŞAM' };
function HaberKutu({ url, baslik, ad, kategori, R }: { url: string; baslik?: string; ad?: string; kategori?: string; R: Renk }) {
  if (!httpsMi(url)) return null;
  const etiket = (kategori && KONU_ETIKET[kategori]) || 'HABER';
  const kaynak = alanAdi(url) || ad || 'haber';
  const zemin = karistir(R.vurgu, R.panel, R.gece ? 0.08 : 0.045);
  return (
    <Pressable
      onPress={() => haberAc(url)}
      accessibilityRole="link"
      accessibilityLabel={`Habere git (${etiket.toLocaleLowerCase('tr')}): ${baslik ? baslik + ', ' : ''}${kaynak}`}
      style={({ hovered, pressed }: { hovered?: boolean; pressed: boolean }) => [s.haber, { backgroundColor: hovered ? karistir(R.vurgu, R.panel, R.gece ? 0.13 : 0.08) : zemin, borderColor: hovered ? saydam(R.vurgu, R.gece ? 0.45 : 0.32) : R.cizgi }, pressed && { opacity: 0.85 }]}
    >
      <View style={s.haberUst}>
        <Text style={[s.haberEtiket, { color: R.vurgu, backgroundColor: R.vurguYumusak }]}>{etiket}</Text>
        <Text numberOfLines={1} style={[s.haberKaynak, { color: R.soluk }]}>{kaynak}</Text>
      </View>
      {!!baslik && <Text numberOfLines={2} style={[s.haberBaslik, { color: R.murekkep }]}>{baslik}</Text>}
      <View style={s.haberAlt}>
        <Text style={[s.haberGit, { color: R.vurgu }]}>Habere git ↗</Text>
      </View>
    </Pressable>
  );
}

// Tribün'ün akışa yazdığı kart (gol, başladı, devre, bitti, oda açıldı): metin + "Tribüne gir".
function TribunKart({ g, R, tam }: { g: Gonderi; R: Renk; tam: boolean }) {
  const c = useCanliEylem();
  const [ilk, ...rest] = (g.metin ?? '').split('\n');
  return (
    <View style={{ gap: 9 }}>
      <Text style={[s.tribunBaslik, { color: R.murekkep }]}>{ilk}</Text>
      {!!rest.length && <Metin metin={rest.join('\n')} R={R} buyuk={tam} />}
      {TRIBUN_ACIK && (
        <Bas onPress={() => c.git({ tur: 'tribunMac', id: g.tribun!.mac })} etiket="Tribüne gir" style={[s.tribunGir, { backgroundColor: R.vurguYumusak }]} hoverRenk={R.vurguYumusak}>
          <Text style={[s.tribunGirYazi, { color: R.vurgu }]}>Tribüne gir</Text>
          <Ikon ad="ok" boyut={15} renk={R.vurgu} kalinlik={2.4} />
        </Bas>
      )}
    </View>
  );
}

function Metin({ metin, etiketler, R, buyuk }: { metin: string; etiketler?: string[]; R: Renk; buyuk?: boolean }) {
  return <EtiketliMetin metin={metin} etiketler={etiketler} style={[s.metin, { color: R.murekkep }, buyuk && { fontSize: 18, lineHeight: 26 }]} />;
}

// Marka tespiti: büyük, renkli, kalın yazılı kart.
function Tespit({ g }: { g: Gonderi }) {
  const renk = TESPIT_RENKLERI[karma(g.id) % TESPIT_RENKLERI.length];
  const uzun = (g.metin ?? '').length > 70;
  return (
    <LinearGradient colors={renk} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.tespit}>
      <View style={[s.tespitIsik, { backgroundColor: 'rgba(255,255,255,0.14)' }]} />
      <Text style={s.tespitUst}>tespit</Text>
      <Text style={[s.tespitYazi, uzun && { fontSize: 23, lineHeight: 29 }]}>{g.metin}</Text>
      <View style={s.tespitAlt}>
        <Text style={s.tespitImza}>Yazsam mı?</Text>
      </View>
      <View style={s.tespitYuz}>
        <MarkaBalon ad="kikir" boyut={86} />
      </View>
    </LinearGradient>
  );
}

// Kurgu mesaj ekranı: gerçekçi telefon sohbeti görüntüsü.
function Sohbet({ g, R }: { g: Gonderi; R: Renk }) {
  const balonlar = g.balonlar ?? [];
  const sonBen = balonlar.map((b) => b.kim).lastIndexOf('ben');
  const kisi = g.kisi || kisiTahmin(g);
  const harfRenk = ['#FF6A3D', '#0FA98F', '#3D57C9', '#FF3D7F', '#9B3FD6'][karma(kisi) % 5];
  const zemin = R.gece ? '#0F0C18' : '#EEE9F7';
  const onun = R.gece ? '#272140' : '#FFFFFF';
  return (
    <View style={{ gap: 12 }}>
      {!!g.dizi && !!g.metin && <Text style={[s.metin, { color: R.murekkep }]}>{g.metin}</Text>}
      <View style={[s.telefon, { backgroundColor: zemin, borderColor: R.ince }]}>
        <View style={[s.telUst, { backgroundColor: R.gece ? '#17122A' : '#FBFAFE', borderBottomColor: R.ince }]}>
          <Ikon ad="sol" boyut={22} renk={R.vurgu} kalinlik={2.4} />
          <View style={[s.telAvatar, { backgroundColor: harfRenk }]}>
            <Text style={s.telHarf}>{kisi.slice(0, 1).toLocaleUpperCase('tr')}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={[s.telAd, { color: R.murekkep }]}>{kisi}</Text>
            <Text style={[s.telDurum, { color: R.yesil }]}>çevrimiçi</Text>
          </View>
          <Ikon ad="kamera" boyut={19} renk={R.vurgu} />
          <Ikon ad="telefon" boyut={17} renk={R.vurgu} />
        </View>
        <View style={s.telGovde}>
          <Text style={[s.telGun, { color: R.soluk, backgroundColor: R.gece ? 'rgba(255,255,255,0.06)' : 'rgba(29,24,48,0.06)' }]}>Bugün</Text>
          {balonlar.map((b, i) => {
            const ben = b.kim === 'ben';
            const oncekiAyni = i > 0 && balonlar[i - 1].kim === b.kim;
            const sonrakiAyni = i < balonlar.length - 1 && balonlar[i + 1].kim === b.kim;
            return (
              <View key={i} style={{ alignItems: ben ? 'flex-end' : 'flex-start', marginTop: oncekiAyni ? 2 : 8 }}>
                <View
                  style={[
                    s.balon,
                    { backgroundColor: ben ? (g.dizi ? diziBalon(R) : R.vurgu) : onun },
                    ben ? { borderTopRightRadius: oncekiAyni ? 6 : 18, borderBottomRightRadius: sonrakiAyni ? 6 : 18 } : { borderTopLeftRadius: oncekiAyni ? 6 : 18, borderBottomLeftRadius: sonrakiAyni ? 6 : 18 },
                    !ben && !R.gece && ({ boxShadow: '0 1px 1.5px rgba(29,24,48,0.12)' } as any),
                  ]}
                >
                  <Text style={[s.balonYazi, { color: ben ? '#fff' : R.murekkep }]}>
                    {b.metin}
                    <Text style={s.balonBosluk}>{'      '}{b.saat ? '    ' : ''}</Text>
                  </Text>
                  {!!b.saat && <Text style={[s.balonSaat, { color: ben ? 'rgba(255,255,255,0.72)' : R.soluk }]}>{b.saat}</Text>}
                </View>
                {i === sonBen && <Text style={[s.goruldu, { color: R.soluk }]}>Görüldü</Text>}
              </View>
            );
          })}
        </View>
        <View style={[s.telAlt, { borderTopColor: R.ince }]}>
          <View style={[s.telGiris, { backgroundColor: R.gece ? '#1E1930' : '#FFFFFF', borderColor: R.ince }]}>
            <Text style={[s.telGirisYazi, { color: R.soluk }]}>Mesaj yaz…</Text>
          </View>
          <View style={[s.telMik, { backgroundColor: R.vurgu }]}>
            <Ikon ad="mikrofon" boyut={16} renk="#fff" />
          </View>
        </View>
        <View style={[s.kurgu, { backgroundColor: R.gece ? 'rgba(15,12,24,0.8)' : 'rgba(255,255,255,0.9)', borderColor: R.ince }]}>
          <Text style={[s.kurguYazi, { color: R.soluk }]}>kurgu</Text>
        </View>
      </View>
      {!!g.soru && <Text style={[s.soruAlt, { color: R.murekkep }]}>{g.soru}</Text>}
    </View>
  );
}

// Anket: dokunulabilir seçenekler; oy verince canlı yüzdeler (30 oydan azsa yüzde yerine "İlk oylayanlardan ol").
export function Anket({ g, kucuk }: { g: Gonderi; kucuk?: boolean }) {
  const R = useRenk();
  const c = useCanliEylem();
  const oylar = g.oylar ?? [];
  const toplam = oylar.reduce((a, b) => a + b, 0);
  const verdi = g.oyum != null;
  const yuzdeVar = verdi && toplam >= OY_ESIGI;
  return (
    <View style={{ gap: kucuk ? 7 : 9 }}>
      {kucuk && !!g.dizi && <DiziHap d={g.dizi} />}
      {!!g.soru && <Text style={[kucuk ? s.anketSoruKucuk : s.anketSoru, { color: R.murekkep }]}>{g.soru}</Text>}
      <View style={{ gap: kucuk ? 6 : 8, marginTop: 2 }}>
        {(g.secenekler ?? []).map((sec, i) => (
          <Secenek key={i} metin={sec} yuzde={toplam ? Math.round((oylar[i] * 100) / toplam) : 0} benim={g.oyum === i} verdi={verdi} yuzdeVar={yuzdeVar} enCok={yuzdeVar && oylar[i] === Math.max(...oylar)} onPress={() => !verdi && c.oy(g.id, i)} kucuk={kucuk} />
        ))}
      </View>
      <Text style={[s.anketAlt, { color: R.soluk }]}>{toplam >= OY_ESIGI ? `${toplam} oy` : verdi ? 'İlk oylayanlardansın ✓' : 'İlk oylayanlardan ol'}{toplam >= OY_ESIGI && !verdi ? ' · oy ver, sonucu gör' : ''}</Text>
      {!!g.dizi && <DiziSayac g={g} kucuk={kucuk} />}
    </View>
  );
}

function Secenek({ metin, yuzde, benim, verdi, yuzdeVar, enCok, onPress, kucuk }: { metin: string; yuzde: number; benim: boolean; verdi: boolean; yuzdeVar: boolean; enCok: boolean; onPress: () => void; kucuk?: boolean }) {
  const R = useRenk();
  const dolu = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(dolu, { toValue: yuzdeVar ? yuzde : benim ? 100 : 0, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [yuzdeVar, yuzde, benim]);
  const dolguRengi = benim ? (yuzdeVar ? R.vurguYumusak : R.vurguYumusak) : R.gece ? 'rgba(255,255,255,0.07)' : 'rgba(29,24,48,0.06)';
  return (
    <Pressable
      onPress={onPress}
      disabled={verdi}
      accessibilityRole="button"
      accessibilityLabel={metin}
      style={({ hovered, pressed }: { hovered?: boolean; pressed: boolean }) => [s.secenek, kucuk && { minHeight: 40 }, { borderColor: benim ? R.vurgu : verdi ? 'transparent' : R.cizgi, backgroundColor: verdi ? (R.gece ? 'rgba(255,255,255,0.025)' : 'rgba(29,24,48,0.025)') : hovered ? R.vurguYumusak : 'transparent' }, pressed && { transform: [{ scale: 0.985 }] }]}
    >
      {verdi && <Animated.View style={[s.secenekDolgu, { backgroundColor: dolguRengi, width: dolu.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }]} />}
      <View style={s.secenekIc}>
        {benim && (
          <View style={[s.secenekTik, { backgroundColor: R.vurgu }]}>
            <Ikon ad="tik" boyut={11} renk="#fff" kalinlik={3.4} />
          </View>
        )}
        <Text numberOfLines={2} style={[s.secenekYazi, kucuk && { fontSize: 14.5 }, { color: R.murekkep }, (benim || enCok) && { fontFamily: yazi.kalin }]}>{metin}</Text>
        {yuzdeVar && <Text style={[s.secenekYuzde, { color: benim ? R.vurgu : R.murekkep }]}>%{yuzde}</Text>}
      </View>
    </Pressable>
  );
}

// Açık soru: büyük soru kartı + Cevapla.
function Soru({ g, R, ac }: { g: Gonderi; R: Renk; ac: (yaz?: boolean) => void }) {
  const zemin = karistir(R.vurgu, R.panel, R.gece ? 0.1 : 0.06);
  return (
    <View style={[s.soru, { backgroundColor: zemin, borderColor: saydam(R.vurgu, R.gece ? 0.28 : 0.18) }]}>
      <Text style={[s.soruEtiket, { color: R.kalem }]}>bugünün sorusu</Text>
      <Text style={[s.soruYazi, { color: R.murekkep }]}>{g.soru ?? g.metin}</Text>
      <View style={s.soruAltSatir}>
        <View style={s.yuzYigin}>
          {['kahkaha', 'utangac', 'goz'].map((y, i) => (
            <View key={y} style={[s.yuzYiginOge, { marginLeft: i ? -9 : 0 }]}>
              <YuzBalon ad={y} boyut={26} />
            </View>
          ))}
          <Text style={[s.soruSayi, { color: R.soluk }]}>{g.yorum ? `${g.yorum} cevap` : 'İlk cevap senden'}</Text>
        </View>
        <Bas onPress={() => ac(true)} style={[s.cevapla, { backgroundColor: R.vurgu }]}>
          <Ikon ad="kalem" boyut={14} renk="#fff" kalinlik={2.4} />
          <Text style={s.cevaplaYazi}>Cevapla</Text>
        </Bas>
      </View>
    </View>
  );
}

// Eylemler: beğeni (iyimser + zıplama), yorum, paylaş.
function Eylemler({ g, ac }: { g: Gonderi; ac: (yaz?: boolean) => void }) {
  const R = useRenk();
  const c = useCanliEylem();
  const olcek = useRef(new Animated.Value(1)).current;
  const ilk = useRef(true);
  useEffect(() => {
    if (ilk.current) {
      ilk.current = false;
      return;
    }
    if (g.begendim) {
      olcek.setValue(0.6);
      Animated.spring(olcek, { toValue: 1, friction: 3.2, tension: 220, useNativeDriver: YEREL_SURUCU }).start();
    }
  }, [g.begendim]);
  return (
    <View style={s.eylemler}>
      <Bas onPress={() => c.begen(g.id)} etiket={g.begendim ? 'Beğenmekten vazgeç' : 'Beğen'} style={s.eylem} hoverRenk={R.gece ? 'rgba(255,77,125,0.12)' : 'rgba(232,51,106,0.08)'} hitSlop={{ top: 6, bottom: 6 }}>
        <Animated.View style={{ transform: [{ scale: olcek }] }}>
          <Ikon ad="kalp" boyut={20} renk={g.begendim ? R.kalp : R.soluk} dolu={g.begendim} />
        </Animated.View>
        <Rakam n={g.begeni} renk={g.begendim ? R.kalp : R.soluk} />
      </Bas>
      <Bas onPress={() => ac(true)} etiket="Yorum yap" style={s.eylem} hoverRenk={R.vurguYumusak} hitSlop={{ top: 6, bottom: 6 }}>
        <Ikon ad="yorum" boyut={20} renk={R.soluk} />
        <Rakam n={g.yorum} renk={R.soluk} />
      </Bas>
      {/* Yeniden paylaş (#5): marka içeriğinde (sunucu "yeniden" alanını verir) Paylaş bir menü açar: Akışımda paylaş / Bağlantıyı paylaş. */}
      <Bas onPress={() => (g.yeniden !== undefined ? c.paylasAc({ tur: 'gonderi', g }) : c.paylas(g))} etiket={g.yeniden ? `Paylaş, ${g.yeniden} kişi akışında paylaştı` : 'Paylaş'} style={s.eylem} hoverRenk={R.vurguYumusak} hitSlop={{ top: 6, bottom: 6 }}>
        <Ikon ad="paylas" boyut={19} renk={R.soluk} />
        {!!g.yeniden && (
          <View style={s.yenidenSayi}>
            <Ikon ad="yeniden" boyut={15} renk={g.yenidenBen ? R.vurgu : R.soluk} kalinlik={2.2} />
            <Rakam n={g.yeniden} renk={g.yenidenBen ? R.vurgu : R.soluk} boyut={13} />
          </View>
        )}
      </Bas>
    </View>
  );
}

function EnIyi({ g, ac }: { g: Gonderi; ac: () => void }) {
  const R = useRenk();
  const y = g.enIyi!;
  const yazar = { uid: y.marka ? 'marka' : y.ad, ad: y.ad, marka: !!y.marka, yuz: y.yuz, kurucu: !!y.kurucu, balon: y.balon };
  return (
    <Bas onPress={ac} style={[s.enIyi, { backgroundColor: R.gece ? 'rgba(255,255,255,0.04)' : 'rgba(29,24,48,0.035)' }]} hoverRenk={R.gece ? 'rgba(255,255,255,0.07)' : 'rgba(29,24,48,0.06)'}>
      <Avatar yazar={yazar} boyut={22} />
      <Text style={[s.enIyiYazi, { color: R.murekkep }]} numberOfLines={2}>
        <Text style={{ fontFamily: yazi.kalin }}>{y.marka ? 'Yazsam mı?' : y.ad}</Text>
        {'  '}
        {y.metin}
      </Text>
      {g.yorum > 1 && <Text style={[s.enIyiSayi, { color: R.soluk }]}>+{g.yorum - 1}</Text>}
    </Bas>
  );
}

// Yeniden paylaşım (#5): gönderinin içinde gömülü orijinal marka kartı. Dokununca orijinal gönderiye gider (onizleme: paylaşım penceresinde yalnız gösterim).
// Orijinal silindi/gizlendiyse "Bu gönderi kaldırıldı". İçerik türüne göre küçük gösterim: tespit (renkli), sohbet (mini telefon), anket (seçenekler), soru, video (kapak), cevap.
export function AlintiKart({ a, onizleme }: { a: Alinti; onizleme?: boolean }) {
  const R = useRenk();
  const c = useCanliEylem();
  const zemin = R.gece ? 'rgba(255,255,255,0.035)' : 'rgba(29,24,48,0.025)';
  if (a.durum !== 'var' || !a.icerik)
    return (
      <View style={[s.alinti, s.alintiYok, { borderColor: R.cizgi }]}>
        <Ikon ad="engel" boyut={18} renk={R.soluk} kalinlik={2} />
        <Text style={[s.alintiYokYazi, { color: R.soluk }]}>Bu gönderi kaldırıldı</Text>
      </View>
    );
  const g = a.icerik;
  const yorum = a.tur === 'yorum';
  const git = () => !onizleme && a.gonderi && c.git({ tur: 'gonderi', id: a.gonderi });
  return (
    <Pressable
      onPress={git}
      disabled={!!onizleme}
      accessibilityRole={onizleme ? undefined : 'link'}
      accessibilityLabel={onizleme ? undefined : yorum ? 'Yazsam mı? cevabına git' : 'Yazsam mı? gönderisine git'}
      style={({ hovered, pressed }: { hovered?: boolean; pressed: boolean }) => [s.alinti, { borderColor: hovered && !onizleme ? R.cizgi : R.ince, backgroundColor: hovered && !onizleme ? (R.gece ? 'rgba(255,255,255,0.06)' : 'rgba(29,24,48,0.045)') : zemin }, pressed && !onizleme && { opacity: 0.85 }]}
    >
      <View style={s.alintiUst}>
        <Avatar yazar={{ uid: 'marka', ad: 'yazsammi', marka: true }} boyut={22} />
        <Text numberOfLines={1} style={[s.alintiAd, { color: R.murekkep }]}>Yazsam mı?</Text>
        <Rozet boyut={14} />
        {!!a.zaman && <Text numberOfLines={1} style={[s.alintiZaman, { color: R.soluk }]}>· {zamanOnce(a.zaman)}</Text>}
        {yorum && <Text style={[s.alintiEtiket, { color: R.vurgu, backgroundColor: R.vurguYumusak }]}>cevap</Text>}
      </View>
      {yorum ? (
        <View style={{ gap: 4 }}>
          {!!a.yanitAd && <Text numberOfLines={1} style={[s.alintiYanit, { color: R.soluk }]}>{'↪ '}@{a.yanitAd} kişisine</Text>}
          <Text style={[s.alintiMetin, { color: R.murekkep }]} numberOfLines={onizleme ? 6 : 5}>{g.metin}</Text>
        </View>
      ) : (
        <AlintiGovde g={g} R={R} onizleme={!!onizleme} />
      )}
    </Pressable>
  );
}

function AlintiGovde({ g, R, onizleme }: { g: Gonderi; R: Renk; onizleme: boolean }) {
  switch (g.tur) {
    case 'sohbet': {
      const b = (g.balonlar ?? []).slice(0, 4);
      const kisi = g.kisi || kisiTahmin(g);
      return (
        <View style={{ gap: 8 }}>
          <View style={[s.mTel, { backgroundColor: R.gece ? '#0F0C18' : '#EEE9F7', borderColor: R.ince }]}>
            <Text numberOfLines={1} style={[s.mKisi, { color: R.soluk }]}>{kisi}</Text>
            {b.map((x, i) => {
              const ben = x.kim === 'ben';
              return (
                <View key={i} style={{ alignItems: ben ? 'flex-end' : 'flex-start', marginTop: i && b[i - 1].kim === x.kim ? 2 : 6 }}>
                  <View style={[s.mBalon, { backgroundColor: ben ? R.vurgu : R.gece ? '#272140' : '#FFFFFF' }]}>
                    <Text style={[s.mBalonYazi, { color: ben ? '#fff' : R.murekkep }]} numberOfLines={3}>{x.metin}</Text>
                  </View>
                </View>
              );
            })}
          </View>
          {!!g.soru && <Text style={[s.alintiSoru, { color: R.murekkep }]} numberOfLines={2}>{g.soru}</Text>}
        </View>
      );
    }
    case 'anket':
      return (
        <View style={{ gap: 8 }}>
          <Text style={[s.alintiSoru, { color: R.murekkep }]} numberOfLines={3}>{g.soru}</Text>
          <View style={{ gap: 6 }}>
            {(g.secenekler ?? []).slice(0, 4).map((x, i) => (
              <View key={i} style={[s.mSecenek, { borderColor: R.cizgi }]}>
                <Text numberOfLines={1} style={[s.mSecenekYazi, { color: R.murekkep }]}>{x}</Text>
              </View>
            ))}
          </View>
        </View>
      );
    case 'soru':
      return (
        <View style={{ gap: 4 }}>
          <Text style={[s.mSoruEtiket, { color: R.kalem }]}>bugünün sorusu</Text>
          <Text style={[s.alintiSoruBuyuk, { color: R.murekkep }]} numberOfLines={4}>{g.soru ?? g.metin}</Text>
        </View>
      );
    case 'video':
      return (
        <View style={{ gap: 8 }}>
          {!!g.metin && <Text style={[s.alintiMetin, { color: R.murekkep }]} numberOfLines={3}>{g.metin}</Text>}
          {!!g.kapak && (
            <View style={[s.mKapak, { backgroundColor: R.ust }]}>
              <Image source={{ uri: g.kapak }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors />
              <View style={s.mOynat}>
                <Ikon ad="ok" boyut={20} renk="#fff" kalinlik={2.6} />
              </View>
            </View>
          )}
        </View>
      );
    default:
      if (g.tespit && g.metin) {
        const renk = TESPIT_RENKLERI[karma(g.id) % TESPIT_RENKLERI.length];
        return (
          <LinearGradient colors={renk} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.mTespit}>
            <Text style={s.mTespitUst}>tespit</Text>
            <Text style={s.mTespitYazi} numberOfLines={onizleme ? 6 : 5}>{g.metin}</Text>
            <View style={s.mTespitYuz}>
              <MarkaBalon ad="kikir" boyut={52} />
            </View>
          </LinearGradient>
        );
      }
      return <Text style={[s.alintiMetin, { color: R.murekkep }]} numberOfLines={onizleme ? 8 : 6}>{g.metin}</Text>;
  }
}

// Yükleniyor iskeleti.
export function Iskelet() {
  const R = useRenk();
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const d = Animated.loop(Animated.sequence([Animated.timing(a, { toValue: 1, duration: 800, useNativeDriver: YEREL_SURUCU }), Animated.timing(a, { toValue: 0, duration: 800, useNativeDriver: YEREL_SURUCU })]));
    d.start();
    return () => d.stop();
  }, []);
  const k = R.gece ? 'rgba(255,255,255,0.07)' : 'rgba(29,24,48,0.07)';
  return (
    <Animated.View style={{ opacity: a.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }) }}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[s.kart, { borderBottomColor: R.ince }]}>
          <View style={[{ width: 42, height: 42, borderRadius: 21, backgroundColor: k }]} />
          <View style={[s.sag, { gap: 10 }]}>
            <View style={{ width: 140, height: 13, borderRadius: 7, backgroundColor: k }} />
            <View style={{ width: '92%', height: 13, borderRadius: 7, backgroundColor: k }} />
            <View style={{ width: '70%', height: 13, borderRadius: 7, backgroundColor: k }} />
            {i === 0 && <View style={{ width: '100%', height: 150, borderRadius: 20, backgroundColor: k, marginTop: 4 }} />}
          </View>
        </View>
      ))}
    </Animated.View>
  );
}

const golge = Platform.OS === 'web' ? ({ boxShadow: '0 10px 30px rgba(20,10,60,0.18)' } as any) : { elevation: 3 };

const s = StyleSheet.create({
  kart: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6, borderBottomWidth: 1 },
  kutu: { borderWidth: 1, borderBottomWidth: 1, borderRadius: 24, paddingTop: 16, paddingBottom: 8 },
  balonYuva: { width: 38, height: 40, justifyContent: 'center' },
  balonIc: { marginLeft: -8.5, marginVertical: -7 },
  sag: { flex: 1, minWidth: 0, gap: 10 },
  ust: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: -2, minHeight: 40 },
  ustSol: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  adSatir: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  markaAlt: { fontFamily: yazi.normal, fontSize: 12.5, marginTop: 1 },
  zaman: { fontFamily: yazi.normal, fontSize: 14.5, flexShrink: 0 },
  nokta: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: -6 },
  inceleme: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  incelemeYazi: { fontFamily: yazi.orta, fontSize: 12.5 },
  metin: { fontFamily: yazi.normal, fontSize: 16, lineHeight: 23, marginTop: -4 },
  haber: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, paddingTop: 11, paddingBottom: 10, gap: 7 },
  haberUst: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  haberEtiket: { fontFamily: yazi.kalin, fontSize: 10.5, letterSpacing: 0.9, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, overflow: 'hidden' },
  haberKaynak: { fontFamily: yazi.orta, fontSize: 12.5, flexShrink: 1 },
  haberBaslik: { fontFamily: yazi.kalin, fontSize: 15.5, lineHeight: 21, letterSpacing: -0.25 },
  haberAlt: { flexDirection: 'row', justifyContent: 'flex-end' },
  haberGit: { fontFamily: yazi.kalin, fontSize: 13.5 },
  tribunBaslik: { fontFamily: yazi.kalin, fontSize: 17.5, letterSpacing: -0.4, lineHeight: 23, marginTop: -4 },
  tribunGir: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 15, height: 36 },
  tribunGirYazi: { fontFamily: yazi.kalin, fontSize: 14 },

  tespit: { borderRadius: 22, padding: 22, paddingBottom: 18, minHeight: 190, overflow: 'hidden', justifyContent: 'space-between', gap: 10, ...golge },
  tespitIsik: { position: 'absolute', width: 260, height: 260, borderRadius: 130, top: -120, left: -60 },
  tespitUst: { fontFamily: yazi.kalem, fontSize: 25, color: 'rgba(255,255,255,0.92)', transform: [{ rotate: '-3deg' }], alignSelf: 'flex-start', marginTop: -6 },
  tespitYazi: { fontFamily: yazi.kalin, fontSize: 25, lineHeight: 30, letterSpacing: -0.8, color: '#fff', paddingRight: 34 },
  tespitAlt: { flexDirection: 'row', alignItems: 'center' },
  tespitImza: { fontFamily: yazi.marka, fontSize: 11, color: 'rgba(255,255,255,0.75)', letterSpacing: -0.2 },
  tespitYuz: { position: 'absolute', right: -14, bottom: -16, transform: [{ rotate: '-10deg' }] },

  telefon: { borderRadius: 24, borderWidth: 1, overflow: 'hidden', maxWidth: 400, width: '100%' },
  telUst: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 9, borderBottomWidth: 1 },
  telAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  telHarf: { color: '#fff', fontFamily: yazi.kalin, fontSize: 15 },
  telAd: { fontFamily: yazi.kalin, fontSize: 14.5 },
  telDurum: { fontFamily: yazi.normal, fontSize: 11.5, marginTop: -1 },
  telGovde: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 12 },
  telGun: { alignSelf: 'center', fontFamily: yazi.orta, fontSize: 11, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, overflow: 'hidden', marginBottom: 2 },
  balon: { maxWidth: '82%', borderRadius: 18, paddingHorizontal: 12, paddingTop: 7, paddingBottom: 7 },
  balonYazi: { fontFamily: yazi.normal, fontSize: 15, lineHeight: 20 },
  balonBosluk: { fontSize: 11 },
  balonSaat: { position: 'absolute', right: 10, bottom: 5, fontFamily: yazi.normal, fontSize: 10.5 },
  goruldu: { fontFamily: yazi.orta, fontSize: 11, marginTop: 3, marginRight: 4 },
  telAlt: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 8, borderTopWidth: 1 },
  telGiris: { flex: 1, borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 7 },
  telGirisYazi: { fontFamily: yazi.normal, fontSize: 13.5 },
  telMik: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  kurgu: { position: 'absolute', top: 58, right: 10, borderRadius: 999, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 2 },
  kurguYazi: { fontFamily: yazi.kalem, fontSize: 15 },
  soruAlt: { fontFamily: yazi.kalin, fontSize: 17.5, letterSpacing: -0.3 },

  anketSoru: { fontFamily: yazi.orta, fontSize: 16.5, lineHeight: 23, marginTop: -4 },
  anketSoruKucuk: { fontFamily: yazi.kalin, fontSize: 15.5, lineHeight: 21 },
  anketAlt: { fontFamily: yazi.normal, fontSize: 13.5, marginTop: 2 },
  secenek: { minHeight: 46, borderRadius: 14, borderWidth: 1.5, overflow: 'hidden', justifyContent: 'center' },
  secenekDolgu: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 12 },
  secenekIc: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 14, paddingVertical: 10 },
  secenekTik: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  secenekYazi: { flex: 1, fontFamily: yazi.orta, fontSize: 15.5 },
  secenekYuzde: { fontFamily: yazi.kalin, fontSize: 15, fontVariant: ['tabular-nums'] },

  soru: { borderRadius: 22, borderWidth: 1, padding: 20, gap: 12 },
  soruEtiket: { fontFamily: yazi.kalem, fontSize: 22, transform: [{ rotate: '-2deg' }], alignSelf: 'flex-start', marginTop: -4, marginBottom: -4 },
  soruYazi: { fontFamily: yazi.kalin, fontSize: 26, lineHeight: 31, letterSpacing: -0.8 },
  soruAltSatir: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 4 },
  yuzYigin: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  yuzYiginOge: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  soruSayi: { fontFamily: yazi.orta, fontSize: 13.5, marginLeft: 8 },
  cevapla: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingVertical: 9, paddingHorizontal: 16 },
  cevaplaYazi: { color: '#fff', fontFamily: yazi.kalin, fontSize: 14.5 },


  eylemler: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: -9, marginTop: 0 },
  eylem: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 7, borderRadius: 999, minWidth: 44 },
  alinti: { borderWidth: 1, borderRadius: 18, padding: 12, gap: 9, overflow: 'hidden' },
  alintiYok: { flexDirection: 'row', alignItems: 'center', gap: 10, borderStyle: 'dashed', paddingVertical: 15, paddingHorizontal: 14 },
  alintiYokYazi: { fontFamily: yazi.orta, fontSize: 14.5 },
  alintiUst: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  alintiAd: { fontFamily: yazi.kalin, fontSize: 14, letterSpacing: -0.2, flexShrink: 1 },
  alintiZaman: { fontFamily: yazi.normal, fontSize: 13, flexShrink: 0 },
  alintiEtiket: { fontFamily: yazi.orta, fontSize: 11, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1, overflow: 'hidden', marginLeft: 2 },
  alintiYanit: { fontFamily: yazi.normal, fontSize: 12.5 },
  alintiMetin: { fontFamily: yazi.normal, fontSize: 15.5, lineHeight: 22 },
  alintiSoru: { fontFamily: yazi.kalin, fontSize: 15.5, lineHeight: 21, letterSpacing: -0.2 },
  alintiSoruBuyuk: { fontFamily: yazi.kalin, fontSize: 20, lineHeight: 25, letterSpacing: -0.5 },
  mTel: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 10, paddingTop: 8, paddingBottom: 10 },
  mKisi: { fontFamily: yazi.orta, fontSize: 11.5, textAlign: 'center', marginBottom: 2 },
  mBalon: { maxWidth: '84%', borderRadius: 15, paddingHorizontal: 10, paddingVertical: 5 },
  mBalonYazi: { fontFamily: yazi.normal, fontSize: 14, lineHeight: 18.5 },
  mSecenek: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9 },
  mSecenekYazi: { fontFamily: yazi.orta, fontSize: 14.5 },
  mSoruEtiket: { fontFamily: yazi.kalem, fontSize: 19, transform: [{ rotate: '-2deg' }], alignSelf: 'flex-start' },
  mKapak: { width: '100%', aspectRatio: 16 / 10, borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  mOynat: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(10,8,20,0.55)', alignItems: 'center', justifyContent: 'center' },
  mTespit: { borderRadius: 16, paddingHorizontal: 15, paddingTop: 10, paddingBottom: 14, overflow: 'hidden', gap: 2 },
  mTespitUst: { fontFamily: yazi.kalem, fontSize: 20, color: 'rgba(255,255,255,0.92)', transform: [{ rotate: '-3deg' }], alignSelf: 'flex-start' },
  mTespitYazi: { fontFamily: yazi.kalin, fontSize: 19, lineHeight: 24, letterSpacing: -0.5, color: '#fff', paddingRight: 36 },
  mTespitYuz: { position: 'absolute', right: -10, bottom: -12, transform: [{ rotate: '-10deg' }] },
  yenidenSayi: { flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 3 },
  yenidenEtiket: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -2, marginBottom: -2 },
  yenidenEtiketYazi: { fontFamily: yazi.orta, fontSize: 13 },
  enIyi: { flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 8, marginTop: -2 },
  enIyiYazi: { flex: 1, fontFamily: yazi.normal, fontSize: 14, lineHeight: 19 },
  enIyiSayi: { fontFamily: yazi.orta, fontSize: 12.5 },
});
