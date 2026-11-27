// Cihaz hafızası (Android/iOS): telefondaki küçük yerel veritabanı. Sunucuya hiçbir şey gitmez.
import { Storage } from 'expo-sqlite/kv-store';

export function depoOku(anahtar: string): string | null {
  try {
    return Storage.getItemSync(anahtar);
  } catch {
    return null;
  }
}

export function depoYaz(anahtar: string, deger: string) {
  try {
    Storage.setItemSync(anahtar, deger);
  } catch {}
}
