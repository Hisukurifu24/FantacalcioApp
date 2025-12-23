import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';
import { AuthProvider } from './src/context/AuthContext';
import { LeagueProvider } from './src/context/LeagueContext';
import Navigation from './src/navigation';

// Enable screens before rendering
enableScreens(true);

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <LeagueProvider>
          <Navigation />
          <StatusBar style="dark" />
        </LeagueProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
