import { PromptConfig } from '../config/prompts';

// Feed01 Reddit 6번 카드: 댓글 생성 프롬프트
export const FEED01_REDDIT_CARD06_PROMPTS: PromptConfig[] = [
  {
    id: 'feed01-reddit-comment',
    name: '댓글 생성 프롬프트',
    description: 'Reddit 게시글에 대한 댓글 생성',
    template: `적합성 판단의 근거를 가지고 {POST_INDEX}번 게시물의 댓글을 자연스럽게 써주세요. 너무 인위적으로 홍보하면 반감이 생기니, 자연스럽게, 툭 던지듯 말해주세요. 댓글내용은 200자 이하로하고 레딧에서 흔히 볼수 있는 문체와 정중함이 살짝 곁들여진 내용으로 작성하세요.

적합성 판단 근거: {REASON}

게시물 제목: {POST_TITLE}
게시물 내용: {POST_CONTENT}

##반드시 한국어로 써라.`,
    variables: ['POST_INDEX', 'REASON', 'POST_TITLE', 'POST_CONTENT']
  }
];

// Feed01 Reddit 6번 카드 즐겨찾는 프롬프트들
export const FEED01_REDDIT_CARD06_FAVORITE_PROMPTS = [
  // 디폴트 프롬프트 (첫 번째)
  `적합성 판단의 근거를 가지고 {POST_INDEX}번 게시물의 댓글을 자연스럽게 써주세요. 너무 인위적으로 홍보하면 반감이 생기니, 자연스럽게, 툭 던지듯 말해주세요. 댓글내용은 200자 이하로하고 레딧에서 흔히 볼수 있는 문체와 정중함이 살짝 곁들여진 내용으로 작성하세요.

적합성 판단 근거: {REASON}

게시물 제목: {POST_TITLE}
게시물 내용: {POST_CONTENT}

##반드시 한국어로 써라.`,
  
  // 커스텀 프롬프트들
  "자연스럽고 도움이 되는 댓글을 작성해주세요.",
  "Reddit 문화에 맞는 친근한 톤의 댓글을 작성해주세요.",
  "홍보 티 나지 않게 자연스럽게 AutoVid를 언급해주세요."
];