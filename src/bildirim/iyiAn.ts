// "İyi an" işareti: figür sohbeti bitip kullanıcı çıkarken (ve oyunda bölüm kazanılınca) çağrılır; BildirimKopru nazik kartı gösterip göstermeyeceğine karar verir.
let dinleyici: (() => void) | null = null;
export function iyiAnBildir() {
  dinleyici?.();
}
export function iyiAnDinle(f: () => void): () => void {
  dinleyici = f;
  return () => {
    if (dinleyici === f) dinleyici = null;
  };
}
