// Apple düğmesi yalnız iOS'ta (AppleYerel.ios.tsx). Android ve sitede hiçbir şey çizilmez.
export function AppleYerelDugme(_: { jeton: (kimlik: string) => void; hata: (m: string) => void; devre?: boolean }) {
  return null;
}
