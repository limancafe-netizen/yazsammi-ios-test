// Android geri tuşu / geri hareketi: akış dışındaki bir ekrandaysa (gönderi, zil, profil, mesajlar, sohbet) önce akışa döner;
// akıştayken varsayılan davranış (uygulamadan çıkış). Açık pencereler (giriş, yazıcı…) Modal'ın kendi onRequestClose'uyla kapanır.
// Sitede tarayıcının geri tuşu zaten adres geçmişiyle çalışır (baglam.tsx), burada bir şey yapılmaz.
// 04.11: Astroloji ve Tarot Kart Analizi (WebView) açıkken geri tuşunu SiteBolumu.native.tsx yönetir (önce sayfanın içinde geri).
import { useEffect } from 'react';
import { BackHandler, Platform } from 'react-native';
import { useCanli } from './baglam';

export function GeriTusu() {
  const c = useCanli();
  const akista = c.ekran.tur === 'akis' || c.ekran.tur === 'astroloji' || c.ekran.tur === 'kahin';
  useEffect(() => {
    if (Platform.OS !== 'android' || akista) return;
    const a = BackHandler.addEventListener('hardwareBackPress', () => {
      c.geri();
      return true;
    });
    return () => a.remove();
  }, [akista, c.geri]);
  return null;
}
