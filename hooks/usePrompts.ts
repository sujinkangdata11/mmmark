import { useState, useCallback } from 'react';
import { DEFAULT_PROMPTS, PromptConfig, AutomationPrompts } from '../config/prompts';

export const usePrompts = (automationType: string) => {
  const [customPrompts, setCustomPrompts] = useState<AutomationPrompts>(DEFAULT_PROMPTS);

  const getPrompt = useCallback((promptId: string): PromptConfig | null => {
    const prompts = customPrompts[automationType] || [];
    return prompts.find(p => p.id === promptId) || null;
  }, [automationType, customPrompts]);

  const updatePrompt = useCallback((promptId: string, newTemplate: string) => {
    setCustomPrompts(prev => ({
      ...prev,
      [automationType]: prev[automationType]?.map(p => 
        p.id === promptId ? { ...p, template: newTemplate } : p
      ) || []
    }));
  }, [automationType]);

  const resetPrompt = useCallback((promptId: string) => {
    const defaultPrompt = DEFAULT_PROMPTS[automationType]?.find(p => p.id === promptId);
    if (defaultPrompt) {
      updatePrompt(promptId, defaultPrompt.template);
    }
  }, [automationType, updatePrompt]);

  const getAllPrompts = useCallback(() => {
    return customPrompts[automationType] || [];
  }, [automationType, customPrompts]);

  const interpolatePrompt = useCallback((promptId: string, variables: Record<string, string>): string => {
    const prompt = getPrompt(promptId);
    if (!prompt) return '';

    let result = prompt.template;
    Object.entries(variables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{${key}}`, 'g'), value);
    });
    return result;
  }, [getPrompt]);

  return {
    getPrompt,
    updatePrompt,
    resetPrompt,
    getAllPrompts,
    interpolatePrompt
  };
};