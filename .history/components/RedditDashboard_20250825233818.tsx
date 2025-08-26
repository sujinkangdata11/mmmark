import React, { useState } from 'react';
import { AutomationConfig, Subreddit } from '../types';
import { generateText } from '../services/geminiService';
import RedditService from '../services/redditService';
import BaseAutomationPanel from './common/BaseAutomationPanel';
import PromptEditor from './common/PromptEditor';
import PostCard from './common/PostCard';
import { useApiKeys, usePrompts, useLogger, useAutomation } from '../hooks';
import LogDisplay from './common/LogDisplay';

interface RedditDashboardProps {
  config: AutomationConfig;
  onBack: () => void;
  hideBackButton?: boolean;
}

const RedditDashboard: React.FC<RedditDashboardProps> = ({ config, onBack, hideBackButton }) => {
  const { getApiKey } = useApiKeys(['clientId', 'clientSecret', 'username']);
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
    console.log('🚀 handleFetchPosts 함수 실행됨!');
    clearLogs();
    setCurrentStep('idle');
    startAutomation(async () => {
      console.log('🔥 startAutomation 내부 실행됨!');
      addLog('Reddit에서 게시물을 가져오는 중...', 'info');

      console.log('🔍 redditService 상태:', redditService);
      if (!redditService) {
        console.log('❌ redditService가 null입니다!');
        addLog('Reddit 서비스 초기화 중 오류가 발생했습니다.', 'error');
        return;
      }
      console.log('✅ redditService 존재함');

      // 디버깅 정보 추가
      addLog(`사용자명: ${getApiKey('username') || 'anonymous'}`, 'info');
      addLog(`정렬 기준: ${sortType === 'new' ? '최신' : '인기'}`, 'info');
      addLog(`타겟 서브레딧: ${subreddits.map(s => s.url).join(', ')}`, 'info');

      console.log('📋 subreddits 배열:', subreddits);
      console.log('🔄 for 루프 시작');

      try {
        const allPosts = [];
        for (const subredditConfig of subreddits) {
          console.log('🎯 처리 중인 서브레딧:', subredditConfig);
          console.log('⚡ isRunning() 체크:', isRunning());
          if (!isRunning()) {
            console.log('🛑 isRunning()이 false여서 루프 중단');
            break;
          }
          
          addLog(`${subredditConfig.url}에서 게시물 가져오는 중...`, 'info');
          
          const subredditName = redditService.extractSubredditFromUrl(subredditConfig.url);
          console.log('📞 RedditService 호출 시작:', subredditName, sortType);
          const posts = await redditService.getSubredditPosts(subredditName, sortType, 5);
          console.log('✅ RedditService 응답:', posts.length, '개 게시물');
          
          addLog(`${posts.length}개의 게시물을 가져왔습니다.`, 'success');
          allPosts.push(...posts);
        }
        
        setFetchedPosts(allPosts);
        setCurrentStep('fetched');
        addLog(`총 ${allPosts.length}개의 게시물을 가져왔습니다. 아래에서 확인 후 댓글 작성을 진행하세요.`, 'success');
        
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

  // 카드 데이터 정의
  const steps = [
    {
      id: 'logs-info',
      title: '로그 & 정보',
      description: 'Reddit 자동화 작업 로그와 API 사용 안내를 확인합니다.',
      content: (
        <div className="space-y-4">
          <div className="bg-blue-50 p-3 rounded-md">
            <p className="text-sm text-blue-700">
              📌 <strong>게시물 가져오기</strong>는 API 키 없이 가능합니다.<br/>
              📌 <strong>댓글 작성</strong>을 위해서는 Reddit API 키가 필요합니다.
            </p>
          </div>
          <div style={{ height: '300px' }}>
            <LogDisplay logs={logs} />
          </div>
        </div>
      )
    },
    {
      id: 'subreddit-setup',
      title: '타겟 서브레딧 설정',
      description: '댓글을 작성할 서브레딧을 선택하고 정렬 방식을 설정합니다.',
      content: (
        <div className="space-y-4">
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
              className="px-4 py-2 bg-cyan-600 text-white font-semibold rounded-md hover:bg-cyan-700 whitespace-nowrap"
            >
              추가
            </button>
          </div>
          
          <div>
            <span className="block text-sm font-medium text-gray-700 mb-2">정렬 기준</span>
            <div className="flex space-x-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="sort"
                  value="new"
                  checked={sortType === 'new'}
                  onChange={() => setSortType('new')}
                  className="form-radio h-4 w-4 text-cyan-500"
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
                  className="form-radio h-4 w-4 text-cyan-500"
                />
                <span className="ml-2 text-gray-700">인기 (Hot)</span>
              </label>
            </div>
          </div>
          
          <div className="space-y-2 max-h-32 overflow-y-auto">
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
      )
    },
    {
      id: 'fetch-posts',
      title: '게시물 가져오기',
      description: 'Reddit에서 최신 게시물을 가져와 댓글 작성 대상을 확인합니다.',
      content: (
        <div className="space-y-4">
          <div className="space-y-4">
            <p className="text-gray-600">API 연결을 테스트하고 게시물을 가져옵니다.</p>
            
            <button 
              onClick={handleTestConnection}
              disabled={isAutomating}
              className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-md transition-colors disabled:bg-gray-400"
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
            
            {currentStep === 'fetched' && (
              <div className="bg-green-50 p-4 rounded-md">
                <p className="text-green-800 font-medium">✅ {fetchedPosts.length}개 게시물을 가져왔습니다!</p>
                <p className="text-green-700 text-sm mt-1">다음 단계에서 댓글 작성을 진행하세요.</p>
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      id: 'prompts',
      title: 'AI 프롬프트 설정',
      description: 'AI가 게시물의 적합성을 판단하고 댓글을 생성할 프롬프트를 설정합니다.',
      content: (
        <div className="space-y-6">
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
      )
    },
    {
      id: 'posts-review',
      title: '게시물 검토',
      description: '가져온 게시물들을 검토하고 댓글 작성을 시작합니다.',
      content: (
        <div className="space-y-4">
          {fetchedPosts.length > 0 ? (
            <>
              <div className="bg-blue-50 p-4 rounded-md">
                <h3 className="font-semibold text-blue-900 mb-2">가져온 게시물 ({fetchedPosts.length}개)</h3>
                <p className="text-blue-800 text-sm">아래 게시물들을 검토하고 댓글 작성을 시작하세요.</p>
              </div>
              
              <div className="max-h-96 overflow-y-auto space-y-3 border rounded-lg p-3">
                {fetchedPosts.map((post, index) => (
                  <PostCard key={post.id} post={post} index={index} />
                ))}
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                <button 
                  onClick={() => { setCurrentStep('idle'); setFetchedPosts([]); }}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-md transition-colors"
                >
                  다시 가져오기
                </button>
                <button 
                  onClick={handleStartCommenting}
                  disabled={isAutomating}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md transition-colors disabled:bg-gray-400"
                >
                  {isAutomating ? '작성 중...' : '댓글 작성 시작'}
                </button>
              </div>
            </>
          ) : (
            <div className="bg-yellow-50 p-4 rounded-md text-center">
              <p className="text-yellow-800">먼저 이전 단계에서 게시물을 가져와주세요.</p>
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="w-full bg-white">
      {/* 가로 스크롤 카드 컨테이너 */}
      <div className="overflow-x-auto pb-6 bg-white">
        <div className="flex space-x-6 min-w-max pl-6 pr-32 bg-white">
          {steps.map((step, index) => (
            <div 
              key={step.id}
              className="bg-white rounded-xl border border-gray-200 p-6 w-96 flex-shrink-0 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-cyan-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                  {index + 1}
                </div>
                <h3 className="text-lg font-bold text-gray-900">{step.title}</h3>
              </div>
              
              <p className="text-sm text-gray-600 mb-6">{step.description}</p>
              
              <div className="space-y-4">
                {step.content}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 스크롤 힌트 */}
      <div className="text-center text-gray-500 text-sm">
        ← → 좌우로 스크롤하여 각 단계를 진행하세요
      </div>
    </div>
  );
};

export default RedditDashboard;