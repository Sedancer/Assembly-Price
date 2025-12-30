 import React, { useState, useCallback } from 'react';
import { 
  View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, LayoutAnimation, Platform, UIManager, Image 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { HistoryService, HistoryRecord } from '../services/history';

// Вмикаємо анімацію для Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function HistoryScreen() {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const loadHistory = async () => {
    const data = await HistoryService.getAll();
    setHistory(data);
  };

  const handleClearAll = () => {
    Alert.alert("Очищення", "Видалити всю історію?", [
      { text: "Ні", style: "cancel" },
      { text: "Так", style: 'destructive', onPress: async () => {
          await HistoryService.clearAll(); // Додай цей метод в history.ts якщо його там ще немає (див. нижче)
          setHistory([]);
      }}
    ]);
  };

  const handleDeleteItem = async (id: string) => {
    const updated = await HistoryService.delete(id);
    setHistory(updated);
  };

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(prev => prev === id ? null : id);
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString('uk-UA', { 
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
    });
  };

  return (
    <View style={styles.container}>
      {/* Шапка з кнопкою очищення */}
      <View style={styles.topHeader}>
          <Text style={styles.headerTitle}>Збережені розрахунки</Text>
          {history.length > 0 && (
            <TouchableOpacity onPress={handleClearAll}>
                <Text style={{color: '#c0392b'}}>Очистити все</Text>
            </TouchableOpacity>
          )}
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Історія порожня</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 15 }}
          renderItem={({ item }) => {
            const isExpanded = expandedId === item.id;
            
            return (
              <TouchableOpacity 
                style={styles.card} 
                activeOpacity={0.9} 
                onPress={() => toggleExpand(item.id)}
              >
                {/* 1. Заголовок картки */}
                <View style={styles.cardHeader}>
                   <View>
                       <Text style={styles.date}>{formatDate(item.date)}</Text>
                       <Text style={styles.title}>
                          {item.type === 'code' ? '📦 ' : '📋 '} {item.title}
                       </Text>
                   </View>
                   <TouchableOpacity onPress={() => handleDeleteItem(item.id)} style={styles.delBtn}>
                      <Text style={styles.delText}>✕</Text>
                   </TouchableOpacity>
                </View>

                {/* 2. Детальний список (тільки якщо розгорнуто) */}
                {isExpanded && (
                    <View style={styles.detailsList}>
                        <View style={styles.divider}/>
                        {item.items.map((subItem, idx) => (
                            <View key={`${item.id}-${idx}`} style={styles.detailRow}>
                                <View style={styles.qtyBadge}>
                                    <Text style={styles.qtyText}>{subItem.quantity}</Text>
                                </View>
                                <View style={{flex: 1}}>
                                    <Text style={styles.detailName}>{subItem.name}</Text>
                                    <Text style={styles.detailId}>{subItem.cleanId}</Text>
                                </View>
                                <Text style={styles.detailMins}>{subItem.minutesIkea * subItem.quantity} хв</Text>
                            </View>
                        ))}
                        <View style={styles.divider}/>
                    </View>
                )}

                {/* 3. Футер картки (Підсумок) */}
                <View style={styles.cardFooter}>
                   <View style={styles.footerInfo}>
                       <Text style={styles.minutesLabel}>Час: {Math.round(item.totalMinutes)} хв</Text>
                       {isExpanded && <Text style={{fontSize:10, color:'#888'}}> (x{item.items.length} поз.)</Text>}
                   </View>
                   <Text style={styles.price}>£{item.totalPrice.toFixed(2)}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: '#fff', elevation: 2 },
  headerTitle: { fontWeight: 'bold', fontSize: 16 },
  
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#888', fontSize: 16 },
  
  card: { backgroundColor: '#fff', marginBottom: 10, borderRadius: 10, elevation: 2, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 15 },
  
  date: { fontSize: 11, color: '#999', marginBottom: 2 },
  title: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  
  delBtn: { paddingLeft: 10, paddingBottom: 10 },
  delText: { fontSize: 16, color: '#ccc' }, // Сірий хрестик, щоб не кидався в очі
  
  // Деталі (список)
  detailsList: { backgroundColor: '#fafafa', paddingHorizontal: 15, paddingBottom: 10 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  qtyBadge: { backgroundColor: '#ddd', width: 22, height: 22, borderRadius: 4, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  qtyText: { fontSize: 11, fontWeight: 'bold', color: '#333' },
  detailName: { fontSize: 13, color: '#333', flex: 1 },
  detailId: { fontSize: 11, color: '#888' },
  detailMins: { fontSize: 12, fontWeight: 'bold', color: '#555' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 8 },

  // Футер
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, paddingTop: 10, borderTopWidth: 1, borderColor: '#f0f0f0' },
  footerInfo: { flexDirection: 'row', alignItems: 'baseline' },
  minutesLabel: { fontSize: 14, color: '#555' },
  price: { fontSize: 20, fontWeight: 'bold', color: '#27ae60' }
});