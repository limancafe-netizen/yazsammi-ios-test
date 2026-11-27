// Anlık bildirim: cihazdaki izin kaydı + jetonu sunucuya kaydetme/silme (BildirimKopru.tsx ve Ayar.tsx ortak kullanır).
import { Platform } from 'react-native';
import * as C from '@/canli';
import { depoOku, depoYaz } from '@/depo';
import { jetonAl } from './push';
import { JETON_KALIP, izinKaydiCevir, kartKaydiCevir, type IzinKaydi, type KartKaydi } from './mantik';

const IZIN_ANAHTARI = 'yazsammi.bildirim.izin'; // yalnız bu cihazda: '' | 'sonra' | 'tamam'
export const izinKaydiOku = (): IzinKaydi => izinKaydiCevir(depoOku(IZIN_ANAHTARI));
export const izinKaydiYaz = (k: IzinKaydi) => depoYaz(IZIN_ANAHTARI, k);

const KART_ANAHTARI = 'yazsammi.bildirim.kart'; // {n, son}: nazik kart kaç kez, en son ne zaman gösterildi
export const kartKaydiOku = (): KartKaydi => kartKaydiCevir(depoOku(KART_ANAHTARI));
export const kartKaydiYaz = (k: KartKaydi) => depoYaz(KART_ANAHTARI, JSON.stringify(k));

let jeton: string | null = null;
let kanca = false;
// Cihaz jetonunu alır ve sunucuya (giriş yapmış üyeye) bağlar. Jeton alınamazsa (izin yok, ağ yok) sessizce false.
export async function jetonuKaydet(): Promise<boolean> {
  const t = await jetonAl();
  if (!t || !JETON_KALIP.test(t)) return false;
  jeton = t;
  if (!kanca) {
    kanca = true;
    // Çıkışta jeton sunucudan silinir (aynı telefona başka üye girerse eski üyeye bildirim gitmesin).
    C.cikisOnceDinle(() => {
      if (jeton) C.bildirimJetonSil(jeton);
    });
  }
  const r = await C.bildirimJetonKaydet(t, Platform.OS === 'android' ? 'android' : 'ios');
  return r.ok;
}
