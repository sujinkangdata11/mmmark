import { PromptConfig } from '../config/prompts';
import { FavoritePromptOption } from './types';

// Feed03 YouTube 1번 카드: 댓글 생성 프롬프트
export const FEED03_YOUTUBE_CARD01_PROMPTS: PromptConfig[] = [
  {
    id: 'feed03-youtube-comment',
    name: '댓글 생성 프롬프트',
    description: 'YouTube 영상에 대한 댓글 생성',
    template: `Write a thoughtful comment for this YouTube video. The comment should add value, show genuine interest, and potentially drive traffic to our content. At the end, naturally mention visiting our website for more content on this topic.

Video Title: "{VIDEO_TITLE}"
Our website: "{WEBSITE_URL}"`,
    variables: ['VIDEO_TITLE', 'WEBSITE_URL']
  }
];

// Feed03 YouTube 1번 카드 즐겨찾는 프롬프트들
export const FEED03_YOUTUBE_CARD01_FAVORITE_PROMPTS: FavoritePromptOption[] = [
  {
    title: '디폴트 프롬프트',
    body: `Write a thoughtful comment for this YouTube video. The comment should add value, show genuine interest, and potentially drive traffic to our content. At the end, naturally mention visiting our website for more content on this topic.

Video Title: "{VIDEO_TITLE}"
Our website: "{WEBSITE_URL}"`
  },
  {
    title: '정보형 코멘트',
    body: '영상에서 다루는 핵심 포인트 2~3개를 짚어 주고, 마지막에 AutoVid 사이트를 자연스럽게 언급하는 댓글을 작성해주세요.'
  },
  {
    title: '팁 공유형',
    body: '시청자에게 도움이 될만한 팁을 추가로 제공하면서 우리 서비스를 부드럽게 소개하는 댓글을 작성해주세요.'
  },
  {
    title: '질문 유도형',
    body: '영상에 대한 질문이나 토론거리를 던지면서 AutoVid에 들러보라고 권유하는 톤으로 댓글을 작성해주세요.'
  }
];
