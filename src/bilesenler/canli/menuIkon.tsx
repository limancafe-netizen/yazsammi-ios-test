// Alt menü "Balon Rıhtımı" ikonları (Onur 08.10 onayı; plan/23_MENU_PROFIL_TASARIM/ortak.js + menu_a2.js, plan/25_YAZ_DUGMESI/cay2.js).
// Canlı = çay bardağı (tek renk, ince belli silüet + tabak; seçiliyken çayla dolu, dönem renginde),
// Sohbet = iki konuşma balonu, Yankı = ses dalgalı balon, Ben = perçemli yüz. 24 ızgara, 1.75 çizgi, yuvarlak uç.
// Seçili sekmenin arkasında marka balonu biçiminde yumuşak vurgu (VURGU_YOL).
import { useId, useMemo } from 'react';
import { SvgXml } from 'react-native-svg';

const BALON = 'M12 3.5C18.2 3.5 21 6.7 21 10.95C21 15.2 17.8 18 12.6 18.1L10.45 18.1C9.3 19.1 7.55 20.05 5.4 20.25C6.5 19.2 7 18.2 7.15 17.25C4.45 15.9 3 13.75 3 10.95C3 6.7 5.8 3.5 12 3.5Z';
const donustur = (d: string, s: number, tx: number, ty: number) => {
  let i = 0;
  return d.replace(/-?\d*\.?\d+/g, (n) => String(+(parseFloat(n) * s + (i++ % 2 === 0 ? tx : ty)).toFixed(2)));
};
const ON = donustur(BALON, 0.8, 0.6, 4.2);
const ARKA = donustur(BALON, 0.7, 6.2, 0.3);
const YK = donustur(BALON, 0.8, 0.2, 4.4);

// Çay bardağı (plan/30_CAY_SIMGE, 08.10 yeniden çizim): gerçek ince belli Türk çay bardağı silüeti — geniş ağız + dışa açılan dudak,
// belde yumuşak S eğrisi, altta yuvarlak hazne, elips yay tabak. Seçisiz = çizgi + çay yüzeyi; seçili = çayla dolu, ağızda ince boşluk bandı.
const CAM = 'M6.2 2.9H17.8C16.2 5.18 15.9 6.7 15.9 10.5C15.9 12.85 17.2 13.32 17.2 15.2V15.3Q17.2 18.5 14 18.5H10Q6.8 18.5 6.8 15.3V15.2C6.8 13.32 8.1 12.85 8.1 10.5C8.1 6.7 7.8 5.18 6.2 2.9Z';
const CAY_YUZEY = 'M7.93 7.1H16.07';
const TABAK = 'M2.9 20.5C6.2 22.5 17.8 22.5 21.1 20.5';

export const VURGU_YOL = 'M19 1.5H39C48.4 1.5 56 9.1 56 18.5C56 27.9 48.4 35.5 39 35.5H17.5L10.6 39.4C9.6 40 8.5 39 9 38L10.4 34.4C4.9 31.6 2 26 2 18.5C2 9.1 9.6 1.5 19 1.5Z';

export type MenuIkonAd = 'canli' | 'sohbet' | 'yanki' | 'ben';

/** renk: çizgi rengi · dolu: seçili (gövde dolar) · ic: dolu gövdenin içindeki çizgiler (zemin rengi) · cay: çay kırmızısı */
function xml(ad: MenuIkonAd, renk: string, dolu: boolean, ic: string, cay: string, id: string, kalinlik: number) {
  const g = dolu ? `fill="${renk}"` : 'fill="none"';
  const a = dolu ? ic : renk; // .a: dolu iken zemin renginde
  const af = dolu ? ic : renk; // .af: dolu iken zemin renginde
  let ic2 = '';
  if (ad === 'canli')
    ic2 = dolu
      ? `<clipPath id="${id}"><rect x="0" y="7.1" width="24" height="18"/></clipPath><path d="${CAM}" fill="${renk}" stroke="none" clip-path="url(#${id})"/><path d="${CAM}"/><path d="${TABAK}"/>`
      : `<path d="${CAM}"/><path d="${CAY_YUZEY}"/><path d="${TABAK}"/>`;
  else if (ad === 'sohbet')
    ic2 = `<mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#fff"/><path d="${ON}" fill="#000" stroke="#000" stroke-width="4.2" stroke-linejoin="round"/></mask><path d="${ARKA}" mask="url(#${id})"/><path d="${ON}" ${g}/><circle cx="7.4" cy="12.96" r="1.08" fill="${af}" stroke="none"/><circle cx="10.2" cy="12.96" r="1.08" fill="${af}" stroke="none"/><circle cx="13" cy="12.96" r="1.08" fill="${af}" stroke="none"/>`;
  else if (ad === 'yanki')
    ic2 = `<path d="${YK}" ${g}/><circle cx="9.8" cy="13.16" r="1.55" fill="${af}" stroke="none"/><path d="M16.7 4.4A3.2 3.2 0 0 1 19.9 7.6"/><path d="M16.7 1.3A6.3 6.3 0 0 1 23 7.6"/>`;
  else
    ic2 = `<circle cx="12" cy="13.2" r="7.8" ${g}/><path d="M11.4 5.5C11 3.6 12.6 2.4 14.1 3.1C15.3 3.7 15 5.4 13.7 5.3"/><circle cx="9.3" cy="12.4" r="1.15" fill="${af}" stroke="none"/><circle cx="14.7" cy="12.4" r="1.15" fill="${af}" stroke="none"/><path d="M9.2 15.4Q12 17.9 14.8 15.4" stroke="${a}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-0.5 -0.5 25 25" fill="none" stroke="${renk}" stroke-width="${kalinlik}" stroke-linecap="round" stroke-linejoin="round">${ic2}</svg>`;
}

export function MenuIkon({ ad, boyut = 25, renk, dolu = false, ic, cay, kalinlik = 1.75 }: { ad: MenuIkonAd; boyut?: number; renk: string; dolu?: boolean; ic: string; cay: string; kalinlik?: number }) {
  const id = 'm' + useId().replace(/[^A-Za-z0-9_-]/g, '');
  const x = useMemo(() => xml(ad, renk, dolu, ic, cay, id, kalinlik), [ad, renk, dolu, ic, cay, id, kalinlik]);
  return <SvgXml xml={x} width={boyut} height={boyut} />;
}

export function VurguBalonu({ renk, genislik = 58 }: { renk: string; genislik?: number }) {
  const x = useMemo(() => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 58 40"><path d="${VURGU_YOL}" fill="${renk}"/></svg>`, [renk]);
  return <SvgXml xml={x} width={genislik} height={(genislik * 40) / 58} />;
}
