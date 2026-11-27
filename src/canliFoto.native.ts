// Gönderi fotoğrafı (uygulama: Android/iOS). Sitedeki canliFoto.ts ile aynı dışa açılım (FOTO_VAR, fotoSec, HazirFoto).
// Sistem fotoğraf seçicisi açılır (Android 13+ "Photo Picker": izin istemez, yalnız seçilen fotoğraf uygulamaya gelir).
// Sonra en uzun kenar ≤1600 px'e küçültülüp JPEG olarak yeniden kodlanır (≤1,5 MB olana kadar kalite/boyut düşer).
// Yeniden kodlama EXIF'i (konum, cihaz) siler; sunucuya giden aynı biçim: { veri: base64 (ön eksiz), en, boy }.
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

export type HazirFoto = { veri: string; en: number; boy: number; onizleme: string; bayt: number };
export const FOTO_VAR = true;
const UZUN = 1600;
const TAVAN = 1_500_000;

const baytHesap = (b64: string) => Math.floor((b64.length * 3) / 4) - (b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0);

export async function fotoSec(): Promise<HazirFoto | { hata: string } | null> {
  let sonuc: ImagePicker.ImagePickerResult;
  try {
    sonuc = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false, quality: 1, exif: false, base64: false, allowsMultipleSelection: false });
  } catch {
    return { hata: 'Fotoğraflar açılamadı.' };
  }
  if (sonuc.canceled || !sonuc.assets?.length) return null;
  const a = sonuc.assets[0];
  if (a.type && a.type !== 'image') return { hata: 'Bu dosya fotoğraf değil.' };
  if (a.fileSize && a.fileSize > 40_000_000) return { hata: 'Fotoğraf çok büyük.' };
  const enHam = a.width || UZUN;
  const boyHam = a.height || UZUN;
  let olcek = Math.min(1, UZUN / Math.max(enHam, boyHam));
  try {
    for (let deneme = 0; deneme < 5; deneme++) {
      const en = Math.max(16, Math.round(enHam * olcek));
      const ctx = ImageManipulator.manipulate(a.uri);
      if (olcek < 1) ctx.resize({ width: en });
      const resim = await ctx.renderAsync();
      for (const kalite of [0.8, 0.7, 0.6]) {
        const s = await resim.saveAsync({ format: SaveFormat.JPEG, compress: kalite, base64: true });
        const veri = s.base64 ?? '';
        const bayt = baytHesap(veri);
        if (veri && bayt <= TAVAN) return { veri, en: s.width, boy: s.height, onizleme: s.uri, bayt };
      }
      olcek *= 0.8;
    }
  } catch {
    return { hata: 'Bu fotoğraf açılmadı. Başka bir fotoğraf dene.' };
  }
  return { hata: 'Fotoğraf küçültülemedi.' };
}
