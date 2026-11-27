// Anlık bildirim köprüsü (uygulamada bir kez, CanliSaglayici içinde çizilir):
//  - nazik kart (1.9): yalnız "iyi anda" (figür sohbeti bitip çıkılırken / oyunda bölüm kazanılınca; açılışta ve menüde DEĞİL). "Evet" denirse sistem izni istenir; "Daha sonra" 3 gün sorulmaz; en çok 3 kez; oturumda 1 kez
//  - izin varsa cihaz jetonunu sunucuya bağlar; çıkışta siler (kayit.ts)
//  - bildirime dokunuş → mevcut git() yönlendirmesi (gönderi / profil / mesajlar)
//  - iOS simge rozeti = okunmamış zil sayısı
// Sitede ve (google-services.json yoksa) Android'de hiçbir şey çizilmez.
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Modal, StyleSheet, Text, View } from 'react-native';
import * as C from '@/canli';
import { useCanli } from '@/bilesenler/canli/baglam';
import { Dugme, useRenk } from '@/bilesenler/canli/ortak';
import { YuzBalon } from '@/bilesenler/canli/balon';
import { yazi } from '@/tema/tema';
import { PUSH_DESTEK, izinDurumu, izinIste, rozetAyarla, useSonDokunma } from './push';
import { dokunmaEkrani, izinKarari, kartKarari } from './mantik';
import { izinKaydiYaz, jetonuKaydet, kartKaydiOku, kartKaydiYaz } from './kayit';
import { iyiAnDinle } from './iyiAn';

let islenenDokunma = '';
let sonKayit = 0;
let oturumdaGosterildi = false;

export function BildirimKopru() {
  return PUSH_DESTEK ? <Kopru /> : null;
}

function Kopru() {
  const c = useCanli();
  const R = useRenk();
  const girisli = !!c.uye && !c.uye.yeni && !c.uye.sozGerekli && C.oturumVar();
  const [sor, sorAyarla] = useState(false);
  const girisliRef = useRef(girisli);
  girisliRef.current = girisli;

  const yokla = useCallback(async () => {
    if (!girisliRef.current) return;
    const k = izinKarari(await izinDurumu(), '', true);
    if (k === 'kaydet' && Date.now() - sonKayit > 6 * 3600000) {
      sonKayit = Date.now();
      jetonuKaydet();
    }
  }, []);
  // "İyi an": kart yalnız buradan çıkar (Kahin okuması bitip çıkılırken; oyun bölüm kazanma tetikleyicisi iyiAnBildir() çağırır)
  useEffect(
    () =>
      iyiAnDinle(() => {
        setTimeout(async () => {
          if (!kartKarari(await izinDurumu(), kartKaydiOku(), Date.now(), oturumdaGosterildi, true)) return;
          oturumdaGosterildi = true;
          const k = kartKaydiOku();
          kartKaydiYaz({ n: k.n + 1, son: Date.now() });
          sorAyarla(true);
        }, 700);
      }),
    [],
  );
  // Girişten birkaç saniye sonra yalnız jeton yoklanır (izin zaten varsa kaydedilir); uygulama öne gelince de (ayarlardan izin açılmış olabilir)
  useEffect(() => {
    if (!girisli) {
      sorAyarla(false);
      rozetAyarla(0);
      return;
    }
    const t = setTimeout(yokla, 2500);
    const d = AppState.addEventListener('change', (x) => x === 'active' && yokla());
    return () => {
      clearTimeout(t);
      d.remove();
    };
  }, [girisli, c.uye?.uid, yokla]);

  useEffect(() => {
    if (girisli) rozetAyarla(c.zilSayi);
  }, [girisli, c.zilSayi]);

  const dokunma = useSonDokunma();
  useEffect(() => {
    if (!dokunma || !girisli || dokunma.id === islenenDokunma) return;
    islenenDokunma = dokunma.id;
    const e = dokunmaEkrani(dokunma.veri);
    if (e) setTimeout(() => c.git(e), 300);
  }, [dokunma?.id, girisli]);

  const sonra = () => {
    sorAyarla(false);
  };
  const ac = async () => {
    izinKaydiYaz('tamam');
    sorAyarla(false);
    if ((await izinIste()) === 'granted') jetonuKaydet();
  };

  return (
    <Modal visible={sor && !c.pencere} transparent animationType="fade" onRequestClose={sonra}>
      <View style={[s.perde, { backgroundColor: R.golge }]}>
        <View style={[s.kart, { backgroundColor: R.panel, borderColor: R.ince }]}>
          <YuzBalon ad="utangac" boyut={76} />
          <Text style={[s.baslik, { color: R.murekkep }]}>Figürün sana cevap verdiğinde haber verelim mi?</Text>
          <Text style={[s.alt, { color: R.soluk }]}>Cevap, etiket, yeni takipçi ve mesaj için telefonuna kısa bir bildirim göndeririz. Gece 23.00 ile 08.00 arası rahatsız etmeyiz. İstediğin zaman Ayarlar'dan kapatırsın.</Text>
          <View style={s.dugmeler}>
            <Dugme yazi="Evet, haber ver" tur="acik" onPress={ac} />
            <Dugme yazi="Daha sonra" tur="cizgi" onPress={sonra} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  perde: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 },
  kart: { width: '100%', maxWidth: 420, borderRadius: 22, borderWidth: 1, padding: 22, alignItems: 'center', gap: 8 },
  baslik: { fontFamily: yazi.kalin, fontSize: 20, textAlign: 'center', marginTop: 6 },
  alt: { fontFamily: yazi.normal, fontSize: 15, lineHeight: 21, textAlign: 'center' },
  dugmeler: { alignSelf: 'stretch', gap: 8, marginTop: 12 },
});
