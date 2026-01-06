import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ResultCard from '../components/ResultCard';
import AppHeader from '../components/AppHeader';
import { getHistory, clearHistory } from '../services/HistoryService';

const COLORS = {
  background: '#F2F0E6',
  card: '#8B7D5A',
  primary: '#6B4F2A',
  text: '#2F2418',
  textLight: '#6B5B4F',
  border: '#C2B280',
};

interface HistoryItem {
  id: string;
  imageUri: string;
  prediction: any;
  source: string;
  timestamp: string;
}

export default function HistoryScreen({ navigation }: any) {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
    
    // Recargar historial cuando la pantalla gana foco
    const unsubscribe = navigation.addListener('focus', () => {
      loadHistory();
    });

    return unsubscribe;
  }, [navigation]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const history = await getHistory();
      setHistoryItems(history);
    } catch (error) {
      console.error('Error al cargar historial:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Limpiar historial',
      '¿Estás seguro de que deseas eliminar todo el historial?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await clearHistory();
            setHistoryItems([]);
          },
        },
      ]
    );
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const formatLabel = (label: string) => {
    if (!label) return '';
    return label.replace(/^[^a-zA-ZÀ-ÿ]*([0-9]+)?\s*[\-\.:]?\s*/u, '');
  };

  const displayLabelFromResult = (p: any) => {
    if (!p) return '';
    if (p?.predicted_index === 0) return 'Morchella';
    if (p?.predicted_index === 1) return 'No Morchella';
    return formatLabel(p?.predicted_label || '');
  };

  const percentText = (prediction: any, key: 'morchella' | 'no', src?: string) => {
    const a = prediction.prob_morchella || 0;
    const b = prediction.prob_no_morchella || 0;
    if (src === 'local') {
      const total = a + b || 1;
      if (key === 'morchella') return ((a / total) * 100).toFixed(1);
      return ((b / total) * 100).toFixed(1);
    }
    if (key === 'morchella') return (prediction.prob_morchella * 100).toFixed(1);
    return (prediction.prob_no_morchella * 100).toFixed(1);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        right={
          historyItems.length > 0 ? (
            <TouchableOpacity onPress={handleClearHistory} style={styles.clearButton}>
              <Image source={require('../assets/icons/trash.png')} style={{ width: 22, height: 22, tintColor: COLORS.text }} />
            </TouchableOpacity>
          ) : null
        }
      />

      {/* List */}
      {historyItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="history" size={64} color={COLORS.border} />
          <Text style={styles.emptyText}>No hay análisis previos</Text>
          <Text style={styles.emptySubtext}>
            Las fotos que analices aparecerán aquí
          </Text>
        </View>
      ) : (
        <FlatList
          data={historyItems}
          contentContainerStyle={styles.list}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isMorchella = item.prediction?.predicted_index === 0;
            return (
              <ResultCard
                  imageUri={item.imageUri}
                  isMorchella={!!isMorchella}
                  model={item.source === 'api' ? 'Online' : 'Local'}
                  confidence={item.prediction?.confidence}
                  onPress={() => Alert.alert(
                    displayLabelFromResult(item.prediction),
                    `Modelo: ${item.source === 'api' ? 'Online' : 'Local'}`
                  )}
                />
            );
          }}
        />
      )}
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
  clearButton: {
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 8,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '20',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: COLORS.border + '40',
  },
  itemContent: {
    flex: 1,
    gap: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  itemConfidence: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  
  itemDate: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  
});
