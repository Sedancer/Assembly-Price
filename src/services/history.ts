import AsyncStorage from '@react-native-async-storage/async-storage';
import { ItemData } from './api';

export interface HistoryRecord {
  id: string;          // Унікальний ID запису
  date: string;        // Дата створення (ISO)
  type: 'list' | 'code'; // Тип розрахунку
  title: string;       // Назва (напр. "Проєкт Y95DTF" або "Список (4 поз.)")
  totalPrice: number;
  totalMinutes: number;
  items: ItemData[];   // Зберігаємо самі товари, щоб можна було переглянути (опціонально)
}

const HISTORY_KEY = 'app_history_v1';

export const HistoryService = {
  // Отримати всю історію
  getAll: async (): Promise<HistoryRecord[]> => {
    try {
      const json = await AsyncStorage.getItem(HISTORY_KEY);
      return json ? JSON.parse(json) : [];
    } catch (e) {
      return [];
    }
  },

  // Додати запис (на початок списку)
  add: async (record: Omit<HistoryRecord, 'id' | 'date'>) => {
    try {
      const currentHistory = await HistoryService.getAll();
      
      const newRecord: HistoryRecord = {
        ...record,
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString()
      };

      // Обмежуємо історію (наприклад, останні 50 записів)
      const updatedHistory = [newRecord, ...currentHistory].slice(0, 50);
      
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (e) {
      console.error('Failed to save history', e);
    }
  },

  // Видалити один запис
  delete: async (id: string) => {
    try {
      const currentHistory = await HistoryService.getAll();
      const updatedHistory = currentHistory.filter(item => item.id !== id);
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
      return updatedHistory;
    } catch (e) {
      console.error('Failed to delete history item', e);
      return [];
    }
  },
  
  // Очистити все (опціонально)
  clearAll: async () => {
      await AsyncStorage.removeItem(HISTORY_KEY);
  }
};