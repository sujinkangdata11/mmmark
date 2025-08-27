import { useState, useEffect } from 'react';

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

// 기본 API 키 값들 (개발용)
const defaultApiKeys: ApiKeyConfig = {
  gemini: 'AIzaSyAKOOTPulJ6QVGnMtKE8I7dqWHb0OYRZfM',
  username: '',
  clientId: 'OtherBunk6QNnbE6rWRA5PQ',
  clientSecret: 'UFmIzxGJwqjKfpfOkvBLIBDYNm9MqYDjWw',
  redditAccount: '',
  redditPassword: '',
  twitter: '',
  threads: '',
  youtube: '',
  discordWebhook: 'https://discord.com/api/webhooks/1409752044667146271/FfJ4UxazUp7LE5uACHisx-BpSmt71RQKTYwDCdah62dXq8vm-pPAycuQYwSsadX_B81h',
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

// 초기화
if (typeof window !== 'undefined') {
  const storedKeys = loadApiKeysFromStorage();
  console.log('[DEBUG] Loaded stored keys:', Object.keys(storedKeys));
  // 저장된 키가 있으면 사용하고, 없으면 기본값 사용
  globalApiKeys = { ...defaultApiKeys, ...storedKeys };
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
    return globalApiKeys[keyName] || '';
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
    validateKeys
  };
};