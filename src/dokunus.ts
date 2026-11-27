// Dokunuş titreşimi (uygulamada). Sitede hiçbir şey yapmaz.
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export function dokun(tur: 'hafif' | 'orta' | 'basari' = 'hafif') {
  if (Platform.OS === 'web') return;
  try {
    if (tur === 'basari') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else Haptics.impactAsync(tur === 'orta' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
  } catch {}
}
