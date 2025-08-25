# Cloudflare Workers로 Reddit API 프록시 설정

## 1. Cloudflare 계정 준비
1. [Cloudflare](https://cloudflare.com) 계정 생성 (무료)
2. Wrangler CLI 설치: `npm install -g wrangler`

## 2. Worker 배포
```bash
# 1. Cloudflare 로그인
wrangler login

# 2. Worker 배포
wrangler publish

# 3. URL 확인 (예: https://reddit-api-proxy.your-subdomain.workers.dev)
```

## 3. RedditService 설정
`services/redditService.ts`에서 `workerUrl`을 실제 Worker URL로 교체:
```typescript
const workerUrl = 'https://reddit-api-proxy.your-subdomain.workers.dev';
```

## 4. 테스트
Worker가 배포되면 다음 URL로 테스트:
```
https://reddit-api-proxy.your-subdomain.workers.dev/api/reddit/r/newtuber/new.json?limit=5
```

## 5. 무료 제한
- 100,000 requests/day (일일 10만 요청)
- 10ms CPU time per request
- 충분히 사용 가능!

## 파일 설명
- `cloudflare-worker.js`: Worker 코드
- `wrangler.toml`: 설정 파일