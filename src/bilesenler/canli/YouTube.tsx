// YouTube video kartı (web): önce yalnız küçük resim + oynat düğmesi; dokununca youtube-nocookie iframe'i yüklenir (sayfa açılırken YouTube'a hiç bağlanılmaz).
// Aynı anda tek oynatıcı: yenisi başlayınca öncekinin iframe'i kaldırılır (küçük resme döner). Kimlik 11 karakter [A-Za-z0-9_-] değilse hiçbir şey çizilmez.
import { useEffect, useState } from 'react';
import { useRenk } from './ortak';
import { YouTubeCerceve, YouTubeKapak } from './youtubeOrtak';

let aktifKapat: (() => void) | null = null;
const KIMLIK = /^[A-Za-z0-9_-]{11}$/;

export function YouTube({ id, baslik, kanal }: { id: string; baslik?: string; kanal?: string }) {
  const R = useRenk();
  const [oynat, oynatAyarla] = useState(false);
  const gecerli = KIMLIK.test(id);
  useEffect(() => {
    if (!oynat) return;
    const kapat = () => oynatAyarla(false);
    aktifKapat?.();
    aktifKapat = kapat;
    return () => {
      if (aktifKapat === kapat) aktifKapat = null;
    };
  }, [oynat]);
  if (!gecerli) return null;
  return (
    <YouTubeCerceve R={R} kanal={kanal} baslik={baslik}>
      {oynat ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1`}
          title={baslik || 'YouTube videosu'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          style={{ width: '100%', height: '100%', border: 0, display: 'block', backgroundColor: '#000' }}
        />
      ) : (
        <YouTubeKapak id={id} baslik={baslik} etiket="Videoyu oynat" onPress={() => oynatAyarla(true)} />
      )}
    </YouTubeCerceve>
  );
}
