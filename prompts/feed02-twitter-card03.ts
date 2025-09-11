import { PromptConfig } from '../config/prompts';

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
export const FEED02_TWITTER_CARD03_FAVORITE_PROMPTS = [
  // 디폴트 프롬프트 (첫 번째)
  `이 이미지에서 유튜브 채널 핸들(@username)을 추출해주세요. 

다음과 같은 형식으로 응답해주세요:
- 채널명: [채널 이름]
- 핸들: @[username]
- 구독자: [구독자 수]
- 기타 정보: [추가 정보가 있다면]

이미지를 자세히 분석해서 정확한 정보만 추출해주세요.`,
  
  // 커스텀 프롬프트들
  "이미지에서 YouTube 채널 핸들과 기본 정보를 추출해주세요.",
  "구독자 수와 채널명을 포함한 채널 정보를 정확히 분석해주세요.",
  "유튜브 채널의 모든 식별 정보를 체계적으로 추출해주세요."
];