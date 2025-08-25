import React, { useState } from 'react';
import { AutomationConfig, Subreddit, MockRedditPost } from '../types';
import { generateText } from '../services/geminiService';
import BaseAutomationPanel from './common/BaseAutomationPanel';
import ApiKeyInput from './common/ApiKeyInput';
import { useApiKeys, usePrompts } from '../hooks';
import PromptEditor from './common/PromptEditor';

interface RedditDashboardProps {
  config: AutomationConfig;
  onBack: () => void;
  hideBackButton?: boolean;
}

const mockPosts: MockRedditPost[] = [
  { id: 'p1', title: 'What is a small thing that makes you happy?', content: 'For me, it is the smell of rain on a hot day.', author: 'user123' },
  { id: 'p2', title: 'Tech startup seeking feedback on new productivity app', content: 'Our app helps you organize tasks with AI. What features would you like to see?', author: 'appdev' },
  { id: 'p3', title: 'Just finished a 1000-piece puzzle!', content: 'It was a picture of a cat in a library. So challenging but rewarding!', author: 'puzzlelover' }
];

const RedditDashboard: React.FC<RedditDashboardProps> = ({ config, onBack, hideBackButton }) => {
  const { getApiKey, setApiKey } = useApiKeys(['reddit']);
  const { getPrompt, updatePrompt, resetPrompt, interpolatePrompt } = usePrompts('reddit');
  const [subreddits, setSubreddits] = useState<Subreddit[]>([]);
  const [newSubredditUrl, setNewSubredditUrl] = useState('');

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

  const runAutomation = async (addLog: Function, isRunning: () => boolean) => {
    addLog('자동화를 시작합니다...', 'info');

    if (subreddits.length === 0) {
      addLog('자동화를 실행할 서브레딧이 없습니다. URL을 추가해주세요.', 'error');
      return;
    }

    for (const post of mockPosts) {
      if (!isRunning()) break;
      
      addLog(`[${post.author}]의 게시글 확인 중: "${post.title}"`, 'info');
      
      addLog('게시글 적합성 판단을 위해 AI 호출 중...', 'generating');
      const finalSuitabilityPrompt = interpolatePrompt('reddit-suitability', {
        POST_TITLE: post.title,
        POST_CONTENT: post.content
      });

      await new Promise(res => setTimeout(res, 1000));
      const suitabilityResult = await generateText(finalSuitabilityPrompt);

      if (!suitabilityResult.toUpperCase().includes('YES')) {
        addLog(`게시글이 적합하지 않아 건너뜁니다. (AI 응답: ${suitabilityResult.trim()})`, 'info');
        continue;
      }

      addLog('게시글이 적합합니다. 댓글 생성을 시작합니다.', 'success');

      addLog('댓글 생성을 위해 AI 호출 중...', 'generating');
      const finalCommentPrompt = interpolatePrompt('reddit-comment', {
        POST_TITLE: post.title,
        POST_CONTENT: post.content
      });
      
      await new Promise(res => setTimeout(res, 1500));
      const generatedComment = await generateText(finalCommentPrompt);
      addLog(`AI가 생성한 댓글: "${generatedComment.substring(0, 50)}..."`, 'success');

      addLog('Reddit에 댓글을 게시하는 중...', 'generating');
      await new Promise(res => setTimeout(res, 1000));
      const postUrl = `https://www.reddit.com/r/mock/comments/${post.id}`;
      addLog(`"${post.title}" 게시글에 댓글 게시 완료. 확인: ${postUrl}`, 'success');
    }
    
    if (isRunning()) {
      addLog('자동화 프로세스가 완료되었습니다.', 'info');
    } else {
      addLog('자동화가 중지되었습니다.', 'info');
    }
  };

  return (
    <BaseAutomationPanel 
      config={config} 
      onBack={onBack} 
      hideBackButton={hideBackButton}
      onStartAutomation={runAutomation}
    >
      {/* API 설정 */}
      <div className="bg-white rounded-xl p-6 border border-gray-300">
        <h2 className="text-xl font-bold text-cyan-600 mb-4">1. Reddit API 설정</h2>
        <ApiKeyInput 
          label="Reddit API 키"
          value={getApiKey('reddit')}
          onChange={(value) => setApiKey('reddit', value)}
          id="reddit-api-key"
        />
      </div>

      {/* 서브레딧 설정 */}
      <div className="bg-white rounded-xl p-6 border border-gray-300">
        <h2 className="text-xl font-bold text-cyan-600 mb-4">2. 타겟 서브레딧</h2>
        <div className="flex space-x-2">
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
    </BaseAutomationPanel>
  );
};

export default RedditDashboard;