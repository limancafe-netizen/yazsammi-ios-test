// Yazarken hafif ön kontrol (09.10): sunucudaki kelime süzgeciyle AYNI listeler (sunucu/motor/kufur.mjs, motor/uyari.mjs).
// Yalnız ipucu içindir: karar HER ZAMAN sunucudadır (tehdit, çocuk, kendine zarar vb. burada bakılmaz). Listeyi değiştirirsen
// sunucu/uyari_test.mjs bu dosyayla sunucuyu aynı örneklerde karşılaştırır; ikisini birlikte güncelle.
const SINIR = (kok: string) => new RegExp(String.raw`(?<!\p{L})(?:${kok})(?!\p{L})`, 'u');
// String.raw: ters eğik çizgiler olduğu gibi kalır; kalıplar ';' ile ayrılır (alternatifler '|' kullandığı için).
const KALIP = (t: string) => t.split(';').map(SINIR);
const AGIR = KALIP(String.raw`amk;amq;aq;mk;amına;amina;amını;amcık\p{L}*;orospu\p{L}*;oç;o\.ç\.?;piç\p{L}*;sik(?!ayet|ke)\p{L}*;yar+a[kğ]\p{L}*;ta[sş]+a[kğ]\p{L}*;göt(ü|ün|üne|ünü|üm|ten|e|veren|lek|oş|ünden)?;ibne\p{L}*;pezevenk\p{L}*;kahpe\p{L}*;yavşak\p{L}*;şerefsiz\p{L}*;puşt\p{L}*;gavat\p{L}*;kaltak\p{L}*;sürtük\p{L}*`);
const HAFIF = KALIP(String.raw`lan;ulan;salak\p{L}*;mal;aptal\p{L}*;gerizekal[ıi]\p{L}*;geri zekal[ıi]\p{L}*;dangalak\p{L}*;ahmak\p{L}*;ezik\p{L}*;oha;hıyar\p{L}*;öküz\p{L}*;manyak\p{L}*;dallama\p{L}*;angut\p{L}*;embesil\p{L}*`);
const SIYASET = /(?<!\p{L})(akp|ak parti|chp|mhp|iyi parti|dem parti|hdp|erdoğan|kılıçdaroğlu|özgür özel|imamoğlu|bahçeli|mansur yavaş|cumhurbaşkan\p{L}*|milletvekil\p{L}*)(?!\p{L})/iu;
const BAGLANTI = /https?:\/\/|www\.|(?<![\p{L}\d])[\w-]+\.(com|net|org|io|me|tr|ly|gg)(?![\p{L}\d])/iu;
const KISISEL = [/[\w.+-]+@[\w-]+\.[\w.]+/, /(\+?\d[\d\s-]{8,}\d)/];

export type OnKontrol = { kod: 'kufur' | 'siyaset' | 'baglanti' | 'kisisel_bilgi'; ifade: string[] };
export type Baglam = 'gonderi' | 'yorum' | 'tribun' | 'mesaj' | 'istek';

function kufurler(m: string) {
  const kel = m.split(/[\s,.!?…;:"'()]+/u).filter(Boolean);
  const bulunan: string[] = [];
  let agir = 0, hafif = 0;
  for (const k of kel) {
    const a = k.toLocaleLowerCase('tr');
    if (AGIR.some((d) => d.test(a))) { agir++; if (!bulunan.includes(k)) bulunan.push(k); }
    else if (HAFIF.some((d) => d.test(a))) { hafif++; if (!bulunan.includes(k)) bulunan.push(k); }
  }
  const toplam = agir + hafif, icerik = kel.length - toplam;
  const yogun = toplam > 0 && (icerik <= 1 || agir >= 2 || toplam / kel.length >= 0.3); // sunucu: "sadece" ve "yogun"
  return yogun ? bulunan : [];
}

// Sunucu sırası: kişisel bilgi, bağlantı, küfür (yoğun), siyaset. Özel mesajda yalnız kişisel bilgi; ilk mesajda (istek) bağlantı ve küfür de.
export function onKontrol(metin: string, baglam: Baglam): OnKontrol | null {
  if (metin.trim().length < 3) return null;
  const topla = (dizi: (string | undefined)[]) => dizi.filter((x): x is string => !!x).map((x) => x.trim());
  const kisisel = topla(KISISEL.map((d) => metin.match(d)?.[0]));
  if (kisisel.length) return { kod: 'kisisel_bilgi', ifade: kisisel };
  if (baglam !== 'mesaj') {
    const bag = topla(metin.split(/\s+/).filter((t) => BAGLANTI.test(t)).map((t) => t.replace(/[.,;:!?)]+$/, '')));
    if (bag.length) return { kod: 'baglanti', ifade: bag };
    const k = kufurler(metin);
    if (k.length) return { kod: 'kufur', ifade: k };
    if (baglam !== 'istek') {
      const s = metin.match(SIYASET)?.[0];
      if (s) return { kod: 'siyaset', ifade: [s] };
    }
  }
  return null;
}
