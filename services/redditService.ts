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

  constructor(username: string = 'anonymous') {
    this.username = username;
  }

  // Reddit 공개 JSON 연결 테스트 (CORS 회피)
  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      // CORS를 피하기 위해 간단한 서브레딧 JSON 요청
      const testUrl = 'https://www.reddit.com/r/test.json?limit=1';
      console.log(`🔍 Testing with: ${testUrl}`);
      
      const response = await fetch(testUrl);
      
      console.log(`📡 Test response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          message: `Reddit 연결 실패: ${response.status} ${response.statusText}`,
          details: { status: response.status, statusText: response.statusText, body: errorText }
        };
      }
      
      const data = await response.json();
      
      return {
        success: true,
        message: `Reddit 공개 API 연결 성공! (테스트 서브레딧에서 ${data.data?.children?.length || 0}개 게시물 확인)`,
        details: {
          status: response.status,
          postsFound: data.data?.children?.length || 0
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `연결 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'} - 이는 보통 CORS 문제입니다.`,
        details: error
      };
    }
  }

  // Reddit에서는 읽기 전용 작업에는 인증이 필요하지 않음
  async getSubredditPosts(subredditName: string, sort: 'hot' | 'new' = 'new', limit: number = 10): Promise<RedditPost[]> {
    try {
      // r/ 접두사 제거 (있다면)
      const cleanSubredditName = subredditName.replace(/^r\//, '');
      
      // Cloudflare Worker URL
      const workerUrl = 'https://be909f4b-marketing.anime-toon-7923.workers.dev';
      const apiUrl = `${workerUrl}/api/reddit/r/${cleanSubredditName}/${sort}.json?limit=${limit}`;
      
      console.log(`🔍 Fetching from Cloudflare Worker: ${apiUrl}`);
      
      const response = await fetch(apiUrl);

      console.log(`📡 Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        throw new Error(`HTTP 에러! 상태: ${response.status}`);
      }

      const data: RedditApiResponse = await response.json();
      
      if (!data?.data?.children) {
        throw new Error('예상치 못한 API 응답 형식입니다.');
      }

      const posts = data.data.children.map(child => ({
        ...child.data,
        url: `https://www.reddit.com${child.data.permalink}`,
      }));

      console.log(`✅ Successfully fetched ${posts.length} posts from r/${cleanSubredditName}`);
      posts.forEach((post, index) => {
        console.log(`${index + 1}. ${post.title} by ${post.author} (${post.score} points)`);
      });
      
      return posts;
    } catch (error) {
      console.error('❌ Error fetching Reddit posts:', error);
      if (error instanceof Error) {
        throw new Error(`게시글을 가져오는 데 실패했습니다: ${error.message}. CORS 문제일 수 있습니다.`);
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
}

export default RedditService;