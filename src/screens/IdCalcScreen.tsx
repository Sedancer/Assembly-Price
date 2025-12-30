import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, TextInput, Button, FlatList, Image, 
  StyleSheet, TouchableOpacity, Keyboard, KeyboardAvoidingView, Platform 
} from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { DataService, ItemData } from '../services/api';
import { HistoryService } from '../services/history';

interface LogMessage {
  id: string;
  type: 'info' | 'error' | 'warn';
  text: string;
  time: string;
}

export default function IdCalcScreen() {
  const { settings } = useSettings();
  const [inputText, setInputText] = useState('');
  const [items, setItems] = useState<ItemData[]>([]);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<LogMessage[]>([]);

  const itemsRef = useRef(items);
  const settingsRef = useRef(settings);

  useEffect(() => {
    itemsRef.current = items;
    settingsRef.current = settings;
  }, [items, settings]);

  useEffect(() => {
    return () => {
      const currentItems = itemsRef.current;
      const currentSettings = settingsRef.current;

      if (currentItems.length > 0) {
        // ЧАС (Коефіцієнт тільки якщо увімкнено)
        const totalMinutes = currentItems.reduce((sum, i) => sum + (i.minutesIkea * i.quantity), 0);
        const factor = currentSettings.useWorkIndex ? (parseFloat(currentSettings.workIndex) || 1.3) : 1.0;
        const displayMinutes = Math.round(totalMinutes * factor);

        // ЦІНА (Сума цін)
        const totalApiPrice = currentItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
        
        // МІНІМАЛКА (Тільки якщо увімкнено)
        const min = currentSettings.useMinOrder ? (parseFloat(currentSettings.minOrder) || 33.0) : 0;
        const finalPrice = Math.max(totalApiPrice, min);

        HistoryService.add({
          type: 'list',
          title: `Список: ${currentItems.length} поз.`,
          totalMinutes: displayMinutes,
          totalPrice: finalPrice,
          items: currentItems
        });
      }
    };
  }, []);

  // Console Logic
  useEffect(() => {
    if (!settings.isDevMode) return;
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const addLog = (type: 'info' | 'error' | 'warn', args: any[]) => {
      const text = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
      setLogs(prev => [{ id: Math.random().toString(36).substr(2, 9), type, text, time: new Date().toLocaleTimeString() }, ...prev]);
    };
    console.log = (...args) => { originalLog(...args); addLog('info', args); };
    console.error = (...args) => { originalError(...args); addLog('error', args); };
    console.warn = (...args) => { originalWarn(...args); addLog('warn', args); };
    return () => { console.log = originalLog; console.error = originalError; console.warn = originalWarn; };
  }, [settings.isDevMode]);

  const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

  const handleAddItem = async () => {
    if (loading) return;
    if (!inputText.trim()) return;
    Keyboard.dismiss();
    setLoading(true);
    const rawIds = inputText.split(/[\s,]+/).filter(Boolean);
    setInputText('');
    console.log(`[UI] Processing ${rawIds.length} items...`);

    let processedCount = 0;
    for (const id of rawIds) {
      if (processedCount > 0) await wait(500); 
      const newItem = await DataService.fetchItem(id, settings);
      
      if (newItem) {
        setItems(prevItems => {
          const existingIndex = prevItems.findIndex(i => i.cleanId === newItem.cleanId);
          if (existingIndex >= 0) {
            const updated = [...prevItems];
            updated[existingIndex].quantity += 1;
            console.log(`[UI] 🔄 Increased qty: ${newItem.cleanId}`);
            return updated;
          } else {
            console.log(`[UI] ✅ Added: ${id} (£${newItem.price})`);
            return [newItem, ...prevItems];
          }
        });
      } else {
        console.error(`[UI] ❌ Error: ${id}`);
      }
      processedCount++;
    }
    setLoading(false);
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // --- МАТЕМАТИКА ВІДОБРАЖЕННЯ ---
  // 1. Час
  const factor = settings.useWorkIndex ? (parseFloat(settings.workIndex) || 1.3) : 1.0;
  const totalMinutesIkea = items.reduce((sum, item) => sum + (item.minutesIkea * item.quantity), 0);
  const displayMinutes = Math.round(totalMinutesIkea * factor);
  const displayHours = Math.floor(displayMinutes / 60);
  const displayMinRem = displayMinutes % 60;

  // 2. Гроші
  const totalApiPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const minFee = settings.useMinOrder ? (parseFloat(settings.minOrder) || 33.0) : 0;
  const finalPrice = Math.max(totalApiPrice, minFee);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <View style={styles.inputContainer}>
        <TextInput 
          style={styles.input}
          placeholder="ID (напр: 104.878.40)"
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={handleAddItem}
        />
        <Button title={loading ? "⏳" : "Add"} onPress={handleAddItem} disabled={loading} />
      </View>

      <View style={styles.listContainer}>
        <FlatList
          data={items}
          keyExtractor={(item, index) => `${item.cleanId}-${index}`}
          renderItem={({ item, index }) => {
             const isError = item.notFound;
             const rowPrice = (item.price * item.quantity).toFixed(2);

             return (
                <View style={[styles.itemRow, isError && styles.itemRowError]}>
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.thumb} />
                  ) : (
                    <View style={[styles.thumb, styles.thumbPlaceholder]}>
                      <Text style={{fontSize: 20}}>{isError ? '❌' : '📷'}</Text>
                    </View>
                  )}

                  <View style={styles.info}>
                    <Text style={[styles.name, isError && styles.textError]} numberOfLines={2}>
                      {isError ? `Не знайдено (${item.id})` : item.name}
                    </Text>
                    <View style={styles.detailsRow}>
                        <Text style={styles.details}>
                            {isError ? '---' : `${item.minutesIkea} хв (IKEA)`}
                        </Text>
                        {!isError && (
                            <View style={styles.priceBadge}>
                                <Text style={styles.priceText}>£{rowPrice}</Text>
                            </View>
                        )}
                    </View>
                  </View>

                  {item.quantity > 1 && (
                      <View style={styles.qtyBadge}>
                          <Text style={styles.qtyText}>x{item.quantity}</Text>
                      </View>
                  )}

                  <TouchableOpacity onPress={() => handleRemoveItem(index)} style={styles.deleteBtn}>
                    <Text style={{color: '#c0392b', fontWeight: 'bold', fontSize: 18}}>×</Text>
                  </TouchableOpacity>
                </View>
             );
          }}
          contentContainerStyle={styles.listContent}
        />
      </View>

      {settings.isDevMode && (
        <View style={styles.consoleContainer}>
          <View style={styles.consoleHeader}>
             <Text style={styles.consoleTitle}>📟 Live Console</Text>
             <TouchableOpacity onPress={() => setLogs([])}><Text style={{color:'#fff'}}>Clear</Text></TouchableOpacity>
          </View>
          <FlatList 
            data={logs}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <Text style={[styles.logText, item.type === 'error' ? styles.logError : item.type === 'warn' ? styles.logWarn : null]}>
                <Text style={{color: '#888'}}>[{item.time}] </Text>{item.text}
              </Text>
            )}
            style={styles.consoleList}
          />
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.footerRow}>
           <Text style={styles.footerLabel}>Час ({factor}x):</Text>
           <Text style={styles.footerValue}>{displayHours}h {displayMinRem}m</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.footerRow}>
           <Text style={styles.totalLabel}>РАЗОМ:</Text>
           <Text style={styles.totalPrice}>£{finalPrice.toFixed(2)}</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  inputContainer: { flexDirection: 'row', padding: 10, backgroundColor: '#fff', elevation: 2, alignItems: 'center' },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 5, padding: 8, marginRight: 10, fontSize: 16, height: 45 },
  listContainer: { flex: 1 },
  listContent: { padding: 10, paddingBottom: 20 },
  itemRow: { flexDirection: 'row', backgroundColor: '#fff', padding: 10, marginBottom: 8, borderRadius: 8, alignItems: 'center', elevation: 1 },
  itemRowError: { backgroundColor: '#fff5f5', borderColor: '#feb', borderWidth: 1 },
  thumb: { width: 45, height: 45, marginRight: 10, resizeMode: 'contain' },
  thumbPlaceholder: { backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center', borderRadius: 4 },
  info: { flex: 1, justifyContent: 'center' },
  name: { fontWeight: '600', fontSize: 14, color: '#333', marginBottom: 4 },
  textError: { color: '#c0392b', fontStyle: 'italic' },
  detailsRow: { flexDirection: 'row', alignItems: 'center' },
  details: { color: '#666', fontSize: 12, marginRight: 10 },
  priceBadge: { backgroundColor: '#e8f5e9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  priceText: { color: '#2e7d32', fontWeight: 'bold', fontSize: 12 },
  qtyBadge: { backgroundColor: '#0058a3', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginHorizontal: 8 },
  qtyText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  deleteBtn: { padding: 10, marginLeft: 5 },
  consoleContainer: { height: 120, backgroundColor: '#1e1e1e', borderTopWidth: 2, borderTopColor: '#555' },
  consoleHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 5, backgroundColor: '#333' },
  consoleTitle: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  consoleList: { padding: 5 },
  logText: { color: '#0f0', fontSize: 10, fontFamily: 'monospace' },
  logError: { color: '#ff5555' },
  logWarn: { color: '#ffbb33' },
  footer: { backgroundColor: '#fff', padding: 15, paddingBottom: 40, borderTopWidth: 1, borderTopColor: '#ddd', elevation: 10 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 8 },
  footerLabel: { fontSize: 14, color: '#555' },
  footerValue: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  totalLabel: { fontSize: 18, fontWeight: 'bold' },
  totalPrice: { fontSize: 24, fontWeight: 'bold', color: '#0058a3' },
});