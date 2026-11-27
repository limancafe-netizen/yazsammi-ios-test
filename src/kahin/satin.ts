// KAHİN bölümü satın alma kancası: Play bağlantısı, ürün fiyatları, satın alma olayı → SUNUCU doğrular → ancak sonra tüketilir.
// 04.11: Astroloji ve Tarot Kart Analizi sayfalarının (WebView, bilesenler/canli/SiteBolumu.native.tsx) ödeme düğmeleri bu kancaya bağlı;
// hakTazele doğrulanan ürünün kimliğini alır (sayfaya hangi hakkın yazılacağını söylemek için). Eski ekranlar (Kahin.tsx vb.) artık kullanılmıyor.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { MAGAZA_VAR } from '@/magaza/iap';
import * as C from '@/canli';
import { ODEME_VAR, bekleyenleriGetir, odemeHazirla, satinAl, satinDinle, urunleriGetir, type SatinSonuc, type UrunBilgi } from './odeme';

export const TUM_URUNLER = ['kahin_okuma_1', 'astro_harita', 'astro_uyum'];
export function useSatin(girisli: boolean, hakTazele: (urun: string) => void, tost: (m: string) => void) {
  const [urunler, urunlerAyarla] = useState<UrunBilgi[]>([]);
  const [neden, nedenAyarla] = useState('');
  const [yuk, yukAyarla] = useState(false);
  const [hata, hataAyarla] = useState('');
  const onayRef = useRef<{ urun: string; onay: { cayma_onay: true; cayma_onay_zaman: string } } | null>(null); // kullanıcının az önce onayladığı satın alma (cayma onayı, Şartlar 2.3 md 9.6); bekleyen eski işlemler onay taşımaz
  const isle = useCallback(async (s: SatinSonuc) => {
    const o = onayRef.current && onayRef.current.urun === s.urun ? onayRef.current.onay : undefined;
    const r = await C.kahinSatinDogrula(s.urun, s.token, o);
    if (r.ok) { onayRef.current = null; await s.bitir().catch(() => {}); hakTazele(s.urun); tost('Hakkın eklendi'); hataAyarla(''); }
    else hataAyarla(r.durum === 402 ? 'Satın alma doğrulanamadı.' : 'Satın alma şu an doğrulanamadı; ödemen güvende, birazdan yeniden denenecek.');
    yukAyarla(false);
  }, [hakTazele, tost]);
  useEffect(() => {
    if (!ODEME_VAR || !girisli || Platform.OS === 'ios' || MAGAZA_VAR) return; // iOS ve (bayrak açıkken) Android: satın alma src/magaza/; bu eski kanca yalnız Android bayrak kapalıyken (Google Play, /c/kahin/satin)
    let son = () => {}, iptal = false;
    (async () => {
      const h = await odemeHazirla();
      if (iptal) return;
      if (!h.ok) { nedenAyarla(h.neden || 'play_yok'); return; }
      nedenAyarla('');
      urunlerAyarla(await urunleriGetir(TUM_URUNLER));
      son = satinDinle((s) => { isle(s); }, (kod) => { yukAyarla(false); if (kod !== 'user-cancelled') hataAyarla('Satın alma tamamlanamadı.'); });
      for (const b of await bekleyenleriGetir()) await isle(b);
    })();
    return () => { iptal = true; son(); };
  }, [girisli, isle]);
  const satinAlTikla = async (id: string, onay?: { cayma_onay: true; cayma_onay_zaman: string }) => {
    if (!onay) { hataAyarla('Önce onay kutusunu işaretle.'); return; } // onay olmadan satın alma başlamaz
    hataAyarla(''); yukAyarla(true);
    onayRef.current = { urun: id, onay };
    const r = await satinAl(id);
    if (!r.ok) { onayRef.current = null; yukAyarla(false); if (r.neden !== 'user-cancelled') hataAyarla('Satın alma başlatılamadı.'); }
  };
  return { urunler, neden, yuk, hata, hataAyarla, satinAlTikla };
}
