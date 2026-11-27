// Sitede (web) anlık bildirim yok; uygulamada: push.native.ts.
export const PUSH_DESTEK = false;
export type SistemIzni = 'granted' | 'denied' | 'undetermined';
export type Dokunma = { id: string; veri: unknown };
export async function izinDurumu(): Promise<SistemIzni> {
  return 'denied';
}
export async function izinIste(): Promise<SistemIzni> {
  return 'denied';
}
export async function jetonAl(): Promise<string | null> {
  return null;
}
export async function rozetAyarla(_n: number): Promise<void> {}
export function useSonDokunma(): Dokunma | null {
  return null;
}
export function sistemAyarlariniAc() {}
