// KULLANILMIYOR (04.11.2026): eski KAHİN astroloji/tarot ekranı. Astroloji ve Tarot Kart Analizi artık sitenin /astroloji/ ve /tarot/ sayfaları,
// uygulamada WebView ile (bilesenler/canli/SiteBolumu.native.tsx); hiçbir ekran bu dosyayı içe aktarmıyor. Kod başvuru için duruyor, silinmedi.
// Doğum haritası çemberi (react-native-svg): dışta 12 burç halkası (element renginde), evler (varsa), gezegenler ve ortada açı çizgileri.
// Yükselen solda (saat 9), burçlar saat yönünün tersine; saat bilinmiyorsa Koç 0° solda ve ev çizgisi yok. Gezegen sembolleri Unicode.
import { useMemo } from 'react';
import Svg, { Circle, G, Line, Path, Text as SvgYazi } from 'react-native-svg';
import type { AstroHarita } from '@/canli';
import { ALTIN, SOLUK, YAZI } from './ortak';

export const BURC_SEMBOL = ['♈︎', '♉︎', '♊︎', '♋︎', '♌︎', '♍︎', '♎︎', '♏︎', '♐︎', '♑︎', '♒︎', '♓︎'];
export const GEZEGEN_SEMBOL: Record<string, string> = { gunes: '☉', ay: '☽', merkur: '☿', venus: '♀', mars: '♂', jupiter: '♃', saturn: '♄', uranus: '♅', neptun: '♆', pluton: '♇', dugum: '☊' };
const ELEMENT_RENK = ['rgba(255,110,64,0.30)', 'rgba(120,190,90,0.26)', 'rgba(255,214,102,0.26)', 'rgba(90,150,255,0.28)'];
const ACI_RENK: Record<string, string> = { kavuşum: '#F2C14E', karşıt: '#FF6B81', kare: '#FF6B81', üçgen: '#5AD1A0', altmışlık: '#6CB4FF' };

export function HaritaCark({ h, boyut }: { h: AstroHarita['harita']; boyut: number }) {
  const S = boyut, c = S / 2, R = S / 2 - 6, Rs = R * 0.84, Rg = R * 0.70, Ri = R * 0.50;
  const asc = h.asc ? h.asc.boylam : 0;
  const aci = (lon: number) => ((180 + (lon - asc)) * Math.PI) / 180; // matematik açısı (saat yönü tersine), asc solda
  const nok = (lon: number, r: number) => ({ x: c + r * Math.cos(aci(lon)), y: c - r * Math.sin(aci(lon)) });
  const sektor = (a0: number, a1: number, r0: number, r1: number) => {
    const p = (lon: number, r: number) => nok(lon, r);
    const A = p(a0, r1), B = p(a1, r1), C = p(a1, r0), D = p(a0, r0);
    return `M${A.x},${A.y} A${r1},${r1} 0 0 0 ${B.x},${B.y} L${C.x},${C.y} A${r0},${r0} 0 0 1 ${D.x},${D.y} Z`;
  };
  // gezegen etiket konumları: birbirine 8°'den yakınları aç
  const gez = useMemo(() => {
    const l = h.gezegenler.filter((g) => g.anahtar !== 'dugum' || true).map((g) => ({ ...g, gos: g.boylam })).sort((a, b) => a.boylam - b.boylam);
    for (let tur = 0; tur < 40; tur++) {
      let degisti = false;
      for (let i = 0; i < l.length; i++) {
        const j = (i + 1) % l.length;
        let d = l[j].gos - l[i].gos; if (d < 0) d += 360;
        if (d < 9 && l.length > 1) { const it = (9 - d) / 2 + 0.01; l[i].gos = (l[i].gos - it + 360) % 360; l[j].gos = (l[j].gos + it) % 360; degisti = true; }
      }
      if (!degisti) break;
    }
    return l;
  }, [h]);
  const bul = (k: string) => (k === 'asc' ? h.asc?.boylam : k === 'mc' ? h.mc?.boylam : h.gezegenler.find((g) => g.anahtar === k)?.boylam);
  return (
    <Svg width={S} height={S} viewBox={`0 0 ${S} ${S}`} accessibilityLabel="Doğum haritası çemberi">
      <Circle cx={c} cy={c} r={R} fill="rgba(11,6,20,0.85)" stroke="rgba(242,193,78,0.6)" strokeWidth={1.5} />
      {/* burç halkası */}
      {Array.from({ length: 12 }).map((_, i) => (
        <G key={i}>
          <Path d={sektor(i * 30, (i + 1) * 30, Rs, R)} fill={ELEMENT_RENK[i % 4]} stroke="rgba(242,193,78,0.35)" strokeWidth={0.8} />
          <SvgYazi x={nok(i * 30 + 15, (R + Rs) / 2).x} y={nok(i * 30 + 15, (R + Rs) / 2).y + 6} fontSize={S * 0.05} fill={YAZI} textAnchor="middle">{BURC_SEMBOL[i]}</SvgYazi>
        </G>
      ))}
      <Circle cx={c} cy={c} r={Rs} fill="none" stroke="rgba(242,193,78,0.5)" strokeWidth={1} />
      <Circle cx={c} cy={c} r={Rg} fill="none" stroke="rgba(237,233,246,0.18)" strokeWidth={0.8} />
      <Circle cx={c} cy={c} r={Ri} fill="rgba(30,20,52,0.55)" stroke="rgba(237,233,246,0.25)" strokeWidth={0.8} />
      {/* evler */}
      {h.evler?.map((e) => {
        const a = nok(e.boylam, Ri), b = nok(e.boylam, Rs);
        const sonraki = h.evler![e.ev % 12].boylam; let orta = e.boylam + ((((sonraki - e.boylam) % 360) + 360) % 360) / 2;
        const n = nok(orta, Ri * 0.84);
        return (
          <G key={e.ev}>
            <Line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={e.ev === 1 || e.ev === 10 || e.ev === 7 || e.ev === 4 ? ALTIN : 'rgba(237,233,246,0.28)'} strokeWidth={e.ev === 1 || e.ev === 10 || e.ev === 7 || e.ev === 4 ? 1.6 : 0.7} />
            <SvgYazi x={n.x} y={n.y + 4} fontSize={S * 0.034} fill={SOLUK} textAnchor="middle">{e.ev}</SvgYazi>
          </G>
        );
      })}
      {h.asc && <SvgYazi x={nok(asc, Rs + 0).x + 14} y={nok(asc, Rs).y - 6} fontSize={S * 0.034} fill={ALTIN} fontWeight="bold">ASC</SvgYazi>}
      {h.mc && <SvgYazi x={nok(h.mc.boylam, Rs).x} y={nok(h.mc.boylam, Rs).y + 14} fontSize={S * 0.034} fill={ALTIN} fontWeight="bold" textAnchor="middle">MC</SvgYazi>}
      {/* açı çizgileri */}
      {h.acilar.filter((a) => bul(a.a) !== undefined && bul(a.b) !== undefined && a.tur !== 'kavuşum').slice(0, 24).map((a, i) => {
        const p = nok(bul(a.a)!, Ri), q = nok(bul(a.b)!, Ri);
        return <Line key={i} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={ACI_RENK[a.tur]} strokeWidth={a.sapma < 2 ? 1.3 : 0.7} opacity={a.sapma < 2 ? 0.95 : 0.55} />;
      })}
      {/* gezegenler */}
      {gez.map((g) => {
        const gercek = nok(g.boylam, Rg), yer = nok(g.gos, (Rg + Ri) / 2 + (Rs - Rg) * 0.0 + (Rg - Ri) * 0.18);
        const tik = nok(g.boylam, Rs);
        const tik2 = nok(g.boylam, Rs - 5);
        return (
          <G key={g.anahtar}>
            <Line x1={tik.x} y1={tik.y} x2={tik2.x} y2={tik2.y} stroke={ALTIN} strokeWidth={1.2} />
            <Circle cx={gercek.x} cy={gercek.y} r={1.8} fill={ALTIN} />
            <SvgYazi x={yer.x} y={yer.y + S * 0.016} fontSize={S * 0.056} fill={g.anahtar === 'gunes' || g.anahtar === 'ay' ? ALTIN : YAZI} fontWeight="bold" textAnchor="middle">{GEZEGEN_SEMBOL[g.anahtar]}</SvgYazi>
            {g.geri && <SvgYazi x={yer.x + S * 0.034} y={yer.y + S * 0.03} fontSize={S * 0.028} fill="#FF8FA8" textAnchor="middle">R</SvgYazi>}
          </G>
        );
      })}
    </Svg>
  );
}
