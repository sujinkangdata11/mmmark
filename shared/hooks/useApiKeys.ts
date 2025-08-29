import { useState, useEffect } from 'react';

// 단순 암호화/해독 함수 (뒤 4자리를 앞으로/앞 4자리를 뒤로)
const simpleEncrypt = (text: string): string => {
  if (text.length < 4) return text;
  const last4 = text.slice(-4);
  const rest = text.slice(0, -4);
  return last4 + rest;
};

const simpleDecrypt = (encrypted: string): string => {
  if (encrypted.length < 4) return encrypted;
  const first4 = encrypted.slice(0, 4);
  const rest = encrypted.slice(4);
  return rest + first4;
};

export interface ApiKeyConfig {
  [key: string]: string;
}

// 전역 상태를 위한 변수
let globalApiKeys: ApiKeyConfig = {};
const listeners: Set<(keys: ApiKeyConfig) => void> = new Set();

// localStorage에서 API 키 로드
const loadApiKeysFromStorage = (): ApiKeyConfig => {
  try {
    const stored = localStorage.getItem('apiKeys');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

// localStorage에 API 키 저장
const saveApiKeysToStorage = (keys: ApiKeyConfig) => {
  try {
    localStorage.setItem('apiKeys', JSON.stringify(keys));
  } catch (error) {
    console.warn('Failed to save API keys to localStorage:', error);
  }
};

// 암호화된 기본 API 키 값들 (깃허브 노출 방지)
const encryptedDefaultApiKeys: ApiKeyConfig = {
  gemini: simpleEncrypt('AIzaSyAKOOTPulJ6QVGnMtKE8I7dqWHb0OYRZfM'),
  username: '',
  clientId: simpleEncrypt('TMS9xFqgoJ-RSRof8Cba_g'),
  clientSecret: simpleEncrypt('ytSHhdne8y8bl4G_hr3yy9mGqXfShg'),
  redditAccount: 'Plenty_Way_5213',
  redditPassword: simpleEncrypt('tnwls2299@'),
  twitter: '',
  threads: '',
  youtube: simpleEncrypt('AIzaSyAKOOTPulJ6QVGnMtKE8I7dqWHb0OYRZfM'),
  discordWebhook: simpleEncrypt('https://discord.com/api/webhooks/1409752044667146271/FfJ4UxazUp7LE5uACHisx-BpSmt71RQKTYwDCdah62dXq8vm-pPAycuQYwSsadX_B81h'),
  googleDriveClientId: '',
  googleDriveClientSecret: '',
  // Twitter API OAuth 1.0a (이미지 업로드용)
  twitterConsumerKey: '',
  twitterConsumerSecret: '',
  twitterAccessToken: '',
  twitterAccessTokenSecret: '',
  // Twitter API OAuth 2.0 (트윗 작성용)
  twitterBearerToken: ''
};

// 기본 키 값들을 해독해서 제공
const getDefaultApiKeys = (): ApiKeyConfig => {
  const decrypted: ApiKeyConfig = {};
  Object.entries(encryptedDefaultApiKeys).forEach(([key, value]) => {
    decrypted[key] = value ? simpleDecrypt(value) : value;
  });
  return decrypted;
};

// 초기화
if (typeof window !== 'undefined') {
  const storedKeys = loadApiKeysFromStorage();
  console.log('[DEBUG] Loaded stored keys:', Object.keys(storedKeys));
  // 저장된 키가 있으면 사용하고, 없으면 해독된 기본값 사용
  const defaultKeys = getDefaultApiKeys();
  globalApiKeys = { ...defaultKeys, ...storedKeys };
  console.log('[DEBUG] Initialized global keys:', Object.keys(globalApiKeys));
}

export const useApiKeys = (initialKeys: string[] = []) => {
  const [apiKeys, setApiKeys] = useState<ApiKeyConfig>(() => {
    // 전역 상태에서 누락된 키들을 초기화
    const keys = { ...globalApiKeys };
    initialKeys.forEach(key => {
      if (!(key in keys)) {
        keys[key] = '';
      }
    });
    globalApiKeys = keys;
    return keys;
  });

  const setApiKey = (keyName: string, value: string) => {
    console.log(`[DEBUG] Setting API key: ${keyName} = ${value ? '[HIDDEN]' : '[EMPTY]'}`);
    const newKeys = { ...globalApiKeys, [keyName]: value };
    globalApiKeys = newKeys;
    saveApiKeysToStorage(newKeys);
    console.log(`[DEBUG] Updated global keys:`, Object.keys(newKeys));
    
    // 모든 리스너에게 변경사항 알림
    listeners.forEach(listener => listener(newKeys));
  };

  const getApiKey = (keyName: string) => {
    // 사용자가 입력한 키가 있으면 그대로 사용 (평문)
    const userKey = globalApiKeys[keyName];
    
    // 명시적으로 초기화된 경우 빈 문자열 반환 (UI에서는 비어보임)
    if (userKey === '__RESET__') {
      return '';
    }
    
    // 사용자가 입력한 키가 있고 기본값과 다른 경우
    if (userKey && userKey !== getDefaultApiKeys()[keyName]) {
      return userKey;
    }
    
    // 기본 키를 사용하는 경우 해독해서 반환
    const encryptedDefault = encryptedDefaultApiKeys[keyName];
    return encryptedDefault ? simpleDecrypt(encryptedDefault) : '';
  };

  const resetApiKey = (keyName: string) => {
    console.log(`[DEBUG] Resetting API key: ${keyName} to empty (will use default)`);
    // 특별한 마커를 사용해서 "명시적으로 초기화됨"을 표시
    const newKeys = { ...globalApiKeys, [keyName]: '__RESET__' };
    globalApiKeys = newKeys;
    saveApiKeysToStorage(newKeys);
    console.log(`[DEBUG] Reset ${keyName} - input cleared, will use default value`);
    
    // 모든 리스너에게 변경사항 알림
    listeners.forEach(listener => listener(newKeys));
  };

  const validateKeys = (requiredKeys: string[]) => {
    return requiredKeys.every(key => globalApiKeys[key]?.trim() !== '');
  };

  // 전역 상태 변경 감지
  useEffect(() => {
    const listener = (newKeys: ApiKeyConfig) => {
      setApiKeys(newKeys);
    };
    
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    apiKeys,
    setApiKey,
    getApiKey,
    resetApiKey,
    validateKeys
  };
};