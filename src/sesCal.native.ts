// Uygulamada (Android/iOS) bildirim sesi: sitedeki kısa "tın-tın"ın aynısı (assets/ses/bildirim.wav, ~0,4 sn).
// Başka uygulamanın müziğini durdurmaz (karışır); sessiz modda iPhone'da çalmaz. Oynatıcı bir kez kurulur, her seferinde baştan çalar.
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

let oynatici: AudioPlayer | null = null;
let hazir = false;
export function sesCal() {
  try {
    if (!hazir) {
      hazir = true;
      setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers', shouldPlayInBackground: false }).catch(() => {});
    }
    if (!oynatici) {
      oynatici = createAudioPlayer(require('../assets/ses/bildirim.wav'));
      oynatici.volume = 0.8;
    }
    const o = oynatici;
    o.seekTo(0)
      .then(() => o.play())
      .catch(() => {});
  } catch {}
}
