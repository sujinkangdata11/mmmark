import React, { useState } from 'react';
import { AutomationConfig, MockYouTubeVideo } from '../types';
import { generateText } from '../services/geminiService';
import BaseAutomationPanel from './common/BaseAutomationPanel';
import ApiKeyInput from './common/ApiKeyInput';
import PromptEditor from './common/PromptEditor';
import { useApiKeys, usePrompts } from '../hooks';

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

const YouTubeDashboard: React.FC<YouTubeDashboardProps> = ({ config, onBack, hideBackButton }) => {
  const { getApiKey, setApiKey, validateKeys } = useApiKeys(['youtube']);
  const { getPrompt, updatePrompt, resetPrompt, interpolatePrompt } = usePrompts('youtube');
  const [searchKeyword, setSearchKeyword] = useState('');

  const runAutomation = async (addLog: Function, isRunning: () => boolean) => {
    addLog('자동화를 시작합니다...', 'info');

    if (!validateKeys(['youtube'])) {
      addLog('YouTube API 키가 필요합니다.', 'error');
      return;
    }
    
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

  return (
    <BaseAutomationPanel 
      config={config} 
      onBack={onBack} 
      hideBackButton={hideBackButton}
      onStartAutomation={runAutomation}
    >
      {/* API 설정 */}
      <div className="bg-white rounded-xl p-6 border border-gray-300">
        <h2 className="text-xl font-bold text-cyan-600 mb-4">1. API 설정</h2>
        <ApiKeyInput 
          label="YouTube Data API 키"
          value={getApiKey('youtube')}
          onChange={(value) => setApiKey('youtube', value)}
          id="youtube-api-key"
        />
      </div>

      {/* 타겟팅 설정 */}
      <div className="bg-white rounded-xl p-6 border border-gray-300">
        <h2 className="text-xl font-bold text-cyan-600 mb-4">2. 타겟팅 설정</h2>
        <label htmlFor="search-keyword" className="block text-sm font-medium text-gray-700 mb-2">검색 키워드</label>
        <input
          type="text"
          id="search-keyword"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          placeholder="예: '재테크', '사이드 허슬'"
          className="w-full p-2 bg-gray-50 rounded-md text-gray-700 border border-gray-300 focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      {/* 프롬프트 설정 */}
      <div className="bg-white rounded-xl p-6 border border-gray-300">
        <h2 className="text-xl font-bold text-cyan-600 mb-4">3. AI 프롬프트 설정</h2>
        <div className="space-y-4">
          {getPrompt('youtube-comment') && (
            <PromptEditor
              prompt={getPrompt('youtube-comment')!}
              value={getPrompt('youtube-comment')!.template}
              onChange={(value) => updatePrompt('youtube-comment', value)}
              onReset={() => resetPrompt('youtube-comment')}
            />
          )}
          
          {getPrompt('youtube-description') && (
            <PromptEditor
              prompt={getPrompt('youtube-description')!}
              value={getPrompt('youtube-description')!.template}
              onChange={(value) => updatePrompt('youtube-description', value)}
              onReset={() => resetPrompt('youtube-description')}
            />
          )}
        </div>
      </div>
    </BaseAutomationPanel>
  );
};

export default YouTubeDashboard;