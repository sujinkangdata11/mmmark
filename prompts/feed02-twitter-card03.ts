import { PromptConfig } from '../config/prompts';
import { FavoritePromptOption } from './types';

// Feed02 Twitter 3번 카드: YouTube 핸들 추출 프롬프트
export const FEED02_TWITTER_CARD03_PROMPTS: PromptConfig[] = [
  {
    id: 'feed02-twitter-channel-extraction',
    name: 'YouTube 핸들 추출 프롬프트',
    description: '이미지에서 YouTube 핸들을 추출하는 프롬프트',
    template: `이 이미지에서 유튜브 채널 핸들(@username)을 추출해주세요. 

다음과 같은 형식으로 응답해주세요:
- 채널명: [채널 이름]
- 핸들: @[username]
- 구독자: [구독자 수]
- 기타 정보: [추가 정보가 있다면]

이미지를 자세히 분석해서 정확한 정보만 추출해주세요.`,
    variables: []
  }
];

// Feed02 Twitter 3번 카드 즐겨찾는 프롬프트들
export const FEED02_TWITTER_CARD03_FAVORITE_PROMPTS: FavoritePromptOption[] = [
  {
    title: '디폴트 프롬프트',
    body: `이 이미지에서 유튜브 채널 핸들(@username)을 추출해주세요. 

다음과 같은 형식으로 응답해주세요:
- 채널명: [채널 이름]
- 핸들: @[username]
- 구독자: [구독자 수]
- 기타 정보: [추가 정보가 있다면]

이미지를 자세히 분석해서 정확한 정보만 추출해주세요.`
  },
  {
    title: '기본 정보 추출',
    body: '이미지에서 YouTube 채널 핸들과 기본 소개 정보를 차분하게 정리해서 알려주세요.'
  },
  {
    title: '구독자 강조형',
    body: '핸들과 함께 구독자 수, 주요 콘텐츠 키워드가 있다면 같이 적어주세요.'
  },
  {
    title: '세부 메타데이터 수집',
    body: '가능한 한 많은 식별 정보를 체계적으로 bullet 형태로 정리해주세요. (채널명, 핸들, 구독자, 링크 등)'
  }
];
