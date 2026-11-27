// Site (web): yazsammi.com açılış ekranı = Yazsam mı? Canlı. Eski paylaşılmış ölçme bağlantıları (/?kim=…, /?gorev=1, /?yaz=1)
// yeni arayüzde "Bu bölüm yenileniyor" ekranını açar (09.10); uygulamada index.native.tsx doğrudan Canlı'yı açar.
import { useLocalSearchParams } from 'expo-router';
import Canli from './canli';
import Yenileniyor from '@/bilesenler/canli/Yenileniyor';

export default function Kok() {
  const p = useLocalSearchParams<{ kim?: string; gorev?: string; yaz?: string }>();
  return p.kim || p.gorev || p.yaz ? <Yenileniyor /> : <Canli />;
}
