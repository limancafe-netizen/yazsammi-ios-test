// iOS giriş penceresindeki "Apple ile devam et" düğmesi (Apple'ın kendi düğmesi; HIG gereği Google'dan küçük/arkada olamaz → üstte, aynı boy).
// Android ve sitede AppleYerel.tsx (boş) kullanılır.
import * as AppleAuthentication from 'expo-apple-authentication';
import { useEffect, useState } from 'react';
import { appleKullanilabilir, appleYerelGiris } from '@/appleGiris';
import { useRenk } from './ortak';

export function AppleYerelDugme({ jeton, hata, devre }: { jeton: (kimlik: string) => void; hata: (m: string) => void; devre?: boolean }) {
  const R = useRenk();
  const [var_, varAyarla] = useState(false);
  const [aciliyor, aciliyorAyarla] = useState(false);
  useEffect(() => {
    let iptal = false;
    appleKullanilabilir().then((v) => !iptal && varAyarla(v));
    return () => {
      iptal = true;
    };
  }, []);
  if (!var_) return null;
  const bas = async () => {
    if (aciliyor || devre) return;
    aciliyorAyarla(true);
    hata('');
    const r = await appleYerelGiris();
    aciliyorAyarla(false);
    if ('kimlik' in r) jeton(r.kimlik);
    else if ('hata' in r) hata(r.hata);
  };
  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
      buttonStyle={R.gece ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
      cornerRadius={24}
      style={{ width: 300, height: 48, opacity: aciliyor || devre ? 0.6 : 1 }}
      onPress={bas}
    />
  );
}
