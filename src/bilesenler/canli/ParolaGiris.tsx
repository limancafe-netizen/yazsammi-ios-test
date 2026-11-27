// Parolalı giriş / üye ol (Onur 18.11): giriş penceresindeki (ve zorunlu kapıdaki) e-posta yolu. İki AÇIK seçenek: "Giriş yap" (varsayılan) ve "Üye ol".
// E-posta onayı YOK: üye ol = e-posta + parola (takma ad adımı sonra) → doğrudan içeri; giriş yap = e-posta + parola → doğrudan içeri.
// E-posta bağlantısı yalnız "Parolamı unuttum" ve parolası olmayan ESKİ e-posta üyesinin ilk parolası için (bağlantıdaki sayfada belirlenir; hesap aynen kalır).
// Sunucu: eposta_giris.mjs (/c/eposta/kayit, /giris, /parola-iste). Web karşılığı (statik bölümler): site/uyelik/uyelik.js (adimGiris).
import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { yazi } from '@/tema/tema';
import * as C from '@/canli';
import type { Uye } from '@/canli';
import { Bas, Dugme, useRenk } from './ortak';

const EPOSTA_KALIP = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const YENIDEN_BEKLEME = 60; // sn
type Mod = 'giris' | 'uye';
type Baglanti = null | { tur: 'belirle' | 'yenile'; gitti: boolean }; // parola bağlantısı ekranı: gitmeden önce (gitti:false) / gittikten sonra (gitti:true)

export function ParolaGiris({ bitti, baslangic }: { bitti: (u: Uye) => void; baslangic?: Mod }) {
  const R = useRenk();
  const [mod, modAyarla] = useState<Mod>(baslangic ?? 'giris');
  const [e, eAyarla] = useState('');
  const [p, pAyarla] = useState('');
  const [goster, gosterAyarla] = useState(false);
  const [hata, hataAyarla] = useState('');
  const [ipucu, ipucuAyarla] = useState<null | 'uyeOl' | 'girisYap'>(null); // hata altında tek dokunuşluk yönlendirme
  const [gidiyor, gidiyorAyarla] = useState(false);
  const [baglanti, baglantiAyarla] = useState<Baglanti>(null);
  const [sayac, sayacAyarla] = useState(0);
  const kilit = useRef(false);
  const pRef = useRef<TextInput>(null);
  const webSiz = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null;
  const adres = e.trim();
  const adresTamam = EPOSTA_KALIP.test(adres);
  const hazir = adresTamam && (mod === 'giris' ? p.length > 0 : p.length >= 8) && !gidiyor;

  useEffect(() => {
    if (sayac <= 0) return;
    const z = setTimeout(() => sayacAyarla((x) => x - 1), 1000);
    return () => clearTimeout(z);
  }, [sayac]);

  const temizle = () => {
    hataAyarla('');
    ipucuAyarla(null);
  };
  const modDegis = (m: Mod) => {
    modAyarla(m);
    temizle();
  };

  const gonder = async () => {
    if (kilit.current || !hazir) return;
    kilit.current = true;
    gidiyorAyarla(true);
    temizle();
    const r = mod === 'giris' ? await C.epostaGirisParola(adres, p) : await C.epostaKayit(adres, p);
    kilit.current = false;
    gidiyorAyarla(false);
    if (r.ok) return bitti(r.veri);
    if (mod === 'giris' && r.hata === 'parola_yok') {
      // Eski e-posta üyesi: parolası yok → tek seferlik bağlantıyla belirler, aynı hesaba girer (yeni boş hesap açılmaz).
      baglantiAyarla({ tur: 'belirle', gitti: false });
      return;
    }
    if (mod === 'giris' && r.hata === 'kayit_yok') {
      hataAyarla('Bu e-postayla kayıt bulunamadı. Google ya da Apple ile girdiysen yukarıdaki düğmeyi kullan; yeniysen üye ol.');
      ipucuAyarla('uyeOl');
      return;
    }
    if (mod === 'uye' && r.hata === 'eposta_kayitli') {
      hataAyarla('Bu e-posta zaten üye. Giriş yap; parolan yoksa “Parolamı unuttum” ile bağlantı iste.');
      ipucuAyarla('girisYap');
      return;
    }
    hataAyarla(C.hataYazisi(r.hata, r.durum));
  };

  const baglantiGonder = async () => {
    if (kilit.current || !baglanti || !adresTamam) return;
    kilit.current = true;
    gidiyorAyarla(true);
    hataAyarla('');
    const r = await C.parolaIste(adres);
    kilit.current = false;
    gidiyorAyarla(false);
    if (!r.ok) return hataAyarla(C.hataYazisi(r.hata, r.durum));
    if (r.veri?.yogun) return hataAyarla(C.YOGUN_YAZI);
    baglantiAyarla({ tur: baglanti.tur, gitti: true });
    sayacAyarla(YENIDEN_BEKLEME);
  };

  // --- Parola bağlantısı ekranı (parolamı unuttum / eski üye ilk parola) ---
  if (baglanti) {
    const belirle = baglanti.tur === 'belirle';
    return (
      <View style={s.form}>
        <Text style={[s.baslik, { color: R.murekkep }]}>{baglanti.gitti ? 'E-postana bak.' : belirle ? 'Parolan yok, bir kez belirle.' : 'Parolanı yenile.'}</Text>
        <View style={[s.adres, { backgroundColor: R.ust, borderColor: R.ince }]}>
          <Text style={[s.adresYazi, { color: R.murekkep }]} numberOfLines={1}>{adres}</Text>
        </View>
        <Text style={[s.bilgi, { color: R.soluk }]}>
          {baglanti.gitti
            ? 'Bir bağlantı gönderdik. Bağlantıdaki sayfada parolanı belirle, sonra buraya dönüp e-postan ve yeni parolanla giriş yap.'
            : belirle
              ? 'Hesabın parolasız açılmıştı. E-postana tek seferlik bir bağlantı göndereceğiz; parolanı belirle. Takma adın ve içeriklerin olduğu gibi kalır.'
              : 'E-postana bir bağlantı göndereceğiz. Bağlantıdaki sayfada yeni parolanı belirle, sonra buraya dönüp giriş yap.'}
        </Text>
        {!!hata && <Text style={[s.hata, { color: R.kalem }]}>{hata}</Text>}
        {baglanti.gitti ? (
          <>
            <Dugme yazi="Giriş yap" tur="acik" onPress={() => { baglantiAyarla(null); modAyarla('giris'); pAyarla(''); temizle(); }} />
            <Dugme yazi={gidiyor ? 'Gönderiyorum…' : sayac > 0 ? `Yeniden gönder (${sayac})` : 'Yeniden gönder'} tur="cizgi" kucuk devre={sayac > 0 || gidiyor} onPress={baglantiGonder} />
            <Text style={[s.not, { color: R.soluk }]}>Gelmediyse gereksiz (spam) klasörüne de bak.</Text>
          </>
        ) : (
          <Dugme yazi={gidiyor ? 'Gönderiyorum…' : 'Bağlantıyı gönder'} tur="acik" devre={gidiyor} onPress={baglantiGonder} />
        )}
        <Bas onPress={() => { baglantiAyarla(null); temizle(); }} etiket="Geri dön" style={s.ikinci}>
          <Text style={[s.ikinciYazi, { color: R.soluk }]}>Geri dön</Text>
        </Bas>
      </View>
    );
  }

  const sekme = (m: Mod, yaziMetin: string) => {
    const secili = mod === m;
    return (
      <Bas key={m} onPress={() => modDegis(m)} etiket={yaziMetin} rol="tab" secili={secili} style={[s.sekme, { borderColor: secili ? R.murekkep : R.cizgi, backgroundColor: secili ? R.murekkep : 'transparent' }]}>
        <Text style={[s.sekmeYazi, { color: secili ? R.sis : R.murekkep }]}>{yaziMetin}</Text>
      </Bas>
    );
  };

  return (
    <View style={s.form}>
      <View style={s.sekmeler} accessibilityRole="tablist">
        {sekme('giris', 'Giriş yap')}
        {sekme('uye', 'Üye ol')}
      </View>
      <TextInput
        value={e}
        onChangeText={(t) => {
          eAyarla(t.replace(/\s/g, '').slice(0, 254));
          if (hata) temizle();
        }}
        placeholder="ornek@eposta.com"
        placeholderTextColor={R.soluk}
        keyboardType="email-address"
        inputMode="email"
        autoComplete="email"
        textContentType="emailAddress"
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        returnKeyType="next"
        onSubmitEditing={() => pRef.current?.focus()}
        accessibilityLabel="E-posta adresin"
        style={[s.alan, { color: R.murekkep, borderColor: hata ? R.kalem : R.cizgi, backgroundColor: R.ust }, webSiz]}
      />
      <View style={[s.parolaSatir, { borderColor: hata ? R.kalem : R.cizgi, backgroundColor: R.ust }]}>
        <TextInput
          ref={pRef}
          value={p}
          onChangeText={(t) => {
            pAyarla(t.slice(0, 128));
            if (hata) temizle();
          }}
          placeholder={mod === 'uye' ? 'Parola (en az 8 karakter)' : 'Parola'}
          placeholderTextColor={R.soluk}
          secureTextEntry={!goster}
          autoComplete={mod === 'uye' ? 'new-password' : 'current-password'}
          textContentType={mod === 'uye' ? 'newPassword' : 'password'}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          returnKeyType="go"
          onSubmitEditing={gonder}
          accessibilityLabel="Parolan"
          style={[s.parolaYazi, { color: R.murekkep }, webSiz]}
        />
        <Bas onPress={() => gosterAyarla((x) => !x)} etiket={goster ? 'Parolayı gizle' : 'Parolayı göster'} style={s.goster}>
          <Text style={[s.gosterYazi, { color: R.soluk }]}>{goster ? 'Gizle' : 'Göster'}</Text>
        </Bas>
      </View>
      {!!hata && <Text style={[s.hata, { color: R.kalem }]}>{hata}</Text>}
      {ipucu === 'uyeOl' && <Dugme yazi="Üye ol" tur="cizgi" kucuk onPress={() => modDegis('uye')} />}
      {ipucu === 'girisYap' && <Dugme yazi="Giriş yap" tur="cizgi" kucuk onPress={() => modDegis('giris')} />}
      <Dugme yazi={gidiyor ? 'Bir saniye…' : mod === 'giris' ? 'Giriş yap' : 'Üye ol'} tur="acik" devre={!hazir} onPress={gonder} />
      {mod === 'giris' ? (
        <Bas onPress={() => { temizle(); baglantiAyarla({ tur: 'yenile', gitti: false }); }} etiket="Parolamı unuttum" style={s.ikinci}>
          <Text style={[s.ikinciYazi, { color: R.soluk }]}>Parolamı unuttum</Text>
        </Bas>
      ) : (
        <Text style={[s.not, { color: R.soluk }]}>E-posta onayı yok: e-posta ve parolanla hemen içeri girersin. Adresin yalnız giriş ve parola yenileme için saklanır.</Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  form: { alignSelf: 'stretch', gap: 10, paddingHorizontal: 6 },
  sekmeler: { flexDirection: 'row', gap: 8 },
  sekme: { flex: 1, borderWidth: 1.5, borderRadius: 999, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  sekmeYazi: { fontFamily: yazi.orta, fontSize: 15.5 },
  alan: { borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 12, fontFamily: yazi.orta, fontSize: 16.5 },
  parolaSatir: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 999, paddingLeft: 18, paddingRight: 8 },
  parolaYazi: { flex: 1, paddingVertical: 12, fontFamily: yazi.orta, fontSize: 16.5, minWidth: 0 },
  goster: { paddingVertical: 8, paddingHorizontal: 10 },
  gosterYazi: { fontFamily: yazi.orta, fontSize: 14, textDecorationLine: 'underline' },
  hata: { fontFamily: yazi.orta, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  not: { fontFamily: yazi.normal, fontSize: 12.5, lineHeight: 18, textAlign: 'center' },
  baslik: { fontFamily: yazi.kalin, fontSize: 21, letterSpacing: -0.4, textAlign: 'center' },
  adres: { alignSelf: 'center', maxWidth: '100%', borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 6 },
  adresYazi: { fontFamily: yazi.orta, fontSize: 15 },
  bilgi: { fontFamily: yazi.normal, fontSize: 14.5, lineHeight: 21, textAlign: 'center', paddingHorizontal: 6 },
  ikinci: { alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 14 },
  ikinciYazi: { fontFamily: yazi.orta, fontSize: 14.5, textDecorationLine: 'underline' },
});
