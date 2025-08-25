import React, { useState, useRef, ChangeEvent } from 'react';
import { AutomationConfig, UploadedImage } from '../types';
import { generateText } from '../services/geminiService';
import BaseAutomationPanel from './common/BaseAutomationPanel';
import ApiKeyInput from './common/ApiKeyInput';
import PromptEditor from './common/PromptEditor';
import { useApiKeys, usePrompts } from '../hooks';

interface TwitterThreadsDashboardProps {
  config: AutomationConfig;
  onBack: () => void;
  hideBackButton?: boolean;
}

const TwitterThreadsDashboard: React.FC<TwitterThreadsDashboardProps> = ({ config, onBack, hideBackButton }) => {
  const { getApiKey, setApiKey, validateKeys } = useApiKeys(['twitter', 'threads']);
  const { getPrompt, updatePrompt, resetPrompt, interpolatePrompt } = usePrompts('twitter');
  const [images, setImages] = useState<UploadedImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage: UploadedImage = {
          id: `${file.name}-${new Date().getTime()}`,
          file: file,
          dataUrl: e.target?.result as string,
        };
        setImages(prev => [...prev, newImage]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDeleteImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const runAutomation = async (addLog: Function, isRunning: () => boolean) => {
    addLog('자동화를 시작합니다...', 'info');

    if (!validateKeys(['twitter', 'threads'])) {
      addLog('Twitter와 Threads API 키를 모두 입력해야 합니다.', 'error');
      return;
    }

    if (images.length === 0) {
      addLog('자동 포스팅할 이미지가 없습니다. 이미지를 추가해주세요.', 'error');
      return;
    }

    for (const image of images) {
      if (!isRunning()) break;
      
      addLog(`'${image.file.name}' 이미지에 대한 게시물 생성 중...`, 'info');
      
      addLog('AI를 호출하여 컨텐츠를 생성합니다...', 'generating');
      const finalPrompt = interpolatePrompt('twitter-post', {
        IMAGE_NAME: image.file.name,
        TOPIC: 'general content'
      });

      await new Promise(res => setTimeout(res, 1500));
      const generatedPost = await generateText(finalPrompt);
      addLog(`AI가 생성한 게시물: "${generatedPost.substring(0, 60)}..."`, 'success');

      // Post to Twitter (Simulated)
      addLog(`Twitter에 '${image.file.name}' 이미지와 함께 트윗을 게시하는 중...`, 'generating');
      await new Promise(res => setTimeout(res, 1000));
      const twitterPostId = `18${Math.floor(1000000000000000 + Math.random() * 9000000000000000)}`;
      addLog(`트윗 게시 완료. 확인: https://x.com/user/status/${twitterPostId}`, 'success');

      if (!isRunning()) break;

      // Post to Threads (Simulated)
      addLog(`Threads에 '${image.file.name}' 이미지와 함께 게시물을 발행하는 중...`, 'generating');
      await new Promise(res => setTimeout(res, 1200));
      const threadsPostId = `C${Math.random().toString(36).substring(2, 15)}`;
      addLog(`Threads 게시 완료. 확인: https://www.threads.net/t/${threadsPostId}`, 'success');
    }
    
    if (isRunning()) {
      addLog('모든 이미지에 대한 자동 포스팅이 완료되었습니다.', 'info');
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
        <div className="space-y-4">
          <ApiKeyInput 
            label="Twitter API 키"
            value={getApiKey('twitter')}
            onChange={(value) => setApiKey('twitter', value)}
            id="twitter-api-key"
          />
          <ApiKeyInput 
            label="Threads API 키"
            value={getApiKey('threads')}
            onChange={(value) => setApiKey('threads', value)}
            id="threads-api-key"
          />
        </div>
      </div>

      {/* 이미지 관리 */}
      <div className="bg-white rounded-xl p-6 border border-gray-300">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-cyan-600">2. 이미지 관리</h2>
          <span className="text-sm text-gray-600">{images.length}개 이미지</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mb-4 max-h-48 overflow-y-auto pr-2">
          {images.map(image => (
            <div key={image.id} className="relative group aspect-square">
              <img src={image.dataUrl} alt={image.file.name} className="w-full h-full object-cover rounded-md" />
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleDeleteImage(image.id)} className="text-white text-3xl font-bold">&times;</button>
              </div>
            </div>
          ))}
        </div>
        <input 
          type="file" 
          multiple 
          accept="image/*" 
          ref={fileInputRef} 
          onChange={handleImageUpload} 
          className="hidden" 
        />
        <button 
          onClick={() => fileInputRef.current?.click()} 
          className="w-full px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-md hover:bg-gray-200 transition-colors border border-gray-300"
        >
          이미지 업로드
        </button>
      </div>

      {/* 프롬프트 설정 */}
      <div className="bg-white rounded-xl p-6 border border-gray-300">
        <h2 className="text-xl font-bold text-cyan-600 mb-4">3. AI 프롬프트 설정</h2>
        <div className="space-y-4">
          {getPrompt('twitter-post') && (
            <PromptEditor
              prompt={getPrompt('twitter-post')!}
              value={getPrompt('twitter-post')!.template}
              onChange={(value) => updatePrompt('twitter-post', value)}
              onReset={() => resetPrompt('twitter-post')}
            />
          )}
          
          {getPrompt('twitter-threads') && (
            <PromptEditor
              prompt={getPrompt('twitter-threads')!}
              value={getPrompt('twitter-threads')!.template}
              onChange={(value) => updatePrompt('twitter-threads', value)}
              onReset={() => resetPrompt('twitter-threads')}
            />
          )}
        </div>
      </div>
    </BaseAutomationPanel>
  );
};

export default TwitterThreadsDashboard;