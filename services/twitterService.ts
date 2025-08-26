
export interface TwitterConfig {
  // OAuth 1.0a (이미지 업로드용)
  consumerKey: string;
  consumerSecret: string;
  accessToken: string;
  accessTokenSecret: string;
  // OAuth 2.0 (트윗 작성용)
  bearerToken: string;
}

export interface MediaUploadResponse {
  media_id_string: string;
  media_id: number;
  size: number;
}

export interface TweetResponse {
  data: {
    id: string;
    text: string;
  };
}

class TwitterService {
  private config: TwitterConfig | null = null;
  private proxyUrl: string = 'https://marketing.anime-toon-7923.workers.dev';

  initialize(config: TwitterConfig) {
    this.config = config;
  }

  setProxyUrl(url: string) {
    this.proxyUrl = url;
  }

  private async generateOAuth1Signature(
    method: string,
    url: string,
    params: Record<string, string>,
    consumerSecret: string,
    tokenSecret: string
  ): Promise<string> {
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
    return btoa(String.fromCharCode(...new Uint8Array(signature)));
  }

  private async generateOAuth1Header(method: string, url: string, additionalParams: Record<string, string> = {}): Promise<string> {
    if (!this.config) {
      throw new Error('Twitter API 키가 설정되지 않았습니다.');
    }

    const oauth: Record<string, string> = {
      oauth_consumer_key: this.config.consumerKey,
      oauth_token: this.config.accessToken,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_nonce: Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join(''),
      oauth_version: '1.0'
    };

    const allParams = { ...oauth, ...additionalParams };
    
    const signature = await this.generateOAuth1Signature(
      method,
      url,
      allParams,
      this.config.consumerSecret,
      this.config.accessTokenSecret
    );

    oauth.oauth_signature = signature;

    const authHeader = 'OAuth ' + Object.keys(oauth)
      .sort()
      .map(key => `${encodeURIComponent(key)}="${encodeURIComponent(oauth[key])}"`)
      .join(', ');

    return authHeader;
  }

  async uploadMedia(file: File): Promise<string> {
    if (!this.config) {
      throw new Error('Twitter API 키가 설정되지 않았습니다.');
    }

    console.log('[TWITTER SERVICE] 미디어 업로드 시작:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      proxyUrl: this.proxyUrl
    });

    try {
      // 1. INIT - 미디어 업로드 초기화
      const initFormData = new FormData();
      initFormData.append('command', 'INIT');
      initFormData.append('total_bytes', file.size.toString());
      initFormData.append('media_type', file.type);

      console.log('[TWITTER SERVICE] INIT 요청 전송:', {
        url: `${this.proxyUrl}/upload-media`,
        command: 'INIT',
        total_bytes: file.size,
        media_type: file.type
      });

      const initResponse = await fetch(`${this.proxyUrl}/upload-media`, {
        method: 'POST',
        body: initFormData
      });

      console.log('[TWITTER SERVICE] INIT 응답:', {
        status: initResponse.status,
        statusText: initResponse.statusText,
        ok: initResponse.ok
      });

      if (!initResponse.ok) {
        const errorText = await initResponse.text();
        console.error('[TWITTER SERVICE] INIT 실패:', errorText);
        throw new Error(`미디어 업로드 초기화 실패: ${initResponse.status} - ${errorText}`);
      }

      const initData = await initResponse.json();
      console.log('[TWITTER SERVICE] INIT 성공:', initData);
      const mediaId = initData.media_id_string;

      // 2. APPEND - 실제 파일 업로드
      const appendFormData = new FormData();
      appendFormData.append('command', 'APPEND');
      appendFormData.append('media_id', mediaId);
      appendFormData.append('segment_index', '0');
      appendFormData.append('media', file);

      console.log('[TWITTER SERVICE] APPEND 요청 전송:', {
        url: `${this.proxyUrl}/upload-media`,
        command: 'APPEND',
        media_id: mediaId,
        segment_index: 0,
        mediaFileName: file.name
      });

      const appendResponse = await fetch(`${this.proxyUrl}/upload-media`, {
        method: 'POST',
        body: appendFormData
      });

      console.log('[TWITTER SERVICE] APPEND 응답:', {
        status: appendResponse.status,
        statusText: appendResponse.statusText,
        ok: appendResponse.ok
      });

      if (!appendResponse.ok) {
        const errorText = await appendResponse.text();
        console.error('[TWITTER SERVICE] APPEND 실패:', errorText);
        throw new Error(`미디어 업로드 실패: ${appendResponse.status} - ${errorText}`);
      }

      // 3. FINALIZE - 업로드 완료
      const finalizeFormData = new FormData();
      finalizeFormData.append('command', 'FINALIZE');
      finalizeFormData.append('media_id', mediaId);

      console.log('[TWITTER SERVICE] FINALIZE 요청 전송:', {
        url: `${this.proxyUrl}/upload-media`,
        command: 'FINALIZE',
        media_id: mediaId
      });

      const finalizeResponse = await fetch(`${this.proxyUrl}/upload-media`, {
        method: 'POST',
        body: finalizeFormData
      });

      console.log('[TWITTER SERVICE] FINALIZE 응답:', {
        status: finalizeResponse.status,
        statusText: finalizeResponse.statusText,
        ok: finalizeResponse.ok
      });

      if (!finalizeResponse.ok) {
        const errorText = await finalizeResponse.text();
        console.error('[TWITTER SERVICE] FINALIZE 실패:', errorText);
        throw new Error(`미디어 업로드 완료 실패: ${finalizeResponse.status} - ${errorText}`);
      }

      const finalizeData = await finalizeResponse.json();
      console.log('[TWITTER SERVICE] FINALIZE 성공:', finalizeData);
      console.log('[TWITTER SERVICE] 미디어 업로드 완료, mediaId:', mediaId);

      return mediaId;
    } catch (error) {
      console.error('[TWITTER SERVICE] 미디어 업로드 오류:', error);
      throw error;
    }
  }

  async createTweet(text: string, mediaIds?: string[]): Promise<TweetResponse> {
    if (!this.config) {
      throw new Error('Twitter API 키가 설정되지 않았습니다.');
    }

    console.log('[TWITTER SERVICE] 트윗 작성 시작:', {
      text: text.substring(0, 50) + '...',
      mediaIds,
      proxyUrl: this.proxyUrl
    });

    try {
      const tweetData: any = {
        text: text
      };

      if (mediaIds && mediaIds.length > 0) {
        tweetData.media = {
          media_ids: mediaIds
        };
      }

      console.log('[TWITTER SERVICE] 트윗 데이터:', tweetData);

      const response = await fetch(`${this.proxyUrl}/create-tweet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tweetData)
      });

      console.log('[TWITTER SERVICE] 트윗 응답:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[TWITTER SERVICE] 트윗 실패:', errorText);
        throw new Error(`트윗 작성 실패: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('[TWITTER SERVICE] 트윗 성공:', result);
      return result;
    } catch (error) {
      console.error('[TWITTER SERVICE] 트윗 작성 오류:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('[TWITTER SERVICE] Worker 연결 테스트 시작:', this.proxyUrl);
      
      const response = await fetch(this.proxyUrl, {
        method: 'GET'
      });
      
      console.log('[TWITTER SERVICE] Worker 연결 테스트 결과:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      if (response.ok) {
        const data = await response.text();
        console.log('[TWITTER SERVICE] Worker 응답 데이터:', data);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[TWITTER SERVICE] Worker 연결 실패:', error);
      return false;
    }
  }

  async publishWithImage(text: string, imageFile: File): Promise<TweetResponse> {
    console.log('[TWITTER SERVICE] 이미지와 함께 게시 시작');
    
    // 연결 테스트 먼저 수행
    const isConnected = await this.testConnection();
    if (!isConnected) {
      throw new Error('Cloudflare Worker에 연결할 수 없습니다.');
    }
    
    try {
      // 1. 이미지 업로드 (OAuth 1.0a)
      console.log('[TWITTER SERVICE] 1단계: 이미지 업로드 시작');
      const mediaId = await this.uploadMedia(imageFile);
      console.log('[TWITTER SERVICE] 1단계 완료: mediaId =', mediaId);
      
      // 2. 트윗 작성 (OAuth 2.0)
      console.log('[TWITTER SERVICE] 2단계: 트윗 작성 시작');
      const result = await this.createTweet(text, [mediaId]);
      console.log('[TWITTER SERVICE] 2단계 완료: 트윗 게시 성공');
      
      return result;
    } catch (error) {
      console.error('[TWITTER SERVICE] 이미지와 함께 게시 오류:', error);
      throw error;
    }
  }

  isConfigured(): boolean {
    return !!(this.config && 
      this.config.consumerKey && 
      this.config.consumerSecret && 
      this.config.accessToken && 
      this.config.accessTokenSecret && 
      this.config.bearerToken);
  }
}

export const twitterService = new TwitterService();