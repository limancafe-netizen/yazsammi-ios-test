// app.json'a ekler (app.json aynen kalır, yalnız eklenti listesi uzar):
// - YALNIZ KAHIN_YEREL=1 ile (emülatör denemesi) açık bağlantı eklentisi.
// - YALNIZ EXPO_PUBLIC_GOOGLE_IOS_ISTEMCI verilirse (iOS OAuth istemci kimliği, "….apps.googleusercontent.com") Google girişinin iOS eklentisi:
//   Info.plist'e iosUrlScheme (com.googleusercontent.apps.…) yazılır. Eklenti bu seçenekle yalnız iOS'a dokunur; Android derlemesi değişmez.
//   Değişken yoksa eklenti eklenmez ve uygulama iOS'ta Google düğmesini gizler (googleGiris.native.ts aynı denetimi yapar) → yalnız Apple görünür.
const googleIos = (process.env.EXPO_PUBLIC_GOOGLE_IOS_ISTEMCI || '').trim();
const googleIosGecerli = /^[\w-]+\.apps\.googleusercontent\.com$/.test(googleIos);
const iosUrlScheme = googleIosGecerli ? 'com.googleusercontent.apps.' + googleIos.replace(/\.apps\.googleusercontent\.com$/, '') : '';

// 18.11 (anlık bildirim, 1.8.0): expo-notifications eklentisi artık iOS'a da girer ("aps-environment" push yetkisi; App Store için mode: production). Eskiden iOS derlemesinde çıkarılıyordu (11.11: push yoktu).
// Android: push için Firebase (google-services.json) GEREKİR. Dosya bu klasörde yoksa Android aynen eskisi gibi kalır (bildirim izinleri engelli, push kapalı, extra.pushAndroid=false);
// varsa: googleServicesFile bağlanır, POST_NOTIFICATIONS ve FCM RECEIVE izinleri engelli listeden çıkar, küçük bildirim simgesi mevcut tek renkli uygulama simgesinden alınır, extra.pushAndroid=true.
const fs = require('fs');
const path = require('path');
const androidPush = fs.existsSync(path.join(__dirname, 'google-services.json'));
const ANDROID_PUSH_IZIN = ['android.permission.POST_NOTIFICATIONS', 'com.google.android.c2dm.permission.RECEIVE'];
const eklentiler = (plugins) =>
  (plugins || []).map((p) => {
    if ((Array.isArray(p) ? p[0] : p) !== 'expo-notifications') return p;
    return ['expo-notifications', { ...(Array.isArray(p) ? p[1] : {}), mode: 'production', ...(androidPush ? { icon: './assets/android-icon-monochrome.png' } : {}) }];
  });

module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    ...(androidPush ? { googleServicesFile: './google-services.json', blockedPermissions: (config.android?.blockedPermissions || []).filter((x) => !ANDROID_PUSH_IZIN.includes(x)) } : {}),
  },
  extra: { ...config.extra, pushAndroid: androidPush },
  plugins: [
    ...eklentiler(config.plugins),
    ...(process.env.KAHIN_YEREL === '1' ? ['./plugins/yerelAg'] : []),
    ...(iosUrlScheme ? [['@react-native-google-signin/google-signin', { iosUrlScheme }]] : []),
  ],
});
