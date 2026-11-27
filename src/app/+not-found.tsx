// Bilinmeyen adres: yeni arayüz dilinde (balon + "Canlı'ya dön"). 09.10: eski Konuşma/Dugme bileşenleri kalktı.
// 04.11 (E-10): /tribun/ gibi bölüm adresleri "Bu sayfa bulunamadı" diyordu. Sunucu (onizleme/bolum.mjs) bunları 301 ile yönlendirir;
// adres yine de uygulamaya düşerse (eski önbellek, başka barındırma) aynı tablo burada da uygulanır, bulunamadı ekranı yalnız gerçekten
// bilinmeyen adreste çıkar.
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Yenileniyor from '@/bilesenler/canli/Yenileniyor';

const BOLUM_YON: Record<string, string> = {
  tribun: '/canli?tribun=1', 'tribün': '/canli?tribun=1', spor: '/canli?tribun=1', futbol: '/canli?tribun=1', basketbol: '/canli?tribun=1',
  mesajlar: '/canli?mesajlar=1', bildirimler: '/canli?zil=1', zil: '/canli?zil=1', ayarlar: '/canli?ayarlar=1',
  ekonomi: '/ekonomi/', piyasa: '/ekonomi/', piyasalar: '/ekonomi/', borsa: '/ekonomi/', kripto: '/ekonomi/#kripto',
  oyun: '/oyun/', oyunlar: '/oyun/', astroloji: '/astroloji/', tarot: '/tarot/', burclar: '/burc/', 'burçlar': '/burc/',
};

function bolumYonu(yol: string): string | null {
  let y = yol;
  try { y = decodeURIComponent(yol); } catch {}
  const m = /^\/([^/.]+)\/?$/.exec(y);
  const hedef = m ? BOLUM_YON[m[1].toLocaleLowerCase('tr')] : undefined;
  return hedef && hedef.split(/[?#]/)[0] !== y ? hedef : null;
}

export default function Bulunamadi() {
  const [yonleniyor, yonleniyorAyarla] = useState(() => Platform.OS === 'web' && typeof window !== 'undefined' && !!bolumYonu(window.location.pathname));
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const h = bolumYonu(window.location.pathname);
    if (!h) { yonleniyorAyarla(false); return; }
    const q = window.location.search.slice(1);
    window.location.replace(h + (q ? (h.includes('?') ? '&' : '?') + q : ''));
  }, []);
  if (yonleniyor) return null;
  return <Yenileniyor baslik="Bu sayfa bulunamadı" alt="Bağlantı eski ya da yanlış yazılmış olabilir. Canlı’ya dönelim mi?" />;
}
