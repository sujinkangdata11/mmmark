# Twitter API 설정 가이드

## 1. Twitter Developer Portal 설정

1. [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard) 접속
2. 앱 생성 또는 기존 앱 선택
3. 다음 API 키들을 복사:
   - **Consumer Key (API Key)**
   - **Consumer Secret (API Secret)**
   - **Access Token**
   - **Access Token Secret**
   - **Bearer Token**

## 2. Cloudflare Workers 환경변수 설정

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) 로그인
2. **Workers & Pages** → **marketing** 선택
3. **Settings** 탭 → **Environment Variables** 섹션
4. 다음 환경변수들을 **Production** 환경에 추가:

```
TWITTER_CONSUMER_KEY = your_consumer_key_here
TWITTER_CONSUMER_SECRET = your_consumer_secret_here  
TWITTER_ACCESS_TOKEN = your_access_token_here
TWITTER_ACCESS_TOKEN_SECRET = your_access_token_secret_here
TWITTER_BEARER_TOKEN = your_bearer_token_here
```

## 3. 앱 UI에서 API 키 설정

사이드바의 **Twitter API OAuth 1.0a** 및 **OAuth 2.0** 섹션에도 동일한 키들을 입력해야 합니다.

## 4. 테스트

환경변수 설정 후 7번 카드 "트위터 (X)에 배포"에서 실제 Twitter API를 통한 게시가 가능합니다.

## 현재 상태

- ✅ Twitter API 서비스 구현 완료
- ✅ Cloudflare Workers 프록시 배포 완료  
- ⏳ 환경변수 설정 필요
- ⏳ 실제 API 키 발급 및 입력 필요

환경변수 미설정 시 자동으로 시뮬레이션 모드로 실행됩니다.