// Sürüm denetimi (09.10, Onur: telefondaki açık sekme yeni dağıtımdan sonra eski menüyü göstermeye devam etti; site tek sayfa uygulama, kendiliğinden yenilenmiyor).
// Yalnız web. Dağıtımda dagit.sh derleme kimliğini hem programa (EXPO_PUBLIC_SURUM) hem /surum.json dosyasına yazar. Sayfa açılınca, sekme öne gelince
// (visibilitychange) ve 5 dakikada bir /surum.json (önbelleksiz) okunur. Kimlik farklıysa: kullanıcı yazı yazmıyorsa sessizce yeniden yüklenir,
// yazıyorsa üstte "Yeni sürüm hazır · Yenile" şeridi görünür (yazı kaybolmasın); yazma bitince bir sonraki denetimde yenilenir.
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { useRenk } from '@/bilesenler/canli/ortak';
import { yazi } from '@/tema/tema';

const SURUM = process.env.EXPO_PUBLIC_SURUM || '';
const ANAHTAR = 'yazsammi.surum.yenileme';

// Kullanıcı şu an yazı yazıyor mu: odakta yazı alanı var ya da sayfadaki herhangi bir yazı alanında yazı var.
function yaziyor(): boolean {
  const a = document.activeElement as HTMLElement | null;
  if (a && (a.tagName === 'TEXTAREA' || (a.tagName === 'INPUT' && !['checkbox', 'radio', 'button', 'submit', 'range'].includes((a as HTMLInputElement).type)) || a.isContentEditable)) return true;
  return [...document.querySelectorAll('textarea, input[type=text], input:not([type])')].some((e) => ((e as HTMLInputElement).value || '').trim().length > 0);
}

function yenile() {
  try { sessionStorage.setItem(ANAHTAR, String(Date.now())); } catch {}
  window.location.reload();
}

export function SurumDenetimi() {
  const R = useRenk();
  const [serit, seritAyarla] = useState(false);
  const yeniVar = useRef(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !SURUM) return;
    let bitti = false;
    const eyle = () => {
      if (!yeniVar.current) return;
      // Yeniden yükleme döngüsüne karşı: son yenilemeden 60 sn geçmediyse (önbellek sorunu) otomatik yenileme yok, yalnız şerit.
      let son = 0;
      try { son = Number(sessionStorage.getItem(ANAHTAR) || 0); } catch {}
      if (!yaziyor() && Date.now() - son > 60000) yenile();
      else seritAyarla(true);
    };
    const bak = async () => {
      try {
        const r = await fetch(`/surum.json?t=${Date.now()}`, { cache: 'no-store' });
        if (!r.ok) return;
        const j = await r.json();
        if (bitti || !j || typeof j.surum !== 'string' || !j.surum || j.surum === SURUM) return;
        yeniVar.current = true;
        eyle();
      } catch {}
    };
    const gorunur = () => { if (document.visibilityState === 'visible') bak(); };
    bak();
    const t = setInterval(() => { if (document.visibilityState === 'visible') bak(); else if (yeniVar.current) eyle(); else bak(); }, 300000);
    document.addEventListener('visibilitychange', gorunur);
    window.addEventListener('pageshow', gorunur);
    return () => { bitti = true; clearInterval(t); document.removeEventListener('visibilitychange', gorunur); window.removeEventListener('pageshow', gorunur); };
  }, []);

  if (!serit) return null;
  return (
    <View
      accessibilityRole="alert"
      style={[{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100000, alignItems: 'center', pointerEvents: 'box-none' as any }, Platform.OS === 'web' && ({ paddingTop: 'max(8px, env(safe-area-inset-top))' } as any)]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 16, paddingRight: 6, paddingVertical: 6, borderRadius: 999, backgroundColor: R.yukselt, borderWidth: 1, borderColor: R.cizgi, ...(Platform.OS === 'web' ? ({ boxShadow: `0 12px 30px -10px ${R.golge}` } as any) : null) }}>
        <Text style={{ fontFamily: yazi.orta, fontSize: 14, color: R.murekkep }}>Yeni sürüm hazır</Text>
        <Pressable onPress={yenile} accessibilityRole="button" accessibilityLabel="Yenile" style={{ height: 34, paddingHorizontal: 16, borderRadius: 999, backgroundColor: R.vurgu, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: yazi.kalin, fontSize: 14, color: '#fff' }}>Yenile</Text>
        </Pressable>
      </View>
    </View>
  );
}
