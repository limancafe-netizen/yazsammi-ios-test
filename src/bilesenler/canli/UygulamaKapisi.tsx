// Zorunlu üye girişi kapısı (Onur 18.11): telefon uygulamasında (iOS/Android) üye girişi + takma ad adımı bitmeden içerik ağacı HİÇ bağlanmaz
// (akış, sekmeler, yoklama istekleri yok; derin bağlantı ve bildirimle açılış da buradan geçer). Site (web) aynen kalır: kapı çocukları olduğu gibi çizer.
// Giriş penceresindeki Giris ve AdAdimi (Pencereler.tsx) tam ekran yeniden kullanılır; ✕, "Şimdi değil", dışarı dokunma yok; Android geri tuşu uygulamadan çıkar.
// Çıkış / hesap silme / 401 oturumu düşürünce (canli.ts oturumDinle) kapı kendiliğinden geri gelir.
import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { BackHandler, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as C from '@/canli';
import { kapiAdimi, kapiKarari, type KapiAdim, type KapiGirdi } from '@/kapi';
import { CanliSaglayici } from './baglam';
import { AdAdimi, Giris } from './Pencereler';
import { useRenk } from './ortak';

function girdiAl(hazir: boolean): KapiGirdi {
  const u = C.kayitliUye();
  return { platform: Platform.OS, depoOkundu: hazir, oturum: C.oturumVar(), ad: u?.ad ?? '', yeni: !!u?.yeni };
}
// Oturum değişimini React'e bildiren anlık görüntü (değişmedikçe aynı metin → gereksiz çizim yok).
const imzaAl = () => {
  const u = C.kayitliUye();
  return `${C.oturumVar() ? 1 : 0}|${u?.ad ?? ''}|${u?.yeni ? 1 : 0}`;
};

export function UygulamaKapisi({ children }: { children: ReactNode }) {
  if (Platform.OS === 'web') return <>{children}</>;
  return <YerelKapi>{children}</YerelKapi>;
}

function YerelKapi({ children }: { children: ReactNode }) {
  const R = useRenk();
  const [hazir, hazirAyarla] = useState(false);
  useEffect(() => {
    C.oturumTazele(); // oturumu cihaz deposundan bir kez okur; okunana kadar giriş ekranı gösterilmez (yanıp sönme yok)
    hazirAyarla(true);
  }, []);
  useSyncExternalStore(C.oturumDinle, imzaAl);
  const g = girdiAl(hazir);
  const durum = kapiKarari(g);
  if (durum === 'bekle') return <View style={{ flex: 1, backgroundColor: R.sis }} />;
  if (durum === 'icerik') return <>{children}</>;
  const adim = kapiAdimi(g);
  // key: adım değişince (giriş → takma ad) sağlayıcı yeniden kurulur, kayıtlı üyeyi taze okur.
  return (
    <CanliSaglayici key={adim}>
      <KapiEkrani adim={adim} />
    </CanliSaglayici>
  );
}

function KapiEkrani({ adim }: { adim: KapiAdim }) {
  const R = useRenk();
  const ust = useSafeAreaInsets();
  // Android geri tuşu: kapıdayken uygulamadan çıkar; kapıyı atlatamaz (içerik ağacı bağlı değil, geri gidecek ekran yok).
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const a = BackHandler.addEventListener('hardwareBackPress', () => {
      BackHandler.exitApp();
      return true;
    });
    return () => a.remove();
  }, []);
  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1, backgroundColor: R.panel, paddingTop: ust.top, paddingBottom: ust.bottom }}>
      {adim === 'giris' ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
          <View style={{ width: '100%', maxWidth: 440, alignSelf: 'center' }}>
            <Giris neden="Hesabınla devam et" kapi />
          </View>
        </ScrollView>
      ) : (
        <AdAdimi kapi />
      )}
    </KeyboardAvoidingView>
  );
}
