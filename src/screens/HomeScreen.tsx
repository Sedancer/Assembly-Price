import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>🛠️ Майстер Збірки</Text>
      
      <View style={styles.menuContainer}>
        
        {/* 1. Пошук за Дизайн-Кодом (Вище) */}
        <TouchableOpacity 
            style={[styles.btn, styles.highlightBtn]} 
            onPress={() => navigation.navigate('CodeCalc')}
        >
            <Text style={styles.btnTitle}>🏗️ Пошук за Дизайн-Кодом</Text>
            <Text style={styles.btnSub}>Напр. Y95DTF (Кухні, Шафи)</Text>
        </TouchableOpacity>

        {/* 2. Калькулятор списком */}
        <TouchableOpacity 
            style={styles.btn} 
            onPress={() => navigation.navigate('IdCalc')}
        >
            <Text style={styles.btnTitle}>📋 Калькулятор за ID</Text>
            <Text style={styles.btnSub}>Вставити список артикулів</Text>
        </TouchableOpacity>

        {/* 3. Історія */}
        <TouchableOpacity 
            style={styles.btn} 
            onPress={() => navigation.navigate('History')}
        >
            <Text style={styles.btnTitle}>📜 Історія пошуку</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* 4. Налаштування */}
        <TouchableOpacity 
            style={[styles.btn, styles.settingsBtn]} 
            onPress={() => navigation.navigate('Settings')}
        >
            <Text style={styles.btnTextSecondary}>⚙️ Налаштування</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2', alignItems: 'center', justifyContent: 'center', padding: 20 },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#333', marginBottom: 30 },
  menuContainer: { width: '100%', maxWidth: 340 },
  
  btn: { 
    backgroundColor: '#fff', 
    paddingVertical: 18, 
    paddingHorizontal: 20,
    borderRadius: 12, 
    marginBottom: 12, 
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 2, // Тінь Android
    shadowColor: '#000', // Тінь iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  highlightBtn: {
    borderLeftWidth: 5,
    borderLeftColor: '#0058a3',
  },
  settingsBtn: {
    backgroundColor: '#e8e8e8',
    borderColor: '#ccc',
    marginTop: 10,
  },
  btnTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  btnSub: { fontSize: 13, color: '#666' },
  btnTextSecondary: { fontSize: 16, fontWeight: '600', color: '#555', textAlign: 'center' },
  divider: { height: 10 },
});