// 프롬프트 관련 인터페이스들
export interface PromptConfig {
  id: string;
  name: string;
  description: string;
  template: string;
  variables?: string[];
}

export interface AutomationPrompts {
  [key: string]: PromptConfig[];
}

// 새로운 조직화된 프롬프트 구조를 사용
import { ALL_PROMPTS } from '../prompts';

export const DEFAULT_PROMPTS: AutomationPrompts = ALL_PROMPTS;