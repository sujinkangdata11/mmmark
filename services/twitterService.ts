
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

    try {
      // 1. INIT - 미디어 업로드 초기화
      const initFormData = new FormData();
      initFormData.append('command', 'INIT');
      initFormData.append('total_bytes', file.size.toString());
      initFormData.append('media_type', file.type);

      const initResponse = await fetch(`${this.proxyUrl}/upload-media`, {
        method: 'POST',
        body: initFormData
      });

      if (!initResponse.ok) {
        const errorText = await initResponse.text();
        throw new Error(`미디어 업로드 초기화 실패: ${initResponse.status} - ${errorText}`);
      }

      const initData = await initResponse.json();
      const mediaId = initData.media_id_string;

      // 2. APPEND - 실제 파일 업로드
      const appendFormData = new FormData();
      appendFormData.append('command', 'APPEND');
      appendFormData.append('media_id', mediaId);
      appendFormData.append('segment_index', '0');
      appendFormData.append('media', file);

      const appendResponse = await fetch(`${this.proxyUrl}/upload-media`, {
        method: 'POST',
        body: appendFormData
      });

      if (!appendResponse.ok) {
        const errorText = await appendResponse.text();
        throw new Error(`미디어 업로드 실패: ${appendResponse.status} - ${errorText}`);
      }

      // 3. FINALIZE - 업로드 완료
      const finalizeFormData = new FormData();
      finalizeFormData.append('command', 'FINALIZE');
      finalizeFormData.append('media_id', mediaId);

      const finalizeResponse = await fetch(`${this.proxyUrl}/upload-media`, {
        method: 'POST',
        body: finalizeFormData
      });

      if (!finalizeResponse.ok) {
        const errorText = await finalizeResponse.text();
        throw new Error(`미디어 업로드 완료 실패: ${finalizeResponse.status} - ${errorText}`);
      }

      return mediaId;
    } catch (error) {
      console.error('Twitter 미디어 업로드 오류:', error);
      throw error;
    }
  }

  async createTweet(text: string, mediaIds?: string[]): Promise<TweetResponse> {
    if (!this.config) {
      throw new Error('Twitter API 키가 설정되지 않았습니다.');
    }

    try {
      const tweetData: any = {
        text: text
      };

      if (mediaIds && mediaIds.length > 0) {
        tweetData.media = {
          media_ids: mediaIds
        };
      }

      const response = await fetch(`${this.proxyUrl}/create-tweet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tweetData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`트윗 작성 실패: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Twitter 트윗 작성 오류:', error);
      throw error;
    }
  }

  async publishWithImage(text: string, imageFile: File): Promise<TweetResponse> {
    try {
      // 1. 이미지 업로드 (OAuth 1.0a)
      const mediaId = await this.uploadMedia(imageFile);
      
      // 2. 트윗 작성 (OAuth 2.0)
      return await this.createTweet(text, [mediaId]);
    } catch (error) {
      console.error('Twitter 이미지와 함께 게시 오류:', error);
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