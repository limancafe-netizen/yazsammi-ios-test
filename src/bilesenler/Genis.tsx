// Geniş ekran (bilgisayar) ölçüsü. Telefonda (dar ekran) sol rıhtım ve sağ panel yok; 1000 pikselden geniş web ekranında
// Canlı sol rıhtım + ekrana yayılan akış + sağ panel düzenine geçer (bilesenler/canli/Duzen.tsx, app/canli.tsx).
// 09.10: eski sayfaların üst menüsü ve iki panelli sahne parçaları kaldırıldı.
import { Platform, useWindowDimensions } from 'react-native';

export const GENIS_SINIR = 1000;

export function useGenis() {
  const { width } = useWindowDimensions();
  return Platform.OS === 'web' && width >= GENIS_SINIR;
}

// Kısa bilgisayar ekranı (ör. 1366×768, 1280×720): boşluklar biraz sıkılaşır ki sayfa tek ekrana sığsın.
export function useKisa() {
  const { height } = useWindowDimensions();
  return height < 820;
}
