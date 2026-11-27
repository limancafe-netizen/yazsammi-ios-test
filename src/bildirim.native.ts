// 09.10: eski telefon hatırlatıcıları ("Günün Cümlesi açıldı", "Bugünün balonu seni bekliyor"…) kalktı. Eski sürümün kurduğu,
// henüz çalmamış hatırlatmalar yeni sürüm ilk açıldığında silinir. Canlı'nın bildirimleri uygulama içindedir (Yankı).
import * as Notifications from 'expo-notifications';

export async function eskiBildirimleriTemizle(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // Temizlenemezse uygulama aynen çalışır.
  }
}
