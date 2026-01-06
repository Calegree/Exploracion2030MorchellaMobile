import NetInfo from '@react-native-community/netinfo';
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

function createFormData(uri: string) {
  const data = new FormData();
  data.append('file', {
    uri,
    name: 'photo.jpg',
    type: 'image/jpeg',
  } as any);
  return data;
}

export async function predictMorchella(imageUri: string) {
  const state = await NetInfo.fetch();

  if (state.isConnected) {
    try {
      const res = await fetch('https://your-api.example.com/predict', {
        method: 'POST',
        body: createFormData(imageUri),
        headers: {
          'Accept': 'application/json',
        }
      });

      if (res.ok) {
        const json = await res.json();
        return { source: 'api', probability: json.probability };
      }
    } catch (e) {
      // fall through to local
    }
  }

  // Fallback to local on-device inference
  const result = await MorchellaClassifier.classify(imageUri);
  // Parse result according to contract
  const parsed: Prediction = {
    raw_output: result.raw_output || [],
    prob_morchella: result.prob_morchella || 0,
    prob_no_morchella: result.prob_no_morchella || 0,
    predicted_index: result.predicted_index ?? 0,
    predicted_label: result.predicted_label || '',
    confidence: result.confidence || 0,
    printed_lines: result.printed_lines || [],
  };
  return { source: 'local', prediction: parsed };
}

export async function classifyImage(imageUri: string): Promise<Prediction> {
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
