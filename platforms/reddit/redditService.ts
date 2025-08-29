interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  author: string;
  url: string;
  score: number;
  num_comments: number;
  created_utc: number;
  subreddit: string;
  permalink: string;
}

interface RedditApiResponse {
  data: {
    children: Array<{
      data: RedditPost;
    }>;
  };
}

export class RedditService {
  private username: string; // User-Agent용
  private clientId: string;
  private clientSecret: string;
  private redditAccount: string;
  private redditPassword: string;
  private accessToken: string | null = null;

  constructor(username: string = 'anonymous', clientId: string = '', clientSecret: string = '', redditAccount: string = '', redditPassword: string = '') {
    this.username = username;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redditAccount = redditAccount;
    this.redditPassword = redditPassword;
  }

  // 리프레시 토큰을 사용한 액세스 토큰 갱신
  private async refreshAccessToken(): Promise<string> {
    console.log('🔍 [REFRESH] 토큰 갱신 프로세스 시작');
    
    const refreshToken = localStorage.getItem('reddit_refresh_token');
    if (!refreshToken) {
      console.error('❌ [REFRESH] 리프레시 토큰이 localStorage에 없음');
      throw new Error('리프레시 토큰이 없습니다. 다시 로그인해주세요.');
    }

    console.log('✅ [REFRESH] 리프레시 토큰 발견:', refreshToken.substring(0, 20) + '...');

    try {
      const clientId = 'TMS9xFqgoJ-RSRof8Cba_g';
      const clientSecret = 'ytSHhdne8y8bl4G_hr3yy9mGqXfShg';
      const encodedCredentials = btoa(`${clientId}:${clientSecret}`);
      
      console.log('🔄 [REFRESH] Reddit API에 토큰 갱신 요청 중...');
      console.log('🔍 [REFRESH] Client ID:', clientId);
      console.log('🔍 [REFRESH] Encoded credentials:', encodedCredentials.substring(0, 20) + '...');
      
      const requestBody = `grant_type=refresh_token&refresh_token=${refreshToken}`;
      console.log('📤 [REFRESH] Request body:', requestBody.substring(0, 50) + '...');
      
      const response = await fetch('https://www.reddit.com/api/v1/access_token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${encodedCredentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'AIMarketingHub/1.0 (by /u/Plenty_Way_5213)'
        },
        body: requestBody
      });

      console.log('📡 [REFRESH] 응답 받음:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [REFRESH] 토큰 갱신 실패:', response.status, errorText);
        // 갱신 실패시 저장된 토큰들 삭제
        console.log('🧹 [REFRESH] 실패로 인한 토큰 정리 중...');
        localStorage.removeItem('reddit_access_token');
        localStorage.removeItem('reddit_refresh_token');
        localStorage.removeItem('reddit_username');
        throw new Error('토큰 갱신 실패. 다시 로그인해주세요.');
      }

      const tokenData = await response.json();
      console.log('📥 [REFRESH] 토큰 데이터 받음:', {
        hasAccessToken: !!tokenData.access_token,
        hasRefreshToken: !!tokenData.refresh_token,
        tokenType: tokenData.token_type,
        expiresIn: tokenData.expires_in
      });
      
      // 새 토큰들 저장
      localStorage.setItem('reddit_access_token', tokenData.access_token);
      console.log('💾 [REFRESH] 새 액세스 토큰 localStorage에 저장');
      
      if (tokenData.refresh_token) {
        localStorage.setItem('reddit_refresh_token', tokenData.refresh_token);
        console.log('💾 [REFRESH] 새 리프레시 토큰 localStorage에 저장');
      } else {
        console.log('⚠️ [REFRESH] 새 리프레시 토큰이 응답에 없음 (기존 토큰 계속 사용)');
      }
      
      this.accessToken = tokenData.access_token;
      console.log('✅ [REFRESH] 메모리에 새 액세스 토큰 저장 완료');
      
      return tokenData.access_token;
    } catch (error) {
      console.error('💥 [REFRESH] 토큰 갱신 예외 발생:', error);
      throw new Error(`토큰 갱신 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  // OAuth 토큰 가져오기 (자동 갱신 포함)
  private async getAccessToken(): Promise<string> {
    console.log('🔍 [GET_TOKEN] 액세스 토큰 요청');
    
    // 이미 메모리에 있으면 사용
    if (this.accessToken) {
      console.log('✅ [GET_TOKEN] 메모리에서 기존 토큰 사용:', this.accessToken.substring(0, 20) + '...');
      return this.accessToken;
    }

    // localStorage에서 토큰 확인
    const storedToken = localStorage.getItem('reddit_access_token');
    if (storedToken) {
      console.log('🔑 [GET_TOKEN] localStorage에서 토큰 발견:', storedToken.substring(0, 20) + '...');
      this.accessToken = storedToken;
      return storedToken;
    }

    console.error('❌ [GET_TOKEN] 사용 가능한 토큰이 없음');
    throw new Error('Reddit 로그인이 필요합니다. "🔐 Reddit으로 로그인" 버튼을 클릭해주세요.');
  }

  // API 호출 시 401 에러 처리를 위한 래퍼
  private async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    console.log('🌐 [API] 인증된 요청 시작:', options.method || 'GET', url);
    
    const accessToken = await this.getAccessToken();
    console.log('🔐 [API] 토큰으로 요청 준비:', accessToken.substring(0, 20) + '...');
    
    const requestHeaders = {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`,
      'User-Agent': 'AIMarketingHub/1.0 (by /u/Plenty_Way_5213)',
    };
    
    console.log('📤 [API] 요청 헤더:', {
      'Authorization': `Bearer ${accessToken.substring(0, 20)}...`,
      'User-Agent': requestHeaders['User-Agent'],
      'Content-Type': requestHeaders['Content-Type'] || 'N/A'
    });
    
    const response = await fetch(url, {
      ...options,
      headers: requestHeaders
    });

    console.log('📡 [API] 응답 받음:', response.status, response.statusText);

    // 401 에러(만료된 토큰) 처리
    if (response.status === 401) {
      console.log('🔄 [API] 401 에러 - 토큰 만료 감지, 갱신 시도 중...');
      const newToken = await this.refreshAccessToken();
      
      console.log('🔁 [API] 새 토큰으로 재시도:', newToken.substring(0, 20) + '...');
      // 새 토큰으로 재시도
      const retryResponse = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${newToken}`,
          'User-Agent': 'AIMarketingHub/1.0 (by /u/Plenty_Way_5213)',
        }
      });
      
      console.log('📡 [API] 재시도 응답:', retryResponse.status, retryResponse.statusText);
      return retryResponse;
    }

    return response;
  }

  // 현재 로그인한 사용자 정보 가져오기
  async getCurrentUser(): Promise<{id: string, name: string, created: number}> {
    try {
      console.log('🔐 사용자 정보 조회 중...');
      
      const response = await this.makeAuthenticatedRequest('https://oauth.reddit.com/api/v1/me', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`사용자 정보 조회 실패: ${response.status} - ${errorText}`);
      }

      const userData = await response.json();
      console.log('👤 Reddit 사용자 정보:', userData);
      
      return {
        id: userData.id,
        name: userData.name,
        created: userData.created_utc
      };
    } catch (error) {
      throw new Error(`사용자 정보 조회 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  // 프록시 서비스를 통한 Reddit 연결 테스트
  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const testRedditUrl = 'https://www.reddit.com/r/test/hot.json?limit=1';
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(testRedditUrl)}`;
      console.log(`🔍 Testing Reddit connection via proxy service: ${proxyUrl}`);
      
      const response = await fetch(proxyUrl, {
        headers: {
          'Accept': 'application/json',
        }
      });
      
      console.log(`📡 Test response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          message: `Reddit 연결 실패: ${response.status} ${response.statusText}`,
          details: { status: response.status, statusText: response.statusText, body: errorText }
        };
      }
      
      const proxyData = await response.json();
      const data = JSON.parse(proxyData.contents);
      
      return {
        success: true,
        message: `Reddit API 연결 성공! 프록시 서비스를 통해 실제 Reddit 데이터에 접근 가능합니다. (테스트에서 ${data.data?.children?.length || 0}개 게시물 확인)`,
        details: {
          status: response.status,
          postsFound: data.data?.children?.length || 0,
          viaProxy: true,
          proxyService: 'allorigins.win'
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `연결 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'} - 프록시 서비스에 문제가 있을 수 있습니다.`,
        details: error
      };
    }
  }

  // Express 서버를 통해 Reddit 게시물 가져오기
  async getSubredditPosts(subredditName: string, sort: 'hot' | 'new' = 'new', limit: number = 10): Promise<RedditPost[]> {
    try {
      const cleanSubredditName = subredditName.replace(/^r\//, '');
      
      // Express 서버 엔드포인트 호출
      const serverUrl = `http://localhost:3003/api/reddit/posts?subreddit=${cleanSubredditName}&sort=${sort}&limit=${limit}`;
      console.log(`🔍 Fetching Reddit data via server: ${serverUrl}`);
      
      const response = await fetch(serverUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      console.log(`📡 Server response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`서버 에러! 상태: ${response.status} - ${errorText}`);
      }

      const serverResponse = await response.json();
      console.log('🔍 서버 응답 데이터:', serverResponse);
      
      if (!serverResponse.success) {
        throw new Error(`서버 오류: ${serverResponse.error}`);
      }

      if (!serverResponse.posts || !Array.isArray(serverResponse.posts)) {
        throw new Error('서버에서 유효하지 않은 게시물 데이터를 받았습니다.');
      }

      const posts = serverResponse.posts;

      console.log(`✅ Successfully fetched ${posts.length} Reddit posts from r/${cleanSubredditName} via server`);
      posts.forEach((post, index) => {
        console.log(`${index + 1}. ${post.title} by ${post.author} (${post.score} points)`);
      });
      
      return posts;
    } catch (error) {
      console.error('❌ Error fetching Reddit posts via server:', error);
      if (error instanceof Error) {
        throw new Error(`게시글을 가져오는 데 실패했습니다: ${error.message}`);
      }
      throw error;
    }
  }

  // URL에서 서브레딧 이름 추출
  extractSubredditFromUrl(url: string): string {
    const match = url.match(/reddit\.com\/r\/([^\/]+)/);
    return match ? match[1] : '';
  }

  // 게시물 적합성 검사
  isPostSuitableForComment(post: RedditPost): boolean {
    // 기본 필터링 조건들
    if (post.selftext === '[removed]' || post.selftext === '[deleted]') {
      return false;
    }
    
    // 너무 오래된 게시물 제외 (24시간 이상)
    const now = Date.now() / 1000;
    const dayAgo = now - (24 * 60 * 60);
    if (post.created_utc < dayAgo) {
      return false;
    }

    // 댓글이 너무 많은 게시물 제외 (이미 활발한 토론)
    if (post.num_comments > 100) {
      return false;
    }

    return true;
  }

  formatPostForAI(post: RedditPost): { title: string; content: string } {
    return {
      title: post.title,
      content: post.selftext || '(No content - link post)'
    };
  }

  // Reddit에 댓글 작성
  async postComment(postId: string, commentText: string): Promise<{ success: boolean; message: string; commentId?: string }> {
    try {
      console.log(`🔐 댓글 작성 중: ${postId}`);
      
      // Reddit OAuth API로 댓글 작성
      const apiUrl = 'https://oauth.reddit.com/api/comment';
      
      const formData = new URLSearchParams({
        'api_type': 'json',
        'text': commentText,
        'thing_id': postId  // 게시물의 fullname (예: t3_abc123)
      });
      
      console.log(`📝 댓글 작성 요청: ${postId}에 "${commentText.substring(0, 50)}..."`);
      
      const response = await this.makeAuthenticatedRequest(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData.toString()
      });

      console.log(`📡 댓글 작성 응답: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP 에러! 상태: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      if (result.json && result.json.errors && result.json.errors.length > 0) {
        throw new Error(`Reddit API 에러: ${result.json.errors[0]}`);
      }
      
      const commentId = result.json?.data?.things?.[0]?.data?.id;
      
      return {
        success: true,
        message: '댓글이 성공적으로 작성되었습니다!',
        commentId: commentId
      };
      
    } catch (error) {
      console.error('❌ 댓글 작성 실패:', error);
      return {
        success: false,
        message: `댓글 작성 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      };
    }
  }
}

export default RedditService;