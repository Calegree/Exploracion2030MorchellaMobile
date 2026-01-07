import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Image } from 'react-native';

type Props = {
  message?: string;
  progress?: number; // 0 to 1
  showProgressBar?: boolean;
};

export default function LoadingAnimation({ message, progress = 0, showProgressBar = true }: Props) {
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animación de rebote continuo
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -30,
          duration: 400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [bounceAnim]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.imageContainer,
          {
            transform: [{ translateY: bounceAnim }],
          },
        ]}
      >
        <Image
          source={require('../assets/icons/fungus.png')}
          style={styles.fungusImage}
          resizeMode="contain"
        />
      </Animated.View>

      {message && <Text style={styles.message}>{message}</Text>}

      {showProgressBar && (
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${Math.round(progress * 100)}%` },
            ]}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F2F0E6',
  },
  imageContainer: {
    marginBottom: 32,
  },
  fungusImage: {
    width: 120,
    height: 120,
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2F2418',
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: '80%',
  },
  progressBarContainer: {
    width: '80%',
    maxWidth: 300,
    height: 6,
    backgroundColor: '#C2B280',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6B4F2A',
    borderRadius: 3,
  },
});
