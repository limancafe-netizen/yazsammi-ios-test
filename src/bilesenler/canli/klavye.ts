// Klavye ve görünen alan (08.10, Onur: "mesaj yazarken klavye ekrana oturmuyor, yazma alanı altta kalıyor / sayfa kayıyor").
// Site: Android Chrome'da <meta viewport interactive-widget=resizes-content> (onizleme/index.js) sayfayı klavyenin üstüne küçültür.
// iPhone Safari bunu bilmez: görünen alan (visualViewport) ölçülür, sahne o yüksekliğe ve kaydırma payına oturtulur.
// Uygulama (Android/iOS): Keyboard olaylarıyla klavye açık mı, ne kadar yer kaplıyor.
import { useEffect, useState } from 'react';
import { Keyboard, Platform, useWindowDimensions } from 'react-native';

const WEB = Platform.OS === 'web' && typeof window !== 'undefined';
const yaziAlani = () => {
  const a = typeof document !== 'undefined' ? document.activeElement : null;
  return !!a && (a.tagName === 'TEXTAREA' || (a.tagName === 'INPUT' && !['checkbox', 'radio', 'button', 'submit'].includes((a as HTMLInputElement).type)) || (a as HTMLElement).isContentEditable);
};

// iPhone'da Instagram/Facebook/TikTok gibi uygulamaların içindeki tarayıcı (Safari değil: tanıtıcıda "Safari/" yok ya da uygulama adı var).
const UA = WEB ? navigator.userAgent : '';
const UYGULAMA_ICI_IPHONE = /iPhone|iPad|iPod/.test(UA) && (/Instagram|FBAN|FBAV|FB_IAB|musical_ly|BytedanceWebview|TikTok/.test(UA) || !/Safari\//.test(UA));
const CUBUK_PAYI = 48; // klavye üst çubuğu (yukarı/aşağı/onay) yüksekliği

type Alan = { h: number; y: number; ortu: number; klavye: boolean };
// Sitede görünen alan: h = görünen yükseklik, y = tarayıcının sayfayı yukarı ittiği pay (iPhone), ortu = klavyenin örttüğü yükseklik.
function webAlan(enBuyuk: { w: number; h: number }): Alan {
  const vv = window.visualViewport;
  const ih = window.innerHeight;
  if (window.innerWidth !== enBuyuk.w) {
    enBuyuk.w = window.innerWidth;
    enBuyuk.h = ih;
  }
  enBuyuk.h = Math.max(enBuyuk.h, ih);
  // Parmakla yakınlaştırılmışsa (scale > 1) görünen alan klavye değildir: sayfa olduğu gibi kalır.
  if (!vv || vv.scale > 1.05) return { h: ih, y: 0, ortu: 0, klavye: false };
  const h = Math.round(Math.min(ih, vv.height));
  const y = Math.max(0, Math.round(vv.offsetTop));
  const ortu = Math.max(0, Math.round(ih - (vv.height + vv.offsetTop)));
  // Android (resizes-content): pencere küçülür; iPhone: görünen alan küçülür. İkisinde de en büyük yükseklikten 120 px+ eksilme + odakta yazı alanı = klavye.
  const klavye = yaziAlani() && h < enBuyuk.h - 120;
  // 26.10 (Onur, iPhone + Instagram): uygulama içi tarayıcıda görünen alan klavyenin üst çubuğunu (yukarı/aşağı/onay) saymıyor,
  // yazma kutusu çubuğun altında kalıyordu. Orada klavye açıkken çubuk payı kadar daha yukarı oturulur.
  const pay = klavye && UYGULAMA_ICI_IPHONE ? CUBUK_PAYI : 0;
  return { h: h - pay, y, ortu: ortu + pay, klavye };
}

export function useGorunenAlan(): Alan {
  const { height } = useWindowDimensions();
  const [alan, alanAyarla] = useState<Alan>(() => (WEB ? webAlan({ w: window.innerWidth, h: window.innerHeight }) : { h: height, y: 0, ortu: 0, klavye: false }));
  useEffect(() => {
    if (!WEB) return;
    const enBuyuk = { w: window.innerWidth, h: window.innerHeight };
    let kare = 0;
    const guncelle = () => {
      cancelAnimationFrame(kare);
      kare = requestAnimationFrame(() => {
        const a = webAlan(enBuyuk);
        alanAyarla((o) => (o.h === a.h && o.y === a.y && o.ortu === a.ortu && o.klavye === a.klavye ? o : a));
      });
    };
    const vv = window.visualViewport;
    vv?.addEventListener('resize', guncelle);
    vv?.addEventListener('scroll', guncelle);
    window.addEventListener('resize', guncelle);
    document.addEventListener('focusin', guncelle);
    document.addEventListener('focusout', guncelle);
    guncelle();
    return () => {
      cancelAnimationFrame(kare);
      vv?.removeEventListener('resize', guncelle);
      vv?.removeEventListener('scroll', guncelle);
      window.removeEventListener('resize', guncelle);
      document.removeEventListener('focusin', guncelle);
      document.removeEventListener('focusout', guncelle);
    };
  }, []);
  return WEB ? alan : { h: height, y: 0, ortu: 0, klavye: false };
}

// Klavye açık mı (alt sekmeler gizlenir, sohbet son mesaja kayar). Uygulamada Keyboard olayları, sitede görünen alan.
export function useKlavye(): boolean {
  const web = useGorunenAlan();
  const [acik, acikAyarla] = useState(false);
  useEffect(() => {
    if (WEB) return;
    const goster = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => acikAyarla(true));
    const gizle = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => acikAyarla(false));
    return () => {
      goster.remove();
      gizle.remove();
    };
  }, []);
  return WEB ? web.klavye : acik;
}
