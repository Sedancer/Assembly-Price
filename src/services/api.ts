import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings } from '../context/SettingsContext';

interface TaskRabbitResponse {
  display_name: string;
  pro_pat_minutes: number;
  assembly_price: string;
  image_link: string;
  error?: any;
}

interface DesignCodeResponse {
  item_list: {
    article_number: string;
    quantity: number;
  }[];
  unsupported_items?: any[];
  status?: number;
}

export interface ItemData {
  id: string;
  cleanId: string;
  name: string;
  minutesIkea: number;
  price: number;
  image: string | null;
  notFound?: boolean;
  quantity: number;
}

const CACHE_KEY_PREFIX = 'item_cache_';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-GB,en;q=0.9',
  'Referer': 'https://www.taskrabbit.co.uk/',
  'Connection': 'keep-alive',
  'Origin': 'https://www.taskrabbit.co.uk'
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const DataService = {
  fetchItem: async (rawId: string, settings: AppSettings): Promise<ItemData | null> => {
    const cleanId = rawId.replace(/\./g, "").trim();
    if (!cleanId) return null;

    let baseUrl = process.env.EXPO_PUBLIC_API_URL;
    if (!baseUrl.includes('product.json')) {
        baseUrl = `${baseUrl.replace(/\/$/, '')}/assembly_services/product.json`;
    }
    const locale = process.env.EXPO_PUBLIC_LOCALE || "en-GB";
    const url = `${baseUrl}?item_no=${cleanId}&locale=${locale}`;

    // 1. ОФЛАЙН FIRST
    const cached = await getFromCache(cleanId);
    
    if (settings.isOfflineMode && cached) {
        if (settings.isDevMode) console.log(`[API] ⚡ Cache Hit (Instant): ${cleanId}`);
        return { ...cached, quantity: 1 };
    }

    try {
      const delay = parseInt(process.env.EXPO_PUBLIC_API_DELAY || '1000');
      await sleep(delay);

      if (settings.isDevMode) console.log(`[API] 🚀 Fetching Item: ${url}`);
      
      const response = await fetch(url, { headers: HEADERS });
      
      if (response.status === 404) {
        if (settings.isDevMode) console.warn(`[API] ℹ️ Item 404: ${cleanId}`);
        return {
            id: rawId,
            cleanId: cleanId,
            name: "Артикул не знайдено",
            minutesIkea: 0,
            price: 0,
            image: null,
            notFound: true,
            quantity: 1
        };
      }

      const responseText = await response.text();
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      let data: TaskRabbitResponse;
      try { data = JSON.parse(responseText); } catch (e) { return null; }

      if (data.error && Object.keys(data.error).length > 0) return null;

      let parsedPrice = 0;
      if (data.assembly_price) {
          const priceString = String(data.assembly_price).replace(/[^\d.]/g, '');
          parsedPrice = parseFloat(priceString);
      }

      const item: ItemData = {
        id: rawId,
        cleanId: cleanId,
        name: data.display_name,
        minutesIkea: data.pro_pat_minutes || 0,
        price: parsedPrice || 0,
        image: data.image_link || null,
        notFound: false,
        quantity: 1
      };

      await saveToCache(cleanId, item);
      return item;

    } catch (error) {
        return cached ? { ...cached, quantity: 1 } : null;
    }
  },

  fetchDesignCodeList: async (code: string, settings: AppSettings): Promise<{id: string, qty: number}[]> => {
      let designUrl = process.env.EXPO_PUBLIC_DESIGN_API_URL;
      if (!designUrl.includes('item_list.json')) {
           designUrl = `${designUrl.replace(/\/$/, '')}/ikea/design_code_service/item_list.json`;
      }

      const locale = process.env.EXPO_PUBLIC_LOCALE || "en-GB";
      const url = `${designUrl}?design_code=${code.trim()}&locale=${locale}`;

      if (settings.isDevMode) console.log(`[API] 🔍 Resolving Code URL: ${url}`);

      try {
          const response = await fetch(url, { headers: HEADERS });
          const text = await response.text();

          if (!response.ok) {
              if (settings.isDevMode) console.error(`[API] Code Error ${response.status}`);
              return [];
          }

          const data: DesignCodeResponse = JSON.parse(text);
          if (data.item_list && Array.isArray(data.item_list)) {
              return data.item_list.map(i => ({
                  id: i.article_number,
                  qty: i.quantity
              }));
          }
          return [];
      } catch (e) {
          if (settings.isDevMode) console.error(`[API] Exception`, e);
          return [];
      }
  }
};

const saveToCache = async (id: string, data: ItemData) => {
  try { await AsyncStorage.setItem(CACHE_KEY_PREFIX + id, JSON.stringify(data)); } catch (e) {}
};

const getFromCache = async (id: string): Promise<ItemData | null> => {
  try {
    const json = await AsyncStorage.getItem(CACHE_KEY_PREFIX + id);
    return json ? JSON.parse(json) : null;
  } catch (e) { return null; }
};