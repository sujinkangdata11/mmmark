import { useState, useRef, useCallback } from 'react';

export const useAutomation = () => {
  const [isAutomating, setIsAutomating] = useState(false);
  const automationRef = useRef(isAutomating);
  automationRef.current = isAutomating;

  const startAutomation = useCallback((automationFunction: () => Promise<void>) => {
    setIsAutomating(true);
    automationFunction().finally(() => setIsAutomating(false));
  }, []);

  const stopAutomation = useCallback(() => {
    setIsAutomating(false);
  }, []);

  const isRunning = () => automationRef.current;

  return {
    isAutomating,
    startAutomation,
    stopAutomation,
    isRunning
  };
};