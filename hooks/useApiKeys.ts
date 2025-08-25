import { useState } from 'react';

export interface ApiKeyConfig {
  [key: string]: string;
}

export const useApiKeys = (initialKeys: string[] = []) => {
  const [apiKeys, setApiKeys] = useState<ApiKeyConfig>(() => {
    const keys: ApiKeyConfig = {};
    initialKeys.forEach(key => {
      keys[key] = '';
    });
    return keys;
  });

  const setApiKey = (keyName: string, value: string) => {
    setApiKeys(prev => ({ ...prev, [keyName]: value }));
  };

  const getApiKey = (keyName: string) => apiKeys[keyName] || '';

  const validateKeys = (requiredKeys: string[]) => {
    return requiredKeys.every(key => apiKeys[key]?.trim() !== '');
  };

  return {
    apiKeys,
    setApiKey,
    getApiKey,
    validateKeys
  };
};