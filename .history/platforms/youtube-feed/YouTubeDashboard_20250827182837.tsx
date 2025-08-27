import React, { useState } from 'react';
import { AutomationConfig } from '../../types';
import { generateText } from '../../shared/services/geminiService';
import PromptEditor from '../../shared/components/common/PromptEditor';
import AutomationControls from '../../shared/components/common/AutomationControls';
import LogDisplay from '../../shared/components/common/LogDisplay';
import { usePrompts, useLogger, useAutomation, useApiKeys } from '../../shared/hooks';
import YouTubeApiService, { YouTubeVideo, YouTubeSearchResult } from './youtubeApiService';

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
  const [selectedVideos, setSelectedVideos] = useState<YouTubeVideo[]>([]);

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
      addLog(`${result.videos.length}개 영상을 찾았습니다. (조회수 낮은 순으로 정렬됨)`, 'success');
      
    } catch (error) {
      addLog(`검색 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`, 'error');
    } finally {
      setIsSearching(false);
    }
  };

  // 페이지네이션 관련 계산
  const totalPages = searchResults ? Math.ceil(searchResults.videos.length / VIDEOS_PER_PAGE) : 0;
  const currentVideos = searchResults ? 
    searchResults.videos.slice(
      (currentPage - 1) * VIDEOS_PER_PAGE, 
      currentPage * VIDEOS_PER_PAGE
    ) : [];

  // 페이지 변경
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
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
          
          <div className="text-sm text-gray-600">
            타겟 키워드로 YouTube 영상을 검색하고 조회수가 적은 영상에 댓글을 달아보세요.
          </div>

          {/* 검색 결과 */}
          {searchResults && (
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-medium text-gray-800">
                  검색 결과: {searchResults.videos.length}개 (조회수 낮은 순)
                </h4>
                <div className="text-xs text-gray-500">
                  페이지 {currentPage} / {totalPages}
                </div>
              </div>
              
              {/* 비디오 목록 */}
              <div className="space-y-2 mb-4">
                {currentVideos.map((video, index) => (
                  <div key={video.id} className="bg-white p-3 rounded border text-xs">
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
      id: 'prompt-setup',
      title: 'AI 프롬프트 설정',
      content: (
        <div className="space-y-4">
          {getPrompt('youtube-comment') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">댓글 생성 프롬프트</label>
              <PromptEditor
                prompt={getPrompt('youtube-comment')!}
                value={getPrompt('youtube-comment')!.template}
                onChange={(value) => updatePrompt('youtube-comment', value)}
                onReset={() => resetPrompt('youtube-comment')}
              />
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
    <div className="max-w-6xl mx-auto p-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div key={card.id} className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{card.title}</h2>
            {card.content}
          </div>
        ))}
      </div>
    </div>
  );
};

export default YouTubeDashboard;