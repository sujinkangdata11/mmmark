import React, { useState, useEffect, useCallback } from 'react';
import { AutomationConfig, Memo } from '../types';
import StatusIndicator from './StatusIndicator';
import MemoLog from './MemoLog';
import PromptEditor from './common/PromptEditor';
import { generateText } from '../services/geminiService';
import BaseAutomationPanel from './common/BaseAutomationPanel';
import { usePrompts } from '../hooks';

interface DashboardProps {
  config: AutomationConfig;
  onBack: () => void;
  hideBackButton?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ config, onBack, hideBackButton }) => {
  const { getPrompt, updatePrompt, resetPrompt, interpolatePrompt } = usePrompts('general');
  const [isAiConnected, setIsAiConnected] = useState(false);
  const [memo, setMemo] = useState('');
  const [memos, setMemos] = useState<Memo[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setIsAiConnected(true), 1000);
    return () => clearTimeout(timer);
  }, []);
  
  const handleAddMemo = useCallback(() => {
    if (memo.trim() === '') return;
    const newMemo: Memo = {
      id: new Date().toISOString(),
      text: memo,
      timestamp: new Date().toLocaleString('ko-KR'),
    };
    setMemos(prevMemos => [newMemo, ...prevMemos]);
    setMemo('');
  }, [memo]);
  
  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedContent('');
    
    const finalPrompt = interpolatePrompt('content-generation', {
      REQUIREMENTS: config.defaultPrompt,
      AUDIENCE: 'general users',
      TONE: 'professional and engaging'
    });
    
    try {
      const result = await generateText(finalPrompt);
      setGeneratedContent(result);
    } catch (error) {
      setGeneratedContent("생성 중 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  const runAutomation = async (addLog: Function, isRunning: () => boolean) => {
    addLog('범용 자동화 기능은 아직 구현되지 않았습니다.', 'info');
    addLog('컨텐츠 생성 기능을 사용해보세요!', 'info');
  };

  return (
    <BaseAutomationPanel 
      config={config} 
      onBack={onBack} 
      hideBackButton={hideBackButton}
      onStartAutomation={runAutomation}
    >
      {/* AI 제어 및 컨텐츠 생성 */}
      <div className="bg-white rounded-xl p-6 border border-gray-300 flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-cyan-600">AI 제어</h2>
          <StatusIndicator isOnline={isAiConnected} text={isAiConnected ? "AI 연결됨" : "AI 연결 중..."} />
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-2 text-gray-800">기본 프롬프트</h3>
          <p className="bg-gray-50 p-4 rounded-md text-gray-600 text-sm border border-gray-300">{config.defaultPrompt}</p>
        </div>

        {/* 프롬프트 편집기 */}
        <div>
          <h3 className="text-lg font-semibold mb-2 text-gray-800">프롬프트 설정</h3>
          {getPrompt('content-generation') && (
            <PromptEditor
              prompt={getPrompt('content-generation')!}
              value={getPrompt('content-generation')!.template}
              onChange={(value) => updatePrompt('content-generation', value)}
              onReset={() => resetPrompt('content-generation')}
            />
          )}
        </div>
        
        <div className="flex-grow flex flex-col">
          <h3 className="text-lg font-semibold mb-2 text-gray-800">생성된 컨텐츠</h3>
          <div className="w-full h-40 p-3 bg-gray-50 rounded-md text-gray-700 border border-gray-300 overflow-y-auto flex-grow">
            {isGenerating ? <div className="text-gray-500">생성 중...</div> : (generatedContent || <div className="text-gray-500">컨텐츠 생성 버튼을 누르세요.</div>)}
          </div>
        </div>
        
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full mt-auto px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-cyan-500 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          {isGenerating ? '생성 중...' : '컨텐츠 생성'}
        </button>
      </div>

      {/* 메모 및 기록 */}
      <div className="bg-white rounded-xl p-6 border border-gray-300 flex flex-col space-y-6">
        <h2 className="text-xl font-bold text-cyan-600">메모 및 기록</h2>
        <div>
          <h3 className="text-lg font-semibold mb-2 text-gray-800">메모 작성</h3>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="작업에 대한 메모를 여기에 작성하세요..."
            className="w-full h-24 p-3 bg-gray-50 rounded-md text-gray-700 border border-gray-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
          />
          <button
            onClick={handleAddMemo}
            className="mt-3 w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-black bg-cyan-400 hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-cyan-500 transition-colors"
          >
            메모 기록 추가
          </button>
        </div>
        <div className="flex-grow min-h-[300px]">
          <MemoLog memos={memos} />
        </div>
      </div>
    </BaseAutomationPanel>
  );
};

export default Dashboard;