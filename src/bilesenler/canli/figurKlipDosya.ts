// 1.9.0: klip dosya haritası. Stüdyo teslim edince buraya satır eklenir (Metro require'ı statik ister; dosya yokken satır EKLENMEZ).
// Örnek: fener: { selam: require('../../../assets/figur/fener/selam.webp') }, bukalemun: { konus: require('../../../assets/figur/bukalemun/konus.webp') }
// (1.9: 2×12 klip eklendi; Fener'de kutlama, veda, saskin_2, guc_isik_2 yeniden üretilecek: aynı dosya adıyla değiştirmek yeter.) Harita boşken tüm figürler bugünkü durağan posteri gösterir.
import type { KlipDosyalari } from './figurKlip';

export const KLIP_DOSYALARI: KlipDosyalari = {
  fener: {
    bekle: require('../../../assets/figur/fener/bekle_2.webp'),
    dokun_tepki: require('../../../assets/figur/fener/dokun_tepki_2.webp'),
    dusunceli: require('../../../assets/figur/fener/dusunceli_2.webp'),
    // RET 25.11 yeniden üretimde: guc_isik: require('../../../assets/figur/fener/guc_isik_2.webp'),
    isik_yak: require('../../../assets/figur/fener/isik_yak_2.webp'),
    // RET 25.11 yeniden üretimde: kutlama: require('../../../assets/figur/fener/kutlama.webp'),
    merakli: require('../../../assets/figur/fener/merakli_2.webp'),
    // RET 25.11 yeniden üretimde: saskin: require('../../../assets/figur/fener/saskin_2.webp'),
    selam: require('../../../assets/figur/fener/selam_2.webp'),
    sevinc: require('../../../assets/figur/fener/sevinc_2.webp'),
    surukle: require('../../../assets/figur/fener/surukle.webp'),
    // RET 25.11 yeniden üretimde: veda: require('../../../assets/figur/fener/veda.webp'),
  },
  bukalemun: {
    bekle: require('../../../assets/figur/bukalemun/bekle_2.webp'),
    dokun_tepki: require('../../../assets/figur/bukalemun/dokun_tepki_2.webp'),
    dusunceli: require('../../../assets/figur/bukalemun/dusunceli_2.webp'),
    guc_renk: require('../../../assets/figur/bukalemun/guc_renk_2.webp'),
    guc_renk_3: require('../../../assets/figur/bukalemun/guc_renk_3.webp'),
    kutlama: require('../../../assets/figur/bukalemun/kutlama.webp'),
    merakli: require('../../../assets/figur/bukalemun/merakli_2.webp'),
    saskin: require('../../../assets/figur/bukalemun/saskin_2.webp'),
    selam: require('../../../assets/figur/bukalemun/selam_2.webp'),
    sevinc: require('../../../assets/figur/bukalemun/sevinc_2.webp'),
    surukle: require('../../../assets/figur/bukalemun/surukle.webp'),
    veda: require('../../../assets/figur/bukalemun/veda.webp'),
  },
};
