import { NativeModules } from 'react-native';

export type PredictionResult = { probability: number };

const { MorchellaClassifier } = NativeModules as {
  MorchellaClassifier: {
    predict(imagePath: string): Promise<PredictionResult>;
  };
};

export default MorchellaClassifier;
