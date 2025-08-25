export default {
  async fetch(request, env, ctx) {
    // CORS 헤더
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // OPTIONS 요청 처리 (CORS preflight)
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Reddit API 프록시
    if (path.startsWith('/api/reddit/')) {
      try {
        // /api/reddit/r/newtuber/new.json -> /r/newtuber/new.json
        const redditPath = path.replace('/api/reddit', '');
        const redditUrl = `https://www.reddit.com${redditPath}${url.search}`;
        
        console.log('Proxying to:', redditUrl);

        const redditResponse = await fetch(redditUrl, {
          method: request.method,
          headers: {
            'User-Agent': 'CloudflareWorker/1.0 (by /u/bot)',
          },
        });

        const data = await redditResponse.text();
        
        return new Response(data, {
          status: redditResponse.status,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        return new Response(JSON.stringify({ 
          error: 'Failed to fetch from Reddit',
          message: error.message 
        }), {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        });
      }
    }

    // 기본 응답
    return new Response(JSON.stringify({ 
      message: 'Reddit API Proxy',
      usage: 'Use /api/reddit/r/[subreddit]/[sort].json',
      example: '/api/reddit/r/newtuber/new.json?limit=10'
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  },
};