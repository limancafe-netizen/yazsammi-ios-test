// Uygulama (Android/iOS): ikincil ekranlar doğrudan, paketin içinden. Web için tembel.web.tsx (ayrı parça olarak, gerektiğinde inen sürüm) var.
export { Detay } from './Detay';
export { Zil } from './Zil';
export { Profil } from './Profil';
export { Ayarlar } from './Ayarlar';
export { Pencereler } from './Pencereler';
export { Mesajlar, Sohbet, MesajPencereleri } from './Mesajlar';
export { TribunTakvim, TribunOdaEkrani } from './Tribun';
export { TribunPortal } from './TribunPortal';
export { TribunMacDetay } from './TribunMacDetay';
export { TribunKoseYazisi } from './TribunKose';
/** Web'de ikincil ekran parçalarını boşta önceden indirir; uygulamada her şey zaten pakette. */
export function ikincilleriOnYukle() {}
