import React, { useState } from 'react';
import { AutomationConfig, Subreddit } from '../types';
import { generateText } from '../services/geminiService';
import RedditService from '../services/redditService';
import BaseAutomationPanel from './common/BaseAutomationPanel';
import ApiKeyInput from './common/ApiKeyInput';
import PromptEditor from './common/PromptEditor';
import { useApiKeys, usePrompts, useLogger, useAutomation } from '../hooks';
import LogDisplay from './common/LogDisplay';

interface RedditDashboardProps {
  config: AutomationConfig;
  onBack: () => void;
  hideBackButton?: boolean;
}

const RedditDashboard: React.FC<RedditDashboardProps> = ({ config, onBack, hideBackButton }) => {
  const { getApiKey, setApiKey } = useApiKeys(['clientId', 'clientSecret', 'username']);
  const { getPrompt, updatePrompt, resetPrompt, interpolatePrompt } = usePrompts('reddit');
  const { logs, addLog, clearLogs } = useLogger();
  const { isAutomating, startAutomation, stopAutomation, isRunning } = useAutomation();
  
  const [subreddits, setSubreddits] = useState<Subreddit[]>([
    { id: '1', url: 'https://www.reddit.com/r/newtuber/' }
  ]);
  const [newSubredditUrl, setNewSubredditUrl] = useState('');
  const [sortType, setSortType] = useState<'hot' | 'new'>('new');
  const [redditService, setRedditService] = useState<RedditService | null>(null);
  const [fetchedPosts, setFetchedPosts] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState<'idle' | 'fetched'>('idle');

  // Reddit 서비스 초기화
  React.useEffect(() => {
    const username = getApiKey('username') || 'anonymous';
    setRedditService(new RedditService(username));
  }, []);

  // 사용자명이 변경되면 서비스 재생성
  const updateRedditService = React.useCallback(() => {
    const username = getApiKey('username') || 'anonymous';
    setRedditService(new RedditService(username));
  }, [getApiKey]);

  const handleAddSubreddit = () => {
    if (newSubredditUrl.trim() === '') return;
    try {
      const url = new URL(newSubredditUrl);
      if (!url.hostname.includes('reddit.com')) {
        return;
      }
      const newSub: Subreddit = {
        id: new Date().toISOString(),
        url: newSubredditUrl.trim()
      };
      setSubreddits(prev => [...prev, newSub]);
      setNewSubredditUrl('');
    } catch (error) {
      // Invalid URL
    }
  };

  const handleDeleteSubreddit = (id: string) => {
    setSubreddits(prev => prev.filter(sub => sub.id !== id));
  };

  // API 연결 테스트
  const handleTestConnection = () => {
    clearLogs();
    startAutomation(async () => {
      addLog('Reddit API 연결을 테스트하는 중...', 'info');

      if (!redditService) {
        addLog('Reddit 서비스 초기화 중 오류가 발생했습니다.', 'error');
        return;
      }

      addLog(`설정된 사용자명: ${getApiKey('username') || 'anonymous'}`, 'info');

      const testResult = await redditService.testConnection();
      if (testResult.success) {
        addLog(testResult.message, 'success');
      } else {
        addLog(testResult.message, 'error');
        addLog(`상세 정보: ${JSON.stringify(testResult.details, null, 2)}`, 'info');
      }
    });
  };

  // 1단계: 게시물 가져오기
  const handleFetchPosts = () => {
    clearLogs();
    setCurrentStep('idle');
    startAutomation(async () => {
      addLog('Reddit에서 게시물을 가져오는 중...', 'info');

      if (!redditService) {
        addLog('Reddit 서비스 초기화 중 오류가 발생했습니다.', 'error');
        return;
      }

      // 디버깅 정보 추가
      addLog(`사용자명: ${getApiKey('username') || 'anonymous'}`, 'info');
      addLog(`정렬 기준: ${sortType === 'new' ? '최신' : '인기'}`, 'info');
      addLog(`타겟 서브레딧: ${subreddits.map(s => s.url).join(', ')}`, 'info');

      try {
        const allPosts = [];
        for (const subredditConfig of subreddits) {
          if (!isRunning()) break;
          
          addLog(`${subredditConfig.url}에서 게시물 가져오는 중...`, 'info');
          
          const subredditName = redditService.extractSubredditFromUrl(subredditConfig.url);
          const posts = await redditService.getSubredditPosts(subredditName, sortType, 5);
          
          addLog(`${posts.length}개의 게시물을 가져왔습니다.`, 'success');
          allPosts.push(...posts);
        }
        
        setFetchedPosts(allPosts);
        setCurrentStep('fetched');
        addLog(`총 ${allPosts.length}개의 게시물을 가져왔습니다.`, 'success');
        
        // 게시물 목록 표시
        allPosts.forEach((post, index) => {
          addLog(`${index + 1}. [${post.author}] "${post.title}" (${post.score}점, ${post.num_comments}댓글)`, 'info');
        });
        
      } catch (error) {
        addLog(`에러 발생: ${error instanceof Error ? error.message : '알 수 없는 에러'}`, 'error');
      }
    });
  };

  // 2단계: 댓글 작성
  const handleStartCommenting = () => {
    startAutomation(async () => {
      addLog('댓글 작성을 시작합니다...', 'info');

      try {
        for (const post of fetchedPosts) {
          if (!isRunning()) break;
          
          addLog(`[${post.author}]의 게시글 확인 중: "${post.title}"`, 'info');
          
          // 기본 적합성 검사
          if (!redditService?.isPostSuitableForComment(post)) {
            addLog('게시물이 댓글 작성에 적합하지 않습니다.', 'info');
            continue;
          }
          
          // AI 적합성 판단
          addLog('게시글 적합성 판단을 위해 AI 호출 중...', 'generating');
          const finalSuitabilityPrompt = interpolatePrompt('reddit-suitability', {
            POST_TITLE: post.title,
            POST_CONTENT: post.selftext || '(링크 게시물)'
          });

          const suitabilityResult = await generateText(finalSuitabilityPrompt);

          if (!suitabilityResult.toUpperCase().includes('YES')) {
            addLog(`게시글이 적합하지 않아 건너뜁니다. (AI 응답: ${suitabilityResult.trim()})`, 'info');
            continue;
          }

          addLog('게시글이 적합합니다. 댓글 생성을 시작합니다.', 'success');

          // 댓글 생성
          addLog('댓글 생성을 위해 AI 호출 중...', 'generating');
          const finalCommentPrompt = interpolatePrompt('reddit-comment', {
            POST_TITLE: post.title,
            POST_CONTENT: post.selftext || '(링크 게시물)'
          });
          
          const generatedComment = await generateText(finalCommentPrompt);
          addLog(`AI가 생성한 댓글: "${generatedComment.substring(0, 50)}..."`, 'success');

          // 시뮬레이션된 댓글 게시
          addLog('Reddit에 댓글을 게시하는 중... (시뮬레이션)', 'generating');
          await new Promise(res => setTimeout(res, 1000));
          addLog(`"${post.title}" 게시글에 댓글 게시 완료. 확인: ${post.url}`, 'success');
          
          // 연속 요청 방지를 위한 대기
          await new Promise(res => setTimeout(res, 2000));
        }
        
        addLog('댓글 작성이 완료되었습니다.', 'success');
        setCurrentStep('idle');
        setFetchedPosts([]);
        
      } catch (error) {
        addLog(`에러 발생: ${error instanceof Error ? error.message : '알 수 없는 에러'}`, 'error');
      }
    });
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-7xl animate-[fadeIn_0.5s_ease-in-out]">
      {!hideBackButton && (
        <button
          onClick={onBack}
          className="mb-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-cyan-500 transition-colors"
        >
          &larr; 뒤로가기
        </button>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl p-6 mb-6 border border-gray-300">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">{config.icon}</div>
          <div>
            <h1 className="text-2xl font-bold text-black">{config.title}</h1>
            <p className="text-gray-600">{config.description}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Settings */}
        <div className="flex flex-col space-y-6">
          {/* API 설정 */}
          <div className="bg-white rounded-xl p-6 border border-gray-300">
            <h2 className="text-xl font-bold text-cyan-600 mb-4">1. Reddit API 설정</h2>
            <div className="bg-blue-50 p-3 rounded-md mb-4">
              <p className="text-sm text-blue-700">
                📌 <strong>게시물 가져오기</strong>는 API 키 없이 가능합니다.<br/>
                📌 <strong>댓글 작성</strong>을 위해서는 Reddit API 키가 필요합니다.
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="reddit-username" className="block text-sm font-medium text-gray-700 mb-2">사용자명 (선택사항)</label>
                <input
                  type="text"
                  id="reddit-username"
                  value={getApiKey('username')}
                  onChange={(e) => {
                    setApiKey('username', e.target.value);
                    updateRedditService();
                  }}
                  placeholder="anonymous (기본값)"
                  className="w-full p-2 bg-gray-50 rounded-md text-gray-700 border border-gray-300 focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <ApiKeyInput 
                label="Client ID (댓글 작성시 필요)"
                value={getApiKey('clientId')}
                onChange={(value) => setApiKey('clientId', value)}
                id="reddit-client-id"
                placeholder="BVk2N5X3JSIrnlDaEeVBglrJIg6F7Q"
              />
              <ApiKeyInput 
                label="Client Secret (댓글 작성시 필요)"
                value={getApiKey('clientSecret')}
                onChange={(value) => setApiKey('clientSecret', value)}
                id="reddit-client-secret"
                placeholder="시크릿 키를 입력하세요"
              />
            </div>
          </div>

          {/* 서브레딧 설정 */}
          <div className="bg-white rounded-xl p-6 border border-gray-300">
            <h2 className="text-xl font-bold text-cyan-600 mb-4">2. 타겟 서브레딧</h2>
            <div className="flex space-x-2 mb-4">
              <input
                type="text"
                value={newSubredditUrl}
                onChange={(e) => setNewSubredditUrl(e.target.value)}
                placeholder="e.g., https://www.reddit.com/r/askreddit"
                className="w-full p-2 bg-gray-50 rounded-md text-gray-700 border border-gray-300 focus:ring-2 focus:ring-cyan-500"
              />
              <button 
                onClick={handleAddSubreddit} 
                className="px-4 py-2 bg-cyan-600 text-white font-semibold rounded-md hover:bg-cyan-700"
              >
                추가
              </button>
            </div>
            
            <div className="mb-4">
              <span className="block text-sm font-medium text-gray-700 mb-2">정렬 기준</span>
              <div className="flex space-x-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="sort"
                    value="new"
                    checked={sortType === 'new'}
                    onChange={() => setSortType('new')}
                    className="form-radio h-4 w-4 text-cyan-500 bg-gray-50 border-gray-300 focus:ring-cyan-500"
                  />
                  <span className="ml-2 text-gray-700">최신 (New)</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="sort"
                    value="hot"
                    checked={sortType === 'hot'}
                    onChange={() => setSortType('hot')}
                    className="form-radio h-4 w-4 text-cyan-500 bg-gray-50 border-gray-300 focus:ring-cyan-500"
                  />
                  <span className="ml-2 text-gray-700">인기 (Hot)</span>
                </label>
              </div>
            </div>
            
            <div className="mt-4 space-y-2 max-h-32 overflow-y-auto">
              {subreddits.map(sub => (
                <div key={sub.id} className="flex justify-between items-center bg-gray-100 p-2 rounded-md">
                  <span className="text-sm text-gray-700 truncate">{sub.url}</span>
                  <button 
                    onClick={() => handleDeleteSubreddit(sub.id)} 
                    className="text-red-600 hover:text-red-800 text-xl"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 프롬프트 설정 */}
          <div className="bg-white rounded-xl p-6 border border-gray-300">
            <h2 className="text-xl font-bold text-cyan-600 mb-4">3. AI 프롬프트 설정</h2>
            <div className="space-y-4">
              {getPrompt('reddit-suitability') && (
                <PromptEditor
                  prompt={getPrompt('reddit-suitability')!}
                  value={getPrompt('reddit-suitability')!.template}
                  onChange={(value) => updatePrompt('reddit-suitability', value)}
                  onReset={() => resetPrompt('reddit-suitability')}
                />
              )}
              
              {getPrompt('reddit-comment') && (
                <PromptEditor
                  prompt={getPrompt('reddit-comment')!}
                  value={getPrompt('reddit-comment')!.template}
                  onChange={(value) => updatePrompt('reddit-comment', value)}
                  onReset={() => resetPrompt('reddit-comment')}
                />
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Controls & Logs */}
        <div className="bg-white rounded-xl p-6 border border-gray-300 flex flex-col">
          <h2 className="text-xl font-bold text-cyan-600 mb-4">단계별 자동화 제어</h2>
          
          {currentStep === 'idle' && (
            <div className="space-y-4 mb-6">
              <p className="text-gray-600">단계 1: 먼저 Reddit에서 게시물을 가져옵니다.</p>
              
              {/* API 테스트 버튼 */}
              <button 
                onClick={handleTestConnection}
                disabled={isAutomating}
                className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-md transition-colors disabled:bg-gray-400 mb-2"
              >
                {isAutomating ? '테스트 중...' : '🔧 API 연결 테스트'}
              </button>
              
              <button 
                onClick={handleFetchPosts}
                disabled={isAutomating}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors disabled:bg-gray-400"
              >
                {isAutomating ? '가져오는 중...' : '📥 게시물 가져오기'}
              </button>
            </div>
          )}
          
          {currentStep === 'fetched' && (
            <div className="space-y-4 mb-6">
              <p className="text-gray-600">단계 2: 가져온 {fetchedPosts.length}개 게시물에 댓글을 작성합니다.</p>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => { setCurrentStep('idle'); setFetchedPosts([]); }}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-md transition-colors"
                >
                  취소
                </button>
                <button 
                  onClick={handleStartCommenting}
                  disabled={isAutomating}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md transition-colors disabled:bg-gray-400"
                >
                  {isAutomating ? '작성 중...' : '댓글 작성 시작'}
                </button>
              </div>
            </div>
          )}
          
          <LogDisplay logs={logs} />
        </div>
      </div>
    </div>
  );
};

export default RedditDashboard;