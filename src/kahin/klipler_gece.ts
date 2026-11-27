// KULLANILMIYOR (04.11.2026): eski KAHİN astroloji/tarot ekranı. Astroloji ve Tarot Kart Analizi artık sitenin /astroloji/ ve /tarot/ sayfaları,
// uygulamada WebView ile (bilesenler/canli/SiteBolumu.native.tsx); hiçbir ekran bu dosyayı içe aktarmıyor. Kod başvuru için duruyor, silinmedi.
// OTOMATİK ÜRETİLDİ (plan/80_YENI_BOLUMLER/kahin/uygulama_2/klip_ekle.py): GPU ajanının gece klipleri. Elle düzenleme.
import type { Tanim } from './klipSistemi';
export const GECE: Tanim[] = [
  { id: 'kuzgun_gelis', kaynak: require('../../assets/kahin/klip2/kuzgun_gelis__K0_K1.mp4'), basla: 'K0', bitis: 'K1', dongu: false },
  { id: 'kuzgun_tunek_bekleme', kaynak: require('../../assets/kahin/klip2/kuzgun_tunek_bekleme__K2_K2.mp4'), basla: 'K2', bitis: 'K2', dongu: true },
  { id: 'buyu_dizim', kaynak: require('../../assets/kahin/klip2/buyu_dizim__K1_K1.mp4'), basla: 'K1', bitis: 'K1', dongu: false },
  { id: 'oda_bekleme', kaynak: require('../../assets/kahin/klip2/oda_bekleme__K0_K0.mp4'), basla: 'K0', bitis: 'K0', dongu: true },
  { id: 'sefkat_k2', kaynak: require('../../assets/kahin/klip2/sefkat_k2__K2_K2.mp4'), basla: 'K2', bitis: 'K2', dongu: true },
  { id: 'gizem_k2', kaynak: require('../../assets/kahin/klip2/gizem_k2__K2_K2.mp4'), basla: 'K2', bitis: 'K2', dongu: true },
  { id: 'dusunceli_k2', kaynak: require('../../assets/kahin/klip2/dusunceli_k2__K2_K2.mp4'), basla: 'K2', bitis: 'K2', dongu: true },
  { id: 'soru_k2', kaynak: require('../../assets/kahin/klip2/soru_k2__K2_K2.mp4'), basla: 'K2', bitis: 'K2', dongu: true },
  { id: 'gulme_k2', kaynak: require('../../assets/kahin/klip2/gulme_k2__K2_K2.mp4'), basla: 'K2', bitis: 'K2', dongu: true },
];
