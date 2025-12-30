import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingsProvider } from './src/context/SettingsContext';
import { RootStackParamList } from './src/navigation/types';
import HomeScreen from './src/screens/HomeScreen';
import CodeCalcScreen from './src/screens/CodeCalcScreen';
import IdCalcScreen from './src/screens/IdCalcScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import HistoryScreen from './src/screens/HistoryScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SettingsProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ title: 'Головна' }} 
          />
          
          <Stack.Screen 
            name="CodeCalc" 
            component={CodeCalcScreen} 
            options={{ title: 'Пошук за кодом' }} 
          />
          
          <Stack.Screen 
            name="IdCalc" 
            component={IdCalcScreen} 
            options={{ title: 'Калькулятор (Список)' }} 
          />

          <Stack.Screen 
            name="History" 
            component={HistoryScreen} 
            options={{ title: 'Історія' }} 
          />
          
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen} 
            options={{ title: 'Налаштування' }} 
          />

        </Stack.Navigator>
      </NavigationContainer>
    </SettingsProvider>
  );
}