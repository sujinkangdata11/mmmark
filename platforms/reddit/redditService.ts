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

  // OAuth 토큰 발급 (password grant_type)
  private async getAccessToken(): Promise<string> {
    if (this.accessToken) {
      return this.accessToken;
    }

    if (!this.clientId || !this.clientSecret) {
      throw new Error('Reddit Client ID와 Client Secret이 필요합니다. 사이드바에서 설정해주세요.');
    }

    if (!this.redditAccount || !this.redditPassword) {
      throw new Error('Reddit 계정명과 비밀번호가 필요합니다. 사이드바에서 설정해주세요.');
    }

    try {
      const credentials = btoa(`${this.clientId}:${this.clientSecret}`);
      
      // password grant_type 사용
      const body = new URLSearchParams({
        'grant_type': 'password',
        'username': this.redditAccount,
        'password': this.redditPassword
      });
      
      const response = await fetch('https://marketing.anime-toon-7923.workers.dev/api/v1/access_token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'User-Agent': this.username !== 'anonymous' 
            ? `RedditBot/1.0 (by /u/${this.username})` 
            : `RedditBot/1.0 (by /u/${this.redditAccount})`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body.toString()
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`토큰 발급 실패: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('🔍 OAuth 응답 전체 데이터:', data);
      
      this.accessToken = data.access_token;
      console.log('🔑 발급된 토큰:', this.accessToken);
      
      console.log('✅ Reddit OAuth 토큰 발급 성공!', {
        token_type: data.token_type,
        expires_in: data.expires_in,
        scope: data.scope
      });
      
      // 토큰 만료 시간 설정 (보통 1시간)
      setTimeout(() => {
        this.accessToken = null;
      }, (data.expires_in - 60) * 1000); // 1분 전에 만료

      return this.accessToken;
    } catch (error) {
      throw new Error(`OAuth 토큰 발급 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
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

  // Reddit OAuth API를 통해 실제 데이터 가져오기
  async getSubredditPosts(subredditName: string, sort: 'hot' | 'new' = 'new', limit: number = 10): Promise<RedditPost[]> {
    try {
      // 먼저 OAuth 토큰 발급받기
      const accessToken = await this.getAccessToken();
      console.log(`🔐 OAuth 토큰 발급 완료: ${accessToken}`);
      
      const cleanSubredditName = subredditName.replace(/^r\//, '');
      
      // 인증된 Reddit OAuth API 사용
      const apiUrl = `https://marketing.anime-toon-7923.workers.dev/api/reddit/r/${cleanSubredditName}/${sort}.json?limit=${limit}`;
      console.log(`🔍 Fetching authenticated Reddit data: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': this.username !== 'anonymous' 
            ? `RedditBot/1.0 (by /u/${this.username})` 
            : `RedditBot/1.0 (by /u/${this.redditAccount})`,
          'Accept': 'application/json',
        }
      });

      console.log(`📡 Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP 에러! 상태: ${response.status} - ${errorText}`);
      }

      const data: RedditApiResponse = await response.json();
      console.log('🔍 프록시 서버 응답 데이터:', data);
      console.log('🔍 data.data 존재?', !!data?.data);
      console.log('🔍 data.data.children 존재?', !!data?.data?.children);
      
      if (!data?.data?.children) {
        console.log('❌ 응답 구조 확인:', JSON.stringify(data, null, 2));
        throw new Error('예상치 못한 API 응답 형식입니다.');
      }

      const posts = data.data.children.map(child => ({
        ...child.data,
        url: child.data.url || `https://www.reddit.com${child.data.permalink}`,
      }));

      console.log(`✅ Successfully fetched ${posts.length} real Reddit posts from r/${cleanSubredditName}`);
      posts.forEach((post, index) => {
        console.log(`${index + 1}. ${post.title} by ${post.author} (${post.score} points)`);
      });
      
      return posts;
    } catch (error) {
      console.error('❌ Error fetching Reddit posts:', error);
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
      // OAuth 토큰 발급받기
      const accessToken = await this.getAccessToken();
      console.log(`🔐 댓글 작성을 위한 OAuth 토큰 발급 완료`);
      
      // Reddit API로 댓글 작성
      const apiUrl = 'https://oauth.reddit.com/api/comment';
      
      const formData = new URLSearchParams({
        'api_type': 'json',
        'text': commentText,
        'thing_id': postId  // 게시물의 fullname (예: t3_abc123)
      });
      
      console.log(`📝 댓글 작성 요청: ${postId}에 "${commentText.substring(0, 50)}..."`);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': this.username !== 'anonymous' 
            ? `RedditBot/1.0 (by /u/${this.username})` 
            : `RedditBot/1.0 (by /u/${this.redditAccount})`,
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