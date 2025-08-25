import { useState, useCallback } from 'react';
import { AutomationLog } from '../types';

export const useLogger = () => {
  const [logs, setLogs] = useState<AutomationLog[]>([]);

  const addLog = useCallback((message: string, type: AutomationLog['type'] = 'info') => {
    setLogs(prev => [...prev, {
      id: new Date().toISOString() + Math.random(),
      timestamp: new Date().toLocaleTimeString('ko-KR'),
      message,
      type
    }]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return { logs, addLog, clearLogs };
};