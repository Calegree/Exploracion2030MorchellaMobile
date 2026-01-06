/**
 * API de predicción con timeout y manejo de errores
 * Endpoint: http://10.0.2.2:5000/predict (IP especial del emulador Android)
 * 
 * IMPORTANTE: Usa react-native-blob-util porque React Native Android
 * tiene problemas enviando archivos locales con FormData usando fetch o XMLHttpRequest.
 */

import ReactNativeBlobUtil from 'react-native-blob-util';

export interface ApiPredictionResponse {
  resultado: 'Es morchella' | 'No es morchella';
  confianza: number;
  probabilidad_morchella: number;
  probabilidad_no_morchella: number;
  model_source: string;
}

export interface ApiError {
  error: string;
  status?: number;
}

const API_ENDPOINT = 'http://10.0.2.2:5000/predict';
const TIMEOUT_MS = 10000; // 10 segundos

// IPs alternativas para probar si 10.0.2.2 no funciona:
// - Emulador Android Studio: 10.0.2.2
// - Emulador Genymotion: 10.0.3.2  
// - Dispositivo físico en la misma red: 192.168.1.96 (tu IP de Wi-Fi)
// - Otra opción si usas WSL: ip addr show eth0 | grep inet

/**
 * Convierte file:// URI a path real para react-native-blob-util
 */
function normalizeFilePath(uri: string): string {
  // Remover el prefijo file:// si existe
  if (uri.startsWith('file://')) {
    return uri.substring(7);
  }
  return uri;
}

/**
 * Envía la imagen al endpoint de predicción usando react-native-blob-util
 * @throws Error si la petición falla (para activar fallback)
 */
export async function predictImage(imageUri: string): Promise<ApiPredictionResponse> {
  if (!imageUri) {
    throw new Error('URI de imagen no válida');
  }
  
  try {
    console.log(`[API] Intentando conectar a: ${API_ENDPOINT}`);
    console.log(`[API] URI de imagen: ${imageUri}`);
    
    const filePath = normalizeFilePath(imageUri);
    console.log(`[API] Path normalizado: ${filePath}`);
    
    console.log('[API] Enviando petición con react-native-blob-util...');
    
    const response = await ReactNativeBlobUtil.config({
      timeout: TIMEOUT_MS,
    }).fetch(
      'POST',
      API_ENDPOINT,
      {
        'Content-Type': 'multipart/form-data',
        'Accept': 'application/json',
      },
      [
        {
          name: 'imagen',
          filename: 'photo.jpg',
          type: 'image/jpeg',
          data: ReactNativeBlobUtil.wrap(filePath),
        },
      ]
    );
    
    const statusCode = response.info().status;
    console.log(`[API] Respuesta recibida - Status: ${statusCode}`);
    
    // Manejar errores HTTP
    if (statusCode < 200 || statusCode >= 300) {
      const errorText = response.text();
      
      if (statusCode === 400) {
        throw new Error(`Formato de imagen inválido: ${errorText}`);
      } else if (statusCode === 500) {
        console.warn('[API] Error 500 del servidor:', errorText);
        throw new Error('Error interno del servidor (el modelo puede no estar cargado)');
      } else {
        throw new Error(`Error del servidor (${statusCode}): ${errorText}`);
      }
    }
    
    const data = response.json() as ApiPredictionResponse;
    
    // Validar que la respuesta tiene el formato esperado
    if (!data.resultado || typeof data.confianza !== 'number') {
      throw new Error('Respuesta del servidor con formato inválido');
    }
    
    return data;
    
  } catch (error: any) {
    // Categorizar errores para mejor debugging
    console.log('[API] Error capturado:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 200),
    });
    
    if (error.message?.includes('timeout') || error.message?.includes('Timeout')) {
      throw new Error(`Timeout: El servidor no respondió en ${TIMEOUT_MS / 1000} segundos`);
    } else if (error.message?.includes('Network') || error.message?.includes('network')) {
      throw new Error('Error de red: Servidor no disponible');
    } else if (error.message?.includes('Failed to fetch') || error.message?.includes('Connection')) {
      throw new Error('No se pudo conectar con el servidor');
    } else {
      // Re-lanzar el error original
      throw error;
    }
  }
}

export default {
  predictImage,
};
