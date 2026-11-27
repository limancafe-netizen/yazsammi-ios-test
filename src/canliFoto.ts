// Gönderi fotoğrafı seçme ve hazırlama (plan/16 "2. adım — fotoğraf"). Web: dosya seçici → tuvalde (canvas) en uzun kenar ≤1600 px,
// JPEG ~0,8 ile yeniden kodlanır; ≤1,5 MB olana kadar kalite/boyut düşer. Yeniden kodlama EXIF'i (konum, cihaz) tamamen siler.
// Uygulamada (Android/iOS) fotoğraf seçici henüz yok: null döner, ekran "yakında" der.
import { Platform } from 'react-native';

export type HazirFoto = { veri: string; en: number; boy: number; onizleme: string; bayt: number };
export const FOTO_VAR = Platform.OS === 'web' && typeof document !== 'undefined';
const UZUN = 1600;
const TAVAN = 1_500_000;

function dosyaSec(): Promise<File | null> {
  return new Promise((coz) => {
    const g = document.createElement('input');
    g.type = 'file';
    g.accept = 'image/jpeg,image/png,image/webp,image/heic,image/heif,image/*';
    g.style.display = 'none';
    let bitti = false;
    const son = (f: File | null) => {
      if (bitti) return;
      bitti = true;
      g.remove();
      coz(f);
    };
    g.onchange = () => son(g.files?.[0] ?? null);
    g.addEventListener('cancel', () => son(null));
    document.body.appendChild(g);
    g.click();
  });
}

function resimYukle(f: File): Promise<HTMLImageElement> {
  return new Promise((coz, hata) => {
    const url = URL.createObjectURL(f);
    const r = new Image();
    r.onload = () => coz(r); // tarayıcı EXIF yönünü kendisi uygular (image-orientation: from-image)
    r.onerror = () => {
      URL.revokeObjectURL(url);
      hata(new Error('resim'));
    };
    r.src = url;
  });
}

const blobYap = (t: HTMLCanvasElement, kalite: number) => new Promise<Blob | null>((coz) => t.toBlob(coz, 'image/jpeg', kalite));
const base64 = (b: Blob) =>
  new Promise<string>((coz, hata) => {
    const o = new FileReader();
    o.onload = () => coz(String(o.result).replace(/^data:[^,]+,/, ''));
    o.onerror = () => hata(o.error);
    o.readAsDataURL(b);
  });

// Seçilmiş dosyayı hazırlar (sürükle-bırak gibi başka yollar için de).
export async function fotoHazirla(f: File): Promise<HazirFoto | { hata: string }> {
  if (!/^image\//.test(f.type) && !/\.(jpe?g|png|webp|heic|heif)$/i.test(f.name)) return { hata: 'Bu dosya fotoğraf değil.' };
  if (f.size > 40_000_000) return { hata: 'Fotoğraf çok büyük.' };
  let r: HTMLImageElement;
  try {
    r = await resimYukle(f);
  } catch {
    return { hata: 'Bu fotoğraf açılmadı. JPG ya da PNG dene.' };
  }
  let olcek = Math.min(1, UZUN / Math.max(r.naturalWidth, r.naturalHeight));
  for (let deneme = 0; deneme < 6; deneme++) {
    const en = Math.max(16, Math.round(r.naturalWidth * olcek));
    const boy = Math.max(16, Math.round(r.naturalHeight * olcek));
    const t = document.createElement('canvas');
    t.width = en;
    t.height = boy;
    const c = t.getContext('2d');
    if (!c) return { hata: 'Fotoğraf hazırlanamadı.' };
    c.fillStyle = '#fff'; // saydam PNG siyaha dönmesin
    c.fillRect(0, 0, en, boy);
    c.drawImage(r, 0, 0, en, boy);
    for (const kalite of [0.8, 0.7, 0.6]) {
      const b = await blobYap(t, kalite);
      if (b && b.size <= TAVAN) {
        URL.revokeObjectURL(r.src);
        return { veri: await base64(b), en, boy, onizleme: URL.createObjectURL(b), bayt: b.size };
      }
    }
    olcek *= 0.8;
  }
  URL.revokeObjectURL(r.src);
  return { hata: 'Fotoğraf küçültülemedi.' };
}

export async function fotoSec(): Promise<HazirFoto | { hata: string } | null> {
  if (!FOTO_VAR) return { hata: 'Fotoğraf eklemek şimdilik yalnız sitede.' };
  const f = await dosyaSec();
  if (!f) return null;
  return fotoHazirla(f);
}
