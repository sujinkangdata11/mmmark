import { PromptConfig } from '../config/prompts';
import { FavoritePromptOption } from './types';

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
export const FEED01_REDDIT_CARD06_FAVORITE_PROMPTS: FavoritePromptOption[] = [
  {
    title: '디폴트 프롬프트',
    body: `적합성 판단의 근거를 가지고 {POST_INDEX}번 게시물의 댓글을 자연스럽게 써주세요. 너무 인위적으로 홍보하면 반감이 생기니, 자연스럽게, 툭 던지듯 말해주세요. 댓글내용은 200자 이하로하고 레딧에서 흔히 볼수 있는 문체와 정중함이 살짝 곁들여진 내용으로 작성하세요.

적합성 판단 근거: {REASON}

게시물 제목: {POST_TITLE}
게시물 내용: {POST_CONTENT}

##반드시 한국어로 써라.`
  },
  {
    title: '친근한 톤 (케어형)',
    body: '커뮤니티에 도움을 주는 친구처럼, 위로와 팁을 섞어서 AutoVid를 살짝 언급하는 댓글을 작성해주세요.'
  },
  {
    title: '전문가 어드바이스 톤',
    body: '경험 많은 크리에이터의 조언처럼, 분석적인 근거와 함께 AutoVid를 추천하는 댓글을 작성해주세요.'
  },
  {
    title: '짧고 임팩트 있게',
    body: '세 문장 이내로 간결하게 작성하고, 마지막에 AutoVid 사용 팁을 붙여주세요.'
  },
  {
    title: '스토리텔링 방식',
    body: '비슷한 고민을 겪던 사례를 짧게 소개하고, AutoVid를 해결책으로 제안하는 스토리 형식 댓글을 작성해주세요.'
  }
];
