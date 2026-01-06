/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { StatusBar, useColorScheme, Image } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CameraScreen from './src/screens/CameraScreen';
import ScanScreen from './src/screens/ScanScreen';
import HistoryScreen from './src/screens/HistoryScreen';

const Tab = createBottomTabNavigator();

const COLORS = {
  background: '#F2F0E6',
  card: '#8B7D5A',
  primary: '#6B4F2A',
  inactive: '#C2B280',
};

function MainTabs() {
  const insets = useSafeAreaInsets();
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <NavigationContainer>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            try {
              if (route.name === 'Camera') {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const img = require('./src/assets/icons/camera.png');
                return <Image source={img} style={{ width: size, height: size, tintColor: color }} />;
              }
              if (route.name === 'Scan') {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const img = require('./src/assets/icons/upload.png');
                return <Image source={img} style={{ width: size, height: size, tintColor: color }} />;
              }
              if (route.name === 'History') {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const img = require('./src/assets/icons/history.png');
                return <Image source={img} style={{ width: size, height: size, tintColor: color }} />;
              }
            } catch (e) {
              let iconName = '';
              if (route.name === 'Camera') iconName = 'camera-alt';
              else if (route.name === 'Scan') iconName = 'file-upload';
              else if (route.name === 'History') iconName = 'history';
              return <Icon name={iconName} size={size} color={color} />;
            }
            return null;
          },
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.inactive,
          tabBarStyle: {
            backgroundColor: COLORS.background,
            borderTopWidth: 1,
            borderTopColor: COLORS.card,
            height: 56 + insets.bottom,
            paddingBottom: insets.bottom || 8,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
        })}
      >
        <Tab.Screen 
          name="Camera" 
          component={CameraScreen}
          options={{ tabBarLabel: 'Cámara' }}
        />
        <Tab.Screen 
          name="Scan" 
          component={ScanScreen}
          options={{ tabBarLabel: 'Galería' }}
        />
        <Tab.Screen 
          name="History" 
          component={HistoryScreen}
          options={{ tabBarLabel: 'Historial' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <MainTabs />
    </SafeAreaProvider>
  );
}

export default App;
