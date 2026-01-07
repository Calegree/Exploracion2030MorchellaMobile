import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';

type Props = {
  imageUri: string;
  isMorchella: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  model?: string;
  confidence?: number; // 0..1
};

export default function ResultCard({ imageUri, isMorchella, onPress, accessibilityLabel, model, confidence }: Props) {
  // determine background color by result + confidence
  const conf = typeof confidence === 'number' ? Math.max(0, Math.min(1, confidence)) : -1;
  let backgroundColor = isMorchella ? '#EAF6EA' : '#FDF0F0';
  let textColor = isMorchella ? '#2E7D32' : '#D32F2F';

  if (conf >= 0) {
    if (isMorchella) {
      if (conf >= 0.75) backgroundColor = '#DFF3DF';
      else if (conf >= 0.6) backgroundColor = '#EAF6EA';
      else if (conf >= 0.45) backgroundColor = '#F4FBF4';
      else backgroundColor = '#FBFDFB';
      // darker text for higher confidence
      textColor = conf >= 0.6 ? '#2E7D32' : '#527E4D';
    } else {
      if (conf >= 0.75) backgroundColor = '#FCEDED';
      else if (conf >= 0.6) backgroundColor = '#FDF0F0';
      else if (conf >= 0.45) backgroundColor = '#FEF6F6';
      else backgroundColor = '#FFFBFB';
      textColor = conf >= 0.6 ? '#D32F2F' : '#B85A5A';
    }
  }

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      style={[styles.card, { backgroundColor }]}
    >
      <Image source={{ uri: imageUri }} style={styles.image} />

      <View style={styles.content}>
        <Text style={[styles.resultText, { color: textColor }]} numberOfLines={1}>
          {(() => {
            if (isMorchella) {
              if (conf > 0.7) return '¡Es Morchella con alta confianza!';
              if (conf >= 0.5) return '¡Morchella detectada!';
              return 'Morchella';
            }
            return 'No parece ser Morchella';
          })()}
        </Text>
        {model ? (
          <Text style={styles.modelInline}>
            {model === 'Online'
              ? 'Análisis realizado con modelo en la nube'
              : 'Sin conexión: usando inteligencia local de tu teléfono'}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    // soft shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginVertical: 8,
  },
  image: {
    width: 88,
    height: 88,
    borderRadius: 12,
    resizeMode: 'cover',
    marginRight: 12,
    backgroundColor: '#F0F0F0',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    minHeight: 88,
  },
  resultText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modelInline: {
    fontSize: 11,
    color: '#6B5B4F',
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
    flexShrink: 1,
    flexWrap: 'wrap',
    maxWidth: '100%',
  },
  // Morchella (soft green)
  morchellaBg: {
    backgroundColor: '#EAF6EA',
  },
  morchellaText: {
    color: '#2E7D32',
  },
  // Not Morchella (soft red)
  noMorchellaBg: {
    backgroundColor: '#FDF0F0',
  },
  noMorchellaText: {
    color: '#D32F2F',
  },
});
