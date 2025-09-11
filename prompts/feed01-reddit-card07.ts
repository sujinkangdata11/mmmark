import { PromptConfig } from '../config/prompts';

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
export const FEED01_REDDIT_CARD07_FAVORITE_PROMPTS = [
  // 디폴트 프롬프트 (첫 번째)
  `다음 한국어 댓글을 자연스러운 영어로 번역해주세요. Reddit에서 사용할 댓글이므로 친근하고 자연스러운 톤으로 번역해주세요:

{COMMENT}

*반드시 이 내용만 번역하세요.추가로 문장을 붙이거나, 줄이면 안됩니다*`,
  
  // 커스텀 프롬프트들
  "Reddit에 맞는 자연스러운 영어로 번역해주세요.",
  "원문의 뉘앙스를 살려서 영어로 번역해주세요.",
  "친근하고 캐주얼한 톤으로 영어 번역해주세요."
];