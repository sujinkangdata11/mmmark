import React, { useState, useRef, ChangeEvent } from 'react';
import { AutomationConfig, UploadedImage } from '../types';
import { generateText } from '../services/geminiService';
import PromptEditor from './common/PromptEditor';
import AutomationControls from './common/AutomationControls';
import LogDisplay from './common/LogDisplay';
import { usePrompts, useLogger, useAutomation } from '../hooks';

interface TwitterThreadsDashboardProps {
  config: AutomationConfig;
  onBack: () => void;
  hideBackButton?: boolean;
}

const TwitterThreadsDashboard: React.FC<TwitterThreadsDashboardProps> = ({ config }) => {
  const { getPrompt, updatePrompt, resetPrompt, interpolatePrompt } = usePrompts('twitter');
  const { logs, addLog, clearLogs } = useLogger();
  const { isAutomating, startAutomation, stopAutomation, isRunning } = useAutomation();
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

  const runAutomation = async () => {
    addLog('자동화를 시작합니다...', 'info');

    // API 키 검증은 사이드바에서 관리되므로 여기서는 제거
    // if (!validateKeys(['twitter', 'threads'])) {
    //   addLog('Twitter와 Threads API 키를 모두 입력해야 합니다.', 'error');
    //   return;
    // }

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

  const steps = [
    {
      id: 'image-setup',
      title: '이미지 관리',
      content: (
        <div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-600">{images.length}개 이미지</span>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4 max-h-48 overflow-y-auto pr-2">
            {images.map(image => (
              <div key={image.id} className="relative group aspect-square">
                <img src={image.dataUrl} alt={image.file.name} className="w-full h-full object-cover rounded-md" />
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleDeleteImage(image.id)} className="text-white text-2xl font-bold">&times;</button>
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
          <div className="text-sm text-gray-600 mt-3">
            업로드한 이미지가 Twitter와 Threads에 자동으로 게시됩니다.
          </div>
        </div>
      )
    },
    {
      id: 'prompt-setup',
      title: 'AI 프롬프트 설정',
      content: (
        <div className="space-y-4">
          {getPrompt('twitter-post') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Twitter 포스트 프롬프트</label>
              <PromptEditor
                prompt={getPrompt('twitter-post')!}
                value={getPrompt('twitter-post')!.template}
                onChange={(value) => updatePrompt('twitter-post', value)}
                onReset={() => resetPrompt('twitter-post')}
              />
            </div>
          )}
          
          {getPrompt('twitter-threads') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Threads 포스트 프롬프트</label>
              <PromptEditor
                prompt={getPrompt('twitter-threads')!}
                value={getPrompt('twitter-threads')!.template}
                onChange={(value) => updatePrompt('twitter-threads', value)}
                onReset={() => resetPrompt('twitter-threads')}
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

export default TwitterThreadsDashboard;