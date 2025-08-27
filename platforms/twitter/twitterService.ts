
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
  // 로컬 Flask 서버와 통신

  async createTweet(text: string, mediaIds?: string[]): Promise<TweetResponse> {
    console.log('[TWITTER SERVICE] 텍스트 전용 Python tweepy 트윗');
    console.log('=====================================');
    console.log('🚨 트윗할 텍스트:');
    console.log(text);
    console.log('=====================================');
    console.log('💡 터미널에서 다음 명령어를 실행하세요:');
    console.log('cd /Users/sujin/Desktop/ai-marketing-automation-hub');
    console.log(`source twitter_test/bin/activate && python3 post_tweet_with_image.py "${text.replace(/"/g, '\\"')}"`);
    console.log('=====================================');
    
    return {
      data: {
        id: Date.now().toString(),
        text: text
      }
    };
  }

  // 연결 테스트는 더 이상 필요 없음 (Python tweepy 사용)

  async publishWithImage(text: string, imageFile: File): Promise<TweetResponse> {
    console.log('[TWITTER SERVICE] Flask 서버로 자동 트위터 게시 시작');
    
    try {
      // Flask 서버 연결 확인
      console.log('[FLASK] 로컬 서버 연결 확인 중...');
      
      const healthResponse = await fetch('http://localhost:3001/health');
      if (!healthResponse.ok) {
        throw new Error('Flask 서버가 실행되지 않음');
      }
      
      console.log('[FLASK] ✅ 서버 연결 확인');
      
      // 이미지를 FormData에 추가
      const formData = new FormData();
      formData.append('text', text);
      formData.append('image', imageFile);
      
      console.log('[FLASK] 트위터 API 요청 전송 중...');
      
      // Flask 서버로 POST 요청
      const response = await fetch('http://localhost:3001/tweet', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('[FLASK] ✅ 트위터 게시 성공!');
        console.log(`[FLASK] Tweet ID: ${result.tweet_id}`);
        console.log(`[FLASK] URL: ${result.url}`);
        
        return {
          data: {
            id: result.tweet_id,
            text: text
          }
        };
      } else {
        throw new Error(`Flask 서버 오류: ${result.error}`);
      }
      
    } catch (flaskError) {
      console.warn('[FLASK] 서버 연결 실패, 기존 방식으로 전환:', flaskError);
      
      // Flask 서버가 안되면 기존 반자동 방식으로 폴백
      console.log('[TWITTER SERVICE] Python tweepy로 이미지와 함께 트윗 게시 (반자동)');
      
      const timestamp = Date.now();
      const filename = `tweet_image_${timestamp}.${imageFile.name.split('.').pop()}`;
      const imagePath = `/Users/sujin/Desktop/ai-marketing-automation-hub/${filename}`;
      
      const arrayBuffer = await imageFile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      console.log('=====================================');
      console.log('🚨 이미지와 함께 트윗할 내용:');
      console.log('텍스트:', text);
      console.log('이미지:', imageFile.name, '크기:', imageFile.size, 'bytes');
      console.log('=====================================');
      console.log('💡 다음 단계를 수행하세요:');
      console.log('1. 이미지를 다운로드하여 다음 위치에 저장:');
      console.log(`   ${imagePath}`);
      console.log('2. 터미널에서 다음 명령어 실행:');
      console.log('cd /Users/sujin/Desktop/ai-marketing-automation-hub');
      console.log(`source twitter_test/bin/activate && python3 post_tweet_with_image.py "${text.replace(/"/g, '\\"')}" "${filename}"`);
      console.log('=====================================');
      
      // 브라우저에서 이미지 다운로드 링크 생성
      const blob = new Blob([uint8Array], { type: imageFile.type });
      const url = URL.createObjectURL(blob);
      
      console.log('📥 이미지 다운로드 링크:');
      console.log('다음 링크를 클릭하여 이미지를 저장하세요:', url);
      
      // 자동 다운로드 트리거
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      console.log(`✅ 이미지 다운로드 시작됨: ${filename}`);
      
      return {
        data: {
          id: Date.now().toString(),
          text: text
        }
      };
    }
  }

  isConfigured(): boolean {
    // Python tweepy에서는 API 키가 스크립트에 하드코딩되어 있으므로 항상 true
    return true;
  }
}

export const twitterService = new TwitterService();