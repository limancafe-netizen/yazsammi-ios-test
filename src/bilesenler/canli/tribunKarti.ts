// Tribün maç sonu paylaşım kartı (1080×1350, dikey). Sitede tuvalde çizilir (diğer paylaşım kartları gibi); uygulamada metin paylaşılır.
// İçerik: lig, iki takım rozeti (renk + kısaltma, LOGO YOK), skor, Yazsam mı?'nın 3 cümlelik gece özeti, kişinin tahmini ve puanı, marka şeridi.
import { Platform, Share } from 'react-native';
import { DONEM } from '@/tema/donem';
import type { TribunMac } from '@/canli';
import { karsitlik, yaziRengi } from './tribunOrtak';

const G = 1080, Y = 1350;

function kutu(c: CanvasRenderingContext2D, x: number, y: number, g: number, h: number, r: number) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + g, y, x + g, y + h, r);
  c.arcTo(x + g, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + g, y, r);
  c.closePath();
}
function satirlar(c: CanvasRenderingContext2D, metin: string, en: number) {
  const l: string[] = [];
  let s = '';
  for (const k of metin.split(' ')) {
    const d = s ? `${s} ${k}` : k;
    if (c.measureText(d).width > en && s) { l.push(s); s = k; } else s = d;
  }
  if (s) l.push(s);
  return l;
}
function rozet(c: CanvasRenderingContext2D, t: TribunMac['ev'], cx: number, cy: number, r: number) {
  c.save();
  c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.fillStyle = t.renk; c.fill();
  c.lineWidth = r / 7; c.strokeStyle = t.renk2; c.stroke();
  c.globalAlpha = 0.14; c.fillStyle = '#fff'; c.beginPath(); c.arc(cx, cy, r - r / 14, Math.PI, 0); c.fill(); c.globalAlpha = 1;
  c.fillStyle = yaziRengi(t.renk, t.renk2);
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.font = `800 ${Math.round(r * (t.kisa.length > 2 ? 0.55 : 0.66))}px Unbounded_800ExtraBold`;
  c.fillText(t.kisa, cx, cy + r * 0.04);
  c.restore();
}

export async function tribunKartiOlustur(o: { mac: TribunMac; ozet: string[]; tahmin: { ev: number; dep: number } | null; puan: number | null; mesaj: number }): Promise<Blob> {
  await Promise.all(['700 40px BricolageGrotesque_700Bold', '500 40px BricolageGrotesque_500Medium', '700 40px Caveat_700Bold', '800 40px Unbounded_800ExtraBold'].map((f) => document.fonts.load(f)));
  const tuval = document.createElement('canvas');
  tuval.width = G; tuval.height = Y;
  const c = tuval.getContext('2d')!;
  const m = o.mac;
  c.fillStyle = '#120E1F'; c.fillRect(0, 0, G, Y);
  // Takım renkleri iki yandan yumuşakça yayılır (radyal, sert kenar yok).
  const yika = (renk: string, cx: number) => {
    const g = c.createRadialGradient(cx, 300, 0, cx, 300, 760);
    g.addColorStop(0, renk + '99'); g.addColorStop(0.55, renk + '33'); g.addColorStop(1, renk + '00');
    c.fillStyle = g; c.fillRect(0, 0, G, Y);
  };
  yika(m.ev.renk, 120);
  yika(m.dep.renk, G - 120);
  c.fillStyle = m.ev.renk; c.fillRect(0, 0, G / 2, 12);
  c.fillStyle = m.dep.renk; c.fillRect(G / 2, 0, G / 2, 12);

  const vurgu = DONEM.vurgu.gece;
  c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  c.fillStyle = vurgu; c.font = '800 34px Unbounded_800ExtraBold';
  c.fillText('TRİBÜN', 90, 112);
  c.fillStyle = 'rgba(255,255,255,0.7)'; c.font = '700 30px BricolageGrotesque_700Bold';
  c.textAlign = 'right';
  c.fillText(m.ligKisa.replace(' · TEKRAR', ''), G - 90, 110);

  rozet(c, m.ev, 210, 330, 104);
  rozet(c, m.dep, G - 210, 330, 104);
  c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  c.fillStyle = '#fff'; c.font = '800 132px Unbounded_800ExtraBold';
  c.fillText(`${m.skor.ev}–${m.skor.dep}`, G / 2, 378);
  c.font = '700 40px BricolageGrotesque_700Bold';
  c.fillStyle = 'rgba(255,255,255,0.92)';
  c.fillText(m.ev.ad, 210, 504); c.fillText(m.dep.ad, G - 210, 504);
  c.fillStyle = 'rgba(255,255,255,0.14)'; kutu(c, G / 2 - 100, 424, 200, 52, 26); c.fill();
  c.fillStyle = '#fff'; c.font = '800 24px Unbounded_800ExtraBold'; c.fillText('MAÇ BİTTİ', G / 2, 460);

  // Özet paneli
  const py = 570;
  c.fillStyle = 'rgba(255,255,255,0.08)'; kutu(c, 70, py, G - 140, 470, 40); c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.14)'; c.lineWidth = 2; c.stroke();
  c.textAlign = 'left';
  c.fillStyle = vurgu; c.font = '700 30px BricolageGrotesque_700Bold';
  c.fillText('Yazsam mı? gecenin özeti', 112, py + 70);
  let y = py + 134;
  c.font = '500 37px BricolageGrotesque_500Medium';
  o.ozet.slice(0, 3).forEach((t, i) => {
    c.fillStyle = vurgu; c.font = '800 28px Unbounded_800ExtraBold'; c.fillText(String(i + 1), 112, y);
    c.fillStyle = '#fff'; c.font = '500 37px BricolageGrotesque_500Medium';
    for (const l of satirlar(c, t, G - 140 - 120 - 50).slice(0, 3)) { c.fillText(l, 164, y); y += 50; }
    y += 20;
  });

  // Tahmin + oda
  const ty = 1066;
  if (o.tahmin) {
    const tuttu = !!o.puan;
    c.fillStyle = tuttu ? 'rgba(61,220,151,0.18)' : 'rgba(255,255,255,0.08)'; kutu(c, 70, ty, G - 140, 84, 42); c.fill();
    c.fillStyle = tuttu ? '#3DDC97' : 'rgba(255,255,255,0.8)'; c.font = '700 34px BricolageGrotesque_700Bold';
    c.textAlign = 'center';
    c.fillText(`Tahminim ${o.tahmin.ev}–${o.tahmin.dep}${tuttu ? ` · tuttu, +${o.puan} puan` : ' · bu sefer tutmadı'}`, G / 2, ty + 55);
  }
  c.textAlign = 'center'; c.fillStyle = 'rgba(255,255,255,0.62)'; c.font = '500 30px BricolageGrotesque_500Medium';
  c.fillText(`Tribünde ${o.mesaj} mesaj yazıldı · resmî değildir, bahis yoktur`, G / 2, 1190);

  // Marka şeridi
  c.textAlign = 'left'; c.fillStyle = '#fff'; c.font = '800 46px Unbounded_800ExtraBold';
  c.fillText('Yazsam', 90, 1262);
  const gen = c.measureText('Yazsam').width;
  c.save(); c.translate(90 + gen + 14, 1272); c.rotate((-7 * Math.PI) / 180); c.fillStyle = vurgu; c.font = '700 72px Caveat_700Bold'; c.fillText('mı?', 0, 0); c.restore();
  c.textAlign = 'right'; c.fillStyle = '#fff'; c.font = '700 34px BricolageGrotesque_700Bold'; c.fillText('yazsammi.com', G - 90, 1238);
  c.font = '500 30px BricolageGrotesque_500Medium'; c.fillStyle = 'rgba(255,255,255,0.85)'; c.fillText('@yazsam.mi', G - 90, 1284);
  void karsitlik;
  return new Promise((coz) => tuval.toBlob((x) => coz(x!), 'image/png'));
}

// Web: paylaşma penceresi (telefon) ya da dosya indirme (bilgisayar). Uygulama: metin paylaşılır.
export async function tribunKartiPaylas(o: Parameters<typeof tribunKartiOlustur>[0]): Promise<boolean> {
  const metin = `${o.mac.ev.ad} ${o.mac.skor.ev}–${o.mac.skor.dep} ${o.mac.dep.ad}\n${o.ozet.slice(0, 3).join('\n')}\nTribün · yazsammi.com`;
  if (Platform.OS !== 'web') {
    try { await Share.share({ message: metin }); return true; } catch { return false; }
  }
  try {
    const blob = await tribunKartiOlustur(o);
    const dosya = new File([blob], 'yazsam-mi-tribun.png', { type: 'image/png' });
    const nav = navigator as Navigator & { canShare?: (v: unknown) => boolean };
    if (nav.canShare?.({ files: [dosya] })) {
      await navigator.share({ files: [dosya], title: 'Yazsam mı? Tribün', text: `${o.mac.ev.ad} ${o.mac.skor.ev}–${o.mac.skor.dep} ${o.mac.dep.ad} · yazsammi.com` });
      return true;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'yazsam-mi-tribun.png';
    a.click();
    return true;
  } catch {
    return false;
  }
}
