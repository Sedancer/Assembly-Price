import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppSettings {
  isOfflineMode: boolean;
  isDevMode: boolean;
  useWorkIndex: boolean;
  workIndex: string;
  useMinOrder: boolean;
  minOrder: string;
}

const defaultSettings: AppSettings = {
  isOfflineMode: false,
  isDevMode: false,
  
  useWorkIndex: true,   // За замовчуванням увімкнено
  workIndex: '1.3',
  
  useMinOrder: false,   // За замовчуванням вимкнено
  minOrder: '33'
};

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem('app_settings_v3'); // v3 щоб скинути старі налаштування
      if (stored) {
        setSettings({ ...defaultSettings, ...JSON.parse(stored) });
      }
    } catch (e) {
      console.error('Failed to load settings', e);
    }
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    try {
      await AsyncStorage.setItem('app_settings_v3', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within a SettingsProvider');
  return context;
};