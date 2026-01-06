import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY = '@morchella_history';
const MAX_HISTORY_ITEMS = 50;

export interface HistoryItem {
  id: string;
  imageUri: string;
  prediction: {
    predicted_label: string;
    confidence: number;
    prob_morchella: number;
    prob_no_morchella: number;
  };
  source: 'api' | 'local';
  timestamp: string;
}

/**
 * Guarda un resultado de predicción en el historial
 */
export async function saveToHistory(item: Omit<HistoryItem, 'id'>): Promise<void> {
  try {
    const history = await getHistory();
    
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      ...item,
    };
    
    // Agregar al inicio
    const updatedHistory = [newItem, ...history];
    
    // Limitar el tamaño del historial
    const limitedHistory = updatedHistory.slice(0, MAX_HISTORY_ITEMS);
    
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(limitedHistory));
  } catch (error) {
    console.error('Error al guardar en historial:', error);
  }
}

/**
 * Obtiene todo el historial de predicciones
 */
export async function getHistory(): Promise<HistoryItem[]> {
  try {
    const historyString = await AsyncStorage.getItem(HISTORY_KEY);
    if (!historyString) return [];
    
    const history: HistoryItem[] = JSON.parse(historyString);
    return history;
  } catch (error) {
    console.error('Error al obtener historial:', error);
    return [];
  }
}

/**
 * Elimina todo el historial
 */
export async function clearHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(HISTORY_KEY);
  } catch (error) {
    console.error('Error al limpiar historial:', error);
  }
}

/**
 * Elimina un elemento específico del historial
 */
export async function removeFromHistory(id: string): Promise<void> {
  try {
    const history = await getHistory();
    const updatedHistory = history.filter(item => item.id !== id);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error('Error al eliminar del historial:', error);
  }
}
