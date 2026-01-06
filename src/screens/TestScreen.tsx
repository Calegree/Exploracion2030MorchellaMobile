import React, { useState } from 'react';
import { View, Text, Button, Image, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { predictMorchella, classifyImage, Prediction } from '../services/PredictionService';
import { launchCamera, launchImageLibrary, ImageLibraryOptions, CameraOptions } from 'react-native-image-picker';

export default function TestScreen() {
  const [imageUri, setImageUri] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ source: string; probability?: number; prediction?: Prediction } | null>(null);

  async function onPredict() {
    if (!imageUri) return Alert.alert('Selecciona una imagen primero');
    setLoading(true);
    try {
      // prefer local classify
      const prediction = await classifyImage(imageUri);
      setResult({ source: 'local', prediction });
    } catch (e) {
      setResult({ source: 'error' });
    } finally {
      setLoading(false);
    }
  }

  function onTakePhoto() {
    const options: CameraOptions = { mediaType: 'photo', cameraType: 'back', quality: 0.8 };
    launchCamera(options, (response) => {
      if (response.didCancel) return;
      if (response.errorCode) return Alert.alert('Error cámara', response.errorMessage || '');
      const uri = response.assets && response.assets[0] && response.assets[0].uri;
      if (uri) setImageUri(uri);
    });
  }

  function onPickFromGallery() {
    const options: ImageLibraryOptions = { mediaType: 'photo', quality: 0.8 };
    launchImageLibrary(options, (response) => {
      if (response.didCancel) return;
      if (response.errorCode) return Alert.alert('Error galería', response.errorMessage || '');
      const uri = response.assets && response.assets[0] && response.assets[0].uri;
      if (uri) setImageUri(uri);
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Morchella Classifier — Test</Text>

      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
        <Button title="Tomar foto" onPress={onTakePhoto} />
        <View style={{ width: 8 }} />
        <Button title="Galería" onPress={onPickFromGallery} />
      </View>

      <Button title="Analizar imagen" onPress={onPredict} disabled={loading || !imageUri} />

      {loading && <ActivityIndicator style={{ marginTop: 12 }} />}

      {result && result.prediction && (
        <View style={styles.result}>
          <Text>Label: {result.prediction.predicted_label}</Text>
          <Text>Confidence: {(result.prediction.confidence * 100).toFixed(2)}%</Text>
          <Text>Morchella: {(result.prediction.prob_morchella * 100).toFixed(2)}%</Text>
          <Text>No Morchella: {(result.prediction.prob_no_morchella * 100).toFixed(2)}%</Text>
        </View>
      )}

      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 12 },
  label: { marginTop: 8, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 6, marginBottom: 8 },
  result: { marginTop: 12 },
  image: { width: '100%', height: 300, marginTop: 12, backgroundColor: '#f2f2f2' },
});
