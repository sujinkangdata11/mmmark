// 카드별 프롬프트 관리 시스템 (Feed 기반)
import { FEED01_REDDIT_CARD05_PROMPTS, FEED01_REDDIT_CARD05_FAVORITE_PROMPTS } from './feed01-reddit-card05';
import { FEED01_REDDIT_CARD06_PROMPTS, FEED01_REDDIT_CARD06_FAVORITE_PROMPTS } from './feed01-reddit-card06';
import { FEED01_REDDIT_CARD07_PROMPTS, FEED01_REDDIT_CARD07_FAVORITE_PROMPTS } from './feed01-reddit-card07';
import { FEED02_TWITTER_CARD03_PROMPTS, FEED02_TWITTER_CARD03_FAVORITE_PROMPTS } from './feed02-twitter-card03';
import { FEED02_TWITTER_CARD04_PROMPTS, FEED02_TWITTER_CARD04_FAVORITE_PROMPTS } from './feed02-twitter-card04';
import { FEED02_TWITTER_CARD05_PROMPTS, FEED02_TWITTER_CARD05_FAVORITE_PROMPTS } from './feed02-twitter-card05';
import { FEED03_YOUTUBE_CARD01_PROMPTS, FEED03_YOUTUBE_CARD01_FAVORITE_PROMPTS } from './feed03-youtube-card01';
import { FEED04_UPLOAD_CARD01_PROMPTS, FEED04_UPLOAD_CARD01_FAVORITE_PROMPTS } from './feed04-upload-card01';
import { PromptConfig } from '../config/prompts';

// 전체 프롬프트 통합 (기존 구조 유지)
export const ALL_PROMPTS = {
  reddit: [
    ...FEED01_REDDIT_CARD05_PROMPTS,
    ...FEED01_REDDIT_CARD06_PROMPTS,
    ...FEED01_REDDIT_CARD07_PROMPTS
  ],
  twitter: [
    ...FEED02_TWITTER_CARD03_PROMPTS,
    ...FEED02_TWITTER_CARD04_PROMPTS,
    ...FEED02_TWITTER_CARD05_PROMPTS
  ],
  youtube: [
    ...FEED03_YOUTUBE_CARD01_PROMPTS
  ],
  upload: [
    ...FEED04_UPLOAD_CARD01_PROMPTS
  ],
  // 기존 general 프롬프트도 유지
  general: [
    {
      id: 'content-generation',
      name: '범용 컨텐츠 생성',
      description: '다양한 용도의 컨텐츠 생성',
      template: `Create engaging content based on the following requirements. Be creative, helpful, and maintain a professional tone.

Requirements: "{REQUIREMENTS}"
Target audience: "{AUDIENCE}"
Tone: "{TONE}"`,
      variables: ['REQUIREMENTS', 'AUDIENCE', 'TONE']
    }
  ] as PromptConfig[]
};

// 카드별 즐겨찾는 프롬프트 매핑 (Feed 기반)
const CARD_FAVORITE_PROMPTS = {
  // Feed01 Reddit
  'feed01-reddit-suitability': FEED01_REDDIT_CARD05_FAVORITE_PROMPTS,
  'feed01-reddit-comment': FEED01_REDDIT_CARD06_FAVORITE_PROMPTS,
  'feed01-reddit-translation': FEED01_REDDIT_CARD07_FAVORITE_PROMPTS,
  
  // Feed02 Twitter
  'feed02-twitter-channel-extraction': FEED02_TWITTER_CARD03_FAVORITE_PROMPTS,
  'feed02-twitter-channel-info': FEED02_TWITTER_CARD04_FAVORITE_PROMPTS,
  'feed02-twitter-post': FEED02_TWITTER_CARD05_FAVORITE_PROMPTS,
  
  // Feed03 YouTube
  'feed03-youtube-comment': FEED03_YOUTUBE_CARD01_FAVORITE_PROMPTS,
  
  // Feed04 Upload
  'feed04-youtube-upload-info': FEED04_UPLOAD_CARD01_FAVORITE_PROMPTS,
  
  // 하위호환을 위한 기존 키들도 유지
  'reddit-suitability': FEED01_REDDIT_CARD05_FAVORITE_PROMPTS,
  'reddit-comment': FEED01_REDDIT_CARD06_FAVORITE_PROMPTS,
  'reddit-translation': FEED01_REDDIT_CARD07_FAVORITE_PROMPTS,
  'twitter-channel-extraction': FEED02_TWITTER_CARD03_FAVORITE_PROMPTS,
  'twitter-channel-info': FEED02_TWITTER_CARD04_FAVORITE_PROMPTS,
  'twitter-post': FEED02_TWITTER_CARD05_FAVORITE_PROMPTS,
  'youtube-comment': FEED03_YOUTUBE_CARD01_FAVORITE_PROMPTS,
  'youtube-upload-info': FEED04_UPLOAD_CARD01_FAVORITE_PROMPTS
};

// 특정 프롬프트 ID로 즐겨찾는 프롬프트 가져오기 (개선된 버전)
export const getFavoritePrompts = (feed: string, promptId: string): string[] => {
  return CARD_FAVORITE_PROMPTS[promptId as keyof typeof CARD_FAVORITE_PROMPTS] || [];
};