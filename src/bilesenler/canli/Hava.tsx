// Hava durumu kartı (14.10, sürekli akış): günde 2 kez markanın akışına düşer (sabah "Bugün hava", akşam "Yarın hava").
// Veri sunucudan gelir (MET Norway; sunucu/hava.mjs): şehir başına simge, derece, en düşük/en yüksek, yağış (mm). Kart HABER/VİDEO kartlarıyla aynı dili konuşur:
// ince çizgi, dönem vurgusu, açık/koyu tema. İkonlar burada çizilir (react-native-svg; dış görsel yok). Atıf (CC BY 4.0 şartı): "Veri: MET Norway" bağlantısı.
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Polygon } from 'react-native-svg';
import { yazi } from '@/tema/tema';
import { karistir, saydam } from '@/tema/donem';
import type { Hava, HavaSehir, HavaSimge } from '@/canli';
import { disariAc, type Renk } from './ortak';

export const HAVA_METIN: Record<HavaSimge, string> = {
  acik: 'Açık', azbulutlu: 'Az bulutlu', parcali: 'Parçalı bulutlu', bulutlu: 'Bulutlu', sis: 'Sisli', hafifyagmur: 'Hafif yağmurlu', yagmur: 'Yağmurlu',
  saganak: 'Sağanak yağışlı', karyagmur: 'Karla karışık yağmurlu', kar: 'Karlı', gokgurultulu: 'Gök gürültülü yağışlı',
};
const YAGISLI = new Set<HavaSimge>(['hafifyagmur', 'yagmur', 'saganak', 'karyagmur', 'kar', 'gokgurultulu']);
const derece = (n: number) => `${n < 0 ? '−' : ''}${Math.abs(Math.round(n))}°`;
const mm = (n: number) => `${(Math.round(n * 10) / 10).toString().replace('.', ',')} mm`;

// --- ikonlar: 48x48 kutuda; güneş sarı, yağmur mavi, bulut tema rengine göre ---
const GUNES = '#FFB52E';
function Gunes({ cx, cy, r, isin = true }: { cx: number; cy: number; r: number; isin?: boolean }) {
  const isinlar = isin ? Array.from({ length: 8 }, (_, i) => { const a = (i * Math.PI) / 4; return <Line key={i} x1={cx + Math.cos(a) * (r + 3)} y1={cy + Math.sin(a) * (r + 3)} x2={cx + Math.cos(a) * (r + 6.5)} y2={cy + Math.sin(a) * (r + 6.5)} stroke={GUNES} strokeWidth={2.6} strokeLinecap="round" />; }) : null;
  return <G>{isinlar}<Circle cx={cx} cy={cy} r={r} fill={GUNES} /></G>;
}
function Bulut({ x = 0, y = 0, olcek = 1, dolgu, cizgi }: { x?: number; y?: number; olcek?: number; dolgu: string; cizgi: string }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${olcek})`}>
      <Path d="M13.5 36a8.5 8.5 0 0 1-.6-17 11.5 11.5 0 0 1 22 2.4A7.3 7.3 0 0 1 34.6 36Z" fill={dolgu} stroke={cizgi} strokeWidth={1.4} strokeLinejoin="round" />
    </G>
  );
}
export function HavaIkon({ simge, boyut = 48, gece = false }: { simge: HavaSimge; boyut?: number; gece?: boolean }) {
  const bulut = gece ? '#CBD6EC' : '#FFFFFF';
  const koyu = gece ? '#8E9CBA' : '#A9B7CE';
  const cizgi = gece ? 'rgba(255,255,255,0.0)' : 'rgba(110,130,165,0.55)';
  const koyuCizgi = gece ? 'rgba(255,255,255,0.0)' : 'rgba(90,110,145,0.6)';
  const damla = gece ? '#6AA6FF' : '#3F82F5';
  const yagmurCizgi = (xs: number[], kalin = 2.6) => xs.map((x, i) => <Line key={i} x1={x} y1={38 + (i % 2) * 2} x2={x - 3.2} y2={45 + (i % 2) * 2} stroke={damla} strokeWidth={kalin} strokeLinecap="round" />);
  const kar = (xs: number[]) => xs.map((x, i) => <Circle key={i} cx={x} cy={42 + (i % 2) * 2.5} r={2} fill="#fff" stroke={gece ? '#B9C8E6' : '#8FA9D3'} strokeWidth={1.2} />);
  let ic;
  switch (simge) {
    case 'acik': ic = <Gunes cx={24} cy={24} r={9.5} />; break;
    case 'azbulutlu': ic = <><Gunes cx={19} cy={19} r={8} /><Bulut x={7} y={6} olcek={0.78} dolgu={bulut} cizgi={cizgi} /></>; break;
    case 'parcali': ic = <><Gunes cx={17} cy={16} r={7.5} /><Bulut x={2} y={3} olcek={0.95} dolgu={bulut} cizgi={cizgi} /></>; break;
    case 'bulutlu': ic = <><Bulut x={9} y={-3} olcek={0.8} dolgu={koyu} cizgi={koyuCizgi} /><Bulut x={-2} y={3} olcek={0.95} dolgu={bulut} cizgi={cizgi} /></>; break;
    case 'sis': ic = <><Bulut x={0} y={-4} olcek={0.95} dolgu={bulut} cizgi={cizgi} />{[36, 41, 46].map((y, i) => <Line key={y} x1={10 + i * 2} y1={y} x2={38 - i * 2} y2={y} stroke={koyu} strokeWidth={2.6} strokeLinecap="round" />)}</>; break;
    case 'hafifyagmur': ic = <><Bulut x={0} y={-5} olcek={0.95} dolgu={bulut} cizgi={cizgi} />{yagmurCizgi([19, 28])}</>; break;
    case 'yagmur': ic = <><Bulut x={0} y={-5} olcek={0.95} dolgu={koyu} cizgi={koyuCizgi} />{yagmurCizgi([16, 24, 32])}</>; break;
    case 'saganak': ic = <><Bulut x={0} y={-6} olcek={0.95} dolgu={koyu} cizgi={koyuCizgi} />{yagmurCizgi([13, 20, 27, 34], 3)}</>; break;
    case 'karyagmur': ic = <><Bulut x={0} y={-5} olcek={0.95} dolgu={koyu} cizgi={koyuCizgi} />{yagmurCizgi([16, 31])}{kar([24])}</>; break;
    case 'kar': ic = <><Bulut x={0} y={-5} olcek={0.95} dolgu={bulut} cizgi={cizgi} />{kar([16, 24, 32])}</>; break;
    case 'gokgurultulu': ic = <><Bulut x={0} y={-5} olcek={0.95} dolgu={koyu} cizgi={koyuCizgi} /><Polygon points="25,29 18,40 23.5,40 21.5,47 31,35 25.5,35 28,29" fill="#FFD23F" stroke="#E5A700" strokeWidth={1.1} strokeLinejoin="round" /></>; break;
    default: ic = <Bulut x={0} y={0} dolgu={bulut} cizgi={cizgi} />;
  }
  return <Svg width={boyut} height={boyut} viewBox="0 0 48 48">{ic}</Svg>;
}
function Damla({ renk }: { renk: string }) {
  return (
    <Svg width={11} height={13} viewBox="0 0 11 13">
      <Path d="M5.5 .8C3.6 3.6 1.4 5.6 1.4 8.1a4.1 4.1 0 0 0 8.2 0C9.6 5.6 7.4 3.6 5.5.8Z" fill={renk} />
    </Svg>
  );
}

function Yagis({ s, R }: { s: HavaSehir; R: Renk }) {
  const var_ = s.yagis >= 0.2;
  return (
    <View style={st.yagisSatir}>
      <Damla renk={var_ ? (R.gece ? '#6AA6FF' : '#3F82F5') : R.soluk} />
      <Text style={[st.yagisYazi, { color: var_ ? R.murekkep : R.soluk }]}>{var_ ? mm(s.yagis) : 'yağış yok'}</Text>
    </View>
  );
}

const adresAc = disariAc;

export function HavaKart({ hava, R }: { hava: Hava; R: Renk }) {
  const [ana, ...digerleri] = hava.sehirler;
  if (!ana) return null;
  const zemin = karistir(R.vurgu, R.panel, R.gece ? 0.08 : 0.045);
  const kutu = karistir(R.vurgu, R.panel, R.gece ? 0.03 : 0.015);
  const aksam = hava.donem === 'aksam';
  const ozet = hava.sehirler.map((s) => `${s.ad} ${HAVA_METIN[s.simge].toLocaleLowerCase('tr')}, ${s.enAz} ile ${s.enCok} derece${s.yagis >= 0.2 ? `, yağış ${mm(s.yagis)}` : ''}`).join('; ');
  return (
    <View accessible accessibilityLabel={`${hava.baslik}. ${ozet}. Veri: ${hava.atif.ad}`} style={[st.kart, { backgroundColor: zemin, borderColor: R.cizgi }]}>
      <View style={st.ust}>
        <Text style={[st.etiket, { color: R.vurgu, backgroundColor: R.vurguYumusak }]}>HAVA</Text>
        <Text numberOfLines={1} style={[st.baslik, { color: R.soluk }]}>{hava.baslik}{hava.guncelleme ? ` · ${hava.guncelleme}` : ''}</Text>
      </View>
      <View style={[st.ana, { borderBottomColor: R.ince }]}>
        <HavaIkon simge={ana.simge} boyut={68} gece={R.gece} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={[st.anaSehir, { color: R.soluk }]}>{ana.ad}</Text>
          <Text style={[st.anaDerece, { color: R.murekkep }]}>{derece(ana.derece)}</Text>
          <Text numberOfLines={1} style={[st.anaDurum, { color: R.murekkep }]}>{HAVA_METIN[ana.simge]} · {derece(ana.enAz)} / {derece(ana.enCok)}</Text>
        </View>
        <View style={st.anaYagis}>
          <Yagis s={ana} R={R} />
        </View>
      </View>
      <View style={st.izgara}>
        {digerleri.map((s) => (
          <View key={s.ad} style={[st.kutu, { backgroundColor: kutu, borderColor: R.ince }]}>
            <HavaIkon simge={s.simge} boyut={34} gece={R.gece} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={[st.sehir, { color: R.murekkep }]}>{s.ad}</Text>
              <Text numberOfLines={1} style={[st.aralik, { color: R.soluk }]}>{derece(s.enAz)} / {derece(s.enCok)}</Text>
              <Yagis s={s} R={R} />
            </View>
            <Text style={[st.derece, { color: R.murekkep }]}>{derece(s.derece)}</Text>
          </View>
        ))}
      </View>
      <View style={st.alt}>
        <Text style={[st.not, { color: R.soluk }]}>{aksam ? 'Yarın gündüz saatleri' : 'Bugün gündüz saatleri'}</Text>
        <Pressable onPress={() => hava.atif.url && adresAc(hava.atif.url)} accessibilityRole="link" accessibilityLabel={`Veri kaynağı: ${hava.atif.ad}`} hitSlop={8}>
          <Text style={[st.atif, { color: saydam(R.murekkep, 0.62) }]}>Veri: {hava.atif.ad}{hava.atif.lisans ? ` · ${hava.atif.lisans}` : ''}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  kart: { borderWidth: 1, borderRadius: 16, paddingTop: 11, paddingBottom: 10, overflow: 'hidden' },
  ust: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, marginBottom: 6 },
  etiket: { fontFamily: yazi.kalin, fontSize: 10.5, letterSpacing: 0.9, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, overflow: 'hidden' },
  baslik: { fontFamily: yazi.orta, fontSize: 12.5, flexShrink: 1 },
  ana: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingBottom: 10, borderBottomWidth: 1 },
  anaSehir: { fontFamily: yazi.kalin, fontSize: 13, letterSpacing: 0.1 },
  anaDerece: { fontFamily: yazi.kalin, fontSize: 40, lineHeight: 44, letterSpacing: -1.2 },
  anaDurum: { fontFamily: yazi.orta, fontSize: 13.5, marginTop: 1 },
  anaYagis: { alignSelf: 'flex-end', paddingBottom: 2 },
  izgara: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 12, paddingTop: 10 },
  kutu: { flexGrow: 1, flexBasis: '46%', minWidth: 140, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 7 },
  sehir: { fontFamily: yazi.kalin, fontSize: 13.5, letterSpacing: -0.1 },
  aralik: { fontFamily: yazi.orta, fontSize: 11.5, marginTop: 0 },
  derece: { fontFamily: yazi.kalin, fontSize: 19, letterSpacing: -0.5 },
  yagisSatir: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  yagisYazi: { fontFamily: yazi.orta, fontSize: 11.5 },
  alt: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingTop: 9 },
  not: { fontFamily: yazi.orta, fontSize: 11.5 },
  atif: { fontFamily: yazi.orta, fontSize: 11.5, textDecorationLine: 'underline' },
});
