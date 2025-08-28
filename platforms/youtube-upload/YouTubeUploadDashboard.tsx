import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { AutomationConfig, UploadedImage } from '../../types';
import { useLogger, useAutomation } from '../../shared/hooks';
import AutomationControls from '../../shared/components/common/AutomationControls';
import LogDisplay from '../../shared/components/common/LogDisplay';

interface YouTubeUploadDashboardProps {
  config: AutomationConfig;
  onBack: () => void;
  hideBackButton?: boolean;
}

const YouTubeUploadDashboard: React.FC<YouTubeUploadDashboardProps> = ({ 
  config, 
  onBack, 
  hideBackButton 
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [slideDuration, setSlideDuration] = useState('1.5');
  const [resolution, setResolution] = useState('1280x720');
  const [animationType, setAnimationType] = useState('cut');
  const [isCreatingVideo, setIsCreatingVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isVideoGenerated, setIsVideoGenerated] = useState(false);
  const { logs, addLog, clearLogs } = useLogger();
  const { isAutomating, startAutomation, stopAutomation, isRunning } = useAutomation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialized(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const runAutomation = async () => {
    addLog('YouTube 업로드 자동화를 준비 중입니다...', 'info');
    addLog('이 기능은 곧 구현될 예정입니다.', 'info');
  };

  const handleStartAutomation = () => {
    clearLogs();
    startAutomation(runAutomation);
  };

  const handleStopAutomation = () => {
    stopAutomation();
    addLog('자동화를 중지하는 중...', 'error');
  };

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
    addLog(`${files.length}개의 이미지가 추가되었습니다.`, 'info');
  };

  const handleDeleteImage = (id: string) => {
    const deletedImage = images.find(img => img.id === id);
    if (deletedImage) {
      addLog(`'${deletedImage.file.name}' 이미지를 삭제했습니다.`, 'info');
      setImages(prev => prev.filter(img => img.id !== id));
    }
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    setImages(newImages);
  };

  const handleCreateVideo = async () => {
    if (images.length === 0) {
      addLog('영상을 만들려면 최소 1개 이상의 이미지가 필요합니다.', 'error');
      return;
    }

    if (!canvasRef.current) {
      addLog('캔버스를 찾을 수 없습니다.', 'error');
      return;
    }

    setIsCreatingVideo(true);
    setIsVideoGenerated(false);
    addLog('이미지 슬라이드쇼 영상 생성을 시작합니다...', 'info');
    addLog(`${images.length}개의 이미지로 영상을 만들고 있습니다.`, 'info');
    addLog(`각 이미지당 ${slideDuration}초 재생됩니다.`, 'info');
    
    try {
      const duration = parseFloat(slideDuration);
      const fps = 30;
      const [baseWidth, baseHeight] = resolution.split('x').map(Number);
      
      // 고해상도 렌더링을 위해 2배 크기로 캔버스 설정
      const pixelRatio = 2;
      const width = baseWidth * pixelRatio;
      const height = baseHeight * pixelRatio;
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context를 가져올 수 없습니다.');
      
      // 물리적 캔버스 크기는 고해상도로
      canvas.width = width;
      canvas.height = height;
      
      // CSS 표시 크기는 원래 크기로 (선택사항, 숨겨진 캔버스라 불필요)
      // canvas.style.width = baseWidth + 'px';
      // canvas.style.height = baseHeight + 'px';
      
      // 고해상도 컨텍스트 스케일링
      ctx.scale(pixelRatio, pixelRatio);
      
      const stream = canvas.captureStream(fps);
      const recordedChunks: Blob[] = [];
      
      // MP4 지원 확인 후 최적의 포맷 선택
      let mimeType;
      if (MediaRecorder.isTypeSupported('video/mp4;codecs=h264')) {
        mimeType = 'video/mp4;codecs=h264';
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
      } else {
        mimeType = 'video/webm;codecs=vp9';
      }
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const mimeTypeForBlob = mimeType.includes('mp4') ? 'video/mp4' : 'video/webm';
        const blob = new Blob(recordedChunks, { type: mimeTypeForBlob });
        const url = URL.createObjectURL(blob);
        
        setVideoUrl(url);
        setIsVideoGenerated(true);
        addLog('영상 생성이 완료되었습니다!', 'success');
        addLog(`총 재생시간: ${(images.length * duration).toFixed(1)}초`, 'success');
        addLog('3번 카드에서 영상을 미리볼 수 있습니다.', 'info');
      };
      
      mediaRecorder.start();
      
      // 각 이미지를 지정된 시간만큼 표시
      for (let i = 0; i < images.length; i++) {
        addLog(`영상 생성 중... ${i + 1}/${images.length}`, 'generating');
        
        const currentImg = new Image();
        currentImg.src = images[i].dataUrl;
        await new Promise(resolve => currentImg.onload = resolve);
        
        // 고해상도 렌더링을 위한 설정
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // 이미지 스케일링 계산
        const scaleX = baseWidth / currentImg.width;
        const scaleY = baseHeight / currentImg.height;
        const scale = Math.max(scaleX, scaleY);
        const newWidth = currentImg.width * scale;
        const newHeight = currentImg.height * scale;
        const x = (baseWidth - newWidth) / 2;
        const y = (baseHeight - newHeight) / 2;

        if (animationType === 'cut') {
          // 딱딱 끊어져서 나오기 (기존 방식)
          ctx.drawImage(currentImg, x, y, newWidth, newHeight);
          await new Promise(resolve => setTimeout(resolve, duration * 1000));
          
        } else if (animationType === 'slide') {
          // 밀어내는 애니메이션
          const nextImg = i + 1 < images.length ? new Image() : null;
          if (nextImg && i + 1 < images.length) {
            nextImg.src = images[i + 1].dataUrl;
            await new Promise(resolve => nextImg.onload = resolve);
          }
          
          // 현재 이미지를 일정 시간 정적으로 표시
          const staticTime = duration * 0.7; // 70%는 정적, 30%는 애니메이션
          const animationTime = duration * 0.3;
          
          ctx.drawImage(currentImg, x, y, newWidth, newHeight);
          await new Promise(resolve => setTimeout(resolve, staticTime * 1000));
          
          // 마지막 이미지가 아니면 슬라이드 애니메이션 실행
          if (nextImg && i + 1 < images.length) {
            const nextScale = Math.max(baseWidth / nextImg.width, baseHeight / nextImg.height);
            const nextNewWidth = nextImg.width * nextScale;
            const nextNewHeight = nextImg.height * nextScale;
            const nextX = (baseWidth - nextNewWidth) / 2;
            const nextY = (baseHeight - nextNewHeight) / 2;
            
            // 애니메이션 프레임 수
            const animationFrames = Math.floor(animationTime * fps);
            const frameDelay = (animationTime * 1000) / animationFrames;
            
            for (let frame = 0; frame <= animationFrames; frame++) {
              const progress = frame / animationFrames;
              
              // 현재 이미지는 왼쪽으로 이동
              const currentOffsetX = -baseWidth * progress;
              // 다음 이미지는 오른쪽에서 들어옴
              const nextOffsetX = baseWidth * (1 - progress);
              
              // 캔버스 지우기
              ctx.clearRect(0, 0, baseWidth, baseHeight);
              
              // 현재 이미지 그리기 (왼쪽으로 이동)
              ctx.drawImage(currentImg, x + currentOffsetX, y, newWidth, newHeight);
              
              // 다음 이미지 그리기 (오른쪽에서 들어옴)
              ctx.drawImage(nextImg, nextX + nextOffsetX, nextY, nextNewWidth, nextNewHeight);
              
              if (frame < animationFrames) {
                await new Promise(resolve => setTimeout(resolve, frameDelay));
              }
            }
          } else {
            // 마지막 이미지는 추가 시간만 기다림
            await new Promise(resolve => setTimeout(resolve, animationTime * 1000));
          }
        }
      }
      
      mediaRecorder.stop();
      
    } catch (error) {
      console.error('영상 생성 오류:', error);
      addLog('영상 생성 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsCreatingVideo(false);
    }
  };

  const steps = [
    {
      id: 'logs',
      title: '실시간 로그',
      content: (
        <div className="space-y-4">
          <LogDisplay logs={logs} />
          <div className="text-center py-4">
            <p className="text-sm text-gray-600">
              자동화 진행 상황이 여기에 표시됩니다.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'image-selection',
      title: '이미지를 다중 선택하세요',
      content: (
        <div className="space-y-4">
          {/* 이미지 업로드 버튼 */}
          <div>
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
              className="w-full px-4 py-2 bg-cyan-600 text-white font-semibold rounded-md hover:bg-cyan-700 transition-colors"
            >
              이미지 업로드
            </button>
          </div>

          {/* 이미지 썸네일 리스트 */}
          {images.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">선택된 이미지 ({images.length}개)</h4>
              <div className="space-y-2">
                {images.map((image, index) => (
                  <div 
                    key={image.id} 
                    className="flex items-center space-x-3 p-2 bg-gray-50 rounded border cursor-move"
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('text/plain', index.toString())}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                      moveImage(fromIndex, index);
                    }}
                  >
                    <div className="w-8 h-8 bg-cyan-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <img 
                      src={image.dataUrl} 
                      alt="" 
                      className="w-16 h-16 object-cover rounded" 
                    />
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 truncate">
                        {image.file.name.length > 5 ? image.file.name.substring(0, 5) + '...' : image.file.name}
                      </p>
                    </div>
                    <button 
                      onClick={() => handleDeleteImage(image.id)} 
                      className="text-red-500 hover:text-red-700 text-lg font-bold"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 해상도 설정 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              해상도 설정
            </label>
            <select
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              className="w-full p-2 bg-gray-50 rounded-md text-gray-700 border border-gray-300 focus:ring-2 focus:ring-cyan-500"
            >
              <option value="1280x720">1280×720 (가로형 HD)</option>
              <option value="720x1280">720×1280 (세로형 HD)</option>
              <option value="1080x1080">1080×1080 (정사각형)</option>
            </select>
          </div>

          {/* 애니메이션 타입 설정 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              전환 애니메이션
            </label>
            <select
              value={animationType}
              onChange={(e) => setAnimationType(e.target.value)}
              className="w-full p-2 bg-gray-50 rounded-md text-gray-700 border border-gray-300 focus:ring-2 focus:ring-cyan-500"
            >
              <option value="cut">딱딱 끊어져서 나오기</option>
              <option value="slide">밀어내는 애니메이션</option>
            </select>
          </div>

          {/* 슬라이드 지속시간 설정 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              각 이미지는 몇초로 하시겠어요?
            </label>
            <input
              type="number"
              value={slideDuration}
              onChange={(e) => setSlideDuration(e.target.value)}
              step="0.1"
              min="0.1"
              max="10"
              className="w-full p-2 bg-gray-50 rounded-md text-gray-700 border border-gray-300 focus:ring-2 focus:ring-cyan-500"
              placeholder="1.5"
            />
            <p className="text-xs text-gray-500 mt-1">
              총 영상 길이: {images.length > 0 ? (images.length * parseFloat(slideDuration || '1.5')).toFixed(1) : '0'}초
              {animationType === 'slide' && ' (전환 애니메이션 포함)'}
            </p>
          </div>

          {/* 영상 만들기 버튼 */}
          <button
            onClick={handleCreateVideo}
            disabled={images.length === 0 || isCreatingVideo}
            className="w-full px-4 py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isCreatingVideo ? '영상 만드는 중...' : '이 이미지들로 영상 만들기'}
          </button>
        </div>
      )
    },
    {
      id: 'video-preview',
      title: '영상 미리보기',
      content: (
        <div className="space-y-4">
          {isVideoGenerated && videoUrl ? (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">생성된 영상</h4>
                <video
                  controls
                  className="w-full rounded-md border border-gray-300"
                  style={{ maxHeight: '300px' }}
                >
                  <source src={videoUrl} type="video/mp4" />
                  <source src={videoUrl} type="video/webm" />
                  브라우저가 비디오를 지원하지 않습니다.
                </video>
              </div>
              
              <div className="flex space-x-2">
                <a
                  href={videoUrl}
                  download={`slideshow_${Date.now()}.mp4`}
                  className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors"
                >
                  📥 영상 다운로드
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(videoUrl);
                    addLog('영상 URL이 클립보드에 복사되었습니다.', 'success');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors"
                >
                  🔗 URL 복사
                </button>
              </div>
              
              <div className="bg-gray-50 p-3 rounded border">
                <h5 className="text-sm font-medium text-gray-700 mb-1">영상 정보</h5>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>해상도: {resolution} {resolution === '1280x720' ? '(가로형 HD)' : resolution === '720x1280' ? '(세로형 HD)' : '(정사각형)'}</div>
                  <div>프레임율: 30 FPS</div>
                  <div>총 재생시간: {(images.length * parseFloat(slideDuration || '1.5')).toFixed(1)}초</div>
                  <div>이미지 수: {images.length}개</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">
                <svg className="w-16 h-16 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M15 8v8H5V8h10m1-2H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1V7a1 1 0 00-1-1zm4-2v14a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
                <p>영상이 생성되지 않았습니다.</p>
                <p className="text-sm mt-1">2번 카드에서 이미지를 선택하고 영상을 만들어보세요.</p>
              </div>
              
              {isCreatingVideo && (
                <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                  <div className="animate-spin w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full mr-2"></div>
                  영상 생성 중...
                </div>
              )}
            </div>
          )}
        </div>
      )
    },
    {
      id: 'threads-upload',
      title: 'Threads 업로드',
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Threads 계정
            </label>
            <input
              type="text"
              placeholder="Threads 계정을 입력하세요"
              className="w-full p-2 bg-gray-50 rounded-md text-gray-700 border border-gray-300 focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              게시물 내용
            </label>
            <textarea
              rows={4}
              placeholder="Threads 게시물 내용을 입력하세요"
              className="w-full p-2 bg-gray-50 rounded-md text-gray-700 border border-gray-300 focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              첨부 파일
            </label>
            <input
              type="file"
              accept="image/*,video/*"
              className="w-full p-2 bg-gray-50 rounded-md text-gray-700 border border-gray-300 focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div className="mt-4">
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
              <div className="w-2 h-2 rounded-full mr-2 bg-purple-400" />
              대기 중
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'twitter-upload',
      title: 'Twitter 업로드',
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Twitter 계정
            </label>
            <input
              type="text"
              placeholder="Twitter 계정을 입력하세요"
              className="w-full p-2 bg-gray-50 rounded-md text-gray-700 border border-gray-300 focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              트윗 내용
            </label>
            <textarea
              rows={4}
              placeholder="트윗 내용을 입력하세요"
              className="w-full p-2 bg-gray-50 rounded-md text-gray-700 border border-gray-300 focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              미디어 첨부
            </label>
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              className="w-full p-2 bg-gray-50 rounded-md text-gray-700 border border-gray-300 focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div className="mt-4">
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-sky-100 text-sky-800">
              <div className="w-2 h-2 rounded-full mr-2 bg-sky-400" />
              대기 중
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'automation-control',
      title: '자동화 제어',
      content: (
        <div className="space-y-4">
          <AutomationControls 
            isAutomating={isAutomating}
            onStart={handleStartAutomation}
            onStop={handleStopAutomation}
          />
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">업로드 순서</h4>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-red-400 rounded-full mr-2"></div>
                1. YouTube 업로드
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                2. Instagram 업로드
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-purple-400 rounded-full mr-2"></div>
                3. Threads 업로드
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-sky-400 rounded-full mr-2"></div>
                4. Twitter 업로드
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <>
      {/* 숨겨진 캔버스 - 영상 생성용 */}
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
      />
      
      <div className="w-full bg-white">
        <div className="overflow-x-auto pb-6 bg-white">
          <div className="flex space-x-6 min-w-max pl-6 pr-32 bg-white">
            {steps.map((step, index) => (
              <div key={step.id} className="bg-white rounded-xl border border-gray-200 p-6 w-96 flex-shrink-0 hover:shadow-lg transition-shadow min-h-[650px]">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-cyan-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                    {index + 1}
                  </div>
                  <h3 className="text-lg font-bold text-black">{step.title}</h3>
                </div>
                <div className="h-full">
                  {step.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default YouTubeUploadDashboard;