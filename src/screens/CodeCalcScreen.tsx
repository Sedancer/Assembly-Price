import React, { useState, useEffect, useRef } from 'react';
import { 
    View, TextInput, Button, Text, FlatList, StyleSheet, 
    ActivityIndicator, Alert, Keyboard, TouchableOpacity, Image,
    KeyboardAvoidingView, Platform
} from 'react-native';
import { DataService, ItemData } from '../services/api';
import { useSettings } from '../context/SettingsContext';
import { HistoryService } from '../services/history';

interface LogMessage {
    id: string;
    type: 'info' | 'error' | 'warn';
    text: string;
    time: string;
}

export default function CodeCalcScreen() {
    const { settings } = useSettings();
    const [code, setCode] = useState('');
    const [items, setItems] = useState<ItemData[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchedCode, setSearchedCode] = useState('');
    const [logs, setLogs] = useState<LogMessage[]>([]);

    const itemsRef = useRef(items);
    const codeRef = useRef(searchedCode);
    const settingsRef = useRef(settings);

    useEffect(() => {
        itemsRef.current = items;
        codeRef.current = searchedCode;
        settingsRef.current = settings;
    }, [items, searchedCode, settings]);

    // --- ЗБЕРЕЖЕННЯ В ІСТОРІЮ ПРИ ВИХОДІ ---
    useEffect(() => {
        return () => {
            const currentItems = itemsRef.current;
            const currentCode = codeRef.current;
            const currentSettings = settingsRef.current;

            if (currentItems.length > 0 && currentCode) {
                // 1. ЧАС (Інформаційний)
                const totalMinutes = currentItems.reduce((sum, i) => sum + (i.minutesIkea * i.quantity), 0);
                const factor = currentSettings.useWorkIndex 
                    ? (parseFloat(currentSettings.workIndex) || 1.3) 
                    : 1.0;
                const realMinutes = Math.round(totalMinutes * factor);

                // 2. ГРОШІ (Сума цін з API)
                const totalApiPrice = currentItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
                
                // 3. МІНІМАЛКА
                const min = currentSettings.useMinOrder 
                    ? (parseFloat(currentSettings.minOrder) || 33.0) 
                    : 0;
                const finalPrice = Math.max(totalApiPrice, min);

                HistoryService.add({
                    type: 'code',
                    title: `Проєкт: ${currentCode}`,
                    totalMinutes: realMinutes,
                    totalPrice: finalPrice,
                    items: currentItems
                });
            }
        };
    }, []);

    // --- ЛОГІКА КОНСОЛІ ---
    useEffect(() => {
        if (!settings.isDevMode) return;
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;

        const addLog = (type: 'info' | 'error' | 'warn', args: any[]) => {
            const text = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
            setLogs(prev => [{
                id: Math.random().toString(36).substr(2, 9),
                type, text, time: new Date().toLocaleTimeString()
            }, ...prev]);
        };

        console.log = (...args) => { originalLog(...args); addLog('info', args); };
        console.error = (...args) => { originalError(...args); addLog('error', args); };
        console.warn = (...args) => { originalWarn(...args); addLog('warn', args); };

        return () => {
            console.log = originalLog;
            console.error = originalError;
            console.warn = originalWarn;
        };
    }, [settings.isDevMode]);

    const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

    const handleSearch = async () => {
        if (!code.trim() || loading) return;
        
        Keyboard.dismiss();
        setLoading(true);
        setItems([]); 
        setLogs([]);
        
        const targetCode = code.trim().toUpperCase();
        console.log(`[UI] Search: ${targetCode}`);

        const rawList = await DataService.fetchDesignCodeList(targetCode, settings);

        if (rawList.length === 0) {
            Alert.alert('Помилка', 'Код не знайдено або список порожній');
            console.error(`[UI] Code not found or empty`);
            setLoading(false);
            return;
        }

        console.log(`[UI] Found ${rawList.length} items. Fetching details...`);
        setSearchedCode(targetCode);

        let processedCount = 0;
        for (const rawItem of rawList) {
            if (processedCount > 0) await wait(300);

            console.log(`[UI] Fetching ${processedCount + 1}/${rawList.length}: ${rawItem.id}`);
            
            const detailedItem = await DataService.fetchItem(rawItem.id, settings);

            if (detailedItem) {
                const itemWithQty = { ...detailedItem, quantity: rawItem.qty };
                setItems(prev => [...prev, itemWithQty]);
                console.log(`[UI] ✅ Got: ${itemWithQty.name} (£${itemWithQty.price})`);
            } else {
                console.error(`[UI] ❌ Failed: ${rawItem.id}`);
            }
            
            processedCount++;
        }
        setLoading(false);
    };

    // --- МАТЕМАТИКА ВІДОБРАЖЕННЯ ---
    
    // 1. Час
    const factor = settings.useWorkIndex ? (parseFloat(settings.workIndex) || 1.3) : 1.0;
    const totalMinutesIkea = items.reduce((sum, item) => sum + (item.minutesIkea * item.quantity), 0);
    const realMinutes = Math.round(totalMinutesIkea * factor);
    const realHours = Math.floor(realMinutes / 60);
    const realMinRem = realMinutes % 60;

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
            <View style={styles.searchBox}>
                <TextInput 
                    value={code}
                    onChangeText={setCode}
                    placeholder="Код (напр. Y95DTF)"
                    style={styles.input}
                    autoCapitalize="characters"
                    onSubmitEditing={handleSearch}
                />
                <Button title={loading ? "⏳" : "Find"} onPress={handleSearch} disabled={loading} />
            </View>

            {searchedCode !== '' && (
                <View style={styles.summaryHeader}>
                    <Text style={styles.summaryTitle}>📦 Проєкт: {searchedCode}</Text>
                    <Text style={{color: '#666'}}>Позицій: {items.length}</Text>
                </View>
            )}

            <View style={styles.listWrapper}>
                <FlatList
                    data={items}
                    keyExtractor={(item, index) => `${item.id}-${index}`}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => {
                        const isError = item.notFound;
                        // Ціна за рядок
                        const rowPrice = (item.price * item.quantity).toFixed(2);

                        return (
                            <View style={[styles.itemRow, isError && styles.itemRowError]}>
                                <View style={styles.qtyBadge}>
                                    <Text style={styles.qtyText}>{item.quantity}</Text>
                                </View>

                                {item.image ? (
                                    <Image source={{ uri: item.image }} style={styles.thumb} />
                                ) : (
                                    <View style={[styles.thumb, styles.thumbPlaceholder]}>
                                        <Text>{isError ? '❌' : '📷'}</Text>
                                    </View>
                                )}

                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.name, isError && styles.textError]} numberOfLines={2}>
                                        {isError ? 'Не знайдено' : item.name}
                                    </Text>
                                    <Text style={styles.sub}>{item.cleanId}</Text>
                                </View>

                                <View style={{ alignItems: 'flex-end' }}>
                                    {/* Ціна */}
                                    {!isError && (
                                         <View style={styles.priceBadge}>
                                             <Text style={styles.priceText}>£{rowPrice}</Text>
                                         </View>
                                    )}
                                    {/* Час */}
                                    <Text style={styles.minutes}>
                                        {isError ? '--' : `${item.minutesIkea} хв`}
                                    </Text>
                                    {!isError && item.quantity > 1 && (
                                        <Text style={styles.subTotalMin}>
                                            (всього {item.minutesIkea * item.quantity} хв)
                                        </Text>
                                    )}
                                </View>
                            </View>
                        );
                    }}
                />
            </View>

            {/* КОНСОЛЬ */}
            {settings.isDevMode && (
                <View style={styles.consoleContainer}>
                    <View style={styles.consoleHeader}>
                        <Text style={styles.consoleTitle}>📟 Live Console</Text>
                        <TouchableOpacity onPress={() => setLogs([])}>
                            <Text style={{color:'#fff'}}>Clear</Text>
                        </TouchableOpacity>
                    </View>
                    <FlatList 
                        data={logs}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <Text style={[
                                styles.logText, 
                                item.type === 'error' ? styles.logError : 
                                item.type === 'warn' ? styles.logWarn : null
                            ]}>
                                <Text style={{color: '#888'}}>[{item.time}] </Text>
                                {item.text}
                            </Text>
                        )}
                        style={styles.consoleList}
                    />
                </View>
            )}

            {/* ФУТЕР */}
            {items.length > 0 && (
                <View style={styles.footer}>
                    <View style={styles.row}>
                        <Text style={styles.label}>Час ({factor}x):</Text>
                        <Text style={styles.value}>{realHours}г {realMinRem}хв</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.row}>
                        <Text style={styles.totalLabel}>РАЗОМ:</Text>
                        <Text style={styles.totalPrice}>£{finalPrice.toFixed(2)}</Text>
                    </View>
                </View>
            )}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    searchBox: { flexDirection: 'row', padding: 10, backgroundColor: '#fff', elevation: 2, alignItems: 'center' },
    input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, marginRight: 10, fontSize: 16 },
    summaryHeader: { padding: 10, backgroundColor: '#e6f0fa', borderBottomWidth: 1, borderColor: '#ccd', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    summaryTitle: { fontSize: 16, fontWeight: 'bold', color: '#0058a3' },
    
    listWrapper: { flex: 1 },
    listContent: { paddingBottom: 10 }, 
    
    itemRow: { flexDirection: 'row', backgroundColor: '#fff', padding: 10, marginBottom: 1, alignItems: 'center', borderBottomWidth: 1, borderColor: '#eee' },
    itemRowError: { backgroundColor: '#fff0f0' },
    
    qtyBadge: { backgroundColor: '#333', borderRadius: 4, width: 24, height: 24, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    qtyText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
    
    thumb: { width: 40, height: 40, marginRight: 10, resizeMode: 'contain' },
    thumbPlaceholder: { width: 40, height: 40, marginRight: 10, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center', borderRadius: 4 },
    
    name: { fontSize: 13, fontWeight: '600', color: '#333' },
    textError: { color: '#c0392b', fontStyle: 'italic' },
    sub: { fontSize: 11, color: '#888' },
    
    // Styles for price/time in row
    priceBadge: { backgroundColor: '#e8f5e9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginBottom: 4, alignSelf: 'flex-end' },
    priceText: { color: '#2e7d32', fontWeight: 'bold', fontSize: 12 },
    minutes: { color: '#666', fontSize: 11 },
    subTotalMin: { fontSize: 9, color: '#999' },
    
    // Console
    consoleContainer: { height: 120, backgroundColor: '#1e1e1e', borderTopWidth: 2, borderTopColor: '#555' },
    consoleHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 5, backgroundColor: '#333' },
    consoleTitle: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
    consoleList: { padding: 5 },
    logText: { color: '#0f0', fontSize: 10, fontFamily: 'monospace' },
    logError: { color: '#ff5555' },
    logWarn: { color: '#ffbb33' },

    // Footer
    footer: { backgroundColor: '#fff', padding: 15, borderTopWidth: 1, borderColor: '#ccc', elevation: 10, paddingBottom: 40 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    label: { fontSize: 14, color: '#555' },
    value: { fontSize: 16, fontWeight: 'bold' },
    divider: { height: 1, backgroundColor: '#eee', marginVertical: 8 },
    totalLabel: { fontSize: 18, fontWeight: 'bold' },
    totalPrice: { fontSize: 22, fontWeight: 'bold', color: '#27ae60' }
});