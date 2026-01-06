import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, Modal, Image, Platform, PermissionsAndroid } from 'react-native';
import AppHeader from '../components/AppHeader';
import { launchCamera } from 'react-native-image-picker';
import { predictWithFallback } from '../services/PredictionService';
import { saveToHistory } from '../services/HistoryService';

const COLORS = {
  background: '#F2F0E6',
  card: '#8B7D5A',
  primary: '#6B4F2A',
  text: '#2F2418',
  textLight: '#6B5B4F',
  border: '#C2B280',
  success: '#4CAF50',
  warning: '#FF9800',
};

export default function CameraScreen({ navigation }: any) {
  const [isLoading, setIsLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [imageUri, setImageUri] = useState<string>('');
  const [result, setResult] = useState<any>(null);

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Permiso de Cámara',
            message: 'Esta app necesita acceso a tu cámara para tomar fotos de hongos',
            buttonNeutral: 'Preguntar después',
            buttonNegative: 'Cancelar',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const handleTakePhoto = async () => {
    try {
      // Solicitar permiso de cámara en Android
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        Alert.alert('Permiso denegado', 'Necesitas dar permiso de cámara para usar esta función');
        return;
      }

      const response = await launchCamera({
        mediaType: 'photo',
        cameraType: 'back',
        quality: 0.8,
        saveToPhotos: false,
      });

      if (response.didCancel) return;
      if (response.errorCode) {
        Alert.alert('Error', response.errorMessage || 'Error al tomar la foto');
        return;
      }

      const uri = response.assets?.[0]?.uri;
      if (!uri) return;

      setImageUri(uri);
      setIsLoading(true);

      // Realizar predicción con fallback
      const predictionResult = await predictWithFallback(uri);
      
      if (predictionResult.source === 'error') {
        Alert.alert('Error', predictionResult.error || 'Error en la predicción');
        setIsLoading(false);
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

      setIsLoading(false);
      setShowResult(true);
    } catch (error: any) {
      setIsLoading(false);
      Alert.alert('Error', error.message || 'Error al procesar la imagen');
    }
  };

  const handleClose = () => {
    setShowResult(false);
    setResult(null);
    setImageUri('');
  };

  const formatLabel = (label: string) => {
    if (!label) return '';
    // Remove leading digits and non-letter separators (e.g. "1 ", "0 - ")
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
    // Map numeric indices: 0 -> Morchella, 1 -> No Morchella
    if (p?.predicted_index === 0) return 'Morchella';
    if (p?.predicted_index === 1) return 'No Morchella';
    // fallback to cleaned label
    return formatLabel(p?.predicted_label || '');
  };

  const getResultColor = (res: any) => {
    const p = res.prediction;
    if (!p) return COLORS.text;
    // If the model decided "No Morchella" (index 1) show red
    if (p.predicted_index === 1) return '#D32F2F'; // red

    // otherwise evaluate confidence thresholds (percentage)
    const conf = (p.confidence || 0) * 100;
    if (conf >= 70) return '#2E7D32'; // green
    if (conf >= 59 && conf <= 69) return '#9ACD32'; // medium green-yellow
    if (Math.round(conf) === 50) return '#FBC02D'; // yellow
    // default low confidence color (red)
    return '#D32F2F';
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Analizando</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>
            Identificando el hongo...{'\n'}
            Esto puede tomar unos segundos
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader />

      {/* Main Content */}
      <View style={styles.mainContent}>
        <View style={styles.cameraIcon}>
          {/* Use local fungus.png as main camera graphic */}
          <Image source={require('../assets/icons/fungus.png')} style={{ width: 96, height: 96 }} />
        </View>
        
        <Text style={styles.instruction}>Presiona el botón para tomar una foto</Text>
        
        <TouchableOpacity style={styles.captureButton} onPress={handleTakePhoto}>
          <Text style={styles.captureButtonText}>Tomar foto</Text>
        </TouchableOpacity>
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

            {imageUri && (
              <Image source={{ uri: imageUri }} style={styles.resultImage} />
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
  cameraIcon: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: COLORS.card + '40',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  instruction: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 32,
  },
  captureButton: {
    paddingHorizontal: 48,
    paddingVertical: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  captureButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
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
  closeX: {
    fontSize: 20,
    fontWeight: '700',
    color: '#D32F2F',
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
