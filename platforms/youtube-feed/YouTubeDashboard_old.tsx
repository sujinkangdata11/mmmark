import React, { useState } from 'react';
import { AutomationConfig, MockYouTubeVideo } from '../../types';
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

const mockVideos: MockYouTubeVideo[] = [
  { id: 'dQw4w9WgXcQ', title: 'How to start a successful side hustle in 2024', channelName: 'Entrepreneur TV', viewCount: 150 },
  { id: 'y6120QOlsfU', title: 'My morning routine for maximum productivity', channelName: 'LifeHacks', viewCount: 230 },
  { id: '3tmd-ClpJxA', title: 'Unboxing the new AI-powered gadget', channelName: 'TechReviews', viewCount: 310 },
];

const YouTubeDashboard: React.FC<YouTubeDashboardProps> = ({ config }) => {
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

    // API 키 검증은 사이드바에서 관리되므로 여기서는 제거
    // if (!validateKeys(['youtube'])) {
    //   addLog('YouTube API 키가 필요합니다.', 'error');
    //   return;
    // }
    
    if (!searchKeyword.trim()) {
      addLog('검색 키워드가 필요합니다.', 'error');
      return;
    }

    addLog(`'${searchKeyword}' 키워드로 YouTube 영상 검색 중... (조회수 낮은 순)`);
    await new Promise(res => setTimeout(res, 1000)); // Simulate API call

    for (const video of mockVideos) {
      if (!isRunning()) break;
      
      addLog(`[${video.channelName}] 채널의 "${video.title}" 영상 분석 중...`, 'info');
      
      addLog('AI를 호출하여 댓글 생성 중...', 'generating');
      const finalCommentPrompt = interpolatePrompt('youtube-comment', {
        VIDEO_TITLE: video.title,
        WEBSITE_URL: '[내 웹사이트 주소]'
      });
      
      await new Promise(res => setTimeout(res, 1500)); 
      const generatedComment = await generateText(finalCommentPrompt);
      addLog(`AI가 생성한 댓글: "${generatedComment.substring(0, 60)}..."`, 'success');

      addLog('YouTube에 댓글을 게시하는 중...', 'generating');
      await new Promise(res => setTimeout(res, 1000));
      addLog(`댓글 게시 완료. 확인: https://www.youtube.com/watch?v=${video.id}`, 'success');
    }
    
    if (isRunning()) {
      addLog('자동화 프로세스가 완료되었습니다.', 'info');
    } else {
      addLog('자동화가 중지되었습니다.', 'info');
    }
  };

  const steps = [
    {
      id: 'targeting-setup',
      title: '타겟팅 설정',
      content: (
        <div className="space-y-4">
          <label htmlFor="search-keyword" className="block text-sm font-medium text-gray-700">검색 키워드</label>
          <input
            type="text"
            id="search-keyword"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="예: '재테크', '사이드 허슬'"
            className="w-full p-3 bg-gray-50 rounded-md text-gray-700 border border-gray-300 focus:ring-2 focus:ring-cyan-500"
          />
          <div className="text-sm text-gray-600">
            타겟 키워드로 YouTube 영상을 검색하고 조회수가 적은 영상에 댓글을 달아보세요.
          </div>
          <div className="bg-blue-50 p-3 rounded-md">
            <h4 className="text-sm font-medium text-blue-800 mb-2">현재 타겟 영상</h4>
            <div className="space-y-2">
              {mockVideos.map(video => (
                <div key={video.id} className="text-xs text-blue-700 flex justify-between">
                  <span className="truncate">{video.title}</span>
                  <span>{video.viewCount} views</span>
                </div>
              ))}
            </div>
          </div>
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
          
          {getPrompt('youtube-description') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">설명 생성 프롬프트</label>
              <PromptEditor
                prompt={getPrompt('youtube-description')!}
                value={getPrompt('youtube-description')!.template}
                onChange={(value) => updatePrompt('youtube-description', value)}
                onReset={() => resetPrompt('youtube-description')}
              />
            </div>
          )}
        </div>
      )
    },
    {
      id: 'automation-control',
      title: '자동화 실행',
      content: (
        <div className="space-y-4">
          <AutomationControls 
            isAutomating={isAutomating}
            onStart={() => {
              clearLogs();
              startAutomation(() => runAutomation());
            }}
            onStop={() => {
              stopAutomation();
              addLog('자동화를 중지하는 중...', 'error');
            }}
          />
          <div className="max-h-64 overflow-y-auto">
            <LogDisplay logs={logs} />
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="w-full bg-white">
      <div className="overflow-x-auto pb-6 bg-white">
        <div className="flex space-x-6 min-w-max pl-6 pr-32 bg-white">
          {steps.map((step, index) => (
            <div key={step.id} className="bg-white rounded-xl border border-gray-200 p-6 w-96 flex-shrink-0 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-cyan-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                  {index + 1}
                </div>
                <h3 className="text-lg font-bold text-gray-900">{step.title}</h3>
              </div>
              {step.content}
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