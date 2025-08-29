import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const RedditCallback: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let isProcessing = false; // 중복 처리 방지
    
    const handleRedditCallback = async () => {
      if (isProcessing) {
        console.log('⚠️ [CALLBACK] 이미 처리 중이므로 중복 실행 방지');
        return;
      }
      
      isProcessing = true;
      try {
        console.log('🚀 [CALLBACK] Reddit OAuth 콜백 처리 시작');
        console.log('🔍 [CALLBACK] 현재 URL:', location.search);
        
        const query = new URLSearchParams(location.search);
        const code = query.get('code');
        const state = query.get('state');
        
        console.log('📥 [CALLBACK] URL 파라미터 파싱:', {
          code: code ? code.substring(0, 20) + '...' : 'null',
          state: state ? state.substring(0, 10) + '...' : 'null'
        });
        
        // 상태 검증
        const savedState = sessionStorage.getItem('reddit_oauth_state');
        console.log('🔍 [CALLBACK] 상태 검증:', {
          receivedState: state ? state.substring(0, 10) + '...' : 'null',
          savedState: savedState ? savedState.substring(0, 10) + '...' : 'null',
          matches: state === savedState
        });
        
        if (state !== savedState) {
          console.error('❌ [CALLBACK] CSRF 상태값 불일치');
          throw new Error('잘못된 상태값입니다. CSRF 공격 가능성이 있습니다.');
        }
        
        if (!code) {
          console.error('❌ [CALLBACK] 인증 코드 없음');
          throw new Error('인증 코드를 받지 못했습니다.');
        }

        // 코드 재사용 방지 - 이미 처리된 코드인지 확인
        const processedCode = sessionStorage.getItem('reddit_processed_code');
        if (processedCode === code) {
          console.log('⚠️ [CALLBACK] 이미 처리된 코드이므로 중복 처리 방지');
          navigate('/?reddit_auth=duplicate');
          return;
        }
        
        // 현재 코드를 처리 중으로 표시
        sessionStorage.setItem('reddit_processed_code', code);

        console.log('✅ [CALLBACK] 인증 코드 받음:', code.substring(0, 20) + '...');
        
        // Express 서버를 통한 토큰 교환
        console.log('🔄 [CALLBACK] Express 서버로 토큰 교환 요청 중...');
        
        const serverUrl = `http://localhost:3003/login_reddit?code=${code}&state=${state}`;
        console.log('📤 [CALLBACK] 서버 요청 URL:', serverUrl);
        
        const response = await fetch(serverUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          }
        });

        console.log('📡 [CALLBACK] 서버 응답:', response.status, response.statusText);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ [CALLBACK] 서버 요청 실패:', response.status, response.statusText);
          console.error('❌ [CALLBACK] 에러 응답:', errorText);
          throw new Error(`서버 요청 실패: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('🎉 [CALLBACK] 서버에서 결과 받음:', {
          success: result.success,
          hasAccessToken: !!result.access_token,
          hasRefreshToken: !!result.refresh_token,
          tokenType: result.token_type,
          expiresIn: result.expires_in,
          scope: result.scope,
          user: result.user ? result.user.name : null
        });

        if (!result.success) {
          throw new Error(`토큰 교환 실패: ${result.error}`);
        }
        
        // 토큰을 로컬스토리지에 저장
        localStorage.setItem('reddit_access_token', result.access_token);
        localStorage.setItem('reddit_refresh_token', result.refresh_token);
        
        console.log('✅ [CALLBACK] Reddit 토큰 localStorage에 저장 완료');

        // 사용자 정보 저장
        if (result.user) {
          localStorage.setItem('reddit_username', result.user.name);
          console.log('👤 [CALLBACK] 로그인한 사용자:', result.user.name);
        }
        
        // 상태 정리
        sessionStorage.removeItem('reddit_oauth_state');
        sessionStorage.removeItem('reddit_processed_code');
        
        // 메인 페이지로 리다이렉트
        navigate('/?reddit_auth=success');
        
      } catch (error) {
        console.error('❌ Reddit OAuth 콜백 처리 실패:', error);
        alert(`로그인 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        navigate('/?reddit_auth=error');
      } finally {
        isProcessing = false;
      }
    };

    handleRedditCallback();
  }, [location.search, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Reddit 로그인 처리 중...</h2>
        <p className="text-gray-600">잠시만 기다려주세요.</p>
      </div>
    </div>
  );
};

export default RedditCallback;