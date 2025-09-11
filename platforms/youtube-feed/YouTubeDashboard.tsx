import React, { useState, useEffect } from 'react';
import { AutomationConfig } from '../../types';
import { generateText } from '../../shared/services/geminiService';
import PromptEditor from '../../shared/components/common/PromptEditor';
import AutomationControls from '../../shared/components/common/AutomationControls';
import LogDisplay from '../../shared/components/common/LogDisplay';
import { usePrompts, useLogger, useAutomation, useApiKeys } from '../../shared/hooks';
import YouTubeApiService, { YouTubeVideo, YouTubeSearchResult, YouTubeChannelInfo, YouTubeVideoDetails, YouTubeComment } from './youtubeApiService';

// Google Identity Services 타입 선언
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
          }) => {
            requestAccessToken: (config?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

interface YouTubeDashboardProps {
  config: AutomationConfig;
  onBack: () => void;
  hideBackButton?: boolean;
}

const YouTubeDashboard: React.FC<YouTubeDashboardProps> = ({ config, onBack, hideBackButton }) => {
  const { getPrompt, updatePrompt, resetPrompt, interpolatePrompt } = usePrompts('youtube');
  const { logs, addLog, clearLogs } = useLogger();
  const { isAutomating, startAutomation, stopAutomation, isRunning } = useAutomation();
  const { getApiKey } = useApiKeys(['youtube']);
  
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<YouTubeSearchResult | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const [sortOrder, setSortOrder] = useState<'low' | 'high'>('low'); // 조회수 정렬 순서
  const [durationFilter, setDurationFilter] = useState<'all' | 'shorts' | 'long'>('all'); // 영상 길이 필터
  const [dateFilter, setDateFilter] = useState<'all' | '3days' | '7days' | '10days' | '30days'>('all'); // 업로드 날짜 필터
  const [sortType, setSortType] = useState<'viewCount' | 'duration'>('viewCount'); // 정렬 기준
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const [channelInfo, setChannelInfo] = useState<YouTubeChannelInfo | null>(null);
  const [videoDetails, setVideoDetails] = useState<YouTubeVideoDetails | null>(null);
  const [comments, setComments] = useState<YouTubeComment[]>([]);
  const [isLoadingChannelInfo, setIsLoadingChannelInfo] = useState(false);
  const [isLoadingVideoDetails, setIsLoadingVideoDetails] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isWritingComment, setIsWritingComment] = useState(false);
  const [generatedComment, setGeneratedComment] = useState<string>('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [commentPosted, setCommentPosted] = useState(false); // 댓글 게시 성공 상태

  const VIDEOS_PER_PAGE = 10;

  // 기본 프롬프트 설정 (강제 업데이트)
  useEffect(() => {
    updatePrompt('youtube-comment', `이 유튜버의 타이틀과 전체 채널의 정보를 파악해서 "AutoVid"사이트를 홍보에 적합한 댓글을 아웃풋으로 출력해주세요. 

AutoVid는 단 한번의 클릭으로 자동 생성되는 유튜브 쇼핑쇼츠 서비스 입니다. 어필리에이트에 강력한 장점을 갖고있어, 영상을 자체적으로 만들고 연관된 아마존 상품을 링크로 소개해줍니다. 또한 현재 바이럴되는 쇼츠들을 토대로 쇼핑쇼츠를 제작하여 조회수도 보장됩니다. 만약 유튜브로 수익화를 원하는 분이나, 온라인으로 홍보하고싶은 자영업자가 있다면 AutoVid를 추천해주세요. 특히 쇼츠로 부수입,돈을 벌고싶거나 매일 자동 생성된다는 성실함이 필요한분들에게 추천해주세요.

## 댓글을 자연스럽게 써주세요. 너무 인위적으로 홍보하면 반감이 생기니, 자연스럽게, 툭 던지듯 말해주세요. 댓글내용은 200자 이하로하고 유튜브에서 흔히 볼수 있는 문체와 정중함이 살짝 곁들여진 내용으로 작성하세요.`);
  }, []);

  // YouTube 검색 함수
  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      addLog('검색 키워드를 입력해주세요.', 'error');
      return;
    }

    setIsSearching(true);
    setCurrentPage(1);
    
    try {
      addLog(`'${searchKeyword}' 검색 중... (조회수 낮은 순으로 정렬)`, 'info');
      
      const youtubeApiKey = getApiKey('youtube');
      const youtubeService = new YouTubeApiService(youtubeApiKey || '');
      
      let result: YouTubeSearchResult;
      
      if (youtubeApiKey) {
        result = await youtubeService.searchVideos({
          keyword: searchKeyword,
          maxResults: 50, // 더 많은 결과를 가져와서 조회수 낮은 순으로 정렬
          order: 'date' // 최신순으로 먼저 가져온 후 클라이언트에서 조회수 정렬
        });
      } else {
        addLog('YouTube API 키가 없어서 Mock 데이터를 사용합니다.', 'info');
        result = await youtubeService.searchVideosMock({
          keyword: searchKeyword,
          maxResults: 50,
          order: 'date'
        });
      }

      setSearchResults(result);
      addLog(`${result.videos.length}개 영상을 찾았습니다. (${sortOrder === 'low' ? '조회수 낮은 순' : '조회수 높은 순'}으로 정렬)`, 'success');
      
    } catch (error) {
      addLog(`검색 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`, 'error');
    } finally {
      setIsSearching(false);
    }
  };

  // 영상 필터링 및 정렬
  const filterAndSortVideos = (videos: YouTubeVideo[]) => {
    let filtered = videos;
    
    // 1. 영상 길이 필터링
    if (durationFilter === 'shorts') {
      // 1분(60초) 이하 쇼츠
      filtered = filtered.filter(video => video.duration && video.duration <= 60);
    } else if (durationFilter === 'long') {
      // 5분(300초) 이상 롱폼
      filtered = filtered.filter(video => video.duration && video.duration >= 300);
    }

    // 2. 업로드 날짜 필터링
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDays = {
        '3days': 3,
        '7days': 7,
        '10days': 10,
        '30days': 30
      }[dateFilter];

      if (filterDays) {
        const cutoffDate = new Date(now.getTime() - (filterDays * 24 * 60 * 60 * 1000));
        filtered = filtered.filter(video => new Date(video.publishedAt) >= cutoffDate);
      }
    }

    // 3. 정렬
    return filtered.sort((a, b) => {
      if (sortType === 'viewCount') {
        return sortOrder === 'low' ? a.viewCount - b.viewCount : b.viewCount - a.viewCount;
      } else if (sortType === 'duration') {
        const aDuration = a.duration || 0;
        const bDuration = b.duration || 0;
        return sortOrder === 'low' ? aDuration - bDuration : bDuration - aDuration;
      }
      return 0;
    });
  };

  const sortedVideos = searchResults ? filterAndSortVideos(searchResults.videos) : [];
  
  const totalPages = sortedVideos.length > 0 ? Math.ceil(sortedVideos.length / VIDEOS_PER_PAGE) : 0;
  const currentVideos = sortedVideos.slice(
    (currentPage - 1) * VIDEOS_PER_PAGE, 
    currentPage * VIDEOS_PER_PAGE
  );

  // 페이지 변경
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 비디오 선택
  const handleVideoSelect = (video: YouTubeVideo) => {
    setSelectedVideo(video);
    setChannelInfo(null); // 기존 데이터 초기화
    setVideoDetails(null);
    setComments([]);
    setGeneratedComment(''); // 생성된 댓글 초기화
    setCommentPosted(false); // 댓글 게시 상태 초기화
    addLog(`"${video.title}" 영상을 선택했습니다.`, 'info');
  };

  // 모든 정보 가져오기 (채널 + 비디오 상세 + 댓글)
  const handleGetAllInfo = async () => {
    if (!selectedVideo) {
      addLog('먼저 영상을 선택해주세요.', 'error');
      return;
    }

    setIsLoadingChannelInfo(true);
    setIsLoadingVideoDetails(true);
    setIsLoadingComments(true);
    
    const youtubeApiKey = getApiKey('youtube');
    const youtubeService = new YouTubeApiService(youtubeApiKey || '');
    
    try {
      addLog(`"${selectedVideo.title}" 영상의 모든 정보를 가져오는 중...`, 'info');
      
      // 병렬로 모든 데이터 요청
      const promises = [];
      
      // 1. 채널 정보
      if (youtubeApiKey) {
        promises.push(youtubeService.getChannelInfo(selectedVideo.channelId));
      } else {
        promises.push(youtubeService.getChannelInfoMock(selectedVideo.channelId));
      }
      
      // 2. 비디오 상세 정보
      if (youtubeApiKey) {
        promises.push(youtubeService.getVideoDetails(selectedVideo.id));
      } else {
        promises.push(youtubeService.getVideoDetailsMock(selectedVideo.id));
      }
      
      // 3. 댓글
      if (youtubeApiKey) {
        promises.push(youtubeService.getVideoComments(selectedVideo.id, 10));
      } else {
        promises.push(youtubeService.getVideoCommentsMock(selectedVideo.id, 10));
      }

      if (!youtubeApiKey) {
        addLog('YouTube API 키가 없어서 Mock 데이터를 사용합니다.', 'info');
      }

      const [channelData, videoData, commentsData] = await Promise.all(promises);

      setChannelInfo(channelData as YouTubeChannelInfo);
      setVideoDetails(videoData as YouTubeVideoDetails);
      setComments(commentsData as YouTubeComment[]);
      
      addLog('모든 정보를 성공적으로 가져왔습니다!', 'success');
      
    } catch (error) {
      addLog(`정보 가져오기 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`, 'error');
    } finally {
      setIsLoadingChannelInfo(false);
      setIsLoadingVideoDetails(false);
      setIsLoadingComments(false);
    }
  };

  // 댓글 작성하기
  const handleWriteComment = async () => {
    if (!selectedVideo || !channelInfo || !videoDetails) {
      addLog('영상 선택과 정보 수집이 필요합니다.', 'error');
      return;
    }

    setIsWritingComment(true);
    
    try {
      addLog('AI가 댓글을 작성 중입니다...', 'generating');
      
      // 사용자 편집 프롬프트를 interpolate하여 사용
      const finalCommentPrompt = interpolatePrompt('feed03-youtube-comment', {
        VIDEO_TITLE: videoDetails.title,
        VIDEO_DESCRIPTION: videoDetails.description.substring(0, 300),
        VIDEO_TAGS: videoDetails.tags?.join(', ') || '없음',
        CHANNEL_NAME: channelInfo.title,
        SUBSCRIBER_COUNT: channelInfo.subscriberCount.toLocaleString(),
        TOTAL_VIEW_COUNT: channelInfo.viewCount.toLocaleString(),
        UPLOAD_FREQUENCY: channelInfo.uploadFrequency,
        AVERAGE_VIEWS: channelInfo.averageViews.toLocaleString()
      });

      const geminiApiKey = getApiKey('gemini');
      if (!geminiApiKey) {
        addLog('Gemini API 키가 설정되지 않았습니다.', 'error');
        return;
      }

      const comment = await generateText(finalCommentPrompt, undefined, geminiApiKey);
      setGeneratedComment(comment);
      addLog('댓글이 성공적으로 생성되었습니다!', 'success');
      
    } catch (error) {
      addLog(`댓글 생성 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`, 'error');
    } finally {
      setIsWritingComment(false);
    }
  };

  // 토큰으로 댓글 게시하기
  const postCommentWithToken = async (accessToken: string) => {
    try {
      addLog('Access Token을 획득했습니다. 댓글을 게시하는 중...', 'info');
      
      // 실제 YouTube API로 댓글 게시
      console.log('📹 [DEBUG] YouTube API 댓글 게시 시도 중...');
      console.log('📹 [DEBUG] videoId:', selectedVideo?.id);
      console.log('📹 [DEBUG] comment:', generatedComment.substring(0, 50) + '...');
      
      const response = await fetch('https://www.googleapis.com/youtube/v3/commentThreads?part=snippet', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          snippet: {
            videoId: selectedVideo?.id,
            topLevelComment: {
              snippet: {
                textOriginal: generatedComment
              }
            }
          }
        })
      });
      
      console.log('📡 [DEBUG] YouTube API 응답:', response.status, response.statusText);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          if (errorData.error) {
            const error = errorData.error;
            if (error.code === 403) {
              if (error.message?.includes('commentsDisabled')) {
                errorMessage = '이 영상은 댓글이 비활성화되어 있습니다.';
              } else if (error.message?.includes('quotaExceeded')) {
                errorMessage = 'YouTube API 할당량이 초과되었습니다. 잠시 후 다시 시도해주세요.';
              } else {
                errorMessage = `권한 오류: ${error.message}`;
              }
            } else if (error.code === 400) {
              errorMessage = `잘못된 요청: ${error.message}`;
            } else {
              errorMessage = error.message || errorMessage;
            }
          }
        } catch (parseError) {
          // JSON 파싱 실패 시 기본 메시지 사용
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      console.log('🎊 [DEBUG] 댓글 게시 완료!', result);
      addLog('댓글이 성공적으로 게시되었습니다!', 'success');
      addLog(`게시된 댓글: "${generatedComment.substring(0, 50)}..."`, 'info');
      addLog(`영상 링크: ${selectedVideo?.url}`, 'info');
      
      // 댓글 게시 성공 상태 설정
      setCommentPosted(true);
      
    } catch (error) {
      console.log('💥 [DEBUG] 댓글 게시 오류:', error);
      addLog(`댓글 게시 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`, 'error');
    } finally {
      console.log('🏁 [DEBUG] 댓글 게시 프로세스 완료 - 로딩 상태 해제');
      setIsPostingComment(false);
    }
  };

  // 실제 댓글 게시하기
  const handlePostComment = async () => {
    console.log('🚀 [DEBUG] 실제 댓글달기 시작!');
    console.log('[DEBUG] selectedVideo:', selectedVideo);
    console.log('[DEBUG] generatedComment:', generatedComment);
    
    if (!selectedVideo) {
      addLog('먼저 영상을 선택해주세요. (2번 카드에서 영상을 클릭하세요)', 'error');
      return;
    }

    if (!generatedComment.trim()) {
      addLog('댓글 내용이 필요합니다. (3번 카드에서 댓글을 생성해주세요)', 'error');
      return;
    }

    if (generatedComment.length > 10000) {
      addLog('댓글이 너무 깁니다. (최대 10,000자)', 'error');
      return;
    }

    const googleClientId = getApiKey('googleDriveClientId');
    const youtubeApiKey = getApiKey('youtube');
    
    if (!googleClientId) {
      addLog('Google Client ID가 설정되지 않았습니다. 사이드바에서 설정해주세요.', 'error');
      return;
    }

    console.log('✅ [DEBUG] 유효성 검사 통과 - 댓글 게시 시작');
    setIsPostingComment(true);
    
    try {
      addLog(`"${selectedVideo.title}" 영상에 댓글을 게시하는 중...`, 'info');
      
      // Google Drive Service와 동일한 방식 사용 (Implicit Flow)
      console.log('🔐 [DEBUG] Google OAuth 2.0 인증 시작 (Implicit Flow)');
      addLog('Google 계정 인증을 시작합니다...', 'info');

      // Google OAuth2 인증 URL 생성 (Google Drive와 동일한 방식)
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(googleClientId)}&` +
        `redirect_uri=${encodeURIComponent(window.location.origin)}&` +
        `response_type=token&` +
        `scope=${encodeURIComponent('https://www.googleapis.com/auth/youtube.force-ssl')}&` +
        `access_type=online&` +
        `prompt=consent`;

      console.log('🌐 [DEBUG] 인증 URL 생성:', authUrl);
      console.log('🔑 [DEBUG] redirect_uri:', window.location.origin);

      // 새 창에서 인증 진행
      console.log('🪟 [DEBUG] 인증 창 열기...');
      addLog('Google 로그인 창을 열고 있습니다. YouTube 댓글을 달 계정을 선택해주세요.', 'info');
      const authWindow = window.open(authUrl, 'youtubeAuth', 'width=500,height=600');
      
      const authResult = await new Promise((resolve, reject) => {
        const checkClosed = setInterval(() => {
          if (authWindow?.closed) {
            clearInterval(checkClosed);
            reject(new Error('인증이 취소되었습니다.'));
          }
          
          // 팝업 창의 URL을 확인하여 토큰 추출
          try {
            const currentUrl = authWindow?.location.href;
            console.log('🔍 [DEBUG] 현재 URL 확인 중...');
            if (currentUrl && currentUrl.includes('access_token=')) {
              console.log('✅ [DEBUG] Access Token 발견!');
              const hashParams = new URLSearchParams(currentUrl.split('#')[1]);
              const accessToken = hashParams.get('access_token');
              
              if (accessToken) {
                console.log('🎉 [DEBUG] Google 로그인 완료! Access Token 획득');
                clearInterval(checkClosed);
                authWindow?.close();
                resolve(accessToken);
              }
            }
          } catch (error) {
            // CORS 오류는 무시 (아직 리디렉션되지 않은 상태)
          }
        }, 500);
      });

      console.log('✅ [DEBUG] 인증 완료, 댓글 게시 진행...');
      addLog('인증이 완료되었습니다. 댓글을 게시하는 중...', 'info');
      
      // 토큰으로 댓글 게시
      await postCommentWithToken(authResult as string);
      
    } catch (error) {
      console.log('💥 [DEBUG] 초기화 오류:', error);
      addLog(`초기화 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`, 'error');
      setIsPostingComment(false);
    }
  };

  // Discord 알림 보내기
  const handleSendDiscordNotification = async () => {
    const webhookUrl = getApiKey('discordWebhook');
    
    if (!webhookUrl) {
      addLog('Discord Webhook URL이 설정되지 않았습니다. 사이드바에서 설정해주세요.', 'error');
      return;
    }

    if (!selectedVideo || !generatedComment) {
      addLog('영상과 댓글 정보가 필요합니다.', 'error');
      return;
    }

    try {
      addLog('Discord로 알림을 보내는 중...', 'info');

      // 메인 Embed
      const mainEmbed = {
        title: "🎯 YouTube 마케팅 자동화 완료!",
        description: `AutoVid 홍보 댓글이 성공적으로 게시되었습니다.`,
        color: 0xff0000, // YouTube 빨간색
        fields: [
          {
            name: "📊 게시 정보",
            value: `YouTube 댓글 **1개** 작성 완료`,
            inline: true
          },
          {
            name: "⏰ 완료 시간",
            value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
            inline: true
          }
        ],
        thumbnail: {
          url: "https://cdn-icons-png.flaticon.com/512/174/174883.png" // YouTube 아이콘
        },
        timestamp: new Date().toISOString(),
        footer: {
          text: "AI Marketing Automation Hub",
          icon_url: "https://cdn-icons-png.flaticon.com/512/2099/2099058.png"
        }
      };

      // 댓글 상세 Embed
      const commentEmbed = {
        title: `YouTube 댓글 게시 완료`,
        description: `\`\`\`${generatedComment.substring(0, 300)}${generatedComment.length > 300 ? '...' : ''}\`\`\``,
        color: 0x5865f2, // Discord 블루
        fields: [
          {
            name: "🎬 영상 제목",
            value: selectedVideo.title.substring(0, 100) + (selectedVideo.title.length > 100 ? '...' : ''),
            inline: false
          },
          {
            name: "📺 채널명",
            value: selectedVideo.channelName,
            inline: true
          },
          {
            name: "👁️ 조회수",
            value: selectedVideo.viewCount.toLocaleString(),
            inline: true
          },
          {
            name: "🔗 YouTube 링크",
            value: `[영상 보기](${selectedVideo.url})`,
            inline: false
          },
          {
            name: "📏 댓글 길이",
            value: `${generatedComment.length}자`,
            inline: true
          }
        ]
      };

      const payload = {
        content: null,
        embeds: [mainEmbed, commentEmbed]
      };

      console.log('🚀 Discord로 메시지 전송 중...', payload);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        addLog('✅ Discord로 알림이 성공적으로 전송되었습니다!', 'success');
      } else {
        const errorText = await response.text();
        throw new Error(`Discord API 에러: ${response.status} - ${errorText}`);
      }
      
    } catch (error) {
      console.error('❌ Discord 알림 전송 실패:', error);
      addLog(`Discord 알림 전송 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`, 'error');
    }
  };


  const cards = [
    {
      id: 'logs',
      title: '로그보기',
      content: (
        <div className="space-y-4">
          <LogDisplay logs={logs} onClear={clearLogs} />
        </div>
      )
    },
    {
      id: 'target-setup',
      title: '타겟팅 설정',
      content: (
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">검색 키워드</label>
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="예: 다이어트 음식, 운동 방법"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="self-end">
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchKeyword.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isSearching ? '검색중...' : '검색하기'}
              </button>
            </div>
          </div>
          
          {/* 영상 길이 필터 */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">영상 길이:</label>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setDurationFilter('all');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  durationFilter === 'all' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => {
                  setDurationFilter('shorts');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  durationFilter === 'shorts' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                1분이하 쇼츠
              </button>
              <button
                onClick={() => {
                  setDurationFilter('long');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  durationFilter === 'long' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                5분이상 롱폼
              </button>
            </div>
          </div>

          {/* 업로드 날짜 필터 */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">업로드 날짜:</label>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setDateFilter('all');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  dateFilter === 'all' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => {
                  setDateFilter('3days');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  dateFilter === '3days' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                3일 이내
              </button>
              <button
                onClick={() => {
                  setDateFilter('7days');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  dateFilter === '7days' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                7일 이내
              </button>
              <button
                onClick={() => {
                  setDateFilter('10days');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  dateFilter === '10days' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                10일 이내
              </button>
              <button
                onClick={() => {
                  setDateFilter('30days');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  dateFilter === '30days' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                한달 이내
              </button>
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            타겟 키워드로 YouTube 영상을 검색하고 다양한 필터로 원하는 영상에 댓글을 달아보세요.
          </div>

          {/* 검색 결과 */}
          {searchResults && (
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                  <h4 className="text-sm font-medium text-gray-800">
                    검색 결과: {sortedVideos.length}개
                    {searchResults.videos.length !== sortedVideos.length && (
                      <span className="text-gray-500"> (전체 {searchResults.videos.length}개 중 필터됨)</span>
                    )}
                  </h4>
                  
                  {/* 정렬 드롭다운 */}
                  <select
                    value={`${sortType}-${sortOrder}`}
                    onChange={(e) => {
                      const [newSortType, newSortOrder] = e.target.value.split('-') as ['viewCount' | 'duration', 'low' | 'high'];
                      setSortType(newSortType);
                      setSortOrder(newSortOrder);
                      setCurrentPage(1);
                    }}
                    className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                  >
                    <option value="viewCount-low">조회수 적은순</option>
                    <option value="viewCount-high">조회수 많은순</option>
                    <option value="duration-low">영상길이 짧은순</option>
                    <option value="duration-high">영상길이 긴순</option>
                  </select>
                </div>
                <div className="text-xs text-gray-500">
                  페이지 {currentPage} / {totalPages}
                </div>
              </div>
              
              {/* 비디오 목록 */}
              <div className="space-y-2 mb-4">
                {currentVideos.map((video, index) => (
                  <div 
                    key={video.id} 
                    className={`p-3 rounded border text-xs cursor-pointer transition-colors ${
                      selectedVideo?.id === video.id 
                        ? 'bg-blue-50 border-blue-300' 
                        : 'bg-white hover:bg-gray-50'
                    }`}
                    onClick={() => handleVideoSelect(video)}
                  >
                    <div className="flex gap-3">
                      <img 
                        src={video.thumbnail} 
                        alt={video.title}
                        className="w-16 h-12 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-800 line-clamp-2 mb-1">
                          {video.title}
                        </div>
                        <div className="text-gray-600 mb-1">
                          {video.channelName}
                        </div>
                        <div className="flex gap-4 text-gray-500">
                          <span>조회수 {video.viewCount.toLocaleString()}</span>
                          {video.duration && (
                            <span>
                              길이 {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                              {video.duration <= 60 ? ' 📱' : video.duration >= 300 ? ' 🎬' : ' 📺'}
                            </span>
                          )}
                          <span>
                            {(() => {
                              const publishedDate = new Date(video.publishedAt);
                              const now = new Date();
                              const diffDays = Math.floor((now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60 * 24));
                              
                              if (diffDays === 0) return '오늘 업로드';
                              if (diffDays === 1) return '1일 전';
                              if (diffDays <= 3) return `${diffDays}일 전 🔥`;
                              if (diffDays <= 7) return `${diffDays}일 전 ⚡`;
                              if (diffDays <= 30) return `${diffDays}일 전`;
                              return publishedDate.toLocaleDateString();
                            })()}
                          </span>
                        </div>
                      </div>
                      {selectedVideo?.id === video.id && (
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2">
                  <button
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-2 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ←
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const startPage = Math.max(1, currentPage - 2);
                    const pageNum = startPage + i;
                    
                    if (pageNum > totalPages) return null;
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-1 text-sm rounded ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'border hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )
    },
    {
      id: 'channel-info',
      title: '채널 정보 조회',
      content: (
        <div className="space-y-4">
          {selectedVideo ? (
            <div className="space-y-3">
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm font-medium text-gray-700">선택된 영상</div>
                  <a 
                    href={selectedVideo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                  >
                    🔗 링크
                  </a>
                </div>
                <div className="flex gap-3">
                  <img 
                    src={selectedVideo.thumbnail} 
                    alt={selectedVideo.title}
                    className="w-12 h-9 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-800 line-clamp-2 mb-1">
                      {selectedVideo.title}
                    </div>
                    <div className="text-xs text-gray-600">
                      {selectedVideo.channelName}
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleGetAllInfo}
                disabled={isLoadingChannelInfo || isLoadingVideoDetails || isLoadingComments}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {(isLoadingChannelInfo || isLoadingVideoDetails || isLoadingComments) ? '정보 가져오는 중...' : '모든 정보 갖고오기'}
              </button>

              {(channelInfo || videoDetails || comments.length > 0) && (
                <div className="space-y-4">
                  {/* 채널 정보 */}
                  {channelInfo && (
                    <div className="bg-blue-50 p-4 rounded-md">
                      <h4 className="text-sm font-medium text-blue-800 mb-3">📺 채널 정보</h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-600">채널명:</span>
                          <span className="font-medium text-gray-800">{channelInfo.title}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">구독자수:</span>
                          <span className="font-medium text-gray-800">{channelInfo.subscriberCount.toLocaleString()}명</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">총 조회수:</span>
                          <span className="font-medium text-gray-800">{channelInfo.viewCount.toLocaleString()}회</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">영상 개수:</span>
                          <span className="font-medium text-gray-800">{channelInfo.videoCount}개</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">업로드 빈도:</span>
                          <span className="font-medium text-gray-800">{channelInfo.uploadFrequency}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">평균 조회수:</span>
                          <span className="font-medium text-gray-800">{channelInfo.averageViews.toLocaleString()}회</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 비디오 상세 정보 */}
                  {videoDetails && (
                    <div className="bg-green-50 p-4 rounded-md">
                      <h4 className="text-sm font-medium text-green-800 mb-3">🎥 영상 정보</h4>
                      <div className="space-y-3 text-xs">
                        <div>
                          <span className="text-gray-600 block mb-1">제목:</span>
                          <span className="font-medium text-gray-800">{videoDetails.title}</span>
                        </div>
                        
                        {videoDetails.tags && videoDetails.tags.length > 0 && (
                          <div>
                            <span className="text-gray-600 block mb-1">태그:</span>
                            <div className="flex flex-wrap gap-1">
                              {videoDetails.tags.slice(0, 8).map((tag, index) => (
                                <span key={index} className="px-2 py-1 bg-green-200 text-green-800 rounded-full text-xs">
                                  #{tag}
                                </span>
                              ))}
                              {videoDetails.tags.length > 8 && (
                                <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded-full text-xs">
                                  +{videoDetails.tags.length - 8}개 더
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex justify-between">
                            <span className="text-gray-600">좋아요:</span>
                            <span className="font-medium text-gray-800">{videoDetails.likeCount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">댓글 수:</span>
                            <span className="font-medium text-gray-800">{videoDetails.commentCount.toLocaleString()}</span>
                          </div>
                        </div>

                        <div>
                          <span className="text-gray-600 block mb-1">설명:</span>
                          <div className="bg-white p-2 rounded border max-h-20 overflow-y-auto">
                            <p className="text-gray-700 text-xs whitespace-pre-wrap">
                              {videoDetails.description.substring(0, 300)}
                              {videoDetails.description.length > 300 && '...'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 댓글 */}
                  {comments.length > 0 && (
                    <div className="bg-orange-50 p-4 rounded-md">
                      <h4 className="text-sm font-medium text-orange-800 mb-3">💬 댓글 ({comments.length}개)</h4>
                      <div className="space-y-3 max-h-40 overflow-y-auto">
                        {comments.map((comment, index) => (
                          <div key={comment.id} className="bg-white p-2 rounded border">
                            <div className="flex items-start gap-2">
                              <img 
                                src={comment.authorProfileImageUrl} 
                                alt={comment.authorDisplayName}
                                className="w-6 h-6 rounded-full"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-medium text-gray-800">
                                    {comment.authorDisplayName}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    👍 {comment.likeCount}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-700">
                                  {comment.textOriginal.substring(0, 100)}
                                  {comment.textOriginal.length > 100 && '...'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <div className="text-sm">먼저 영상을 선택해주세요.</div>
              <div className="text-xs mt-1">검색 결과에서 원하는 영상을 클릭하세요.</div>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'comment-writing',
      title: '이 영상에 댓글달기',
      content: (
        <div className="space-y-4">
          <div className="space-y-4">
            {selectedVideo && (
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm font-medium text-gray-700">선택된 영상</div>
                  <a 
                    href={selectedVideo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                  >
                    🔗 링크
                  </a>
                </div>
                <div className="flex gap-2">
                  <img 
                    src={selectedVideo.thumbnail} 
                    alt={selectedVideo.title}
                    className="w-10 h-8 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-800 line-clamp-2">
                      {selectedVideo.title}
                    </div>
                    <div className="text-xs text-gray-600">
                      {selectedVideo.channelName}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {getPrompt('feed03-youtube-comment') && (
              <PromptEditor
                prompt={getPrompt('feed03-youtube-comment')!}
                value={getPrompt('feed03-youtube-comment')!.template}
                onChange={(value) => updatePrompt('feed03-youtube-comment', value)}
                onReset={() => resetPrompt('feed03-youtube-comment')}
                feedType="youtube"
              />
            )}
              
            <button
              onClick={() => handleWriteComment()}
              disabled={!selectedVideo || !channelInfo || !videoDetails || isWritingComment}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isWritingComment ? '댓글 작성중...' : '댓글 작성하기'}
            </button>

            {!selectedVideo ? (
              <div className="text-xs text-gray-500 text-center">
                먼저 1번 카드에서 영상을 선택해주세요.
              </div>
            ) : !channelInfo || !videoDetails ? (
              <div className="text-xs text-gray-500 text-center">
                먼저 2번 카드에서 "모든 정보 갖고오기"를 클릭해주세요.
              </div>
            ) : null}

            {generatedComment && (
              <div className="bg-green-50 p-3 rounded-md">
                <h5 className="text-sm font-medium text-green-800 mb-2">✅ 생성된 댓글</h5>
                <textarea
                  ref={(textarea) => {
                    if (textarea) {
                      textarea.style.height = 'auto';
                      textarea.style.height = textarea.scrollHeight + 'px';
                    }
                  }}
                  value={generatedComment}
                  onChange={(e) => {
                    setGeneratedComment(e.target.value);
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = target.scrollHeight + 'px';
                  }}
                  className="w-full p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-green-500 text-sm overflow-hidden"
                  style={{ 
                    minHeight: '80px'
                  }}
                  placeholder="생성된 댓글이 여기에 표시됩니다..."
                />
                <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                  <span>편집 가능합니다</span>
                  <span>{generatedComment.length}/200자</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      id: 'post-comment',
      title: '이 영상에 이 댓글 달기',
      content: (
        <div className="space-y-4">
          {selectedVideo ? (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm font-medium text-gray-700">선택된 영상</div>
                  <a 
                    href={selectedVideo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                  >
                    🔗 링크
                  </a>
                </div>
                <div className="flex gap-2">
                  <img 
                    src={selectedVideo.thumbnail} 
                    alt={selectedVideo.title}
                    className="w-10 h-8 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-800 line-clamp-2">
                      {selectedVideo.title}
                    </div>
                    <div className="text-xs text-gray-600">
                      {selectedVideo.channelName}
                    </div>
                  </div>
                </div>
              </div>

              {generatedComment ? (
                <div className="bg-blue-50 p-3 rounded-md">
                  <div className="text-sm font-medium text-blue-700 mb-2">게시할 댓글</div>
                  <div className="bg-white p-3 rounded border text-sm text-gray-800">
                    {generatedComment}
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 p-3 rounded-md">
                  <div className="text-sm text-yellow-700">
                    먼저 4번 카드에서 댓글을 생성해주세요.
                  </div>
                </div>
              )}

              {!commentPosted ? (
                <>
                  <button
                    onClick={handlePostComment}
                    disabled={!generatedComment || isPostingComment}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                  >
                    {isPostingComment ? '댓글 게시중...' : '실제로 댓글 달기'}
                  </button>

                  <div className="text-xs text-gray-500 text-center">
                    ⚠️ 실제 YouTube 영상에 댓글이 게시됩니다
                  </div>
                </>
              ) : (
                <div className="bg-green-50 border border-green-200 p-4 rounded-md">
                  <div className="flex items-center justify-center mb-3">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-800 mb-2">🎉 댓글 게시 완료!</div>
                    <div className="text-sm text-green-700 mb-3">
                      YouTube 영상에 댓글이 성공적으로 게시되었습니다.
                    </div>
                    
                    <div className="bg-white p-3 rounded border text-sm text-gray-800 mb-3">
                      <div className="text-xs text-gray-600 mb-1">게시된 댓글:</div>
                      "{generatedComment.substring(0, 100)}{generatedComment.length > 100 ? '...' : ''}"
                    </div>
                    
                    <a 
                      href={selectedVideo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                      YouTube에서 확인하기
                    </a>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <div className="text-sm">먼저 영상을 선택해주세요.</div>
              <div className="text-xs mt-1">2번 카드에서 영상을 클릭하세요.</div>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'discord-notification',
      title: '디스코드로 알림주기',
      content: (
        <div className="space-y-4">
          {!commentPosted ? (
            <div className="text-center text-gray-500 bg-gray-50 p-4 rounded-md">
              먼저 5번 카드에서 댓글을 게시해주세요.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 p-3 rounded-md">
                <p className="text-green-800 text-sm font-medium">
                  ✅ YouTube 댓글이 성공적으로 게시되었습니다
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-md border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-blue-900">
                    댓글 게시 완료
                  </span>
                  <span className="text-xs text-gray-500">
                    YouTube
                  </span>
                </div>
                
                <div className="bg-blue-50 p-3 rounded-md mb-3">
                  <h4 className="text-xs font-semibold text-blue-700 mb-2">YouTube 링크:</h4>
                  <a
                    href={selectedVideo?.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 underline break-all"
                  >
                    {selectedVideo?.url}
                  </a>
                </div>

                <div className="bg-yellow-50 p-3 rounded-md">
                  <h4 className="text-xs font-semibold text-yellow-700 mb-2">게시된 댓글:</h4>
                  <p className="text-sm text-gray-800">
                    {generatedComment.substring(0, 150)}{generatedComment.length > 150 ? '...' : ''}
                  </p>
                </div>
              </div>
              
              <div className="text-center mt-6">
                <button
                  onClick={handleSendDiscordNotification}
                  className="px-8 py-4 text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors font-semibold text-lg"
                >
                  Discord로 알림 보내기
                </button>
              </div>
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="w-full bg-white">
      <div className="flex items-center mb-6">
        {!hideBackButton && (
          <button
            onClick={onBack}
            className="mr-4 p-2 text-gray-600 hover:text-gray-800"
          >
            ←
          </button>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{config.title}</h1>
          <p className="text-gray-600 mt-1">{config.description}</p>
        </div>
      </div>

      <div className="overflow-x-auto pb-6 bg-white">
        <div className="flex space-x-6 min-w-max pl-6 pr-32 bg-white">
          {cards.map((card, index) => (
            <div key={card.id} className="bg-white rounded-xl border border-gray-200 p-6 w-96 flex-shrink-0 hover:shadow-lg transition-shadow min-h-[650px]">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-cyan-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                  {index + 1}
                </div>
                <h3 className="text-lg font-bold text-gray-900">{card.title}</h3>
              </div>
              {card.content}
            </div>
          ))}
        </div>
      </div>
      <div className="text-center text-gray-500 text-sm mt-4">
        ← → 좌우로 스크롤하여 각 단계를 진행하세요
      </div>
    </div>
  );
};

export default YouTubeDashboard;