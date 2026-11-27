// YALNIZ emülatör denemesi (KAHIN_YEREL=1 ile derlenince): yerel sunucuya (http://10.0.2.2) bağlanmak için açık bağlantıya izin verir.
// Mağaza/canlı derlemesinde bu eklenti KULLANILMAZ (app.config.js yalnız KAHIN_YEREL=1 iken ekler).
const { withAndroidManifest } = require('expo/config-plugins');
module.exports = (config) =>
  withAndroidManifest(config, (c) => {
    c.modResults.manifest.application[0].$['android:usesCleartextTraffic'] = 'true';
    return c;
  });
