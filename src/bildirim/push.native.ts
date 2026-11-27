// Anlık bildirim — uygulama tarafı (expo-notifications; gönderim Expo Push hizmetiyle sunucudan, bildirim_push.mjs).
// iOS: her zaman. Android: yalnız derlemede google-services.json varsa (app.config.js extra.pushAndroid) — yoksa hiçbir şey çizilmez/çağrılmaz.
// Açılışta izin SORULMAZ: izni BildirimKopru girişten sonra, açıklama ekranından sonra ister.
import { Linking, Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import type { SistemIzni, Dokunma } from './push';

export type { SistemIzni, Dokunma };
export const PUSH_DESTEK = Platform.OS === 'ios' || (Platform.OS === 'android' && (Constants.expoConfig?.extra as { pushAndroid?: boolean } | undefined)?.pushAndroid === true);

if (PUSH_DESTEK) {
  // Uygulama açıkken de bildirim görünür (1.9: Onur kararı).
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
}

export async function izinDurumu(): Promise<SistemIzni> {
  if (!PUSH_DESTEK) return 'denied';
  try {
    const p = await Notifications.getPermissionsAsync();
    return p.granted ? 'granted' : p.canAskAgain === false || p.status === 'denied' ? 'denied' : 'undetermined';
  } catch {
    return 'denied';
  }
}
async function kanalKur() {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync('varsayilan', { name: 'Bildirimler', importance: Notifications.AndroidImportance.DEFAULT });
  } catch {}
}
// Sistem iznini ister (yalnız kullanıcı açıklama ekranında "Haber ver"e ya da Ayarlar'da anahtara dokununca çağrılır).
export async function izinIste(): Promise<SistemIzni> {
  if (!PUSH_DESTEK) return 'denied';
  try {
    await kanalKur();
    const p = await Notifications.requestPermissionsAsync();
    return p.granted ? 'granted' : p.status === 'denied' ? 'denied' : 'undetermined';
  } catch {
    return 'denied';
  }
}
export async function jetonAl(): Promise<string | null> {
  if (!PUSH_DESTEK) return null;
  try {
    await kanalKur();
    const projectId = (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) return null;
    return (await Notifications.getExpoPushTokenAsync({ projectId })).data || null;
  } catch {
    return null; // Apple/Google jeton vermediyse (ağ yok, anahtar eksik): uygulama aynen çalışır
  }
}
// Rozet sayısı = okunmamış zil sayısı (yalnız iOS; Android'de simge rozeti sistem tarafından yönetilir).
export async function rozetAyarla(n: number): Promise<void> {
  if (!PUSH_DESTEK || Platform.OS !== 'ios') return;
  try {
    await Notifications.setBadgeCountAsync(Math.max(0, Math.min(99, Math.floor(n) || 0)));
  } catch {}
}
// Bildirime dokunuldu (uygulama kapalıyken açan dokunuş dahil): son dokunma; kimliği tekrar işlemeyi önlemek için.
export function useSonDokunma(): Dokunma | null {
  const r = Notifications.useLastNotificationResponse();
  if (!r || r.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return null;
  return { id: `${r.notification.request.identifier}|${r.notification.date}`, veri: r.notification.request.content.data };
}
export function sistemAyarlariniAc() {
  Linking.openSettings().catch(() => {});
}
