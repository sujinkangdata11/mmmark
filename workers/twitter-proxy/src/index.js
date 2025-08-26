import { createHash } from 'crypto';

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
  
  return base64Signature;
}

// OAuth 1.0a 헤더 생성
async function generateOAuth1Header(method, url, additionalParams, config) {
  const oauth = {
    oauth_consumer_key: config.consumerKey,
    oauth_token: config.accessToken,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_nonce: Array.from(crypto.getRandomValues(new Uint8Array(16)), 
      byte => byte.toString(16).padStart(2, '0')).join(''),
    oauth_version: '1.0'
  };

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

  return authHeader;
}

export default {
  async fetch(request, env, ctx) {
    // CORS 헤더 설정
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Preflight 요청 처리
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    
    try {
      // Twitter API 키 설정
      const config = {
        consumerKey: env.TWITTER_CONSUMER_KEY,
        consumerSecret: env.TWITTER_CONSUMER_SECRET,
        accessToken: env.TWITTER_ACCESS_TOKEN,
        accessTokenSecret: env.TWITTER_ACCESS_TOKEN_SECRET,
        bearerToken: env.TWITTER_BEARER_TOKEN
      };

      if (url.pathname === '/upload-media') {
        // 미디어 업로드 프록시
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
          // 2. APPEND 단계
          const appendParams = {
            command: 'APPEND',
            media_id: formData.get('media_id'),
            segment_index: formData.get('segment_index')
          };

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

      } else if (url.pathname === '/create-tweet') {
        // 트윗 작성 프록시
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

      } else {
        return new Response('Not Found', { 
          status: 404, 
          headers: corsHeaders 
        });
      }

    } catch (error) {
      console.error('Twitter Proxy Error:', error);
      return new Response(JSON.stringify({ 
        error: error.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  },
};