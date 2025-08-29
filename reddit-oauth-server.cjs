const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const port = 3003;

// CORS 설정 - React 앱에서 접근 허용
app.use(cors({
  origin: 'http://localhost:5175',
  credentials: true
}));

// JSON 파싱
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Reddit OAuth 설정
const REDDIT_CLIENT_ID = 'TMS9xFqgoJ-RSRof8Cba_g';
const REDDIT_CLIENT_SECRET = 'ytSHhdne8y8bl4G_hr3yy9mGqXfShg';

// Reddit OAuth 토큰 교환 엔드포인트
app.get('/login_reddit', async (req, res) => {
  console.log('🚀 [SERVER] Reddit 토큰 교환 요청 받음');
  
  try {
    const { code, state } = req.query;
    
    console.log('📥 [SERVER] 파라미터:', {
      code: code ? code.substring(0, 20) + '...' : 'null',
      state: state ? state.substring(0, 10) + '...' : 'null'
    });

    if (!code) {
      throw new Error('인증 코드가 없습니다');
    }

    // Reddit API에 토큰 교환 요청
    const encodedCredentials = Buffer.from(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`).toString('base64');
    
    console.log('🔄 [SERVER] Reddit API에 토큰 교환 요청 중...');
    console.log('🔍 [SERVER] Client ID:', REDDIT_CLIENT_ID);
    console.log('🔍 [SERVER] Encoded credentials:', encodedCredentials.substring(0, 20) + '...');
    
    const response = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      body: `grant_type=authorization_code&code=${code}&redirect_uri=http://localhost:5175/login/callback`,
      headers: {
        authorization: `Basic ${encodedCredentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'AIMarketingHub/1.0 (by /u/Plenty_Way_5213)'
      }
    });

    console.log('📡 [SERVER] Reddit API 응답:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [SERVER] 토큰 교환 실패:', response.status, errorText);
      throw new Error(`토큰 교환 실패: ${response.status} - ${errorText}`);
    }

    const tokenData = await response.json();
    console.log('🎉 [SERVER] 토큰 데이터 받음:', {
      hasAccessToken: !!tokenData.access_token,
      hasRefreshToken: !!tokenData.refresh_token,
      tokenType: tokenData.token_type,
      expiresIn: tokenData.expires_in,
      scope: tokenData.scope
    });

    // 사용자 정보 가져오기
    console.log('👤 [SERVER] 사용자 정보 조회 중...');
    const userResponse = await fetch('https://oauth.reddit.com/api/v1/me', {
      method: 'GET',
      headers: {
        authorization: `bearer ${tokenData.access_token}`,
        'User-Agent': 'AIMarketingHub/1.0 (by /u/Plenty_Way_5213)'
      }
    });

    let userData = null;
    if (userResponse.ok) {
      userData = await userResponse.json();
      console.log('✅ [SERVER] 사용자 정보:', userData.name);
    } else {
      console.warn('⚠️ [SERVER] 사용자 정보 조회 실패:', userResponse.status);
    }

    // 성공 응답
    res.json({
      success: true,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_type: tokenData.token_type,
      expires_in: tokenData.expires_in,
      scope: tokenData.scope,
      user: userData ? {
        id: userData.id,
        name: userData.name,
        created: userData.created_utc
      } : null
    });

  } catch (error) {
    console.error('💥 [SERVER] 에러 발생:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Reddit 게시물 가져오기 엔드포인트
app.get('/api/reddit/posts', async (req, res) => {
  console.log('📝 [SERVER] Reddit 게시물 요청 받음');
  
  try {
    const { subreddit, sort = 'new', limit = 10 } = req.query;
    
    console.log('📥 [SERVER] 요청 파라미터:', { subreddit, sort, limit });
    
    if (!subreddit) {
      throw new Error('subreddit 파라미터가 필요합니다');
    }
    
    // Reddit 공개 JSON API 호출
    const cleanSubredditName = subreddit.replace(/^r\//, '');
    const apiUrl = `https://www.reddit.com/r/${cleanSubredditName}/${sort}.json?limit=${limit}`;
    
    console.log(`🔍 [SERVER] Reddit API 호출: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'AIMarketingHub/1.0 (by /u/Plenty_Way_5213)',
        'Accept': 'application/json',
      }
    });
    
    console.log(`📡 [SERVER] Reddit API 응답: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Reddit API 오류: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    if (!data?.data?.children) {
      throw new Error('예상치 못한 API 응답 형식입니다.');
    }
    
    const posts = data.data.children.map(child => ({
      ...child.data,
      url: child.data.url || `https://www.reddit.com${child.data.permalink}`,
    }));
    
    console.log(`✅ [SERVER] ${posts.length}개 게시물 반환: r/${cleanSubredditName}`);
    
    res.json({
      success: true,
      posts: posts,
      subreddit: cleanSubredditName,
      sort: sort,
      count: posts.length
    });
    
  } catch (error) {
    console.error('💥 [SERVER] Reddit 게시물 가져오기 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 서버 상태 확인용
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Reddit OAuth Server is running' });
});

// 서버 시작
app.listen(port, () => {
  console.log('🚀 Reddit OAuth Server 시작됨');
  console.log(`📍 URL: http://localhost:${port}`);
  console.log(`🔗 Health check: http://localhost:${port}/health`);
  console.log(`🔐 OAuth endpoint: http://localhost:${port}/login_reddit`);
});