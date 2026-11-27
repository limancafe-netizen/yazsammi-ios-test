// Gönderi fotoğrafı: kartta yuvarlak köşeli, en/boy oranı korunur (çok uzun fotoğraf en çok 440 px, kırpılır); dokununca tam ekran.
import { useState } from 'react';
import { Image, Modal, Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import type { Foto } from '@/canli';
import { Bas, Ikon, useRenk } from './ortak';

export function FotoKart({ foto, tam }: { foto: Foto; tam?: boolean }) {
  const R = useRenk();
  const [en, enAyarla] = useState(0);
  const [acik, acikAyarla] = useState(false);
  const [yuklendi, yuklendiAyarla] = useState(false);
  const oran = foto.en > 0 && foto.boy > 0 ? foto.boy / foto.en : 0.75;
  const enCok = tam ? 560 : 440;
  const boy = en ? Math.max(150, Math.min(enCok, Math.round(en * oran))) : 0;
  return (
    <>
      <Pressable
        onPress={() => acikAyarla(true)}
        accessibilityRole="imagebutton"
        accessibilityLabel="Fotoğrafı büyüt"
        onLayout={(e) => enAyarla(e.nativeEvent.layout.width)}
        style={({ pressed }: { pressed: boolean }) => [s.kap, { borderColor: R.ince, backgroundColor: R.ust, height: boy || undefined, aspectRatio: boy ? undefined : 1 / oran }, pressed && { opacity: 0.92 }]}
      >
        {!!boy && <Image source={{ uri: foto.url }} onLoad={() => yuklendiAyarla(true)} style={[{ width: '100%', height: boy }, !yuklendi && { opacity: 0 }]} resizeMode="cover" accessibilityIgnoresInvertColors />}
      </Pressable>
      {acik && <TamEkran foto={foto} kapat={() => acikAyarla(false)} />}
    </>
  );
}

function TamEkran({ foto, kapat }: { foto: Foto; kapat: () => void }) {
  const { width, height } = useWindowDimensions();
  const oran = foto.en > 0 ? foto.boy / foto.en : 0.75;
  const enCok = Math.min(width - 24, foto.en * 2);
  let w = enCok, h = w * oran;
  if (h > height - 96) { h = height - 96; w = h / oran; }
  return (
    <Modal transparent visible animationType="fade" onRequestClose={kapat} statusBarTranslucent>
      <Pressable style={s.arka} onPress={kapat} accessibilityLabel="Kapat">
        <Image source={{ uri: foto.url }} style={{ width: w, height: h, borderRadius: 10 }} resizeMode="contain" />
      </Pressable>
      <Bas onPress={kapat} etiket="Kapat" style={s.kapat} hoverRenk="rgba(255,255,255,0.12)">
        <Ikon ad="kapat" boyut={24} renk="#fff" kalinlik={2.4} />
      </Bas>
    </Modal>
  );
}

const s = StyleSheet.create({
  kap: { width: '100%', borderRadius: 18, borderWidth: 1, overflow: 'hidden', ...(Platform.OS === 'web' ? ({ cursor: 'zoom-in' } as any) : null) },
  arka: { flex: 1, backgroundColor: 'rgba(8,6,14,0.94)', alignItems: 'center', justifyContent: 'center' },
  kapat: { position: 'absolute', top: 18, right: 18, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)' },
});
