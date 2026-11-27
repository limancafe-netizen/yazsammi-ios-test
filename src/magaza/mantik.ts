// iOS satın alma SAF mantığı (18.11, sürüm 1.8.0). React Native'e bağlı değil → node ile sınanır: test/magaza_test.mjs
// Kapsam: ürün kimlikleri, sunucu sonucu → eylem eşlemesi, hak_yok → teklif eşlemesi, işlem durum makinesi (bekliyor → sunucu onayı → bitir; çift gönderim yok).
// Fiyat BURADA YOK: fiyat metni her zaman mağazadan (StoreKit displayPrice) gelir.

export const ABONELIKLER = ['plus_aylik', 'plus_yillik'] as const;
export const TUKETILEBILIRLER = ['kahin_okuma_1', 'kahin_okuma_3', 'astro_harita', 'astro_uyum'] as const;
export const URUN_KIMLIKLERI: readonly string[] = [...ABONELIKLER, ...TUKETILEBILIRLER];
export const bilinenUrun = (id: unknown): id is string => typeof id === 'string' && URUN_KIMLIKLERI.includes(id);
export const aboneMi = (id: string) => (ABONELIKLER as readonly string[]).includes(id);

export type Hak = { tarot?: number; harita?: number; uyum?: number };
export type UrunTanim = { id: string; tur: 'abonelik' | 'tuketilebilir'; sure?: string; hak?: Hak; plus_hak_aylik?: Hak };

// Sunucu listesine ulaşılamazsa kullanılan yedek: yalnız kimlik, tür, süre, hak sayısı (fiyat yok).
export const YEDEK_URUNLER: UrunTanim[] = [
  { id: 'plus_aylik', tur: 'abonelik', sure: 'P1M', plus_hak_aylik: { tarot: 3, harita: 1, uyum: 1 } },
  { id: 'plus_yillik', tur: 'abonelik', sure: 'P1Y', plus_hak_aylik: { tarot: 3, harita: 1, uyum: 1 } },
  { id: 'kahin_okuma_1', tur: 'tuketilebilir', hak: { tarot: 1 } },
  { id: 'kahin_okuma_3', tur: 'tuketilebilir', hak: { tarot: 3 } },
  { id: 'astro_harita', tur: 'tuketilebilir', hak: { harita: 1 } },
  { id: 'astro_uyum', tur: 'tuketilebilir', hak: { uyum: 1 } },
];
// Mağaza adı gelmezse görünen yedek ad (fiyat değil).
export const YEDEK_AD: Record<string, string> = {
  plus_aylik: 'Plus Aylık', plus_yillik: 'Plus Yıllık', kahin_okuma_1: 'Derin Tarot Açılımı', kahin_okuma_3: 'Üçlü Tarot Paketi', astro_harita: 'Doğum Haritası Yorumu', astro_uyum: 'Burç Uyumu Raporu',
};

/** Sunucunun /c/magaza/urunler gövdesinden güvenli liste: yalnız bilinen kimlikler, apple alanı kimlikle aynı olmalı. Bozuksa yedek. */
export function urunListesiCoz(govde: any): UrunTanim[] {
  const l = Array.isArray(govde?.urunler) ? govde.urunler : null;
  if (!l) return YEDEK_URUNLER;
  const cikti: UrunTanim[] = [];
  for (const u of l) {
    const sku = typeof u?.apple === 'string' ? u.apple : u?.id;
    if (!bilinenUrun(u?.id) || sku !== u.id) continue;
    cikti.push({ id: u.id, tur: u.tur === 'abonelik' ? 'abonelik' : 'tuketilebilir', ...(typeof u.sure === 'string' ? { sure: u.sure } : {}), ...(u.hak && typeof u.hak === 'object' ? { hak: u.hak } : {}), ...(u.plus_hak_aylik && typeof u.plus_hak_aylik === 'object' ? { plus_hak_aylik: u.plus_hak_aylik } : {}) });
  }
  return cikti.length ? cikti : YEDEK_URUNLER;
}

export function sureMetni(sure?: string) {
  return sure === 'P1M' ? '1 ay' : sure === 'P1Y' ? '1 yıl' : '';
}
const HAK_AD: Record<string, [string, string]> = { tarot: ['Derin Tarot açılımı', 'Derin Tarot açılımı'], harita: ['doğum haritası', 'doğum haritası'], uyum: ['burç uyumu', 'burç uyumu'] };
const hakParcalari = (h?: Hak) => (['tarot', 'harita', 'uyum'] as const).filter((k) => (h?.[k] ?? 0) > 0).map((k) => `${h![k]} ${HAK_AD[k][0]}`);
/** "ne dahil" satırı: Plus için aylık haklar, tek ürün için verdiği hak. */
export function neDahil(u: UrunTanim) {
  if (u.tur === 'abonelik') {
    const p = hakParcalari(u.plus_hak_aylik);
    return p.length ? `Ayda ${p.join(', ')}` : '';
  }
  const p = hakParcalari(u.hak);
  return p.length ? p.join(', ') : '';
}

// ---- sunucu sonucu → eylem ----
export type SunucuSonuc = { durum: string; islem?: string; urun?: string; bitir?: boolean; neden?: string };
export type Eylem = { basari: boolean; mesaj: string; kalici: boolean };
// kalici=false: sunucuya yeniden gönderilebilir (geçici hata); true: bu işlem için sunucu kararı verdi.
export type MagazaAdi = 'App Store' | 'Google Play';
export function sonucEylem(durum: string, magaza: MagazaAdi = 'App Store'): Eylem {
  switch (durum) {
    case 'verildi': return { basari: true, mesaj: 'Hakkın eklendi.', kalici: true };
    case 'zaten': return { basari: true, mesaj: 'Bu satın alma hesabına zaten işlenmişti.', kalici: true };
    case 'abonelik_aktif': return { basari: true, mesaj: 'Plus açıldı.', kalici: true };
    case 'yenileme_hatasi': return { basari: true, mesaj: 'Plus şimdilik açık; ödemende bir sorun var. ' + magaza + ' hesap ayarlarından bakabilirsin.', kalici: true };
    case 'sona_erdi': return { basari: false, mesaj: 'Bu aboneliğin süresi bitmiş.', kalici: true };
    case 'iade': return { basari: false, mesaj: 'Bu satın alma iade edilmiş.', kalici: true };
    case 'baska_hesap': return { basari: false, mesaj: 'Bu satın alma başka bir hesaba bağlı.', kalici: true };
    case 'gecersiz': return { basari: false, mesaj: 'Satın alma doğrulanamadı. Biraz sonra yeniden dene.', kalici: true };
    default: return { basari: false, mesaj: 'Şu an işlenemedi. Ödemen güvende, birazdan yeniden denenecek.', kalici: false };
  }
}

// ---- iptal / hata kodları (expo-iap ErrorCode) → sakin mesaj ----
export function hataMesaji(kod: string): { mesaj: string; sessiz: boolean } {
  if (kod === 'user-cancelled') return { mesaj: '', sessiz: true };
  if (kod === 'pending' || kod === 'deferred-payment') return { mesaj: 'Satın alma onay bekliyor. Onaylanınca hakkın eklenecek.', sessiz: false };
  if (kod === 'network-error' || kod === 'service-error' || kod === 'service-timeout' || kod === 'remote-error' || kod === 'iap-not-available') return { mesaj: 'Bağlantı kurulamadı. Biraz sonra yeniden dene.', sessiz: false };
  if (kod === 'already-owned') return { mesaj: 'Bu ürün zaten hesabında görünüyor. "Satın alımlarımı geri yükle" ile yenileyebilirsin.', sessiz: false };
  return { mesaj: 'Satın alma tamamlanamadı. Biraz sonra yeniden dene.', sessiz: false };
}

// ---- hak_yok → teklif eşlemesi ----
export type Teklif = { tur: 'teklif'; urun: string; secenekler: string[] } | { tur: 'yogun'; mesaj: string };
const TUR_URUN: Record<string, string[]> = { tarot: ['kahin_okuma_1', 'kahin_okuma_3'], harita: ['astro_harita'], uyum: ['astro_uyum'] };
function turBul(yol: string, istek: any): 'tarot' | 'harita' | 'uyum' | null {
  if (yol.startsWith('/c/kahin/')) return 'tarot';
  if (yol.startsWith('/c/astro/yorum')) return istek?.tur === 'uyum' ? 'uyum' : 'harita';
  return null;
}
/**
 * Derin Tarot / harita / uyum isteğinin sunucu cevabı: 402 hak_yok ise satın alma teklifi; 503 yogun ise sakin mesaj (ekran AÇILMAZ); gerisi null.
 * Kilit açıkken gövdede kod="hak_yok", urun, secenekler gelir; kapalıyken eski gövde (hata="hak_yok") gelir → ürün isteğin yolundan bulunur.
 */
export function hakYokTeklifi(durum: number, govde: any, yol: string, istek?: unknown): Teklif | null {
  const tur = turBul(yol, istek);
  if (!tur) return null;
  const hata = typeof govde?.hata === 'string' ? govde.hata : '';
  if (durum === 503 && (hata === 'yogun' || hata === 'kahin_yogun')) return { tur: 'yogun', mesaj: 'Şu an yoğunuz, biraz sonra tekrar dene.' };
  if (durum !== 402 || (govde?.kod !== 'hak_yok' && hata !== 'hak_yok')) return null;
  const gelen: string[] = (Array.isArray(govde?.secenekler) ? govde.secenekler : []).filter(bilinenUrun);
  const urunler = TUR_URUN[tur];
  const urun = bilinenUrun(govde?.urun) ? govde.urun : gelen.find((x) => !aboneMi(x)) ?? urunler[0];
  const liste: string[] = [urun];
  for (const x of [...gelen, ...urunler]) if (!aboneMi(x) && !liste.includes(x)) liste.push(x);
  // Plus: aylık ve yıllık eşit yan yana (sunucu yalnız plus_aylik önerse de ikisi de gösterilir)
  const plusluMu = aboneMi(urun);
  if (!plusluMu) for (const p of ABONELIKLER) liste.push(p);
  else for (const p of ABONELIKLER) if (!liste.includes(p)) liste.push(p);
  return { tur: 'teklif', urun, secenekler: liste };
}

// ---- işlem durum makinesi ----
export type IslemGirdi = { anahtar: string; jws: string; urun: string; nesne: unknown };
export type GonderYanit = { ok: true; sonuclar: SunucuSonuc[] } | { ok: false; durum: number; hata: string };
// Cayma hakkı onayı (Kullanım Şartları 2.3, md 9.6): satın alma isteğiyle sunucuya gider; sunucu satın alma kaydına yazar. Onay yoksa satın alma başlamaz.
export type Onay = { cayma_onay: true; cayma_onay_zaman: string };
export const onayYap = (zaman?: unknown): Onay => ({ cayma_onay: true, cayma_onay_zaman: typeof zaman === 'string' && zaman.length <= 40 && !Number.isNaN(Date.parse(zaman)) ? zaman : new Date().toISOString() });
export type Alici = {
  gonder: (jwsler: string[], girdiler?: IslemGirdi[]) => Promise<GonderYanit>;
  bitir: (nesne: unknown, tuketilebilir: boolean) => Promise<void>;
};
// tamam: sunucu kabul etti (basari ya da kalıcı ret); bekliyor: sunucuya ulaşılamadı/geçici hata, işlem Apple'da açık kalır, sonra yeniden gönderilir; zaten_bitti: bu oturumda zaten bitirilmiş.
export type IslemSonuc = { anahtar: string; urun: string; durum: 'tamam' | 'bekliyor' | 'zaten_bitti'; sunucu: string; basari: boolean; bitirildi: boolean; mesaj: string };

/** Android (Google Play): işlem listesi → sunucuya giden gövde {islemler:[{urun,token}], ...onay}. Makbuz = Play satın alma jetonu (Alinan.jws). Uç: POST /c/magaza/google/islem. */
export const googleGovdesi = (girdiler: { urun: string; jws: string }[], onay?: Onay) => ({ islemler: girdiler.map((g) => ({ urun: g.urun, token: g.jws })), ...(onay ?? {}) });

export const PARCA = 20;
export const parcala = <T,>(l: T[], n = PARCA): T[][] => {
  const c: T[][] = [];
  for (let i = 0; i < l.length; i += n) c.push(l.slice(i, i + n));
  return c;
};

export class IslemMotoru {
  private ucta = new Map<string, Promise<IslemSonuc>>(); // gönderimdeki işlemler (çift gönderim yok)
  private onayli = new Map<string, IslemGirdi & { sonuc: SunucuSonuc }>(); // sunucu kabul etti, bitirme başarısız: yalnız bitirme yeniden denenir
  private biten = new Set<string>(); // bu oturumda bitirilmiş işlemler
  private alici: Alici;
  private magaza: MagazaAdi;
  constructor(alici: Alici, magaza: MagazaAdi = 'App Store') {
    this.alici = alici;
    this.magaza = magaza;
  }

  durum(anahtar: string): 'yok' | 'gonderiliyor' | 'onayli' | 'bitti' {
    return this.biten.has(anahtar) ? 'bitti' : this.ucta.has(anahtar) ? 'gonderiliyor' : this.onayli.has(anahtar) ? 'onayli' : 'yok';
  }
  isle(g: IslemGirdi): Promise<IslemSonuc> {
    return this.topluIsle([g]).then((r) => r[0]);
  }
  async topluIsle(girdiler: IslemGirdi[]): Promise<IslemSonuc[]> {
    const sozler = new Map<string, Promise<IslemSonuc>>();
    const yeni: IslemGirdi[] = [];
    const gorulen = new Set<string>(); // aynı listede tekrar eden işlem bir kez gönderilir
    for (const g of girdiler) {
      if (sozler.has(g.anahtar) || gorulen.has(g.anahtar)) continue;
      if (this.biten.has(g.anahtar)) { sozler.set(g.anahtar, Promise.resolve(this.zatenBitti(g))); continue; }
      const mevcut = this.ucta.get(g.anahtar);
      if (mevcut) { sozler.set(g.anahtar, mevcut); continue; }
      const o = this.onayli.get(g.anahtar);
      if (o) { const p = this.bitirVeSonuc(o, o.sonuc).finally(() => this.ucta.delete(g.anahtar)); this.ucta.set(g.anahtar, p); sozler.set(g.anahtar, p); continue; }
      gorulen.add(g.anahtar);
      yeni.push(g);
    }
    // yeni işlemler: en çok 20'lik parçalar; her işlem için ayrı söz (aynı anda gelen ikinci çağrı aynı sözü bekler)
    const cozucu = new Map<string, (s: IslemSonuc) => void>();
    for (const g of yeni) {
      const p = new Promise<IslemSonuc>((c) => cozucu.set(g.anahtar, c)).finally(() => this.ucta.delete(g.anahtar));
      this.ucta.set(g.anahtar, p);
      sozler.set(g.anahtar, p);
    }
    for (const parca of parcala(yeni)) {
      let y: GonderYanit;
      try { y = await this.alici.gonder(parca.map((g) => g.jws), parca); } catch { y = { ok: false, durum: 0, hata: 'baglanti' }; }
      const sonuclar: IslemSonuc[] = [];
      if (!y.ok || y.sonuclar.length !== parca.length) {
        const bekle = y.ok ? 'hata' : y.durum === 400 ? 'gecersiz' : y.durum === 409 ? 'baska_hesap' : 'bekliyor';
        for (const g of parca) {
          if (bekle === 'gecersiz' || bekle === 'baska_hesap') sonuclar.push(this.kayitsiz(g, bekle, true));
          else sonuclar.push(this.kayitsiz(g, bekle, false, y.ok ? '' : girisGerek(y) ? 'Satın almayı tamamlamak için giriş yapman gerekiyor.' : 'Bağlantı kurulamadı. Ödemen güvende, bağlanınca hakkın eklenecek.'));
        }
      } else {
        for (let i = 0; i < parca.length; i++) sonuclar.push(await this.bitirVeSonuc({ ...parca[i] }, y.sonuclar[i]));
      }
      parca.forEach((g, i) => cozucu.get(g.anahtar)!(sonuclar[i]));
    }
    return Promise.all(girdiler.map((g) => sozler.get(g.anahtar)!));
  }
  private zatenBitti(g: IslemGirdi): IslemSonuc {
    return { anahtar: g.anahtar, urun: g.urun, durum: 'zaten_bitti', sunucu: 'zaten', basari: true, bitirildi: true, mesaj: '' };
  }
  private kayitsiz(g: IslemGirdi, sunucu: string, kalici: boolean, mesaj?: string): IslemSonuc {
    const e = sonucEylem(sunucu, this.magaza);
    return { anahtar: g.anahtar, urun: g.urun, durum: kalici ? 'tamam' : 'bekliyor', sunucu, basari: false, bitirildi: false, mesaj: mesaj || e.mesaj };
  }
  // Sunucu sonucunu işler. İşlem YALNIZ sunucu bitir:true derse bitirilir; tüketilebilir de sunucu onayından önce asla bitirilmez.
  private async bitirVeSonuc(g: IslemGirdi & { sonuc?: SunucuSonuc }, s: SunucuSonuc): Promise<IslemSonuc> {
    const e = sonucEylem(s?.durum ?? 'hata', this.magaza);
    const urun = typeof s?.urun === 'string' && s.urun ? s.urun : g.urun;
    let bitirildi = false;
    if (s?.bitir === true) {
      try { await this.alici.bitir(g.nesne, !aboneMi(urun)); bitirildi = true; this.biten.add(g.anahtar); this.onayli.delete(g.anahtar); }
      catch { this.onayli.set(g.anahtar, { anahtar: g.anahtar, jws: g.jws, urun: g.urun, nesne: g.nesne, sonuc: s }); }
    }
    return { anahtar: g.anahtar, urun: g.urun, durum: e.kalici ? 'tamam' : 'bekliyor', sunucu: s?.durum ?? 'hata', basari: e.basari, bitirildi, mesaj: e.mesaj };
  }
}
const girisGerek = (y: { ok: false; durum: number; hata: string }) => y.durum === 401 || y.durum === 403;

// ---- Plus durumu metni (Ben ekranı) ----
export type Haklarim = {
  kilit?: number; kurucu?: boolean; kurucu_dost?: boolean; // kurucu_dost: sunucu kurucuDost işareti (Plus süresiz, haklar ücretsiz)
  tarot?: { tadimlik_var?: boolean; satin_alinan?: number; plus_kalan?: number };
  harita?: { tadimlik_var?: boolean; satin_alinan?: number; plus_kalan?: number };
  uyum?: { satin_alinan?: number; plus_kalan?: number };
  plus?: { aktif?: boolean; urun?: string; bitis?: number; durum?: string; yenileme_hatasi?: boolean };
};
export const KURUCU_DOST_METNI = 'Kurucu Dost — tüm ayrıcalıklar süresiz açık';
/** Kurucu Dost hesabı mı (Plus süresiz açık; satın alma/geri yükleme gösterilmez). */
export const kurucuDostMu = (h: Haklarim | null | undefined): boolean => h?.kurucu_dost === true;
export function plusOzet(h: Haklarim | null | undefined, tarihYaz: (ms: number) => string): string {
  if (kurucuDostMu(h)) return KURUCU_DOST_METNI;
  const p = h?.plus;
  if (!p?.aktif) return 'Plus açık değil.';
  const ad = p.urun === 'plus_yillik' ? 'Plus Yıllık' : p.urun === 'plus_aylik' ? 'Plus Aylık' : 'Plus';
  const son = typeof p.bitis === 'number' && p.bitis > 0 ? ` · ${tarihYaz(p.bitis)} tarihine kadar` : '';
  return `${ad} açık${son}${p.durum === 'yenileme_hatasi' ? ' (ödeme sorunu var)' : ''}`;
}
export function kalanSatirlari(h: Haklarim | null | undefined): { ad: string; metin: string }[] {
  if (!h) return [];
  const sat = (ad: string, x?: { tadimlik_var?: boolean; satin_alinan?: number; plus_kalan?: number }) => {
    const p: string[] = [];
    if (x?.tadimlik_var) p.push('1 ücretsiz tadımlık');
    if ((x?.satin_alinan ?? 0) > 0) p.push(`${x!.satin_alinan} satın alınan`);
    if ((x?.plus_kalan ?? 0) > 0) p.push(`${x!.plus_kalan} Plus'tan`);
    return { ad, metin: p.length ? p.join(' · ') : 'Hakkın yok' };
  };
  return [sat('Derin Tarot', h.tarot), sat('Doğum haritası', h.harita), sat('Burç uyumu', h.uyum)];
}

// ---- WebView sayfaları (Tarot Kart Analizi / Astroloji) ↔ uygulama köprüsü (18.11, iOS) ----
// Sözleşme (site/*/js/kopru.js ile aynı; sınama: test/kopru_test.mjs):
//   sayfa → uygulama: {tur:'satin', urun, cayma_onay:true, cayma_onay_zaman} | {tur:'hakKullan', id, hak:'tarot'|'harita'|'uyum', anahtar?} | {tur:'plus'} | {tur:'geri'}
//   uygulama → sayfa: {tur:'urunler', urunler:[{id,fiyat}]} | {tur:'hak', urun} | {tur:'haklar', haklar:{tarot,harita,uyum}, plus:{aktif}} | {tur:'hakSonuc', id, ok, hakYok?, mesaj, haklar?} | {tur:'satinBitti', mesaj} | {tur:'geri'}
export type KopruMesaji =
  | { tur: 'satin'; urun: string; onay?: Onay } // onay: sayfadaki cayma onay kutusu işaretlendi (kutu yoksa/işaretsizse alan yok → uygulama satın almayı başlatmaz)
  | { tur: 'hakKullan'; id: string; hak: 'tarot' | 'harita' | 'uyum'; anahtar?: string }
  | { tur: 'plus' }
  | { tur: 'geri' }
  | { tur: 'bolumKazanildi' };
/** Sayfadan gelen ham metni doğrular; geçersizse null (uygulama yok sayar). */
export function kopruMesaji(ham: unknown): KopruMesaji | null {
  let m: any = ham;
  if (typeof ham === 'string') { try { m = JSON.parse(ham); } catch { return null; } }
  if (!m || typeof m !== 'object') return null;
  if (m.tur === 'satin') return typeof m.urun === 'string' && m.urun.length <= 40 ? { tur: 'satin', urun: m.urun, ...(m.cayma_onay === true ? { onay: onayYap(m.cayma_onay_zaman) } : {}) } : null;
  if (m.tur === 'hakKullan') {
    if (typeof m.id !== 'string' || !/^[0-9A-Za-z_-]{1,64}$/.test(m.id)) return null;
    if (m.hak !== 'tarot' && m.hak !== 'harita' && m.hak !== 'uyum') return null;
    if (m.anahtar !== undefined && !(typeof m.anahtar === 'string' && /^[0-9a-f]{16,64}$/.test(m.anahtar))) return null;
    return { tur: 'hakKullan', id: m.id, hak: m.hak, ...(m.anahtar ? { anahtar: m.anahtar } : {}) };
  }
  if (m.tur === 'plus') return { tur: 'plus' };
  if (m.tur === 'geri') return { tur: 'geri' };
  if (m.tur === 'bolumKazanildi') return { tur: 'bolumKazanildi' };
  return null;
}
/** Sayfanın gösterdiği hak sayıları: satın alınan + Plus'tan kalan (kurucu: sınırsız ~ 99). Tadımlık sayfada cihazda kalır (ilk okuma). */
export function sayfaHaklari(h: Haklarim | null | undefined): { tarot: number; harita: number; uyum: number } {
  const topla = (x?: { satin_alinan?: number; plus_kalan?: number }) => (h?.kurucu || kurucuDostMu(h) ? 99 : Math.max(0, (x?.satin_alinan ?? 0) | 0) + Math.max(0, (x?.plus_kalan ?? 0) | 0));
  return { tarot: topla(h?.tarot), harita: topla(h?.harita), uyum: topla(h?.uyum) };
}
export const sayfaPlus = (h: Haklarim | null | undefined) => ({ aktif: !!h?.plus?.aktif || kurucuDostMu(h) });
export type HakSonucYaniti = { tur: 'hakSonuc'; id: string; ok: boolean; hakYok?: boolean; mesaj: string; haklar?: { tarot: number; harita: number; uyum: number } };
/** POST /c/magaza/hak-kullan cevabı → sayfaya giden hakSonuc. */
export function hakSonucYap(id: string, r: { ok: boolean; durum?: number; hata?: string; veri?: any }): HakSonucYaniti {
  if (r.ok) return { tur: 'hakSonuc', id, ok: true, mesaj: '', haklar: sayfaHaklari(r.veri?.haklar) };
  if (r.durum === 402 || r.hata === 'hak_yok') return { tur: 'hakSonuc', id, ok: false, hakYok: true, mesaj: '' };
  if (r.durum === 401 || r.durum === 403) return { tur: 'hakSonuc', id, ok: false, mesaj: 'Hakkını kullanmak için giriş yapman gerekiyor.' };
  if (r.durum === 429) return { tur: 'hakSonuc', id, ok: false, mesaj: 'Çok sık denendi, biraz sonra yeniden dene.' };
  return { tur: 'hakSonuc', id, ok: false, mesaj: 'Bağlantı kurulamadı. Hakkın düşmedi, biraz sonra yeniden dene.' };
}
