import React from 'react';
import { View, Text, Switch, StyleSheet, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useSettings } from '../context/SettingsContext';

export default function SettingsScreen() {
  const { settings, updateSettings } = useSettings();

  return (
    <KeyboardAvoidingView 
      style={{flex: 1}} 
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* 1. Offline Mode */}
        <View style={styles.section}>
          <View style={styles.row}>
            <View style={{flex: 1}}>
              <Text style={styles.label}>Offline First</Text>
              <Text style={styles.subLabel}>
                {settings.isOfflineMode 
                  ? "Спочатку перевіряє кеш (миттєво). Якщо немає — робить запит."
                  : "Завжди робить запит до сервера для оновлення даних."}
              </Text>
            </View>
            <Switch
              value={settings.isOfflineMode}
              onValueChange={(val) => updateSettings({ isOfflineMode: val })}
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={settings.isOfflineMode ? "#0058a3" : "#f4f3f4"}
            />
          </View>
        </View>

        {/* 2. Dev Mode */}
        <View style={styles.section}>
          <View style={styles.row}>
            <View>
              <Text style={styles.label}>Режим розробника</Text>
              <Text style={styles.subLabel}>Показує консоль та логи</Text>
            </View>
            <Switch
              value={settings.isDevMode}
              onValueChange={(val) => updateSettings({ isDevMode: val })}
            />
          </View>
        </View>

        {/* 3. Work Index (Коефіцієнт) */}
        <View style={styles.section}>
          <View style={styles.row}>
            <View>
              <Text style={styles.label}>Індекс часу (Коефіцієнт)</Text>
              <Text style={styles.subLabel}>Множити час IKEA на коефіцієнт?</Text>
            </View>
            <Switch
              value={settings.useWorkIndex}
              onValueChange={(val) => updateSettings({ useWorkIndex: val })}
            />
          </View>
          
          {settings.useWorkIndex && (
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Значення:</Text>
              <TextInput
                style={styles.input}
                value={settings.workIndex}
                onChangeText={(val) => updateSettings({ workIndex: val })}
                keyboardType="numeric"
                placeholder="1.3"
              />
            </View>
          )}
        </View>

        {/* 4. Min Order (Мінімальне замовлення) */}
        <View style={styles.section}>
          <View style={styles.row}>
            <View>
              <Text style={styles.label}>Мінімальне замовлення</Text>
              <Text style={styles.subLabel}>Використовувати мінімальну суму?</Text>
            </View>
            <Switch
              value={settings.useMinOrder}
              onValueChange={(val) => updateSettings({ useMinOrder: val })}
            />
          </View>
          
          {settings.useMinOrder && (
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Сума (£):</Text>
              <TextInput
                style={styles.input}
                value={settings.minOrder}
                onChangeText={(val) => updateSettings({ minOrder: val })}
                keyboardType="numeric"
                placeholder="33"
              />
            </View>
          )}
        </View>

        <View style={{height: 60}} /> 
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#f5f5f5' },
  section: { 
    backgroundColor: '#fff', 
    borderRadius: 10, 
    padding: 15, 
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: {width:0, height:2}
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  subLabel: { fontSize: 12, color: '#666', marginTop: 4, maxWidth: '90%' },
  
  inputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 15, borderTopWidth: 1, borderColor: '#eee', paddingTop: 10 },
  inputLabel: { fontSize: 14, color: '#444', marginRight: 10, flex: 1 },
  input: { 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 5, 
    padding: 8, 
    width: 100, 
    textAlign: 'center', 
    fontSize: 16,
    backgroundColor: '#fafafa'
  }
});