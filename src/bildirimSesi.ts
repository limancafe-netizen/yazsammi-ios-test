// Uygulama ya da site açıkken yeni bildirim/mesaj gelince kısa, yumuşak bir ses (site: Web Audio, dosyasız; uygulama: ses dosyası) ve hafif titreşim (uygulama).
// Ayarlar → "Bildirim sesi" (varsayılan açık; cihazda saklanır). Uygulamada (1.2.1'den) aynı kısa ses dosyadan çalar + hafif titreşim (sesCal.native.ts).
import { Platform } from 'react-native';
import { depoOku, depoYaz } from '@/depo';
import { dokun } from '@/dokunus';
import { sesCal } from '@/sesCal';

const ANAHTAR = 'yazsammi.canli.bildirimSesi';
export const bildirimSesiAcik = () => depoOku(ANAHTAR) !== '0';
export const bildirimSesiAyarla = (acik: boolean) => depoYaz(ANAHTAR, acik ? '1' : '0');

let baglam: AudioContext | null = null;
let son = 0;
function sesBaglami(): AudioContext | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  try {
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    if (!baglam) baglam = new AC() as AudioContext;
    if (baglam.state === 'suspended') baglam.resume().catch(() => {});
    return baglam;
  } catch {
    return null;
  }
}
// Tarayıcı sesi ancak bir dokunuştan sonra açar: ilk dokunuşta bağlam hazırlanır.
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  const hazirla = () => sesBaglami();
  window.addEventListener('pointerdown', hazirla, { once: true, passive: true });
  window.addEventListener('keydown', hazirla, { once: true, passive: true });
}

// İki notalı, kısa (≈0,35 sn), kısık "tın-tın".
function cal(ac: AudioContext) {
  const t0 = ac.currentTime + 0.01;
  const ana = ac.createGain();
  ana.gain.value = 0.9;
  ana.connect(ac.destination);
  [
    [880, 0],
    [1318.5, 0.11],
  ].forEach(([hz, gec]) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.value = hz;
    g.gain.setValueAtTime(0.0001, t0 + gec);
    g.gain.exponentialRampToValueAtTime(0.07, t0 + gec + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + gec + 0.26);
    o.connect(g).connect(ana);
    o.start(t0 + gec);
    o.stop(t0 + gec + 0.3);
  });
}

export function bildirimSesi() {
  if (!bildirimSesiAcik()) return;
  const t = Date.now();
  if (t - son < 2500) return; // art arda gelenlerde tek ses
  son = t;
  if (Platform.OS !== 'web') {
    sesCal();
    dokun('hafif');
    return;
  }
  if (typeof document !== 'undefined' && document.hidden) return;
  const ac = sesBaglami();
  if (ac && ac.state === 'running') {
    try {
      cal(ac);
    } catch {}
  }
}
