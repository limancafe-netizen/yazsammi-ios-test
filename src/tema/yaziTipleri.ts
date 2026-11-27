// Uygulama yazı tipleri (Android/iOS): pakette TTF olarak gelir, açılışta yüklenir.
// Web için yaziTipleri.web.ts var (06.11 hız işi): yazı tipleri sunucunun sayfaya gömdüğü woff2 @font-face ile gelir (kod/site/yazi).
import { BricolageGrotesque_400Regular, BricolageGrotesque_500Medium, BricolageGrotesque_700Bold } from '@expo-google-fonts/bricolage-grotesque';
import { Caveat_700Bold } from '@expo-google-fonts/caveat';
import { Unbounded_800ExtraBold } from '@expo-google-fonts/unbounded';
import { BarlowCondensed_700Bold, BarlowCondensed_800ExtraBold } from '@expo-google-fonts/barlow-condensed';

export const YAZI_TIPLERI = { BricolageGrotesque_400Regular, BricolageGrotesque_500Medium, BricolageGrotesque_700Bold, Caveat_700Bold, Unbounded_800ExtraBold, BarlowCondensed_700Bold, BarlowCondensed_800ExtraBold };
/** true: yazı tipleri inene kadar uygulama çizilmez (telefon uygulaması). */
export const YAZI_BEKLE = true;
