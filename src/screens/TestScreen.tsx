import React, { useState } from 'react';
import { View, Text, Button, Image, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { TIMEOUT_MS } from '../api/predict';
import React, { useState } from 'react';
import { predictWithFallback, PredictionResult } from '../services/PredictionService';
import { launchCamera, launchImageLibrary, ImageLibraryOptions, CameraOptions } from 'react-native-image-picker';


export default function TestScreen() {
  const [imageUri, setImageUri] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [isSwitchingToLocal, setIsSwitchingToLocal] = useState(false);
  let timer: number | null = null;




  async function onPredict() {
    if (!imageUri) return Alert.alert('Selecciona una imagen primero');
    setLoading(true);
    setResult(null); // Limpiar resultado anterior
    setProgress(0);
    const start = Date.now();
    setIsSwitchingToLocal(false);
    timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const ratio = Math.min(1, elapsed / TIMEOUT_MS);
      setProgress(ratio);
      if (elapsed >= TIMEOUT_MS) setIsSwitchingToLocal(true);
    }, 100) as unknown as number;
    
    try {
      // Usar la función con fallback automático
      const predictionResult = await predictWithFallback(imageUri);
      setResult(predictionResult);
      
      // Mostrar alerta si hubo error
      if (predictionResult.source === 'error') {
        Alert.alert('Error', predictionResult.error || 'Error desconocido');
      }
      
    } catch (error: any) {
      console.error('Error inesperado:', error);
      Alert.alert('Error', error.message || 'Error inesperado en la predicción');
      setResult({
        source: 'error',
        error: error.message || 'Error inesperado',
      });
    } finally {
      setLoading(false);
      if (timer) clearInterval(timer as unknown as number);
      setProgress(0);
      setIsSwitchingToLocal(false);
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
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Morchella Classifier — Test</Text>



      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
        <Button title="Tomar foto" onPress={onTakePhoto} />
        <View style={{ width: 8 }} />
        <Button title="Galería" onPress={onPickFromGallery} />
      </View>

      <Button title="Analizar imagen" onPress={onPredict} disabled={loading || !imageUri} />

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>{isSwitchingToLocal ? 'Cambiando al modelo local' : 'Conectando con nuestro cerebro en la nube'}</Text>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarFill, { width: `${Math.round(progress * 100)}%`, backgroundColor: isSwitchingToLocal ? '#FF9800' : '#007AFF' }]} />
          </View>
        </View>
      )}

      {result && result.prediction && (
        <View style={styles.result}>
          {/* Indicador de fuente de predicción */}
          <View style={[
            styles.sourceIndicator,
            result.source === 'api' ? styles.sourceApi : styles.sourceLocal
          ]}>
            <Text style={styles.sourceText}>
              {result.source === 'api' 
                ? '🌐 Predicción desde servidor' 
                : '📱 Predicción local (offline)'}
            </Text>
            {result.modelSource && (
              <Text style={styles.modelSourceText}>
                Modelo: {result.modelSource}
              </Text>
            )}
          </View>

          {/* Resultados de la predicción */}
          <View style={styles.predictionDetails}>
            <Text style={styles.resultLabel}>
              Resultado: <Text style={styles.resultValue}>{result.prediction.predicted_label}</Text>
            </Text>
            <Text style={styles.resultLabel}>
              Confianza: <Text style={styles.resultValue}>{(result.prediction.confidence * 100).toFixed(2)}%</Text>
            </Text>
            <Text style={styles.resultLabel}>
              Morchella: <Text style={styles.resultValue}>{(result.prediction.prob_morchella * 100).toFixed(2)}%</Text>
            </Text>
            <Text style={styles.resultLabel}>
              No Morchella: <Text style={styles.resultValue}>{(result.prediction.prob_no_morchella * 100).toFixed(2)}%</Text>
            </Text>
          </View>
        </View>
      )}

      {result && result.source === 'error' && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>❌ Error en la predicción</Text>
          {result.error && <Text style={styles.errorDetail}>{result.error}</Text>}
        </View>
      )}

      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 12 },
  label: { marginTop: 8, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 6, marginBottom: 8 },
  

  
  loadingContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  progressBarContainer: {
    width: 220,
    height: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    overflow: 'hidden',
    marginTop: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
    fontSize: 14,
  },
  
  result: { 
    marginTop: 16,
    marginBottom: 12,
  },
  
  sourceIndicator: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  sourceApi: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  sourceLocal: {
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  sourceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  modelSourceText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  
  predictionDetails: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
  },
  resultLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  resultValue: {
    fontWeight: '600',
    color: '#000',
  },
  
  errorContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F44336',
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D32F2F',
    marginBottom: 4,
  },
  errorDetail: {
    fontSize: 12,
    color: '#C62828',
  },
  
  image: { 
    width: '100%', 
    height: 300, 
    marginTop: 12, 
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
  },
});
