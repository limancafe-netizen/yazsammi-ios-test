// Yalnız geliştirme: adreste ?mock=1 varken canli.ts istekleri buraya gelir (sunucu yokken ekranları denemek için).
// Cevaplar sunucu sözleşmesiyle aynı biçimde (plan/16 "Sunucu API"). Veriler cihaz belleğinde, sayfa yenilenince sıfırlanır.
type Ham = Record<string, any>;
type Cevap = { ok: true; veri: any } | { ok: false; durum: number; hata: string };

const DK = 60000;
const MARKA = { uid: 'marka', ad: 'yazsammi', marka: true };
const kisi = (ad: string) => ({ uid: `u_${ad}`, ad, marka: false });

let sayac = 1000;
const yeniId = (on: string) => `${on}${++sayac}`;
const baslangic = Date.now();

const TOHUM: Ham[] = [
  { tur: 'metin', tespit: true, metin: '“Müsait misin?” yazıp 40 dakika cevap beklemek bir tür meditasyon.', once: 2, begeni: 214, yorum: 31 },
  { tur: 'sohbet', kisi: 'Kerem', balonlar: [{ kim: 'o', metin: 'uyudun mu', saat: '01:12' }, { kim: 'ben', metin: 'yok', saat: '01:12' }, { kim: 'o', metin: 'bi şey sorcam ama kızma', saat: '01:13' }, { kim: 'o', metin: 'ya boşver', saat: '01:13' }], soru: 'Buna ne cevap verilir?', once: 9, begeni: 389, yorum: 57, enIyi: { ad: 'gece_kusu', metin: 'Artık sormadan uyuyamazsın Kerem, sor.' } },
  { yazar: 'mavi', tur: 'metin', metin: 'hocaya “kolay gelsin” yazdım, “size de” dedi. bu ilişki nereye gidiyor', once: 14, begeni: 96, yorum: 12, enIyi: { ad: 'yazsammi', marka: true, metin: 'Akademik bir aşk. Vize haftasına kadar sabret.' } },
  { tur: 'anket', soru: 'Sevgilin 3 saattir çevrimiçi ama cevap yok. Ne yaparsın?', secenekler: ['Ben de yazmam', '“?” atarım', 'Story’sine bakarım', 'Uyurum, sabah konuşuruz'], oylar: [48, 31, 67, 22], once: 21, begeni: 142, yorum: 44 },
  { tur: 'video', metin: 'Aylardır küssünüz. Hangisine cevap gelir: A mı B mi? 👀', video: '/video/1.mp4', kapak: '/video/1.jpg', once: 33, begeni: 512, yorum: 73 },
  { yazar: 'deniz_su', tur: 'metin', metin: 'eski sevgili 2 yıl sonra “nasılsın” yazdı. sadece “nasılsın”. nokta bile yok.', once: 41, begeni: 233, yorum: 48, enIyi: { ad: 'limon_7', metin: 'noktasız nasılsın = içerden pişmanlık' } },
  { tur: 'soru', soru: 'Bugün kime yazamadın?', once: 52, begeni: 77, yorum: 39, enIyi: { ad: 'bulut', metin: 'Dişçiye. Randevu iptal edeceğim, cesaret yok.' } },
  { tur: 'ozellik', ozellik: 'gunun', baslik: 'Günün Cümlesi', metin: 'Bu akşam 20:00’de yeni cümle. Yazsın mı, yazmasın mı?', once: 64, begeni: 58, yorum: 6 },
  { yazar: 'kahve_tiryakisi', tur: 'metin', metin: 'staj mülakatında “kendinizi 3 kelimeyle anlatın” dedi. “çok heyecanlıyım şu an” dedim. 4 kelime.', once: 78, begeni: 301, yorum: 26 },
  { tur: 'anket', soru: 'Grupta 2 dakikalık sesli mesaj geldi.', secenekler: ['Dinlerim', '2x hızla dinlerim', 'Yazıya çevirtirim', 'Hiç açmam'], oylar: [4, 7, 3, 2], once: 90, begeni: 19, yorum: 3 },
  { tur: 'metin', tespit: true, metin: 'Annenin “müsait olunca ara” mesajı = şimdi ara.', once: 104, begeni: 448, yorum: 35 },
  { yazar: 'bulut', tur: 'metin', metin: 'ev arkadaşıma bulaşıkları hatırlatmanın kibar bir yolu var mı. 4. gün.', once: 118, begeni: 64, yorum: 21, enIyi: { ad: 'yazsammi', marka: true, metin: '“Tabakları özledim, onlar da seni” de. Sıcak ama net.' } },
  { tur: 'sohbet', kisi: 'Selin Hanım', balonlar: [{ kim: 'o', metin: 'Yarın 9’da kısa bir görüşme yapalım.', saat: '22:47' }, { kim: 'ben', metin: 'Tabii, konu nedir?', saat: '22:51' }, { kim: 'o', metin: 'Yarın konuşuruz.', saat: '22:52' }], soru: 'Bu gece uyunur mu?', once: 135, begeni: 276, yorum: 62, enIyi: { ad: 'aysel_', metin: 'uyunmaz. CV güncellenir.' } },
  { tur: 'video', metin: '00:40’ta istifa mesajı yazma 🌙 Kararı gece ver, mesajı sabah gönder.', video: '/video/2.mp4', kapak: '/video/2.jpg', once: 150, begeni: 377, yorum: 41 },
  { yazar: 'mert_0', tur: 'metin', metin: 'kız arkadaşımın annesine ilk mesaj: “Merhaba efendim” mi “Merhaba teyzeciğim” mi. hayatım buna bağlı', once: 166, begeni: 188, yorum: 54 },
  { tur: 'ozellik', ozellik: 'balonlar', baslik: 'Balon Avı', metin: 'Bugünün balonunu yakala. Kim, ne hissetti?', once: 180, begeni: 41, yorum: 4 },
  { tur: 'soru', soru: 'Gönderip hemen “silindi” yaptığın son mesaj neydi?', once: 196, begeni: 120, yorum: 88 },
  { yazar: 'aysel_', tur: 'metin', metin: 'Cuma 17:59’da gelen “bir dakikan var mı” maili. hayır yok. hiç olmadı.', once: 214, begeni: 265, yorum: 19 },
  { tur: 'metin', metin: 'Pazartesi sabahı “günaydın” yazıp sonra silenler. Sizi görüyorum. ☀️', once: 230, begeni: 133, yorum: 22 },
  { tur: 'video', metin: 'Sen nasıl yazıyorsun? Özür Ustası mı, Tek Kelimeci mi? ✍️', video: '/video/3.mp4', kapak: '/video/3.jpg', once: 250, begeni: 290, yorum: 66 },
  { yazar: 'limon_7', tur: 'metin', metin: 'annem ilk kez çıkartma attı. aile grubu 20 dakikadır sessiz.', once: 270, begeni: 207, yorum: 17 },
  { tur: 'ozellik', ozellik: 'gundem', baslik: 'Gündem', metin: 'Maç gecesi kankana ne yazardın? Nabzı gör.', once: 290, begeni: 36, yorum: 2 },
  { tur: 'anket', soru: 'İlk buluşmadan sonra kim yazmalı?', secenekler: ['Davet eden', 'Kim önce eve vardıysa', 'Kim daha çok beğendiyse', 'İkisi aynı anda, kaos'], oylar: [82, 61, 95, 40], once: 320, begeni: 156, yorum: 70 },
  { tur: 'ozellik', ozellik: 'olc', baslik: 'Yazsam mı? ölç', metin: 'Göndermeden önce, onun gözünden oku.', once: 350, begeni: 88, yorum: 5 },
  { yazar: 'gece_kusu', tur: 'metin', metin: '3 gündür “yarın konuşuruz” diyen arkadaşım. bugün o yarın. hâlâ konuşmadık.', once: 380, begeni: 92, yorum: 11 },
  // "Görüldü" dizisi: 3 bölüm (her biri sohbet + anket; anket bölümün hemen altında).
  { tur: 'sohbet', kisi: 'Kaan', kurgu: true, dizi: { ad: 'Görüldü', sezon: 1, bolum: 3, baslik: 'Grup İfşası' }, metin: 'Geçen bölüm %64 ‘cesur’ dedi. Kahve planı yapıldı ama haber çabuk yayıldı.', balonlar: [{ kim: 'ben', metin: 'yarışamayacağını şimdiden kabul etmen iyi olmuş', saat: '22:21' }, { kim: 'o', metin: 'özgüvene bak', saat: '22:22' }, { kim: 'o', metin: 'yarın 8’de sahildeki kahveci?', saat: '22:24' }, { kim: 'ben', metin: 'uymadı diyemeyeceğim', saat: '22:25' }, { kim: 'o', metin: 'harika', saat: '22:26' }, { kim: 'o', metin: 'bu arada cumartesi ekibi duymuş. ece grup açtı', saat: '22:29' }], soru: 'Sence grupta ne yazıyorlar?', once: 3, begeni: 184, yorum: 47 },
  { tur: 'anket', dizi: { ad: 'Görüldü', sezon: 1, bolum: 3, baslik: 'Grup İfşası', tonlar: ['komik', 'tatlı', 'cesur'] }, soru: 'Bölüm 3: Defne ne yazsın?', secenekler: ['ece beni sabaha kadar sorguya çeker', 'eyvah yandık desene 🙈', 'bozuntuya verme, gelsinler'], oylar: [21, 34, 17], once: 3.02, begeni: 96, yorum: 22 },
  { tur: 'sohbet', kisi: 'Kaan', kurgu: true, dizi: { ad: 'Görüldü', sezon: 1, bolum: 2, baslik: 'Manav Kaan' }, metin: 'Geçen bölüm %58 ‘komik’ dedi. Defne manav savunmasına geçti.', balonlar: [{ kim: 'ben', metin: 'yan sokaktaki manav kaan, sana yazacaktım normalde', saat: '18:21' }, { kim: 'o', metin: 'manav kaan ha', saat: '18:22' }, { kim: 'o', metin: 'manav arkadaşına tercih edilmemek onur verici', saat: '18:22' }, { kim: 'ben', metin: 'domatesleri çok taze oluyor ama', saat: '18:24' }, { kim: 'o', metin: 'yarın akşam kahve içelim de manavla yarışamayacağımı göreyim', saat: '18:29' }], soru: 'Sence teklife ne desin?', once: 240, begeni: 263, yorum: 71 },
  { tur: 'anket', dizi: { ad: 'Görüldü', sezon: 1, bolum: 2, baslik: 'Manav Kaan', tonlar: ['tatlı', 'komik', 'cesur'], kazanan: 2 }, soru: 'Bölüm 2: Defne ne yazsın?', secenekler: ['manavın hatrı kalır ama kahveyi seçtim ☕', 'manav bu kadar trip atmıyordu', 'yarışamayacağını şimdiden kabul etmen iyi olmuş'], oylar: [27, 19, 82], once: 240.02, begeni: 118, yorum: 30 },
  { tur: 'sohbet', kisi: 'Kaan', kurgu: true, dizi: { ad: 'Görüldü', sezon: 1, bolum: 1, baslik: 'Mavi Tik' }, metin: 'Defne hayatının en yanlış mesajını gönderdi. Hem de en yanlış kişiye.', balonlar: [{ kim: 'ben', metin: 'kaan bugün yine çok tatlıydı ama o bana asla yazmaz', saat: '12:24' }, { kim: 'ben', metin: 'AY YANLIŞ OLDU', saat: '12:24' }, { kim: 'ben', metin: 'SİL', saat: '12:24' }, { kim: 'ben', metin: 'SİLMİYOR', saat: '12:25' }, { kim: 'o', metin: 'gördüm', saat: '12:27' }, { kim: 'o', metin: 'hangi kaan', saat: '12:28' }], soru: 'Sence Defne ilk ne yazmalı?', once: 600, begeni: 412, yorum: 96 },
  { tur: 'anket', dizi: { ad: 'Görüldü', sezon: 1, bolum: 1, baslik: 'Mavi Tik', tonlar: ['cesur', 'komik', 'tatlı'], kazanan: 1 }, soru: 'Bölüm 1: Defne ne yazsın?', secenekler: ['ece’ye yazacaktım aslında, evet sen', 'yan sokaktaki manav kaan, sana yazacaktım normalde', 'başka hangi kaan olacak 🙈'], oylar: [44, 96, 25], once: 600.02, begeni: 151, yorum: 38 },
  // Hiza denetimi (08.10): 280 harflik uzun yazı, kısa yazı, fotoğraflı gönderi, uzun marka yazısı akışın başında.
  { yazar: 'deniz_su', tur: 'metin', metin: 'Bugün otobüste yanımdaki teyze bütün yol boyunca telefonda torununa yemek tarifi anlattı, ben de dinleye dinleye mercimek çorbasını öğrendim. Sonra indim, markete gittim, malzemeleri aldım ve akşam ilk kez kendi çorbamı yaptım. Teyzeye teşekkür borçluyum, adını bile bilmiyorum.', once: 0.5, begeni: 12, yorum: 0 },
  { yazar: 'mavi', tur: 'metin', metin: 'günaydın 🌤️', once: 1, begeni: 4, yorum: 0 },
  { yazar: 'aysel_', tur: 'metin', metin: 'akşam yürüyüşünden bir kare, mesaj atmayı unuttum', foto: { url: '/og/og.png', en: 1200, boy: 630 }, once: 1.5, begeni: 21, yorum: 0 },
  { tur: 'metin', metin: 'Bir mesajı üç kez yazıp silmek kararsızlık değil, özen. Ama dördüncüde gönder: karşı taraf da muhtemelen aynı şeyi yapıyor, ikiniz de ekrana bakıp birinin ilk adımı atmasını bekliyorsunuz. İlk adım küçük olsun, “aklıma geldin” yeter.', once: 2.5, begeni: 64, yorum: 0 },
  // Haber kartı örnekleri (sahte haber ve sahte adres: yalnız arayüz denemesi; sunucu gerçek haberde kaynak/baslik/haber yollar). Sona eklenir: YORUMLAR sırası bozulmasın.
  { yazar: 'yazsammi', tur: 'metin', metin: 'Bir müze, “dokunmayın” yazan heykelin yanına dokunmatik ekran koymuş. Çocukluğumdaki bütün azarlar geçersiz sayılsın.', haber: true, baslik: 'Müze, “dokunmayın” yazan heykelin yanına dokunmatik ekran koydu', kaynak: { ad: 'ornekhaber.example', url: 'https://www.ornekhaber.example/kultur/muze-dokunmayin-yazan-heykelin-yanina-dokunmatik-ekran-koydu-123456' }, once: 1, begeni: 87, yorum: 9 },
  { yazar: 'yazsammi', tur: 'metin', metin: 'Bilim insanları kuşların uçarken beyninin yarısıyla uyuyabildiğini göstermiş. Pazartesi toplantılarında ben de aynısını yapıyorum, sadece uçamıyorum.', haber: true, baslik: 'Göçmen kuşlar uçarken beyninin yarısıyla uyuyabiliyor, yeni araştırma gösterdi ve bu cümle iki satırdan uzun olsun diye uzatıldı', kaynak: { ad: 'ornekhaber.example', url: 'https://haber.ornekajans.example/tr/bilim/gocmen-kuslar-ucarken-uyuyor/3123456' }, once: 3, begeni: 142, yorum: 14 },
  // Sürekli akış (14.10): konu etiketli haber kutuları ve hava kartı (sahte veri; yalnız arayüz denemesi).
  { yazar: 'yazsammi', tur: 'metin', metin: 'Antalya açıklarında 4.400 ila 4.700 yıllık bir gemi batığı bulundu; kazılarda seramik kaplar ve taş çapalar çıktı.', haber: true, kategori: 'ilginc', baslik: 'Türkiye kıyılarında dünyanın en eski gemi batığı keşfedildi', kaynak: { ad: 'ornekhaber.example', url: 'https://www.ornekhaber.example/dunya/turkiye-kiyilarinda-dunyanin-en-eski-gemi-batigi-kesfedildi-98765' }, once: 4, begeni: 31, yorum: 2 },
  { yazar: 'yazsammi', tur: 'metin', metin: 'Gram altın güne 3.250 lira seviyesinden başladı; fiyat bilgisi güncel veriye dayanıyor.', haber: true, kategori: 'ekonomi', baslik: 'Gram altın güne 3.250 liradan başladı', kaynak: { ad: 'ornekhaber.example', url: 'https://www.ornekhaber.example/ekonomi/gram-altin-gune-3250-liradan-basladi-55555' }, once: 6, begeni: 12, yorum: 0 },
  { yazar: 'yazsammi', tur: 'metin', metin: 'Bugün en sıcak yer Antalya (24 derece), en serin yer Ankara (11 derece). İstanbul ve Bursa için şemsiye iyi fikir.', kategori: 'hava', hava: { donem: 'sabah', baslik: 'Bugün hava', tarih: '2026-10-14', guncelleme: '07:30', atif: { ad: 'MET Norway', url: 'https://www.met.no/en', lisans: 'CC BY 4.0' }, sehirler: [{ ad: 'İstanbul', simge: 'saganak', derece: 17, enAz: 15, enCok: 18, yagis: 21.4 }, { ad: 'Ankara', simge: 'parcali', derece: 11, enAz: 8, enCok: 14, yagis: 0 }, { ad: 'İzmir', simge: 'azbulutlu', derece: 19, enAz: 16, enCok: 22, yagis: 0 }, { ad: 'Bursa', simge: 'yagmur', derece: 15, enAz: 13, enCok: 17, yagis: 6.2 }, { ad: 'Antalya', simge: 'acik', derece: 22, enAz: 19, enCok: 24, yagis: 0 }, { ad: 'Trabzon', simge: 'gokgurultulu', derece: 16, enAz: 14, enCok: 18, yagis: 11.8 }] }, once: 8, begeni: 40, yorum: 3 },
  // YouTube video kartı örnekleri (gerçek, gömülebilir NTV Spor videoları; yorum metni yalnız arayüz denemesi için yazıldı). Sona eklenir: YORUMLAR sırası bozulmasın.
  { yazar: 'yazsammi', tur: 'metin', metin: 'Galatasaray, Barcelona maçı öncesi bir klip paylaşmış. Maç daha başlamadı ama benim kafamda ilk yarı çoktan bitti.', baslik: 'Galatasaray, Barcelona Maçı Öncesi Klip Paylaştı | NTV Spor', yt: 'ObuPSdxtJ3g', kaynak: { ad: 'NTV Spor', url: 'https://www.youtube.com/watch?v=ObuPSdxtJ3g' }, once: 0.5, begeni: 63, yorum: 7 },
  { yazar: 'yazsammi', tur: 'metin', metin: 'Hafta sonu maçlarının özeti tek videoda. Ben hâlâ pazartesi toplantısının özetini çıkaramadım.', baslik: 'Galatasaray Zirveye Yerleşti! Şampiyonluk Yarışında Kritik Hafta | NTV Spor', yt: 'aXxKCQIsXs0', kaynak: { ad: 'NTV Spor', url: 'https://www.youtube.com/watch?v=aXxKCQIsXs0' }, once: 5, begeni: 41, yorum: 3 },
];

const YORUMLAR: Record<number, Ham[]> = {
  1: [
    { yazar: 'gece_kusu', metin: 'Artık sormadan uyuyamazsın Kerem, sor.', begeni: 88 },
    { yazar: 'mavi', metin: '“kızmam söyle” deyip kızacağım', begeni: 41, cevaplar: [{ yazar: 'yazsammi', metin: 'Dürüst cevap. Ama önce dinle, sonra kız.', begeni: 23 }] },
    { yazar: 'deniz_su', metin: 'boşver dediyse 2 dakika sonra geri gelir, bekle', begeni: 17 },
  ],
  2: [{ yazar: 'yazsammi', metin: 'Akademik bir aşk. Vize haftasına kadar sabret.', begeni: 54 }, { yazar: 'bulut', metin: '“size de” çok samimi bence', begeni: 9 }],
  5: [{ yazar: 'limon_7', metin: 'noktasız nasılsın = içerden pişmanlık', begeni: 61 }, { yazar: 'yazsammi', metin: '2 yıl sonra tek kelime, cevap da tek kelime olabilir: “iyiyim.”', begeni: 44 }],
  6: [{ yazar: 'bulut', metin: 'Dişçiye. Randevu iptal edeceğim, cesaret yok.', begeni: 33, cevaplar: [{ yazar: 'yazsammi', metin: '“Merhaba, randevumu ileri almak istiyorum.” Bitti, gönder.', begeni: 12 }] }, { yazar: 'aysel_', metin: 'babama. ama yarın kesin', begeni: 21 }],
};

type Kayit = Ham & { id: string; zaman: number; begenenler: Set<string>; oyVerenler: Map<string, number>; gizli?: boolean; incelemeBitis?: number };
const gonderiler: Kayit[] = [];
const yorumlar = new Map<string, (Ham & { id: string; zaman: number; begenenler: Set<string> })[]>();
const takipler = new Set<string>(); // "kim>kimi"
const uyeAdlari = new Map<string, string>(); // uid → ad
// E-posta girişi örneği (08.11): iste → bekleme kaydı; bekle → bağlantı "onaylanana" kadar bekliyor:true (adreste ?mock=1&baglanti=1 ya da window.__ornekBaglanti=true ya da 90 sn sonra).
const epostaBekleyen = new Map<string, { uid: string; t: number }>();
const epostaUyeler = new Set<string>();
const parolaliUyeler = new Map<string, { parola: string; uid: string }>();
let silDogrulamaT = 0; // hesap silme için gönderilen doğrulama bağlantısının zamanı (0: yok)
const ornekBaglantiOnaylandi = (t: number) => {
  const g: any = globalThis as any;
  return !!g.__ornekBaglanti || (typeof window !== 'undefined' && /[?&]baglanti=1/.test(window.location.search)) || Date.now() - t > 90000;
};
const zil: Ham[] = [];
let okunduAni = 0;
// Örnek özel mesajlar (Mesajlar ekranı denemesi). Uzun sohbet: liste kaydırma + klavye açıkken son mesaj görünür mü.
type OrnekMesaj = { id: string; ben: boolean; metin: string; zaman: number };
const sohbetKur = (kisi: any, durum: 'acik' | 'istek', okunmamis: number, satirlar: [boolean, string][]) => ({ kisi, durum, okunmamis, mesajlar: satirlar.map(([ben, metin], i): OrnekMesaj => ({ id: `m${i}`, ben, metin, zaman: baslangic - (satirlar.length - i) * 7 * DK })) });
const ornekSohbetler: Record<string, { kisi: any; durum: 'acik' | 'istek'; okunmamis: number; mesajlar: OrnekMesaj[] }> = {
  yazsammi: sohbetKur(MARKA, 'acik', 1, [[true, 'eski sevgilim 2 yıl sonra "nasılsın" yazdı, cevap versem mi'], [false, 'Önce şunu sor kendine: cevap verirsen ne olmasını istiyorsun? Merak mı, kapanış mı, yeniden başlangıç mı?'], [true, 'bilmiyorum açıkçası, biraz merak'], [false, 'Merak meşru. Kısa ve sakin bir "iyiyim, sen?" kapıyı aralar ama söz vermez. Uzun yazarsan beklenti doğar.']]),
  s_mavi: sohbetKur(kisi('mavi'), 'acik', 1, Array.from({ length: 14 }, (_, i): [boolean, string] => [i % 2 === 1, i % 3 === 0 ? 'hocaya yazdığın mesajı gördüm, efsane 😂 bence devamını da paylaş' : i % 3 === 1 ? 'aynen öyle' : 'yarın derste anlatırım, çok uzun hikâye ama değer'])),
  s_deniz: sohbetKur(kisi('deniz_su'), 'acik', 0, [[false, 'merhaba! gönderin çok iyiydi'], [true, 'teşekkürler 🙏']]),
  s_kerem: sohbetKur(kisi('kerem_42'), 'istek', 1, [[false, 'selam, anketteki cevabın çok iyiydi, tanışabilir miyiz?']]),
};

function yazarBul(ad?: string) {
  return !ad || ad === 'yazsammi' ? MARKA : kisi(ad);
}
function tohumla() {
  if (gonderiler.length) return;
  TOHUM.forEach((t, i) => {
    const { once, yazar, ...g } = t;
    const id = `g${i}`;
    gonderiler.push({ ...g, id, yazar: yazarBul(yazar), zaman: baslangic - once * DK, begenenler: new Set(), oyVerenler: new Map() });
    yorumlar.set(
      id,
      (YORUMLAR[i] ?? []).flatMap((y, j) => {
        const ust = { id: `y${i}_${j}`, yazar: yazarBul(y.yazar), metin: y.metin, begeni: y.begeni, zaman: baslangic - (once - 1 - j) * DK, begenenler: new Set<string>() };
        const alt = (y.cevaplar ?? []).map((c: Ham, k: number) => ({ id: `y${i}_${j}_${k}`, yazar: yazarBul(c.yazar), metin: c.metin, begeni: c.begeni, cevap: ust.id, zaman: ust.zaman + (k + 1) * 30000, begenenler: new Set<string>() }));
        return [ust, ...alt];
      }),
    );
  });
  // Sonsuz kaydırmayı denemek için daha eski gönderiler (aynı içeriklerin eski kopyaları).
  // KASMA ölçümü (yalnız web geliştirme, ?mock=1&cok=N): N gönderilik uzun akış.
  const cok = typeof window !== 'undefined' ? Math.min(2000, Number(new URLSearchParams(window.location?.search ?? '').get('cok')) || 0) : 0;
  for (let tur = 1; tur <= Math.max(2, Math.ceil(cok / TOHUM.length)); tur++)
    TOHUM.forEach((t, i) => {
      const { once, yazar, ...g } = t;
      if (g.dizi) return; // dizi bölümleri tekrarlanmaz
      gonderiler.push({ ...g, id: `e${tur}_${i}`, yazar: yazarBul(yazar), zaman: baslangic - (once + tur * 420) * DK, begenenler: new Set(), oyVerenler: new Map(), begeni: Math.round(g.begeni * 1.4), yorum: g.yorum });
    });
  zil.push(
    { id: 'z0', tur: 'dizi', kisiler: ['yazsammi'], sayi: 1, hedef: gonderiler.find((g) => g.dizi?.bolum === 3 && g.tur === 'sohbet')?.id, metin: 'Görüldü yeni bölüm: senin seçtiğin oldu', ozet: 'Bölüm 3: Grup İfşası', zaman: baslangic - 2 * DK },
    { id: 'z1', tur: 'begeni', kisiler: ['mavi', 'deniz_su', 'bulut'], sayi: 5, hedef: 'g2', ozet: 'hocaya “kolay gelsin” yazdım…', zaman: baslangic - 4 * DK },
    { id: 'z2', tur: 'cevap', kisiler: ['yazsammi'], sayi: 1, hedef: 'g1', ozet: 'Dürüst cevap. Ama önce dinle, sonra kız.', zaman: baslangic - 18 * DK },
    { id: 'z3', tur: 'takip', kisiler: ['gece_kusu', 'limon_7'], sayi: 2, zaman: baslangic - 70 * DK },
    { id: 'z4', tur: 'yorum', kisiler: ['aysel_'], sayi: 1, hedef: 'g6', ozet: 'babama. ama yarın kesin', zaman: baslangic - 3 * 60 * DK },
  );
}

// Yeni gelen gönderiler (canlılık için): her yoklamada belli aralıkla bir marka gönderisi eklenir.
const CANLI: Ham[] = [
  { tur: 'metin', tespit: true, metin: '“Haha” ile “hahahaha” arasındaki fark: 3 saniyelik samimiyet.' },
  { tur: 'anket', soru: 'Mesajı “Tamam.” diye noktalı bitirdi. Ne demek?', secenekler: ['Gerçekten tamam', 'Kızgın', 'Sadece alışkanlık'], oylar: [6, 9, 4] },
  { tur: 'soru', soru: 'Sana gelen en kısa ama en etkili mesaj?' },
  { tur: 'metin', metin: 'Grubun sessizliği bazen en yüksek sestir. Akşamınız güzel geçsin 🌆' },
];
let canliSira = 0;
let sonEkleme = baslangic;

function uidAl(oturum: string | null) {
  return oturum && oturum.startsWith('ornek.') ? oturum.slice(6) : null;
}
function cikti(g: Kayit, uid: string | null, cihaz: string) {
  const { begenenler, oyVerenler, gizli, incelemeBitis, ...d } = g;
  const kimlik = uid ?? cihaz;
  const oyum = oyVerenler.has(kimlik) ? oyVerenler.get(kimlik) : null;
  const ys = yorumlar.get(g.id) ?? [];
  if (d.dizi && d.tur === 'anket') d.dizi = diziAnket(d);
  return { ...d, begendim: uid ? begenenler.has(uid) : false, oyum, yorum: Math.max(d.yorum ?? 0, ys.length), inceleniyor: !!incelemeBitis && Date.now() < incelemeBitis };
}
const bekle = (ms: number) => new Promise((r) => setTimeout(r, ms));
// Dizi anketi: sonuçlanmışsa sonraki bölümün kimliği, güncelse sonraki bölüm saati (12:30 / 18:30 / 22:30, TR).
function diziAnket(d: Ham) {
  const sonraki = gonderiler.find((x) => x.tur === 'sohbet' && x.dizi?.sezon === d.dizi.sezon && x.dizi?.bolum === d.dizi.bolum + 1);
  if (sonraki) return { ...d.dizi, sonrakiBolum: sonraki.id };
  const TR = 3 * 3600000, simdi = Date.now(), gece = Date.parse(new Date(simdi + TR).toISOString().slice(0, 10) + 'T00:00:00Z') - TR;
  const slot = [0, 1].flatMap((g) => [750, 1110, 1350].map((dk) => gece + g * 86400000 + dk * 60000)).find((t) => t > simdi);
  return { ...d.dizi, sonraki: new Date(slot!).toISOString() };
}

export async function ornekIstek(yol: string, yontem: string, govde: any, oturum: string | null): Promise<Cevap> {
  tohumla();
  await bekle(yol.startsWith('/c/yeni') ? 60 : 220 + Math.random() * 180);
  const uid = uidAl(oturum);
  const cihaz = 'cihaz';
  const [yolAdi, sorgu = ''] = yol.split('?');
  const q = new URLSearchParams(sorgu);
  const girisGerek = (): Cevap | null => (uid ? null : { ok: false, durum: 401, hata: 'oturum' });
  const gorunur = (g: Kayit) => !g.gizli && (!g.incelemeBitis || Date.now() >= g.incelemeBitis || g.yazar.uid === uid);

  if (yolAdi === '/c/akis') {
    const tur = q.get('tur') ?? 'hepsi';
    const once = q.get('once');
    let liste = gonderiler.filter(gorunur).sort((a, b) => b.zaman - a.zaman);
    if (tur === 'takip') liste = liste.filter((g) => g.yazar.marka || (uid && takipler.has(`${uid}>${g.yazar.uid}`)) || g.yazar.uid === uid);
    if (once) liste = liste.filter((g) => g.zaman < +once);
    const sayfa = liste.slice(0, 12);
    return { ok: true, veri: { gonderiler: sayfa.map((g) => cikti(g, uid, cihaz)), imlec: liste.length > 12 ? String(sayfa[sayfa.length - 1].zaman) : null } };
  }
  if (yolAdi === '/c/yeni') {
    if (Date.now() - sonEkleme > 25000 && canliSira < CANLI.length) {
      const g = CANLI[canliSira++];
      gonderiler.push({ ...g, id: yeniId('c'), yazar: MARKA, zaman: Date.now(), begeni: 0, yorum: 0, begenenler: new Set(), oyVerenler: new Map() });
      sonEkleme = Date.now();
    }
    const sonra = +(q.get('sonra') ?? 0);
    return { ok: true, veri: { sayi: gonderiler.filter((g) => gorunur(g) && g.zaman > sonra).length, burada: 23 + Math.floor(Math.random() * 6) } };
  }
  const gonderiYol = yolAdi.match(/^\/c\/gonderi\/(.+)$/);
  if (gonderiYol) {
    const g = gonderiler.find((x) => x.id === decodeURIComponent(gonderiYol[1]));
    if (!g || g.gizli) return { ok: false, durum: 404, hata: 'yok' };
    const ys = (yorumlar.get(g.id) ?? []).map(({ begenenler, ...y }) => ({ ...y, begendim: uid ? begenenler.has(uid) : false }));
    return { ok: true, veri: { gonderi: cikti(g, uid, cihaz), yorumlar: ys } };
  }
  if (yolAdi === '/c/gonderi') {
    const e = girisGerek();
    if (e) return e;
    const metin = String(govde?.metin ?? '').trim();
    if (!metin || metin.length > 280) return { ok: false, durum: 400, hata: 'uzun' };
    const g: Kayit = { id: yeniId('g'), tur: 'metin', metin, yazar: { uid, ad: uyeAdlari.get(uid!) ?? uid, marka: false }, zaman: Date.now(), begeni: 0, yorum: 0, begenenler: new Set(), oyVerenler: new Map(), incelemeBitis: Date.now() + 9000 };
    gonderiler.push(g);
    yorumlar.set(g.id, []);
    setTimeout(() => {
      yorumlar.get(g.id)!.push({ id: yeniId('y'), yazar: MARKA, metin: 'Bunu okuyan herkes bir an durdu. İyi ki yazdın.', begeni: 0, zaman: Date.now(), begenenler: new Set() });
      zil.unshift({ id: yeniId('z'), tur: 'yorum', kisiler: ['yazsammi'], sayi: 1, hedef: g.id, ozet: 'Bunu okuyan herkes bir an durdu.', zaman: Date.now() });
    }, 12000);
    return { ok: true, veri: { gonderi: cikti(g, uid, cihaz) } };
  }
  if (yolAdi === '/c/yorum') {
    const e = girisGerek();
    if (e) return e;
    const metin = String(govde?.metin ?? '').trim();
    if (!metin || metin.length > 200) return { ok: false, durum: 400, hata: 'uzun' };
    const liste = yorumlar.get(govde.gonderi) ?? [];
    const y = { id: yeniId('y'), yazar: { uid, ad: uyeAdlari.get(uid!) ?? uid, marka: false }, metin, begeni: 0, cevap: govde.cevap ?? null, zaman: Date.now(), begenenler: new Set<string>() };
    liste.push(y);
    yorumlar.set(govde.gonderi, liste);
    const g = gonderiler.find((x) => x.id === govde.gonderi);
    if (g) g.yorum = (g.yorum ?? 0) + 1;
    setTimeout(() => liste.push({ id: yeniId('y'), yazar: MARKA, metin: 'Tam isabet. Bunu yazan bir kez daha düşünür 😄', begeni: 0, cevap: y.cevap ?? y.id, zaman: Date.now(), begenenler: new Set() }), 6000);
    const { begenenler, ...d } = y;
    return { ok: true, veri: { yorum: { ...d, begendim: false } } };
  }
  if (yolAdi === '/c/begen') {
    const e = girisGerek();
    if (e) return e;
    const hedef = govde.tur === 'yorum' ? [...yorumlar.values()].flat().find((y) => y.id === govde.hedef) : gonderiler.find((g) => g.id === govde.hedef);
    if (!hedef) return { ok: false, durum: 404, hata: 'yok' };
    const var_ = hedef.begenenler.has(uid!);
    if (var_) hedef.begenenler.delete(uid!);
    else hedef.begenenler.add(uid!);
    hedef.begeni = Math.max(0, (hedef.begeni ?? 0) + (var_ ? -1 : 1));
    return { ok: true, veri: { begendim: !var_, begeni: hedef.begeni } };
  }
  if (yolAdi === '/c/oy') {
    const g = gonderiler.find((x) => x.id === govde.gonderi);
    if (!g || !g.oylar) return { ok: false, durum: 404, hata: 'yok' };
    const kimlik = uid ?? cihaz;
    if (!g.oyVerenler.has(kimlik)) {
      g.oyVerenler.set(kimlik, govde.secenek);
      g.oylar = g.oylar.map((n: number, i: number) => (i === govde.secenek ? n + 1 : n));
    }
    return { ok: true, veri: { oylar: g.oylar } };
  }
  if (yolAdi === '/c/takip') {
    const e = girisGerek();
    if (e) return e;
    const k = `${uid}>${govde.uid}`;
    if (takipler.has(k)) takipler.delete(k);
    else takipler.add(k);
    return { ok: true, veri: { takip: takipler.has(k) } };
  }
  const profilYol = yolAdi.match(/^\/c\/profil\/(.+)$/);
  if (profilYol) {
    const ad = decodeURIComponent(profilYol[1]);
    const benimAdim = uid ? uyeAdlari.get(uid) ?? uid : null;
    const kendi = gonderiler.filter((g) => g.yazar.ad === ad && gorunur(g)).sort((a, b) => b.zaman - a.zaman);
    const y = ad === 'yazsammi' ? MARKA : ad === benimAdim ? { uid, ad, marka: false } : kisi(ad);
    if (!kendi.length && ad !== benimAdim && ad !== 'yazsammi' && !TOHUM.some((t) => t.yazar === ad)) return { ok: false, durum: 404, hata: 'yok' };
    const takipciEk = [...takipler].filter((k) => k.endsWith(`>${y.uid}`)).length;
    return {
      ok: true,
      veri: {
        uye: { ...y, takipci: (y.marka ? 4812 : 37 + ad.length * 7) + takipciEk, takip: y.marka ? 0 : 12 + ad.length, gonderiSayisi: kendi.length, takipEdiyorum: !!uid && takipler.has(`${uid}>${y.uid}`), ben: ad === benimAdim },
        gonderiler: kendi.slice(0, 30).map((g) => cikti(g, uid, cihaz)),
      },
    };
  }
  if (yolAdi === '/c/zil') {
    const e = girisGerek();
    if (e) return e;
    return { ok: true, veri: { bildirimler: zil.map((z) => ({ ...z, okundu: z.zaman <= okunduAni })), okunmamis: zil.filter((z) => z.zaman > okunduAni).length } };
  }
  if (yolAdi === '/c/dizi') {
    const bolumler = gonderiler.filter((g) => g.dizi && g.tur === 'sohbet').sort((a, b) => a.dizi.bolum - b.dizi.bolum).map((g) => {
      const a = gonderiler.find((x) => x.tur === 'anket' && x.dizi?.bolum === g.dizi.bolum);
      return { bolum: g.dizi.bolum, baslik: g.dizi.baslik, sohbet: cikti(g, uid, cihaz), anket: a ? cikti(a, uid, cihaz) : null };
    });
    return { ok: true, veri: { ad: 'Görüldü', sezon: 1, toplamBolum: 21, karakterler: { ben: 'Defne', o: 'Kaan' }, bolumler } };
  }
  if (yolAdi === '/c/zil/okundu') {
    okunduAni = Date.now();
    return { ok: true, veri: {} };
  }
  if (yolAdi === '/c/bildir') {
    const g = gonderiler.find((x) => x.id === govde.hedef);
    if (g && ['beni_anlatiyor', 'kisisel_bilgi', 'cocuk'].includes(govde.sebep)) g.gizli = true;
    return { ok: true, veri: { tamam: true } };
  }
  if (yolAdi === '/c/giris') {
    const ad = String(govde?.test ?? (govde?.idToken ? 'google_deneme' : '')).trim().toLowerCase().replace(/[^a-z0-9_çğıöşü]/g, '');
    if (!ad) return { ok: false, durum: 400, hata: 'ad_gecersiz' };
    const tanidik = uyeAdlari.has(ad);
    return { ok: true, veri: { oturum: `ornek.${ad}`, uye: { uid: ad, ad: tanidik ? uyeAdlari.get(ad) : '', yeni: !tanidik, davetGerekli: !tanidik } } }; // canlıdaki gibi davet kodu adımı da görünsün
  }
  if (yolAdi === '/c/eposta/durum') return { ok: true, veri: { acik: true, parola: true } };
  // Parolalı üyelik örneği (18.11): kayıt/giriş/unuttum. Bellek içi; "eski@ornek.com" = parolasız eski üye (takma adı 'eski_uye').
  if (yolAdi === '/c/eposta/kayit' || yolAdi === '/c/eposta/giris' || yolAdi === '/c/eposta/parola-iste') {
    const e = String(govde?.eposta ?? '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(e)) return { ok: false, durum: 400, hata: 'eposta_gecersiz' };
    const kayitli = e === 'eski@ornek.com' || parolaliUyeler.has(e);
    if (yolAdi === '/c/eposta/parola-iste') return { ok: true, veri: { tamam: true } };
    const p = String(govde?.parola ?? '');
    if (yolAdi === '/c/eposta/kayit') {
      if (p.length < 8) return { ok: false, durum: 400, hata: 'parola_kisa' };
      if (kayitli) return { ok: false, durum: 409, hata: 'eposta_kayitli' };
      parolaliUyeler.set(e, { parola: p, uid: 'p_' + e.split('@')[0].replace(/[^a-z0-9]/g, '') });
      const u = parolaliUyeler.get(e)!;
      epostaUyeler.add(u.uid);
      return { ok: true, veri: { oturum: `ornek.${u.uid}`, uye: { uid: u.uid, ad: '', yeni: true, yeniHesap: true } } };
    }
    if (e === 'eski@ornek.com') return { ok: false, durum: 409, hata: 'parola_yok' };
    const u = parolaliUyeler.get(e);
    if (!u) return { ok: false, durum: 404, hata: 'kayit_yok' };
    if (u.parola !== p) return { ok: false, durum: 401, hata: 'parola_yanlis' };
    epostaUyeler.add(u.uid);
    const ad = uyeAdlari.get(u.uid) ?? '';
    return { ok: true, veri: { oturum: `ornek.${u.uid}`, uye: { uid: u.uid, ad, yeni: !ad, yeniHesap: false } } };
  }
  if (yolAdi === '/c/eposta/iste') {
    if (govde?.amac === 'sil') {
      if (!uid || !epostaUyeler.has(uid)) return { ok: false, durum: 401, hata: 'giris_gerekli' };
      silDogrulamaT = Date.now();
      return { ok: true, veri: { tamam: true } };
    }
    const e = String(govde?.eposta ?? '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(e)) return { ok: false, durum: 400, hata: 'eposta_gecersiz' };
    if (e.startsWith('yogun@')) return { ok: true, veri: { tamam: true, yogun: true } }; // deneme: sunucunun dolu günlük tavan yanıtı
    if (/@(mailinator|yopmail|guerrillamail)\./.test(e)) return { ok: false, durum: 400, hata: 'eposta_gecici' };
    if (!/^[A-Za-z0-9_-]{24,64}$/.test(String(govde?.bekleme ?? ''))) return { ok: true, veri: { tamam: true, eslesme: '482' } };
    const ad = e.split('@')[0].replace(/[^a-z0-9_çğıöşü]/g, '');
    epostaBekleyen.set(String(govde.bekleme), { uid: ad || 'ornek', t: Date.now() });
    return { ok: true, veri: { tamam: true, eslesme: String(100 + Math.floor(Math.random() * 900)) } };
  }
  if (yolAdi === '/c/eposta/bekle') {
    const b = epostaBekleyen.get(String(govde?.bekleme ?? ''));
    if (!b) return { ok: true, veri: { bekliyor: false, bitti: false } };
    if (!ornekBaglantiOnaylandi(b.t)) return { ok: true, veri: { bekliyor: true } };
    epostaBekleyen.delete(String(govde.bekleme));
    epostaUyeler.add(b.uid);
    const tanidik = uyeAdlari.has(b.uid);
    return { ok: true, veri: { bekliyor: false, oturum: `ornek.${b.uid}`, uye: { uid: b.uid, ad: tanidik ? uyeAdlari.get(b.uid) : '', yeni: !tanidik, yeniHesap: !tanidik } } };
  }
  if (yolAdi === '/c/hesap/dogrulama') {
    const e = girisGerek();
    if (e) return e;
    const gerekli = epostaUyeler.has(uid!);
    return { ok: true, veri: { gerekli, tamam: !gerekli || (silDogrulamaT > 0 && ornekBaglantiOnaylandi(silDogrulamaT)) } };
  }
  if (yolAdi === '/c/hesap/sil') {
    const e = girisGerek();
    if (e) return e;
    if (epostaUyeler.has(uid!) && !(silDogrulamaT > 0 && ornekBaglantiOnaylandi(silDogrulamaT))) return { ok: false, durum: 403, hata: 'yeniden_dogrula' };
    uyeAdlari.delete(uid!);
    return { ok: true, veri: { tamam: true } };
  }
  if (yolAdi === '/c/oturum/hepsi') return girisGerek() ?? { ok: true, veri: { tamam: true, oturum } };
  if (yolAdi === '/c/ad') {
    const e = girisGerek();
    if (e) return e;
    const ad = String(govde?.ad ?? '');
    if (!/^[a-zA-Z0-9_çğıöşüÇĞİÖŞÜ]{3,20}$/.test(ad)) return { ok: false, durum: 400, hata: 'ad_gecersiz' };
    if (ad === 'yazsammi' || TOHUM.some((t) => t.yazar === ad)) return { ok: false, durum: 409, hata: 'ad_alinmis' };
    if (typeof govde?.dogumTarihi === 'string') {
      const [y, a, g] = govde.dogumTarihi.split('-').map(Number);
      const d = new Date(Date.UTC(y, (a || 0) - 1, g || 0));
      if (!y || d.getUTCFullYear() !== y || d.getUTCMonth() !== a - 1 || d.getUTCDate() !== g || y < 1900) return { ok: false, durum: 400, hata: 'dogum_tarihi' };
      const b = new Date();
      const yas = b.getFullYear() - y - (b.getMonth() + 1 < a || (b.getMonth() + 1 === a && b.getDate() < g) ? 1 : 0);
      if (yas < 18) return { ok: false, durum: 403, hata: 'yas' };
    } else if (new Date().getFullYear() - +govde.dogumYili < 18) return { ok: false, durum: 403, hata: 'yas' };
    if (govde?.kurallar !== true || govde?.soz !== true) return { ok: false, durum: 400, hata: 'kurallar' };
    uyeAdlari.set(uid!, ad);
    return { ok: true, veri: { uye: { uid, ad, yeni: false } } };
  }
  // Tribün örneği (08.11, "ilk maç odası serbest, ikincisinde üyelik" denemesi için): iki maç, boş akışlı oda.
  if (yolAdi === '/c/tribun/takvim' || yolAdi === '/c/tribun/durum' || yolAdi === '/c/tribun/mac') {
    const t0 = Date.now();
    const takim = (ad: string, kisa: string, renk: string, renk2: string) => ({ ad, kisa, renk, renk2 });
    const mac = (id: string, ev: any, dep: any, durum: string, baslangic: number, skor: { ev: number; dep: number }, dk: string) => ({ id, lig: 'Süper Lig', ligKisa: 'SL', avrupa: false, ev, dep, baslangic, kanal: 'Yayıncı', buyuk: false, derbi: false, destek: '', durum, skor, dk, odaAcik: true, tekrar: false, hiz: 1, bitis: null, odada: durum === 'canli' ? 23 : 0, oynaniyor: durum === 'canli', ben: { taraf: '', hatirlat: false, tahmin: null, puan: null } });
    const karasu = takim('Karasu', 'KRS', '#1F7AE0', '#FFFFFF'), dagspor = takim('Dağspor', 'DAG', '#E2456E', '#14232B'), liman = takim('Liman', 'LMN', '#2EC4A0', '#0B1A22'), kuzey = takim('Kuzey Yıldızı', 'KYZ', '#FFD23F', '#14232B');
    const maclar = [mac('mock_mac1', karasu, dagspor, 'canli', t0 - 34 * DK, { ev: 1, dep: 0 }, "34'"), mac('mock_mac2', liman, kuzey, 'oncesi', t0 + 3 * 60 * DK, { ev: 0, dep: 0 }, '')];
    if (yolAdi === '/c/tribun/takvim') return { ok: true, veri: { maclar, benMuhabir: false, simdi: t0 } };
    if (yolAdi === '/c/tribun/durum') return { ok: true, veri: { simdi: t0, canli: [maclar[0]], etiket: null, yaklasan: maclar[1] } };
    const m = maclar.find((x) => x.id === q.get('id'));
    if (!m) return { ok: false, durum: 404, hata: 'yok' };
    return { ok: true, veri: { simdi: t0, mac: m, akis: [{ t: 'olay', id: 'o1', tur: 'basladi', takim: null, oyuncu: '', dk: "1'", zaman: t0 - 34 * DK, teyit: true, iptal: false, skor: { ev: 0, dep: 0 }, kaynak: 'ornek' }], kararlar: [], tahmin: { ben: null, puan: null, acik: false, toplam: 0, dagilim: null, tablo: [], lig: [] }, taraf: { ben: '', sayilar: {} }, hatirlat: false, tepki: {}, ozet: null, benMuhabir: false } };
  }
  // Özel mesaj: örnek veride 2 sohbet + 1 istek + Yazsam mı? özel sohbeti (ekran denemesi için; asıl deneme test sunucusunda).
  if (yolAdi === '/c/mesaj/kutular') {
    const e = girisGerek();
    if (e) return e;
    const ozet = (id: string) => {
      const s = ornekSohbetler[id];
      const son = s.mesajlar[s.mesajlar.length - 1];
      return { id, kisi: s.kisi, durum: s.durum, giden: false, son: son ? { metin: son.metin, ben: son.ben, zaman: son.zaman } : null, okunmamis: s.okunmamis, zaman: son?.zaman ?? Date.now() };
    };
    return { ok: true, veri: { marka: ozet('yazsammi'), sohbetler: [ozet('s_mavi'), ozet('s_deniz')], istekler: [ozet('s_kerem')], okunmamis: 2, ayar: { mesajAl: 'takip', okunduGoster: true } } };
  }
  if (yolAdi === '/c/etiket') return { ok: true, veri: { liste: [MARKA, kisi('mavi'), kisi('deniz_su'), kisi('melis.k')].filter((k) => k.ad.startsWith((q.get('q') ?? '').toLowerCase())) } };
  if (yolAdi === '/c/hesap') return girisGerek() ?? { ok: true, veri: { adSonraki: null, susturma: null, katilim: new Date(baslangic - 3 * 86400000).toISOString(), ...(epostaUyeler.has(uid!) ? { eposta: `${uid!.slice(0, 1)}***@posta.com` } : {}) } };
  if (yolAdi === '/c/engellenenler') return girisGerek() ?? { ok: true, veri: { liste: [] } };
  const mesajYol = yolAdi.match(/^\/c\/mesaj\/([^/]+)(?:\/(\w+))?$/);
  if (mesajYol && mesajYol[1] !== 'istek') {
    const e = girisGerek();
    if (e) return e;
    const s = ornekSohbetler[decodeURIComponent(mesajYol[1])];
    if (!s) return { ok: false, durum: 404, hata: 'yok' };
    if (mesajYol[2]) {
      if (mesajYol[2] === 'kabul') s.durum = 'acik';
      if (mesajYol[2] === 'okundu') s.okunmamis = 0;
      return { ok: true, veri: { okunmamis: 0 } };
    }
    if (yontem === 'POST') {
      const m = { id: yeniId('m'), ben: true, metin: String(govde?.metin ?? ''), zaman: Date.now() };
      s.mesajlar.push(m);
      if (s.kisi.marka) setTimeout(() => s.mesajlar.push({ id: yeniId('m'), ben: false, metin: 'Okudum. Bence önce ne hissettiğini tek cümleyle yaz, gerisi kolay.', zaman: Date.now() }), 4000);
      return { ok: true, veri: { mesaj: m } };
    }
    const sonra = +(q.get('sonra') ?? 0);
    return { ok: true, veri: { sohbet: { id: mesajYol[1], kisi: s.kisi, durum: s.durum, giden: false, ...(s.kisi.marka ? { marka: true } : {}) }, mesajlar: s.mesajlar.filter((m) => m.zaman > sonra), karsiOkundu: Date.now() - 60000, okunduKapali: false, imlec: null, yaziyor: false } };
  }
  if (yolAdi === '/c/mesaj/istek') return girisGerek() ?? { ok: true, veri: { sohbet: 's_mavi' } };
  if (yolAdi === '/c/ayar') return girisGerek() ?? { ok: true, veri: { ayar: { mesajAl: govde?.mesajAl ?? 'takip', okunduGoster: govde?.okunduGoster ?? true } } };
  return { ok: false, durum: 404, hata: 'yok' };
}
