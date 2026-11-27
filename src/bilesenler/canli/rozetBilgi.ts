// Rozet bilgileri (ad, nasıl kazanılır, kısa söz) — plan/29_ROZETLER/ROZETLER.md. Saf veri (React yok; ortak.tsx de buradan okur).
export type Bilgi = { ad: string; nasil: string; soz: string; birim?: string; seviyeli?: boolean; ipucu?: string };
export const BILGI: Record<string, Bilgi> = {
  kurucu: { ad: 'Kurucu', nasil: 'Yazsam mı?’nın kurucusu.', soz: 'Burayı kuran el.' },
  kurucu_dost: { ad: 'Kurucu Dost', nasil: 'Yazsam mı?’nın kurucu dostlarına verilir. Tüm ayrıcalıklar süresiz açıktır.', soz: 'Bu yolda yanımızdaydın.' },
  oncu: { ad: 'Öncü', nasil: 'İlk 100 üyeden biri. Numara kayıt sırasına göre verildi; bu rozet bir daha verilmez. Öncülere özel: İnci balon rengi ve İlk Işık duvarı.', soz: 'Herkesten önce buradaydın.' },
  ilkses: { ad: 'İlk Ses', nasil: 'İlk yorumun ya da ilk balonun yayına çıkınca gelir.', soz: 'İlk sözün yayında.' },
  mudavim: { ad: 'Müdavim', nasil: 'Uygulamayı açtığın farklı gün sayısı. Kesintisiz olması gerekmez.', soz: 'Buranın çayı sende.', birim: 'gün', seviyeli: true },
  muhabbet: { ad: 'Muhabbet Kuşu', nasil: 'Yayındaki yorum sayın. Günde en çok 20 yorum sayılır, aynı yorumun tekrarı sayılmaz.', soz: 'Laf lafı açtı.', birim: 'yorum', seviyeli: true },
  okur: { ad: 'Okur', nasil: 'Ekranda okuduğun balon sayısı. Günde en çok 300 sayılır. Hangi balonu okuduğun saklanmaz, yalnız sayı tutulur.', soz: 'Sessiz ama her şeyi okuyorsun.', birim: 'balon', seviyeli: true },
  yazar: { ad: 'Yazar', nasil: 'Yayındaki balonlarının sayısı.', soz: 'Balonların akışta.', birim: 'balon', seviyeli: true },
  kalp: { ad: 'Kalp Mıknatısı', nasil: 'Başka üyelerden aldığın kalp (balon ve yorum). Kendi kalbin sayılmaz.', soz: 'Kalpler sana akıyor.', birim: 'kalp', seviyeli: true },
  bag: { ad: 'Bağ Kuran', nasil: 'Karşılıklı takipleştiğin kişi sayısı. Sonradan takip bırakılsa da rozet kalır.', soz: 'Karşılıklı takip, gerçek bağ.', birim: 'bağ', seviyeli: true },
  kidemli: { ad: 'Kıdemli', nasil: 'Üyelik yaşın. O gün uygulamayı açınca gelir.', soz: 'Eskilerden.', birim: 'gün', seviyeli: true },
  bumerang: { ad: 'Bumerang', nasil: '10 gün ya da daha uzun aradan sonra döndüğünde gelir. Her dönüşte sayı artar.', soz: 'Döndün. İyi ki.' },
  gece: { ad: 'Gece Kuşu', nasil: 'Gece 00:00–05:00 arasında 5 farklı gecede yazdın.', soz: 'Gece yarısı muhabbetçisi.', ipucu: 'Gece yarısıyla ilgili.' },
  donem: { ad: 'Gece 2026', nasil: 'Gece döneminde (Eylül–Kasım) 15 farklı gün uygulamayı aç. 30 Kasım’da kapanır, kaçırılan sonradan alınamaz.', soz: 'Gece dönemini burada geçirdin.', birim: 'gün' },
};
export const SIRA = Object.keys(BILGI);
export const SEVIYELI = new Set(SIRA.filter((r) => BILGI[r].seviyeli));
export const rozetAdi = (r: string) => BILGI[r]?.ad ?? 'Rozet';
export const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
export const tarihYaz = (iso?: string) => {
  if (!iso) return '';
  const t = new Date(Date.parse(iso) + 3 * 3600000);
  return `${t.getUTCDate()} ${AYLAR[t.getUTCMonth()]} ${t.getUTCFullYear()}`;
};
export const sayiYaz = (n: number) => n.toLocaleString('tr-TR');
export const seviyeYazi = (r: string, s: number) => (r === 'bumerang' ? `×${s}` : SEVIYELI.has(r) ? `${s}. seviye` : '');

