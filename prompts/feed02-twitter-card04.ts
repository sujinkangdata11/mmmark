import { PromptConfig } from '../config/prompts';
import { FavoritePromptOption } from './types';

// Feed02 Twitter 4번 카드: 채널 정보 조회 프롬프트
export const FEED02_TWITTER_CARD04_PROMPTS: PromptConfig[] = [
  {
    id: 'feed02-twitter-channel-info',
    name: '채널 정보 조회 프롬프트',
    description: 'YouTube 채널 상세 정보 조회',
    template: `다음 YouTube 채널 핸들을 기반으로 채널의 상세 정보를 조회하고 분석해주세요:

채널 핸들: {CHANNEL_HANDLE}

다음 정보를 포함해서 분석해주세요:
- 채널 생성일
- 총 구독자 수
- 총 영상 수
- 총 조회수
- 주요 콘텐츠 유형
- 업로드 주기
- 최근 영상 성과

이 정보를 바탕으로 AutoVid 서비스 홍보에 적합한 채널인지 판단도 해주세요.`,
    variables: ['CHANNEL_HANDLE']
  }
];

// Feed02 Twitter 4번 카드 즐겨찾는 프롬프트들
export const FEED02_TWITTER_CARD04_FAVORITE_PROMPTS: FavoritePromptOption[] = [
  {
    title: '디폴트 프롬프트',
    body: `다음 YouTube 채널 핸들을 기반으로 채널의 상세 정보를 조회하고 분석해주세요:

채널 핸들: {CHANNEL_HANDLE}

다음 정보를 포함해서 분석해주세요:
- 채널 생성일
- 총 구독자 수
- 총 영상 수
- 총 조회수
- 주요 콘텐츠 유형
- 업로드 주기
- 최근 영상 성과

이 정보를 바탕으로 AutoVid 서비스 홍보에 적합한 채널인지 판단도 해주세요.`
  },
  {
    title: '핵심 지표 요약',
    body: '구독자, 조회수, 업로드 빈도를 중심으로 채널 강점과 약점을 간단히 정리해주세요.'
  },
  {
    title: 'AutoVid 적합성 평가',
    body: 'AutoVid 서비스를 제안하기 좋은 이유와 주의할 점을 중심으로 채널을 분석해주세요.'
  },
  {
    title: '콘텐츠 전략 분석',
    body: '최근 영상의 주제, 시청자 반응, 업로드 리듬을 참고하여 채널의 콘텐츠 전략을 평가해주세요.'
  }
];
