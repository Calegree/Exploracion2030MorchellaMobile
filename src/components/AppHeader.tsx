import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { MORCHELLAPP_BASE64 } from '../assets/icons/morchellapp_base64';

const COLORS = {
  background: '#F2F0E6',
  card: '#8B7D5A',
  primary: '#6B4F2A',
  text: '#2F2418',
};

interface AppHeaderProps {
  right?: React.ReactNode;
}

export default function AppHeader({ right }: AppHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}> 
      <View style={styles.brand}>
        <Image
          source={
            (() => {
              try {
                // prefer the provided attached PNG name
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                return require('../assets/icons/LogoMorchellApp (1).png');
              } catch (e2) {
                return { uri: `data:image/png;base64,${MORCHELLAPP_BASE64}` };
              }
            })()
          }
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>MorchellApp</Text>
      </View>
      <View style={styles.right}>{right || <View style={{ width: 36 }} />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // let paddingTop from safe area control the top space; set minHeight for visual balance
    minHeight: 56,
    backgroundColor: COLORS.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#C2B280',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  title: {
    color: '#F2F0E6',
    fontSize: 18,
    fontWeight: '700',
  },
  right: {
    width: 48,
    alignItems: 'flex-end',
  },
});
