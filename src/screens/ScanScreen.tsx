import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image, SafeAreaView, Alert, Modal } from 'react-native';
import { TIMEOUT_MS } from '../api/predict';
import AppHeader from '../components/AppHeader';
import { launchImageLibrary } from 'react-native-image-picker';
import { predictWithFallback } from '../services/PredictionService';
import { saveToHistory } from '../services/HistoryService';

const COLORS = {
  background: '#F2F0E6',
  card: '#8B7D5A',
  primary: '#6B4F2A',
  text: '#2F2418',
  textLight: '#6B5B4F',
  border: '#C2B280',
};

export default function ScanScreen({ navigation }: any) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<number | null>(null);
  const [isSwitchingToLocal, setIsSwitchingToLocal] = useState(false);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current as unknown as number);
      timerRef.current = null;
    }
    setProgress(0);
    setIsSwitchingToLocal(false);
  };

  const pickImage = async () => {
    try {
      const response = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });

      if (response.didCancel) return;
      if (response.errorCode) {
        Alert.alert('Error', response.errorMessage || 'Error al seleccionar imagen');
        return;
      }

      const uri = response.assets?.[0]?.uri;
      if (!uri) return;

      setSelectedImage(uri);
      setIsLoading(true);
      setProgress(0);
      setIsSwitchingToLocal(false);
      const start = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - start;
        const ratio = Math.min(1, elapsed / TIMEOUT_MS);
        setProgress(ratio);
        if (elapsed >= TIMEOUT_MS) setIsSwitchingToLocal(true);
      }, 100);

      // Realizar predicción con fallback
      const predictionResult = await predictWithFallback(uri);
      
      if (predictionResult.source === 'error') {
        Alert.alert('Error', predictionResult.error || 'Error en la predicción');
        setIsLoading(false);
        setSelectedImage(null);
        return;
      }

      setResult({
        prediction: predictionResult.prediction,
        source: predictionResult.source,
        modelSource: predictionResult.modelSource,
        imageUri: uri,
      });

      // Guardar en historial
      if (predictionResult.prediction) {
        await saveToHistory({
          imageUri: uri,
          prediction: predictionResult.prediction,
          source: predictionResult.source,
          timestamp: new Date().toISOString(),
        });
      }

      clearTimer();
      setIsLoading(false);
      setShowResult(true);
    } catch (error: any) {
      clearTimer();
      setIsLoading(false);
      setSelectedImage(null);
      Alert.alert('Error', error.message || 'Error al procesar la imagen');
    }
  };

  const handleClose = () => {
    setShowResult(false);
    setResult(null);
    setSelectedImage(null);
  };

  const formatLabel = (label: string) => {
    if (!label) return '';
    return label.replace(/^[^a-zA-ZÀ-ÿ]*([0-9]+)?\s*[\-\.:]?\s*/u, '');
  };

  const getMorchellaPercent = (res: any) => {
    const p = res.prediction;
    if (!p) return '0.0';
    if (res.source === 'local') {
      const a = p.prob_morchella || 0;
      const b = p.prob_no_morchella || 0;
      const total = a + b || 1;
      return ((a / total) * 100).toFixed(1);
    }
    return (p.prob_morchella * 100).toFixed(1);
  };

  const getNoMorchellaPercent = (res: any) => {
    const p = res.prediction;
    if (!p) return '0.0';
    if (res.source === 'local') {
      const a = p.prob_morchella || 0;
      const b = p.prob_no_morchella || 0;
      const total = a + b || 1;
      return ((b / total) * 100).toFixed(1);
    }
    return (p.prob_no_morchella * 100).toFixed(1);
  };

  const displayLabelFromResult = (p: any) => {
    if (p?.predicted_index === 0) return 'Morchella';
    if (p?.predicted_index === 1) return 'No Morchella';
    return formatLabel(p?.predicted_label || '');
  };

  const getResultColor = (res: any) => {
    const p = res.prediction;
    if (!p) return COLORS.text;
    if (p.predicted_index === 1) return '#D32F2F';
    const conf = (p.confidence || 0) * 100;
    if (conf >= 70) return '#2E7D32';
    if (conf >= 59 && conf <= 69) return '#9ACD32';
    if (Math.round(conf) === 50) return '#FBC02D';
    return '#D32F2F';
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Reconocimiento</Text>
        </View>

          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>{isSwitchingToLocal ? 'Cambiando al modelo local' : 'Conectando con nuestro cerebro en la nube'}</Text>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBarFill, { width: `${Math.round(progress * 100)}%`, backgroundColor: isSwitchingToLocal ? '#FF9800' : COLORS.primary }]} />
            </View>
            {selectedImage && (
              <Image source={{ uri: selectedImage }} style={styles.loadingImage} />
            )}
          </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader />

      {/* Main Content */}
      <View style={styles.mainContent}>
        <TouchableOpacity style={styles.uploadArea} onPress={pickImage}>
          <View style={styles.uploadIconContainer}>
            <Image source={require('../assets/icons/photo.png')} style={{ width: 56, height: 56 }} />
          </View>
          <View style={styles.uploadTextContainer}>
            <Text style={styles.uploadTitle}>Selecciona una imagen</Text>
            <Text style={styles.uploadDescription}>
              Toca aquí para elegir una foto de un hongo
            </Text>
          </View>
        </TouchableOpacity>

        {selectedImage && !showResult && (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
          </View>
        )}
      </View>

      {/* Result Modal */}
      <Modal
        visible={showResult}
        animationType="slide"
        transparent={true}
        onRequestClose={handleClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Text style={styles.closeX}>X</Text>
            </TouchableOpacity>

            {selectedImage && (
              <Image source={{ uri: selectedImage }} style={styles.resultImage} />
            )}

            <View style={[
              styles.sourceIndicator,
              result?.source === 'api' ? styles.sourceApi : styles.sourceLocal
            ]}>
              <Text style={styles.sourceText}>
                Modelo: {result?.source === 'api' ? 'Online' : 'Local'}
              </Text>
            </View>

            {result?.prediction && (
              <View style={styles.resultDetails}>
                <Text style={styles.resultTitle}>Resultado</Text>
                <Text style={[styles.resultLabel, { color: getResultColor(result) }]}>
                  {displayLabelFromResult(result.prediction)}
                </Text>
              </View>
            )}

            <TouchableOpacity 
              style={styles.acceptButton} 
              onPress={handleClose}
            >
              <Text style={styles.acceptButtonText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  uploadArea: {
    width: '100%',
    aspectRatio: 1,
    maxWidth: 400,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    backgroundColor: COLORS.card + '40',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  uploadIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.primary + '1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  uploadTextContainer: {
    alignItems: 'center',
    gap: 8,
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  uploadDescription: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  imagePreviewContainer: {
    marginTop: 16,
    width: '100%',
    maxWidth: 400,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    aspectRatio: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 24,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
    maxWidth: 300,
  },
  loadingImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    opacity: 0.5,
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
    backgroundColor: '#6B4F2A',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  resultImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  sourceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  sourceApi: {
    backgroundColor: '#E8F5E9',
  },
  sourceLocal: {
    backgroundColor: '#FFF3E0',
  },
  sourceText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  resultDetails: {
    gap: 8,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  resultConfidence: {
    fontSize: 16,
    color: COLORS.textLight,
    marginBottom: 16,
  },
  probabilitiesContainer: {
    backgroundColor: COLORS.card + '40',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  probabilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  probabilityLabel: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  probabilityValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  acceptButton: {
    marginTop: 24,
    paddingVertical: 14,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    alignItems: 'center',
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
