import { PromptConfig } from '../config/prompts';

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
export const FEED03_YOUTUBE_CARD01_FAVORITE_PROMPTS = [
  // 디폴트 프롬프트 (첫 번째)
  `Write a thoughtful comment for this YouTube video. The comment should add value, show genuine interest, and potentially drive traffic to our content. At the end, naturally mention visiting our website for more content on this topic.

Video Title: "{VIDEO_TITLE}"
Our website: "{WEBSITE_URL}"`,
  
  // 커스텀 프롬프트들
  "가치 있는 정보를 제공하는 댓글을 작성해주세요.",
  "영상 내용에 관련된 유용한 팁을 댓글로 남겨주세요.",
  "AutoVid 웹사이트를 자연스럽게 언급하는 댓글을 작성해주세요."
];