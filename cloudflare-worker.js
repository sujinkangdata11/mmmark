// OAuth 1.0a 서명 생성 함수
async function generateOAuth1Signature(method, url, params, consumerSecret, tokenSecret) {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');

  const signatureBaseString = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(sortedParams)
  ].join('&');

  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  
  // 디버깅 로그 추가
  console.log('[OAUTH DEBUG] Signature Base String:', signatureBaseString);
  console.log('[OAUTH DEBUG] Signing Key (앞 10글자):', signingKey.substring(0, 10) + '...');
  
  const encoder = new TextEncoder();
  const keyData = encoder.encode(signingKey);
  const messageData = encoder.encode(signatureBaseString);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const base64Signature = btoa(String.fromCharCode(...new Uint8Array(signature)));
  
  console.log('[OAUTH DEBUG] 생성된 서명 (앞 10글자):', base64Signature.substring(0, 10) + '...');
  return base64Signature;
}

// OAuth 1.0a 헤더 생성
async function generateOAuth1Header(method, url, additionalParams, config) {
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const oauth = {
    oauth_consumer_key: config.consumerKey,
    oauth_token: config.accessToken,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: currentTimestamp.toString(),
    oauth_nonce: Array.from(crypto.getRandomValues(new Uint8Array(16)), 
      byte => byte.toString(16).padStart(2, '0')).join(''),
    oauth_version: '1.0'
  };

  // 타임스탬프 디버깅
  const currentTime = new Date();
  console.log('[OAUTH DEBUG] 현재 시간:', currentTime.toISOString());
  console.log('[OAUTH DEBUG] 타임스탬프:', currentTimestamp);
  console.log('[OAUTH DEBUG] 타임스탬프 변환:', new Date(currentTimestamp * 1000).toISOString());

  const allParams = { ...oauth, ...additionalParams };
  
  const signature = await generateOAuth1Signature(
    method,
    url,
    allParams,
    config.consumerSecret,
    config.accessTokenSecret
  );

  oauth.oauth_signature = signature;

  const authHeader = 'OAuth ' + Object.keys(oauth)
    .sort()
    .map(key => `${encodeURIComponent(key)}="${encodeURIComponent(oauth[key])}"`)
    .join(', ');

  console.log('[OAUTH DEBUG] 생성된 Authorization 헤더:', authHeader);
  return authHeader;
}

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

    // Twitter API 프록시
    if (path === '/upload-media') {
      try {
        // Twitter API 키 설정 (Secrets에서 가져오기)
        const config = {
          consumerKey: env.TWITTER_CONSUMER_KEY,
          consumerSecret: env.TWITTER_CONSUMER_SECRET,
          accessToken: env.TWITTER_ACCESS_TOKEN,
          accessTokenSecret: env.TWITTER_ACCESS_TOKEN_SECRET,
          bearerToken: env.TWITTER_BEARER_TOKEN
        };

        // 긴급 디버깅: 실제 env 객체 내용 확인
        console.log('[WORKER EMERGENCY DEBUG] env 객체 키 목록:', Object.keys(env));
        console.log('[WORKER EMERGENCY DEBUG] API 키 길이 확인:', {
          consumerKey: config.consumerKey?.length || 0,
          consumerSecret: config.consumerSecret?.length || 0,
          accessToken: config.accessToken?.length || 0,
          accessTokenSecret: config.accessTokenSecret?.length || 0
        });

        // 디버깅: 환경변수 로딩 상태 확인
        console.log('[WORKER DEBUG] 환경변수 상태:', {
          consumerKey: config.consumerKey ? '설정됨' : '미설정',
          consumerSecret: config.consumerSecret ? '설정됨' : '미설정',
          accessToken: config.accessToken ? '설정됨' : '미설정',
          accessTokenSecret: config.accessTokenSecret ? '설정됨' : '미설정',
          bearerToken: config.bearerToken ? '설정됨' : '미설정'
        });

        // 환경변수가 없으면 즉시 오류 반환
        if (!config.consumerKey || !config.consumerSecret || 
            !config.accessToken || !config.accessTokenSecret) {
          return new Response(JSON.stringify({ 
            error: 'Twitter API 환경변수가 설정되지 않았습니다.',
            missing: {
              consumerKey: !config.consumerKey,
              consumerSecret: !config.consumerSecret,
              accessToken: !config.accessToken,
              accessTokenSecret: !config.accessTokenSecret
            }
          }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const formData = await request.formData();
        const command = formData.get('command');
        
        if (command === 'INIT') {
          // 1. INIT 단계
          const initParams = {
            command: 'INIT',
            total_bytes: formData.get('total_bytes'),
            media_type: formData.get('media_type')
          };

          const authHeader = await generateOAuth1Header(
            'POST', 
            'https://upload.twitter.com/1.1/media/upload.json',
            initParams,
            config
          );

          const initFormData = new FormData();
          Object.entries(initParams).forEach(([key, value]) => {
            initFormData.append(key, value);
          });

          const initResponse = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
            method: 'POST',
            headers: { 'Authorization': authHeader },
            body: initFormData
          });

          const initData = await initResponse.json();
          return new Response(JSON.stringify(initData), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });

        } else if (command === 'APPEND') {
          // 2. APPEND 단계 - 파일 업로드에서는 media 파라미터를 서명에서 제외
          const appendParams = {
            command: 'APPEND',
            media_id: formData.get('media_id'),
            segment_index: formData.get('segment_index')
            // 주의: media 파일은 서명에 포함하지 않음
          };

          console.log('[OAUTH DEBUG] APPEND 파라미터 (서명용):', appendParams);

          const authHeader = await generateOAuth1Header(
            'POST',
            'https://upload.twitter.com/1.1/media/upload.json',
            appendParams,
            config
          );

          const appendFormData = new FormData();
          Object.entries(appendParams).forEach(([key, value]) => {
            appendFormData.append(key, value);
          });
          appendFormData.append('media', formData.get('media'));

          const appendResponse = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
            method: 'POST',
            headers: { 'Authorization': authHeader },
            body: appendFormData
          });

          return new Response(null, {
            status: appendResponse.status,
            headers: corsHeaders
          });

        } else if (command === 'FINALIZE') {
          // 3. FINALIZE 단계
          const finalizeParams = {
            command: 'FINALIZE',
            media_id: formData.get('media_id')
          };

          const authHeader = await generateOAuth1Header(
            'POST',
            'https://upload.twitter.com/1.1/media/upload.json',
            finalizeParams,
            config
          );

          const finalizeFormData = new FormData();
          Object.entries(finalizeParams).forEach(([key, value]) => {
            finalizeFormData.append(key, value);
          });

          const finalizeResponse = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
            method: 'POST',
            headers: { 'Authorization': authHeader },
            body: finalizeFormData
          });

          const finalizeData = await finalizeResponse.json();
          return new Response(JSON.stringify(finalizeData), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

      } catch (error) {
        console.error('Twitter Upload Error:', error);
        return new Response(JSON.stringify({ 
          error: error.message 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    if (path === '/create-tweet') {
      try {
        const config = {
          bearerToken: env.TWITTER_BEARER_TOKEN
        };
        
        const tweetData = await request.json();
        
        const tweetResponse = await fetch('https://api.x.com/2/tweets', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.bearerToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(tweetData)
        });

        const tweetResult = await tweetResponse.json();
        return new Response(JSON.stringify(tweetResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        console.error('Twitter Tweet Error:', error);
        return new Response(JSON.stringify({ 
          error: error.message 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // 기본 응답
    return new Response(JSON.stringify({ 
      message: 'Multi-API Proxy',
      apis: {
        reddit: 'Use /api/reddit/r/[subreddit]/[sort].json',
        twitter_upload: 'POST /upload-media with FormData',
        twitter_tweet: 'POST /create-tweet with JSON'
      },
      example: '/api/reddit/r/newtuber/new.json?limit=10'
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  },
};