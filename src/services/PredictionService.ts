import { NativeModules } from 'react-native';

const { MorchellaClassifier } = NativeModules;

export type Prediction = {
  raw_output: number[];
  prob_morchella: number;
  prob_no_morchella: number;
  predicted_index: number;
  predicted_label: string;
  confidence: number;
  printed_lines: string[];
}

export type PredictionResult = {
  source: 'api' | 'local' | 'error';
  prediction?: Prediction;
  error?: string;
  modelSource?: string;
}

/**
 * Realiza clasificación usando el modelo TFLite local
 */
async function classifyWithLocalModel(imageUri: string): Promise<Prediction> {
  const result = await MorchellaClassifier.classify(imageUri);

  const parsed: Prediction = {
    raw_output: result?.raw_output || [],
    prob_morchella: result?.prob_morchella || 0,
    prob_no_morchella: result?.prob_no_morchella || 0,
    predicted_index: result?.predicted_index ?? 0,
    predicted_label: result?.predicted_label || '',
    confidence: result?.confidence || 0,
    printed_lines: result?.printed_lines || [],
  };

  return parsed;
}

/**
 * Predicción usando únicamente el modelo local
 */
export async function predictWithFallback(imageUri: string): Promise<PredictionResult> {
  if (!imageUri) {
    return {
      source: 'error',
      error: 'URI de imagen no válida',
    };
  }

  try {
    console.log('[PredictionService] Usando sólo modelo local para predicción...');

    const localPrediction = await classifyWithLocalModel(imageUri);

    return {
      source: 'local',
      prediction: localPrediction,
      modelSource: 'local-tflite',
    };
  } catch (localError: any) {
    console.error('[PredictionService] ✗ Error en modelo local:', localError);
    return {
      source: 'error',
      error: `Error en modelo local: ${localError.message || localError}`,
    };
  }
}

/**
 * Función legacy para mantener compatibilidad
 * @deprecated Usar predictWithFallback en su lugar
 */
export async function classifyImage(imageUri: string): Promise<Prediction> {
  const result = await predictWithFallback(imageUri);

  if (result.prediction) {
    return result.prediction;
  }

  throw new Error(result.error || 'Error desconocido en la predicción');
}
