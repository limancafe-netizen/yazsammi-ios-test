// Zorunlu üye girişi kapısı (Onur 18.11): yalnız telefon uygulamasında (ios/android) üye girişi yapılmadan içerik görünmez.
// Karar saf işlev (RN'e bağlı değil) → node ile sınanır (kapi_test.mjs). Site (web) HİÇ etkilenmez.
export type KapiDurum = 'bekle' | 'kapi' | 'icerik';
export type KapiAdim = 'giris' | 'ad';
export type KapiGirdi = {
  platform: string; // Platform.OS
  depoOkundu: boolean; // oturum cihaz deposundan okundu mu (okunmadan giriş ekranı gösterilmez: yanıp sönme olmasın)
  oturum: boolean; // oturum jetonu var mı
  ad: string; // kayıtlı üyenin takma adı ('' = yok)
  yeni: boolean; // takma ad adımı bitmemiş üye
};

export function kapiKarari(g: KapiGirdi): KapiDurum {
  if (g.platform !== 'ios' && g.platform !== 'android') return 'icerik'; // web ve diğerleri: aynen kalır
  if (!g.depoOkundu) return 'bekle';
  if (!g.oturum) return 'kapi';
  if (!g.ad || g.yeni) return 'kapi'; // oturum var ama takma ad adımı bitmemiş
  return 'icerik';
}

// Kapı açıkken hangi adım: oturum yoksa giriş, oturum var takma ad yoksa takma ad adımı.
export function kapiAdimi(g: Pick<KapiGirdi, 'oturum'>): KapiAdim {
  return g.oturum ? 'ad' : 'giris';
}
