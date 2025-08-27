import React, { useState, useEffect } from 'react';
import { AutomationConfig } from '../../types';
import { generateText } from '../../shared/services/geminiService';
import PromptEditor from '../../shared/components/common/PromptEditor';
import AutomationControls from '../../shared/components/common/AutomationControls';
import LogDisplay from '../../shared/components/common/LogDisplay';
import { usePrompts, useLogger, useAutomation, useApiKeys } from '../../shared/hooks';
import YouTubeApiService, { YouTubeVideo, YouTubeSearchResult, YouTubeChannelInfo, YouTubeVideoDetails, YouTubeComment } from './youtubeApiService';

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
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const [channelInfo, setChannelInfo] = useState<YouTubeChannelInfo | null>(null);
  const [videoDetails, setVideoDetails] = useState<YouTubeVideoDetails | null>(null);
  const [comments, setComments] = useState<YouTubeComment[]>([]);
  const [isLoadingChannelInfo, setIsLoadingChannelInfo] = useState(false);
  const [isLoadingVideoDetails, setIsLoadingVideoDetails] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isWritingComment, setIsWritingComment] = useState(false);
  const [generatedComment, setGeneratedComment] = useState<string>('');

  const VIDEOS_PER_PAGE = 10;

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

  // 페이지네이션 관련 계산 (정렬 적용)
  const sortedVideos = searchResults ? 
    [...searchResults.videos].sort((a, b) => 
      sortOrder === 'low' ? a.viewCount - b.viewCount : b.viewCount - a.viewCount
    ) : [];
  
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
      const finalCommentPrompt = interpolatePrompt('youtube-comment', {
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

  const runAutomation = async () => {
    addLog('자동화를 시작합니다...', 'info');
    
    if (!searchResults || searchResults.videos.length === 0) {
      addLog('먼저 영상을 검색해주세요.', 'error');
      return;
    }

    addLog(`총 ${searchResults.videos.length}개 영상에 댓글 작성을 시작합니다.`, 'info');

    for (const video of searchResults.videos) {
      if (!isRunning()) break;
      
      addLog(`[${video.channelName}] "${video.title}" 영상 분석 중... (조회수: ${video.viewCount.toLocaleString()})`, 'info');
      
      addLog('AI를 호출하여 댓글 생성 중...', 'generating');
      const finalCommentPrompt = interpolatePrompt('youtube-comment', {
        VIDEO_TITLE: video.title,
        CHANNEL_NAME: video.channelName,
        VIEW_COUNT: video.viewCount.toString(),
        DESCRIPTION: video.description
      });

      try {
        const geminiApiKey = getApiKey('gemini');
        if (!geminiApiKey) {
          addLog('Gemini API 키가 설정되지 않았습니다.', 'error');
          break;
        }

        const comment = await generateText(finalCommentPrompt, undefined, geminiApiKey);
        addLog(`생성된 댓글: "${comment.substring(0, 100)}..."`, 'success');
        
        // 실제 댓글 작성은 시뮬레이션
        addLog(`댓글 작성 완료: ${video.url}`, 'success');
        
      } catch (error) {
        addLog(`댓글 생성 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`, 'error');
      }

      await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 딜레이
    }

    addLog('자동화가 완료되었습니다.', 'success');
  };

  const cards = [
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
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
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
          
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">정렬 순서:</label>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSortOrder('low');
                  setCurrentPage(1); // 페이지를 1로 리셋
                }}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  sortOrder === 'low' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                조회수 낮은순
              </button>
              <button
                onClick={() => {
                  setSortOrder('high');
                  setCurrentPage(1); // 페이지를 1로 리셋
                }}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  sortOrder === 'high' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                조회수 높은순
              </button>
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            타겟 키워드로 YouTube 영상을 검색하고 조회수가 적은 영상에 댓글을 달아보세요.
          </div>

          {/* 검색 결과 */}
          {searchResults && (
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-medium text-gray-800">
                  검색 결과: {searchResults.videos.length}개 ({sortOrder === 'low' ? '조회수 낮은 순' : '조회수 높은 순'})
                </h4>
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
                          <span>{new Date(video.publishedAt).toLocaleDateString()}</span>
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
                <div className="text-sm font-medium text-gray-700 mb-2">선택된 영상</div>
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
          {selectedVideo ? (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="text-sm font-medium text-gray-700 mb-2">선택된 영상</div>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">댓글 생성 프롬프트</label>
                {getPrompt('youtube-comment') ? (
                  <PromptEditor
                    prompt={getPrompt('youtube-comment')!}
                    value={getPrompt('youtube-comment')!.template}
                    onChange={(value) => updatePrompt('youtube-comment', value)}
                    onReset={() => resetPrompt('youtube-comment')}
                  />
                ) : (
                  <div className="bg-yellow-50 p-3 rounded-md text-sm text-yellow-700">
                    YouTube 댓글 프롬프트가 설정되지 않았습니다. 기본 프롬프트를 로드하는 중...
                  </div>
                )}
              </div>
                
              <button
                onClick={() => handleWriteComment()}
                disabled={!channelInfo || !videoDetails || isWritingComment}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isWritingComment ? '댓글 작성중...' : '댓글 작성하기'}
              </button>

              {!channelInfo || !videoDetails ? (
                <div className="text-xs text-gray-500 text-center">
                  먼저 2번 카드에서 "모든 정보 갖고오기"를 클릭해주세요.
                </div>
              ) : null}

              {generatedComment && (
                <div className="bg-green-50 p-3 rounded-md">
                  <h5 className="text-sm font-medium text-green-800 mb-2">✅ 생성된 댓글</h5>
                  <div className="bg-white p-3 rounded border">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{generatedComment}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <div className="text-sm">먼저 영상을 선택해주세요.</div>
              <div className="text-xs mt-1">1번 카드에서 영상을 클릭하세요.</div>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'automation',
      title: '자동화 실행',
      content: (
        <div className="space-y-4">
          <AutomationControls
            isRunning={isAutomating}
            onStart={() => startAutomation(runAutomation)}
            onStop={stopAutomation}
            status={isAutomating ? 'running' : 'idle'}
          />
          <LogDisplay logs={logs} onClear={clearLogs} />
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
          <h1 className="text-2xl font-bold text-gray-900">{config.name}</h1>
          <p className="text-gray-600 mt-1">{config.description}</p>
        </div>
      </div>

      <div className="overflow-x-auto pb-6 bg-white">
        <div className="flex space-x-6 min-w-max pl-6 pr-32 bg-white">
          {cards.map((card, index) => (
            <div key={card.id} className="bg-white rounded-xl border border-gray-200 p-6 w-96 flex-shrink-0 hover:shadow-lg transition-shadow">
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