import { PromptConfig } from '../config/prompts';
import { FavoritePromptOption } from './types';

// Feed01 Reddit 7번 카드: 영어 번역 프롬프트
export const FEED01_REDDIT_CARD07_PROMPTS: PromptConfig[] = [
  {
    id: 'feed01-reddit-translation',
    name: '영어 번역 프롬프트',
    description: '한국어 댓글을 영어로 번역',
    template: `다음 한국어 댓글을 자연스러운 영어로 번역해주세요. Reddit에서 사용할 댓글이므로 친근하고 자연스러운 톤으로 번역해주세요:

{COMMENT}

*반드시 이 내용만 번역하세요.추가로 문장을 붙이거나, 줄이면 안됩니다*`,
    variables: ['COMMENT']
  }
];

// Feed01 Reddit 7번 카드 즐겨찾는 프롬프트들
export const FEED01_REDDIT_CARD07_FAVORITE_PROMPTS: FavoritePromptOption[] = [
  {
    title: '디폴트 프롬프트',
    body: `다음 한국어 댓글을 자연스러운 영어로 번역해주세요. Reddit에서 사용할 댓글이므로 친근하고 자연스러운 톤으로 번역해주세요:

{COMMENT}

*반드시 이 내용만 번역하세요. 추가 문장 추가하거나 줄이면 안 됩니다.*`
  },
  {
    title: 'Reddit 캐주얼 톤',
    body: '원문을 Reddit에서 흔히 쓰는 캐주얼한 표현으로 바꿔 번역해주세요. 불필요한 존댓말은 자연스럽게 줄여주세요.'
  },
  {
    title: '전문가 조언 톤',
    body: '전문적인 신뢰감을 주는 어조로 번역하되, 길이는 원문과 비슷하게 맞춰주세요.'
  },
  {
    title: '짧고 명료한 번역',
    body: '핵심 메시지를 유지하면서도 문장을 간결하게 정리해 영어로 번역해주세요.'
  },
  {
    title: '유머 섞인 번역',
    body: '가능하다면 가벼운 유머나 위트를 살짝 담아 자연스럽게 번역해주세요.'
  }
];
