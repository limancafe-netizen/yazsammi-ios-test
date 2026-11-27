// Anket oyu kararı (E-22): üye yok ve cihaz kimliği yoksa (ölçüm izni verilmemiş) sunucu 400 cihaz_gerekli döner; istek hiç atılmaz, giriş istenir.
// Saf işlev (RN'e bağlı değil) → node ile sınanır (test/oy_test.mjs).
export const oyKarari = (g: { oturum: boolean; cihaz: boolean }): 'gonder' | 'giris' => (g.oturum || g.cihaz ? 'gonder' : 'giris');
export const oyGirisGerek = (r: { ok: boolean; durum?: number; hata?: string }) => !r.ok && r.durum === 400 && r.hata === 'cihaz_gerekli';
