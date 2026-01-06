import { NativeModules } from 'react-native';
import predictApi, { ApiPredictionResponse } from '../api/predict';

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


function apiResponseToPrediction(apiResponse: ApiPredictionResponse): Prediction {
  const isMorchella = apiResponse.resultado === 'Es morchella';
  
  return {
    raw_output: [apiResponse.probabilidad_no_morchella, apiResponse.probabilidad_morchella],
    prob_morchella: apiResponse.probabilidad_morchella,
    prob_no_morchella: apiResponse.probabilidad_no_morchella,
    predicted_index: isMorchella ? 1 : 0,
    predicted_label: apiResponse.resultado,
    confidence: apiResponse.confianza,
    printed_lines: [`Predicción desde servidor (${apiResponse.model_source})`],
  };
}

/**
 * Realiza clasificación usando el modelo TFLite local
 */
async function classifyWithLocalModel(imageUri: string): Promise<Prediction> {
  const result = await MorchellaClassifier.classify(imageUri);
  
  const parsed: Prediction = {
    raw_output: result.raw_output || [],
    prob_morchella: result.prob_morchella || 0,
    prob_no_morchella: result.prob_no_morchella || 0,
    predicted_index: result.predicted_index ?? 0,
    predicted_label: result.predicted_label || '',
    confidence: result.confidence || 0,
    printed_lines: result.printed_lines || [],
  };
  
  return parsed;
}

/**
 * Función principal con estrategia de fallback automático
 * 1. Intenta predicción con endpoint HTTP (timeout 10s)
 * 2. Si falla, usa automáticamente el modelo TFLite local
 */
export async function predictWithFallback(imageUri: string): Promise<PredictionResult> {
  if (!imageUri) {
    return {
      source: 'error',
      error: 'URI de imagen no válida',
    };
  }
  
  // PASO 1: Intentar con endpoint HTTP primero
  try {
    console.log('[PredictionService] Intentando predicción con endpoint HTTP...');
    
    const apiResponse = await predictApi.predictImage(imageUri);
    
    console.log('[PredictionService] ✓ Predicción exitosa desde endpoint HTTP');
    
    return {
      source: 'api',
      prediction: apiResponseToPrediction(apiResponse),
      modelSource: apiResponse.model_source,
    };
    
  } catch (apiError: any) {
    // Log del error para debugging
    console.warn('[PredictionService] ✗ Error en endpoint HTTP:', apiError.message || apiError);
    console.log('[PredictionService] → Usando modelo local como fallback...');
    
    // PASO 2: Fallback automático al modelo local
    try {
      const localPrediction = await classifyWithLocalModel(imageUri);
      
      console.log('[PredictionService] ✓ Predicción exitosa con modelo local');
      
      return {
        source: 'local',
        prediction: localPrediction,
      };
      
    } catch (localError: any) {
      console.error('[PredictionService] ✗ Error en modelo local:', localError);
      
      return {
        source: 'error',
        error: `Falló endpoint y modelo local: ${localError.message || localError}`,
      };
    }
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
