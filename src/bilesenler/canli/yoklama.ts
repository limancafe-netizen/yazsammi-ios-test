// KASMA (18.11): arka plandayken (uygulama) / sekme gizliyken (web) yoklamayı durdurur; öne gelince hemen bir kez yoklar.
import { AppState, Platform } from 'react-native';

export const acikMi = () => (Platform.OS === 'web' ? typeof document === 'undefined' || document.visibilityState !== 'hidden' : AppState.currentState !== 'background');

// Döner: temizleme işlevi. Kurulurken fn çağrılmaz (ilk çağrıyı çağıran yapar).
export function acikYoklamaKur(fn: () => void, ms: number): () => void {
  let t: ReturnType<typeof setInterval> | null = null;
  let durdu = false;
  const baslat = () => {
    if (t == null) t = setInterval(fn, ms);
  };
  const durdur = () => {
    if (t != null) clearInterval(t);
    t = null;
  };
  const degisti = (acik: boolean) => {
    if (!acik) {
      durdu = true;
      durdur();
    } else if (durdu) {
      durdu = false;
      baslat();
      fn();
    }
  };
  if (acikMi()) baslat();
  else durdu = true;
  const web = Platform.OS === 'web' && typeof document !== 'undefined';
  const webDinle = () => degisti(document.visibilityState !== 'hidden');
  const abone = web ? null : AppState.addEventListener('change', (d) => degisti(d !== 'background'));
  if (web) document.addEventListener('visibilitychange', webDinle);
  return () => {
    durdur();
    if (web) document.removeEventListener('visibilitychange', webDinle);
    else abone?.remove();
  };
}
